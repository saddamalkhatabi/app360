"""Compile reviewed, authored bilingual cases; never invent text from titles."""
import json,pathlib,hashlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
SRC=ROOT/'tools/curriculum'
pilot=json.loads((SRC/'pilot-original.json').read_text())
english=json.loads((SRC/'pilot-en.json').read_text())
stages=[0,1,2,3,5,6]
common={
 'intro':('نَسْمَعُ حَاجَةَ كُلِّ شَرِيكٍ، وَنُقَارِنُ حَلَّيْنِ. نُجَرِّبُ اتِّفَاقَنَا، ثُمَّ نُرَاجِعُهُ. يُمْكِنُ التَّوَقُّفُ وَطَلَبُ الْمُسَاعَدَةِ.','Listen to each partner and compare two plans. Try your agreement, then review it. You may stop or ask for help.'),
 'help':('نَقُولُ مَا نَحْتَاجُهُ، وَنَسْتَعِينُ بِمُرَافِقٍ. لَا نَفْرِضُ مُوَافَقَةً، وَلِكُلِّ شَرِيكٍ حَقُّ الرَّفْضِ.','Say what you need and ask a grown-up for help. Agreement is a choice. Every partner may say no.'),
 'break':('نَأْخُذُ اسْتِرَاحَةً. لَا نَحْتَاجُ إِلَى إِكْمَالِ اللَّعِبِ الْآنَ. نَعُودُ عِنْدَمَا نَكُونُ مُسْتَعِدِّينَ.','Take a break. You do not have to keep playing now. Return when you are ready.'),
 'saved':('حَفِظْنَا اتِّفَاقًا جَرَّبْنَاهُ. يُمْكِنُ أَنْ نَعُودَ إِلَيْهِ وَنُعَدِّلَهُ عِنْدَمَا تَتَغَيَّرُ حَاجَتُنَا.','We saved an agreement we tried. We can return to it and change it when our needs change.'),
 'compare':('قَارِنَا الْحَلَّيْنِ. اخْتَارَا مَا يُنَاسِبُكُمَا، أَوِ اطْلُبَا بَدِيلًا وَمُسَاعَدَةً. الْمُوَافَقَةُ اخْتِيَارٌ.','Compare both plans. Choose what suits you both, or ask for another idea and help. Agreement is a choice.'),
 'teacher':('أَنَا الْمُدَرِّبَةُ. سَنُشَاهِدُ الْمَوَاقِفَ وَنَسْمَعُ الْأَفْكَارَ. هَذِهِ مُشَاهَدَةٌ، ثُمَّ نَسْتَطِيعُ أَنْ نَخْتَارَ مَوْقِفًا وَنُجَرِّبَهُ فِعْلًا.','I am your teacher. We will watch situations and listen to ideas. This is a demonstration. Afterwards, choose a situation and try it yourself.'),
 'transition':('نَنْتَقِلُ لِمَوْقِفٍ جَدِيدٍ. نُفَكِّرُ فِي حَاجَةِ كُلِّ شَرِيكٍ، وَلَا نَفْرِضُ الْحَلَّ.','Let us look at a new situation. Think about each partner’s needs without forcing a solution.')}
manifest={}; images=[]
def clip(text,lang,path):
 old=manifest.get(path)
 assert not old or old['text']==text,path
 manifest[path]={'path':path,'text':text,'language':lang,'engine':'silma' if lang=='ar' else 'edge-jenny'}
 return path
def row(text,lang,name,frame):return {'text':text,'frame':frame,'audio':clip(text,lang,'audio/'+lang+'/'+name+'.mp3')}
for c in pilot['cases']:
 en=english[c['id']];e={k:v for k,v in en.items() if k not in ['steps','solutions']}
 e['steps']=[dict(row(text,'en',c['id']+'-'+str(c['steps'][i]['stage']),c['steps'][i]['frame']),stage=c['steps'][i]['stage']) for i,text in enumerate(en['steps'])]
 e['solutions']=[dict(row(sol['text'],'en',c['id']+'-solution-'+str(i),c['solutions'][i]['frame']),title=sol['title'],rule=sol['rule']) for i,sol in enumerate(en['solutions'])]
 c['i18n']={'en':e}
 for item in c['steps']+c['solutions']:clip(item['text'],'ar',item['audio'])
