"""Only activate the new player after every exact SILMA recording decodes."""
import hashlib,json,subprocess
from prepare_silma import ROOT,load
manifest=load();records={}
(ROOT/'audio/silma-scripts.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
for file in (ROOT/'audio/silma').glob('part-*.json'):
 for row in json.loads(file.read_text())['items']:
  assert row['path'] not in records,row['path']
  records[row['path']]=row
assert set(records)=={r['path'] for r in manifest['items']},'Incomplete recording set'
words={};senses={};guides={};spoken={};clips=[]
for row in manifest['items']:
 assert records[row['path']]['text']==row['text'],'Stale repeated recording: '+row['key']
 path=ROOT/row['path'];assert path.is_file() and path.stat().st_size>900,row['path']
 assert hashlib.sha256(path.read_bytes()).hexdigest()==records[row['path']]['sha256']
 info=json.loads(subprocess.check_output(['ffprobe','-v','error','-show_format','-show_streams','-of','json',str(path)]))
 stream=info['streams'][0];seconds=float(info['format']['duration'])
 assert stream['codec_name']=='mp3' and int(stream['sample_rate'])==24000 and stream['channels']==1 and .25<seconds<40
 subprocess.run(['ffmpeg','-v','error','-i',str(path),'-f','null','-'],check=True)
 table={'word':words,'sense':senses,'guide':guides}[row['kind']];table[row['key']]=row['path'];spoken[row['key']]=row['spoken']
 clips.append(dict(key=row['key'],path=row['path'],text=row['text'],duration_s=seconds,sha256=records[row['path']]['sha256']))
# Replace shared legacy files only after the complete bundle passes validation.
import re,shutil
for row in manifest['items']:
 if row['kind'] not in ('word','sense'):continue
 mapfile=ROOT/('data/audio-map.js' if row['kind']=='word' else 'data/audio-sense-map.js')
 legacy=json.loads(re.search(r'=(\{.*\});',mapfile.read_text()).group(1))
 old=legacy.get(row['key'])
 if old:
  destination=ROOT/old;destination.parent.mkdir(parents=True,exist_ok=True);shutil.copyfile(ROOT/row['path'],destination)
code='window.APP360_SILMA='+json.dumps(dict(version=27,words=words,senses=senses,guides=guides,spoken=spoken),ensure_ascii=False,separators=(',',':'))+';\n'
(ROOT/'data/silma-map.js').write_text(code)
(ROOT/'audio/silma-validation.json').write_text(json.dumps(dict(engine='silma-tts',package_version='1.0.5',words=len(words),senses=len(senses),guides=len(guides),actual_audio_review='pending',verification='Complete authored coverage; MP3 decoding, duration, exact SHA256',clips=clips),ensure_ascii=False,indent=2)+'\n')
p=ROOT/'index.html';text=p.read_text().replace('runtime-v19.js?v=26','runtime-v27.js?v=27')
if 'data/silma-map.js?v=27' not in text:text=text.replace('<script src="runtime-v27.js','<script src="data/silma-map.js?v=27"></script>\n<script src="runtime-v27.js')
if 'id="childAudioHelpBtn"' not in text:text=text.replace('<button id="helpBtn"','<button id="childAudioHelpBtn" class="help-btn" type="button">🔊 <span data-i18n="audioHelp">اسمع طريقة اللعب</span></button>\n          <button id="helpBtn"')
if 'id="categoryAudioHelpBtn"' not in text:text=text.replace('<h3 data-i18n="categories">التصنيفات</h3>', '<h3 data-i18n="categories">التصنيفات</h3><button id="categoryAudioHelpBtn" class="quiet-btn" type="button" aria-label="اسمع طريقة اختيار المجموعة">🔊</button>')
text=text.replace('v=26','v=27');p.write_text(text)
p=ROOT/'styles-v19.css';p.write_text(p.read_text()+'\n/* Recorded vocabulary listening cue */\n.stage.is-speaking .picture-button{outline:5px solid #22b893;outline-offset:-5px}.stage.is-speaking .word-copy{background:#e2fbef;border-radius:18px}.sound-button[aria-pressed="true"]{background:#087e68;color:#fff}\n')
print('Validated and activated',len(clips),'actual SILMA recordings')
