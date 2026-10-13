"""Generate Arabic sounds in authored carrier words, then crop only the lesson sound.
Separate synthesis and acoustic segmentation keep model memory bounded. A successful
acoustic alignment is evidence for the crop; it is not a human pronunciation review.
"""
import argparse,json,pathlib,time,re,collections,hashlib,subprocess
p=argparse.ArgumentParser();p.add_argument('--root',required=True);p.add_argument('--cache',required=True);p.add_argument('--model');p.add_argument('--vocab');p.add_argument('--vocoder');p.add_argument('--reference');p.add_argument('--reference-text');p.add_argument('--aligner');p.add_argument('--phase',choices=['synth','align'],required=True);p.add_argument('--limit',type=int,default=0);a=p.parse_args();root=pathlib.Path(a.root);cache=pathlib.Path(a.cache);cache.mkdir(parents=True,exist_ok=True)
data=json.loads((root/'phonics-data-v30.js').read_text().split('=',1)[1].rstrip(';\n'));groups=collections.OrderedDict()
for r in data['records']:
 key='-'.join(r['id'].split('-')[:2]);groups.setdefault(key,[]).append(r)
if a.limit:groups=collections.OrderedDict(list(groups.items())[:a.limit])
if a.phase=='synth':
 from silma_phonics_engine import load_engine
 engine=load_engine(a.model,a.vocab,a.vocoder)
 for n,(key,rows) in enumerate(groups.items()):
  words=[];mapping=[];phrases=[]
  for row in rows:
   index=len(words);words.extend(row['carrier'].split());mapping.append(index+row.get('source_word_index',0));phrases.append(row['carrier'])
   if row['stage']=='tanwin':words.append('هُنَا');phrases[-1]+=' هُنَا'
  words.append('هُنَا');phrases.append('هُنَا');text='، '.join(phrases)+'.';fingerprint=hashlib.sha256(('silma-1.0.5|preserve-final-vowel|16|360|'+text).encode()).hexdigest();out=cache/(key+'.wav');meta=cache/(key+'.json')
  if out.exists() and meta.exists() and json.loads(meta.read_text()).get('fingerprint')==fingerprint:continue
  # Include reference frames plus a deliberate phrase duration. No syllable is
  # synthesized at a final-text boundary: the guard word is never shipped.
  generated=1.2+sum(max(.55,len(re.sub('[\u064b-\u0652]','',w))*.13) for w in words)
  duration=4.4+generated
  start=time.time();print('Generating',n+1,len(groups),key,text,flush=True)
  wav,sr,_=engine.infer(ref_file=a.reference,ref_text=a.reference_text,gen_text=text,file_wave=str(out),seed=360,speed=.8,nfe_step=16,fix_duration=duration,force_tashkeel=False,normalize_numbers=False)
  assert sr==24000 and len(wav)/sr>.5
  meta.write_text(json.dumps(dict(key=key,words=words,mapping=mapping,ids=[r['id'] for r in rows],fingerprint=fingerprint,seconds=len(wav)/sr),ensure_ascii=False));print('Generated',key,round(time.time()-start,1),flush=True)
