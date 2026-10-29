"""Independent decoded-speech checks; alignment alone cannot verify spoken words."""
import re,unicodedata

def normalize(text):
 text=unicodedata.normalize('NFKC',text).lower().replace('’', "'")
 # These spellings have the same pronunciation; substitutions still require exact words.
 text=re.sub(r"(?<=\w)'s\b",'s',text)
 for pattern,replacement in [(r'\btouch[ -]+screen\b','touchscreen'),(r'\begg[ -]+shell\b','eggshell'),(r'\bfibre\b','fiber'),(r'\bflavour\b','flavor'),(r'\bcolourful\b','colorful')]:
  text=re.sub(pattern,replacement,text)
 for short,full in [("don't",'do not'),("doesn't",'does not'),("can't",'can not'),('cannot','can not')]:text=text.replace(short,full)
 text=''.join(c for c in text if not unicodedata.combining(c))
 text=text.translate(str.maketrans('أإآٱىة','اااايه'))
 text=re.sub(r'[^\w\s]',' ',text).replace('_',' ')
 text=' '.join(text.split())
 aliases={'اثنا عشر':'12','اثني عشر':'12','twelve':'12','ستون':'60','ستين':'60','sixty':'60','واحد':'1','واحدة':'1','one':'1','اثنان':'2','اثنين':'2','اثنتان':'2','اثنتين':'2','two':'2','ثلاث':'3','ثلاثه':'3','three':'3','اربع':'4','اربعه':'4','four':'4','خمس':'5','خمسه':'5','five':'5','ست':'6','سته':'6','six':'6','سبع':'7','سبعه':'7','seven':'7','ثمان':'8','ثماني':'8','ثمانيه':'8','eight':'8','تسع':'9','تسعه':'9','nine':'9','عشر':'10','عشره':'10','ten':'10','صفر':'0','zero':'0','بدون':'دون'}
 for n,names in {11:['احد عشر','احدي عشره','eleven'],12:['اثنا عشر','اثني عشر','twelve'],13:['ثلاثه عشر','thirteen'],14:['اربعه عشر','fourteen'],15:['خمسه عشر','fifteen'],16:['سته عشر','sixteen'],17:['سبعه عشر','seventeen'],18:['ثمانيه عشر','eighteen'],19:['تسعه عشر','nineteen'],20:['عشرون','عشرين','twenty']}.items():
  for name in names:text=re.sub(r'(?<!\w)'+re.escape(name)+r'(?!\w)',str(n),text)
 for word,value in aliases.items():text=re.sub(r'(?<!\w)'+re.escape(word)+r'(?!\w)',value,text)
 text=''.join(str(unicodedata.digit(c)) if c.isdigit() else c for c in text)
 return text

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
 negations={'لا','ولا','فلا','لم','لن','دون','not','never'}
 missing_negation=bool((set(aw)&negations)!=(set(bw)&negations))
 repeated=any(bw[i]==bw[i+1]==bw[i+2] for i in range(len(bw)-2))
 # ASR is an independent automated screen, not a human pronunciation verdict.
 return dict(passed=bool(a and b and wer==0 and cer==0 and not repeated and not missing_negation),wer=round(wer,4),cer=round(cer,4),heard=heard,recognizer='faster-whisper-small',human_review='pending')


def verified_recording(wanted, clip, root):
 """A prior transcript is reusable only for its exact current text and bytes."""
 import hashlib
 if not clip or clip.get('quality_revision') != 'facts-v2-asr': return False
 for key in ('text', 'words', 'path', 'language', 'engine'):
  if clip.get(key) != wanted.get(key): return False
 if not compare(wanted['text'], clip.get('speech_qa', {}).get('heard', ''))['passed']: return False
 try: return hashlib.sha256((root / wanted['path']).read_bytes()).hexdigest() == clip.get('sha256')
 except OSError: return False
