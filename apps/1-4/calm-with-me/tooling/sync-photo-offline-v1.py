#!/usr/bin/env python3
"""Refresh only a1-calm offline entries after installing WebP emotions.
Does not alter catalogs or assets belonging to other apps.
"""
from pathlib import Path
import json,hashlib
APP = 'a1-calm'
ROOT = Path(__file__).resolve().parents[4]
PREFIX = 'apps/1-4/calm-with-me/'
MANIFEST = ROOT/'data/offline/a1-calm.json'
CATALOG = ROOT/'data/offline-catalog.json'
app_dir = ROOT/PREFIX
photos = [f'assets/images/emotions/{id}-{size}.webp' for id in ('happy','sad','afraid','angry') for size in (320,512)]
stems = ['gentle_closeness_mom_daughter','happy_hug_mom_daughter','warm_hug_mom_daughter','reading_corner_child','read_story_with_mom','drink_water_child','teddy_comfort_child','walk_with_mom','sequence_learning_with_mom','sit_together_mom_child']
photos += [f'assets/images/what-to-try/{name}-{size}.webp' for name in stems for size in (320,512)]
new_stems = ['need-help','water-now','quiet','ball','wait']
photos += [f'assets/images/what-to-try/{name}-{size}.webp' for name in new_stems for size in (320,512)]
important = [
 'index.html','simple-mode-v12.js','simple-mode-v12-original.js',
 'calm-bilingual-voice-v1.js','calm-child-experience-v2.css',
 'calm-photo-emotions-v1.js','calm-photo-helps-v1.js','age-content-v8.js'
] + photos

def digest(path):
    b=path.read_bytes()
    return {'bytes':len(b),'sha256':hashlib.sha256(b).hexdigest()}

def read(path):
    return json.loads(path.read_text(encoding='utf-8'))

def dump(path,obj):
    path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

manifest=read(MANIFEST)
catalog=read(CATALOG)
assert manifest['id']==APP
rows={row['path']:dict(row) for row in manifest['files']}
for local in important:
    file=app_dir/local
    assert file.is_file(),str(file)
    data=file.read_bytes()
    if local.endswith('.webp'):
        assert data[:4]==b'RIFF' and data[8:12]==b'WEBP',file
        assert 5000<len(data)<300000,(file,len(data))
    rows[PREFIX+local]={'path':PREFIX+local,**digest(file)}
manifest['files']=sorted(rows.values(),key=lambda x:x['path'])
key='\n'.join(row['path']+':'+row['sha256'] for row in manifest['files'])
old_version=manifest.get('version')
version=hashlib.sha256(key.encode('utf-8')).hexdigest()[:16]
manifest['version']=version
matches=[item for item in catalog.get('apps',[]) if item.get('id')==APP]
assert len(matches)==1
row=matches[0]
if row.get('version')!=version:
    try:row['release']=str(int(row.get('release') or '0')+1)
    except ValueError:pass
row['version']=version
row['bytes']=sum(int(a['bytes']) for a in manifest['files'])
row['count']=len(manifest['files'])
dump(MANIFEST,manifest)
dump(CATALOG,catalog)
print('Refreshed only',APP,'from',old_version,'to',version,'files',row['count'],'bytes',row['bytes'])
