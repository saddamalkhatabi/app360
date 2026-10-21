"""Check regenerated final-word audio with independent local Arabic ASR.
Usage: python verify-salim.py /path/to/local/faster-whisper-small
Requires faster-whisper, numpy, FFmpeg. No child recordings or account data.
"""
import pathlib,json,subprocess,numpy as np,sys,re,hashlib
from faster_whisper import WhisperModel
root=pathlib.Path(__file__).resolve().parents[1]
model=WhisperModel(sys.argv[1],device='cpu',compute_type='int8',cpu_threads=4,local_files_only=True)
manifest=json.loads((root/'audio/teacher/manifest.json').read_text());rows=[]
for key in ['move','place']:
 item=next(r for r in manifest['clips'] if r['id']==key);p=root/item['path']
 pcm=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-ar','16000','-ac','1','-f','f32le','-']),dtype=np.float32)
 segments,info=model.transcribe(pcm,language='ar',beam_size=5,word_timestamps=True,condition_on_previous_text=False,vad_filter=False)
 words=[];texts=[]
 for s in segments:
  texts.append(s.text)
  for w in s.words or []:words.append({'word':w.word,'start':round(w.start,2),'end':round(w.end,2),'probability':round(w.probability,3)})
 salim=next((w for w in words if re.sub('[^\u0621-\u064a]','',w['word'])=='السليم'),None)
 assert salim and salim['end']-salim['start']>=.25,(key,texts,words)
 assert len(pcm)/16000-salim['end']>=.5, 'Salim must finish before following speech/trailing silence'
 row={'id':key,'path':item['path'],'expected_text':item['text'],'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'transcript':''.join(texts),'salim':salim,'duration':round(len(pcm)/16000,3),'words':words};rows.append(row);print(key,row['transcript'],salim,flush=True)
out=root/'tools/qa/salim-v3.json';out.parent.mkdir(exist_ok=True)
out.write_text(json.dumps({'method':'faster-whisper small, Arabic, int8, beam size 5, no text prompt','model':'Systran/faster-whisper-small','scope':'Automatic recognition of the complete word السليم in final decoded MP3, not a human listening review','clips':rows},ensure_ascii=False,indent=2)+'\n')
