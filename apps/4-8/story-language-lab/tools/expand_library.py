"""Add independently written practice stories; reuse original visual sheets."""
import copy, hashlib, json, pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
d=json.loads((ROOT/'data/stories.json').read_text())
# Texts describe the visible image, without changing the source illustration.
pairs=[
 {'id':'first-next-last','source':'cup','track':'entry','title':['أولًا… ثم… أخيرًا','First, next, last'],
 'ar':['هَذِهِ بَدَايَةُ الْحِكَايَةِ: كُوبٌ وَكِتَابٌ.','وَبَعْدَ ذَلِكَ، حَجَبَ الْكِتَابُ الْكُوبَ.','ثُمَّ ظَهَرَ الْكُوبُ مِنْ جَدِيدٍ.','وَفِي النِّهَايَةِ، أَمْسَكَتْ لَيْلَى كُوبَهَا.'],
 'en':['First, Mia has a cup and a book.','Next, the book hides the cup.','Then Mia moves the book and finds the cup.','Last, Mia holds the cup and smiles.'],
 'question':['أي صورة يظهر فيها الكوب من جديد؟','Which picture shows the cup again?'], 'choices':[('وجدت الكوب','Cup found',2),('الكوب مخفي','Cup hidden',1)], 'word':['ar-cup','en-cup'],
 'practice':[['لَيْلَى','وَجَدَتِ','الْكُوبَ'],['Mia','finds','it']], 'extend':[['فِي','النِّهَايَةِ','أَمْسَكَتْ','لَيْلَى','الْكُوبَ'],['At','last','Mia','finds','it']], 'sentence_scene':3,
 'endings':[['عَادَ الْكُوبُ إِلَى يَدَيْ لَيْلَى.','بَعُدَ الْكِتَابُ وَظَهَرَ الْكُوبُ.'],['Mia holds her cup at last.','The book moves and the cup appears.']], 'ending_scenes':[3,2],
 'real':['رتّب ثلاث صور من يومك، وقل: أولًا، ثم، أخيرًا.','Tell three moments from your day: first, next, last.'], 'skill':['أرتّب الأحداث','Sequence events']},
 {'id':'in-and-out','source':'cat','track':'entry','title':['داخل وخارج','In and out'],
 'ar':['القِطُّ خَارِجَ الصُّنْدُوقِ.','دَخَلَ القِطُّ الصُّنْدُوقَ.','خَرَجَ القِطُّ وَوَقَفَ بِجَانِبِهِ.','وَضَعَ الوَلَدُ غِطَاءً نَاعِمًا فِي الصُّنْدُوقِ.'],
 'en':['The cat is outside the box.','Now the cat is inside.','The cat steps outside again.','Sam puts a soft blanket in the box.'],
 'question':['أين الصورة التي فيها القط داخل الصندوق؟','Which picture shows the cat inside?'], 'choices':[('داخل','Inside',1),('خارج','Outside',0)],'word':['ar-cat','en-cat'],
 'practice':[['القِطُّ','دَخَلَ','الصُّنْدُوقَ'],['It','goes','in']], 'extend':[['خَرَجَ','القِطُّ','مِنَ','الصُّنْدُوقِ','بِهُدُوءٍ'],['The','cat','steps','outside','again']], 'sentence_scene':1,
 'endings':[['خَرَجَ القِطُّ، وَبَقِيَ الصُّنْدُوقُ مَفْتُوحًا.','صَارَ الصُّنْدُوقُ نَاعِمًا بِالْغِطَاءِ.'],['The cat leaves the open box.','The blanket makes the box soft.']], 'ending_scenes':[2,3],
 'real':['ضع لعبة آمنة داخل صندوق مفتوح ثم أخرجها وسمّ المكان.','Put a safe toy in an open box, then take it out. Name its place.'],'skill':['أصف المكان','Describe position']},
 {'id':'look-for-clues','source':'cup','track':'practice','title':['أبحث بدليل','Look for a clue'],
 'ar':['أَرَى الكُوبَ بِجَانِبِ الكِتَابِ.','وَقَفَ الكِتَابُ، فَحَجَبَ الكُوبَ.','هَذَا هُوَ الدَّلِيلُ: اِبْتَعَدَ الكِتَابُ فَظَهَرَ الكُوبُ.','وَجَدَتْ لَيْلَى مَا كَانَتْ تَبْحَثُ عَنْهُ.'],
 'en':['I can see the cup beside the book.','The upright book hides the cup.','Here is a clue: move the book, and the cup appears.','Mia has found what she was looking for.'],
 'question':['ما الشيء الذي أخفى الكوب؟','What hid the cup?'],'choices':[('الكتاب','The book',1),('الكوب ظهر','The cup appears',2)],'word':['ar-book','en-cup'],
 'practice':[['الكِتَابُ','حَجَبَ','الكُوبَ'],['It','is','hidden']], 'extend':[['أَبْعَدَتْ','لَيْلَى','الكِتَابَ','فَظَهَرَ','الكُوبُ'],['Mia','moves','the','book','aside']], 'sentence_scene':2,
 'endings':[['اِسْتَخْدَمَتْ لَيْلَى الدَّلِيلَ، فَوَجَدَتْ كُوبَهَا.','ظَهَرَ الكُوبُ بَعْدَ تَحْرِيكِ الكِتَابِ.'],['Mia follows the clue and finds her cup.','The cup appears when the book moves.']], 'ending_scenes':[3,2],
 'real':['ضع كوبًا خلف كتاب آمن. اسأل: ماذا أرى؟ وماذا أغيّر لكي أراه؟','Hide a cup behind a safe book. Ask what you can move to see it.'],'skill':['أربط السبب بالنتيجة','Cause and effect']},
 {'id':'ball-actions','source':'ball','track':'practice','title':['أفعال الكرة','Ball actions'],
 'ar':['الوَلَدُ يَمْسِكُ الكُرَةَ.','الوَلَدُ يُدَحْرِجُ الكُرَةَ.','البِنْتُ تَلْتَقِطُ الكُرَةَ.','البِنْتُ تُعِيدُ الكُرَةَ إِلَى الوَلَدِ.'],
 'en':['The boy holds the ball.','The boy rolls the ball.','The girl catches the ball.','The girl rolls the ball back.'],
 'question':['ماذا تفعل البنت عندما تصلها الكرة؟','What does the girl do when the ball reaches her?'],'choices':[('تلتقطها','She catches it',2),('الكرة عند الولد','The boy has it',0)],'word':['ar-ball-word','en-ball-word'],
 'practice':[['البِنْتُ','تَلْتَقِطُ','الكُرَةَ'],['She','catches','it']], 'extend':[['البِنْتُ','تُعِيدُ','الكُرَةَ','إِلَى','الوَلَدِ'],['The','girl','rolls','it','back']], 'sentence_scene':2,
 'endings':[['عَادَتِ الكُرَةُ إِلَى الوَلَدِ.','اِلْتَقَطَتِ البِنْتُ الكُرَةَ بِيَدَيْهَا.'],['The ball returns to the boy.','The girl catches the ball with both hands.']], 'ending_scenes':[3,2],
 'real':['دحرج كرة آمنة مع مرافق، وسمّ الفعل: أمسك، أدحرج، ألتقط.','Roll a safe ball with a companion. Say hold, roll, catch.'],'skill':['أبني جملة بفعل','Build an action sentence']},
 {'id':'notice-and-explain','source':'cat','track':'extend','title':['ألاحظ وأفسّر','Notice and explain'],
 'ar':['صُنْدُوقٌ فَارِغٌ، وَالقِطُّ بِجَانِبِهِ.','القِطُّ يَخْتَارُ الدُّخُولَ إِلَى الصُّنْدُوقِ.','يَخْرُجُ القِطُّ. لَمْ يُغْلَقِ الصُّنْدُوقُ.','أَصْبَحَ دَاخِلُ الصُّنْدُوقِ نَاعِمًا. مَاذَا قَدْ يَخْتَارُ القِطُّ بَعْدَ ذَلِكَ؟'],
 'en':['An empty box sits beside the cat.','The cat chooses to climb inside.','The cat walks out. The box stays open.','Now the box has a soft blanket. What might the cat choose next?'],
 'question':['ما الذي أضافه الولد إلى الصندوق؟','What does Sam add to the box?'],'choices':[('غطاء ناعم','A soft blanket',3),('القط دخل','The cat went in',1)],'word':['ar-cat','en-cat'],
 'practice':[['الوَلَدُ','أَضَافَ','غِطَاءً'],['Sam','adds','softness']], 'extend':[['وَضَعَ','الوَلَدُ','غِطَاءً','نَاعِمًا','دَاخِلًا'],['Sam','puts','a','blanket','inside']], 'sentence_scene':3,
 'endings':[['أَضَافَ الوَلَدُ غِطَاءً نَاعِمًا، وَتَرَكَ الصُّنْدُوقَ مَفْتُوحًا.','خَرَجَ القِطُّ بِحُرِّيَّةٍ، وَبَقِيَ بِجَانِبِ الصُّنْدُوقِ.'],['Sam adds a blanket and leaves the box open.','The cat freely leaves the box and waits beside it.']], 'ending_scenes':[3,2],
 'real':['قل: أرى… ثم قل: أعتقد… ما الفرق بين ما رأيته وما توقعته؟','Say I see, then I think. Which idea did you observe, and which did you predict?'],'skill':['أفصل الملاحظة عن التوقع','Observe and predict']},
 {'id':'polite-words','source':'door','track':'extend','title':['أقول جملة لطيفة','Polite words'],
 'ar':['وَقَفَ عُمَرُ أَمَامَ البَابِ.','طَرَقَ عُمَرُ البَابَ بِرِفْقٍ.','اِنْتَظَرَ عُمَرُ حَتَّى فُتِحَ البَابُ.','حَيَّا عُمَرُ مَنْ فِي الدَّاخِلِ، ثُمَّ دَخَلَ.'],
 'en':['Sam stands at the door.','Sam knocks gently.','Sam waits until the door opens.','Sam says hello, then steps inside.'],
 'question':['أي صورة تسبق الدخول؟','Which picture comes before going inside?'],'choices':[('الباب مفتوح','An open door',2),('وقف أولًا','First he stands',0)],'word':['ar-door','en-tap'],
 'practice':[['عُمَرُ','طَرَقَ','البَابَ'],['Sam','knocks','gently']], 'extend':[['حَيَّا','عُمَرُ','مَنْ','فِي','الدَّاخِلِ'],['Sam','says','hello','before','entering']], 'sentence_scene':3,
 'endings':[['فُتِحَ البَابُ، وَعُمَرُ يَنْتَظِرُ بِهُدُوءٍ.','حَيَّا عُمَرُ مَنْ فِي الدَّاخِلِ، ثُمَّ دَخَلَ.'],['The door opens while Sam waits calmly.','Sam says hello, then goes inside.']], 'ending_scenes':[2,3],
 'real':['مع المرافق، مثّل التحية وانتظار الإذن عند باب داخلي في البيت.','With your companion, practise a greeting and waiting at an inside door.'],'skill':['أحكي حوارًا قصيرًا','Tell a short dialogue']}
]
for lang,text,units,phones,transfer,tunits,tphones in [
 ('ar','كُرَة',['كُ','رَة'],['kU','ra'],'كُرَات',['كُ','رَا','ت'],['kU','ra:','t']),
 ('en','ball',['b','a','ll'],['b','O:','l'],'bell',['b','e','ll'],['b','E','l'])]:
 id=lang+'-ball-word';d['words'][id]={'id':id,'language':lang,'text':text,'units':units,'phonetic_units':phones,'unit_audio':['audio/'+id+'-sound-'+str(i)+'.mp3' for i in range(len(units))], 'audio':'audio/'+id+'-word.mp3','phrase':'كُرَةٌ تَتَدَحْرَجُ.' if lang=='ar' else 'Roll the ball.','phrase_audio':'audio/'+id+'-phrase.mp3','transfer':transfer,'transfer_audio':'audio/'+id+'-transfer.mp3','image':'../../../resources/early-child-visuals/objects/ball.svg','mode':'syllables' if lang=='ar' else 'phonemes','transfer_units':tunits,'transfer_phonetic_units':tphones,'transfer_unit_audio':['audio/'+id+'-new-sound-'+str(i)+'.mp3' for i in range(len(tunits))]}
