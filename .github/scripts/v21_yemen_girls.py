from pathlib import Path
import asyncio, base64, json, subprocess, re

ROOT = Path('1-4')
AUDIO = ROOT / 'audio'
REG_PATH = AUDIO / 'registry.json'

# 20 Arabic/Yemeni girl names for the children's app.
# Includes the names explicitly requested by the project owner.
NAMES = [
    ('سيدرا','sidra',['Sidra','Sedra','Sydra']),
    ('ميلا','mila',['Mila','Milla']),
    ('لين','leen',['Leen','Lyn','Lynn']),
    ('ليان','layan',['Layan','Lian','Liaan']),
    ('وتين','wateen',['Wateen','Watin','Wateen']),
    ('مريم','maryam',['Maryam','Mariam','Meryem']),
    ('فاطمة','fatima',['Fatima','Fatimah','Fatma']),
    ('سارة','sara',['Sara','Sarah']),
    ('آية','aya',['Aya','Ayah']),
    ('جنى','jana',['Jana','Janna']),
    ('ملك','malak',['Malak','Malek']),
    ('ريم','reem',['Reem','Rim']),
    ('رنيم','raneem',['Raneem','Ranim']),
    ('شهد','shahd',['Shahd','Shad']),
    ('رهف','rahaf',['Rahaf']),
    ('ريتال','rital',['Rital','Retal']),
    ('تالا','tala',['Tala']),
    ('يارا','yara',['Yara']),
    ('حلا','hala',['Hala']),
    ('لانا','lana',['Lana']),
]

# Match the exact spoken phrases used by the girl's encouragement engine in index.html.
PHRASES = [
    ('test','test',lambda n:f'مرحبا يا {n}، هذا اختبار للصوت المسجل'),
    ('cheer-01','cheer',lambda n:f'أحسنتي يا {n}'),
    ('cheer-02','cheer',lambda n:f'رائع يا {n}'),
    ('cheer-03','cheer',lambda n:f'ممتاز يا {n}'),
    ('cheer-04','cheer',lambda n:f'عمل جميل يا {n}'),
    ('cheer-05','cheer',lambda n:f'استمري يا {n}'),
    ('cheer-06','cheer',lambda n:f'أبدعتي يا {n}'),
    ('cheer-07','cheer',lambda n:f'محاولة جميلة يا {n}'),
    ('cheer-08','cheer',lambda n:f'تقدم رائع يا {n}'),
]

VOICE_CANDIDATES = ['ar-YE-MaryamNeural','ar-SA-ZariyahNeural','ar-EG-SalmaNeural']

async def synth_one(text, voice, out):
    import edge_tts
    c = edge_tts.Communicate(text, voice, rate='-8%', volume='+0%')
    await c.save(str(out))

async def choose_voice(tmp):
    for voice in VOICE_CANDIDATES:
        try:
            await synth_one('أحسنتي', voice, tmp)
            if tmp.exists() and tmp.stat().st_size > 500:
                tmp.unlink(missing_ok=True)
                return voice
        except Exception:
            tmp.unlink(missing_ok=True)
    raise RuntimeError('No Arabic female Edge TTS voice was available')

def convert_formats(mp3, ogg, wav):
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(mp3),'-ac','1','-ar','22050','-c:a','libvorbis','-q:a','4',str(ogg)],check=True)
    subprocess.run(['ffmpeg','-y','-v','error','-i',str(mp3),'-ac','1','-ar','22050','-c:a','pcm_s16le',str(wav)],check=True)

def pcm_b64(src):
    data = subprocess.check_output(['ffmpeg','-v','error','-i',str(src),'-ac','1','-ar','16000','-f','u8','-'])
    return base64.b64encode(data).decode('ascii')

