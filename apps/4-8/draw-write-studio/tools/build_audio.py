"""Synthesize authored curriculum and its real word boundaries as one pair.

Build only. Never send draft text, names, images or recordings to a TTS provider.
"""
import asyncio, hashlib, importlib, json, os, pathlib, re, subprocess, sys, unicodedata
import edge_tts
ROOT = pathlib.Path(__file__).resolve().parents[1]
VOICES = {'ar':'ar-SA-ZariyahNeural','en':'en-US-JennyNeural'}
def normal(s):
    return ''.join(c.lower() for c in unicodedata.normalize('NFKD',s) if c.isalnum() and not unicodedata.combining(c))
async def main():
    manifest=json.loads((ROOT/'data/audio-manifest.json').read_text())
    cache=pathlib.Path(sys.argv[1]);cache.mkdir(parents=True,exist_ok=True)
    (ROOT/'audio').mkdir(exist_ok=True)
    ssl=importlib.import_module('edge_tts.communicate')._SSL_CTX
    for c in pathlib.Path('/usr/local/share/ca-certificates').glob('*.crt'):ssl.load_verify_locations(str(c))
    sem=asyncio.Semaphore(4);cues={};completed=0
    async def one(item):
        nonlocal completed
        async with sem:
            text=item['text'];digest=hashlib.sha256((item['language']+text).encode()).hexdigest()
            src=cache/(digest+'.mp3');meta=cache/(digest+'.jsonl')
            for attempt in range(3):
                try:
                    if not (src.exists() and meta.exists() and meta.stat().st_size):
                        c=edge_tts.Communicate(text,VOICES[item['language']],rate='-15%',boundary='WordBoundary',proxy=os.environ.get('HTTPS_PROXY'))
                        await asyncio.wait_for(c.save(str(src),str(meta)),40)
                    break
                except Exception:
                    if attempt==2:raise
            target=ROOT/item['path']
            subprocess.run(['ffmpeg','-v','error','-y','-i',str(src),'-ac','1','-ar','24000','-codec:a','libmp3lame','-b:a','40k','-write_xing','1','-id3v2_version','0',str(target)],check=True)
            duration=float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(target)]))
            words=text.split();sizes=[len(normal(x)) for x in words];flat=''.join(normal(x) for x in words);cursor=0;spans={}
            for row in meta.read_text().splitlines():
                m=json.loads(row)
                if m['type']!='WordBoundary':continue
                letters=normal(m['text'])
                if not letters:continue
                assert flat[cursor:cursor+len(letters)]==letters,(text,m['text'])
                pos=0
                for i,n in enumerate(sizes):
                    if n and pos<cursor+len(letters) and pos+n>cursor:
                        a=round(m['offset']/10000);b=min(round(duration*1000),round((m['offset']+m['duration'])/10000))
                        if i not in spans:spans[i]=[a,b]
                        else:spans[i][1]=b
                    pos+=n
                cursor+=len(letters)
            assert cursor==len(flat) and len(spans)==sum(bool(x) for x in sizes),text
            cues[item['path']]={'text':text,'language':item['language'],'duration':round(duration*1000),'cues':[[i,a,b] for i,(a,b) in sorted(spans.items())]}
            completed+=1
            if completed%10==0:print('Speech clips built:',completed,flush=True)
    await asyncio.gather(*(one(item) for item in manifest['items']))
    ordered={k:cues[k] for k in sorted(cues)}
    (ROOT/'data/read-along.json').write_text(json.dumps({'schema_version':1,'timing_source':'WordBoundary of the same synthesis; no estimated word timer','items':ordered},ensure_ascii=False,separators=(',',':'))+'\n')
    print('Built',completed,'speech/cue pairs',flush=True)
asyncio.run(main())
