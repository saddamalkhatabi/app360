"""Generate missing, exact SILMA clips; upload only this shard's changed files."""
from pathlib import Path
import hashlib,json,os,shutil,sys,tempfile
args=sys.argv
root=Path(args[args.index('--root')+1]).resolve()
manifest_index=args.index('--manifest')+1
manifest_path=root/args[manifest_index]
manifest=json.loads(manifest_path.read_text());prior={}
proof_path=root/'guidance.js'
if proof_path.exists():prior=json.loads(proof_path.read_text().split('=',1)[1].strip().removesuffix(';'))['clips']
remaining=[]
for item in manifest['items']:
 target=root/item['path'];proof=prior.get(item['language']+':'+item['id'])
 exact=proof and proof['text']==item['text'] and target.exists() and hashlib.sha256(target.read_bytes()).hexdigest()==proof['sha256']
 if exact and (not item['id'].startswith('letter-') or proof.get('speech_qa',{}).get('passed') is True):continue
 remaining.append(item)
part=int(args[args.index('--part')+1]) if '--part' in args else 0
parts=int(args[args.index('--parts')+1]) if '--parts' in args else 1
selected=remaining[part::parts]
if '--plan-only' in args:
 if os.environ.get('GITHUB_OUTPUT'):
  with open(os.environ['GITHUB_OUTPUT'],'a') as f:f.write('needed='+str(bool(selected)).lower()+'\n')
 print('Missing clips in shard',part,len(selected));raise SystemExit(0)
if not selected:print('All recordings in this shard already verified');raise SystemExit(0)
manifest['items']=remaining
with tempfile.TemporaryDirectory() as temporary:
 reduced=Path(temporary)/'missing-clips.json';reduced.write_text(json.dumps(manifest,ensure_ascii=False));args[manifest_index]=str(reduced)
 source=Path(__file__).with_name('build-silma-audio.py').read_text();needle="if i['language']=='ar' and i.get('engine','silma')=='silma'"
 assert source.count(needle)==1
 source=source.replace(needle,"if i['language'] in ('ar','en') and i.get('engine','silma')=='silma'")
 try:exec(compile(source,str(Path(__file__).with_name('build-silma-audio.py')),'exec'),{'__name__':'__main__'})
 except SystemExit as e:
  if e.code not in (None,0):raise
for row in selected:
 target=Path('/tmp/balloon-guidance-artifact')/Path(row['path']).relative_to('audio/guide')
 target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(root/row['path'],target)
