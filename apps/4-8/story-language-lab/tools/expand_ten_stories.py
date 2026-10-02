"""Thirty authored stories: ten new visual worlds, three distinct learning journeys.

Run after expand_library.py. Retains the original library and uses content-addressed
audio paths to share identical narration/words without duplicate downloads.
"""
import hashlib
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parents[1]
D = json.loads((ROOT / 'data/stories.json').read_text())
OLD_AUDIO = json.loads((ROOT / 'data/audio-manifest.json').read_text())['items']
BY_TEXT = {(x['language'], x['text']): x['path'] for x in OLD_AUDIO if x['kind'] == 'narration'}
provenance=ROOT/'data/asset-provenance-v4.json'
frames={x['world']:x['frames'] for x in json.loads(provenance.read_text())['assets'] if 'frames' in x} if provenance.exists() else {}


def audio(lang, text):
    key = (lang, text)
    if key not in BY_TEXT:
        BY_TEXT[key] = 'audio/' + lang + '-v4-' + hashlib.sha256(text.encode()).hexdigest()[:16] + '.mp3'
    return BY_TEXT[key]


def journey(title, ar, en, question, correct, wrong, skill, real):
    return dict(title=title, narration=dict(ar=ar, en=en), question=question,
                correct=correct, wrong=wrong, skill=skill, real=real)


