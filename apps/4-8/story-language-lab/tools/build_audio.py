import asyncio,json,pathlib,os,importlib,subprocess,tempfile
import edge_tts
ROOT=pathlib.Path(__file__).resolve().parents[1]
m=importlib.import_module('edge_tts.communicate')
for c in pathlib.Path('/usr/local/share/ca-certificates').glob('*.crt'):m._SSL_CTX.load_verify_locations(str(c))
d=json.loads((ROOT/'data/stories.json').read_text());jobs={};manifest=[]
for s in d['scenes'].values():
 for lang in ['ar','en']:jobs[s['audio'][lang]]=(lang,s['text'][lang])
for s in d['stories']:jobs[s['question_audio']]=(s['language'],s['question'])
for name,guide in d.get('guides',{}).items():
 for lang,g in guide.items():jobs[g['audio']]=(lang,g['text'])
for story in d['stories']:
 jobs[story['title_audio']]=(story['language'],story['title'])
 for sentence in story['sentences'].values():
  jobs[sentence['audio']]=(story['language'],sentence['text'])
  for p,text in zip(sentence['unit_audio'],sentence['units']):jobs[p]=(story['language'],text)
 for ending in story['endings']:jobs[ending['audio']]=(story['language'],ending['text'])
for w in d['words'].values():
 for a,t in [('audio','text'),('phrase_audio','phrase'),('transfer_audio','transfer')]:jobs[w[a]]=(w['language'],w[t])
sem=asyncio.Semaphore(5);completed=0;needed=sum(not (ROOT/p).exists() for p in jobs)
print('Narration jobs to build:',needed,flush=True)
async def render(path,item):
 global completed
 dest=ROOT/path
 if dest.exists() and dest.stat().st_size>0:return
 async with sem:
  for attempt in range(4):
   try:
    await edge_tts.Communicate(item[1],'ar-SA-ZariyahNeural' if item[0]=='ar' else 'en-US-JennyNeural',rate='-15%',proxy=os.environ.get('HTTPS_PROXY')).save(str(dest));completed+=1
    if completed%25==0:print('Narration completed:',completed,'/',needed,flush=True)
    return
   except Exception:
    if attempt==3:raise
    await asyncio.sleep(1+attempt)
async def main():await asyncio.gather(*(render(k,v) for k,v in jobs.items()))
asyncio.run(main());esroot=pathlib.Path(os.environ['STORY_ESPEAK_ROOT']);env=dict(os.environ,LD_LIBRARY_PATH=str(esroot/'lib/x86_64-linux-gnu'))
for w in d['words'].values():
 for i,phone in enumerate(w['phonetic_units']+w.get('transfer_phonetic_units',[])):
  paths=w['unit_audio']+w.get('transfer_unit_audio',[])
  if (ROOT/paths[i]).exists():continue
  with tempfile.TemporaryDirectory() as tmp:
   # English isolated /r/ is omitted in eSpeak without a following vowel.
   # Its sustained r- form renders the rhotic itself, without a letter name
   # or an added schwa. Stops need an explicit release pause.
   if w['language']=='en' and phone=='r':phone='r-'
   phone=phone+'_' if phone in ('b','d','g','k','p','t','q','dZ') else phone
   wav=pathlib.Path(tmp)/'sound.wav';subprocess.run([str(esroot/'bin/espeak-ng'),'--path='+str(esroot/'lib/x86_64-linux-gnu'),'-v','ar' if w['language']=='ar' else 'en-us','-s','100','-w',str(wav),'[['+phone+']]'],env=env,check=True,stderr=subprocess.DEVNULL);subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af','apad=pad_dur=0.2','-codec:a','libmp3lame','-q:a','4',str(ROOT/paths[i])],check=True)
manifest=[{'path':p,'language':v[0],'text':v[1],'kind':'narration'} for p,v in jobs.items()]
for w in d['words'].values():
 for i,p in enumerate(w['unit_audio']+w.get('transfer_unit_audio',[])):manifest.append({'path':p,'language':w['language'],'text':(w['units']+w.get('transfer_units',[]))[i],'phoneme':(w['phonetic_units']+w.get('transfer_phonetic_units',[]))[i],'kind':'sound-example'})
(ROOT/'data/audio-manifest.json').write_text(json.dumps({'schema_version':1,'narrators':{'ar':'ar-SA-ZariyahNeural','en':'en-US-JennyNeural'},'sound_engine':'eSpeak NG 1.51 phonetic examples; synthetic, not pronunciation assessment. Isolated English r uses sustained r-; isolated stops include release pause.','items':manifest},ensure_ascii=False,indent=2)+'\n');print('Created',len(manifest),'local audio files')
