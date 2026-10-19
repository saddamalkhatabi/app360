"""Verify authored assets and generate a reproducible, app-scoped offline pack."""
import hashlib,json,pathlib,subprocess
ROOT=pathlib.Path(__file__).resolve().parents[1]
content=json.loads((ROOT/'data/content.json').read_text())
manifest=json.loads((ROOT/'data/audio-manifest.json').read_text())
settings=json.loads((ROOT/'data/synthesis-settings.json').read_text())
records=[]
for item in manifest['items']:
 p=ROOT/item['path'];assert p.exists(),str(p)
 duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(p)]))
 assert .4<duration<60,(str(p),duration)
 records.append(dict(item,bytes=p.stat().st_size,sha256=hashlib.sha256(p.read_bytes()).hexdigest(),duration_ms=round(duration*1000),precision=settings['precision_by_path'][item['path']],engine_version='silma-tts-1.0.5',model_revision='226dd7a65cadf51f9a6dbe3953fc89003b3844d5'))
for c in content['cases']:
 assert len(c['steps'])==6 and len(c['solutions'])==2
 for key in ['sheet','fallback']:assert (ROOT/c[key]).exists()
 audio_paths={r['path'] for r in records}
 for row in c['steps']+c['solutions']:assert row['audio'] in audio_paths and 0<=row['frame']<8
(ROOT/'data/audio-recordings.json').write_text(json.dumps({'schema':1,'complete':True,'items':records},ensure_ascii=False,indent=2)+'\n')
files=['index.html','styles.css','app.js','src/model.js','data/content.js','data/content.json','data/audio-manifest.json','data/audio-recordings.json','data/read-along.json','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png']
files+=['../../../assets/js/app360-read-along-v1.js','../../../assets/css/app360-read-along-v1.css']
files+=sorted({r['path'] for r in records})+sorted({c[k] for c in content['cases'] for k in ['sheet','fallback']})
for f in files:assert (ROOT/f).exists(),f
digest=hashlib.sha256(b''.join(f.encode()+hashlib.sha256((ROOT/f).read_bytes()).digest() for f in files)).hexdigest()[:16]
meta={'version':digest,'files':files,'bytes':sum((ROOT/f).stat().st_size for f in files)}
(ROOT/'offline-files.js').write_text('self.COOPERATE_OFFLINE='+json.dumps(meta,separators=(',',':'))+';\n')
(ROOT/'data/release-validation.json').write_text(json.dumps({'cases':3,'atlas_frames':24,'journey_stages':21,'arabic_silma_recordings':len(records),'offline_files':len(files),'offline_bytes':meta['bytes'],'version':digest,'human_listening_review':'not performed for every clip','physical_big_tab_test':'not performed','child_trial':'pending user review'},indent=2)+'\n')
print('Release verified:',len(records),'SILMA files;',len(files),'offline assets;',meta['bytes'],'bytes;',digest)