# correct/wrong: [Arabic label, English label, visible picture index].
WORLDS = [
dict(id='seed',
 word=[['نَبَات', ['نَ', 'بَات'], ['na', 'ba:t'], 'نَبَاتَات', ['نَ', 'بَا', 'تَات'], ['na', 'ba:', 'ta:t'], 'النَّبَاتُ يَكْبُرُ مَعَ الْعِنَايَةِ.', 3],
       ['seed', ['s', 'ee', 'd'], ['s', 'i:', 'd'], 'seeds', ['s', 'ee', 'd', 's'], ['s', 'i:', 'd', 'z'], 'A seed can grow.', 0]],
 practice=[['نُورَا', 'تَسْقِي', 'الْبَذْرَةَ'], ['Mia', 'waters', 'it']], practice_scene=1,
 extend=[['كَبُرَ', 'النَّبَاتُ', 'مَعَ', 'الْعِنَايَةِ', 'وَالْوَقْتِ'], ['Mia', 'cares', 'for', 'her', 'plant']], extend_scene=3,
 endings=[['ظَهَرَتْ أَوْرَاقٌ صَغِيرَةٌ بَعْدَ أَيَّامٍ.', 'كَبُرَ النَّبَاتُ مَعَ الْعِنَايَةِ وَالْوَقْتِ.'],
          ['Little leaves appear after several days.', 'With care and time, the plant grows.']], ending_scenes=[2,3],
 journeys=[
 journey(['بذرتي الصغيرة', 'My little seed'],
 ['تَضَعُ نُورَا بَذْرَةً فِي التُّرْبَةِ.', 'تَسْقِي نُورَا الْبَذْرَةَ بِرِفْقٍ.', 'بَعْدَ أَيَّامٍ، ظَهَرَتْ أَوْرَاقٌ صَغِيرَةٌ.', 'مَعَ الْعِنَايَةِ وَالْوَقْتِ، كَبُرَ النَّبَاتُ.'],
 ['Mia puts a seed in the soil.', 'Mia gently waters the seed.', 'After several days, little leaves appear.', 'With care and time, the plant grows.'],
 ['أين ظهرت الأوراق الصغيرة؟', 'Where do the little leaves appear?'], ['أوراق صغيرة', 'Little leaves',2], ['بذرة في التربة', 'A seed in soil',0],
 ['ألاحظ النمو', 'Notice growth'], ['راقب نبتة مع مرافق، وأشر إلى ورقة. لا يلزم زرع شيء.', 'Look at a plant with a companion and point to a leaf. No planting is needed.']),
 journey(['رحلة النبتة', 'The plant journey'],
 ['بَدَأَتْ رِحْلَةُ النَّبَاتِ بِبَذْرَةٍ فِي التُّرْبَةِ.', 'وَضَعَتْ نُورَا الْوِعَاءَ قُرْبَ الضَّوْءِ، وَسَقَتْهُ بِرِفْقٍ.', 'اِنْتَظَرَتْ أَيَّامًا، ثُمَّ رَأَتْ نَبْتَةً صَغِيرَةً.', 'وَاصَلَتِ الْعِنَايَةَ، فَكَبُرَ النَّبَاتُ.'],
 ['The plant journey begins with a seed in soil.', 'Mia puts the pot near the light and waters gently.', 'She waits several days, then sees a little plant.', 'She keeps caring for it, and the plant grows.'],
 ['أي صورة تبين العناية بالماء؟', 'Which picture shows care with water?'], ['السقي برفق', 'Gentle watering',1], ['وضع البذرة', 'Putting in the seed',0],
 ['أربط العناية بالنمو', 'Connect care and growth'], ['احكِ رحلة النبتة: بذرة، ثم عناية، ثم أوراق. النمو يحتاج وقتًا.', 'Tell the journey: seed, care, then leaves. Growing takes time.']),
 journey(['النبتة تحتاج وقتًا', 'Growing takes time'],
 ['قَالَتْ نُورَا: أَرَى بَذْرَةً، وَأَتَوَقَّعُ أَنْ تَنْبُتَ.', 'أَعْطَتْهَا مَاءً بِرِفْقٍ وَتَرَكَتْهَا قُرْبَ الضَّوْءِ.', 'بَعْدَ أَيَّامٍ، صَارَتِ الْأَوْرَاقُ دَلِيلًا تَرَاهُ.', 'لَمْ يَكْبَرِ النَّبَاتُ فَوْرًا؛ اِلْعِنَايَةُ وَالْوَقْتُ جُزْءٌ مِنَ الْحِكَايَةِ.'],
 ['Mia says, I see a seed, and I think it will sprout.', 'She waters gently and leaves the pot near the light.', 'Several days later, the leaves are a clue she can see.', 'The plant does not grow at once. Care and time are part of the story.'],
 ['أي صورة تعطينا دليلًا أن البذرة نبتت؟', 'Which picture gives a clue that the seed has sprouted?'], ['أوراق ظاهرة', 'Visible leaves',2], ['تربة بلا أوراق', 'Soil without leaves',1],
 ['أفرق بين التوقع والدليل', 'Prediction and evidence'], ['قل: أرى… ثم: أتوقع… واختر فكرة عن النبتة لكل جملة.', 'Say I see, then I think. Choose a plant idea for each sentence.'])]),

dict(id='bridge',
 word=[['جِسْر', ['جِسْ','ر'], ['dZis','R'], 'جُسُور', ['جُ','سُو','ر'], ['dZu','su:','R'], 'هَذَا جِسْرٌ لِسَيَّارَةِ اللُّعْبَةِ.', 3],
       ['bridge', ['b','r','i','dge'], ['b','r','I','dZ'], 'ridge', ['r','i','dge'], ['r','I','dZ'], 'The toy bridge is ready.',3]],
 practice=[['نُورَا','تُصْلِحُ','الْجِسْرَ'], ['Mia','fixes','it']], practice_scene=2,
 extend=[['عَبَرَتْ','سَيَّارَةُ','اللُّعْبَةِ','الْجِسْرَ','الْمُسْتَوِيَ'], ['The','toy','car','crosses','now']], extend_scene=3,
 endings=[['أَصْبَحَ جِسْرُ اللُّعْبَةِ مُسْتَوِيًا.', 'عَبَرَتِ السَّيَّارَةُ جِسْرَ اللُّعْبَةِ.'], ['The little toy bridge is level now.', 'The car crosses the toy bridge.']], ending_scenes=[2,3],
 journeys=[
 journey(['جسر لسيارتي', 'A bridge for my car'],
 ['أَمَامَ نُورَا سَيَّارَةُ لُعْبَةٍ وَمُكَعَّبَاتٌ.', 'صَنَعَتْ جِسْرًا صَغِيرًا، لَكِنَّهُ مَائِلٌ.', 'عَدَّلَتِ الْمُكَعَّبَاتِ، فَاسْتَوَى الْجِسْرُ.', 'عَبَرَتْ سَيَّارَةُ اللُّعْبَةِ الْجِسْرَ.'],
 ['Mia has a toy car and wooden blocks.', 'She makes a little bridge, but it is crooked.', 'She moves the blocks, and the bridge is level.', 'The toy car crosses the bridge.'],
 ['أين السيارة فوق الجسر؟', 'Where is the car on the bridge?'], ['السيارة تعبر', 'The car crosses',3], ['السيارة تنتظر', 'The car waits',1],
 ['أرتب محاولة جديدة', 'Sequence a new try'], ['مع مرافق، ابنِ جسرًا صغيرًا من مكعبات آمنة لسيارة لعبة.', 'With a companion, make a small bridge from safe blocks for a toy car.']),
 journey(['أصلح الجسر', 'Fix the bridge'],
 ['اِخْتَارَتْ نُورَا مُكَعَّبَاتٍ وَقِطْعَةً خَشَبِيَّةً لِجِسْرِهَا.', 'لَاحَظَتْ أَنَّ الْقِطْعَةَ مَائِلَةٌ، فَأَبْقَتِ السَّيَّارَةَ تَنْتَظِرُ.', 'قَرَّبَتِ الدَّعَامَتَيْنِ وَعَدَّلَتْ مَكَانَهُمَا.', 'صَارَ الْجِسْرُ مُسْتَوِيًا، وَعَبَرَتْ سَيَّارَتُهَا.'],
 ['Mia chooses blocks and a wooden plank for her bridge.', 'She notices the plank is tilted and keeps the car waiting.', 'She moves the supports closer and lines them up.', 'The bridge is level, and her toy car crosses.'],
 ['أي صورة تبين كيف أصلحت نورا الجسر؟', 'Which picture shows how Mia fixes the bridge?'], ['تعديل المكعبات', 'Moving the blocks',2], ['ألعاب قبل البناء', 'Toys before building',0],
 ['أصف التعديل والنتيجة', 'Describe change and result'], ['قل عن بناء لعبة: لاحظت… فغيرت… ثم جربت…', 'Tell a toy building story: I noticed, I changed, then I tried.']),
 journey(['أختبر فكرتي', 'Test my idea'],
 ['تَخَيَّلَتْ نُورَا جِسْرًا لِسَيَّارَتِهَا الْحَمْرَاءِ.', 'الْجِسْرُ مَائِلٌ؛ هَذَا شَيْءٌ تَرَاهُ، وَلَيْسَ حُكْمًا عَلَى مُحَاوَلَتِهَا.', 'عَدَّلَتْ مَكَانَ الْمُكَعَّبَاتِ لِتَخْتَبِرَ فِكْرَةً جَدِيدَةً.', 'عَبَرَتِ السَّيَّارَةُ؛ هَذَا دَلِيلٌ أَنَّ الْجِسْرَ نَاسَبَ لُعْبَتَهَا.'],
 ['Mia imagines a bridge for her red toy car.', 'The plank is tilted. That is something she sees, not a score for her try.', 'She changes the blocks to test a new idea.', 'The car crosses. That is a clue that the bridge works for her toy.'],
 ['أي صورة تعطينا دليلًا أن جسر اللعبة يعمل؟', 'Which picture gives a clue that the toy bridge works?'], ['السيارة فوق الجسر', 'The car on the bridge',3], ['الجسر مائل', 'The tilted bridge',1],
 ['أجرب وأستدل', 'Try and find evidence'], ['اختر شيئًا واحدًا لتعديله في بناء لعبة، ثم صف ما تغير بعد التجربة.', 'Choose one change in a toy building, then describe what happened when you tried it.'])]),

dict(id='colors',
 word=[['لَوْن',['لَوْ','ن'],['law','n'],'أَلْوَان',['أَلْ','وَان'],['al','wa:n'],'ظَهَرَ لَوْنٌ بُرْتُقَالِيٌّ.',2],
       ['red',['r','e','d'],['r','E','d'],'bed',['b','e','d'],['b','E','d'],'Mix red and yellow.',0]],
 practice=[['نُورَا','تَمْزُجُ','اللَّوْنَيْنِ'], ['Mia','mixes','paint']], practice_scene=1,
 extend=[['مَزَجَتْ','نُورَا','اللَّوْنَيْنِ','فَظَهَرَ','الْبُرْتُقَالِيُّ'], ['Mia','mixes','paints','and','notices']], extend_scene=2,
 endings=[['ظَهَرَ لَوْنٌ بُرْتُقَالِيٌّ بَعْدَ الْمَزْجِ.', 'رَسَمَتْ نُورَا زَهْرَةً بُرْتُقَالِيَّةً.'], ['Orange appears after the paints mix.', 'Mia paints an orange flower.']], ending_scenes=[2,3],
 journeys=[
 journey(['لون جديد', 'A new color'],
 ['أَمَامَ نُورَا لَوْنٌ أَحْمَرُ وَلَوْنٌ أَصْفَرُ.', 'تَمْزُجُ نُورَا اللَّوْنَيْنِ بِالْفُرْشَاةِ.', 'ظَهَرَ لَوْنٌ بُرْتُقَالِيٌّ.', 'رَسَمَتْ نُورَا زَهْرَةً بُرْتُقَالِيَّةً.'],
 ['Mia has red paint and yellow paint.', 'Mia mixes the paints with a brush.', 'Orange paint appears.', 'Mia paints an orange flower.'],
 ['أين الزهرة البرتقالية؟', 'Where is the orange flower?'], ['زهرة مرسومة', 'A painted flower',3], ['ألوان قبل المزج', 'Paints before mixing',0],
 ['ألاحظ لونًا جديدًا', 'Notice a new color'], ['أشر إلى شيء أحمر وشيء أصفر في البيت، دون الحاجة إلى دهان.', 'Point to a red thing and a yellow thing at home. No paint is needed.']),
 journey(['أمزج وأرسم', 'Mix and paint'],
 ['جَهَّزَتْ نُورَا وَرَقَةً وَأَلْوَانًا قَابِلَةً لِلْغَسْلِ.', 'حَرَّكَتِ الْأَحْمَرَ وَالْأَصْفَرَ مَعًا.', 'نَظَرَتْ إِلَى اللَّوْنِ الْجَدِيدِ قَبْلَ الرَّسْمِ.', 'اِسْتَخْدَمَتِ الْبُرْتُقَالِيَّ لِرَسْمِ زَهْرَةٍ.'],
 ['Mia gets paper and washable paints ready.', 'She stirs red and yellow together.', 'She looks at the new color before painting.', 'She uses orange to paint a flower.'],
 ['أي صورة تبين مزج اللونين؟', 'Which picture shows the paints mixing?'], ['الفرشاة تمزج', 'The brush mixes',1], ['الزهرة اكتملت', 'The flower is finished',3],
 ['أربط المزج بالتغير', 'Connect mixing and change'], ['احكِ: جهزت الألوان، ثم مزجتها، ثم رسمت. ويمكنك تمثيل الخطوات دون دهان.', 'Tell it: ready the paints, mix them, then paint. You can pretend without using paint.']),
 journey(['من أين جاء البرتقالي؟', 'Where did orange come from?'],
 ['تَرَى نُورَا لَوْنَيْنِ قَبْلَ الْمَزْجِ: أَحْمَرَ وَأَصْفَرَ.', 'تَمْزُجُهُمَا، وَتُرَاقِبُ مَا يَتَغَيَّرُ.', 'تَقُولُ: أَرَى الْبُرْتُقَالِيَّ بَعْدَ الْمَزْجِ.', 'اِخْتَارَتْ زَهْرَةً لِتَسْتَخْدِمَ فِيهَا اللَّوْنَ الْجَدِيدَ.'],
 ['Mia sees two colors before mixing: red and yellow.', 'She mixes them and watches what changes.', 'She says, I see orange after the mixing.', 'She chooses a flower for her new color.'],
 ['أي صورة تبين اللون الجديد قبل رسم الزهرة؟', 'Which picture shows the new color before the flower is painted?'], ['البرتقالي على اللوحة', 'Orange on the palette',2], ['ألوان منفصلة', 'Separate paints',0],
 ['أصف قبل التجربة وبعدها', 'Describe before and after'], ['قارن صورتي البداية واللون الجديد. احكِ ما تغير وما بقي.', 'Compare the first picture with the new color. Tell what changed and what stayed.'])]),

dict(id='kindness',
 word=[['كَامِل',['كَا','مِل'],['ka:','mil'],'كَامِلَة',['كَا','مِ','لَة'],['ka:','mi','la'],'أَصْبَحَ اللُّغْزُ كَامِلًا.',3],
       ['help',['h','e','l','p'],['h','E','l','p'],'held',['h','e','l','d'],['h','E','l','d'],'A friend can help.',1]],
 practice=[['نُورَا','تُكْمِلُ','الصُّورَةَ'], ['Mia','finishes','it']], practice_scene=2,
 extend=[['قَدَّمَ','عُمَرُ','الْقِطْعَةَ','إِلَى','نُورَا'], ['Sam','offers','Mia','the','piece']], extend_scene=1,
 endings=[['وَضَعَتْ نُورَا الْقِطْعَةَ فِي مَكَانِهَا.', 'اِكْتَمَلَتِ الصُّورَةُ بِتَعَاوُنِ الصَّدِيقَيْنِ.'], ['Mia puts the piece in its place.', 'The friends finish the picture together.']], ending_scenes=[2,3],
 journeys=[
 journey(['قطعة لصديقتي', 'A piece for my friend'],
 ['تَنْقُصُ صُورَةَ نُورَا قِطْعَةٌ.', 'يُقَدِّمُ عُمَرُ الْقِطْعَةَ لِصَدِيقَتِهِ.', 'تَضَعُ نُورَا الْقِطْعَةَ فِي مَكَانِهَا.', 'اِكْتَمَلَتِ الصُّورَةُ، وَابْتَسَمَ الصَّدِيقَانِ.'],
 ['Mia is missing a picture piece.', 'Sam offers the piece to his friend.', 'Mia puts the piece in its place.', 'The picture is complete, and the friends smile.'],
 ['أين يقدم عمر القطعة؟', 'Where does Sam offer the piece?'], ['تقديم القطعة', 'Offering the piece',1], ['الصورة مكتملة', 'The finished picture',3],
 ['أرى فعل المساعدة', 'Notice a helpful action'], ['مع مرافق، مثّل تقديم قطعة لعبة بالقول: تفضل.', 'With a companion, pretend to offer a toy piece and say, Here you are.']),
 journey(['معًا تكتمل الصورة', 'Together we finish'],
 ['لَاحَظَتْ نُورَا الْفَرَاغَ فِي الصُّورَةِ.', 'كَانَتِ الْقِطْعَةُ عِنْدَ عُمَرَ، فَقَدَّمَهَا.', 'رَكَّبَتْ نُورَا الْقِطْعَةَ دَاخِلَ الْفَرَاغِ.', 'صَارَ اللُّغْزُ كَامِلًا بِمُسَاعَدَةِ الصَّدِيقَيْنِ.'],
 ['Mia notices the gap in the picture.', 'Sam has the piece and offers it.', 'Mia fits the piece into the gap.', 'The puzzle is complete with both friends helping.'],
 ['أي صورة تبين كيف اختفى الفراغ؟', 'Which picture shows how the gap is filled?'], ['تركيب القطعة', 'Fitting the piece',2], ['فراغ في الصورة', 'A gap in the picture',0],
 ['أربط المساعدة بالنتيجة', 'Connect help and result'], ['احكِ ما فعله كل صديق، دون مقارنة بينهما.', 'Tell what each friend did, without comparing them.']),
 journey(['كلمة تطلب المساعدة', 'Words to ask for help'],
 ['رَأَتْ نُورَا الْفَرَاغَ. يُمْكِنُ أَنْ تَقُولَ: هَلْ تُسَاعِدُنِي؟', 'قَدَّمَ عُمَرُ الْقِطْعَةَ. يُمْكِنُ أَنْ يَقُولَ: تَفَضَّلِي.', 'رَكَّبَتْهَا نُورَا. يُمْكِنُ أَنْ تَقُولَ: شُكْرًا لَكَ.', 'نَرَى صُورَةً كَامِلَةً؛ وَيُمْكِنُنَا تَأْلِيفُ حِوَارٍ لِلصَّدِيقَيْنِ.'],
 ['Mia sees the gap. She could say, Can you help me?', 'Sam offers the piece. He could say, Here you are.', 'Mia fits it in. She could say, Thank you.', 'We see a finished picture. We can make a conversation for the friends.'],
 ['أي صورة تناسب قول: تفضل هذه القطعة؟', 'Which picture fits the words, Here is the piece?'], ['القطعة بين الصديقين', 'The offered piece',1], ['الصورة في النهاية', 'The picture at the end',3],
 ['أؤلف حوارًا من الصور', 'Create a picture dialogue'], ['مثّل حوارًا قصيرًا مع مرافق. الكلمات المقترحة مثال، ويمكنك اختيار كلماتك.', 'Act out a short conversation with a companion. The suggested words are examples; choose your own.'])]),

dict(id='tidy',
 word=[['زَوْج',['زَوْ','ج'],['zaw','dZ'],'زَوْجَان',['زَوْ','جَان'],['zaw','dZa:n'],'هَذَا زَوْجٌ مِنَ الْجَوَارِبِ.',1],
       ['sock',['s','o','ck'],['s','A:','k'],'socks',['s','o','ck','s'],['s','A:','k','s'],'Find the matching sock.',1]],
 practice=[['نُورَا','تُطَابِقُ','الْجَوَارِبَ'], ['Mia','matches','socks']], practice_scene=1,
 extend=[['رَتَّبَتْ','نُورَا','الْجَوَارِبَ','دَاخِلَ','السَّلَّةِ'], ['Mia','puts','paired','socks','away']], extend_scene=3,
 endings=[['طَوَتْ نُورَا زَوْجَ الْجَوَارِبِ.', 'رَتَّبَتْ نُورَا الْأَزْوَاجَ فِي السَّلَّةِ.'], ['Mia folds the matching pair.', 'Mia puts the pairs in the basket.']], ending_scenes=[2,3],
 journeys=[
 journey(['جوربان متشابهان', 'Two matching socks'],
 ['أَمَامَ نُورَا جَوَارِبُ بِأَلْوَانٍ مُخْتَلِفَةٍ.', 'وَجَدَتْ جَوْرَبَيْنِ أَزْرَقَيْنِ مُتَشَابِهَيْنِ.', 'طَوَتْهُمَا مَعًا بِرِفْقٍ.', 'وَضَعَتِ الْأَزْوَاجَ فِي السَّلَّةِ.'],
 ['Mia has socks in different colors.', 'She finds two matching blue socks.', 'She gently folds them together.', 'She puts the pairs in the basket.'],
 ['أين الجوربان الأزرقان جنبًا إلى جنب؟', 'Where are the blue socks side by side?'], ['جوربان متشابهان', 'Matching socks',1], ['جوارب متفرقة', 'Scattered socks',0],
 ['أجد المتشابه', 'Find a match'], ['ابحث مع مرافق عن جورب يشبه جوربًا آخر. يمكنك الإشارة فقط.', 'With a companion, find a sock that matches another one. Pointing is enough.']),
 journey(['أطابق وأرتب', 'Match and tidy'],
 ['جَمَعَتْ نُورَا الْجَوَارِبَ قُرْبَ السَّلَّةِ.', 'نَظَرَتْ إِلَى اللَّوْنِ وَالشَّكْلِ لِتَجِدَ الزَّوْجَ.', 'وَضَعَتْ كُلَّ زَوْجٍ مَعًا وَطَوَتْهُ.', 'صَارَتِ الْجَوَارِبُ مُرَتَّبَةً فِي السَّلَّةِ.'],
 ['Mia gathers the socks near the basket.', 'She looks at color and shape to find a pair.', 'She keeps each pair together and folds it.', 'The socks are tidy in the basket.'],
 ['أي صورة تبين الطي بعد المطابقة؟', 'Which picture shows folding after matching?'], ['طي الزوج', 'Folding the pair',2], ['البداية قبل المطابقة', 'Before matching',0],
 ['أرتب خطوات العناية', 'Sequence care steps'], ['احكِ ثلاث خطوات: أجد الزوج، أطويه، أضعه في مكانه.', 'Tell three steps: find a pair, fold it, put it away.']),
 journey(['كيف أجد الزوج؟', 'How do I find a pair?'],
 ['تَرَى نُورَا جَوَارِبَ زَرْقَاءَ وَبُرْتُقَالِيَّةً.', 'تَسْتَخْدِمُ اللَّوْنَ وَالشَّكْلَ كَدَلِيلَيْنِ لِلْمُطَابَقَةِ.', 'وَجَدَتِ الزَّوْجَ، ثُمَّ طَوَتْهُ.', 'تَضَعُ الْأَزْوَاجَ فِي مَكَانٍ وَاحِدٍ لِتَجِدَهَا لَاحِقًا.'],
 ['Mia sees blue socks and orange socks.', 'She uses color and shape as clues for matching.', 'She finds a pair, then folds it.', 'She puts the pairs in one place to find them later.'],
 ['أي صورة تظهر دليل التشابه قبل الطي؟', 'Which picture shows the matching clue before folding?'], ['نفس اللون والشكل', 'The same color and shape',1], ['جوارب داخل السلة', 'Socks in the basket',3],
 ['أشرح دليل المطابقة', 'Explain a matching clue'], ['صف زوجًا من أشياء البيت: كيف عرفت أنهما متشابهان؟', 'Describe a pair of things at home. How did you know they matched?'])]),

dict(id='letter',
 word=[['رَسْم',['رَسْ','م'],['Ras','m'],'رُسُوم',['رُ','سُوم'],['Ru','su:m'],'هَذَا رَسْمٌ لِصَدِيقِي.',0],
       ['sun',['s','u','n'],['s','V','n'],'fun',['f','u','n'],['f','V','n'],'Mia draws a sun.',0]],
 practice=[['نُورَا','تُقَدِّمُ','الرِّسَالَةَ'], ['Mia','gives','it']], practice_scene=2,
 extend=[['رَسَمَتْ','نُورَا','شَمْسًا','لِصَدِيقِهَا','عُمَرَ'], ['Mia','draws','Sam','a','sun']], extend_scene=0,
 endings=[['قَدَّمَتْ نُورَا الرِّسَالَةَ لِصَدِيقِهَا.', 'فَتَحَ عُمَرُ الرِّسَالَةَ وَرَأَى الشَّمْسَ.'], ['Mia gives her friend the drawing.', 'Sam opens the card and sees the sun.']], ending_scenes=[2,3],
 journeys=[
 journey(['رسمة لصديقي', 'A drawing for my friend'],
 ['تَرْسُمُ نُورَا شَمْسًا عَلَى بِطَاقَةٍ.', 'تَضَعُ الْبِطَاقَةَ فِي ظَرْفٍ.', 'تُقَدِّمُ الظَّرْفَ لِصَدِيقِهَا عُمَرَ.', 'يَفْتَحُ عُمَرُ الظَّرْفَ وَيَرَى الشَّمْسَ.'],
 ['Mia draws a sun on a card.', 'She puts the card in an envelope.', 'She gives the envelope to her friend Sam.', 'Sam opens it and sees the sun.'],
 ['أين يرسم الطفل الشمس؟', 'Where is the sun being drawn?'], ['رسم الشمس', 'Drawing the sun',0], ['فتح الرسالة', 'Opening the card',3],
 ['أحكي رسالة بالصور', 'Tell a picture message'], ['ارسم شيئًا تحبه أو أشر إلى صورة، ثم قدمه لمرافقك.', 'Draw something you like, or point to a picture, then share it with your companion.']),
 journey(['من الرسمة إلى الرسالة', 'From drawing to message'],
 ['اِخْتَارَتْ نُورَا شَمْسًا لِرِسَالَتِهَا الْمُصَوَّرَةِ.', 'حَفِظَتِ الرَّسْمَةَ دَاخِلَ الظَّرْفِ.', 'قَدَّمَتِ الرِّسَالَةَ لِعُمَرَ بِيَدِهَا.', 'ظَهَرَتِ الرَّسْمَةُ مِنْ جَدِيدٍ عِنْدَمَا فَتَحَ عُمَرُ الظَّرْفَ.'],
 ['Mia chooses a sun for her picture message.', 'She keeps the drawing inside an envelope.', 'She gives the message to Sam by hand.', 'The drawing appears again when Sam opens the envelope.'],
 ['أي صورة تبين أن الرسالة وصلت إلى الصديق؟', 'Which picture shows the message reaching the friend?'], ['تقديم الظرف', 'Giving the envelope',2], ['الرسم في البداية', 'Drawing at the start',0],
 ['أتابع انتقال الشيء', 'Follow an object journey'], ['تتبع البطاقة في الصور: أين كانت؟ وأين صارت؟', 'Follow the card in the pictures. Where was it, and where is it now?']),
 journey(['ماذا تقول الرسمة؟', 'What might the drawing say?'],
 ['رَسَمَتْ نُورَا شَمْسًا. نَرَى الرَّسْمَةَ، وَلَا نَعْرِفُ كُلَّ أَفْكَارِهَا.', 'تَسْتَطِيعُ أَنْ تُرْسِلَ رَسْمَتَهَا دُونَ كَلِمَاتٍ مَكْتُوبَةٍ.', 'قَدَّمَتْهَا لِعُمَرَ. يُمْكِنُنَا تَخَيُّلُ مَا قَالَتْهُ.', 'رَأَى عُمَرُ الشَّمْسَ. مَاذَا يُمْكِنُ أَنْ يَقُولَ فِي حِوَارِنَا؟'],
 ['Mia draws a sun. We see her drawing, but we do not know all her thoughts.', 'She can send a drawing without written words.', 'She gives it to Sam. We can imagine what she says.', 'Sam sees the sun. What could he say in our conversation?'],
 ['أي صورة تعطينا دليلًا أن الصديق رأى الرسمة؟', 'Which picture gives a clue that the friend has seen the drawing?'], ['البطاقة مفتوحة', 'The open card',3], ['الظرف مغلق', 'The closed envelope',2],
 ['أميز الصورة عن التخيل', 'Picture and imagination'], ['ألّف كلامًا للصديقين، وقل إن هذا كلام تتخيله من الصورة.', 'Make words for the friends, and say they are words you imagine from the picture.'])]),

dict(id='rain',
 word=[['مَطَر',['مَ','طَر'],['ma','t[aR'],'أَمْطَار',['أَمْ','طَار'],['am','t[a:R'],'أَرَى الْمَطَرَ مِنَ النَّافِذَةِ.',1],
       ['day',['d','ay'],['d','eI'],'days',['d','ay','s'],['d','eI','z'],'It is a rainy day.',1]],
 practice=[['نُورَا','تُجَهِّزُ','الْحِذَاءَ'], ['Mia','gets','ready']], practice_scene=1,
 extend=[['خَرَجَتْ','نُورَا','مَعَ','أُمِّهَا','بِمِظَلَّةٍ'], ['Mia','and','Mom','share','shelter']], extend_scene=2,
 endings=[['مَشَتْ نُورَا مَعَ أُمِّهَا تَحْتَ الْمِظَلَّةِ.', 'عَادَتَا إِلَى الْبَيْتِ وَتَرَكَتَا الْأَشْيَاءَ لِتَجِفَّ.'], ['Mia walks with Mom under the umbrella.', 'They return home and leave their things to dry.']], ending_scenes=[2,3],
 journeys=[
 journey(['يوم فيه مطر', 'A rainy day'],
 ['تَرَى نُورَا غُيُومًا مِنَ النَّافِذَةِ.', 'نَزَلَ الْمَطَرُ، فَجَهَّزَتِ الْحِذَاءَ وَالْمِظَلَّةَ مَعَ أُمِّهَا.', 'مَشَتْ مَعَ أُمِّهَا تَحْتَ الْمِظَلَّةِ.', 'عَادَتَا، وَتَرَكَتَا الْحِذَاءَ وَالْمِظَلَّةَ لِتَجِفَّ.'],
 ['Mia sees clouds through the window.', 'Rain begins. Mia and Mom get boots and an umbrella ready.', 'She walks with Mom under the umbrella.', 'They return and leave the boots and umbrella to dry.'],
 ['أين تمشي نورا تحت المظلة؟', 'Where does Mia walk under the umbrella?'], ['تحت المظلة مع الأم', 'Under the umbrella with Mom',2], ['داخل البيت', 'Inside the home',0],
 ['أرتب يومًا ممطرًا', 'Sequence a rainy day'], ['انظر من نافذة مع مرافق وصف الطقس. لا يلزم الخروج.', 'Look through a window with a companion and describe the weather. No outing is needed.']),
 journey(['قبل الخروج', 'Before going out'],
 ['نَظَرَتْ نُورَا إِلَى الْغُيُومِ قَبْلَ الْخُرُوجِ.', 'مَعَ نُزُولِ الْمَطَرِ، جَهَّزَتْ أَشْيَاءَ تُنَاسِبُهُ مَعَ أُمِّهَا.', 'حَمَلَتْ أُمُّهَا الْمِظَلَّةَ، وَمَشَتَا مَعًا.', 'بَعْدَ الرُّجُوعِ، رَتَّبَتَا الْأَشْيَاءَ الْمُبْتَلَّةَ لِتَجِفَّ.'],
 ['Mia looks at the clouds before going out.', 'When rain starts, she and Mom prepare things for rain.', 'Mom holds the umbrella, and they walk together.', 'Back home, they put the wet things where they can dry.'],
 ['أي صورة تبين الاستعداد قبل المشي؟', 'Which picture shows getting ready before walking?'], ['تجهيز الحذاء والمظلة', 'Boots and umbrella ready',1], ['الأشياء تجف', 'Things drying',3],
 ['أختار ما يناسب الموقف', 'Choose for a situation'], ['مع مرافق، اختر شيئًا يناسب المطر وشيئًا يناسب الشمس، أو سمّهما.', 'With a companion, choose or name something for rain and something for sunshine.']),
 journey(['دليل من النافذة', 'A clue through the window'],
 ['الْغُيُومُ شَيْءٌ تَرَاهُ نُورَا؛ قَدْ تَتَوَقَّعُ الْمَطَرَ.', 'الْقَطَرَاتُ عَلَى النَّافِذَةِ دَلِيلٌ أَنَّ الْمَطَرَ بَدَأَ.', 'اِخْتَارَتِ الْمِظَلَّةَ وَخَرَجَتْ مَعَ أُمِّهَا.', 'بَعْدَ الْعَوْدَةِ، تَرَكَتَا الْمِظَلَّةَ وَالْحِذَاءَ لِتَجِفَّ.'],
 ['Clouds are something Mia sees. She may predict rain.', 'Drops on the window are a clue that rain has started.', 'She chooses an umbrella and goes out with Mom.', 'After returning, they leave the umbrella and boots to dry.'],
 ['أي صورة فيها دليل مباشر أن المطر بدأ؟', 'Which picture has a direct clue that rain has started?'], ['قطرات على الزجاج', 'Drops on the window',1], ['غيوم فقط', 'Clouds only',0],
 ['أستخدم الدليل للاختيار', 'Use a clue to choose'], ['قل ملاحظة عن الطقس، ثم توقعًا. يمكن أن يتغير التوقع بعد الملاحظة.', 'Say a weather observation, then a prediction. A prediction can change after observing.'])]),

dict(id='pack',
 word=[['حَقِيبَة',['حَ','قِي','بَة'],['Ha','qi:','ba'],'حَقِيبَتِي',['حَ','قِي','بَ','تِي'],['Ha','qi:','ba','ti:'],'حَقِيبَتِي جَاهِزَةٌ.',3],
       ['bag',['b','a','g'],['b','a','g'],'big',['b','i','g'],['b','I','g'],'My bag is ready.',3]],
 practice=[['نُورَا','تُجَهِّزُ','حَقِيبَتَهَا'], ['Mia','packs','carefully']], practice_scene=2,
 extend=[['وَضَعَتْ','نُورَا','كِتَابَهَا','دَاخِلَ','الْحَقِيبَةِ'], ['Mia','puts','her','book','inside']], extend_scene=2,
 endings=[['أَغْلَقَتْ نُورَا الْحَقِيبَةَ بَعْدَ تَجْهِيزِهَا.', 'صَارَتْ نُورَا جَاهِزَةً لِلْخُرُوجِ مَعَ أُمِّهَا.'], ['Mia closes the bag after packing.', 'Mia is ready to leave with Mom.']], ending_scenes=[2,3],
 journeys=[
 journey(['حقيبتي جاهزة', 'My bag is ready'],
 ['حَقِيبَةُ نُورَا مَفْتُوحَةٌ وَفَارِغَةٌ.', 'تَخْتَارُ كِتَابًا وَأَلْوَانًا وَزُجَاجَةَ مَاءٍ.', 'تَضَعُهَا فِي الْحَقِيبَةِ وَتُغْلِقُهَا.', 'تَقِفُ بِحَقِيبَتِهَا مَعَ أُمِّهَا قُرْبَ الْبَابِ.'],
 ['Mia has an open, empty bag.', 'She chooses a book, crayons and a water bottle.', 'She puts them in the bag and closes it.', 'She stands with her bag and Mom by the door.'],
 ['أين الحقيبة جاهزة على الظهر؟', 'Where is the ready bag on Mia’s back?'], ['الحقيبة على الظهر', 'The bag on her back',3], ['حقيبة فارغة', 'An empty bag',0],
 ['أرتب الاستعداد', 'Sequence getting ready'], ['سمّ شيئًا تريد أخذه لنشاط تختاره مع مرافق.', 'Name something to take for an activity you choose with a companion.']),
 journey(['أختار ما أحتاج', 'Choose what I need'],
 ['أَمَامَ نُورَا أَشْيَاءُ وَحَقِيبَةٌ فَارِغَةٌ.', 'اِخْتَارَتْ مَا تَحْتَاجُهُ لِنَشَاطِهَا، وَتَرَكَتِ الْكُرَةَ.', 'وَضَعَتِ الْأَشْيَاءَ فِي الْحَقِيبَةِ بِعِنَايَةٍ.', 'أَصْبَحَتْ مُسْتَعِدَّةً لِلْخُرُوجِ مَعَ أُمِّهَا.'],
 ['Mia has objects and an empty bag in front of her.', 'She chooses what she needs for her activity and leaves the ball.', 'She carefully puts the chosen things inside.', 'She is ready to go out with Mom.'],
 ['أي صورة تبين الاختيار قبل وضع الأشياء؟', 'Which picture shows choosing before packing?'], ['اختيار الأشياء', 'Choosing things',1], ['الخروج بالحقيبة', 'Ready at the door',3],
 ['أختار لغرض محدد', 'Choose for a purpose'], ['اختر مع مرافق نشاطًا، ثم شيئًا يلائمه. قد يختلف الاختيار لنشاط آخر.', 'Choose an activity with a companion, then something for it. Another activity may need another choice.']),
 journey(['خطة قبل الذهاب', 'A plan before leaving'],
 ['تَنْظُرُ نُورَا إِلَى الْأَشْيَاءِ قَبْلَ أَنْ تَمْلَأَ حَقِيبَتَهَا.', 'تُفَكِّرُ فِي نَشَاطِهَا، فَتَخْتَارُ الْكِتَابَ وَالْأَلْوَانَ وَالْمَاءَ.', 'تُرَتِّبُ اخْتِيَارَاتِهَا وَتُغْلِقُ الْحَقِيبَةَ.', 'تَقِفُ مَعَ أُمِّهَا، وَحَقِيبَتُهَا الْخَفِيفَةُ جَاهِزَةٌ.'],
 ['Mia looks at the objects before filling her bag.', 'She thinks about her activity and chooses the book, crayons and water.', 'She arranges her choices and closes the bag.', 'She stands with Mom, and her light bag is ready.'],
 ['أي صورة تعطينا دليلًا أنها انتهت من التجهيز؟', 'Which picture gives a clue that packing is finished?'], ['الحقيبة جاهزة عند الباب', 'The ready bag by the door',3], ['أشياء خارج الحقيبة', 'Things outside the bag',0],
 ['أربط الخطة بالاستعداد', 'Connect a plan and readiness'], ['ألّف خطة لنشاط تختاره: ماذا سأفعل؟ ماذا أحتاج؟ وكيف أعرف أني جاهز؟', 'Make a plan for an activity: What will I do? What do I need? How will I know I am ready?'])]),

dict(id='picnic',
 word=[['سَلَّة',['سَ','لَّة'],['sa','l:a'],'سِلَال',['سِ','لَال'],['si','la:l'],'السَّلَّةُ جَاهِزَةٌ لِلنُّزْهَةِ.',1],
       ['mat',['m','a','t'],['m','a','t'],'sat',['s','a','t'],['s','a','t'],'We sit on the mat.',3]],
 practice=[['نُورَا','تُجَهِّزُ','السَّلَّةَ'], ['Mia','packs','fruit']], practice_scene=1,
 extend=[['تَشَارَكَتِ','الْعَائِلَةُ','الْفَاكِهَةَ','تَحْتَ','الشَّجَرَةِ'], ['The','family','shares','fruit','together']], extend_scene=3,
 endings=[['فَرَدَتْ نُورَا الْبِسَاطَ مَعَ أُمِّهَا.', 'جَلَسَتِ الْعَائِلَةُ وَتَشَارَكَتِ الْفَاكِهَةَ.'], ['Mia and Mom spread the mat.', 'The family sits and shares the fruit.']], ending_scenes=[2,3],
 journeys=[
 journey(['سلة للنزهة', 'A picnic basket'],
 ['الْفَاكِهَةُ مُجَهَّزَةٌ، وَالسَّلَّةُ قَرِيبَةٌ.', 'تَضَعُ نُورَا الْفَاكِهَةَ وَالْأَطْبَاقَ فِي السَّلَّةِ.', 'تَفْرُدُ الْبِسَاطَ مَعَ أُمِّهَا تَحْتَ الشَّجَرَةِ.', 'تَجْلِسُ الْعَائِلَةُ وَتَتَشَارَكُ الْفَاكِهَةَ.'],
 ['The fruit is ready, and the basket is nearby.', 'Mia puts fruit and plates in the basket.', 'She and Mom spread the mat under the tree.', 'The family sits and shares the fruit.'],
 ['أين تجلس العائلة معًا؟', 'Where does the family sit together?'], ['العائلة على البساط', 'The family on the mat',3], ['التجهيز في البيت', 'Getting ready at home',0],
 ['أرتب نشاطًا عائليًا', 'Sequence a family activity'], ['مثّل نزهة داخل البيت بمرافق ولعبة، دون الحاجة إلى طعام.', 'Pretend to have a picnic at home with a companion and a toy. No food is needed.']),
 journey(['نجهز ثم نشارك', 'Prepare, then share'],
 ['جَهَّزَتِ الْأُمُّ الْفَاكِهَةَ لِلنُّزْهَةِ.', 'سَاعَدَتْ نُورَا فِي وَضْعِ الْأَشْيَاءِ فِي السَّلَّةِ.', 'فَرَدَتَا الْبِسَاطَ فِي الْحَدِيقَةِ.', 'تَقَاسَمَتِ الْعَائِلَةُ الْفَاكِهَةَ عَلَى الْبِسَاطِ.'],
 ['Mom gets the fruit ready for the picnic.', 'Mia helps put the things in the basket.', 'They spread the mat in the garden.', 'The family shares fruit on the mat.'],
 ['أي صورة تبين تجهيز السلة؟', 'Which picture shows packing the basket?'], ['وضع الأشياء في السلة', 'Putting things in the basket',1], ['تناول الفاكهة معًا', 'Sharing fruit together',3],
 ['أصف المشاركة بخطوات', 'Describe sharing in steps'], ['احكِ كيف ساعدت نورا قبل النزهة وكيف شاركت بعدها.', 'Tell how Mia helped before the picnic and shared during it.']),
 journey(['لكل منا دور', 'A part for everyone'],
 ['نَرَى فَاكِهَةً مُجَهَّزَةً؛ الْأُمُّ وَنُورَا تَسْتَعِدَّانِ.', 'تُسَاهِمُ نُورَا بِتَرْتِيبِ أَشْيَاءِ النُّزْهَةِ.', 'تُسَاعِدُ فِي فَرْدِ الْبِسَاطِ، وَأُمُّهَا مَعَهَا.', 'تَجْتَمِعُ الْعَائِلَةُ. يُمْكِنُ أَنْ نَحْكِي مَا فَعَلَهُ كُلُّ شَخْصٍ.'],
 ['We see prepared fruit. Mom and Mia are getting ready.', 'Mia takes part by arranging the picnic things.', 'She helps spread the mat with Mom beside her.', 'The family gathers. We can tell what each person did.'],
 ['أي صورة فيها نورا تشارك في إعداد مكان الجلوس؟', 'Which picture shows Mia helping prepare the place to sit?'], ['فرد البساط', 'Spreading the mat',2], ['تجهيز السلة', 'Packing the basket',1],
 ['أحكي أدوارًا متكاملة', 'Tell connected roles'], ['ألّف حكاية تجهيز مشتركة: ماذا أفعل أنا؟ وماذا يفعل المرافق؟', 'Make a story of preparing together. What do I do, and what does my companion do?'])]),

dict(id='boat',
 word=[['وَرَق',['وَ','رَق'],['wa','Raq'],'وَرَقَة',['وَ','رَ','قَة'],['wa','Ra','qa'],'صَنَعْنَا قَارِبًا مِنَ الْوَرَقِ.',2],
       ['boat',['b','oa','t'],['b','oU','t'],'coat',['c','oa','t'],['k','oU','t'],'The paper boat floats.',3]],
 practice=[['نُورَا','تَطْوِي','الْوَرَقَةَ'], ['Mia','folds','paper']], practice_scene=1,
 extend=[['يَطْفُو','الْقَارِبُ','فَوْقَ','الْمَاءِ','بِالْوِعَاءِ'], ['The','paper','boat','floats','gently']], extend_scene=3,
 endings=[['صَارَتِ الْوَرَقَةُ قَارِبًا صَغِيرًا.', 'طَفَا الْقَارِبُ فِي قَلِيلٍ مِنَ الْمَاءِ مَعَ الْمُرَافِقِ.'], ['The paper becomes a little boat.', 'The boat floats in a little water with a companion nearby.']], ending_scenes=[2,3],
 journeys=[
 journey(['قارب من الورق', 'A paper boat'],
 ['أَمَامَ نُورَا وَرَقَةٌ عَلَى الطَّاوِلَةِ.', 'تَطْوِي الْوَرَقَةَ مَعَ أُمِّهَا.', 'صَارَتِ الْوَرَقَةُ قَارِبًا صَغِيرًا.', 'تُجَرِّبُ الْقَارِبَ مَعَ أُمِّهَا فِي وِعَاءٍ بِقَلِيلٍ مِنَ الْمَاءِ.'],
 ['Mia has a sheet of paper on the table.', 'She folds the paper with Mom.', 'The paper becomes a little boat.', 'She tries the boat with Mom in a basin with a little water.'],
 ['أين القارب الورقي جاهز على الطاولة؟', 'Where is the finished paper boat on the table?'], ['قارب جاهز', 'A finished boat',2], ['ورقة قبل الطي', 'Paper before folding',0],
 ['ألاحظ تغير الشكل', 'Notice a shape change'], ['اطوِ ورقة مع مرافق وشاهد تغير شكلها. لا يلزم استعمال الماء.', 'Fold paper with a companion and notice its shape changing. No water is needed.']),
 journey(['أطوي ثم أجرب', 'Fold, then try'],
 ['جَهَّزَتْ نُورَا وَرَقَةً لِفِكْرَتِهَا.', 'سَاعَدَتْهَا أُمُّهَا فِي الطَّيِّ.', 'وَضَعَتَا الْقَارِبَ الْجَاهِزَ عَلَى الطَّاوِلَةِ.', 'جَرَّبَتَاهُ مَعًا فِي وِعَاءٍ ضَحْلٍ بِقَلِيلٍ مِنَ الْمَاءِ.'],
 ['Mia gets paper ready for her idea.', 'Mom helps her with the folding.', 'They put the finished boat on the table.', 'Together, they try it in a shallow basin with a little water.'],
 ['أي صورة تبين الطي بمساعدة المرافق؟', 'Which picture shows folding with a companion’s help?'], ['طي الورقة معًا', 'Folding together',1], ['القارب في الماء', 'The boat in water',3],
 ['أرتب صنعًا وتجربة', 'Sequence making and trying'], ['احكِ الخطوات: ورقة، ثم طي، ثم قارب، ثم تجربة مع مرافق إن أردتما.', 'Tell the steps: paper, folding, boat, then a try with a companion if you both want.']),
 journey(['ألاحظ القارب', 'Observe the boat'],
 ['تَرَى نُورَا وَرَقَةً مُسَطَّحَةً قَبْلَ الطَّيِّ.', 'تُغَيِّرُ شَكْلَهَا بِمُسَاعَدَةِ أُمِّهَا.', 'تَقُولُ: أَرَى قَارِبًا، وَأَتَوَقَّعُ أَنْ يَطْفُوَ.', 'تَرَاهُ يَطْفُو فِي الْوِعَاءِ. هَذِهِ مُلَاحَظَةٌ مِنْ هَذِهِ التَّجْرِبَةِ.'],
 ['Mia sees flat paper before folding.', 'She changes its shape with Mom’s help.', 'She says, I see a boat, and I think it will float.', 'She sees it float in the basin. This is an observation from this try.'],
 ['أي صورة تعطينا دليلًا أن القارب يطفو في هذه التجربة؟', 'Which picture gives a clue that this boat floats in this try?'], ['القارب فوق الماء', 'The boat on the water',3], ['القارب على الطاولة', 'The boat on the table',2],
 ['أفرق بين توقع وتجربة', 'Prediction and a try'], ['قارن توقع نورا بما رأته. يمكنك الاكتفاء بالصور، أو التجربة مع مرافق وبقليل من الماء.', 'Compare Mia’s prediction with what she saw. Use only the pictures, or try with a companion and a little water.'])])
]

