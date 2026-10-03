"""Generate authored public curriculum only; cue positions come from the actual recording.
Requires edge-tts and ffmpeg in a build environment, never in the child's browser.
"""
import asyncio, hashlib, importlib, json, os, pathlib, subprocess, sys, unicodedata
import edge_tts
ROOT = pathlib.Path(__file__).resolve().parents[1]
def normal(s):
    return ''.join(c.lower() for c in unicodedata.normalize('NFKD', s) if c.isalnum() and not unicodedata.combining(c))
async def main():
    manifest=json.loads((ROOT/'data/audio-manifest.json').read_text())
    cache=pathlib.Path(sys.argv[1]);cache.mkdir(parents=True,exist_ok=True)
    context=importlib.import_module('edge_tts.communicate')._SSL_CTX
    for cert in pathlib.Path('/usr/local/share/ca-certificates').glob('*.crt'):context.load_verify_locations(str(cert))
    sem=asyncio.Semaphore(4);clips={};done=0
    async def one(item):
        nonlocal done
        async with sem:
            key=hashlib.sha256((item['language']+item['text']).encode()).hexdigest()
            src=cache/(key+'.mp3');meta=cache/(key+'.jsonl')
            if not(src.exists() and meta.exists() and meta.stat().st_size):
                for attempt in range(3):
                    try:
                        stream=edge_tts.Communicate(item['text'],manifest['voices'][item['language']],rate=manifest['rate'],boundary='WordBoundary',proxy=os.environ.get('HTTPS_PROXY'))
                        await asyncio.wait_for(stream.save(str(src),str(meta)),45);break
                    except Exception:
                        if attempt==2:raise
            words=item['text'].split();lengths=[len(normal(w)) for w in words];flat=''.join(normal(w) for w in words);cursor=0;spans={}
            for line in meta.read_text().splitlines():
                row=json.loads(line)
                if row['type']!='WordBoundary':continue
                value=normal(row['text'])
                if not value:continue
                assert flat[cursor:cursor+len(value)]==value,(item['path'],value)
                pos=0
                for index,size in enumerate(lengths):
                    if size and pos<cursor+len(value) and pos+size>cursor:
                        a=round(row['offset']/10000);b=round((row['offset']+row['duration'])/10000)
                        if index in spans:spans[index][1]=b
                        else:spans[index]=[a,b]
                    pos+=size
                cursor+=len(value)
            assert cursor==len(flat) and len(spans)==sum(bool(n) for n in lengths),item['path']
            target=ROOT/item['path'];target.parent.mkdir(exist_ok=True)
            subprocess.run(['ffmpeg','-v','error','-y','-i',str(src),'-ar','24000','-ac','1','-codec:a','libmp3lame','-b:a','40k','-write_xing','1','-id3v2_version','0',str(target)],check=True)
            duration=round(float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration','-of','default=nw=1:nk=1',str(target)]))*1000)
            clips[item['path']]={'text':item['text'],'language':item['language'],'duration':duration,'cues':[[i,a,min(b,duration)] for i,(a,b) in sorted(spans.items())]}
            done+=1
            if done%10==0:print('Built',done,'/',len(manifest['items']),flush=True)
    await asyncio.gather(*(one(item) for item in manifest['items']))
    (ROOT/'data/read-along.json').write_text(json.dumps({'schema_version':1,'timing_source':'Actual recording WordBoundary; punctuation tokens have no fabricated cue','items':{k:clips[k] for k in sorted(clips)}},ensure_ascii=False,separators=(',',':'))+'\n')
    print('Completed',done,'clips with real timings',flush=True)
asyncio.run(main())
