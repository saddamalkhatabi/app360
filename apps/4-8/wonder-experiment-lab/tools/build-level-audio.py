"""Build missing or changed public clips, deduplicating identical recordings.
Usage: python tools/build-level-audio.py /absolute/path/to/recording-cache
Uses the platform's boundary-aware renderer; no child data is sent.
"""
import json,pathlib,subprocess,sys,tempfile,shutil
root=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((root/'data/audio-manifest.json').read_text())
old=json.loads((root/'data/read-along.json').read_text())
pending=[x for x in manifest['items'] if not (root/x['path']).exists() or old['items'].get(x['path'],{}).get('text')!=x['text']]
if not pending:
 print('All authored recordings are current.');sys.exit(0)
unique={};aliases={}
for item in pending:
 key=(item['language'],item['text'])
 if key not in unique:unique[key]=item
 aliases[item['path']]=unique[key]['path']
with tempfile.TemporaryDirectory(prefix='wonder-audio-') as folder:
 stage=pathlib.Path(folder);(stage/'data').mkdir()
 (stage/'data/audio-manifest.json').write_text(json.dumps({**manifest,'items':list(unique.values())},ensure_ascii=False))
 subprocess.run([sys.executable,str(root.parents[2]/'tooling/build-authored-audio.py'),str(stage),sys.argv[1]],check=True)
 new=json.loads((stage/'data/read-along.json').read_text())
 for dest,src in aliases.items():
  shutil.copy2(stage/src,root/dest);old['items'][dest]=new['items'][src]
(root/'data/read-along.json').write_text(json.dumps(old,ensure_ascii=False,separators=(',',':'))+'\n')
print('Merged',len(aliases),'references with actual recording cues.')
