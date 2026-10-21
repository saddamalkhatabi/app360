"""Record picture-puzzle-specific SILMA prompts from the verified same synthetic voice."""
import pathlib,sys,json,hashlib,subprocess,numpy as np
ROOT=pathlib.Path(__file__).resolve().parents[1];sys.path.insert(0,str(ROOT.parent/'screen-to-move/tools'))
from silma_phonics_engine import load_engine
import torch,soundfile as sf
modeldir=pathlib.Path(sys.argv[1]);engine=load_engine(modeldir/'model.pt',modeldir/'vocab.txt',modeldir/'vocos',threads=8,precision='bf16')
ref=ROOT.parent/'tangram-builder/audio/teacher/move-complete-v3.mp3'
reftext='نَسْحَبُ الْقِطْعَةَ، وَنَقُومُ بِوَضْعِهَا فِي الْمَكَانِ السَّلِيمِ، بِهُدُوءٍ.'
phrases={'intro':'شَاهِدْ كَيْفَ نُرَكِّبُ الصُّورَةَ.','instructions':'اِخْتَرْ قِطْعَةً مِنْ أَجْزَاءِ الصُّورَةِ. اِسْحَبْهَا إِلَى مَكَانِهَا. الدَّائِرَةُ الْبَيْضَاءُ تُسَاعِدُكَ. إِذَا تَرَكْتَ الْقِطْعَةَ، يُمْكِنُكَ أَنْ تُكْمِلَ مِنْ مَكَانِهَا.'}
manifest=ROOT/'audio/teacher/manifest.json';rows=json.loads(manifest.read_text())['clips'] if manifest.exists() else []
for key,text in phrases.items():
 f=ROOT/'audio/teacher'/(key+'.mp3')
 if f.exists() and any(r['id']==key and r['text']==text and r['sha256']==hashlib.sha256(f.read_bytes()).hexdigest() for r in rows):continue
 torch.manual_seed(362)
 with torch.inference_mode():wav,sr,_=engine.infer(ref_file=str(ref),ref_text=reftext,gen_text=text,nfe_step=32,speed=.95,seed=362,force_tashkeel=False,normalize_numbers=False)
 wav=np.concatenate([wav,np.zeros(round(sr*.35),dtype=wav.dtype)]);tmp=f.with_suffix('.wav');sf.write(tmp,wav,sr)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(tmp),'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','48k',str(f)],check=True);tmp.unlink()
 rows=[r for r in rows if r['id']!=key];rows.append({'id':key,'path':'audio/teacher/'+key+'.mp3','text':text,'engine':'silma-tts-1.0.5','model_revision':'226dd7a65cadf51f9a6dbe3953fc89003b3844d5','reference':'verified same synthetic SILMA voice: tangram move-complete-v3.mp3','reference_sha256':hashlib.sha256(ref.read_bytes()).hexdigest(),'seed':362,'steps':32,'speed':.95,'trailing_silence_s':.35,'sha256':hashlib.sha256(f.read_bytes()).hexdigest(),'duration':round(len(wav)/sr,3)})
 manifest.write_text(json.dumps({'engine':'SILMA','clips':rows},ensure_ascii=False,indent=2)+'\n');print('Generated',key,flush=True)
