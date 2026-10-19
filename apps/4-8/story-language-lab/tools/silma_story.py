"""Record candidates and activate only a complete, hash-verified audio/cue set."""
import asyncio,hashlib,json,pathlib,shutil,subprocess,sys,tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
TARGET=ROOT/'tools/silma-target'
plan=json.loads((TARGET/'plan.json').read_text())
content=json.loads((ROOT/'data/stories.json').read_text())
content['guides'].update(plan['guides'])
for story in content['stories']:story['meaning_feedback']=plan['meaning_feedback'][story['id']]
manifest=json.loads((ROOT/'data/audio-manifest.json').read_text())
jobs={i['path']:i for i in manifest['items']}
for guides in plan['guides'].values():
 for lang,g in guides.items():jobs[g['audio']]={'path':g['audio'],'language':lang,'text':g['text'],'kind':'narration'}
for story in content['stories']:
 if story['language']=='ar':
  g=story['meaning_feedback'];jobs[g['audio']]={'path':g['audio'],'language':'ar','text':g['text'],'kind':'meaning-feedback'}
for r in plan['reserved']:jobs[r['path']]=r
for row in jobs.values():
 if row['language']=='ar':row['engine']='silma'
manifest['items']=list(jobs.values())
rows=[r for r in manifest['items'] if r['language']=='ar'];groups={}
for r in rows:groups.setdefault(r['text'],[]).append(r)
def write(p,x):p.parent.mkdir(parents=True,exist_ok=True);p.write_text(json.dumps(x,ensure_ascii=False,separators=(',',':'))+'\n')
def shard(path):
 h=5381
 for c in path:h=(h*33+ord(c))&0xffffffff
 return h%4
mode=sys.argv[1]
if mode=='prepare':
 part,parts=map(int,sys.argv[2:4]);selected=[v[0] for i,v in enumerate(groups.values()) if i%parts==part and not ('--narration-only' in sys.argv and v[0]['kind']=='sound-example')]
 write(ROOT/'data/silma-shard.json',{'items':selected});print('Unique utterances:',len(selected))
elif mode=='pack':
 part=sys.argv[2];out=pathlib.Path('/tmp/story-output');cues=json.loads((ROOT/'data/silma-shard-cues.json').read_text())['items']
 for p in cues:(out/p).parent.mkdir(parents=True,exist_ok=True);shutil.copy2(ROOT/p,out/p)
 write(out/'cues'/('part-'+part+'.json'),cues)
 shutil.copy2(ROOT/'data/silma-shard-report.json',out/'cues'/('report-'+part+'.json'))
elif mode=='english':
 import edge_tts
 from build_read_along import process
 old={i['path']:i for i in json.loads((ROOT/'data/audio-manifest.json').read_text())['items']};out=pathlib.Path('/tmp/story-output');cues={}
 async def record():
  for r in manifest['items']:
   if r['language']!='en' or (r['path'] in old and old[r['path']]['text']==r['text']):continue
   for attempt in range(4):
    try:
     with tempfile.TemporaryDirectory() as t:
      audio=pathlib.Path(t)/'source.mp3';meta=pathlib.Path(t)/'events.jsonl'
      await edge_tts.Communicate(r['text'],'en-US-JennyNeural',rate='-15%',boundary='WordBoundary').save(str(audio),str(meta))
      b,report=process(audio,meta,r['text']);p=out/r['path'];p.parent.mkdir(parents=True,exist_ok=True);p.write_bytes(b)
      cues[r['path']]={'text':r['text'],'language':'en','duration':report['duration'],'cues':report['cues'],'audio_sha256':hashlib.sha256(b).hexdigest()}
     break
    except Exception:
     if attempt==3:raise
     await asyncio.sleep(2+attempt)
 asyncio.run(record());write(out/'cues/english.json',cues)
