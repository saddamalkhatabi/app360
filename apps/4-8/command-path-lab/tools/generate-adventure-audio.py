import asyncio,json,hashlib
from pathlib import Path
import edge_tts
p=Path(__file__).resolve().parents[1]
d=json.loads((p/'data/adventure-phrases.json').read_text())
async def main():
 out={}
 for key,words in d.items():
  for lang,text in words.items():
   name=f'audio/{lang}-{key}.mp3'; cues=[]; voice='ar-SA-HamedNeural' if lang=='ar' else 'en-US-GuyNeural'
   audio=bytearray()
   async for event in edge_tts.Communicate(text,voice,rate='-10%',boundary='WordBoundary').stream():
    if event['type']=='audio':audio.extend(event['data'])
    elif event['type']=='WordBoundary':cues.append([len(cues),round(event['offset']/10000),round((event['offset']+event['duration'])/10000)])
   (p/name).write_bytes(audio);out[name]={'text':text,'language':lang,'duration':cues[-1][2] if cues else 0,'cues':cues}
   print(name,len(audio),flush=True)
 r=json.loads((p/'data/read-along.json').read_text());r['items'].update(out)
 (p/'data/read-along.json').write_text(json.dumps(r,ensure_ascii=False,separators=(',',':'))+'\n')
asyncio.run(main())
