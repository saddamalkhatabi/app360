"""Build authored curriculum audio with real word boundaries and activity-language numeral segments.
Only authored curriculum is sent during this build; never learner text or account data.
"""
import asyncio,hashlib,importlib,json,os,pathlib,re,subprocess,sys,unicodedata
import edge_tts
ROOT=pathlib.Path(__file__).resolve().parents[1]
AR_NUMBERS=['صِفْر','وَاحِد','اِثْنَان','ثَلَاثَة','أَرْبَعَة','خَمْسَة','سِتَّة','سَبْعَة','ثَمَانِيَة','تِسْعَة','عَشَرَة','أَحَدَ عَشَر','اِثْنَا عَشَر','ثَلَاثَةَ عَشَر','أَرْبَعَةَ عَشَر','خَمْسَةَ عَشَر','سِتَّةَ عَشَر','سَبْعَةَ عَشَر','ثَمَانِيَةَ عَشَر','تِسْعَةَ عَشَر','عِشْرُون']
NUMBERS='zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split()
AR_NUMBERS += ['وَاحِدٌ وَعِشْرُون','اِثْنَانِ وَعِشْرُون','ثَلَاثَةٌ وَعِشْرُون','أَرْبَعَةٌ وَعِشْرُون','خَمْسَةٌ وَعِشْرُون','سِتَّةٌ وَعِشْرُون']
NUMBERS += ['twenty one','twenty two','twenty three','twenty four','twenty five','twenty six']
VOICES={'ar':'ar-SA-ZariyahNeural','en':'en-US-JennyNeural'}
def norm(s):return ''.join(c.lower() for c in unicodedata.normalize('NFKD',s) if c.isalnum() and not unicodedata.combining(c))
def groups(item):
    result=[]
    for index,word in enumerate(item['text'].split()):
        number=re.fullmatch(r'(\d+)([.,!?،؟؛:]*)',word)
        language='en' if re.match('[A-Za-z]',word) else item['language']
        spoken=(AR_NUMBERS if language=='ar' else NUMBERS)[int(number[1])]+number[2] if number and int(number[1])<len(NUMBERS) else word
        if result and result[-1]['language']==language:result[-1]['words'].append((index,spoken))
        else:result.append({'language':language,'words':[(index,spoken)]})
    return result
async def main():
    manifest=json.loads((ROOT/'data/audio-manifest.json').read_text());cache=pathlib.Path(sys.argv[1]);cache.mkdir(parents=True,exist_ok=True)
    ssl=importlib.import_module('edge_tts.communicate')._SSL_CTX
    for c in pathlib.Path('/usr/local/share/ca-certificates').glob('*.crt'):ssl.load_verify_locations(str(c))
    old=json.loads((ROOT/'data/read-along.json').read_text())['items'];sem=asyncio.Semaphore(4);clips={};finished=0;locks={}
    async def segment(g):
        text=' '.join(w for _,w in g['words']);h=hashlib.sha256((g['language']+text).encode()).hexdigest();src=cache/(h+'.mp3');meta=cache/(h+'.jsonl')
        lock=locks.setdefault(h,asyncio.Lock())
        async with lock:
            if not (src.exists() and meta.exists() and meta.stat().st_size):
                for attempt in range(3):
                    try:
                        c=edge_tts.Communicate(text,VOICES[g['language']],rate='-15%',boundary='WordBoundary',proxy=os.environ.get('HTTPS_PROXY'))
                        await asyncio.wait_for(c.save(str(src),str(meta)),45);break
                    except Exception:
                        if attempt==2:raise
        pcm=subprocess.check_output(['ffmpeg','-v','error','-i',str(src),'-f','s16le','-ar','24000','-ac','1','pipe:1']);spans={};cursor=0
        words=g['words'];sizes=[len(norm(x[1])) for x in words];flat=''.join(norm(x[1]) for x in words)
        for row in meta.read_text().splitlines():
            m=json.loads(row)
            if m['type']!='WordBoundary':continue
            v=norm(m['text'])
            if not v:continue
            assert flat[cursor:cursor+len(v)]==v,(text,m['text'])
            pos=0
            for i,n in enumerate(sizes):
                if n and pos<cursor+len(v) and pos+n>cursor:
                    a=m['offset']/10000;b=(m['offset']+m['duration'])/10000;idx=words[i][0]
                    if idx in spans:spans[idx][1]=b
                    else:spans[idx]=[a,b]
                pos+=n
            cursor+=len(v)
        assert cursor==len(flat) and len(spans)==sum(bool(n) for n in sizes),(text,spans)
        return pcm,spans
    async def one(item):
        nonlocal finished
        async with sem:
            prior=old.get(item['path']);target=ROOT/item['path']
            if prior and prior['text']==item['text'] and target.is_file():
                clips[item['path']]=prior;finished+=1;return
            pcm=bytearray();cues=[];source=[]
            for g in groups(item):
                if pcm:pcm.extend(b'\0'*5760) # Exactly 120 ms between languages, reflected in offsets.
                offset=len(pcm)/48;part,spans=await segment(g)
                for i,(a,b) in sorted(spans.items()):cues.append([i,round(offset+a),round(offset+b)])
                source.append({'language':g['language'],'token_indices':[i for i,_ in g['words']]});pcm.extend(part)
            target=ROOT/item['path'];target.parent.mkdir(exist_ok=True)
            subprocess.run(['ffmpeg','-v','error','-y','-f','s16le','-ar','24000','-ac','1','-i','pipe:0','-codec:a','libmp3lame','-b:a','40k','-write_xing','1','-id3v2_version','0',str(target)],input=bytes(pcm),check=True)
            duration=round(float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(target)]))*1000)
            for c in cues:c[2]=min(c[2],duration)
            clips[item['path']]={'text':item['text'],'language':item['language'],'duration':duration,'cues':cues,'segments':source};finished+=1
            if finished%10==0:print('Audio built',finished,'/',len(manifest['items']),flush=True)
    await asyncio.gather(*(one(i) for i in manifest['items']))
    (ROOT/'data/read-along.json').write_text(json.dumps({'schema_version':1,'timing_source':'WordBoundary from each actual language segment; decoded PCM lengths and explicit intersegment silence offsets','numeral_policy':'Activity-language voice for each numeral token; canonical 0-10 recordings referenced separately','items':{k:clips[k] for k in sorted(clips)}},ensure_ascii=False,separators=(',',':'))+'\n')
    print('Built',finished,'paired clips and real cues',flush=True)
asyncio.run(main())