tracks = ('entry', 'practice', 'extend')
langs = ('ar', 'en')
new_ids = {lang + '-' + w['id'] + '-' + track for w in WORLDS for lang in langs for track in tracks}
D['stories'] = [s for s in D['stories'] if s['id'] not in new_ids]
for wi, world in enumerate(WORLDS):
    prefix = 'v4-' + world['id']
    for li, lang in enumerate(langs):
        text, units, phones, transfer, tunits, tphones, phrase, tile = world['word'][li]
        word_id = lang + '-' + prefix
        D['words'][word_id] = dict(id=word_id, language=lang, text=text, units=units,
            phonetic_units=phones, audio=audio(lang,text), phrase=phrase, phrase_audio=audio(lang,phrase),
            transfer=transfer, transfer_audio=audio(lang,transfer), transfer_units=tunits,
            transfer_phonetic_units=tphones,
            unit_audio=['audio/'+word_id+'-sound-'+str(i)+'.mp3' for i in range(len(units))],
            transfer_unit_audio=['audio/'+word_id+'-new-sound-'+str(i)+'.mp3' for i in range(len(tunits))],
            image='assets/'+prefix+'-story-640.jpg', support_scene=prefix+'-entry-'+str(tile),
            mode='syllables' if lang=='ar' else 'phonemes')
    for ti, track in enumerate(tracks):
        j = world['journeys'][ti]
        scenes = []
        for tile in range(4):
            scene_id = prefix+'-'+track+'-'+str(tile)
            scenes.append(scene_id)
            texts = {lang:j['narration'][lang][tile] for lang in langs}
            D['scenes'][scene_id] = dict(id=scene_id, sheet='assets/'+prefix+'-story-1024.webp',
                small_sheet='assets/'+prefix+'-story-640.webp', fallback_sheet='assets/'+prefix+'-story-640.jpg',
                large_fallback_sheet='assets/'+prefix+'-story-1024.jpg', tile=tile, text=texts,
                audio={lang:audio(lang,texts[lang]) for lang in langs})
            if world['id'] in frames: D['scenes'][scene_id]['frame']=frames[world['id']][tile]
        for li,lang in enumerate(langs):
            story_id = lang+'-'+world['id']+'-'+track
            choices = [j['correct'], j['wrong']]
            if (wi+ti)%2: choices.reverse()
            story = dict(id=story_id, language=lang, title=j['title'][li], title_audio=audio(lang,j['title'][li]),
                track=track, scenes=scenes, optional_scene=scenes[3], word=lang+'-'+prefix,
                question=j['question'][li], question_audio=audio(lang,j['question'][li]),
                choices=[dict(label=c[li],scene=scenes[c[2]]) for c in choices],
                meaning=choices.index(j['correct']), real_world=j['real'][li], skill=j['skill'][li],
                coach_tip=('استمع للمحاولة، واطلب دليلًا من الصورة عند الاستعداد. اعرض مثالًا واحدًا ثم أعد الدور للطفل. الأعمار إرشادية ولا تقييم آلي للنطق.' if lang=='ar' else
                           'Listen to the try and ask for a picture clue when ready. Model one example, then return the turn to the child. Ages are suggestions; no automated pronunciation assessment.'),
                collection='new-worlds-4', world=world['id'], sentences={}, endings=[])
            for sentence_track in ('practice','extend'):
                units = world[sentence_track][li]
                sentence_text = ' '.join(units)+'.'
                story['sentences'][sentence_track] = dict(text=sentence_text, units=units,
                    scene=scenes[world[sentence_track+'_scene']], audio=audio(lang,sentence_text),
                    unit_audio=[audio(lang,u) for u in units])
            for ei,text in enumerate(world['endings'][li]):
                story['endings'].append(dict(text=text, scene=scenes[world['ending_scenes'][ei]], audio=audio(lang,text)))
            D['stories'].append(story)

D['release']='preview-4'
D['library_version']=4
(ROOT/'data/stories.json').write_text(json.dumps(D,ensure_ascii=False,indent=2)+'\n')
(ROOT/'data/stories.js').write_text('window.STORY_DATA='+json.dumps(D,ensure_ascii=False,separators=(',',':'))+';\n')
print(json.dumps(dict(stories=len(D['stories']),scenes=len(D['scenes']),words=len(D['words']),
    added_concepts=30, recommended_per_level_per_language=14)))
