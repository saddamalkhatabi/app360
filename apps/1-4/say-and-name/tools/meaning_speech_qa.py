"""Independent decoded-speech checks; alignment alone cannot verify spoken words."""
import re,unicodedata
from difflib import SequenceMatcher

def normalize(text):
 text=unicodedata.normalize('NFKC',text).lower()
 text=''.join(c for c in text if not unicodedata.combining(c))
 text=text.translate(str.maketrans('أإآٱىة','اااايه'))
 text=re.sub(r'[^\w\s]',' ',text).replace('_',' ')
 return ' '.join(text.split())

def distance(a,b):
 row=list(range(len(b)+1))
 for i,x in enumerate(a,1):
  nxt=[i]
  for j,y in enumerate(b,1):nxt.append(min(nxt[-1]+1,row[j]+1,row[j-1]+(x!=y)))
  row=nxt
 return row[-1]

def compare(expected,heard):
 a,b=normalize(expected),normalize(heard)
 aw,bw=a.split(),b.split()
 wer=distance(aw,bw)/max(1,len(aw));cer=distance(a,b)/max(1,len(a))
 repeated=any(bw[i]==bw[i+1]==bw[i+2] for i in range(len(bw)-2))
 # ASR is an independent automated screen, not a human pronunciation verdict.
 return dict(passed=bool(a and b and wer<=.25 and cer<=.18 and not repeated),wer=round(wer,4),cer=round(cer,4),heard=heard,recognizer='faster-whisper-small',human_review='pending')
