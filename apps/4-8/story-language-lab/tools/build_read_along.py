"""Build speech and real word boundaries together, then shift cues after trimming.

Source synthesis is cached outside the repo; only web audio and eight cue shards
are shipped. Never attach fresh synthesis timestamps to an older recording.
"""
import argparse, asyncio, array, hashlib, importlib, json, math, os, pathlib
import re, subprocess, tempfile, unicodedata
import edge_tts

ROOT = pathlib.Path(__file__).resolve().parents[1]
VOICES = {'ar':'ar-SA-ZariyahNeural','en':'en-US-JennyNeural'}

def normal(text):
    return ''.join(c.lower() for c in unicodedata.normalize('NFKD',text)
                   if c.isalnum() and not unicodedata.combining(c))

def shard(path):
    h = 5381
    for c in path: h = (h*33+ord(c)) & 0xffffffff
    return h%4

def decode(path):
    raw = subprocess.check_output(['ffmpeg','-v','error','-i',str(path),
                                  '-ac','1','-ar','16000','-f','s16le','-'])
    samples = array.array('h',raw)
    rms = [math.sqrt(sum(v*v for v in samples[i:i+160])/len(samples[i:i+160]))/32768
           for i in range(0,len(samples),160) if samples[i:i+160]]
    active = [i for i,v in enumerate(rms) if v > 10**(-48/20)]
    if not active: raise ValueError('Silent audio: '+str(path))
    return len(samples)/16000, active

def word_cues(text, metadata, trim, duration):
    tokens = list(re.finditer(r'\S+',text))
    sizes = [len(normal(t.group())) for t in tokens]
    flat = ''.join(normal(t.group()) for t in tokens)
    cursor = 0
    spans = {}
    for item in metadata:
        if item.get('type') != 'WordBoundary': continue
        letters = normal(item['text'])
        if not letters: continue
        if flat[cursor:cursor+len(letters)] != letters:
            raise ValueError('Word boundary text mismatch: '+text+' / '+item['text'])
        position = 0
        start = max(0, item['offset']/10000000-trim)
        end = min(duration, max(start,item['offset']/10000000+item['duration']/10000000-trim))
        for index,size in enumerate(sizes):
            if size and position < cursor+len(letters) and position+size > cursor:
                if index not in spans: spans[index]=[start,end]
                else: spans[index][1]=end
            position += size
        cursor += len(letters)
    if cursor != len(flat) or len(spans) != sum(bool(n) for n in sizes):
        raise ValueError('Incomplete word timings: '+text)
    return [[i,round(a*1000),round(b*1000)] for i,(a,b) in sorted(spans.items())]

def process(source, metadata_file, text):
    duration, active = decode(source)
    start = max(0,active[0]/100-.04)
    end = min(duration,(active[-1]+1)/100+.08)
    with tempfile.TemporaryDirectory() as tmp:
        output = pathlib.Path(tmp)/'web.mp3'
        # Xing/LAME carries encoder delay and padding for gapless decoding.
        # Cue offsets refer to decoded speech, rather than MP3 packet numbers.
        subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-af',
                        f'atrim=start={start}:end={end},asetpts=PTS-STARTPTS',
                        '-ac','1','-ar','24000','-codec:a','libmp3lame','-b:a','40k',
                        '-write_xing','1','-id3v2_version','0',str(output)],check=True)
        final_duration, final_active = decode(output)
        metadata = [json.loads(line) for line in metadata_file.read_text().splitlines()]
        cues = word_cues(text,metadata,start,final_duration)
        return output.read_bytes(), {
            'duration':round(final_duration*1000), 'cues':cues,
            'original_leading_ms':active[0]*10,'trimmed_start_ms':round(start*1000),
            'final_leading_ms':final_active[0]*10,
            'before_bytes':source.stat().st_size}

