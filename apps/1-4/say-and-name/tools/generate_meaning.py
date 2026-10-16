"""Pinned SILMA speech and acoustic word alignment for bilingual meanings."""
import argparse,hashlib,json,os,sys,pathlib,subprocess,gc,re,unicodedata
from importlib.resources import files
from meaning_speech_qa import compare,verified_recording
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--part',type=int,default=0);p.add_argument('--parts',type=int,default=32);p.add_argument('--priority',action='store_true');p.add_argument('--recover',action='store_true');p.add_argument('--output',required=True);a=p.parse_args()
manifest=json.loads((ROOT/'data/meaning-scripts-v1.json').read_text());n=manifest['priority_count']
items=manifest['items'][:n] if a.priority else [r for i,r in enumerate(manifest['items'][n:]) if i%a.parts==a.part]
existing=json.loads((ROOT/'data/meaning-audio-v1.js').read_text().split('=',1)[1].strip().rstrip(';'))['clips']
items=[r for r in items if not verified_recording(r,existing.get(r['id']),ROOT)]
out=pathlib.Path(a.output);out.mkdir(parents=True,exist_ok=True)
if not items:
 print('All recordings in this batch already verified; no model loading needed',flush=True)
 raise SystemExit(0)
seed_offset=int(os.environ.get('MEANING_SEED_OFFSET','0'))
from meaning_recovery import spoken_text,speech_chunks
authored=json.loads((ROOT/'data/meaning-pronunciation-v3.json').read_text())['spoken'] if a.recover else {}
os.environ.update(HF_HUB_OFFLINE='1',TRANSFORMERS_OFFLINE='1',HF_HUB_DISABLE_TELEMETRY='1',ORT_DISABLE_TELEMETRY='1')
from silma_sentence_engine import load_engine
from meaning_speech_qa import compare,verified_recording
from faster_whisper import WhisperModel
import numpy as np,soundfile as sf,torch,torchaudio
from uroman import Uroman
hub=pathlib.Path(os.environ['HF_HOME'])/'hub'
model=next((hub/'models--silma-ai--silma-tts/snapshots').rglob('model.pt'));vocab=next(model.parent.rglob('vocab.txt'));vocoder=next((hub/'models--charactr--vocos-mel-24khz/snapshots').glob('*'))
flags=pathlib.Path('/proc/cpuinfo').read_text();precision='bf16' if 'avx512_bf16' in flags or 'amx_bf16' in flags else 'fp32'
engine=load_engine(model,vocab,vocoder,threads=4,precision=precision)
ref=str(files('silma_tts').joinpath('infer/ref_audio_samples/ar.ref.24k.wav'));ref_text='ويدقق النظر في القرآن الكريم وسائر الكتب السماوية ويتبع مسالك الرسل العظام عليهم الصلاة والسلام.'
references={}
if a.recover:
 for lang in ('ar','en'):
  options=[r for r in existing.values() if r.get('language')==lang and 3500<=r.get('duration_ms',0)<=8000 and verified_recording(r,r,ROOT)]
  if options:
   chosen=min(options,key=lambda r:r['duration_ms']);references[lang]=(str(ROOT/chosen['path']),chosen['text'])
