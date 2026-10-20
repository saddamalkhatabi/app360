"""Refresh only the cooperative app's portal download bundle; preserve its tested worker."""
import hashlib, json, pathlib, re

ROOT = pathlib.Path(__file__).resolve().parents[1]
APP = 'apps/4-8/cooperative-play-lab'
EXCLUDED = {'test', 'tests', 'tools', 'tooling', 'node_modules', '.git'}

def runtime(path):
    rel = path.relative_to(ROOT)
    return (not EXCLUDED.intersection(rel.parts)
            and path.suffix.lower() in {'.html', '.js', '.css', '.json', '.webmanifest', '.svg', '.png', '.jpg', '.jpeg', '.webp', '.mp3', '.wav', '.ogg', '.woff', '.woff2', '.ttf'}
            and not re.search(r'CONTENT_SEEDS|package(?:-lock)?\.json|validation|silma-batch-reports|pending-ar|narration-repair', str(rel)))

files = set()
for directory in [APP, 'assets/js', 'assets/css', 'assets/brand', 'assets/vendor', 'assets/fonts', 'assets/ui-icons', 'packages']:
    files.update(p for p in (ROOT/directory).rglob('*') if p.is_file() and runtime(p))
for path in ['index.html','manifest.webmanifest','data/catalog.json','data/goals.json','data/live-overrides.json','data/public-links.json','links.html','resources/celebration-audio/names.json']:
    files.add(ROOT/path)
for path in ['ar/well-done-m.mp3','ar/well-done-name-m.mp3','ar/well-done-name-f.mp3','en/well-done-en.mp3']:
    files.add(ROOT/'resources/celebration-audio/audio'/path)
catalog = json.loads((ROOT/'data/catalog.json').read_text())
card = next(a for a in catalog['apps'] if a['id'] == 'a4-cooperate')
for key in ['cover','cover_fallback','cover_small','cover_small_fallback']:
    files.add(ROOT/card[key])
records = []
for p in sorted(files):
    data = p.read_bytes()
    records.append({'path': str(p.relative_to(ROOT)), 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
version = hashlib.sha256(json.dumps(records, separators=(',',':')).encode()).hexdigest()[:16]
bundle = {'schema':1,'id':'a4-cooperate','version':version,'files':records}
(ROOT/'data/offline/a4-cooperate.json').write_text(json.dumps(bundle, separators=(',',':'))+'\n')
portal = json.loads((ROOT/'data/offline-catalog.json').read_text())
portal['apps'] = [a for a in portal['apps'] if a['id'] != 'a4-cooperate']
portal['apps'].append({'id':'a4-cooperate','title':card['title_ar'],'age':'4-8','entry':APP+'/index.html','directory':APP+'/','version':version,'release':'4','bytes':sum(r['bytes'] for r in records),'count':len(records),'manifest':'data/offline/a4-cooperate.json','required':False,'minimumVersion':None,'updateNote':'60 موقفًا و860 تسجيلًا عربيًا وإنجليزيًا مع المدربة وتتبّع الكلمات.','networkNote':'المحتوى والصوت المسجل متاحان دون اتصال بعد اكتمال التنزيل؛ مزامنة الأسرة تحتاج اتصالًا.'})
(ROOT/'data/offline-catalog.json').write_text(json.dumps(portal,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'app':'a4-cooperate','version':version,'files':len(records),'bytes':sum(r['bytes'] for r in records)}))
