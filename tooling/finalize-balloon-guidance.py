"""Decode every generated guide before publishing an exact recording manifest."""
import hashlib,json,pathlib,subprocess
root=pathlib.Path('apps/1-4/balloon-garden');source=json.loads((root/'data/guidance-scripts.json').read_text());clips={}
for row in source['items']:
 p=root/row['path'];assert p.exists(),str(p)
 subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],check=True)
 duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(p)]))
 assert .15<duration<40,row['path']
 clips[row['language']+':'+row['id']]={**row,'duration_ms':round(duration*1000),'sha256':hashlib.sha256(p.read_bytes()).hexdigest(),'engine':'silma','package_version':'1.0.5','model_revision':'226dd7a65cadf51f9a6dbe3953fc89003b3844d5','reference':'publisher bundled ar.ref.24k.wav'}
(root/'guidance.js').write_text('window.BalloonGardenGuidance='+json.dumps({'schema':1,'clips':clips},ensure_ascii=False,separators=(',',':'))+';\n')
print('Verified',len(clips),'bilingual SILMA guide recordings')
