from pathlib import Path
import json, subprocess, base64

root=Path('1-4')
reg=json.loads((root/'audio/registry.json').read_text(encoding='utf-8'))
clips={}

def pcm_b64(src):
    data=subprocess.check_output(['ffmpeg','-v','error','-i',str(src),'-ac','1','-ar','16000','-f','u8','-'])
    return base64.b64encode(data).decode('ascii')

user=reg['users']['نور']
for c in user.get('clips',[]):
    clips[c['id']]=pcm_b64(root / c['files']['wav'])
for c in reg.get('colors',[]):
    clips[c['id']]=pcm_b64(root / c['files']['wav'])

pack='window.Audio360PCM='+json.dumps({'rate':16000,'format':'u8-mono','clips':clips},ensure_ascii=False,separators=(',',':'))+';\n'
(root/'audio-pcm-v18.js').write_text(pack,encoding='utf-8')

s=(root/'audio-v17.js').read_text(encoding='utf-8')
s=s.replace("var BUILD='17'","var BUILD='18'",1)
marker="function playClip(c,onDone){if(!c)return false;stopRecorded();if(isLegacy()){if(playWebAudio(c,function(ok,why){if(ok){if(onDone)onDone(true,why)}else playHtmlAudio(c,onDone)}))return true;return playHtmlAudio(c,onDone)}if(playHtmlAudio(c,function(ok,why){if(ok){if(onDone)onDone(true,why)}else playWebAudio(c,onDone)}))return true;return playWebAudio(c,onDone)}"
replacement="""function playEmbedded(c,onDone){var ac=ensureCtx(),pack=window.Audio360PCM,b64=pack&&pack.clips&&pack.clips[c&&c.id],raw,buf,data,src,i,rate;if(!ac||!b64||!window.atob)return false;try{unlockCtx();raw=atob(b64);rate=parseInt(pack.rate,10)||16000;buf=ac.createBuffer(1,raw.length,rate);data=buf.getChannelData(0);for(i=0;i<raw.length;i++)data[i]=(raw.charCodeAt(i)-128)/128;src=ac.createBufferSource();currentSource=src;src.buffer=buf;src.connect(ac.destination);src.onended=function(){if(currentSource===src)currentSource=null;if(onDone)onDone(true,'embedded-pcm')};if(src.start)src.start(0);else if(src.noteOn)src.noteOn(0);setStatus(c.kind==='color'?'🔊 نطق اللون من التسجيل الداخلي':'🔊 الصوت المسجل الداخلي يعمل');return true}catch(e){if(onDone)onDone(false,'embedded-error');return false}}
function playClip(c,onDone){if(!c)return false;stopRecorded();if(isLegacy()){if(playEmbedded(c,function(ok,why){if(ok){if(onDone)onDone(true,why)}else if(playWebAudio(c,function(ok2,why2){if(ok2){if(onDone)onDone(true,why2)}else playHtmlAudio(c,onDone)})){}else playHtmlAudio(c,onDone)}))return true;if(playWebAudio(c,function(ok,why){if(ok){if(onDone)onDone(true,why)}else playHtmlAudio(c,onDone)}))return true;return playHtmlAudio(c,onDone)}if(playHtmlAudio(c,function(ok,why){if(ok){if(onDone)onDone(true,why)}else if(playWebAudio(c,function(ok2,why2){if(ok2){if(onDone)onDone(true,why2)}else playEmbedded(c,onDone)})){}else playEmbedded(c,onDone)}))return true;if(playWebAudio(c,function(ok,why){if(ok){if(onDone)onDone(true,why)}else playEmbedded(c,onDone)}))return true;return playEmbedded(c,onDone)}"""
if marker not in s:
    raise SystemExit('playClip marker not found')
s=s.replace(marker,replacement,1)
s=s.replace('تم اكتشاف جهاز قديم؛ سيستخدم التطبيق WebAudio وصيغة WAV/MP3 المسجلة تلقائياً.','تم اكتشاف جهاز قديم؛ سيستخدم التطبيق التسجيل الداخلي PCM عبر WebAudio أولاً بدون الاعتماد على ترميز MP3 أو WAV في المتصفح.')
(root/'audio-v18.js').write_text(s,encoding='utf-8')

idx=root/'index.html'
h=idx.read_text(encoding='utf-8')
h=h.replace('لوحة الطفل - امسك القلم وارسم v17','لوحة الطفل - امسك القلم وارسم v18')
h=h.replace('var LOCAL=17','var LOCAL=18')
h=h.replace('<script src="audio-v17.js?v=17"></script>','<script src="audio-pcm-v18.js?v=18"></script>\n<script src="audio-v18.js?v=18"></script>')
idx.write_text(h,encoding='utf-8')

(root/'version.json').write_text(json.dumps({
    'build':18,
    'updated':'2026-09-11',
    'audioPack':'noor+colors-v18-embedded-pcm',
    'legacyAudio':['embedded-u8-pcm','mp3','ogg','wav'],
    'audioEngine':'V18 embedded PCM via WebAudio, then decodeAudioData/HTMLAudio fallbacks',
    'refreshPolicy':'upgrade-only, one automatic refresh per target build'
},ensure_ascii=False,indent=2),encoding='utf-8')

sw=root/'sw.js'
t=sw.read_text(encoding='utf-8')
t=t.replace("var CACHE='app360-1-4-v17'","var CACHE='app360-1-4-v18'")
t=t.replace("'./audio-v17.js?v=17'","'./audio-pcm-v18.js?v=18','./audio-v18.js?v=18'")
t=t.replace("u.indexOf('/1-4/audio-v17.js')>=0","u.indexOf('/1-4/audio-v18.js')>=0||u.indexOf('/1-4/audio-pcm-v18.js')>=0")
sw.write_text(t,encoding='utf-8')

assert len(pack)>100000
print('generated',len(pack),'bytes embedded PCM')
