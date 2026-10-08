"""Validate and unpack the approved small asset bundle inside this app only."""
import hashlib, json, pathlib, zipfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
archive=ROOT/'assets/scene-pilot-assets.zip'
manifest=json.loads((ROOT/'data/scene-assets.json').read_text())
assert archive.stat().st_size<=25_000_000, 'Archive exceeds 25 MB'
expected={row['path']:row for row in manifest['files']}
assert len(expected)==52
with zipfile.ZipFile(archive) as z:
 assert len(z.infolist())==len(expected) and set(z.namelist())==set(expected), 'Unexpected archive entries'
 assert sum(i.file_size for i in z.infolist())<=25_000_000
 verified=[]
 for name in z.namelist():
  p=pathlib.PurePosixPath(name)
  assert not p.is_absolute() and '..' not in p.parts
  assert name.startswith('assets/scenes/') or name.startswith(('audio/ar/scene-','audio/en/scene-'))
  data=z.read(name);row=expected[name]
  assert len(data)==row['bytes'] and hashlib.sha256(data).hexdigest()==row['sha256'],name
  verified.append((name,data))
 # Validate everything before writing anything.
 for name,data in verified:
  target=ROOT/name;target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data)
print('Unpacked and verified',len(verified),'assets;',archive.stat().st_size,'archive bytes')
