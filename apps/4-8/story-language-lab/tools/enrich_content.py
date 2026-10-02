"""Build the local, bilingual level and spoken-instruction data (no runtime service)."""
import json, pathlib, hashlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
d = json.loads((ROOT / 'data/stories.json').read_text())
d['release'] = 'preview-' + str(max(2, d.get('library_version', 2)))
d['levels'] = [
 {'id':'entry','number':1,'age_min':4,'age_max':5,'ar':'أسمع وأكتشف','en':'Listen & discover','icon':'◉','steps':['listen','meaning','order','compose'],'compose_max':3},
 {'id':'practice','number':2,'age_min':5,'age_max':6,'ar':'أركّب وأقرأ','en':'Build & read','icon':'▦','steps':['listen','order','word','sentence','compose'],'compose_max':4},
 {'id':'extend','number':3,'age_min':6,'age_max':8,'ar':'أحكي وأؤلف','en':'Tell & create','icon':'✦','steps':['listen','order','meaning','word','sentence','compose','review'],'compose_max':5}
]
texts = {
 'home':('اختر مستوى، ثم اضغط صورة الحكاية. سأساعدك بالصوت في كل خطوة.','Choose a level, then tap a story picture. I can help you hear every step.'),
 'entry':('نسمع الحكاية، ونختار الصور، ونحكي نهاية جديدة.','Listen to a story, choose pictures, and make a new ending.'),
 'practice':('نرتب الصور، ونركب كلمة، ثم نبني جملة ونهاية.','Order the pictures, build a word, then make a sentence and an ending.'),
 'extend':('نكتشف المعنى، ونجرب كلمة جديدة، ثم نؤلف حكايتنا.','Find the meaning, try a new word, then create your own story.'),
 'listen':('اضغط الصورة لتسمعها. أو اضغط اسمع الحكاية لتسمع كل المشاهد.','Tap the picture to hear it. Or tap Hear the story to hear every picture.'),
 'order':('اضغط صورة البداية، ثم الصورة التالية. اضغط صورة وضعتها إذا أردت إعادتها.','Tap the first picture, then the next one. Tap a placed picture to return it.'),
 'meaning':('اسمع السؤال، ثم اضغط الصورة التي تختارها. يمكنك المحاولة مرة أخرى.','Hear the question, then tap the picture you choose. You can try again.'),
 'word':('اضغط الأصوات لتسمعها وتبني الكلمة. اضغط اسمع الكلمة إذا احتجت مساعدة.','Tap the sounds to hear them and build the word. Tap Hear the word for help.'),
 'sentence':('اضغط الكلمات لتسمعها وتبني الجملة. اضغط كلمة وضعتها لإعادتها.','Tap the words to hear them and build the sentence. Tap a placed word to return it.'),
 'compose':('هذه حكايتك. اختر نهاية بالصورة، ثم اضغط احفظ حكايتي. يمكنك تغيير المشاهد أيضًا.','This is your story. Pick a picture ending, then tap Save my story. You can change the pictures too.'),
 'review':('اختر ما أحببته في محاولتك. يمكنك حكيه أو كتابته، ثم احفظ الحكاية.','Choose what you liked about your try. Tell it or write it, then save the story.'),
 'retry':('لنسمع ونلاحظ مرة أخرى. يمكنك تغيير اختيارك.','Listen and look again. You can change your choice.'),
 'meaning-found':('هذه الصورة تساعدنا على فهم الحكاية. ماذا لاحظت؟','This picture helps us understand the story. What did you notice?'),
 'order-ready':('ترتيبك جاهز. اسمع الحكاية ولاحظ ما تغير.','Your sequence is ready. Hear the story and notice what changed.'),
 'saved':('حكايتك محفوظة. يمكنك سماعها أو بدء حكاية أخرى.','Your story is saved. You can hear it or start another story.'),
 'next-level':('جربت حكايات هذا المستوى. يمكنك تجربة المستوى التالي أو البقاء هنا.','You tried stories at this level. Try the next level, or stay here.')
}
d['guides'] = {}
for name, pair in texts.items():
 d['guides'][name]={lang:{'text':text,'audio':f'audio/{lang}-guide-{name}.mp3'} for lang,text in zip(['ar','en'],pair)}
