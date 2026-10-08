"""Author the small storyboard pilot; no private child data enters this build."""
import json, pathlib
ROOT = pathlib.Path(__file__).resolve().parents[1]
def pair(ar, en): return {'ar': ar, 'en': en}
bridge = [
 ('ورقة مسطحة','Flat paper','هٰذا جِسْرٌ مِنْ وَرَقَةٍ مُسَطَّحَةٍ. السَّيَّارَةُ تَنْتَظِرُ. هَلْ تَحْمِلُها الوَرَقَةُ؟','This bridge uses flat paper. The car is waiting. Will the paper hold it?', 'مسطحة','Flat'),
 ('نلاحظ الانحناء','Notice the bend','وَصَلَتِ السَّيَّارَةُ إِلى الوَسَطِ. اِنْحَنَتِ الوَرَقَةُ في هٰذا المَشْهَدِ. أَشِرْ إِلى الاِنْحِناءِ.','The car reached the middle. The paper bent in this scene. Point to the bend.', 'مسطحة','Flat'),
 ('نطوي الورقة','Fold the paper','نَطْوي الوَرَقَةَ ثَنَياتٍ مُتَتابِعَةً. نُبْقي السَّيَّارَةَ وَالدَّعامَتَيْنِ. تَوَقَّعْ ما سَيَحْدُثُ.','We fold the paper into pleats. We keep the car and supports. Predict what will happen.', 'ثنيات متتابعة','Pleated'),
 ('السيارة تعبر','The car crosses','في هٰذا المَشْهَدِ، عَبَرَتِ السَّيَّارَةُ الجِسْرَ المَطْوِيَّ. ما الَّذي غَيَّرْناهُ في الوَرَقَةِ؟','In this scene, the car crossed the folded bridge. What did we change in the paper?', 'ثنيات متتابعة','Pleated'),
 ('فجوة طويلة','A long gap','نُبْعِدُ الدَّعامَتَيْنِ. يَصيرُ الاِمْتِدادُ طَويلًا. نُبْقي الوَرَقَةَ مَطْوِيَّةً وَاللُّعْبَةَ نَفْسَها.','We move the supports apart. The span becomes long. We keep folded paper and the same toy.', 'طويل','Long'),
 ('نلاحظ الوسط','Watch the middle','في هٰذا المَشْهَدِ، هَبَطَ وَسَطُ الجِسْرِ الطَّويلِ تَحْتَ السَّيَّارَةِ. كَيْفَ نُقَلِّلُ الاِمْتِدادَ؟','In this scene, the middle of the long bridge sagged under the car. How could we shorten the span?', 'طويل','Long'),
 ('نقرب الدعامتين','Move supports closer','نُقَرِّبُ الدَّعامَتَيْنِ. يَصيرُ الاِمْتِدادُ أَقْصَرَ. اِخْتَبِرْ نَفْسَ اللُّعْبَةِ مَرَّةً أُخْرى.','We move the supports closer. The span is shorter. Test the same toy again.', 'قصير','Short'),
 ('عبور على امتداد قصير','Crossing a short span','عَبَرَتِ السَّيَّارَةُ في هٰذا المَشْهَدِ. غَيَّرْنا المَسافَةَ بَيْنَ الدَّعامَتَيْنِ. قارِنْها بِالمَشْهَدِ الطَّويلِ.','The car crossed in this scene. We changed the distance between the supports. Compare it with the long span.', 'قصير','Short'),
 ('دعامات ضيقة','Narrow supports','هٰذِهِ دَعاماتٌ ضَيِّقَةٌ. نُبْقي الجِسْرَ مَطْوِيًّا. راقِبْ ثَباتَ الدَّعامَةِ عِنْدَ مُرورِ السَّيَّارَةِ.','These supports are narrow. We keep the bridge folded. Watch the support as the car passes.', 'ضيقة','Narrow'),
 ('دعامة تميل','A support tilts','مالَتْ دَعامَةٌ وَهَبَطَ طَرَفُ الجِسْرِ في هٰذا المَشْهَدِ. ما الَّذي يَحْتاجُ إِلى تَثْبيتٍ؟','A support tilted and the bridge end dropped in this scene. What needs to be made stable?', 'ضيقة','Narrow'),
 ('دعامات عريضة','Wide supports','نَسْتَخْدِمُ دَعاماتٍ أَعْرَضَ. نُبْقي الطَّيَّ وَاللُّعْبَةَ. تَوَقَّعْ ثَباتَ الجِسْرِ.','We use wider supports. We keep the fold and toy. Predict how stable the bridge will be.', 'عريضة','Wide'),
 ('نلاحظ الثبات','Notice stability','عَبَرَتِ السَّيَّارَةُ وَبَقِيَتِ الدَّعاماتُ ثابِتَةً في هٰذا المَشْهَدِ. اِشْرَحْ دَوْرَ الدَّعاماتِ لِمُدَرِّبِكَ.','The car crossed and the supports stayed stable in this scene. Explain the role of supports to your coach.', 'عريضة','Wide')
]
track = [
 ('ميل قليل','A shallow slope','هٰذا مَسارٌ بِمَيْلٍ قَليلٍ. الكُرَةُ في البِدايَةِ. تَوَقَّعْ أَيْنَ سَتَتَوَقَّفُ.','This ramp has a shallow slope. The ball is at the start. Predict where it will stop.', 'قليل','Shallow'),
 ('قبل الهدف','Before the target','في هٰذا المَشْهَدِ، تَوَقَّفَتِ الكُرَةُ قَبْلَ الحَلْقَةِ. أَشِرْ إِلى الكُرَةِ ثُمَّ الهَدَفِ.','In this scene, the ball stopped before the ring. Point to the ball, then the target.', 'قليل','Shallow'),
 ('ميل متوسط','A moderate slope','نَرْفَعُ بِدايَةَ المَسارِ قَليلًا. يَصيرُ المَيْلُ مُتَوَسِّطًا. نُبْقي الكُرَةَ وَالهَدَفَ.','We raise the start a little. The slope becomes moderate. We keep the ball and target.', 'متوسط','Moderate'),
 ('داخل الهدف','Inside the target','وَصَلَتِ الكُرَةُ إِلى الحَلْقَةِ في هٰذا المَشْهَدِ. كَيْفَ تَغَيَّرَ مَيْلُ المَسارِ؟','The ball reached the ring in this scene. How did the slope change?', 'متوسط','Moderate'),
 ('ميل كبير','A steep slope','نَرْفَعُ البِدايَةَ أَكْثَرَ. يَصيرُ المَيْلُ كَبيرًا. هَلْ تَتَوَقَّفُ الكُرَةُ عِنْدَ الهَدَفِ؟','We raise the start more. The slope becomes steep. Will the ball stop at the target?', 'كبير','Steep'),
 ('تجاوزت الهدف','Past the target','تَجاوَزَتِ الكُرَةُ الحَلْقَةَ في هٰذا المَشْهَدِ. قارِنِ المَيْلَ الكَبيرَ بِالمُتَوَسِّطِ.','The ball passed the ring in this scene. Compare the steep slope with the moderate slope.', 'كبير','Steep'),
 ('دون حواف','Without rails','هٰذا مَسارٌ بِلا حَوافٍّ جانِبِيَّةٍ. نُبْقي المَيْلَ مُتَوَسِّطًا. راقِبْ اِتِّجاهَ الكُرَةِ.','This ramp has no side rails. We keep a moderate slope. Watch the direction of the ball.', 'دون حواف','No rails'),
 ('خارج المسار','Off the path','في هٰذا المَشْهَدِ، خَرَجَتِ الكُرَةُ عَنْ اِتِّجاهِ المَسارِ. ما الَّذي قَدْ يُساعِدُها عَلى البَقاءِ فيهِ؟','In this scene, the ball moved off the intended path. What might help it stay on the path?', 'دون حواف','No rails'),
 ('نضيف الحواف','Add rails','نُضيفُ حَوافَّ جانِبِيَّةً. نُبْقي المَيْلَ وَالكُرَةَ. تَوَقَّعْ اِتِّجاهَ حَرَكَتِها.','We add side rails. We keep the slope and ball. Predict the direction it will travel.', 'حواف مرتفعة','Raised rails'),
 ('تتبع المسار','Following the path','بَقِيَتِ الكُرَةُ في اِتِّجاهِ المَسارِ وَوَصَلَتْ إِلى الحَلْقَةِ في هٰذا المَشْهَدِ. ما دَوْرُ الحَوافِّ؟','The ball followed the path and reached the ring in this scene. What did the rails do?', 'حواف مرتفعة','Raised rails'),
 ('هدف بعيد','A far target','الحَلْقَةُ بَعيدَةٌ عَنْ نِهايَةِ المَسارِ. لَمْ تَصِلْ إِلَيْها الكُرَةُ في هٰذا المَشْهَدِ. أَيْنَ نَضَعُها؟','The ring is far from the ramp end. The ball has not reached it in this scene. Where could we put it?', 'بعيد','Far'),
 ('هدف قريب','A near target','نُقَرِّبُ الحَلْقَةَ مِنْ نِهايَةِ المَسارِ. وَصَلَتِ الكُرَةُ في هٰذا المَشْهَدِ. غَيَّرْنا مَكانَ الهَدَفِ.','We move the ring closer to the ramp end. The ball reached it in this scene. We changed the target position.', 'قريب','Near')
]
levels = [
 {'id':1,'age':'4–5','title':pair('أشاهد وألاحظ','Watch and notice'),'goal':pair('توقع بسيط ثم إشارة إلى ما تغيّر.','Make a simple prediction and point to a change.')},
 {'id':2,'age':'5–6','title':pair('أقارن تغييرًا واحدًا','Compare one change'),'goal':pair('قارن قبل وبعد مع إبقاء الأشياء الأخرى قدر الإمكان.','Compare before and after while keeping other things as similar as possible.')},
 {'id':3,'age':'6–8','title':pair('أفسر وأجرّب مع المدرب','Explain and try with a coach'),'goal':pair('ناقش وظيفة الجزء، ثم جرّب كل تغيير على حدة.','Discuss what each part does, then try each change separately.')}
]
projects=[];audio=[]
for id,rows,title in [('bridge',bridge,pair('جسر اللعب','Toy bridge')),('track',track,pair('مسار الكرة','Ball ramp'))]:
 scenes=[]
 for i,(ar,en,text_ar,text_en,val_ar,val_en) in enumerate(rows):
  variable=('fold' if i<4 else 'span' if i<8 else 'support') if id=='bridge' else ('slope' if i<6 else 'rail' if i<10 else 'target')
  labels={'fold':pair('شكل الطي','Paper fold'),'span':pair('امتداد الجسر','Bridge span'),'support':pair('عرض الدعامات','Support width'),'slope':pair('ميل المسار','Ramp slope'),'rail':pair('الحواف الجانبية','Side rails'),'target':pair('مكان الهدف','Target position')}
  kept=pair('اللعبة والورقة • نركز على '+labels[variable]['ar'],'Toy and paper • focus on '+labels[variable]['en']) if id=='bridge' else pair('الكرة نفسها • نركز على '+labels[variable]['ar'],'Same ball • focus on '+labels[variable]['en'])
  item={'id':id+'-'+str(i),'atlas':'assets/scenes/'+id+'-'+('a' if i<6 else 'b')+'.jpg','cell':i%6,'title':pair(ar,en),'text':pair(text_ar,text_en),'variable':labels[variable],'value':pair(val_ar,val_en),'kept':kept,'audio':{}}
  for language in ['ar','en']:
   clip='audio/'+language+'/scene-'+id+'-'+str(i)+'.mp3';item['audio'][language]=clip;audio.append({'language':language,'path':clip,'text':item['text'][language]})
  scenes.append(item)
 routes={'1':[0,1,2,3],'2':[4,5,6,7],'3':[8,9,10,11]} if id=='bridge' else {'1':[0,1,2,3],'2':[2,3,4,5],'3':[6,7,8,9,10,11]}
 coach=pair('جهّز ورقًا كبيرًا ودعامتين ثابتتين ولعبة خفيفة. أبعد الأصابع عند ميل الدعامة. لا تحمل الجسور أشخاصًا. جرّب نوع الورق والحمل الفعلي؛ الصور حالات توضيحية وليست قياسات.','Prepare large paper, stable supports and a light toy. Keep fingers clear of a tilting support. Never put people on a bridge. Test your actual paper and load; images illustrate cases, not measurements.') if id=='bridge' else pair('استخدم كرة كبيرة غير قابلة للبلع، وميلًا منخفضًا ومكانًا خاليًا. ثبّت المسار مع بالغ. تختلف الحركة باختلاف السطح والكرة؛ الصور حالات توضيحية.','Use a large ball that cannot be swallowed, a low ramp and a clear area. Secure it with an adult. Movement varies with the surface and ball; the pictures are illustrative cases.')
 projects.append({'id':id,'title':title,'scenes':scenes,'routes':routes,'coach':coach})
data={'schema':1,'pilot':True,'levels':levels,'projects':projects}
(ROOT/'src/story-content.js').write_text('window.MAKER_STORIES='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
(ROOT/'data/story-content.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
manifest={'voices':{'ar':'ar-SA-ZariyahNeural','en':'en-US-JennyNeural'},'rate':'-10%','items':audio}
(ROOT/'data/story-audio-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Authored',len(projects),'projects;',len(audio),'scene recordings')
