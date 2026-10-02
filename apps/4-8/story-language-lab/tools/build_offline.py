"""Refresh the atomic offline pack from the local audio and picture manifests."""
import json, pathlib, re
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=ROOT/'sw.js'; source=p.read_text()
match=re.search(r'\bCORE=(\[.*?\]);',source,re.S)
core=json.loads(match.group(1))
core=[x for x in core if not x.startswith('audio/')]
data=json.loads((ROOT/'data/stories.json').read_text())
version=str(data.get('library_version',3))
for name in ('styles.css','data/stories.js','src/model.js','src/audio.js','app.js'):
 core=[name+'?v='+version if x.split('?')[0]==name else x for x in core]
for name in ('app360-family-sync-v1.js','app360-family-core-v2.js','app360-family-catalog-v1.js','app360-family-shell-v1.js','app360-family-shell-viewport-fix-v1.js','app360-ai-shell.js'):
 core=[re.sub(r'v=\d+','v=103',x) if name in x else x for x in core]
core += ['../../../assets/js/app360-family-catalog-v1.js?v=103&brand=98',
         '../../../data/catalog.json?v=98','../../../data/live-overrides.json?v=98']
manifest=json.loads((ROOT/'data/audio-manifest.json').read_text())
for scene in data['scenes'].values():
 for name in ('sheet','small_sheet','fallback_sheet','large_fallback_sheet'):
  if scene.get(name):core.append(scene[name])
for word in data['words'].values():
 if word.get('image'):core.append(word['image'])
core=list(dict.fromkeys(core+[x['path'] for x in manifest['items']]))
source=source[:match.start(1)]+json.dumps(core,separators=(',',':'))+source[match.end(1):]
source=re.sub(r'a4-story-language-preview-\d+','a4-story-language-preview-'+version,source)
p.write_text(source)
print(json.dumps({'offline_assets':len(core),'audio_clips':len(manifest['items'])}))
