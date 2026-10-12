import pathlib,json,subprocess,hashlib
r=pathlib.Path(__file__).resolve().parents[1];items=json.loads((r/'audio/learning-scripts.json').read_text())['items'];clips={}
for row in items:
 p=r/row['path'];assert p.is_file() and p.stat().st_size>800,p
 subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],check=True)
 duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(p)]));assert .15<duration<40,(p,duration)
 clips.setdefault(row['key'],{})[row['language']]=dict(path=row['path'],text=row['text'],engine='SILMA',duration_s=duration,sha256=hashlib.sha256(p.read_bytes()).hexdigest())
assert all('ar' in c and 'en' in c for c in clips.values())
(r/'learning-voice-map-v28.js').write_text('window.CreativeLearningVoice='+json.dumps(dict(clips=clips),ensure_ascii=False,separators=(',',':'))+';\n')
(r/'audio/learning-validation.json').write_text(json.dumps(dict(engine='SILMA',recordings=len(items),paired_clips=len(clips),checks=['Every MP3 decoded by FFmpeg','Duration bounds','SHA256','Arabic and English for every clip']),indent=2)+'\n')
print('Verified',len(items),'learning recordings')
