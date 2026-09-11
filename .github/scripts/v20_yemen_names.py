from pathlib import Path
import asyncio, base64, json, subprocess, shutil, re

ROOT = Path('1-4')
AUDIO = ROOT / 'audio'
REG_PATH = AUDIO / 'registry.json'

# 20 common Yemeni/Arabic male names selected for the children's app.
NAMES = [
    ('محمد','mohammed',['Mohammed','Mohammad','Mohamed','Muhammad']),
    ('أحمد','ahmed',['Ahmed','Ahmad']),
    ('عبدالله','abdullah',['Abdullah','Abdallah','Abd Allah']),
    ('عبدالرحمن','abdulrahman',['Abdulrahman','Abdul Rahman','Abdelrahman','Abdurrahman']),
    ('علي','ali',['Ali']),
    ('يوسف','yousef',['Yousef','Yusuf','Youssef','Yousuf']),
    ('عبدالملك','abdulmalik',['Abdulmalik','Abdul Malik','Abdelmalek','Abdel Malik']),
    ('صدام','saddam',['Saddam']),
    ('غيث','ghaith',['Ghaith','Gaith','Ghayth']),
    ('صالح','saleh',['Saleh','Salih']),
    ('يحيى','yahya',['Yahya','Yehya']),
    ('إبراهيم','ibrahim',['Ibrahim','Ebrahim']),
    ('عمر','omar',['Omar','Umar']),
    ('خالد','khaled',['Khaled','Khalid']),
    ('حسن','hassan',['Hassan','Hasan']),
    ('حسين','hussein',['Hussein','Hussain','Husayn']),
    ('عبدالعزيز','abdulaziz',['Abdulaziz','Abdul Aziz','Abdelaziz']),
    ('حمزة','hamza',['Hamza']),
    ('معاذ','moaz',['Moaz','Muadh','Muath','Moaaz']),
    ('عمار','ammar',['Ammar']),
]

PHRASES = [
    ('test','test',lambda n:f'مرحبا يا {n}، هذا اختبار للصوت المسجل'),
    ('cheer-01','cheer',lambda n:f'أحسنت يا {n}'),
    ('cheer-02','cheer',lambda n:f'رائع يا {n}'),
    ('cheer-03','cheer',lambda n:f'ممتاز يا {n}'),
    ('cheer-04','cheer',lambda n:f'استمر يا {n}'),
    ('cheer-05','cheer',lambda n:f'أبدعت يا {n}'),
]

VOICE_CANDIDATES = ['ar-YE-SalehNeural','ar-SA-HamedNeural','ar-EG-ShakirNeural']

async def synth_one(text, voice, out):
    import edge_tts
    c = edge_tts.Communicate(text, voice, rate='-8%', volume='+0%')
    await c.save(str(out))

async def choose_voice(tmp):
    for voice in VOICE_CANDIDATES:
        try:
            await synth_one('أحسنت', voice, tmp)
            if tmp.exists() and tmp.stat().st_size > 500:
                tmp.unlink(missing_ok=True)
                return voice
        except Exception:
            tmp.unlink(missing_ok=True)
    raise RuntimeError('No Arabic male Edge TTS voice was available')

def convert_formats(mp3, ogg, wav):
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(mp3),'-ac','1','-ar','22050','-c:a','libvorbis','-q:a','4',str(ogg)],check=True)
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(mp3),'-ac','1','-ar','22050','-c:a','pcm_s16le',str(wav)],check=True)

def pcm_b64(src):
    data = subprocess.check_output(['ffmpeg','-v','error','-i',str(src),'-ac','1','-ar','16000','-f','u8','-'])
    return base64.b64encode(data).decode('ascii')

def aliases_for_phrase(name, alias_names, text, kind):
    out=[]
    if kind=='test':
        out += [f'مرحبا يا {name} هذا اختبار للصوت المسجل', f'مرحبا يا {name} هذا اختبار للصوت العربي']
    for a in alias_names:
        if kind=='test': out.append(f'مرحبا يا {a} هذا اختبار للصوت المسجل')
    return out

