"""Build only missing public bilingual clips with the repository's proven SILMA engine."""
from pathlib import Path
import hashlib,json,sys,tempfile
args=sys.argv
root=Path(args[args.index('--root')+1]).resolve()
manifest_index=args.index('--manifest')+1
manifest_path=root/args[manifest_index]
manifest=json.loads(manifest_path.read_text())
proof_path=root/'guidance.js';prior={}
if proof_path.exists():
 raw=proof_path.read_text().split('=',1)[1].strip().removesuffix(';')
 prior=json.loads(raw)['clips']
remaining=[]
for item in manifest['items']:
 target=root/item['path'];proof=prior.get(item['language']+':'+item['id'])
 if proof and proof['text']==item['text'] and target.exists() and hashlib.sha256(target.read_bytes()).hexdigest()==proof['sha256']:continue
 remaining.append(item)
# Each matrix shard is allowed to have no missing clips.
part=int(args[args.index('--part')+1]) if '--part' in args else 0
parts=int(args[args.index('--parts')+1]) if '--parts' in args else 1
if not remaining[part::parts]:print('All recordings in this shard already verified');raise SystemExit(0)
manifest['items']=remaining
with tempfile.TemporaryDirectory() as temporary:
 reduced=Path(temporary)/'missing-clips.json';reduced.write_text(json.dumps(manifest,ensure_ascii=False))
 args[manifest_index]=str(reduced)
 source=Path(__file__).with_name('build-silma-audio.py').read_text()
 needle="if i['language']=='ar' and i.get('engine','silma')=='silma'"
 assert source.count(needle)==1
 source=source.replace(needle,"if i['language'] in ('ar','en') and i.get('engine','silma')=='silma'")
 exec(compile(source,str(Path(__file__).with_name('build-silma-audio.py')),'exec'),{'__name__':'__main__'})