new_ids={lang+'-'+p['id'] for p in pairs for lang in ('ar','en')};d['stories']=[s for s in d['stories'] if s['id'] not in new_ids]
for p in pairs:
 prefix=p['id'];scenes=[]
 for i in range(4):
  id=prefix+'-'+str(i);scenes.append(id);s=copy.deepcopy(d['scenes'][p['source']+'-'+str(i)]);s.update(id=id,text={lang:p[lang][i] for lang in ('ar','en')},audio={lang:'audio/'+lang+'-'+id+'.mp3' for lang in ('ar','en')});d['scenes'][id]=s
 for li,lang in enumerate(('ar','en')):
  id=lang+'-'+prefix;story={'id':id,'language':lang,'title':p['title'][li],'track':p['track'],'scenes':scenes[:3] if p['track']=='entry' else scenes[:], 'optional_scene':scenes[3], 'word':p['word'][li],'question':p['question'][li],'question_audio':'audio/'+id+'-question.mp3','choices':[{'label':choice[li],'scene':scenes[choice[2]]} for choice in p['choices']], 'meaning':0,'real_world':p['real'][li],'coach_tip':'استمع للمحاولة وقل ما لاحظته. اقرأ أو مثّل مثالًا عند الحاجة ثم أعد الدور للطفل؛ لا تقييم آلي للنطق.' if lang=='ar' else 'Listen to the try and describe what you noticed. Model one example, then return the turn to the child. No automated pronunciation scores.', 'title_audio':'audio/'+id+'-title.mp3','skill':p['skill'][li], 'sentences':{},'endings':[]}
  for track in ('practice','extend'):
   units=p[track][li]
   # The two sentence levels can describe different pictures in the same story.
   sentence_scenes={'first-next-last':{'practice':2},'in-and-out':{'extend':2},'look-for-clues':{'practice':1},'ball-actions':{'extend':3},'polite-words':{'practice':1}}
   picture=sentence_scenes.get(prefix,{}).get(track,p['sentence_scene'])
   story['sentences'][track]={'text':' '.join(units)+'.','units':units,'scene':scenes[picture],'audio':'audio/'+id+'-sentence-'+track+'.mp3','unit_audio':['audio/'+lang+'-token-'+hashlib.sha1(unit.encode()).hexdigest()[:10]+'.mp3' for unit in units]}
  for i,text in enumerate(p['endings'][li]):story['endings'].append({'text':text,'scene':scenes[p['ending_scenes'][i]],'audio':'audio/'+id+'-ending-'+str(i)+'.mp3'})
  d['stories'].append(story)
d['release']='preview-3';d['library_version']=3
(ROOT/'data/stories.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
(ROOT/'data/stories.js').write_text('window.STORY_DATA='+json.dumps(d,ensure_ascii=False,separators=(',',':'))+';\n')
print(json.dumps({'stories':len(d['stories']),'scenes':len(d['scenes']),'words':len(d['words'])}))
