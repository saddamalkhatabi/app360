"""Record drawing coach prompts and labels using SILMA; resumable by exact text/hash."""
import pathlib,sys,json,hashlib,subprocess,shutil,numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT.parent/'screen-to-move/tools'))
from silma_phonics_engine import load_engine
import torch,soundfile as sf
modeldir=pathlib.Path(sys.argv[1]);engine=load_engine(modeldir/'model.pt',modeldir/'vocab.txt',modeldir/'vocos',threads=8,precision='bf16')
ref=ROOT.parent/'picture-puzzles/audio/teacher/intro.mp3'
reftext='شَاهِدْ كَيْفَ نُرَكِّبُ الصُّورَةَ.'
plan=json.loads((ROOT/'tools/coach-plan.json').read_text()); phrases={r['id']:r['text'] for r in plan['clips']}
(ROOT/'audio/coach').mkdir(parents=True,exist_ok=True)
manifest=ROOT/'audio/coach/manifest.json';rows=json.loads(manifest.read_text())['clips'] if manifest.exists() else []
for key,text in phrases.items():
 spec=next(r for r in plan['clips'] if r['id']==key);seed=spec.get('seed',362);steps=spec.get('steps',24)
 ref=ROOT.parent/('tangram-builder/audio/teacher/move-complete-v3.mp3' if spec.get('reference')=='tangram-complete' else 'picture-puzzles/audio/teacher/intro.mp3')
 reftext='نَسْحَبُ الْقِطْعَةَ، وَنَقُومُ بِوَضْعِهَا فِي الْمَكَانِ السَّلِيمِ، بِهُدُوءٍ.' if spec.get('reference')=='tangram-complete' else 'شَاهِدْ كَيْفَ نُرَكِّبُ الصُّورَةَ.'
 f=ROOT/'audio/coach'/(key+'.mp3')
 if spec.get('source_path'):
  source=ROOT.parents[2]/spec['source_path'];digest=hashlib.sha256(source.read_bytes()).hexdigest();assert digest==spec['source_sha256']
  shutil.copyfile(source,f);pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(f),'-ar','16000','-ac','1','-f','s16le','-'])
  rows=[r for r in rows if r['id']!=key];rows.append({'id':key,'path':'audio/coach/'+key+'.mp3','text':text,'language':spec['language'],'engine':'SILMA project recording','source_path':spec['source_path'],'source_sha256':digest,'sha256':digest,'duration':round(len(pcm)/32000,3)})
  manifest.write_text(json.dumps({'engine':'SILMA','clips':rows},ensure_ascii=False,indent=2)+'\n');print('Reused verified source',key,flush=True);continue
 if f.exists() and any(r['id']==key and r['text']==text and r['sha256']==hashlib.sha256(f.read_bytes()).hexdigest() for r in rows):continue
 torch.manual_seed(seed)
 with torch.inference_mode():wav,sr,_=engine.infer(ref_file=str(ref),ref_text=reftext,gen_text=text,nfe_step=steps,speed=.95,seed=seed,force_tashkeel=False,normalize_numbers=False)
 wav=np.concatenate([wav,np.zeros(round(sr*.35),dtype=wav.dtype)]);tmp=f.with_suffix('.wav');sf.write(tmp,wav,sr)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(tmp),'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','48k',str(f)],check=True);tmp.unlink()
 rows=[r for r in rows if r['id']!=key];rows.append({'id':key,'path':'audio/coach/'+key+'.mp3','text':text,'engine':'silma-tts-1.0.5','model_revision':'226dd7a65cadf51f9a6dbe3953fc89003b3844d5','reference':'verified same synthetic SILMA voice: '+ref.name,'reference_sha256':hashlib.sha256(ref.read_bytes()).hexdigest(),'language':next(r['language'] for r in plan['clips'] if r['id']==key),'seed':seed,'steps':steps,'speed':.95,'trailing_silence_s':.35,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'duration':round(len(wav)/sr,3)})
 manifest.write_text(json.dumps({'engine':'SILMA','clips':rows},ensure_ascii=False,indent=2)+'\n');print('Generated',key,flush=True)
