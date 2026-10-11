"""Compile a checked, local-only bilingual recording map from recovered SILMA files."""
import pathlib,json,hashlib,subprocess,argparse
from concurrent.futures import ThreadPoolExecutor
parser=argparse.ArgumentParser();parser.add_argument('--root',required=True);parser.add_argument('--transcripts',required=True);args=parser.parse_args();r=pathlib.Path(args.root);p=r/'apps/1-4/imitate-one-step';source=p/'tools/voice-sources';plan=json.loads((source/'recovery-plan.json').read_text());checkpoint=json.loads((p/'tools/voice-checkpoint/checkpoint.json').read_text());recovered={i['restore_path']:i for i in checkpoint['files']};report={}
for f in source.glob('recovery-build-report*.json'):report.update(json.loads(f.read_text()))
transcripts=json.loads(pathlib.Path(args.transcripts).read_text());old=json.loads((p/'audio/manifest.json').read_text());texts={}
for key,langs in old['clips'].items():
 for lang,v in langs.items():texts[(key,lang)]=(v['path'],v['text'])
for item in plan['items']:texts[(item['key'],item['language'])]=(str(pathlib.Path(item['path']).relative_to(p.relative_to(r))),item['text'])
es=json.loads((p/'experiences.json').read_text())['experiences']
for e in es:
 for lang in ['ar','en']:
  dest=f'audio/{lang}/experiences/{e["id"]}.mp3'
  if (f'exp-{e["id"]}',lang) not in texts:
   text=e['title'] if lang=='ar' else transcripts.get(dest,'').strip()
   assert text,('Missing English title caption',e['id']);texts[(f'exp-{e["id"]}',lang)]=(dest,text)
def measure(relative):
 f=p/relative;assert f.exists(),f
 return relative,float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','csv=p=0',str(f)],text=True))
with ThreadPoolExecutor(max_workers=8) as pool:durations=dict(pool.map(measure,[v[0] for v in texts.values()]))
m={'schema':2,'engine':'SILMA','model':'silma-ai/silma-tts','revision':plan['revision'],'scope':'200 experience titles, five scene instructions per experience, and child play prompts in Arabic and English. Caption wording may be abbreviated.','clips':{},'experiences':{}}
for (key,lang),(relative,text) in texts.items():
 f=p/relative;assert f.exists(),f
 full=str(f.relative_to(r));b=f.read_bytes();duration=durations[relative];assert .16<duration<60,(relative,duration)
 if full in report:
  assert report[full]['sha256']==hashlib.sha256(b).hexdigest(),('Synthesis report/file mismatch',full)
  text=report[full]['text'];origin={'synthesis':report[full]}
 elif full in recovered:
  assert hashlib.sha1(('blob %d\0'%len(b)).encode()+b).hexdigest()==recovered[full]['blob_sha'],('Recovered recording changed',full)
  origin={'checkpoint_blob_sha':recovered[full]['blob_sha']}
 else:raise AssertionError(('No SILMA provenance',full))
 m['clips'].setdefault(key,{})[lang]={'path':relative,'text':text,'duration_s':round(duration,3),'sha256':hashlib.sha256(b).hexdigest(),'engine':'SILMA',**origin}
assert len(m['clips'])==258
for e in es:
 frames=[a[:] for a in plan['experience_frames'][e['id']]];frames[1].insert(0,'exp-'+e['id']);m['experiences'][e['id']]={'title':'exp-'+e['id'],'frames':frames}
 for frame in frames:
  for key in frame:assert key in m['clips']
assert all(set(v)=={'ar','en'} for v in m['clips'].values())
(p/'audio/manifest.json').write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n');(p/'voice-map.js').write_text('window.A1RecordedVoiceMap='+json.dumps(m,ensure_ascii=False,separators=(',',':'))+';\n')
(source/'recovery-build-report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
(source/'english-title-caption-transcripts.json').write_text(json.dumps(transcripts,ensure_ascii=False,indent=2)+'\n')
print('Finalized',len(m['clips'])*2,'verified recordings and',len(m['experiences']),'five-frame experiences')