async def build(args):
    manifest = json.loads((ROOT/'data/audio-manifest.json').read_text())
    if args.public_source_proof:
        proof=json.loads(pathlib.Path(args.public_source_proof).read_text())
        assert proof['visibility_verified_by_github_connector']=='public'
        relative='apps/4-8/story-language-lab/data/audio-manifest.json'
        blob=subprocess.check_output(['git','rev-parse','HEAD:'+relative],cwd=ROOT,text=True).strip()
        assert blob==proof['public_manifest_blob']
        published=json.loads(subprocess.check_output(['git','show','HEAD:'+relative],cwd=ROOT,text=True))
        original={x['path']:x for x in published['items']}
        current={x['path']:x for x in manifest['items']}
        assert set(original)==set(current)
        for path,item in current.items():
            assert normal(item['text'])==normal(original[path]['text'])
            assert item['language']==original[path]['language'] and item['kind']==original[path]['kind']
        print('Verified public synthetic curriculum only; no child recordings or private user text.',flush=True)
    source_dir = pathlib.Path(args.source_cache)
    source_dir.mkdir(parents=True,exist_ok=True)
    ssl_module=importlib.import_module('edge_tts.communicate')
    for c in pathlib.Path('/usr/local/share/ca-certificates').glob('*.crt'):
        ssl_module._SSL_CTX.load_verify_locations(str(c))
    groups={}
    for item in manifest['items']:
        if item['kind']=='narration':
            groups.setdefault((item['language'],item['text']),[]).append(item['path'])
    if args.limit: groups=dict(list(groups.items())[:args.limit])
    done=0;entries={};rows=[];sem=asyncio.Semaphore(args.concurrency)
    print(json.dumps({'unique_synthesis_jobs':len(groups),'concurrency':args.concurrency}),flush=True)
    async def render(key,paths):
        nonlocal done
        language,text=key
        digest=hashlib.sha256((language+'\n'+text+'\n-15%\nWordBoundary').encode()).hexdigest()
        source=source_dir/(digest+'.mp3');metadata=source_dir/(digest+'.jsonl')
        async with sem:
            for attempt in range(5):
                try:
                    if not(source.exists() and metadata.exists() and metadata.stat().st_size):
                        client=edge_tts.Communicate(text,VOICES[language],rate='-15%',
                                  boundary='WordBoundary',proxy=os.environ.get('HTTPS_PROXY'))
                        await asyncio.wait_for(client.save(str(source),str(metadata)),60)
                    payload,report=await asyncio.to_thread(process,source,metadata,text)
                    for path in paths:
                        (ROOT/path).write_bytes(payload)
                        entries[path]={'text':text,'language':language,'duration':report['duration'],
                                       'cues':report['cues']}
                        rows.append(dict(report,path=path,bytes=len(payload),
                                         sha256=hashlib.sha256(payload).hexdigest()))
                    done+=1
                    if done%40==0 or done==len(groups):print('Timed narration:',done,'/',len(groups),flush=True)
                    return
                except Exception as exc:
                    if isinstance(exc,ValueError) or attempt==4:
                        print('Build failed:',paths[0],type(exc).__name__,str(exc)[:180],flush=True)
                        raise
                    source.unlink(missing_ok=True);metadata.unlink(missing_ok=True)
                    await asyncio.sleep(2+attempt*2)
    await asyncio.gather(*(render(key,paths) for key,paths in groups.items()))
    if args.limit:return
    # Existing isolated phonemes have one highlighted grapheme, not fabricated
    # word boundaries. Keep these already-normalised sound examples unchanged.
    for item in manifest['items']:
        if item['kind']!='sound-example':continue
        duration,active=decode(ROOT/item['path'])
        entries[item['path']]={'text':item['text'],'language':item['language'],
                  'duration':round(duration*1000),'cues':[[0,active[0]*10,min(round(duration*1000),(active[-1]+1)*10)]]}
    cue_dir=ROOT/'data/read-along';cue_dir.mkdir(exist_ok=True)
    shards={lang+'-'+str(i):{} for lang in ('ar','en') for i in range(4)}
    for path,entry in entries.items():shards[entry['language']+'-'+str(shard(path))][path]=entry
    for name,items in shards.items():
        (cue_dir/(name+'.json')).write_text(json.dumps({'version':1,'items':items},ensure_ascii=False,separators=(',',':'))+'\n')
    previous=json.loads((ROOT/'data/audio-processing-report.json').read_text())
    old={x['path']:x for x in previous['items']}
    for row in rows:old[row['path']]=row
    previous['codec']='MP3 mono 24 kHz 40 kbps; narrated clips include gapless Xing/LAME metadata'
    previous['timing_policy']='WordBoundary metadata from the same synthesis; offsets shifted by exact outer trim. Internal pauses retained. Isolated sound examples use measured signal onset/end.'
    previous['items']=list(old.values())
    (ROOT/'data/audio-processing-report.json').write_text(json.dumps(previous,ensure_ascii=False,indent=2)+'\n')
    summary={'version':5,'clips':len(entries),'narration_clips':len(rows),
             'words':sum(len(e['cues']) for e in entries.values()),
             'audio_bytes':sum((ROOT/p).stat().st_size for p in entries),
             'cue_bytes':sum(p.stat().st_size for p in cue_dir.glob('*.json')),
             'source':'Same-synthesis WordBoundary events, not estimates from word length',
             'shards':len(shards),'arabic_name':'عُمَرُ / عُمَرَ according to sentence position'}
    (ROOT/'data/read-along-build-report.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2)+'\n')
    print(json.dumps(summary,ensure_ascii=False),flush=True)

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--source-cache',required=True)
    parser.add_argument('--concurrency',type=int,default=8);parser.add_argument('--limit',type=int)
    parser.add_argument('--public-source-proof')
    asyncio.run(build(parser.parse_args()))
