"""Small shared SILMA phrase bank: never includes a child's name."""
import os,pathlib,sys,json,hashlib,subprocess,base64
from importlib.resources import files
ROOT=pathlib.Path(__file__).resolve().parents[1];OUT=ROOT/'resources/celebration-audio'
os.environ['HF_HUB_OFFLINE']='1';os.environ['TRANSFORMERS_OFFLINE']='1'
sys.path.insert(0,str(ROOT/'apps/1-4/screen-to-move/tools'))
from silma_phonics_engine import load_engine
import numpy as np
hub=pathlib.Path(os.environ['HF_HOME'])/'hub';model=next((hub/'models--silma-ai--silma-tts/snapshots').rglob('model.pt'));vocoder=next((hub/'models--charactr--vocos-mel-24khz/snapshots').glob('*'));engine=load_engine(model,next(model.parent.rglob('vocab.txt')),vocoder,threads=2,precision='fp32')
ref=str(files('silma_tts').joinpath('infer/ref_audio_samples/ar.ref.24k.wav'));ref_text='ويدقق النظر في القرآن الكريم وسائر الكتب السماوية ويتبع مسالك الرسل العظام عليهم الصلاة والسلام.'
existing=json.loads((ROOT/'apps/1-4/say-and-name/data/meaning-audio-v1.js').read_text().split('=',1)[1].strip().rstrip(';'))['clips']
references={}
for lang in ['ar','en']:
 candidates=[c for c in existing.values() if c['language']==lang and 3000<=c.get('duration_ms',0)<=5000 and c.get('speech_qa',{}).get('passed') and (ROOT/'apps/1-4/say-and-name'/c['path']).exists()]
 assert candidates,lang
 chosen=min(candidates,key=lambda c:c['duration_ms']);source=ROOT/'apps/1-4/say-and-name'/chosen['path'];assert hashlib.sha256(source.read_bytes()).hexdigest()==chosen['sha256'];references[lang]=(str(source),chosen['text'])
 print('Using verified same-voice reference',lang,chosen['duration_ms'],chosen['text'],flush=True)
m=json.loads((OUT/'phrases.json').read_text());pack={'schema':1,'rate':16000,'clips':{}}
for i,row in enumerate(m['items']):
 target=OUT/row['path'];target.parent.mkdir(parents=True,exist_ok=True);wavfile=pathlib.Path('/tmp')/(row['id']+'.wav');print('Recording',row['id'],row['text'],flush=True)
 selected_ref,selected_text=references[row['language']]
 wav,sr,_=engine.infer(ref_file=selected_ref,ref_text=selected_text,gen_text=row['text'],file_wave=str(wavfile),seed=360+i,speed=.90,nfe_step=24,force_tashkeel=False,normalize_numbers=False)
 assert np.isfinite(wav).all() and .2<len(wav)/sr<15 and np.max(np.abs(wav))>.005
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wavfile),'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','64k',str(target)],check=True)
 row.update(sha256=hashlib.sha256(target.read_bytes()).hexdigest(),duration_ms=round(len(wav)/sr*1000),engine='silma-tts-1.0.5',model_revision='226dd7a65cadf51f9a6dbe3953fc89003b3844d5',auditory_review='pending',steps=24,reference='verified same-voice SILMA clip',reference_text=selected_text)
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(target),'-f','u8','-ac','1','-ar','16000','-']);pack['clips'][row['id']]=base64.b64encode(raw).decode()
 (OUT/'partial-report.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n')
m['complete']=True;(OUT/'phrases.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n');(OUT/'manifest-v1.js').write_text('window.APP360_CELEBRATION_MANIFEST='+json.dumps(m,ensure_ascii=False,separators=(',',':'))+';\n');(OUT/'pcm-v1.js').write_text('window.APP360_CELEBRATION_PCM='+json.dumps(pack,separators=(',',':'))+';\n');print('Shared phrases ready:',len(m['items']))
