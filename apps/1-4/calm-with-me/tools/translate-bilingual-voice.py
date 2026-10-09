#!/usr/bin/env python3
"""Translate PUBLIC authored prompts for recorded EN audio, build time ONLY.
Requires: pip install deep-translator. No child/session data uploaded.
Machine translations MUST be listened to and reviewed before release.
"""
import argparse, json, pathlib, re, time, unicodedata
from deep_translator import GoogleTranslator
ROOT=pathlib.Path(__file__).resolve().parents[1]
manifest_path=ROOT/'audio/bilingual/manifest.json'
cache_path=ROOT/'audio/bilingual/translation-cache.json'
p=argparse.ArgumentParser();p.add_argument('--limit',type=int,default=0);a=p.parse_args()
data=json.loads(manifest_path.read_text(encoding='utf8'))
cache=json.loads(cache_path.read_text(encoding='utf8')) if cache_path.exists() else {}
translator=GoogleTranslator(source='ar',target='en')
def plain(t):
 t=''.join(c for c in unicodedata.normalize('NFKD',t) if not unicodedata.combining(c))
 return re.sub(r'\s+',' ',t).strip()
def translated(t):
 k=plain(t)
 if k in cache and cache[k]:return cache[k]
 for attempt in range(6):
  try:
   en=str(translator.translate(k)).strip()
   if not en or en==k or re.search(r'[\u0600-\u06ff]',en):
    raise ValueError('Not an English translation: '+en[:60])
   cache[k]=en
   cache_path.parent.mkdir(parents=True,exist_ok=True)
   cache_path.write_text(json.dumps(cache,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
   return en
  except Exception as e:
   print('Translation retry',attempt+1,repr(e)[:170],flush=True)
   time.sleep(min(2**attempt,20))
 raise RuntimeError('Could not translate accurately: '+k)
entries=data['choices']+data['phrases']
for n,x in enumerate(entries):
 if a.limit and n>=a.limit:break
 x['text_en']=translated(x['text_ar'] if 'text_ar' in x else x['text'])
 if n%10==0: print('Translated',n+1,'/',len(entries),flush=True)
data['translation_review']='machine_translated_waiting_human_review'
data['status']='ENGLISH_TRANSLATED_FILES_NOT_YET_GENERATED'
manifest_path.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
print('Translations available for',sum(bool(x.get('text_en')) for x in entries),'of',len(entries),flush=True)
