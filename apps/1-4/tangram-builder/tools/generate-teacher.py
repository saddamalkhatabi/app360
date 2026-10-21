"""Generate game instructions using local SILMA publisher weights and reference.
Usage: python generate-teacher.py /path/to/model-directory
Requires silma-tts 1.0.5, CPU torch, ffmpeg; model.pt/vocab.txt/vocos/.
"""
import sys,pathlib,json,hashlib,subprocess,time
from importlib.resources import files
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT.parents[0]/'screen-to-move/tools'))
from silma_phonics_engine import load_engine
import torch,soundfile as sf
modeldir=pathlib.Path(sys.argv[1]);engine=load_engine(modeldir/'model.pt',modeldir/'vocab.txt',modeldir/'vocos',threads=8,precision='bf16')
ref=str(files('silma_tts').joinpath('infer/ref_audio_samples/ar.ref.24k.wav'))
reftext='ويدقق النظر في القرآن الكريم وسائر الكتب السماوية ويتبع مسالك الرسل العظام عليهم الصلاة والسلام.'
phrases={
 'intro':'شَاهِدْ كَيْفَ نُرَكِّبُ الْأَشْكَالَ.',
 'pick':'نَخْتَارُ قِطْعَةً مِنْ هُنَا.',
 'move':'نَسْحَبُ الْقِطْعَةَ إِلَى مَكَانِهَا فِي الشَّكْلِ.',
 'place':'نَتْرُكُ الْقِطْعَةَ هُنَا.',
 'turn':'الْآنَ دَوْرُكَ. اِخْتَرْ قِطْعَةً، وَجَرِّبْ بِنَفْسِكَ.',
 'instructions':'اِخْتَرْ قِطْعَةً مِنَ الْأَدَوَاتِ. اِسْحَبْهَا إِلَى مَكَانِهَا فِي الشَّكْلِ، ثُمَّ اُتْرُكْهَا. الدَّائِرَةُ الْبَيْضَاءُ تُسَاعِدُكَ عِنْدَمَا يَكُونُ التَّلْمِيحُ مُفَعَّلًا.',
 'hintOn':'التَّلْمِيحُ مُفَعَّلٌ. الدَّائِرَةُ الْبَيْضَاءُ تَدُلُّكَ عَلَى مَكَانِ الْقِطْعَةِ.',
 'hintOff':'أَوْقَفْنَا التَّلْمِيحَ. جَرِّبْ تَرْكِيبَ الْقِطْعَةِ دُونَ الدَّائِرَةِ الْبَيْضَاءِ.'}
manifest=ROOT/'audio/teacher/manifest.json'
records=json.loads(manifest.read_text())['clips'] if manifest.exists() else []
for key,text in phrases.items():
 target=ROOT/'audio/teacher'/(key+'.mp3')
 if target.exists() and any(r['id']==key and r['text']==text and r['sha256']==hashlib.sha256(target.read_bytes()).hexdigest() for r in records):continue
 wav=target.with_suffix('.wav');started=time.time()
 torch.manual_seed(360)
 with torch.inference_mode():samples,sr,_=engine.infer(ref_file=ref,ref_text=reftext,gen_text=text,nfe_step=24,speed=.95,seed=360,force_tashkeel=False,normalize_numbers=False)
 sf.write(wav,samples,sr)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','48k',str(target)],check=True);wav.unlink()
 records=[r for r in records if r['id']!=key]
 records.append({'id':key,'path':'audio/teacher/'+key+'.mp3','text':text,'engine':'silma-tts-1.0.5','model_revision':'226dd7a65cadf51f9a6dbe3953fc89003b3844d5','reference':'publisher bundled ar.ref.24k.wav','steps':24,'seed':360,'speed':.95,'duration':round(len(samples)/sr,3),'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
 (ROOT/'audio/teacher/manifest.json').write_text(json.dumps({'engine':'SILMA','clips':records},ensure_ascii=False,indent=2)+'\n')
 print(key,'generated',round(time.time()-started,1),'seconds',flush=True)
