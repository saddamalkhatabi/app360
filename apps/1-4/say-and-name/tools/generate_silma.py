"""Record authored words with publisher's SILMA reference; no runtime TTS."""
import argparse,hashlib,json,os,sys,pathlib,subprocess,time
from importlib.resources import files
from prepare_silma import ROOT,load
p=argparse.ArgumentParser();p.add_argument('--part',type=int,default=0);p.add_argument('--parts',type=int,default=32);p.add_argument('--limit',type=int,default=0);a=p.parse_args()
assert 0<=a.part<a.parts
os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1';os.environ['HF_HUB_DISABLE_TELEMETRY']='1'
# Reuse the proven local-weight loader, preserving authored vowels and reading speed.
sys.path.insert(0,str(ROOT.parents[0]/'screen-to-move/tools'))
from silma_phonics_engine import load_engine
import numpy as np,soundfile as sf
hub=pathlib.Path(os.environ['HF_HOME'])/'hub'
model=next((hub/'models--silma-ai--silma-tts/snapshots').rglob('model.pt'))
vocab=next(model.parent.rglob('vocab.txt'))
vocoder=next((hub/'models--charactr--vocos-mel-24khz/snapshots').glob('*'))
engine=load_engine(model,vocab,vocoder,threads=2)
ref=str(files('silma_tts').joinpath('infer/ref_audio_samples/ar.ref.24k.wav'))
ref_text='ويدقق النظر في القرآن الكريم وسائر الكتب السماوية ويتبع مسالك الرسل العظام عليهم الصلاة والسلام.'
cache=pathlib.Path('/tmp/say-name-silma');cache.mkdir(exist_ok=True)
items=[r for i,r in enumerate(load()['items']) if i%a.parts==a.part]
if a.limit:items=items[:a.limit]
for n,row in enumerate(items):
 target=ROOT/row['path'];target.parent.mkdir(parents=True,exist_ok=True)
 wavpath=cache/(target.stem+'.wav');start=time.time()
 print('SILMA',n+1,len(items),row['key'],row['text'],flush=True)
 wav,sr,_=engine.infer(ref_file=ref,ref_text=ref_text,gen_text=row['text'],file_wave=str(wavpath),seed=360,speed=.85,nfe_step=32,force_tashkeel=False,normalize_numbers=False)
 assert sr==24000 and np.isfinite(wav).all() and .25<len(wav)/sr<40,row['key']
 assert float(np.max(np.abs(wav)))>.005,('silent clip',row['key'])
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wavpath),'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','64k','-id3v2_version','0',str(target)],check=True)
 row['sha256']=hashlib.sha256(target.read_bytes()).hexdigest();row['duration_s']=round(len(wav)/sr,3)
 wavpath.unlink();print('Recorded',round(time.time()-start,1),'seconds',flush=True)
report=ROOT/'audio/silma'/('part-'+str(a.part)+'.json')
report.write_text(json.dumps(dict(part=a.part,parts=a.parts,items=items),ensure_ascii=False,indent=2)+'\n')
