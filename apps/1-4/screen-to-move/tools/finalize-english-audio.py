"""Validate every English MP3 before activating bilingual playback."""
import json,pathlib,subprocess,hashlib,re,os
root=pathlib.Path(__file__).resolve().parents[1]
plan=json.loads((root/'audio/manifest.json').read_text())
items=json.loads((root/'audio/english-scripts.json').read_text())['items']
assert len(items)==len(plan['clips'])==974
if os.environ.get('GITHUB_ACTIONS')=='true':
    subprocess.run(['git','fetch','origin','audio/creative-en-clarity-20261012'],cwd=root,check=True)
    for key in [items[14]['path'],items[46]['path']]:
        subprocess.run(['git','checkout','FETCH_HEAD','--',str(root/key)],cwd=root,check=True)
records=[]
for item in items:
    p=root/item['path']
    assert p.is_file() and p.stat().st_size>1000,p
    subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],check=True)
    duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(p)]))
    assert .15<duration<40,(p,duration)
    clip={'path':item['path'],'text':item['text'],'spoken_text':item['text'],'engine':'SILMA','duration_s':duration,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()}
    plan['clips'][item['key']]['en']=clip
    normalized=re.sub(r'[.!؟،,:;]+$','',re.sub(r'\s+',' ',item['text'])).strip()
    plan['lookup'].setdefault(normalized,item['key'])
    records.append(dict(key=item['key'],**clip))
plan['languages']=['ar','en']
(root/'audio/manifest.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
(root/'voice-map.js').write_text('window.CreativeVoiceMap='+json.dumps(plan,ensure_ascii=False,separators=(',',':'))+';\n')
(root/'recorded-voice-v19.js').write_text((root/'tools/recorded-voice-bilingual.js').read_text())
(root/'audio/english-build-report.json').write_text(json.dumps({'engine':'SILMA','language':'en','clips':len(records),'games':len(plan['games']),'verification':'full FFmpeg decode, duration and SHA256 for every MP3','records':records},indent=2)+'\n')
page=root/'index.html'
page.write_text(page.read_text().replace('voice-map.js?v=1','voice-map.js?v=20').replace('recorded-voice-v19.js?v=1','recorded-voice-v19.js?v=20'))
if os.environ.get('GITHUB_ACTIONS')=='true':
    subprocess.run(['git','add',str(page)],cwd=root,check=True)
print('Verified and enabled',len(records),'English SILMA clips',flush=True)
