"""Decode each authored recording and publish exact text, duration and SHA256 proof."""
import hashlib,json,pathlib,subprocess
root=pathlib.Path('apps/1-4/lines-and-houses')
items=json.loads((root/'data/guidance-scripts.json').read_text())['items'];clips={}
for row in items:
 p=root/row['path']
 subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],check=True)
 duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(p)]))
 assert .5<duration<35,(p,duration)
 clips[row['language']+':'+row['id']]={**row,'duration_ms':round(duration*1000),'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
(root/'guidance.js').write_text('window.LinesHousesGuidance='+json.dumps({'schema_version':1,'engine':'silma-tts 1.0.5','model_revision':'226dd7a65cadf51f9a6dbe3953fc89003b3844d5','clips':clips},ensure_ascii=False,separators=(',',':'))+';\n')
print('Decoded and verified',len(clips),'SILMA recordings; listening review remains separate.')
