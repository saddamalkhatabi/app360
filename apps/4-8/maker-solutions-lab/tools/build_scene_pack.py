"""Package exactly the scene assets referenced by the authored curriculum."""
import fcntl
import hashlib
import os
import json
import pathlib
import zipfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
content = json.loads((ROOT / 'data/story-content.json').read_text())
paths = set()
for project in content['projects']:
    for scene in project['scenes']:
        paths.add(scene['atlas'])
        paths.update(scene['audio'].values())
        if scene.get('old_audio'):
            paths.add(scene['old_audio'])
assert len(paths) == 204, 'Expected 12 atlases and 192 recordings'
rows = []
archive = ROOT / 'assets/scene-pilot-assets.zip'
lock=(ROOT/'tools/.scene-pack.lock').open('w')
fcntl.flock(lock,fcntl.LOCK_EX)
expected=[{'path':name,'bytes':(ROOT/name).stat().st_size,'sha256':hashlib.sha256((ROOT/name).read_bytes()).hexdigest()} for name in sorted(paths)]
manifest=ROOT/'data/scene-assets.json'
if archive.exists() and manifest.exists() and json.loads(manifest.read_text()).get('files')==expected:
    with zipfile.ZipFile(archive) as previous:
        valid=set(previous.namelist())==paths and all(hashlib.sha256(previous.read(row['path'])).hexdigest()==row['sha256'] for row in expected)
    if valid:
        print('Reused verified scene archive',len(expected),'assets');raise SystemExit(0)
temporary=archive.with_suffix('.zip.tmp')
with zipfile.ZipFile(temporary, 'w', zipfile.ZIP_DEFLATED, compresslevel=9) as output:
    for name in sorted(paths):
        data = (ROOT / name).read_bytes()
        assert len(data) > 1000, name
        rows.append({'path': name, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
        entry = zipfile.ZipInfo(name, (2026, 10, 8, 0, 0, 0))
        entry.compress_type = zipfile.ZIP_DEFLATED
        entry.external_attr = 0o100644 << 16
        output.writestr(entry, data)
assert temporary.stat().st_size <= 25_000_000
assert sum(row['bytes'] for row in rows) <= 25_000_000
os.replace(temporary,archive)
(ROOT / 'data/scene-assets.json').write_text(json.dumps({'schema': 1, 'files': rows}, indent=2) + '\n')
print('Packed', len(rows), 'assets;', archive.stat().st_size, 'archive bytes')
