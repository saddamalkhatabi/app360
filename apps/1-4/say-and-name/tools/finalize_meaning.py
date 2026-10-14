"""Validate artifacts before publishing them, preserving the original word clips."""
import argparse,pathlib,json,hashlib,subprocess,shutil
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser();p.add_argument('--input',required=True);p.add_argument('--partial',action='store_true');a=p.parse_args();source=pathlib.Path(a.input)
manifest=json.loads((ROOT/'data/meaning-scripts-v1.json').read_text());expected={r['id']:r for r in manifest['items']};clips={}
for report in source.glob('*.json'):
 for row in json.loads(report.read_text())['items']:
  cid=row['id'];assert cid in expected and cid not in clips,cid
  wanted=expected[cid]
  for k in ['text','words','path','language','engine']:assert row[k]==wanted[k],(cid,k)
  target=source/row['path'];assert hashlib.sha256(target.read_bytes()).hexdigest()==row['sha256']
  assert row['model_revision']==manifest['model_revision'] and row['steps']==32
  assert len(row['cues'])==len(row['words'])
  for i,(index,start,end) in enumerate(row['cues']):
   assert index==i and 0<=start<end<=row['duration_ms']
   if i:assert row['cues'][i-1][2]<=start
  subprocess.run(['ffmpeg','-v','error','-i',str(target),'-f','null','-'],check=True)
  dest=ROOT/row['path'];dest.parent.mkdir(parents=True,exist_ok=True);shutil.copy2(target,dest);clips[cid]=row
if a.partial:assert set(clips)=={r['id'] for r in manifest['items'][:manifest['priority_count']]}
else:assert set(clips)==set(expected),(len(clips),len(expected))
data=dict(schema=1,expected=len(expected),complete=len(clips)==len(expected),clips=clips)
(ROOT/'data/meaning-audio-v1.js').write_text('window.APP360_MEANING_AUDIO='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
(ROOT/'audio/meaning-validation.json').write_text(json.dumps(dict(engine='silma-tts',model_revision=manifest['model_revision'],ready=len(clips),expected=len(expected),auditory_review='pending',clips=clips),ensure_ascii=False,indent=2)+'\n')
print('Verified actual SILMA recordings',len(clips),'/',len(expected))
