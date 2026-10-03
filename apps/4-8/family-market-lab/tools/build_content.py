"""Author finite action audio; numbers and object names are reusable references."""
import pathlib,json,re
R=pathlib.Path(__file__).resolve().parents[1];c=json.loads((R/'data/content.json').read_text())
new={
 'library':('اِخْتَرْ تَجْرِبَةً وَالْعَبْ. فِي كُلِّ مَرَّةٍ طَلَبٌ جَدِيدٌ وَصُوَرٌ مُخْتَلِفَةٌ.','Choose an activity and play. Each time brings a new order and different pictures.'),
 'count':('اِضْغَطْ عَلَى الصُّورَةِ لِتَضَعَ بَطَاقَةً فِي السَّلَّةِ.','Tap the picture to put a card in the basket.'),
 'fill':('أَكْمِلِ السَّلَّةَ حَتَّى تُطَابِقَ بَطَاقَةَ الطَّلَبِ.','Complete the basket until it matches the order card.'),
 'return':('اِضْغَطْ عَلَى بَطَاقَةٍ فِي السَّلَّةِ لِإِعَادَةِ الزَّائِدِ.','Tap a card in the basket to return the extras.'),
 'share':('اِخْتَرْ سَلَّةً، ثُمَّ اضْغَطْ عَلَى الصُّورَةِ. وَزِّعْ كُلَّ الْبَطَاقَاتِ بِالتَّسَاوِي.','Choose a basket, then tap the picture. Share all the cards equally.'),
 'split':('اِخْتَرْ سَلَّةً، ثُمَّ ضَعْ بَطَاقَةً. اصْنَعْ مَجْمُوعَتَيْنِ بِطَرِيقَتِكَ.','Choose a basket, then add a card. Make two groups in your own way.'),
 'combine':('اِضْغَطْ عَلَى صُوَرِ الْمَجْمُوعَتَيْنِ لِتَضُمَّهَا فِي سَلَّةٍ وَاحِدَةٍ.','Tap the pictures in the two groups to join them in one basket.'),
 'mixed':('عُدَّ بَطَاقَاتِ كُلِّ صُورَةٍ وَطَابِقْهَا بِالطَّلَبِ.','Count the cards of each picture and match them to the order.'),
 'compare':('أَيُّ صَفٍّ فِيهِ بَطَاقَاتٌ أَكْثَرُ؟ الْعَدَدُ هُوَ الْمُهِمُّ، وَلَيْسَ التَّبَاعُدَ.','Which row has more cards? Quantity matters, not the spacing.'),
 'pattern':('اُنْظُرْ إِلَى تَرْتِيبِ الصُّوَرِ. اِخْتَرِ الصُّورَةَ التَّالِيَةَ.','Look at the order of the pictures. Choose the next picture.'),
 'measure':('ضَعِ الْبَطَاقَاتِ الْمُتَسَاوِيَةَ عَلَى الْخَطِّ دُونَ فَرَاغٍ أَوْ تَدَاخُلٍ.','Put equal cards along the line with no gaps or overlaps.'),
 'order':('الْمَطْلُوبُ','The order'),
 'total':('عَدَدُ الْبَطَاقَاتِ','Number of cards'),
 'baskets':('عَدَدُ السَّلَالِ','Number of baskets'),
 'picture':('الصُّورَةُ','The picture'),
 'demo':('هَذَا مِثَالٌ لِلطَّرِيقَةِ. طَلَبُكَ الْأَصْلِيُّ يَنْتَظِرُكَ.','This is an example of how to play. Your own order is waiting.'),
 'coach':('اِخْتَرْ نَمَطًا وَصُوَرًا وَمَدَى الْعَدَدِ. نُجَهِّزُ طَلَبًا مُخْتَلِفًا كُلَّ مَرَّةٍ.','Choose an activity, pictures and a number range. We make a different order each time.')}
for key,(ar,en) in new.items():
 for lang,txt in [('ar',ar),('en',en)]:c['guides'][lang][key]={'text':txt,'path':'audio/'+lang+'-guide-'+key+'.mp3'}
c['schema_version']=2
c['number_words']={'ar':['صفر','واحد','اثنان','ثلاثة','أربعة','خمسة','ستة','سبعة','ثمانية','تسعة','عشرة','أحد عشر','اثنا عشر','ثلاثة عشر','أربعة عشر','خمسة عشر','ستة عشر','سبعة عشر','ثمانية عشر','تسعة عشر','عشرون'],'en':'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty'.split()}
c['number_words']['ar'] += ['واحد وعشرون','اثنان وعشرون','ثلاثة وعشرون','أربعة وعشرون','خمسة وعشرون','ستة وعشرون']
c['number_words']['en'] += ['twenty one','twenty two','twenty three','twenty four','twenty five','twenty six']
for m in c['missions']:
 if m['language']=='ar':
  for k in ['title','prompt','hint','real']:m[k]=m[k].translate(str.maketrans('0123456789','٠١٢٣٤٥٦٧٨٩'))
(R/'data/content.json').write_text(json.dumps(c,ensure_ascii=False,indent=2)+'\n');(R/'data/content.js').write_text('window.MARKET_CONTENT='+json.dumps(c,ensure_ascii=False,separators=(',',':'))+';\n')
items=[]
for m in c['missions']:
 for k,path in m['audio'].items():items.append({'path':path,'text':m[k],'language':m['language']})
for lang in ['ar','en']:
 for g in c['guides'][lang].values():items.append({'path':g['path'],'text':g['text'],'language':lang})
 for n in range(11,27):items.append({'path':'audio/'+('ar-' if lang=='ar' else '')+'number-'+str(n)+'.mp3','text':str(n).translate(str.maketrans('0123456789','٠١٢٣٤٥٦٧٨٩')) if lang=='ar' else str(n),'language':lang})
manifest={'schema_version':2,'numeral_policy':'Numbers follow activity language: Arabic in Arabic; English in English. Existing 0-10 clips referenced from Say and Name.','items':items}
(R/'data/audio-manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')
print('Finite authored clips:',len(items))
