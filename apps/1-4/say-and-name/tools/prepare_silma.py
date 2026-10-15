"""Prepare exact authored vocabulary; importing this module never starts synthesis."""
import hashlib,json,re
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
def bare(s): return re.sub('[\u064b-\u0652]','',s)
def load():
 levels=json.loads((ROOT/'data/levels-inline-v8.js').read_text().split('=',1)[1].strip().rstrip(';'))
 lex={bare(s.strip()):s.strip() for s in (ROOT/'data/pronunciation-ar.txt').read_text().replace('\n','|').split('|') if s.strip()}
 rows=[(r[0],w) for cats in levels.values() for r in cats for w in r[2].split('|')]
 words=list(dict.fromkeys(w for _,w in rows));missing=[w for w in words if bare(w) not in lex]
 assert not missing,missing
 items=[]
 for w in words:
  spoken=lex[bare(w)];digest=hashlib.sha256(w.encode()).hexdigest()[:20]
  items.append(dict(key=w,kind='word',spoken=spoken,text=spoken+'.',language='ar',engine='silma',path='audio/silma/words/w_'+digest+'.mp3'))
 senses={('الجسم','ظهر'):'ظَهْر',('الوقت','ظهر'):'ظُهْر',('غرفة النوم','درج'):'دُرْج'}
 for (cat,w),spoken in senses.items():
  assert (cat,w) in rows
  key=cat+'\u0001'+w;digest=hashlib.sha256(key.encode()).hexdigest()[:20]
  items.append(dict(key=key,kind='sense',spoken=spoken,text=spoken+'.',language='ar',engine='silma',path='audio/silma/senses/s_'+digest+'.mp3'))
 guides={
 'welcome':'مَرْحَبًا! هَيَّا نَتَعَلَّمُ الْكَلِمَات. اِلْمِسِ الصُّورَةَ لِتَسْمَعَ اسْمَهَا، ثُمَّ قُلْهُ بِصَوْتِك. اِضْغَطْ عَلَى التَّالِي لِتَرَى صُورَةً جَدِيدَة.',
 'help':'اُنْظُرْ إِلَى الصُّورَة. اِلْمِسْهَا وَاسْتَمِعْ. ثُمَّ كَرِّرِ الْكَلِمَةَ بِهُدُوء. زِرُّ التَّالِي يُرِيكَ صُورَةً جَدِيدَة، وَزِرُّ السَّابِقِ يُعِيدُ الصُّورَةَ السَّابِقَة.',
 'categories':'اِخْتَرْ مَجْمُوعَةً تُحِبُّهَا. يُمْكِنُكَ لَمْسُ صُورَةِ الْحَيَوَانِ، أَوِ الطَّعَامِ، أَوْ أَيِّ مَجْمُوعَةٍ أُخْرَى.',
 'repeat':'اِسْتَمِعْ إِلَى الْكَلِمَة، ثُمَّ حَاوِلْ أَنْ تَقُولَهَا بِصَوْتِك. يُمْكِنُكَ لَمْسُ الصُّورَةِ لِتَسْمَعَهَا مَرَّةً أُخْرَى.',
 'adult':'هَذَا مَكَانُ الْمُرَبِّي. يُمْكِنُكَ تَغْيِيرُ لُغَةِ الصَّوْتِ وَضَبْطُ التَّنَقُّلِ التِّلْقَائِيّ.',
 'random':'هَيَّا نُرَاجِعُ صُوَرًا مِنْ مَجْمُوعَاتٍ مُخْتَلِفَة. اِلْمِسِ الصُّورَةَ وَاسْمَعِ الْكَلِمَة.',
 }
 for key,text in guides.items():items.append(dict(key=key,kind='guide',spoken=text,text=text,language='ar',engine='silma',path='audio/silma/guides/'+key+'.mp3'))
 guides_en={'welcome': 'Hello! Let us learn words. Touch the picture to hear its name, then say it yourself. Press Next to see a new picture.', 'help': 'Look at the picture. Touch it and listen. Then say the word slowly. Next shows a new picture. Previous brings back the last picture.', 'categories': 'Choose a group you like, such as animals or food.', 'repeat': 'Listen to the word, then try saying it yourself. Touch the picture to hear it again.', 'adult': 'This is the grown-up settings area. You can change the audio language and automatic navigation.', 'random': 'Let us review pictures from different groups. Touch a picture and listen to the word.'}
 for key,text in guides_en.items():items.append(dict(key=key+'-en',kind='guide',spoken=text,text=text,language='en',engine='silma',path='audio/silma/guides/'+key+'-en.mp3'))
 return dict(schema_version=1,engine='silma-tts',version='1.0.5',words=len(words),senses=len(senses),guides=len(guides)+len(guides_en),pronunciation_review='Authored vowels; actual listening review pending',items=items)
if __name__=='__main__':
 data=load();(ROOT/'audio/silma-scripts.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n');print({k:v for k,v in data.items() if k!='items'})
