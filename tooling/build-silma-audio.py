"""Build public Arabic scene narration with SILMA 1.0.5; no child data.
Run in a dedicated build environment with silma-tts, uroman, torch/torchaudio.
Voice uses the model publisher's bundled demonstration reference, never a user's voice.
MMS forced alignment provides measured word cues; no estimated equal-length cues.
"""
import argparse, ctypes, fcntl, gc, hashlib, json, os, pathlib, re, subprocess, time, unicodedata
from importlib.resources import files
# Synthesis uses already downloaded public model weights. No outbound connections.
os.environ['ORT_DISABLE_TELEMETRY']='1'  # Official ONNX process-lifetime opt-out, before CATT imports it.
os.environ['HF_HUB_OFFLINE']='1'
os.environ['TRANSFORMERS_OFFLINE']='1'
os.environ['HF_HUB_DISABLE_TELEMETRY']='1'
os.environ['DO_NOT_TRACK']='1'
import socket
_original_connect=socket.socket.connect
def local_connect(sock,address):
 if sock.family in (socket.AF_INET,socket.AF_INET6):raise RuntimeError('Network disabled for local scene synthesis')
 return _original_connect(sock,address)
socket.socket.connect=local_connect
import numpy as np
import soundfile as sf
import torch, torchaudio
# The authored Arabic already has tashkeel. Exclude its unused CATT/ONNX backend.
import sys, types
_unused_catt=types.ModuleType('catt_tashkeel')
class AuthoredTashkeelOnly:
 def __init__(self,*a,**kw):raise RuntimeError('Use authored tashkeel; neural diacritization is disabled')
_unused_catt.CATTEncoderOnly=AuthoredTashkeelOnly
sys.modules['catt_tashkeel']=_unused_catt
from silma_tts.api import SilmaTTS
assert 'onnxruntime' not in sys.modules, 'Unused telemetry-capable backend must not be imported'
from uroman import Uroman

parser=argparse.ArgumentParser();parser.add_argument('--cache',required=True);parser.add_argument('--model-cache',required=True);parser.add_argument('--limit',type=int,default=0);parser.add_argument('--part',type=int,default=0);parser.add_argument('--parts',type=int,default=1);parser.add_argument('--generate-only',action='store_true');parser.add_argument('--align-only',action='store_true');parser.add_argument('--only',help='One manifest path to rebuild');parser.add_argument('--exclude',action='append',default=[],help='Skip a manifest audio path in partitioned builds')
parser.add_argument('--memory-map-weights',action='store_true');parser.add_argument('--precision',choices=['bf16','fp32'],default='bf16');parser.add_argument('--root',required=True);parser.add_argument('--manifest',default='data/story-expansion-audio.json');parser.add_argument('--cues',default='data/silma-read-along.json');parser.add_argument('--report',default='data/silma-build-report.json')
args=parser.parse_args();ROOT=pathlib.Path(args.root).resolve();cache=pathlib.Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
torch.set_num_threads(2)
ref=str(files('silma_tts').joinpath('infer/ref_audio_samples/ar.ref.24k.wav'))
ref_text='ويدقق النظر في القرآن الكريم وسائر الكتب السماوية ويتبع مسالك الرسل العظام عليهم الصلاة والسلام.'
# A targeted retry can reuse only an exact synthesis-cache match.
if args.generate_only and args.only:
 manifest=json.loads((ROOT/args.manifest).read_text())
 matched=next((item for item in manifest['items'] if item['path']==args.only and item['language']=='ar' and item.get('engine','silma')=='silma'),None)
 assert matched,'Unknown Arabic audio path'
 cache_key=hashlib.sha256((('silma-1.0.5|'+args.precision+'|16|.95|360|')+matched['text']).encode()).hexdigest()
 cached=cache/(cache_key+'.wav')
 if cached.exists():
  target=ROOT/matched['path'];target.parent.mkdir(parents=True,exist_ok=True)
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(cached),'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','48k','-write_xing','1','-id3v2_version','0',str(target)],check=True)
  print('Reused exact synthesis cache',matched['path'],flush=True);raise SystemExit(0)
if not args.align_only:
 with (cache/'model-load.lock').open('w') as lock:
  fcntl.flock(lock,fcntl.LOCK_EX)
  original_load=torch.load
  def memory_mapped_load(*a,**kw):
   if args.memory_map_weights and a and isinstance(a[0],(str,pathlib.Path)) and str(a[0]).endswith('/model.pt'):
    with open(a[0],'rb') as checkpoint_file:
     if checkpoint_file.read(2)==b'PK':kw.setdefault('mmap',True)
   return original_load(*a,**kw)
  torch.load=memory_mapped_load
  try:engine=SilmaTTS(device='cpu',enable_normalizer=False,force_tashkeel=False,hf_cache_dir=args.model_cache)
  finally:torch.load=original_load
  # BF16 is the default; FP32 can be selected for CPU builds.
  original_sample=engine.ema_model.sample
  def bounded_sample(*a,**kw):
   with torch.autocast('cpu',dtype=torch.bfloat16,enabled=args.precision=='bf16'):
    return original_sample(*a,**kw)
  engine.ema_model.sample=bounded_sample
  gc.collect();ctypes.CDLL(None).malloc_trim(0)
  fcntl.flock(lock,fcntl.LOCK_UN)
