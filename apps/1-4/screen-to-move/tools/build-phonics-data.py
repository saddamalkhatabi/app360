"""Authored Arabic phonics, isolated from future vocabulary and sentence lessons."""
from pathlib import Path
import json,re
from phonics_carriers import CV, REST, JOIN, DOUBLE, LONG, NUN
root=Path(__file__).resolve().parents[1]
letters=list('أبتثجحخدذرزسشصضطظعغفقكلمنهوي')
marks=['َ','ِ','ُ']
names=['فتحة','كسرة','ضمة']
records=[]; games=[]
def cv(i,v): return ('إ' if i==0 and v==1 else letters[i])+marks[v]
def sound(key,text,parts,stage,letter=None,vowel=None,spoken=None):
 r=dict(id=key,text=text,parts=parts,stage=stage,spoken=spoken or text)
 if letter is not None:r['letter']=letter
 if vowel is not None:r['vowel']=vowel
 records.append(r);return key
for i in range(28):
 for v in range(3):sound(f'cv-{i}-{v}',cv(i,v),[cv(i,v)],'short',i,v)
 for n in range(12):games.append(dict(id=f'H{i+1:02d}-{n+1}',stage='short',letter=i,exercise=n,target=f'cv-{i}-{n%3}'))
# Sukun is heard ONLY with a preceding vowel. Never pronounce a bare resting consonant.
for i in [1,2,9,11,19,22,23,24]:
 for v in range(3):
  prefix=cv(0,v);last=letters[i]+'ْ';key=sound(f'rest-{i}-{v}',prefix+last,[prefix,last],'sukun',i,v)
  for n in range(3):games.append(dict(id=f'S{i:02d}-{v}-{n}',stage='sukun',exercise=n,target=key))
# Two sounded consonants, a controlled exercise rather than a claimed vocabulary word.
pairs=[(1,2),(2,23),(23,24),(24,1),(11,23),(22,17),(9,23),(7,9),(19,25),(21,2),(26,22),(27,7)]
for p,(a,b) in enumerate(pairs):
 for v in range(2):
  second=(v+1)%3;key=sound(f'join-{p}-{v}',cv(a,v)+cv(b,second),[cv(a,v),cv(b,second)],'blend')
  for n in range(3):games.append(dict(id=f'B{p:02d}-{v}-{n}',stage='blend',exercise=n,target=key))
# Shadda contrasts a consonant held then released, in a supported initial context.
for i in [1,2,11,22,23,24]:
 for v in range(3):
  text=cv(0,0)+letters[i]+'ّ'+marks[v];key=sound(f'double-{i}-{v}',text,[cv(0,0)+letters[i]+'ْ',cv(i,v)],'shadda',i,v)
  for n in range(2):games.append(dict(id=f'D{i:02d}-{v}-{n}',stage='shadda',exercise=n,target=key))
for i in [1,2,11,22,23,24]:
 for v in range(3):
  text=cv(i,v)+['ا','ي','و'][v];key=sound(f'long-{i}-{v}',text,[cv(i,v),['ا','ي','و'][v]],'madd',i,v)
  for n in range(2):games.append(dict(id=f'M{i:02d}-{v}-{n}',stage='madd',exercise=n,target=key))
# Tanwin in connected reading sounds like a short vowel followed by n; sound text
# spells that phonetic demonstration to prevent a TTS pause dropping the final n.
for i in [1,2,23,24]:
 for v in range(3):
  display=letters[i]+['ًا','ٍ','ٌ'][v];spoken=cv(i,v)+'نْ';key=sound(f'nun-{i}-{v}',display,[cv(i,v),'نْ'],'tanwin',i,v,spoken)
  for n in range(2):games.append(dict(id=f'T{i:02d}-{v}-{n}',stage='tanwin',exercise=n,target=key))
# Source words keep short-vowel sounds away from uncertain isolated-letter TTS.
for r in records:
 p=r['id'].split('-');i=int(p[1]);v=int(p[2]);stage=r['stage']
 r['source_mode']='prefix';r['source_start']=0
 if stage=='short':
  r['carrier']=CV[i][v]
  if i==27 and v==1:r['source_start']=1
 elif stage=='sukun':r['carrier']=REST[i][v]
 elif stage=='blend':
  word=JOIN[i*2+v];r['carrier']=word;r['text']=word[:4];r['spoken']=r['text'];r['parts']=[word[:2],word[2:4]]
 elif stage=='shadda':
  word=DOUBLE[i][v];r['carrier']=word
  pos=word.index('ّ')+2;r['text']=word[:pos];r['spoken']=r['text'];r['parts']=[word[:2]+word[2]+'ْ',word[2]+'ّ'+word[pos-1]]
  # The release card has one consonant, not another written shadda.
  r['parts'][1]=word[2]+word[pos-1]
 elif stage=='madd':r['carrier']=LONG[i][v]
 else:
  stem=NUN[i]+['ًا','ٍ','ٌ'][v];verb={1:'أَقْرَأُ',2:'أَسْمَعُ',23:'أَحْمِلُ',24:'أَرَى'}[i];prepverb={1:'أُعْجَبُ',2:'أُعْجَبُ',23:'أَكْتُبُ',24:'أَرْسُمُ'}[i];r['carrier']=[verb+' '+stem+' جَمِيلًا',prepverb+' بِ'+stem+' جَمِيلٍ','هَذَا '+stem+' جَمِيلٌ'][v];r['source_word_index']=1;r['source_mode']='suffix'
 r['carrier_base']=re.sub('[\u064b-\u0652]','',r['carrier'].split()[0])
data=dict(version=30,letters=letters,marks=marks,markNames=names,records=records,games=games)
(root/'phonics-data-v30.js').write_text('window.CreativePhonicsData='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
rows=[]
for r in records:
 # Repeat the fully authored sound, instead of asking the engine to infer its vowels.
 rows.append(dict(key='phonics-'+r['id'],path='audio/phonics/'+r['id']+'.mp3',language='ar',engine='silma',text=r['spoken']+'، '+r['spoken']+'.',text_role='cropped_output_transcript',display=r['text'],stage=r['stage'],carrier=r['carrier'],source_mode=r['source_mode'],source_start=r['source_start'],review_status='pending'))
(root/'audio/phonics-scripts.json').write_text(json.dumps(dict(engine='SILMA',items=rows),ensure_ascii=False,indent=2)+'\n')
print(len(records),'sound demonstrations;',len(games),'activities')
