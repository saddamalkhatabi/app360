"""Local Kokoro English guides with actual MMS acoustic word boundaries."""
import hashlib,json,pathlib,re,subprocess,tempfile
import numpy as np,soundfile as sf,torch,torchaudio
from kokoro_onnx import Kokoro
ROOT=pathlib.Path(__file__).resolve().parents[1];plan=json.loads((ROOT/'tools/silma-target/plan.json').read_text());old=json.loads((ROOT/'data/stories.json').read_text())['guides'];out=pathlib.Path('/tmp/story-output');cues={}
engine=Kokoro('/tmp/story-en-model/model.onnx','/tmp/story-en-model/voices.bin');torch.set_num_threads(2)
bundle=torchaudio.pipelines.MMS_FA;acoustic=bundle.get_model();acoustic.eval();tokenizer=bundle.get_tokenizer();aligner=bundle.get_aligner()
for name,guide in plan['guides'].items():
 g=guide['en']
 if name in old and old[name]['en']==g:continue
 samples,sr=engine.create(g['text'],voice='af_heart',speed=.9,lang='en-us');assert np.isfinite(samples).all() and len(samples)>sr/5
 p=out/g['audio'];p.parent.mkdir(parents=True,exist_ok=True)
 with tempfile.TemporaryDirectory() as t:
  wav=pathlib.Path(t)/'clip.wav';sf.write(wav,samples,sr)
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','48k',str(p)],check=True)
 samples,sr=sf.read(p,dtype='float32');wave=torchaudio.functional.resample(torch.from_numpy(samples).unsqueeze(0),sr,bundle.sample_rate);tokens=[re.sub('[^a-z]','',w.lower()) for w in g['text'].split()];assert all(tokens)
 with torch.inference_mode():emission,_=acoustic(wave)
 spans=aligner(emission[0],tokenizer(tokens));ratio=wave.shape[1]/emission.shape[1]/bundle.sample_rate*1000;duration=round(len(samples)/sr*1000)
 entry={'text':g['text'],'language':'en','duration':duration,'cues':[[i,round(s[0].start*ratio),round(s[-1].end*ratio)] for i,s in enumerate(spans)],'audio_sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'timing_source':'MMS_FA acoustic alignment of Kokoro af_heart MP3'}
 cues[g['audio']]=entry;print('English guide:',name,flush=True)
(out/'cues').mkdir(exist_ok=True);(out/'cues/english.json').write_text(json.dumps(cues,ensure_ascii=False)+'\n')
