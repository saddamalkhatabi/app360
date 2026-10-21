"""Generate game instructions using local SILMA publisher weights and reference.
Usage: python generate-teacher.py /path/to/model-directory
Requires silma-tts 1.0.5, CPU torch, ffmpeg; model.pt/vocab.txt/vocos/.
"""
import sys,pathlib,json,hashlib,subprocess,time
from importlib.resources import files
ROOT=pathlib.Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT.parents[0]/'screen-to-move/tools'))
from silma_phonics_engine import load_engine
import torch,soundfile as sf,numpy as np
modeldir=pathlib.Path(sys.argv[1]);engine=load_engine(modeldir/'model.pt',modeldir/'vocab.txt',modeldir/'vocos',threads=8,precision='bf16')
ref=str(files('silma_tts').joinpath('infer/ref_audio_samples/ar.ref.24k.wav'))
reftext='ويدقق النظر في القرآن الكريم وسائر الكتب السماوية ويتبع مسالك الرسل العظام عليهم الصلاة والسلام.'
phrases={
 'intro':'شَاهِدْ كَيْفَ نُرَكِّبُ الْأَشْكَالَ.',
 'pick':'نَخْتَارُ قِطْعَةً مِنْ هُنَا.',
 'move':'نَسْحَبُ الْقِطْعَةَ، وَنَقُومُ بِوَضْعِهَا فِي الْمَكَانِ السَّلِيمِ، بِهُدُوءٍ.',
 'place':'نَضَعُ الْقِطْعَةَ فِي الْمَكَانِ السَّلِيمِ، ثُمَّ نَرْفَعُ الْيَدَ.',
 'turn':'الْآنَ دَوْرُكَ. اِخْتَرْ قِطْعَةً، وَجَرِّبْ بِنَفْسِكَ.',
 'instructions':'اِخْتَرْ قِطْعَةً مِنَ الْأَدَوَاتِ. اِسْحَبْهَا إِلَى مَكَانِهَا فِي الشَّكْلِ، ثُمَّ اُتْرُكْهَا. الدَّائِرَةُ الْبَيْضَاءُ تُسَاعِدُكَ عِنْدَمَا يَكُونُ التَّلْمِيحُ مُفَعَّلًا.',
 'hintOn':'التَّلْمِيحُ مُفَعَّلٌ. الدَّائِرَةُ الْبَيْضَاءُ تَدُلُّكَ عَلَى مَكَانِ الْقِطْعَةِ.',
 'hintOff':'أَوْقَفْنَا التَّلْمِيحَ. جَرِّبْ تَرْكِيبَ الْقِطْعَةِ دُونَ الدَّائِرَةِ الْبَيْضَاءِ.'}
manifest=ROOT/'audio/teacher/manifest.json'
records=json.loads(manifest.read_text())['clips'] if manifest.exists() else []
for key,text in phrases.items():
 filename={'move':'move-complete-v3.mp3','place':'place-complete-v3.mp3'}.get(key,key+'.mp3')
 target=ROOT/'audio/teacher'/filename
 if target.exists() and any(r['id']==key and r['text']==text and r['sha256']==hashlib.sha256(target.read_bytes()).hexdigest() for r in records):continue
 wav=target.with_suffix('.wav');started=time.time()
 seed=361 if key in ('move','place') else 360
 steps=32 if key in ('move','place') else 24
 speed=.85 if key in ('move','place') else .95
 torch.manual_seed(seed)
 with torch.inference_mode():samples,sr,_=engine.infer(ref_file=ref,ref_text=reftext,gen_text=text,nfe_step=steps,speed=speed,seed=seed,force_tashkeel=False,normalize_numbers=False)
 samples=np.concatenate([samples,np.zeros(round(sr*.4),dtype=samples.dtype)]) if key in ('move','place') else samples
 sf.write(wav,samples,sr)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','48k',str(target)],check=True);wav.unlink()
 if key in ('move','place'):
  # The original reference's ending leaked into this short-phrase take.
  # Trim inside the measured >1s silent gap, before the authored words begin.
  clean=target.with_suffix('.clean.mp3')
  subprocess.run(['ffmpeg','-v','error','-y','-ss','1.4','-i',str(target),'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','48k',str(clean)],check=True)
  clean.replace(target)
 records=[r for r in records if r['id']!=key]
 records.append({'id':key,'path':'audio/teacher/'+filename,'text':text,'engine':'silma-tts-1.0.5','model_revision':'226dd7a65cadf51f9a6dbe3953fc89003b3844d5','reference':'publisher bundled ar.ref.24k.wav','steps':steps,'seed':seed,'speed':speed,'duration':round(float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(target)])),3),'leading_reference_trim_s':1.4 if key in ('move','place') else 0,'trailing_silence_s':.4 if key in ('move','place') else 0,'sha256':hashlib.sha256(target.read_bytes()).hexdigest()})
 (ROOT/'audio/teacher/manifest.json').write_text(json.dumps({'engine':'SILMA','clips':records},ensure_ascii=False,indent=2)+'\n')
 print(key,'generated',round(time.time()-started,1),'seconds',flush=True)