sentences={
 'ar-cup': [('لَيْلَى أَمْسَكَتِ الْكُوبَ.','cup-3'),('أَمْسَكَتْ لَيْلَى الْكُوبَ بِفَرَحٍ.','cup-3')],
 'ar-ball':[('عُمَرُ دَحْرَجَ الْكُرَةَ.','ball-1'),('دَحْرَجَ عُمَرُ الْكُرَةَ إِلَى لَيْلَى.','ball-1')],
 'ar-door':[('عُمَرُ طَرَقَ الْبَابَ.','door-1'),('طَرَقَ عُمَرُ الْبَابَ بِلُطْفٍ.','door-1')],
 'ar-cat':[('الْقِطَّةُ فِي الصُّنْدُوقِ.','cat-1'),('جَلَسَتِ الْقِطَّةُ بِجَانِبِ الصُّنْدُوقِ الْمَفْتُوحِ.','cat-2')],
 'ar-writer':[('لَيْلَى وَجَدَتِ الْكُوبَ.','cup-2'),('أَبْعَدَتْ لَيْلَى الْكِتَابَ فَظَهَرَ الْكُوبُ.','cup-2')],
 'ar-ending':[('الْقِطَّةُ تَخْتَارُ مَكَانَهَا.','cat-3'),('بَقِيَتِ الْقِطَّةُ بِجَانِبِ صُنْدُوقٍ مَفْتُوحٍ.','cat-3')],
 'en-cup':[('Mia holds it.','cup-3'),('Mia finds her hidden cup.','cup-2')],
 'en-ball':[('Sam rolls it.','ball-1'),('Mia rolls the ball back.','ball-3')],
 'en-door':[('Sam taps gently.','door-1'),('Dad opens the green door.','door-2')],
 'en-cat':[('The cat sits.','cat-1'),('The cat leaves its box.','cat-2')],
 'en-writer':[('Sam shares it.','ball-1'),('Sam shares his golden ball.','ball-1')],
 'en-ending':[('The cat chooses.','cat-3'),('The cat chooses its bed.','cat-3')]
}
endings={
 'cup':{'ar':[('أَمْسَكَتْ لَيْلَى كُوبَهَا وَابْتَسَمَتْ.','cup-3'),('ظَهَرَ الْكُوبُ وَبَقِيَ الْكِتَابُ بِجَانِبِهِ.','cup-2')], 'en':[('Mia holds her cup and smiles.','cup-3'),('Mia finds the cup beside her book.','cup-2')]},
 'ball':{'ar':[('لَعِبَ الصَّدِيقَانِ بِالدَّوْرِ.','ball-3'),('أَمْسَكَتْ لَيْلَى الْكُرَةَ وَابْتَسَمَتْ.','ball-2')], 'en':[('The friends take turns with the ball.','ball-3'),('Mia catches the ball and smiles.','ball-2')]},
 'cat':{'ar':[('جَهَّزْنَا لِلْقِطَّةِ مَكَانًا نَاعِمًا.','cat-3'),('بَقِيَتِ الْقِطَّةُ حُرَّةً بِجَانِبِ الصُّنْدُوقِ.','cat-2')], 'en':[('We make a soft place for the cat.','cat-3'),('The cat stays free beside the box.','cat-2')]},
 'door':{'ar':[('دَخَلَ عُمَرُ مَعَ أَبِيهِ وَحَكَى حِكَايَتَهُ.','door-3'),('رَحَّبَ الْأَبُ بِعُمَرَ عِنْدَ الْبَابِ.','door-2')], 'en':[('Sam walks in with Dad and tells his story.','door-3'),('Dad welcomes Sam at the door.','door-2')]}
}
for s in d['stories']:
 if s['id'] not in sentences: continue
 s['title_audio']=f"audio/{s['id']}-title.mp3"
 s['sentences']={}
 for track,(text,scene) in zip(['practice','extend'],sentences[s['id']]):
  units=text.rstrip('.').split(' ')
  s['sentences'][track]={'text':text,'units':units,'scene':scene,'audio':f"audio/{s['id']}-sentence-{track}.mp3",'unit_audio':[f"audio/{s['language']}-token-{hashlib.sha1(x.encode()).hexdigest()[:10]}.mp3" for x in units]}
 group=s['scenes'][0].split('-')[0]
 s['endings']=[{'text':text,'scene':scene,'audio':f"audio/{s['language']}-{group}-ending-{i}.mp3"} for i,(text,scene) in enumerate(endings[group][s['language']])]
for s in d['scenes'].values():
 if s['sheet'].endswith('.png'):
  base=s['sheet'][:-4];s['sheet']=base+'-1024.webp';s['small_sheet']=base+'-640.webp';s['fallback_sheet']=base+'-640.jpg';s['large_fallback']=base+'-1024.jpg'
transfers={
 'ar-cup':(['تُو','ت'],['tu:','t']), 'ar-play':(['كَ','تَ','بَ'],['ka','ta','ba']),
 'ar-door':(['تَا','ج'],['ta:','dZ']), 'ar-cat':(['سِ','تَّة'],['si','t:a']),
 'ar-write':(['كَ','تَ','مَ'],['ka','ta','ma']), 'ar-book':(['كِ','تَا','بِي'],['ki','ta:','bi:'])
}
for w in d['words'].values():
 if w['language']=='ar' and w['id'] not in transfers: continue
 units,phones=transfers[w['id']] if w['language']=='ar' else (list(w['transfer']),[{'a':'a','u':'V','c':'k'}.get(x,x) for x in w['transfer']])
 w['transfer_units']=units;w['transfer_phonetic_units']=phones;w['transfer_unit_audio']=[f"audio/{w['id']}-new-sound-{i}.mp3" for i in range(len(units))]
(ROOT/'data/stories.json').write_text(json.dumps(d,ensure_ascii=False,indent=2)+'\n')
(ROOT/'data/stories.js').write_text('window.STORY_DATA='+json.dumps(d,ensure_ascii=False,separators=(',',':'))+';\n')
print('Built three levels, spoken guidance, sentence workshops and picture endings')
