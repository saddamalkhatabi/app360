"""Check the spoken alphabet with an independent English speech recognizer."""
import json,pathlib,re,subprocess
import numpy as np
from faster_whisper import WhisperModel
root=pathlib.Path('apps/1-4/balloon-garden')
manifest=json.loads((root/'guidance.js').read_text().split('=',1)[1].strip().removesuffix(';'))
model=WhisperModel('small.en',device='cpu',compute_type='int8',cpu_threads=2)
aliases={'a':['a','ay'],'b':['b','bee','be'],'c':['c','see','sea'],'d':['d','dee'],'e':['e'],'f':['f','eff'],'g':['g','gee'],'h':['h','aitch','eight'],'i':['i','eye'],'j':['j','jay'],'k':['k','kay'],'l':['l','el','ell'],'m':['m','em'],'n':['n','en'],'o':['o','oh'],'p':['p','pee'],'q':['q','cue','queue'],'r':['r','are'],'s':['s','ess'],'t':['t','tea','tee'],'u':['u','you'],'v':['v','vee'],'w':['w','double u','double you'],'x':['x','ex'],'y':['y','why'],'z':['z','zee','zed']}
failed=[]
for letter,accepted in aliases.items():
 clip=manifest['clips']['en:letter-'+letter]
 wave=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(root/clip['path']),'-f','f32le','-ac','1','-ar','16000','-']),dtype=np.float32)
 segments,_=model.transcribe(wave,language='en',beam_size=5,vad_filter=False,condition_on_previous_text=False)
 heard=' '.join(s.text.strip() for s in segments)
 normalized=re.sub('[^a-z ]','',heard.lower()).strip()
 # Require the target after "letter"; do not accept a letter found inside another word.
 tail=normalized.split('letter',1)[-1].strip()
 passed=tail in accepted
 if not passed:failed.append((letter,heard))
 clip['speech_qa']={'recognizer':'faster-whisper-small.en','heard':heard,'passed':passed}
 print(letter,heard,flush=True)
(root/'guidance.js').write_text('window.BalloonGardenGuidance='+json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+';\n')
assert not failed,failed
