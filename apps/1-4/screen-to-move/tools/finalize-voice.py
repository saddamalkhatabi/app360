"""Decode every real MP3, measure duration, record hashes, and publish browser map."""
import pathlib,json,subprocess,hashlib,os,sys,time
root=pathlib.Path(__file__).resolve().parents[1]
plan=json.loads((root/'audio/voice-plan.json').read_text())
scripts=json.loads((root/'audio/scripts.json').read_text())
numbers={i['path']:i for i in json.loads((root/'audio/numeric-scripts.json').read_text())['items']} if (root/'audio/numeric-scripts.json').exists() else {}
recovered={i['path'] for i in json.loads((root/'audio/recovery-scripts.json').read_text())['items']} if (root/'audio/recovery-scripts.json').exists() else set()
item_recipe={i['path'] for i in json.loads((root/'audio/item-scripts.json').read_text())['items']} if (root/'audio/item-scripts.json').exists() else set()
if os.environ.get('GITHUB_ACTIONS')=='true' and item_recipe:
    for attempt in range(90):
        fetched=subprocess.run(['git','fetch','origin','preview/creative-silma-items-20261011'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        if fetched.returncode==0:
            subprocess.run(['git','checkout','FETCH_HEAD','--']+[str(root/p) for p in sorted(item_recipe)],cwd=root,check=True)
            if all((root/p).is_file() for p in item_recipe):break
        print('Waiting for reusable item-name recordings; completed original clips are preserved.',flush=True)
        time.sleep(30)
    else:raise RuntimeError('Item-name recordings did not finish in time; no incomplete preview will be published')
pronunciation={i['path']:i for i in json.loads((root/'audio/pronunciation-scripts.json').read_text())['items']} if (root/'audio/pronunciation-scripts.json').exists() else {}
if os.environ.get('GITHUB_ACTIONS')=='true' and pronunciation:
    for attempt in range(90):
        fetched=subprocess.run(['git','fetch','origin','preview/creative-silma-pronunciation-20261011'],cwd=root,stdout=subprocess.DEVNULL,stderr=subprocess.DEVNULL)
        if fetched.returncode==0:
            subprocess.run(['git','checkout','FETCH_HEAD','--']+[str(root/p) for p in sorted(pronunciation)],cwd=root,check=True)
            break
        print('Waiting for refined instruction recordings.',flush=True)
        time.sleep(30)
    else:raise RuntimeError('Refined instruction recordings did not finish in time')
records=[]
for item in scripts['items']:
    p=root/item['path']
    assert p.is_file() and p.stat().st_size>1000,item['path']
    subprocess.run(['ffmpeg','-v','error','-i',str(p),'-f','null','-'],check=True)
    duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',str(p)]))
    assert .15<duration<40,(item['path'],duration)
    data=plan['clips'][item['key']]['ar'];data['duration_s']=duration;data['sha256']=hashlib.sha256(p.read_bytes()).hexdigest()
    recipe='audio/pronunciation-scripts.json' if item['path'] in pronunciation else 'audio/item-scripts.json' if item['path'] in item_recipe else 'audio/numeric-scripts.json' if item['path'] in numbers else 'audio/recovery-scripts.json' if item['path'] in recovered else 'audio/scripts.json'
    precision='fp32' if item['path'] in recovered or item['path'] in item_recipe or item['path'] in pronunciation else 'bf16'
    data['spoken_text']=pronunciation[item['path']]['text'] if item['path'] in pronunciation else numbers[item['path']]['text'] if item['path'] in numbers else item['text']
    records.append({'key':item['key'],'path':item['path'],'duration_s':duration,'sha256':data['sha256'],'recipe':recipe,'precision':precision})
(root/'audio/manifest.json').write_text(json.dumps(plan,ensure_ascii=False,indent=2)+'\n')
(root/'voice-map.js').write_text('window.CreativeVoiceMap='+json.dumps(plan,ensure_ascii=False,separators=(',',':'))+';\n')
(root/'audio/build-report.json').write_text(json.dumps({'engine':'SILMA','revision':scripts['revision'],'clips':len(records),'games':len(plan['games']),'verification':'ffmpeg full MP3 decode; ffprobe duration; SHA256','records':records},indent=2)+'\n')
print('Verified',len(records),'SILMA recordings')

if os.environ.get("GITHUB_ACTIONS")=="true":
    subprocess.run([sys.executable,str(root/"tools/run-final-qa.py")],check=True)