def pair(s):
 p=s.split('|');assert len(p)==2,s
 return p
def solution(s):
 return [x.split(';',1) for x in pair(s)]
for track in ['entry','practice','extend']:
 for block in (SRC/(track+'.txt')).read_text().strip().split('\n\n'):
  z=block.splitlines();assert len(z)==11,(z[0],len(z));key=z[0]
  title=pair(z[1]);intro=pair(z[2]);needs=[x.split('/') for x in pair(z[3])];assert all(len(x)==2 for x in needs)
  request=pair(z[4]);a=solution(z[5]);b=solution(z[6]);trial=pair(z[7]);review=pair(z[8]);coach=pair(z[9]);c={'id':key,'track':track,'sheet':'assets/'+key+'-atlas.webp','fallback':'assets/'+key+'-atlas.jpg','i18n':{}}
  for n,lang in enumerate(['ar','en']):
   textneeds=('يَقُولُ أَحَدُنَا: '+needs[n][0]+'. وَيَقُولُ الْآخَرُ: '+needs[n][1]+'.') if lang=='ar' else ('One partner says: '+needs[n][0]+'. The other says: '+needs[n][1]+'.')
   texts=[intro[n],textneeds,request[n],common['compare'][n],trial[n],review[n]]
   steps=[]
   for stage,frame,text in zip(stages,[0,1,2,3,6,7],texts):
    path='common-compare' if stage==3 else key+'-'+str(stage)
    steps.append(dict(row(text,lang,path,frame),stage=stage))
   view={'title':title[n],'skill':request[n],'names':(['سامي','ليان'] if track=='entry' else ['عمر','هناء'] if track=='practice' else ['آدم','ريم','زيد']) if lang=='ar' else (['Sami','Layan'] if track=='entry' else ['Omar','Hana'] if track=='practice' else ['Adam','Reem','Zaid']),
    'needs':needs[n],'steps':steps,'solutions':[dict(row(v[n][1],lang,key+'-solution-'+str(i),4+i),title=v[n][0],rule=v[n][1]) for i,v in enumerate([a,b])],
    'coach':coach[n],'easier':('مثّل الأدوار بدمى، وقدم اقتراحًا واحدًا في كل مرة. اسمح بالإشارة أو التوقف.' if lang=='ar' else 'Act out the roles with toys and show one idea at a time. Pointing and stopping are welcome.'),
    'harder':('اطلب تفسير ما تغير بعد تجربة البديلين، ثم اقتراح تعديل ومراجعته.' if lang=='ar' else 'Ask what changed after trying both plans, then suggest and review one adjustment.')}
   if lang=='ar':c.update(view)
   else:c['i18n']['en']=view
  pilot['cases'].append(c);images.append({'id':key,'track':track,'title':title[1],'visual':z[10]})
pilot['common']={};pilot['common_en']={}
for key,texts in common.items():
 for n,lang in enumerate(['ar','en']):pilot['common' if n==0 else 'common_en'][key]=row(texts[n],lang,'common-'+key,0)
pilot['schema']=2;pilot['release']='cooperate-60-bilingual-1';pilot['ideas']=[]
assert len(pilot['cases'])==60
for track in ['entry','practice','extend']:assert sum(c['track']==track for c in pilot['cases'])==20
(ROOT/'data/content.json').write_text(json.dumps(pilot,ensure_ascii=False,indent=2)+'\n')
(ROOT/'data/content.js').write_text('window.COOPERATE_CONTENT='+json.dumps(pilot,ensure_ascii=False,separators=(',',':'))+';\n')
for name,items in [('audio-manifest.json',list(manifest.values())),('arabic-audio-manifest.json',[r for r in manifest.values() if r['language']=='ar']),('english-audio-manifest.json',[r for r in manifest.values() if r['language']=='en'])]:
 (ROOT/'data'/name).write_text(json.dumps({'schema':1,'voices':{'en':'en-US-JennyNeural'},'rate':'-6%','items':items},ensure_ascii=False,indent=2)+'\n')
(SRC/'image-plan.json').write_text(json.dumps(images,ensure_ascii=False,indent=2)+'\n')
print('Authored',len(pilot['cases']),'cases;',len(manifest),'unique bilingual clips;',len(images),'new atlases')
