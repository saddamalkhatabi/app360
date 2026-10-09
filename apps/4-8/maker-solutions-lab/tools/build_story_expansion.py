"""Extend the approved pilot into ten experiments per age route.
Every state is authored; generated pictures illustrate possibilities, not measurements.
"""
import json, pathlib, runpy
ROOT=pathlib.Path(__file__).resolve().parents[1]
runpy.run_path(str(ROOT/'tools/build_story_pilot.py'))
def pair(ar,en): return {'ar':ar,'en':en}
# Each tuple: title AR/EN, narration AR/EN, variable AR/EN, value AR/EN.
specs=[
('tower','برج ثابت','A stable tower','مكعبات كبيرة خفيفة؛ جرّب على الأرض بعيدًا عن الوجه.','Use large light blocks on the floor, away from faces.',[
('برج قصير','Short tower','هٰذا بُرْجٌ قَصيرٌ مِنْ مُكَعَّباتٍ كَبيرَةٍ. أَشِرْ إِلى القاعِدَةِ.','This is a short tower made of large blocks. Point to its base.','ارتفاع البرج','Tower height','قصير','Short'),
('نضيف مكعبات','Add blocks','نُضيفُ مُكَعَّباتٍ فَوْقَ بَعْضِها. القاعِدَةُ نَفْسُها، وَالبُرْجُ أَطْوَلُ.','We stack more blocks. The base stays the same and the tower is taller.','ارتفاع البرج','Tower height','أطول','Taller'),
('برج يميل','A leaning tower','هٰذا البُرْجُ الطَّويلُ يَميلُ. ما الجُزْءُ الَّذي يَحْتاجُ إِلى تَثْبيتٍ؟','This tall tower leans. Which part needs support?','ارتفاع البرج','Tower height','طويل وضيق','Tall and narrow'),
('نلاحظ السقوط','Notice the fall','سَقَطَ البُرْجُ في هٰذا المَشْهَدِ. لَا تَدْفَعْهُ نَحْوَ أَحَدٍ. فَكِّرْ في قاعِدَةٍ أَوْسَعَ.','The tower fell in this scene. Never push it toward anyone. Think of a wider base.','ارتفاع البرج','Tower height','سقط','Fallen'),
('قاعدة أوسع','Wider base','نَبْني قاعِدَةً أَوْسَعَ بِالمُكَعَّباتِ نَفْسِها. تَوَقَّعْ أَيَّ بُرْجٍ أَثْبَتُ.','We build a wider base with the same blocks. Predict which tower is more stable.','عرض القاعدة','Base width','واسعة','Wide'),
('نختبر الثبات','Test stability','بَقِيَ البُرْجُ ذُو القاعِدَةِ الواسِعَةِ قائِمًا هُنا. جَرِّبْ بِرِفْقٍ، وَسَجِّلْ ما يَحْدُثُ عِنْدَكَ.','The wide-base tower remains upright here. Try gently and record what happens in your own test.','عرض القاعدة','Base width','بقي قائمًا','Upright')]),
('boat','قارب يحمل لعبة','A boat carries a toy','وعاء ماء قليل العمق وقارب رقائق يجهزه بالغ؛ مكعبات كبيرة غير قابلة للبلع. أبعد الماء عن الأجهزة.','An adult prepares a foil boat and a shallow water tray. Use large blocks and keep water away from devices.',[
('قارب فارغ','Empty boat','هٰذا قارِبٌ فارِغٌ يَطْفو. ما الَّذي تَتَوَقَّعُهُ إِذا أَضَفْنا لُعْبَةً؟','This empty boat floats. What do you predict if we add a toy?','الحمل','Load','فارغ','Empty'),
('لعبة في الوسط','Toy in the middle','نَضَعُ مُكَعَّبًا كَبيرًا في الوَسَطِ. بَقِيَ القارِبُ طافِيًا في هٰذا المَشْهَدِ.','We put a large block in the middle. The boat still floats in this scene.','الحمل','Load','خفيف','Light'),
('حمل أكبر','More load','نَزيدُ الحِمْلَ في القارِبِ نَفْسِهِ. راقِبْ قُرْبَ حافَتِهِ مِنَ الماءِ.','We increase the load in the same boat. Watch how close its rim is to the water.','الحمل','Load','أكبر','More'),
('يدخل الماء','Water enters','دَخَلَ الماءُ وَهَبَطَ القارِبُ هُنا. نُخَفِّفُ الحِمْلَ قَبْلَ مُحاوَلَةٍ جَديدَةٍ.','Water entered and the boat sank lower here. Reduce the load before trying again.','الحمل','Load','أكثر من قدرة القارب','Too much for this boat'),
('قارب أعرض','Wider boat','نُجَرِّبُ قارِبًا أَعْرَضَ وَالحِمْلَ نَفْسَهُ. هَلْ يَتَغَيَّرُ طُفُوُّهُ؟','We try a wider boat with the same load. Does its floating change?','عرض القارب','Boat width','أعرض','Wider'),
('الحمل على الحافة','Load at the edge','نَنْقُلُ الحِمْلَ نَحْوَ حافَةٍ واحِدَةٍ. مالَ القارِبُ هُنا. أَعِدِ الحِمْلَ إِلى الوَسَطِ وَقارِنْ.','We move the load toward one edge. The boat tilts here. Return the load to the middle and compare.','مكان الحمل','Load position','على الحافة','At the edge')]),
('shade','لعبة وظلها','A toy and its shadow','مصباح بارد لا يوجه إلى العين، ولعبة كبيرة وورقة؛ لا تستخدم النار أو الليزر.','Use a cool flashlight, a large toy and paper. Never aim at eyes or use flames or lasers.',[
('الضوء مطفأ','Light off','المِصْباحُ مُطْفَأٌ. لَا نَرى ظِلًّا واضِحًا لِلُّعْبَةِ هُنا.','The flashlight is off. We see no distinct toy shadow here.','الضوء','Light','مطفأ','Off'),
('الضوء يعمل','Light on','نُشَغِّلُ المِصْباحَ مِنْ جانِبٍ. أَشِرْ إِلى ظِلِّ اللُّعْبَةِ.','We turn on the light from one side. Point to the toy’s shadow.','الضوء','Light','يعمل','On'),
('مصباح قريب','Light nearby','نُقَرِّبُ المِصْباحَ مِنَ اللُّعْبَةِ. قارِنْ حَجْمَ الظِّلِّ.','We move the light closer to the toy. Compare the shadow’s size.','مسافة المصباح','Light distance','قريب','Near'),
('مصباح أبعد','Light farther away','نُبْعِدُ المِصْباحَ، وَنُبْقي اللُّعْبَةَ في مَكانِها. كَيْفَ تَغَيَّرَ الظِّلُّ؟','We move the light farther away and keep the toy in place. How did the shadow change?','مسافة المصباح','Light distance','أبعد','Farther'),
('نغير جهة الضوء','Change light direction','نَنْقُلُ المِصْباحَ إِلى الجِهَةِ الأُخْرى. راقِبْ جِهَةَ الظِّلِّ.','We move the light to the other side. Watch the shadow’s direction.','جهة الضوء','Light direction','الجهة الأخرى','Other side'),
('حاجز شفاف','Translucent screen','نَضَعُ حاجِزًا شَفّافًا جُزْئِيًّا أَمامَ الضَّوْءِ. هَلْ بَقِيَ الظِّلُّ بِالوُضوحِ نَفْسِهِ؟','We place a translucent screen in the light’s path. Is the shadow equally clear?','مرور الضوء','Light transmission','حاجز شفاف جزئيًا','Translucent screen')]),
('wind','شريط يخبرنا عن الهواء','A ribbon shows the air','شريط قصير مثبت جيدًا ومنفاخ يدوي للمدرب؛ لا تُدخل شيئًا في المراوح.','Use a short secured ribbon and a coach’s hand fan. Never put objects into fans.',[
('هواء هادئ','Still air','الشَّريطُ يَتَدَلّى في الهَواءِ الهادِئِ. أَشِرْ إِلى طَرَفِهِ.','The ribbon hangs in still air. Point to its end.','حركة الهواء','Air movement','هادئ','Still'),
('نحرك الهواء','Move the air','يُحَرِّكُ المُدَرِّبُ الهَواءَ بِالمِنْفاخِ اليَدَوِيِّ. الشَّريطُ يَميلُ.','The coach moves air with a hand fan. The ribbon tilts.','حركة الهواء','Air movement','يتحرك','Moving'),
('نفخة خفيفة','Gentle airflow','نُحَرِّكُ الهَواءَ بِرِفْقٍ. راقِبْ مِقْدارَ مَيْلِ الشَّريطِ.','We move air gently. Watch how far the ribbon tilts.','قوة الهواء','Air strength','خفيفة','Gentle'),
('نفخة أقوى','Stronger airflow','نَزيدُ حَرَكَةَ الهَواءِ قَليلًا. الشَّريطُ نَفْسُهُ، فَما الَّذي تَغَيَّرَ؟','We increase airflow a little. The ribbon is the same. What changed?','قوة الهواء','Air strength','أقوى','Stronger'),
('جهة أخرى','Other direction','نُحَرِّكُ الهَواءَ مِنَ الجِهَةِ الأُخْرى. راقِبْ اِتِّجاهَ الشَّريطِ.','We move air from the other side. Watch the ribbon’s direction.','جهة الهواء','Air direction','معاكسة','Opposite'),
('نضع حاجزًا','Add a screen','نَضَعُ حاجِزًا أَمامَ الهَواءِ. تَغَيَّرَتْ حَرَكَةُ الشَّريطِ هُنا. اِخْتَبِرْ مَوْضِعَ الحاجِزِ مَعَ المُدَرِّبِ.','We put a screen in the airflow. The ribbon’s movement changes here. Test the screen position with a coach.','الحاجز','Screen','بين المنفاخ والشريط','Between fan and ribbon')]),
('sponge','من يجمع الماء؟','Which material collects water?','قطرات ماء وصينية وإسفنجة نظيفة وقطعة بلاستيك؛ لا تشرب ماء التجربة.','Use a few drops, a tray, a clean sponge and plastic. Do not drink the experiment water.',[
('إسفنجة جافة','Dry sponge','هٰذِهِ إِسْفَنْجَةٌ جافَّةٌ بِجانِبِ بُقْعَةِ ماءٍ صَغيرَةٍ. تَوَقَّعْ ما سَيَحْدُثُ.','A dry sponge sits beside a small puddle. Predict what will happen.','المادة','Material','إسفنجة','Sponge'),
('الإسفنجة تبتل','Sponge gets wet','لَمَسَتِ الإِسْفَنْجَةُ الماءَ وَابْتَلَّتْ. قَلَّ الماءُ عَلى الصِّينِيَّةِ هُنا.','The sponge touched the water and became wet. Less water remains on the tray here.','المادة','Material','إسفنجة مبتلة','Wet sponge'),
('نختبر البلاستيك','Test plastic','نَضَعُ قِطْعَةَ بْلاسْتيكٍ بِجانِبِ ماءٍ مُشابِهٍ. هَلْ تَجْمَعُهُ مِثْلَ الإِسْفَنْجَةِ؟','We place plastic beside a similar puddle. Will it collect water like the sponge?','المادة','Material','بلاستيك','Plastic'),
('الماء على السطح','Water on the surface','بَقِيَ الماءُ عَلى سَطْحِ البْلاسْتيكِ هُنا. قارِنِ المادَّتَيْنِ بِرِفْقٍ.','Water remains on the plastic surface here. Gently compare the two materials.','المادة','Material','لا يمتص مثل الإسفنجة','Does not absorb like sponge'),
('نعصر الإسفنجة','Squeeze the sponge','يَعْصِرُ المُدَرِّبُ الإِسْفَنْجَةَ فَوْقَ الصِّينِيَّةِ. نَرى الماءَ يَخْرُجُ مِنْها.','The coach squeezes the sponge over the tray. We see water coming out.','حالة الإسفنجة','Sponge state','معصورة','Squeezed'),
('نجرب مرة أخرى','Try again','نُعيدُ الإِسْفَنْجَةَ إِلى الماءِ بَعْدَ عَصْرِها. هَلْ تَجْمَعُ الماءَ مَرَّةً أُخْرى؟','We return the sponge to water after squeezing it. Does it collect water again?','حالة الإسفنجة','Sponge state','بعد العصر','After squeezing')]),
('balance','ميزان اللعب','A play balance','لوح خفيف ودعامة ثابتة ومكعبات كبيرة على الأرض؛ لا يجلس الطفل على الميزان.','Use a light board, a stable support and large blocks on the floor. Never sit on the balance.',[
('ميزان فارغ','Empty balance','هٰذا لَوْحٌ فَوْقَ دَعامَةٍ في الوَسَطِ. طَرَفاهُ مُتَقارِبانِ في الاِرْتِفاعِ.','This board rests on a central support. Its ends are at similar heights.','الحمل','Load','فارغ','Empty'),
('حمل على جانب','Load on one side','نَضَعُ مُكَعَّبًا عَلى جانِبٍ واحِدٍ. هَبَطَ هٰذا الجانِبُ هُنا.','We put a block on one side. That side drops here.','الحمل','Load','جانب واحد','One side'),
('حملان متشابهان','Matching loads','نَضَعُ مُكَعَّبًا مُشابِهًا عَلى الطَّرَفِ الآخَرِ، بِالمَسافَةِ نَفْسِها عَنِ الدَّعامَةِ.','We put a matching block on the other side, at the same distance from the support.','توزيع الحمل','Load distribution','متشابه','Matching'),
('نضيف حملًا','Add load','نُضيفُ مُكَعَّبًا إِلى جانِبٍ واحِدٍ. قارِنْ اِرْتِفاعَ الطَّرَفَيْنِ الآنَ.','We add a block to one side. Compare the heights of both ends now.','توزيع الحمل','Load distribution','حمل أكبر على جانب','More on one side'),
('نقرب الحمل','Move load closer','نُبْقي الحِمْلَيْنِ مُتَشابِهَيْنِ، وَنُقَرِّبُ أَحَدَهُما مِنَ الدَّعامَةِ.','We keep matching loads and move one closer to the support.','مسافة الحمل','Load distance','غير متساوية','Unequal'),
('مسافتان متشابهتان','Matching distances','نُعيدُ الحِمْلَيْنِ إِلى مَسافَتَيْنِ مُتَشابِهَتَيْنِ. هَلْ عادَ التَّوازُنُ في تَجْرِبَتِكَ؟','We return the loads to matching distances. Did your own balance become level again?','مسافة الحمل','Load distance','متشابهة','Matching')]),
('wheel','عجلات تحمل صندوقًا','Wheels carry a box','صندوق خفيف وبكرات كبيرة غير قابلة للبلع ومسار قصير على الأرض؛ أبعد الأصابع.','Use a light box, large rollers and a short floor path. Keep fingers clear.',[
('صندوق على السطح','Box on surface','الصُّنْدوقُ يَلْمَسُ السَّطْحَ مُباشَرَةً. يَدْفَعُهُ المُدَرِّبُ بِرِفْقٍ.','The box rests directly on the surface. The coach pushes gently.','طريقة الحركة','Movement method','انزلاق','Sliding'),
('نلاحظ الحركة','Notice movement','تَحَرَّكَ الصُّنْدوقُ بِالاِنْزِلاقِ. هَلْ كانَ دَفْعُهُ سَهْلًا في تَجْرِبَتِكَ؟','The box moves by sliding. Was pushing it easy in your own test?','طريقة الحركة','Movement method','انزلاق','Sliding'),
('نضيف بكرات','Add rollers','نَضَعُ بَكْراتٍ كَبيرَةً تَحْتَ الصُّنْدوقِ. تَوَقَّعْ طَريقَةَ حَرَكَتِهِ.','We put large rollers under the box. Predict how it will move.','طريقة الحركة','Movement method','تدحرج','Rolling'),
('البكرات تدور','Rollers turn','دارَتِ البَكْراتُ وَتَحَرَّكَ الصُّنْدوقُ هُنا. قارِنْ مَعَ الاِنْزِلاقِ.','The rollers turn and the box moves here. Compare it with sliding.','طريقة الحركة','Movement method','تدحرج','Rolling'),
('سطح خشن','Rough surface','نَنْقُلُ الصُّنْدوقَ وَالبَكْراتِ إِلى سَطْحٍ أَخْشَنَ. نُغَيِّرُ السَّطْحَ فَقَطْ.','We move the box and rollers to a rougher surface. We change only the surface.','السطح','Surface','خشن','Rough'),
('سطح أملس','Smooth surface','نُجَرِّبُ السَّطْحَ الأَمْلَسَ مَرَّةً أُخْرى. ناقِشْ سُهولَةَ الحَرَكَةِ مَعَ المُدَرِّبِ.','We try the smooth surface again. Discuss how easy movement is with the coach.','السطح','Surface','أملس','Smooth')]),
('canopy','مظلة لعبة خفيفة','A parachute for a light toy','مظلة ورقية وخيوط قصيرة ولعبة خفيفة يجهزها بالغ؛ أسقط من ارتفاع منخفض فوق بساط، ولا تصعد.','An adult prepares a paper canopy, short cords and a light toy. Drop from low height onto a mat; never climb.',[
('لعبة دون مظلة','Toy without canopy','يُمْسِكُ المُدَرِّبُ لُعْبَةً خَفيفَةً فَوْقَ بِساطٍ، دُونَ مِظَلَّةٍ.','The coach holds a light toy above a mat without a canopy.','وجود المظلة','Canopy present','دون مظلة','No canopy'),
('اللعبة على البساط','Toy on the mat','وَصَلَتِ اللُّعْبَةُ إِلى البِساطِ. الصُّورَةُ لَا تَقيسُ زَمَنَ السُّقوطِ.','The toy reached the mat. A picture does not measure falling time.','وجود المظلة','Canopy present','دون مظلة','No canopy'),
('نضيف مظلة','Add a canopy','نُضيفُ مِظَلَّةً وَرَقِيَّةً، وَنُبْقي اللُّعْبَةَ وَالاِرْتِفاعَ نَفْسَهُما.','We add a paper canopy and keep the same toy and height.','وجود المظلة','Canopy present','مع مظلة','With canopy'),
('بعد نزول المظلة','After descent','وَصَلَتِ اللُّعْبَةُ إِلى البِساطِ مَعَ المِظَلَّةِ هُنا. راقِبِ النُّزولَ الحَقيقيَّ مَعَ المُدَرِّبِ.','The toy reached the mat with its canopy here. Watch the real descent with the coach.','وجود المظلة','Canopy present','مفتوحة','Open'),
('مظلة صغيرة','Small canopy','نُجَرِّبُ مِظَلَّةً أَصْغَرَ لِلُّعْبَةِ نَفْسِها. تَوَقَّعْ، ثُمَّ شاهِدْ.','We try a smaller canopy with the same toy. Predict, then watch.','حجم المظلة','Canopy size','صغيرة','Small'),
('مظلة أكبر','Larger canopy','نُجَرِّبُ مِظَلَّةً أَكْبَرَ مِنَ الاِرْتِفاعِ نَفْسِهِ. سَجِّلْ ما تُلاحِظُهُ، دُونَ تَخْمينِ زَمَنٍ مِنَ الصُّورَةِ.','We try a larger canopy from the same height. Record what you observe without guessing time from the picture.','حجم المظلة','Canopy size','أكبر','Larger')])]
data=json.loads((ROOT/'data/story-content.json').read_text());audio=[]
for ident,ar,en,coach_ar,coach_en,rows in specs:
 scenes=[]
 for i,(a,e,ta,te,va,ve,xa,xe) in enumerate(rows):
  scene={'id':ident+'-'+str(i),'atlas':'assets/scenes/'+ident+'-a.jpg','cell':i,'title':pair(a,e),'text':pair(ta,te),'variable':pair(va,ve),'value':pair(xa,xe),'kept':pair('قارن تغييرًا واحدًا في كل مرة.','Compare one change at a time.'),'audio':{}}
  for lang in ['ar','en']:
   clip='audio/'+lang+'/scene-'+ident+'-'+str(i)+'.mp3';scene['audio'][lang]=clip;audio.append({'language':lang,'path':clip,'text':scene['text'][lang],'engine':'silma' if lang=='ar' else 'edge'})
  scene['old_audio']='audio/ar/scene-'+ident+'-'+str(i)+'-previous.mp3'
  audio.append({'language':'ar','path':scene['old_audio'],'text':scene['text']['ar'],'engine':'edge-original'})
  scenes.append(scene)
 data['projects'].append({'id':ident,'title':pair(ar,en),'scenes':scenes,'routes':{'1':[0,1,2,3],'2':[2,3,4,5],'3':[0,1,2,3,4,5]},'coach':pair(coach_ar,coach_en),'voice_group':'new'})
for p in data['projects'][:2]:p['voice_group']='original'
data.update(schema=2,pilot=False,experiments_per_level=10,voice_comparison={'text':data['projects'][2]['scenes'][0]['text']['ar'],'old':data['projects'][2]['scenes'][0]['old_audio'],'new':data['projects'][2]['scenes'][0]['audio']['ar']})
assert len(data['projects'])==10
(ROOT/'src/story-content.js').write_text('window.MAKER_STORIES='+json.dumps(data,ensure_ascii=False,separators=(',',':'))+';\n')
(ROOT/'data/story-content.json').write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
(ROOT/'data/story-expansion-audio.json').write_text(json.dumps({'items':audio},ensure_ascii=False,indent=2)+'\n')
print('10 experiments per level; 48 new scenes; 96 primary bilingual recordings + 48 same-scene original-voice comparisons')
