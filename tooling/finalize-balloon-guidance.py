"""Reject silent or duplicate alphabet recordings before publishing their manifest."""
import array,hashlib,json,math,pathlib,subprocess
root=pathlib.Path('apps/1-4/balloon-garden')
source=json.loads((root/'data/guidance-scripts.json').read_text());clips={};letter_hashes=set()
for row in source['items']:
 p=root/row['path'];assert p.exists(),str(p)
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(p),'-f','f32le','-ac','1','-ar','24000','-'])
 samples=array.array('f',raw);duration=len(samples)/24000
 assert .15<duration<40,row['path']
 voiced=sum(sum(x*x for x in samples[i:i+480])/len(samples[i:i+480])>.000009 for i in range(0,len(samples),480))*.02
 assert voiced>.15,('Silent recording',row['path'],voiced)
 digest=hashlib.sha256(p.read_bytes()).hexdigest()
 if row['id'].startswith('letter-'):
  assert digest not in letter_hashes,('Duplicate alphabet recording',row['path'])
  letter_hashes.add(digest)
 clips[row['language']+':'+row['id']]={**row,'duration_ms':round(duration*1000),'voiced_ms':round(voiced*1000),'sha256':digest,'engine':'silma','package_version':'1.0.5','model_revision':'226dd7a65cadf51f9a6dbe3953fc89003b3844d5','reference':'publisher bundled ar.ref.24k.wav','auditory_review':'pending'}
(root/'guidance.js').write_text('window.BalloonGardenGuidance='+json.dumps({'schema':1,'clips':clips},ensure_ascii=False,separators=(',',':'))+';\n')
print('Decoded and checked',len(clips),'SILMA clips;',len(letter_hashes),'distinct alphabet recordings')
