"""Use real SILMA word boundaries for chunks; reuse authored SILMA CV sounds."""
import hashlib,json,pathlib,re,runpy,subprocess,sys,tempfile,shutil
import numpy as np,soundfile as sf,torch,torchaudio
from uroman import Uroman
ROOT=pathlib.Path(__file__).resolve().parents[1];source=pathlib.Path(sys.argv[1])
# gh run download preserves one folder per original artifact; flatten them
# before merging with actions/download-artifact's merge-multiple output.
for artifact in list(source.glob('story-silma-*')):
 if artifact.is_dir():
  shutil.copytree(artifact,source,dirs_exist_ok=True);shutil.rmtree(artifact)
sys.argv=['silma_story.py','inspect'];state=runpy.run_path(str(ROOT/'tools/silma_story.py'));groups=state['groups'];by_path={r['path']:g for g in groups.values() for r in g};data=state['content'];cues={}
for p in (source/'cues').glob('part-*.json'):cues.update(json.loads(p.read_text()))
repo=ROOT.parents[2];shared=repo/'apps/1-4/screen-to-move';pd=json.loads((shared/'phonics-data-v30.js').read_text().split('=',1)[1].rstrip(';\n'));proof=json.loads((shared/'audio/phonics-validation.json').read_text());assert proof['engine']=='SILMA'
cv={r['text']:r['id'] for r in pd['records'] if r['stage']=='short'};proofs={r['id']:r for r in proof['items']};torch.set_num_threads(2)
bundle=torchaudio.pipelines.MMS_FA;acoustic=bundle.get_model();acoustic.eval();tokenizer=bundle.get_tokenizer();aligner=bundle.get_aligner();roman=Uroman();newcues={};metrics=[]
def latin(s):return re.sub('[^a-z]','',roman.romanize_string(s).lower())
def decode(p):
 b=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-ar','24000','-ac','1','-f','f32le','-']);return np.frombuffer(b,dtype=np.float32).copy(),24000

def active(x):
 rms=np.sqrt(np.convolve(x*x,np.ones(120)/120,mode='same'));idx=np.flatnonzero(rms>max(.0005,float(rms.max())*.008));assert len(idx),'Silent crop';return max(0,int(idx[0])-240),min(len(x),int(idx[-1])+481)

def save(path,text,segment,provenance,score):
 a,b=active(segment);segment=segment[a:b];assert .035<len(segment)/24000<3,(text,len(segment)/24000)
 segment=segment*(.78/max(.01,float(np.max(np.abs(segment)))));fade=min(72,len(segment)//4);segment[:fade]*=np.linspace(0,1,fade);segment[-fade:]*=np.linspace(1,0,fade);pad=np.zeros(1680,dtype=np.float32);x=np.concatenate([pad,segment,pad]);target=source/path;target.parent.mkdir(parents=True,exist_ok=True)
 with tempfile.TemporaryDirectory() as t:
  wav=pathlib.Path(t)/'crop.wav';sf.write(wav,x,24000);subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','48k','-write_xing','1','-id3v2_version','0',str(target)],check=True)
 digest=hashlib.sha256(target.read_bytes()).hexdigest();duration=round(len(x)/24);newcues[path]={'text':text,'language':'ar','duration':duration,'cues':[[0,70,round((1680+len(segment))/24)]],'audio_sha256':digest,'timing_source':'Measured cropped SILMA waveform onset/end; '+provenance};metrics.append({'path':path,'mean_alignment_score':score,'duration_ms':duration,'source':provenance});print('SILMA sound:',text,path,flush=True)

for w in data['words'].values():
 if w['language']!='ar':continue
 for units,paths,word_path in [(w['units'],w['unit_audio'],w['audio']),(w['transfer_units'],w['transfer_unit_audio'],w['transfer_audio'])]:
  needed=[i for i,p in enumerate(paths) if by_path[p][0]['path'] not in newcues]
  if not needed:continue
  first=by_path[word_path][0];assert first['path'] in cues,first['path'];wordsource=source/first['path'];x,sr=decode(wordsource)
  tokens=[latin(u) for u in units];assert all(tokens),(units,tokens)
  wave=torchaudio.functional.resample(torch.from_numpy(x).unsqueeze(0),sr,bundle.sample_rate)
  with torch.inference_mode():emission,_=acoustic(wave)
  spans=aligner(emission[0],tokenizer(tokens));ratio=len(x)/sr/emission.shape[1]
  for i in needed:
   path=by_path[paths[i]][0]['path'];text=units[i]
   if text in cv:
    record=proofs[cv[text]];p=shared/record['path'];assert hashlib.sha256(p.read_bytes()).hexdigest()==record['sha256'];signal,_=decode(p)
    # The source teaches the sound twice. Keep exactly its first spoken example.
    energy=np.sqrt(np.convolve(signal*signal,np.ones(240)/240,mode='same'));mask=energy>max(.0005,float(energy.max())*.008);firstactive=int(np.flatnonzero(mask)[0]);quiet=~mask;edges=np.diff(np.r_[False,quiet,False].astype(int));gaps=[a for a,b in zip(np.flatnonzero(edges==1),np.flatnonzero(edges==-1)) if a>firstactive and b-a>=4320];assert gaps,(text,'repeat gap not found');clip=signal[max(0,firstactive-240):gaps[0]];provenance='Existing authored SILMA carrier '+record['source_word']+'; '+record['path'];score=0.0
   else:
    begin=max(0,spans[i][0].start*ratio-.015);end=spans[i+1][0].start*ratio if i+1<len(spans) else min(len(x)/sr,spans[i][-1].end*ratio+.08);assert end>begin,(text,begin,end);clip=x[int(begin*sr):int(end*sr)].copy();score=float(np.mean([s.score for s in spans[i]]));provenance='Acoustic subword crop of '+first['text']+' ('+first['path']+')'
   save(path,text,clip,provenance,score)
# Remove independently synthesized sound examples, including any old bad short clips.
sound_paths={g[0]['path'] for g in groups.values() if g[0]['kind']=='sound-example'};assert sound_paths==set(newcues),(sound_paths-set(newcues),set(newcues)-sound_paths)
for p in (source/'cues').glob('part-*.json'):
 d=json.loads(p.read_text());d={k:v for k,v in d.items() if k not in sound_paths};p.write_text(json.dumps(d,ensure_ascii=False)+'\n')
(source/'cues/part-sounds.json').write_text(json.dumps(newcues,ensure_ascii=False)+'\n');(source/'cues/report-sounds.json').write_text(json.dumps({'clips':metrics},ensure_ascii=False)+'\n')
print('Prepared',len(newcues),'unique cropped SILMA sounds; no standalone-letter synthesis')
