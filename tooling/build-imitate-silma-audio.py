"""Resume the preserved bilingual SILMA checkpoint. Generate only missing files.
Use the publisher's bundled reference voice; synthesize locally with public weights.
"""
import argparse,json,pathlib,os,sys,types,hashlib,subprocess,time
os.environ['HF_HUB_DISABLE_TELEMETRY']='1';os.environ['DO_NOT_TRACK']='1';os.environ['ORT_DISABLE_TELEMETRY']='1'
a=argparse.ArgumentParser();a.add_argument('--root',required=True);a.add_argument('--model-dir',required=True);a.add_argument('--cache',required=True);a.add_argument('--only');a.add_argument('--reverse',action='store_true');a.add_argument('--report-tag');a.add_argument('--part',type=int,default=0);a.add_argument('--parts',type=int,default=1);a.add_argument('--limit',type=int,default=0);args=a.parse_args()
r=pathlib.Path(args.root);model=pathlib.Path(args.model_dir);cache=pathlib.Path(args.cache);cache.mkdir(parents=True,exist_ok=True)
# Authored prompts bypass unused normalization/diacritization backends.
class Disabled:
 def __init__(self,*a,**k):raise RuntimeError('Use authored text; automatic normalization is disabled')
for name in ['nemo_text_processing','nemo_text_processing.text_normalization','nemo_text_processing.text_normalization.normalize','catt_tashkeel']:
 m=types.ModuleType(name);m.Normalizer=m.CATTEncoderOnly=Disabled;sys.modules[name]=m
import numpy as np,soundfile as sf,torch
from importlib.resources import files
import silma_tts.api as api
api.cached_path=lambda uri,**kw:str(model/uri.rsplit('/',1)[-1])
original_load=torch.load
def mapped_load(*a,**kw):
 if a and str(a[0]).endswith('model.pt'):kw['mmap']=True
 return original_load(*a,**kw)
torch.load=mapped_load;torch.set_num_threads(2)
engine=api.SilmaTTS(device='cpu',enable_normalizer=False,force_tashkeel=False,vocoder_local_path=str(model/'vocos'))
original_sample=engine.ema_model.sample
def bf16(*a,**kw):
 with torch.autocast('cpu',dtype=torch.bfloat16):return original_sample(*a,**kw)
engine.ema_model.sample=bf16
ref=str(files('silma_tts').joinpath('infer/ref_audio_samples/ar.ref.24k.wav'));reftext='ويدقق النظر في القرآن الكريم وسائر الكتب السماوية ويتبع مسالك الرسل العظام عليهم الصلاة والسلام.'
p=r/'apps/1-4/imitate-one-step/tools/voice-sources';plan=json.loads((p/'recovery-plan.json').read_text());reportfile=p/('recovery-build-report-'+(args.report_tag or str(args.part))+'.json');report={}
for f in p.glob('recovery-build-report*.json'):report.update(json.loads(f.read_text()))
items=[i for i in plan['items'] if not (r/i['path']).exists() or i.get('regenerate') and i['path'] not in report]
if args.only:items=[i for i in items if i['path']==args.only]
items=[i for i in items if int(hashlib.sha256(i['path'].encode()).hexdigest(),16)%args.parts==args.part]
if args.reverse:items.reverse()
if args.limit:items=items[:args.limit]
for n,i in enumerate(items,1):
 start=time.time();text=i['text'];key=hashlib.sha256(('silma-1.0.5|bf16|16|.95|360|'+text).encode()).hexdigest();wavfile=cache/(key+'.wav');print('GENERATING',n,len(items),i['path'],flush=True)
 if not wavfile.exists():
  # Keep a deliberate short gap between the two hand commands.
  parts=text.split('. ') if '/experiences/002.' in i['path'] else [text]
  waves=[]
  for part in parts:
   wav,sr,_=engine.infer(ref_file=ref,ref_text=reftext,gen_text=part,seed=360,speed=.95,nfe_step=16,force_tashkeel=False,normalize_numbers=False,show_info=lambda *a:None)
   assert sr==24000 and np.isfinite(wav).all() and len(wav)>sr*.16
   waves.append(wav)
  if len(waves)>1:wav=np.concatenate([waves[0],np.zeros(int(.35*sr)),waves[1]])
  pending=wavfile.with_name(wavfile.stem+'.'+str(os.getpid())+'.building.wav');sf.write(str(pending),wav,sr);pending.replace(wavfile)
 dest=r/i['path'];dest.parent.mkdir(parents=True,exist_ok=True);temporary=dest.with_suffix('.building.mp3')
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wavfile),'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','48k','-write_xing','1','-id3v2_version','0',str(temporary)],check=True);temporary.replace(dest)
 report[i['path']]={'text':text,'language':i['language'],'engine':'SILMA','version':'1.0.5','revision':plan['revision'],'sha256':hashlib.sha256(dest.read_bytes()).hexdigest(),'seconds':round(time.time()-start,2),'reference':'publisher-bundled ar.ref.24k.wav','cache_key':key}
 reportfile.write_text(json.dumps(report,ensure_ascii=False,indent=2));print('DONE',round(time.time()-start,1),flush=True)
print('ALL MISSING FILES COMPLETE',flush=True)
