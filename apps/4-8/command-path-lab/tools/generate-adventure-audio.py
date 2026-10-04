import asyncio,json
from pathlib import Path
import edge_tts
import edge_tts.communicate as ec
ec._SSL_CTX.load_verify_locations(cafile="/etc/ssl/certs/ca-certificates.crt")
p=Path(__file__).resolve().parents[1]
d=json.loads((p/'data/adventure-phrases.json').read_text())
async def main():
 r=json.loads((p/'data/read-along.json').read_text());out={}
 gate=asyncio.Semaphore(4)
 async def generate(key,lang,text):
  name=f'audio/{lang}-{key}.mp3'
  if name in r['items'] and r['items'][name]['text']==text and (p/name).is_file():return
  async with gate:
   for attempt in range(3):
    try:
     cues=[];audio=bytearray();voice='ar-SA-HamedNeural' if lang=='ar' else 'en-US-GuyNeural'
     async for event in edge_tts.Communicate(text,voice,rate='-10%',boundary='WordBoundary').stream():
      if event['type']=='audio':audio.extend(event['data'])
      elif event['type']=='WordBoundary':cues.append([len(cues),round(event['offset']/10000),round((event['offset']+event['duration'])/10000)])
     if not audio or not cues:raise ValueError('Missing audio or timings')
     (p/name).write_bytes(audio);out[name]={'text':text,'language':lang,'duration':cues[-1][2],'cues':cues}
     r['items'].update(out);(p/'data/read-along.json').write_text(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n')
     print(name,len(audio),flush=True);return
    except Exception:
     if attempt==2:raise
 await asyncio.gather(*(generate(key,lang,text) for key,words in d.items() for lang,text in words.items()))
asyncio.run(main())
