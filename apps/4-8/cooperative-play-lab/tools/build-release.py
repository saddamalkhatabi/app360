"""Validate every bilingual transcript, actual MP3 and word cue; build small core + case packs."""
import argparse,hashlib,json,pathlib,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1]
parser=argparse.ArgumentParser();parser.add_argument('--draft',action='store_true');args=parser.parse_args()
content=json.loads((ROOT/'data/content.json').read_text());manifest=json.loads((ROOT/'data/audio-manifest.json').read_text())
assert len(content['cases'])==60
frames=json.loads((ROOT/'data/scene-frames.json').read_text())
assert set(frames['frames'])=={c['id'] for c in content['cases']}
for c in content['cases']:
 assert frames['atlas_sha256'][c['id']]==hashlib.sha256((ROOT/c['fallback']).read_bytes()).hexdigest(),c['id']
 boxes=frames['frames'][c['id']];assert len(boxes)==8
 for x,y,width,height in boxes:assert 0<=x<x+width<=1080 and 0<=y<y+height<=1440 and width>400 and height>250,(c['id'],x,y,width,height)

assert len(manifest['items'])==860
for track in ['entry','practice','extend']:assert sum(c['track']==track for c in content['cases'])==20
cue_sets={}
for lang in ['ar','en']:
 p=ROOT/('data/read-along-'+lang+'.json');cue_sets[lang]=json.loads(p.read_text())['items'] if p.exists() else {}
records=[];missing=[];bytes_total=0
audio_present=sum((ROOT/i['path']).exists() for i in manifest['items'])
for item in manifest['items']:
 p=ROOT/item['path'];cue=cue_sets[item['language']].get(item['path'])
 if not p.exists() or not cue:
  missing.append(item['path']);continue
 assert cue['text']==item['text'],item['path']
 sha=hashlib.sha256(p.read_bytes()).hexdigest()
 assert cue.get('audio_sha256',sha)==sha,item['path']
 duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(p)]))
 assert .4<duration<60,(item['path'],duration)
 assert cue['cues'] and all(0<=i<len(item['text'].split()) and 0<=a<b<=cue['duration'] for i,a,b in cue['cues']),item['path']
 assert all(cue['cues'][n][2]<=cue['cues'][n+1][1] for n in range(len(cue['cues'])-1)),item['path']
 record=dict(item,bytes=p.stat().st_size,sha256=sha,duration_ms=round(duration*1000))
 records.append(record);bytes_total+=p.stat().st_size
for c in content['cases']:
 for p in [c['sheet'],c['fallback'],'assets/'+c['id']+'-cover.webp','assets/'+c['id']+'-cover.jpg']:
  if not(ROOT/p).exists():missing.append(p)
 for lang in ['ar','en']:
  v=c if lang=='ar' else c['i18n']['en']
  assert len(v['steps'])==6 and len(v['solutions'])==2 and len(v['needs'])==2
  for r in v['steps']+v['solutions']:
   assert 0<=r['frame']<8
   assert any(m['path']==r['audio'] and m['text']==r['text'] and m['language']==lang for m in manifest['items'])
if missing and not args.draft:raise SystemExit('Incomplete release: '+str(len(missing))+' missing audio/cue/image items; first: '+', '.join(missing[:8]))
core=['data/scene-frames.js','index.html','styles.css','app.js','src/model.js','src/teacher.js','data/content.js','data/content.json','data/audio-manifest.json','data/read-along-ar.json','data/read-along-en.json','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png']
core+=['../../../assets/js/'+s for s in ['app360-read-along-v1.js','app360-session-v1.js','teacher-encouragement-v1.js','app360-ai-shell.js','app360-access-v1.js']]
core+=['../../../assets/css/app360-read-along-v1.css','../../../assets/ui-icons/family-teacher.svg','../../../resources/celebration-audio/names.json']
core+=['../../../resources/celebration-audio/audio/'+p for p in ['ar/well-done-m.mp3','ar/well-done-name-m.mp3','ar/well-done-name-f.mp3','en/well-done-en.mp3']]
core+=['assets/'+c['id']+'-cover.'+s for c in content['cases'] for s in ['webp','jpg']]
core+=sorted({v['audio'] for key in ['common','common_en'] for v in content[key].values()})
if args.draft:core=[p for p in core if(ROOT/p).exists()]
else:
 for p in core:assert(ROOT/p).exists(),p
packs={'ar':{},'en':{}}
for lang in ['ar','en']:
 for c in content['cases']:
  v=c if lang=='ar' else c['i18n']['en'];files=sorted({c['sheet'],c['fallback']}|{r['audio'] for r in v['steps']+v['solutions']})
  # Never label an incomplete draft pack as available offline.
  if not args.draft or all((ROOT/p).exists() for p in files) and all(r['audio'] in cue_sets[lang] for r in v['steps']+v['solutions']):
   packs[lang][c['id']]=files
files=sorted(set(core)|{p for group in packs.values() for rows in group.values() for p in rows})
digest=hashlib.sha256(b''.join(p.encode()+hashlib.sha256((ROOT/p).read_bytes()).digest() for p in files)).hexdigest()[:16]
meta={'version':digest,'core':core,'packs':packs,'levels':{track:[c['id'] for c in content['cases'] if c['track']==track] for track in ['entry','practice','extend']},'core_bytes':sum((ROOT/p).stat().st_size for p in core),'bytes':sum((ROOT/p).stat().st_size for p in files)}
(ROOT/'offline-files.js').write_text('self.COOPERATE_OFFLINE='+json.dumps(meta,separators=(',',':'))+';\n')
(ROOT/'data/audio-recordings.json').write_text(json.dumps({'schema':2,'complete':not missing,'items':records},ensure_ascii=False,indent=2)+'\n')
(ROOT/'data/release-validation.json').write_text(json.dumps({'complete':not missing,'draft_only':args.draft,'cases':60,'per_level':20,'languages':['ar','en'],'expected_recordings':860,'available_recordings':audio_present,'missing_recordings':860-audio_present,'verified_recordings':len(records),'missing_count':len(missing),'recordings_by_language':{lang:{'expected':430,'available':sum((ROOT/i['path']).exists() for i in manifest['items'] if i['language']==lang),'verified_with_cues':sum(i['language']==lang for i in records)} for lang in ['ar','en']},'atlas_frames':480,'practice_stages':420,'core_bytes':meta['core_bytes'],'all_pack_bytes':meta['bytes'],'version':digest,'human_listening_review':'not performed for every clip','physical_old_tablet_test':'not performed','child_observation':'pending user review'},indent=2)+'\n')
print(json.dumps({'complete':not missing,'clips':len(records),'missing':len(missing),'core_bytes':meta['core_bytes'],'total_bytes':meta['bytes'],'version':digest}))
