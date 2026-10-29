'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../apps/1-4/lines-and-houses');
const rows=[
 ['welcome-little','نَبْنِي قَرْيَةً مَعًا. اُنْظُرْ إِلَى الْيَدِ، ثُمَّ جَرِّبْ بِنَفْسِكَ.','Let us build a village. Watch the hand, then try for yourself.'],
 ['welcome-explorer','نُرَاقِبُ الْبُيُوتَ وَنُخَطِّطُ قَبْلَ رَسْمِ الْخَطِّ. ثُمَّ نَجْرِبُ بِنَفْسِنَا.','Look at the houses and plan before drawing. Then try for yourself.'],
 ['line','اِلْمَسْ خَطًّا مُتَقَطِّعًا بَيْنَ نُقْطَتَيْنِ.','Tap a dotted line between two dots.'],
 ['capture','هَذَا الْبَيْتُ لَهُ ثَلَاثَةُ جَوَانِبَ. أَكْمِلِ الْجَانِبَ الْأَخِيرَ لِتَبْنِيَهُ.','This house has three sides. Complete its last side to build it.'],
 ['house','أَحْسَنْتَ! أَكْمَلْتَ الْجَوَانِبَ الْأَرْبَعَةَ وَبَنَيْتَ بَيْتًا.','Well done! Four complete sides make a house.'],
 ['extra','عِنْدَمَا تَبْنِي بَيْتًا فِي الْمُنَافَسَةِ، يَبْقَى الدَّوْرُ لَكَ.','In a match, building a house gives you another turn.'],
 ['double','خَطٌّ وَاحِدٌ بَيْنَ الْبَيْتَيْنِ يُكْمِلُ بَيْتَيْنِ مَعًا.','One shared line can complete two houses together.'],
 ['safe','قَبْلَ أَنْ تَرْسُمَ، اُبْحَثْ عَنْ خَطٍّ لَا يَتْرُكُ ثَلَاثَةَ جَوَانِبَ لِلْمُنَافِسِ.','Look for a line that does not leave three sides for the other player.'],
 ['risk','هَذَا الْخَطُّ يَتْرُكُ بَيْتًا قَرِيبًا مِنَ الِاكْتِمَالِ. جَرِّبْ خَطًّا آخَرَ.','That line leaves a house nearly complete. Try another line.'],
 ['chain','اِبْنِ الْبَيْتَ الْقَرِيبَ، ثُمَّ اُنْظُرْ إِلَى الْبَيْتِ الْمُجَاوِرِ فِي دَوْرِكَ التَّالِي.','Build the nearby house. Then look at its neighbor during your extra turn.'],
 ['together','فِي التَّعَاوُنِ نَتَبَادَلُ الْأَدْوَارَ، وَنَبْنِي الْقَرْيَةَ مَعًا.','In team play, take turns and build the village together.'],
 ['try','اَلْآنَ دَوْرُكَ. اِلْمَسِ الْخَطَّ بِنَفْسِكَ.','Your turn. Tap the line yourself.'],
 ['independent','اِخْتَرْ خُطُوطَكَ بِنَفْسِكَ. رَاقِبْ كُلَّ بَيْتٍ قَبْلَ أَنْ تَرْسُمَ.','Choose your own lines. Look at every house before drawing.'],
 ['retry','كُلُّ مُحَاوَلَةٍ تُعَلِّمُنَا. لِنُرَاجِعْ خُطْوَةً صَغِيرَةً مَعًا.','Every try helps us learn. Let us practice one small step together.'],
 ['good','جَمِيلٌ! لَاحَظْتَ الْخَطَّ الْمُنَاسِبَ بِنَفْسِكَ.','Lovely! You found a helpful line yourself.'],
 ['win','أَحْسَنْتَ التَّخْطِيطَ! بَنَيْتَ بُيُوتًا أَكْثَرَ فِي هَذِهِ الْجَوْلَةِ.','Good planning! You built more houses in this round.'],
 ['loss','مُحَاوَلَةٌ طَيِّبَةٌ. نَتَعَلَّمُ مِنْ خُطُوطِنَا وَنَجْرِبُ مَرَّةً أُخْرَى.','A good try. Learn from your lines and try again.'],
 ['tie','تَسَاوَتِ الْبُيُوتُ! لَعِبْتُمَا جَوْلَةً جَمِيلَةً.','The houses are equal! You both played a lovely round.'],
 ['village','اِكْتَمَلَتْ قَرْيَتُنَا! لَاحِظْ كَيْفَ تَحَوَّلَتِ الْخُطُوطُ إِلَى بُيُوتٍ.','Our village is complete! See how your lines became houses.'],
 ['finished','اِنْتَهَى التَّدْرِيبُ. جَرِّبِ الْلَّعِبَ بِنَفْسِكَ، وَاطْلُبِ الْمُسَاعَدَةَ مَتَى أَحْبَبْتَ.','Practice is complete. Play for yourself and ask for help whenever you like.']
];
const items=rows.flatMap(([id,ar,en])=>[['ar',ar],['en',en]].map(([language,text])=>({id,language,text,path:'audio/guide/'+language+'/'+id+'.mp3',engine:'silma'})));
fs.mkdirSync(path.join(root,'data'),{recursive:true});fs.writeFileSync(path.join(root,'data/guidance-scripts.json'),JSON.stringify({schema_version:1,items},null,2)+'\n');
