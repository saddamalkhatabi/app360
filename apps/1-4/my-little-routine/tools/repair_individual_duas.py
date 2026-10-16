"""Repair incomplete public SILMA duas using independently transcribed MP3s.

The synthesis-only trailing context is removed before export and never shipped.
Acceptance compares the entire decoded clip, including the final authored word;
forced alignment alone is not evidence that a missing word was spoken.
"""
import argparse, hashlib, json, os, pathlib, re, subprocess, sys, unicodedata
from importlib.resources import files
import numpy as np
import soundfile as sf
from routine_speech_checks import norm,canonical,cues_from_words

p=argparse.ArgumentParser();p.add_argument('--baseline',required=True);p.add_argument('--output',required=True);p.add_argument('--attempts',type=int,default=4);p.add_argument('--asr-model',default='small');a=p.parse_args()
ROOT=pathlib.Path(__file__).resolve().parents[1]
out=pathlib.Path(a.output);out.mkdir(parents=True,exist_ok=True)
index=json.loads((ROOT/'audio/islamic-recordings-v1.js').read_text().split('=',1)[1].strip().rstrip(';'))
baseline={r['id']:r for r in json.loads(pathlib.Path(a.baseline).read_text())}


duas=[(id,row) for id,row in index['clips'].items() if id.startswith('dua-')]
assert len(duas)==19 and all(id in baseline for id,_ in duas)
todo=[(id,row) for id,row in duas if canonical(baseline[id]['recognized'])!=canonical(row['text'])]
print('Independent baseline:',len(duas)-len(todo),'complete;',len(todo),'need repair',flush=True)

sys.path.insert(0,str(ROOT.parent/'screen-to-move/tools'))
from silma_phonics_engine import load_engine
import silma_tts.infer.utils_infer as util
import torch,torchaudio
from faster_whisper import WhisperModel
hub=pathlib.Path(os.environ['HF_HOME'])/'hub'
model=hub/'models--silma-ai--silma-tts/snapshots'/index['model_revision']/'model.pt'
vocoder=next((hub/'models--charactr--vocos-mel-24khz/snapshots').glob('*'))
engine=load_engine(model,model.parent/'vocab.txt',vocoder,threads=min(8,os.cpu_count() or 4),precision='bf16')
# A dua plus its short guard must stay in one generated passage.
util.chunk_text=lambda text,max_chars=120:[text]
recognizer=WhisperModel(a.asr_model,device='cpu',compute_type='int8',cpu_threads=2,download_root=os.environ['ROUTINE_WHISPER_HOME'],local_files_only=True)
ref=str(files('silma_tts').joinpath('infer/ref_audio_samples/ar.ref.24k.wav'))
ref_text='ويدقق النظر في القرآن الكريم وسائر الكتب السماوية ويتبع مسالك الرسل العظام عليهم الصلاة والسلام.'

def recognize(samples,sr):
    x=torchaudio.functional.resample(torch.from_numpy(np.asarray(samples,dtype=np.float32)).unsqueeze(0),sr,16000)[0].numpy()
    segments,_=recognizer.transcribe(x,language='ar',beam_size=5,vad_filter=False,condition_on_previous_text=False,word_timestamps=True)
    segments=list(segments)
    return ' '.join(s.text for s in segments).strip(),[w for s in segments for w in s.words]


report=[];patched={}
for id,row in duas:
    if (id,row) not in todo:
        report.append(dict(id=id,status='existing-complete',expected=row['text'],recognized=baseline[id]['recognized']))
        continue
    desired=canonical(row['text']);accepted=False
    staged=out/row['path']
    if staged.exists():
        decoded,sr=sf.read(staged,dtype='float32');transcript,final_words=recognize(decoded,sr)
        if canonical(transcript)==desired:
            try:cues=cues_from_words(row['text'],final_words)
            except AssertionError:pass
            else:
                patched[id]=dict(row,sha256=hashlib.sha256(staged.read_bytes()).hexdigest(),duration_ms=round(len(decoded)/sr*1000),cues=cues,timing_source='independent Whisper word timestamps of decoded MP3',speech_check=dict(engine='faster-whisper-'+pathlib.Path(a.asr_model).name,expected=row['text'],recognized=transcript,complete=True,final_word=True),synthesis_guard_removed=True,verified=True)
                report.append(dict(id=id,status='repaired-complete',expected=row['text'],recognized=transcript,last_word=row['text'].split()[-1]));print('Resume accepted',id,flush=True);continue
    for attempt in range(a.attempts):
        text='أُرَدِّدُ بِهُدُوءٍ '+row['text'].rstrip(' .،')+' ثُمَّ نُكَرِّرُ الذِّكْرَ بِهُدُوءٍ'
        print('Repair',id,'attempt',attempt+1,flush=True)
        wav,sr,_=engine.infer(ref_file=ref,ref_text=ref_text,gen_text=text,seed=761+attempt*101,speed=.76-attempt*.04,nfe_step=16 if attempt<2 else 32,force_tashkeel=False,normalize_numbers=False,progress=None)
        wav=np.asarray(wav,dtype=np.float32)
        heard,words=recognize(wav,sr);print('Guarded ASR:',heard,flush=True)
        boundary=None;begin=0
        for start in range(len(words)):
            prefix=''
            for i in range(start,len(words)):
                word=words[i];prefix+=norm(word.word)
                if prefix==desired:
                    begin=max(0,words[start].start-.035)
                    if start>0:begin=(min(words[start].start,words[start-1].end)+words[start].start)/2
                    boundary=word.end
                    if i+1<len(words):boundary=(word.end+max(word.end,words[i+1].start))/2
                    break
                if not desired.startswith(prefix):break
            if boundary is not None:break
        if boundary is None:continue
        clip=np.concatenate([wav[round(begin*sr):round(boundary*sr)],np.zeros(round(.35*sr),dtype=np.float32)])
        temp=out/(id+'.wav');sf.write(temp,clip,sr)
        target=out/row['path'];target.parent.mkdir(parents=True,exist_ok=True)
        subprocess.run(['ffmpeg','-v','error','-y','-i',str(temp),'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','64k','-write_xing','1','-id3v2_version','0',str(target)],check=True)
        decoded,sr=sf.read(target,dtype='float32');transcript,final_words=recognize(decoded,sr)
        print('Exported MP3 ASR:',transcript,flush=True)
        if canonical(transcript)!=desired:continue
        try:cues=cues_from_words(row['text'],final_words)
        except AssertionError:continue
        result=dict(row,path=row['path'],sha256=hashlib.sha256(target.read_bytes()).hexdigest(),duration_ms=round(len(decoded)/sr*1000),cues=cues,timing_source='independent Whisper word timestamps of decoded MP3',speech_check=dict(engine='faster-whisper-'+pathlib.Path(a.asr_model).name,expected=row['text'],recognized=transcript,complete=True,final_word=True),synthesis_guard_removed=True,verified=True)
        patched[id]=result;report.append(dict(id=id,status='repaired-complete',attempt=attempt+1,expected=row['text'],recognized=transcript,last_word=row['text'].split()[-1]))
        temp.unlink(missing_ok=True);accepted=True;break
    if not accepted:
        (out/'repair-audit.partial.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
        raise RuntimeError('No independently complete candidate for '+id+'; no published files changed')
(out/'repaired-duas.json').write_text(json.dumps(dict(clips=patched,audit=report),ensure_ascii=False,indent=2)+'\n')
print('PASS: all 19 individual duas independently checked; repaired',len(patched),flush=True)