items=[i for i in json.loads((ROOT/args.manifest).read_text())['items'] if i['language']=='ar' and i.get('engine','silma')=='silma']
if args.only:items=[item for item in items if item['path']==args.only];assert items,'Unknown audio path'
if args.exclude:items=[item for item in items if item['path'] not in args.exclude]
if args.limit:items=items[:args.limit]
if args.generate_only:items=[item for n,item in enumerate(items) if n%args.parts==args.part]
outputs=[]
for n,item in enumerate(items):
 key=hashlib.sha256((('silma-1.0.5|'+args.precision+'|16|.95|360|')+item['text']).encode()).hexdigest();wavfile=cache/(key+'.wav')
 if not args.align_only and not wavfile.exists():
  start=time.time();print('SILMA generating',n+1,len(items),item['path'],flush=True)
  temporary_wav=cache/(key+'.'+str(os.getpid())+'.building.wav')
  wav,sr,_=engine.infer(ref_file=ref,ref_text=ref_text,gen_text=item['text'],file_wave=str(temporary_wav),seed=360,speed=.95,nfe_step=16,force_tashkeel=False,normalize_numbers=False)
  # Very short prompts may be shorter than one second. They are valid
  # child-facing audio; pad with silence to preserve the review format.
  assert sr==24000 and np.isfinite(wav).all() and len(wav)/sr>0.16 and len(wav)/sr<40,item['path']
  if len(wav)/sr<1.10:
   wav=np.pad(wav,(0,max(0,int(1.10*sr)-len(wav))),'constant')
   sf.write(str(temporary_wav),wav,sr)
  os.replace(temporary_wav,wavfile)
  print('Generated in',round(time.time()-start,1),'seconds',flush=True)
 target=ROOT/item['path'];target.parent.mkdir(parents=True,exist_ok=True)
 if not args.align_only:subprocess.run(['ffmpeg','-v','error','-y','-i',str(wavfile),'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','48k','-write_xing','1','-id3v2_version','0',str(target)],check=True)
 outputs.append((item,target))
if args.generate_only:
 print('Completed generation part',args.part,len(outputs),flush=True);raise SystemExit(0)
# Release all synthesis allocations before alignment.
if not args.align_only:del engine
gc.collect();ctypes.CDLL(None).malloc_trim(0)
alignment_lock=(cache/'alignment.lock').open('w')
fcntl.flock(alignment_lock,fcntl.LOCK_EX)
# Repeated finalizers reuse a verified full alignment instead of racing writes.
prior_path=ROOT/args.cues
if prior_path.exists():
 prior=json.loads(prior_path.read_text()).get('items',{})
 if all(item['path'] in prior and prior[item['path']].get('text')==item['text'] and prior[item['path']].get('audio_sha256')==hashlib.sha256(target.read_bytes()).hexdigest() for item,target in outputs):
  print('Reused verified acoustic alignment',len(outputs),'clips',flush=True);raise SystemExit(0)
bundle=torchaudio.pipelines.MMS_FA;acoustic=bundle.get_model();acoustic.eval();tokenizer=bundle.get_tokenizer();aligner=bundle.get_aligner();roman=Uroman();records={};metrics=[]
for n,(item,target) in enumerate(outputs):
 samples,sr=sf.read(target,dtype='float32');wave=torch.from_numpy(samples).unsqueeze(0)
 wave=torchaudio.functional.resample(wave,sr,bundle.sample_rate)
 words=item['text'].split();indices=[];normalized=[]
 for index,word in enumerate(words):
  simple=''.join(c for c in unicodedata.normalize('NFKD',word) if not unicodedata.combining(c))
  value=re.sub('[^a-z]','',roman.romanize_string(simple).lower())
  if value:indices.append(index);normalized.append(value)
 with torch.inference_mode():emission,_=acoustic(wave)
 spans=aligner(emission[0],tokenizer(normalized));ratio=wave.shape[1]/emission.shape[1]/bundle.sample_rate*1000
 cues=[];scores=[]
 for index,group in zip(indices,spans):
  assert group
  cues.append([index,round(group[0].start*ratio),round(group[-1].end*ratio)])
  scores.extend(float(t.score) for t in group)
 duration=round(len(samples)/sr*1000)
 assert len(cues)==len(indices) and all(0<=a<b<=duration for _,a,b in cues),item['path']
 confidence=float(np.mean(scores));metrics.append({'path':item['path'],'mean_alignment_score':round(confidence,4),'duration_ms':duration})
 records[item['path']]={'text':item['text'],'language':'ar','duration':duration,'cues':cues,'timing_source':'MMS_FA acoustic forced alignment of actual MP3','audio_sha256':hashlib.sha256(target.read_bytes()).hexdigest()}
 print('Aligned',n+1,len(outputs),item['path'],round(confidence,3),flush=True)
(ROOT/args.cues).write_text(json.dumps({'schema_version':1,'items':records},ensure_ascii=False,separators=(',',':'))+'\n')
(ROOT/args.report).write_text(json.dumps({'engine':'silma-tts','package_version':'1.0.5','model':'silma-ai/silma-tts','model_revision':(pathlib.Path(args.model_cache)/'models--silma-ai--silma-tts/refs/main').read_text().strip(),'network':'Local cached model weights; outbound Python connections disabled; ORT process-lifetime opt-out before imports','diacritization':'Authored tashkeel; unused CATT/ONNX backend excluded from process','reference':'publisher bundled ar.ref.24k.wav','seed':360,'steps':16,'precision':'CPU '+args.precision.upper()+', Float32 waveform','speed':.95,'alignment':'torchaudio MMS_FA + uroman; scores are alignment confidence, not pronunciation accuracy','clips':metrics},ensure_ascii=False,indent=2)+'\n')
print('Completed',len(outputs),'SILMA Arabic clips',flush=True)
