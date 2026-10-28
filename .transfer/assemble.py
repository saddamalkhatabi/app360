"""Temporary GitHub branch assembler. Inputs contain public source/content only."""
from pathlib import Path,PurePosixPath
import base64,hashlib,io,json,tarfile
root=Path.cwd().resolve();transfer=root/'.transfer';bundle=json.loads((transfer/'bundle.json').read_text('utf8'));paths=[]
for group,manifest in bundle.items():
 assert group in {'source','seeds','school'}
 packed=b''.join(base64.b64decode((transfer/group/f'{i:04}.b64').read_bytes(),validate=True) for i in range(manifest['parts']))
 assert len(packed)==manifest['bytes'] and hashlib.sha256(packed).hexdigest()==manifest['sha256'],'Archive checksum mismatch'
 expected={item['path']:item for item in manifest['files']};seen=set()
 with tarfile.open(fileobj=io.BytesIO(packed),mode='r:gz') as archive:
  for member in archive:
   name=member.name;p=PurePosixPath(name)
   assert member.isfile() and name in expected and name not in seen
   assert not p.is_absolute() and '..' not in p.parts and '\\' not in name
   assert not any(x in p.parts for x in ['.git','.github','.transfer','node_modules','.local-postgres','private'])
   assert p.name!='.env' and '.private.' not in p.name
   target=(root/name).resolve();assert target.is_relative_to(root)
   data=archive.extractfile(member).read();entry=expected[name]
   assert len(data)==entry['bytes'] and hashlib.sha256(data).hexdigest()==entry['sha256'],'File checksum mismatch'
   target.parent.mkdir(parents=True,exist_ok=True);target.write_bytes(data);seen.add(name);paths.append(name)
 assert seen==set(expected),'Missing archive files'
print(json.dumps({'verified_files':len(paths),'groups':list(bundle)}))
(transfer/'tracked-paths').write_bytes(b'\0'.join(p.encode('utf8') for p in paths)+b'\0')
