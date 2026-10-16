"""Publish repaired prayers only after decoding and independently checking MP3s."""
import argparse,hashlib,json,pathlib,shutil,subprocess
import numpy as np
import soundfile as sf
from faster_whisper import WhisperModel
from routine_speech_checks import canonical,cues_from_words

p=argparse.ArgumentParser();p.add_argument('--baseline',required=True);p.add_argument('--generated',required=True);p.add_argument('--extracted',required=True);p.add_argument('--asr-model',required=True);a=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[1]
index=json.loads((root/'audio/islamic-recordings-v1.js').read_text().split('=',1)[1].strip().rstrip(';'))
baseline={r['id']:r for r in json.loads(pathlib.Path(a.baseline).read_text())}
sources={k:pathlib.Path(a.generated) for k in ['dua-sleep','dua-learn','dua-toilet-out']}
sources.update({k:pathlib.Path(a.extracted) for k in ['dua-salam','dua-leave']})
assert len(baseline)==19
recognizer=WhisperModel(a.asr_model,device='cpu',compute_type='int8',cpu_threads=4)
staged={};review=[]
for id,row in index['clips'].items():
    if not id.startswith('dua-'):continue
    if id not in sources:
        r=baseline[id];assert canonical(r['recognized'])==canonical(row['text']),id
        review.append(dict(id=id,status='retained-complete',sha256=row['sha256'],expected=row['text'],recognized=r['recognized'],comparisons=r['comparisons']))
        continue
    target=sources[id]/row['path'];assert target.exists(),id
    samples=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(target),'-f','f32le','-ar','16000','-ac','1','pipe:1']),dtype=np.float32)
    segments,_=recognizer.transcribe(samples,language='ar',beam_size=5,vad_filter=False,condition_on_previous_text=False,word_timestamps=True)
    segments=list(segments);text=' '.join(s.text for s in segments).strip();words=[w for s in segments for w in s.words]
    print(id,'final decoded MP3:',text,flush=True)
    assert canonical(text)==canonical(row['text']),(id,text,row['text'])
    cues=cues_from_words(row['text'],words);decoded,sr=sf.read(target,dtype='float32');duration=round(len(decoded)/sr*1000)
    assert len(cues)==len(row['text'].split()) and all(0<=s<e<=duration for _,s,e in cues),id
    entry=dict(row,sha256=hashlib.sha256(target.read_bytes()).hexdigest(),duration_ms=duration,cues=cues,timing_source='independent Whisper medium word timestamps of decoded MP3',speech_check=dict(engine='faster-whisper-medium',recognized=text,expected=row['text'],complete=True,final_word=True),speech_confidence=round(float(np.mean([w.probability for w in words])),4),verified=True)
    entry.pop('alignment_score',None)
    staged[id]=(target,entry)
    review.append(dict(id=id,status='repaired-complete',sha256=entry['sha256'],expected=row['text'],recognized=text,last_word=row['text'].split()[-1],word_cues=cues))
assert len(review)==19 and len(staged)==5
# Mutate publication files only once every repaired MP3 has passed.
for id,(source,entry) in staged.items():
    shutil.copy2(source,root/entry['path']);index['clips'][id]=entry
index['speech_review']={'method':'independent unprompted ASR, small/medium','individual_duas_checked':19,'individual_duas_repaired':5,'human_review':'not performed'}
(root/'audio/islamic-recordings-v1.js').write_text('window.APP360_ISLAMIC_AUDIO = '+json.dumps(index,ensure_ascii=False,separators=(',',':'))+';\n')
(root/'tools/dua-pronunciation-audit-v2.json').write_text(json.dumps(dict(method=index['speech_review'],items=review),ensure_ascii=False,indent=2)+'\n')
print('PASS: 19 complete individual duas; published 5 repaired MP3s under their original filenames',flush=True)
