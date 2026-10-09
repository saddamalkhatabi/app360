#!/usr/bin/env python3
"""Generate actual *recorded* MP3 files for every English spoken event (not browser TTS)."""
import argparse, asyncio, hashlib, json, pathlib, random, subprocess, sys
import edge_tts
ROOT=pathlib.Path(__file__).resolve().parents[1]
p=argparse.ArgumentParser()
p.add_argument('--part',type=int,default=0);p.add_argument('--parts',type=int,default=1)
p.add_argument('--voice',default='en-US-JennyNeural')
p.add_argument('--rate',default='-10%')
args=p.parse_args()
data=json.loads((ROOT/'audio/bilingual/manifest.json').read_text(encoding='utf8'))
entries=[(i,x) for i,x in enumerate(data['choices']+data['phrases']) if i%args.parts==args.part]
assert all(x.get('text_en') and len(x['text_en'])>1 for _,x in entries), 'Missing translated English script'
async def one(n,x):
 target=ROOT/(x.get('en_path') or x['english_path'])
 target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists() and target.stat().st_size>800:
  return
 for retry in range(6):
  try:
   temp=target.with_suffix('.building.mp3')
   await asyncio.wait_for(edge_tts.Communicate(x['text_en'],voice=args.voice,rate=args.rate).save(str(temp)),timeout=100)
   if temp.stat().st_size<800:raise ValueError('Output is too small')
   temp.replace(target)
   print('EN MP3',n+1,len(entries),str(target.relative_to(ROOT)),target.stat().st_size,flush=True)
   return
  except Exception as exc:
   print('EN retry',retry+1,str(target),repr(exc)[:180],flush=True)
   await asyncio.sleep(min(2**retry,16))
 raise RuntimeError('Failed to generate '+str(target))
async def run():
 semaphore=asyncio.Semaphore(2)
 async def bounded(n,x):
  async with semaphore: await one(n,x)
 results=await asyncio.gather(*[bounded(n,x) for n,(_,x) in enumerate(entries)],return_exceptions=True)
 errors=[str(r) for r in results if isinstance(r,BaseException)]
 print(json.dumps({'shard':args.part,'total':len(entries),'successful':len(entries)-len(errors),'failed':errors[:12]}),flush=True)
 if errors:raise SystemExit(1)
asyncio.run(run())
