"""Decode every real MP3, measure duration, record hashes, and publish browser map."""
import pathlib,json,subprocess,hashlib
root=pathlib.Path(__file__).resolve().parents[1]
plan=json.loads((root/'audio/voice-plan.json').read_text())
scripts=json.loads((root/'audio/scripts.json').read_text())
records=[]
for item in scripts['items']:
    p=root/item['path']
    assert p.is_file() and p.stat().st_size>1000,item['path']
    subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],check=True)
    duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(p)]))
    assert .15<duration<40,(item['path'],duration)
    data=plan['clips'][item['key']]['ar'];data['duration_s']=duration;data['sha256']=hashlib.sha256(p.read_bytes()).hexdigest()
    records.append({'key':item['key'],'path':item['path'],'duration_s':duration,'sha256':data['sha256']})
(root/'audio/manifest.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
(root/'voice-map.js').write_text('window.CreativeVoiceMap='+json.dumps(plan,ensure_ascii=False,separators=(',',':'))+';\n')
(root/'audio/build-report.json').write_text(json.dumps({'engine':'SILMA','revision':scripts['revision'],'clips':len(records),'games':len(plan['games']),'verification':'ffmpeg full MP3 decode; ffprobe duration; SHA256','records':records},indent=2)+'\n')
print('Verified',len(records),'SILMA recordings')