async def main():
    reg=json.loads(REG_PATH.read_text(encoding='utf-8'))
    reg.setdefault('voices',{})['yemen_male_names']={
        'engine':'Microsoft Neural via edge-tts',
        'preferred_voice':'ar-YE-SalehNeural',
        'fallback_voices':['ar-SA-HamedNeural','ar-EG-ShakirNeural'],
        'style':'warm male Arabic for children'
    }
    reg['version']=20
    reg['common_male_names_yemen']=[n for n,_,_ in NAMES]
    reg.setdefault('users',{})
    names_root=AUDIO/'names'; names_root.mkdir(parents=True,exist_ok=True)
    pcm_root=AUDIO/'pcm'; pcm_root.mkdir(parents=True,exist_ok=True)
    tmp=AUDIO/'_voice_probe.mp3'
    voice=await choose_voice(tmp)
    print('Using voice:',voice)

    for name,slug,aliases in NAMES:
        folder=names_root/slug; folder.mkdir(parents=True,exist_ok=True)
        clips=[]; pcm_clips={}
        for cid,kind,make_text in PHRASES:
            text=make_text(name)
            mp3=folder/(cid+'.mp3'); ogg=folder/(cid+'.ogg'); wav=folder/(cid+'.wav')
            if not mp3.exists() or mp3.stat().st_size < 500:
                await synth_one(text,voice,mp3)
            convert_formats(mp3,ogg,wav)
            key=slug+':'+cid
            pcm_clips[key]=pcm_b64(wav)
            clips.append({
                'id':cid,
                'kind':kind,
                'text':text,
                'aliases':aliases_for_phrase(name,aliases,text,kind),
                'file':f'audio/names/{slug}/{cid}.mp3',
                'files':{
                    'mp3':f'audio/names/{slug}/{cid}.mp3',
                    'ogg':f'audio/names/{slug}/{cid}.ogg',
                    'wav':f'audio/names/{slug}/{cid}.wav'
                },
                'pcmKey':key,
                'pcmPack':slug,
                'pcmScript':f'audio/pcm/{slug}.js'
            })
        pack="window.Audio360PCMPacks=window.Audio360PCMPacks||{};window.Audio360PCMPacks[%s]=%s;\n" % (
            json.dumps(slug,ensure_ascii=False),
            json.dumps({'rate':16000,'format':'u8-mono','clips':pcm_clips},ensure_ascii=False,separators=(',',':'))
        )
        (pcm_root/(slug+'.js')).write_text(pack,encoding='utf-8')
        reg['users'][name]={
            'aliases':aliases+[a.lower() for a in aliases],
            'gender':'boy',
            'folder':f'audio/names/{slug}',
            'slug':slug,
            'pcm_script':f'audio/pcm/{slug}.js',
            'clips':clips
        }

    reg.setdefault('compatibility',{})['dynamic_pcm_name_packs']=True
    reg['compatibility']['name_pack_strategy']='load only the selected user PCM pack on old browsers, then MP3/OGG/WAV fallbacks'
    REG_PATH.write_text(json.dumps(reg,ensure_ascii=False,indent=2),encoding='utf-8')

    # Build V20 engine from V18 with lazy per-name PCM loading.
    src=(ROOT/'audio-v18.js').read_text(encoding='utf-8')
    src=src.replace("var BUILD='18'","var BUILD='20'",1)
    old="function playEmbedded(c,onDone){var ac=ensureCtx(),pack=window.Audio360PCM,b64=pack&&pack.clips&&pack.clips[c&&c.id],raw,buf,data,src,i,rate;if(!ac||!b64||!window.atob)return false;try{unlockCtx();raw=atob(b64);rate=parseInt(pack.rate,10)||16000;buf=ac.createBuffer(1,raw.length,rate);data=buf.getChannelData(0);for(i=0;i<raw.length;i++)data[i]=(raw.charCodeAt(i)-128)/128;src=ac.createBufferSource();currentSource=src;src.buffer=buf;src.connect(ac.destination);src.onended=function(){if(currentSource===src)currentSource=null;if(onDone)onDone(true,'embedded-pcm')};if(src.start)src.start(0);else if(src.noteOn)src.noteOn(0);setStatus(c.kind==='color'?'🔊 نطق اللون من التسجيل الداخلي':'🔊 الصوت المسجل الداخلي يعمل');return true}catch(e){if(onDone)onDone(false,'embedded-error');return false}}"
    new="""var pcmLoads={};
function pcmPack(c){var packs=window.Audio360PCMPacks||{},p=c&&c.pcmPack;if(p&&packs[p])return packs[p];return window.Audio360PCM||null}
function loadPcmPack(c,cb){var url=c&&c.pcmScript;if(!url){cb(false);return false}var packs=window.Audio360PCMPacks||{};if(c.pcmPack&&packs[c.pcmPack]){cb(true);return true}if(pcmLoads[url]){pcmLoads[url].push(cb);return true}pcmLoads[url]=[cb];try{var s=document.createElement('script');s.type='text/javascript';s.src=fileUrl(url);s.onload=function(){var a=pcmLoads[url]||[];delete pcmLoads[url];for(var i=0;i<a.length;i++)a[i](true)};s.onerror=function(){var a=pcmLoads[url]||[];delete pcmLoads[url];for(var i=0;i<a.length;i++)a[i](false)};(document.getElementsByTagName('head')[0]||document.body).appendChild(s);return true}catch(e){var a=pcmLoads[url]||[];delete pcmLoads[url];for(var i=0;i<a.length;i++)a[i](false);return false}}
function playEmbedded(c,onDone){var ac=ensureCtx(),pack=pcmPack(c),key=(c&&c.pcmKey)|| (c&&c.id),b64=pack&&pack.clips&&pack.clips[key],raw,buf,data,src,i,rate;if(!b64&&c&&c.pcmScript){loadPcmPack(c,function(ok){if(ok)playEmbedded(c,onDone);else if(onDone)onDone(false,'pcm-pack-load-failed')});return true}if(!ac||!b64||!window.atob)return false;try{unlockCtx();raw=atob(b64);rate=parseInt(pack.rate,10)||16000;buf=ac.createBuffer(1,raw.length,rate);data=buf.getChannelData(0);for(i=0;i<raw.length;i++)data[i]=(raw.charCodeAt(i)-128)/128;src=ac.createBufferSource();currentSource=src;src.buffer=buf;src.connect(ac.destination);src.onended=function(){if(currentSource===src)currentSource=null;if(onDone)onDone(true,'embedded-pcm')};if(src.start)src.start(0);else if(src.noteOn)src.noteOn(0);setStatus(c.kind==='color'?'🔊 نطق اللون من التسجيل الداخلي':'🔊 الصوت المسجل الداخلي يعمل');return true}catch(e){if(onDone)onDone(false,'embedded-error');return false}}"""
    if old not in src:
        raise RuntimeError('Could not find V18 playEmbedded function')
    src=src.replace(old,new,1)
    src=src.replace('audio/registry.json?v=18','audio/registry.json?v=20')
    (ROOT/'audio-v20.js').write_text(src,encoding='utf-8')

    idx=ROOT/'index.html'
    h=idx.read_text(encoding='utf-8')
    h=h.replace('لوحة الطفل - امسك القلم وارسم v19','لوحة الطفل - امسك القلم وارسم v20')
    h=h.replace('var LOCAL=19','var LOCAL=20')
    h=h.replace('<script src="audio-v18.js?v=18"></script>','<script src="audio-v20.js?v=20"></script>')
    idx.write_text(h,encoding='utf-8')

    vp=ROOT/'version.json'; v=json.loads(vp.read_text(encoding='utf-8'))
    v['build']=20; v['updated']='2026-09-11'; v['audioPack']='20-yemeni-male-names+noor+colors-v20';
    v['audioEngine']='V20 lazy per-name embedded PCM + WebAudio/HTMLAudio/TTS fallbacks'
    v['maleNamePacks']=20
    vp.write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8')

    sw=ROOT/'sw.js'; t=sw.read_text(encoding='utf-8')
    t=re.sub(r"var CACHE='app360-1-4-v\d+'","var CACHE='app360-1-4-v20'",t,1)
    t=t.replace("'./audio-v18.js?v=18'","'./audio-v20.js?v=20'")
    t=t.replace("u.indexOf('/1-4/audio-v18.js')>=0","u.indexOf('/1-4/audio-v20.js')>=0")
    sw.write_text(t,encoding='utf-8')

    print('Generated',len(NAMES),'male name packs with',len(PHRASES),'clips each')

asyncio.run(main())