else:
 import torch,torchaudio,soundfile as sf,numpy as np
 from torchaudio.pipelines._wav2vec2 import utils
 from uroman import Uroman
 torch.set_num_threads(6);utils.load_state_dict_from_url=lambda *x,**kw:torch.load(a.aligner,map_location='cpu',weights_only=True);bundle=torchaudio.pipelines.MMS_FA;model=bundle.get_model();model.eval();roman=Uroman();tokenizer=bundle.get_tokenizer();aligner=bundle.get_aligner();reports=[]
 def latin(s):return ''.join(c for c in roman.romanize_string(s).lower() if 'a'<=c<='z')
 def base(s):return re.sub('[\u064b-\u0652]','',s)
 def trim(x):
  energy=np.sqrt(np.convolve(x*x,np.ones(120)/120,mode='same'));active=np.where(energy>max(.0005,float(energy.max())*.005))[0]
  if not len(active):raise ValueError('No audible sound')
  return x[max(0,active[0]-240):min(len(x),active[-1]+481)]
 def word_onset(signal,first,previous,sr):
  lo=max(0,int(max(previous,first-.9)*sr));hi=min(len(signal),int(first*sr));z=signal[lo:hi]
  if len(z)<120:return max(0,first-.06)
  rms=np.sqrt(np.convolve(z*z,np.ones(120)/120,mode='same'));quiet=rms<max(.0005,float(rms.max())*.005);runs=np.diff(np.r_[False,quiet,False].astype(int));starts=np.where(runs==1)[0];ends=np.where(runs==-1)[0];valid=[end for begin,end in zip(starts,ends) if end-begin>=int(.055*sr)]
  return (lo+valid[-1])/sr if valid else max(previous,first-.15)
 for n,(key,rows) in enumerate(groups.items()):
  meta=json.loads((cache/(key+'.json')).read_text());x,sr=sf.read(cache/(key+'.wav'),dtype='float32');tokens=[latin(base(w))+('n' if key.startswith('nun-') and any(c in w for c in 'ًٌٍ') else '') for w in meta['words']]
  assert all(tokens)
  wave=torchaudio.functional.resample(torch.from_numpy(x).unsqueeze(0),sr,bundle.sample_rate)
  with torch.inference_mode():emission,_=model(wave)
  expanded=['*'];
  for item in tokens:expanded.extend([item,'*'])
  aligned=aligner(emission[0],tokenizer(expanded));spans=[aligned[1+2*i] for i in range(len(tokens))];ratio=len(x)/sr/emission.shape[1]
  for row,wi in zip(rows,meta['mapping']):
   s=spans[wi];word=meta['words'][wi];bare=base(word);target_base=base(row['text']);start_char=row.get('source_start',0)
   if row['source_mode']=='suffix':start_char=len(bare.rstrip('ا'))-1 if bare.endswith('ا') else len(bare)-1
   prefix_count=len(latin(bare[:start_char]));target_count=len(latin(base(row['text'])))
   if row['stage']=='short':target_count=len(latin(bare[start_char:start_char+1]))
   if row['stage']=='tanwin':target_count=len(tokens[wi])-prefix_count
   start=s[min(prefix_count,len(s)-1)].start*ratio
   if prefix_count==0:start=word_onset(x,start,spans[wi-1][-1].end*ratio if wi else 0,sr)
   # Ayn is absent from this aligner's roman alphabet. Locate its onset using
   # the preceding word boundary and signal energy instead of inventing a token.
   if not target_count and row['stage']=='short':
    start=word_onset(x,s[0].start*ratio,spans[wi-1][-1].end*ratio if wi else 0,sr);end=s[0].start*ratio
   else:
    after=prefix_count+target_count
    if after<len(s):end=s[after].start*ratio-.008
    else:
     next_start=spans[wi+1][0].start*ratio;end=min(next_start-.02,s[-1].end*ratio+.22)
   if row['id']=='cv-27-1':start=(s[prefix_count].start+s[prefix_count].end)*ratio/2
   if end-start<.08:raise ValueError('Crop too short '+row['id'])
   segment=trim(x[max(0,int((start-.025)*sr)):min(len(x),int(end*sr))]);seconds=len(segment)/sr
   if seconds<.08 or seconds>2.2:raise ValueError('Invalid sound duration '+row['id']+' '+str(seconds))
   segment=segment*(.78/max(.01,float(np.max(np.abs(segment)))));fade=min(int(.003*sr),len(segment)//4);segment[:fade]*=np.linspace(0,1,fade);segment[-fade:]*=np.linspace(1,0,fade);pad=np.zeros(int(.07*sr),dtype='float32');gap=np.zeros(int(.25*sr),dtype='float32');output=np.concatenate([pad,segment,gap,segment,pad]);wav=cache/(row['id']+'.cropped.wav');sf.write(wav,output,sr)
   target=root/'audio/phonics'/ (row['id']+'.mp3');target.parent.mkdir(parents=True,exist_ok=True);subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','48k','-id3v2_version','0',str(target)],check=True)
   scores=[float(q.score) for q in s[max(0,prefix_count):min(len(s),prefix_count+max(1,target_count))]]
   reports.append(dict(id=row['id'],path='audio/phonics/'+row['id']+'.mp3',text=row['spoken']+'، '+row['spoken']+'.',display=row['text'],duration_s=len(output)/sr,source_word=word,source_begin_s=start,source_end_s=end,alignment_mean=sum(scores)/len(scores),sha256=hashlib.sha256(target.read_bytes()).hexdigest(),human_review='pending'))
  print('Segmented',n+1,len(groups),key,flush=True)
 (root/'audio/phonics-validation.json').write_text(json.dumps(dict(engine='SILMA',recordings=len(reports),human_pronunciation_review='pending',method='Authored carrier words, MMS acoustic boundaries, MP3 decoding and hashes',items=reports),ensure_ascii=False,indent=2)+'\n')
 clips={}
 for r in reports:
  c=dict(path=r['path'],text=r['text'],duration_s=r['duration_s'],sha256=r['sha256']);clips['phonics-'+r['id']]=dict(ar=c,en=c)
 code='(function(w){var clips='+json.dumps(clips,ensure_ascii=False,separators=(',',':'))+';for(var k in clips)w.CreativeVoiceMap.clips[k]=clips[k];w.CreativePhonicsVoice={clips:clips};})(window);\n';(root/'phonics-voice-v30.js').write_text(code)
 print('Created',len(reports),'paired phonics clips; human pronunciation review remains pending',flush=True)
