"""Record public authored routines using pinned SILMA and align decoded MP3 words.
Standalone Arabic duas remain Arabic in both UI languages. No user's voice/data.
"""
import argparse, gc, hashlib, json, os, pathlib, re, subprocess, sys, unicodedata
from importlib.resources import files
p=argparse.ArgumentParser();p.add_argument('--part',type=int,default=0);p.add_argument('--parts',type=int,default=12);p.add_argument('--output',required=True);a=p.parse_args()
ROOT=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((ROOT/'audio/islamic-scripts-v1.json').read_text())
items=[r for i,r in enumerate(manifest['items']) if i%a.parts==a.part]
out=pathlib.Path(a.output);out.mkdir(parents=True,exist_ok=True)
os.environ.update(HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',HF_HUB_DISABLE_TELEMETRY='1',ORT_DISABLE_TELEMETRY='1')
sys.path.insert(0,str(ROOT.parent/'screen-to-move/tools'))
from silma_phonics_engine import load_engine
import numpy as np,soundfile as sf,torch,torchaudio
from uroman import Uroman
hub=pathlib.Path(os.environ['HF_HOME'])/'hub'
model=hub/'models--silma-ai--silma-tts/snapshots'/manifest['model_revision']/'model.pt'
vocab=model.parent/'vocab.txt'
vocoder=next((hub/'models--charactr--vocos-mel-24khz/snapshots').glob('*'))
flags=pathlib.Path('/proc/cpuinfo').read_text();precision='bf16' if 'avx512_bf16' in flags or 'amx_bf16' in flags else 'fp32'
engine=load_engine(model,vocab,vocoder,threads=4,precision=precision)
ref=str(files('silma_tts').joinpath('infer/ref_audio_samples/ar.ref.24k.wav'))
ref_text='ويدقق النظر في القرآن الكريم وسائر الكتب السماوية ويتبع مسالك الرسل العظام عليهم الصلاة والسلام.'
for row in items:
 target=out/row['path'];target.parent.mkdir(parents=True,exist_ok=True)
 wavfile=out/(row['id']+'.wav')
 print('Recording',row['id'],precision,flush=True)
 wav,sr,_=engine.infer(ref_file=ref,ref_text=ref_text,gen_text=row['text'],file_wave=str(wavfile),seed=360,speed=.90,nfe_step=32,force_tashkeel=False,normalize_numbers=False)
 assert sr==24000 and np.isfinite(wav).all() and .15<len(wav)/sr<70 and np.max(np.abs(wav))>.005,row['id']
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wavfile),'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','64k','-write_xing','1','-id3v2_version','0',str(target)],check=True)
 wavfile.unlink()
del engine;gc.collect()
bundle=torchaudio.pipelines.MMS_FA;acoustic=bundle.get_model().eval();tokenizer=bundle.get_tokenizer();aligner=bundle.get_aligner();roman=Uroman()
for row in items:
 target=out/row['path'];samples,sr=sf.read(target,dtype='float32')
 wave=torchaudio.functional.resample(torch.from_numpy(samples).unsqueeze(0),sr,bundle.sample_rate)
 words=row['text'].split();normalized=[];indices=[]
 for i,word in enumerate(words):
  simple=''.join(c for c in unicodedata.normalize('NFKD',word) if not unicodedata.combining(c))
  value=re.sub('[^a-z]','',roman.romanize_string(simple).lower())
  if value:indices.append(i);normalized.append(value)
 with torch.inference_mode():emission,_=acoustic(wave)
 spans=aligner(emission[0],tokenizer(normalized));ratio=wave.shape[1]/emission.shape[1]/bundle.sample_rate*1000
 cues=[];scores=[]
 for index,group in zip(indices,spans):
  assert group
  cues.append([index,round(group[0].start*ratio),round(group[-1].end*ratio)])
  scores.extend(float(t.score) for t in group)
 duration=round(len(samples)/sr*1000)
 assert len(cues)==len(indices) and all(0<=start<end<=duration for _,start,end in cues),row['id']
 row.update(cues=cues,duration_ms=duration,sha256=hashlib.sha256(target.read_bytes()).hexdigest(),timing_source='MMS_FA alignment of decoded MP3',alignment_score=round(float(np.mean(scores)),4),model_revision=manifest['model_revision'],precision=precision,auditory_review='pending')
 print('Aligned',row['id'],duration,row['alignment_score'],flush=True)
(out/('part-'+str(a.part)+'.json')).write_text(json.dumps(dict(items=items),ensure_ascii=False,indent=2)+'\n')