elif mode=='activate':
 source=pathlib.Path(sys.argv[2]);allcues={}
 for p in sorted((source/'cues').glob('part-*.json')):
  for k,v in json.loads(p.read_text()).items():assert k not in allcues;allcues[k]=v
 assert len(allcues)==len(groups),(len(allcues),len(groups))
 metrics={m['path']:m for p in sorted((source/'cues').glob('report-*.json')) for m in json.loads(p.read_text())['clips']}
 assert len(metrics)==len(groups)
 cues={k:v for p in (ROOT/'data/read-along').glob('*.json') for k,v in json.loads(p.read_text())['items'].items()};payloads={};records=[]
 for variants in groups.values():
  first=variants[0];entry=allcues[first['path']];assert entry['text']==first['text'];p=source/first['path'];b=p.read_bytes();assert hashlib.sha256(b).hexdigest()==entry['audio_sha256']
  subprocess.run(['ffmpeg','-v','error','-xerror','-i',str(p),'-f','null','-'],check=True)
  for r in variants:payloads[r['path']]=b;cues[r['path']]=dict(entry);records.append({'path':r['path'],'sha256':entry['audio_sha256'],'mean_alignment_score':metrics[first['path']]['mean_alignment_score']})
 english=json.loads((source/'cues/english.json').read_text());old={i['path']:i for i in json.loads((ROOT/'data/audio-manifest.json').read_text())['items']}
 for r in manifest['items']:
  if r['language']=='en' and (r['path'] not in old or old[r['path']]['text']!=r['text']):
   entry=english[r['path']];b=(source/r['path']).read_bytes();assert hashlib.sha256(b).hexdigest()==entry['audio_sha256'];payloads[r['path']]=b;cues[r['path']]=entry
 for row in manifest['items']:
  entry=cues[row['path']];assert entry['text']==row['text'];assert len(entry['cues'])==len(row['text'].split()),row
  previous=-1
  for i,a,b in entry['cues']:assert 0<=i<len(row['text'].split()) and previous<=a<b<=entry['duration']+1;previous=a
 # Mutate runtime only after every candidate has passed all checks.
 for p,b in payloads.items():(ROOT/p).write_bytes(b)
 write(ROOT/'data/stories.json',content)
 (ROOT/'data/stories.js').write_text('window.STORY_DATA='+json.dumps(content,ensure_ascii=False,separators=(',',':'))+';\n')
 shutil.copy2(TARGET/'app.js',ROOT/'app.js')
 manifest['narrators']={'ar':'SILMA 1.0.5; publisher reference','en':'Existing Jenny narration; new guides Kokoro af_heart'}
 manifest['sound_engine']='Arabic SILMA 1.0.5; English existing eSpeak phonetic examples.'
 write(ROOT/'data/audio-manifest.json',manifest)
 for lang in ['ar','en']:
  for n in range(4):write(ROOT/f'data/read-along/{lang}-{n}.json',{'version':7,'items':{k:v for k,v in cues.items() if v['language']==lang and shard(k)==n}})
 write(ROOT/'data/silma-validation.json',{'engine':'silma-tts 1.0.5','model_revision':'226dd7a65cadf51f9a6dbe3953fc89003b3844d5','clips':len(rows),'unique_utterances':len(groups),'records':records,'review_candidates':[m for m in metrics.values() if m['mean_alignment_score']<.65],'note':'Decoding and measured alignment do not establish human pronunciation accuracy. Short isolated sounds require listening review.'})
 p=ROOT/'index.html';p.write_text(p.read_text().replace('stories.js?v=6','stories.js?v=silma7').replace('app.js?v=6','app.js?v=silma7'))
 # Update only this app's explicit-download bundle; leave other apps untouched.
 repo=ROOT.parents[2];bundle_path=repo/'data/offline/a4-story-language.json';bundle=json.loads(bundle_path.read_text());paths={r['path'] for r in bundle['files']};prefix='apps/4-8/story-language-lab/'
 for r in manifest['items']:paths.add(prefix+r['path'])
 paths.update(prefix+'data/'+n for n in ['coach-audio-prepared.json','silma-validation.json'])
 updated=[]
 for p in sorted(paths):
  local=repo/p
  if local.exists():
   b=local.read_bytes();updated.append({'path':p,'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()})
  else:updated.append(next(r for r in bundle['files'] if r['path']==p))
 bundle['files']=updated;bundle['version']=hashlib.sha256(json.dumps(updated,separators=(',',':')).encode()).hexdigest()[:16];write(bundle_path,bundle)
 catalog_path=repo/'data/offline-catalog.json';catalog=json.loads(catalog_path.read_text())
 for r in catalog['apps']:
  if r['id']=='a4-story-language':r.update(version=bundle['version'],bytes=sum(f['bytes'] for f in updated),count=len(updated))
 write(catalog_path,catalog);print('Activated verified SILMA clips:',len(rows))
elif mode=='inspect':pass
else:raise SystemExit('Unknown mode')