def aliases_for_phrase(name, alias_names, kind, cid):
    out=[]
    if kind=='test':
        out += [
            f'مرحبا يا {name} هذا اختبار للصوت المسجل',
            f'مرحبا يا {name} هذا اختبار للصوت العربي'
        ]
        for a in alias_names:
            out.append(f'مرحبا يا {a} هذا اختبار للصوت المسجل')
    if cid=='cheer-01': out += [f'أحسنتِ يا {name}', f'أحسنت يا {name}']
    if cid=='cheer-02': out += [f'رائعة يا {name}']
    if cid=='cheer-06': out += [f'أبدعتِ يا {name}', f'أبدعت يا {name}']
    return out

async def main():
    reg=json.loads(REG_PATH.read_text(encoding='utf-8'))
    reg.setdefault('voices',{})['yemen_female_names']={
        'engine':'Microsoft Neural via edge-tts',
        'preferred_voice':'ar-YE-MaryamNeural',
        'fallback_voices':['ar-SA-ZariyahNeural','ar-EG-SalmaNeural'],
        'style':'warm female Arabic for young children'
    }
    reg['version']=21
    reg['common_female_names_yemen']=[n for n,_,_ in NAMES]
    reg.setdefault('users',{})
    names_root=AUDIO/'names'; names_root.mkdir(parents=True,exist_ok=True)
    pcm_root=AUDIO/'pcm'; pcm_root.mkdir(parents=True,exist_ok=True)
    tmp=AUDIO/'_voice_probe_girl.mp3'
    voice=await choose_voice(tmp)
    print('Using female voice:',voice)

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
                'aliases':aliases_for_phrase(name,aliases,kind,cid),
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
            'gender':'girl',
            'folder':f'audio/names/{slug}',
            'slug':slug,
            'pcm_script':f'audio/pcm/{slug}.js',
            'clips':clips
        }

    reg.setdefault('compatibility',{})['dynamic_pcm_name_packs']=True
    reg['compatibility']['female_name_pack_strategy']='load only the selected girl PCM pack on old browsers, then MP3/OGG/WAV fallbacks'
    REG_PATH.write_text(json.dumps(reg,ensure_ascii=False,indent=2),encoding='utf-8')

    # V21 uses the same lazy PCM engine as V20; only registry/version and script URLs advance.
    src=(ROOT/'audio-v20.js').read_text(encoding='utf-8')
    src=src.replace("var BUILD='20'","var BUILD='21'",1)
    src=src.replace('audio/registry.json?v=20','audio/registry.json?v=21')
    (ROOT/'audio-v21.js').write_text(src,encoding='utf-8')

    idx=ROOT/'index.html'
    h=idx.read_text(encoding='utf-8')
    h=h.replace('لوحة الطفل - امسك القلم وارسم v20','لوحة الطفل - امسك القلم وارسم v21')
    h=h.replace('var LOCAL=20','var LOCAL=21')
    h=h.replace('<script src="audio-v20.js?v=20"></script>','<script src="audio-v21.js?v=21"></script>')
    idx.write_text(h,encoding='utf-8')

    vp=ROOT/'version.json'; v=json.loads(vp.read_text(encoding='utf-8'))
    v['build']=21
    v['updated']='2026-09-11'
    v['audioPack']='20-yemeni-male+20-yemeni-female+noor+colors-v21'
    v['audioEngine']='V21 lazy per-name embedded PCM + WebAudio/HTMLAudio/TTS fallbacks'
    v['maleNamePacks']=20
    v['femaleNamePacks']=20
    vp.write_text(json.dumps(v,ensure_ascii=False,indent=2),encoding='utf-8')

    sw=ROOT/'sw.js'; t=sw.read_text(encoding='utf-8')
    t=re.sub(r"var CACHE='app360-1-4-v\d+'","var CACHE='app360-1-4-v21'",t,1)
    t=t.replace("'./audio-v20.js?v=20'","'./audio-v21.js?v=21'")
    t=t.replace("u.indexOf('/1-4/audio-v20.js')>=0","u.indexOf('/1-4/audio-v21.js')>=0")
    sw.write_text(t,encoding='utf-8')

    print('Generated',len(NAMES),'female name packs with',len(PHRASES),'clips each')

asyncio.run(main())
