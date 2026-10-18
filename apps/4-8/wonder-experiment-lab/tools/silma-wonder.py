"""Build/activate all authored Arabic narration atomically on the review branch."""
import hashlib,json,pathlib,shutil,subprocess,sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
mode=sys.argv[1]
manifest=json.loads((ROOT/'data/audio-manifest.json').read_text())
rows=[r for r in manifest['items'] if r['language']=='ar']
groups={}
for r in rows:groups.setdefault(r['text'],[]).append(r)
if mode=='prepare':
 part=int(sys.argv[2]);parts=int(sys.argv[3]); selected=[v[0] for i,v in enumerate(groups.values()) if i%parts==part]
 (ROOT/'data/silma-shard.json').write_text(json.dumps({'items':selected},ensure_ascii=False))
 print('Unique utterances in shard:',len(selected))
elif mode=='pack':
 part=sys.argv[2];out=pathlib.Path('/tmp/wonder-output');(out/'audio').mkdir(parents=True,exist_ok=True);(out/'cues').mkdir(exist_ok=True)
 cues=json.loads((ROOT/'data/silma-shard-cues.json').read_text())['items']
 for p in cues:shutil.copy2(ROOT/p,out/p)
 (out/'cues'/('part-'+part+'.json')).write_text(json.dumps(cues,ensure_ascii=False))
 shutil.copy2(ROOT/'data/silma-shard-report.json',out/'cues'/('report-'+part+'.json'))
elif mode=='activate':
 source=pathlib.Path(sys.argv[2]);allcues={}
 for p in sorted((source/'cues').glob('part-*.json')):allcues.update(json.loads(p.read_text()))
 assert len(allcues)==len(groups),(len(allcues),len(groups))
 old=json.loads((ROOT/'data/read-along.json').read_text());audio=[]
 for variants in groups.values():
  first=variants[0];cue=allcues[first['path']];assert cue['text']==first['text']
  b=(source/first['path']).read_bytes();assert hashlib.sha256(b).hexdigest()==cue['audio_sha256']
  subprocess.run(['ffmpeg','-v','error','-i',str(source/first['path']),'-f','null','-'],check=True)
  for row in variants:
   (ROOT/row['path']).write_bytes(b);old['items'][row['path']]=dict(cue);audio.append({'path':row['path'],'sha256':cue['audio_sha256']})
 manifest['voices']['ar']='SILMA 1.0.5 · publisher reference';manifest['arabic_engine']='silma-tts 1.0.5'
 old['timing_source']='Arabic: measured MMS_FA alignment of SILMA MP3; English: original recording cues'
 (ROOT/'data/audio-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
 (ROOT/'data/read-along.json').write_text(json.dumps(old,ensure_ascii=False,separators=(',',':'))+'\n')
 (ROOT/'data/silma-validation.json').write_text(json.dumps({'engine':'silma-tts 1.0.5','clips':len(audio),'unique_utterances':len(groups),'recordings':audio,'alignment':'MMS_FA measured on actual MP3; not equal word intervals','note':'Decoding/alignment validates files, not human pronunciation review.'},ensure_ascii=False,indent=2)+'\n')
 print('Activated',len(audio),'verified Arabic clips')
else:raise SystemExit('Unknown mode')