preferred=existing.get('ar_2b9079b514f2a91959a7')
if a.recover and preferred and verified_recording(preferred,preferred,ROOT):references['ar']=(str(ROOT/preferred['path']),preferred['text'])
recognizer=WhisperModel(os.environ['MEANING_ASR_MODEL'],device='cpu',compute_type='int8',cpu_threads=2,num_workers=1)
verifier=None
accepted=[];rejected=[]
for i,row in enumerate(items):
 print('SILMA',i+1,len(items),precision,row['language'],row['text'],flush=True)
 target=out/row['path'];target.parent.mkdir(parents=True,exist_ok=True);wavfile=out/(row['id']+'.wav')
 for attempt in range(3):
  seed=seed_offset+(360 if attempt==2 else 360+attempt)
  engine._app360_precision='fp32' if attempt==2 else precision
  prompt=spoken_text(row,authored)
  chunks=speech_chunks(prompt,segmented=a.recover and attempt==1)
  selected_ref,selected_text=references.get(row['language'],(ref,ref_text)) if a.recover and (attempt>0 or os.environ.get('MEANING_FINAL_REF')=='1') else (ref,ref_text)
  pieces=[]
  for chunk_index,chunk in enumerate(chunks):
   piece,sr,_=engine.infer(ref_file=selected_ref,ref_text=selected_text,gen_text=chunk,file_wave=str(wavfile),seed=seed+chunk_index*17,speed=(.93 if row['language']=='ar' else 1) if attempt==0 or not a.recover else .88,nfe_step=48,force_tashkeel=False,normalize_numbers=False)
   if pieces:pieces.append(np.zeros(round(sr*.12),dtype=np.float32))
   pieces.append(piece)
  wav=np.concatenate(pieces);sf.write(wavfile,wav,sr)
  if a.recover:row.update(pronunciation_revision='authored-recovery-v3',spoken_text=prompt,phrase_count=len(chunks),reference_strategy='verified same-voice clip' if selected_ref!=ref else 'publisher reference',reference=('verified clip '+pathlib.Path(selected_ref).relative_to(ROOT).as_posix()) if selected_ref!=ref else 'publisher ar.ref.24k.wav')
  assert sr==24000 and np.isfinite(wav).all() and .5<len(wav)/sr<45 and np.max(np.abs(wav))>.005,row['id']
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(wavfile),'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','64k','-id3v2_version','0',str(target)],check=True);wavfile.unlink()
  segments,_=recognizer.transcribe(str(target),language=row['language'],beam_size=5,condition_on_previous_text=False,vad_filter=False)
  qa=compare(row['text'],' '.join(x.text.strip() for x in segments));print('Speech QA',row['id'],attempt,qa,flush=True)
  if not qa['passed']:
   if verifier is None:verifier=WhisperModel(os.environ['MEANING_ASR_VERIFY_MODEL'],device='cpu',compute_type='int8',cpu_threads=2,num_workers=1)
   segments,_=verifier.transcribe(str(target),language=row['language'],beam_size=5,condition_on_previous_text=False,vad_filter=False)
   second=compare(row['text'],' '.join(x.text.strip() for x in segments));second.update(recognizer='faster-whisper-medium',primary=qa)
   print('Independent second transcription',row['id'],second,flush=True)
   if second['passed']:qa=second
  if qa['passed']:
   row.update(speech_qa=qa,seed=seed,precision=engine._app360_precision);accepted.append(row);break
 else:
  rejected.append(dict(id=row['id'],text=row['text'],qa=qa));target.unlink(missing_ok=True)
items=accepted
(out/('speech-rejections-'+('priority' if a.priority else str(a.part))+'.json')).write_text(json.dumps(dict(rejected=rejected),ensure_ascii=False,indent=2))

del engine,recognizer,verifier;gc.collect()
bundle=torchaudio.pipelines.MMS_FA;acoustic=bundle.get_model().eval();tokenizer=bundle.get_tokenizer();aligner=bundle.get_aligner();roman=Uroman()
for row in items:
 target=out/row['path'];samples,sr=sf.read(target,dtype='float32');wave=torchaudio.functional.resample(torch.from_numpy(samples).unsqueeze(0),sr,bundle.sample_rate)
 normalized=[]
 for word in row['words']:
  simple=''.join(c for c in unicodedata.normalize('NFKD',word) if not unicodedata.combining(c))
  value=re.sub('[^a-z]','',roman.romanize_string(simple).lower());assert value,(row['id'],word);normalized.append(value)
 with torch.inference_mode():emission,_=acoustic(wave)
 spans=aligner(emission[0],tokenizer(normalized));ratio=wave.shape[1]/emission.shape[1]/bundle.sample_rate*1000
 cues=[];scores=[]
 for index,group in enumerate(spans):
  assert group
  cues.append([index,round(group[0].start*ratio),round(group[-1].end*ratio)]);scores.extend(float(t.score) for t in group)
 duration=round(len(samples)/sr*1000)
 assert len(cues)==len(row['words']) and all(0<=start<end<=duration for _,start,end in cues)
 assert all(cues[i][2]<=cues[i+1][1] for i in range(len(cues)-1))
 row.update(cues=cues,duration_ms=duration,sha256=hashlib.sha256(target.read_bytes()).hexdigest(),timing_source='MMS_FA acoustic alignment of decoded MP3',alignment_score=round(float(np.mean(scores)),4),model_revision=manifest['model_revision'],package_version=manifest['package_version'],precision=row.get('precision',precision),reference=row.get('reference','publisher ar.ref.24k.wav'),steps=48,quality_revision='facts-v2-asr',auditory_review='pending')
 print('Aligned',row['id'],len(cues),'words',flush=True)
(out/('priority.json' if a.priority else 'part-'+str(a.part)+'.json')).write_text(json.dumps(dict(items=items),ensure_ascii=False,indent=2)+'\n')

if rejected:raise SystemExit(str(len(rejected))+' sentences failed independent speech QA; not published')
