"""Publish only exact-manifest MP3 recordings and measured scene cuts."""
import argparse,hashlib,json,pathlib,shutil,subprocess
p=argparse.ArgumentParser();p.add_argument('--input',required=True);a=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[1];src=pathlib.Path(a.input)
manifest=json.loads((root/'audio/islamic-scripts-v1.json').read_text());expected={r['id']:r for r in manifest['items']};rows={}
for part in src.glob('part-*.json'):
 for row in json.loads(part.read_text())['items']:
  assert row['id'] not in rows,row['id'];rows[row['id']]=row
assert set(rows)==set(expected),(len(rows),len(expected))
result=dict(schema=1,model_revision=manifest['model_revision'],auditory_review='pending',clips={},habits=dict(ar={},en={}))
for id,row in rows.items():
 e=expected[id];assert all(row[k]==e[k] for k in ['text','path','language']),id
 path=src/row['path'];assert path.exists() and hashlib.sha256(path.read_bytes()).hexdigest()==row['sha256'],id
 probe=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_entries','stream=codec_name:format=duration','-of','json',str(path)]))
 assert probe['streams'][0]['codec_name']=='mp3'
 assert abs(float(probe['format']['duration'])*1000-row['duration_ms'])<120,id
 assert row['cues'] and all(0<=x[1]<x[2]<=row['duration_ms'] for x in row['cues']),id
 entry={k:row[k] for k in ['path','text','language','duration_ms','sha256','cues','alignment_score']};entry['verified']=True
 if e.get('habit'):
  segments=[];pos=0;cue_map={x[0]:x[1] for x in row['cues']}
  for s in e['segments']:
   ends=pos+len(s['text'].split());starts=[cue_map[i] for i in range(pos,ends) if i in cue_map];assert starts,(id,pos)
   segments.append(dict(s,start_ms=starts[0]));pos=ends
  assert pos==len(e['text'].split())
  for i,s in enumerate(segments):
   s['end_ms']=segments[i+1]['start_ms'] if i+1<len(segments) else row['duration_ms'];assert s['end_ms']>s['start_ms'],id
  entry.update(title=e['title'],steps=e['steps'],segments=segments)
  result['habits'][e['language']][e['habit']]=entry
 result['clips'][id]=entry
 target=root/row['path'];target.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(path,target)
(root/'audio/islamic-recordings-v1.js').write_text('window.APP360_ISLAMIC_AUDIO = '+json.dumps(result,ensure_ascii=False,separators=(',',':'))+';\n')
print('Published exact recorded clips:',len(result['clips']))
