'use strict';
const fs=require('fs'),path=require('path');const root=path.resolve(__dirname,'../apps/1-4/tic-tac-toe');
const rows=[
['place','نَلْعَبُ بِالدَّوْرِ. اِلْمَسْ خَانَةً فَارِغَةً لِتَضَعَ رَمْزَكَ.','Take turns. Tap an empty square to place your piece.'],
['row','ثَلَاثَةُ رُمُوزٍ مُتَشَابِهَةٍ فِي صَفٍّ أُفُقِيٍّ تُكْمِلُ الْخَطَّ.','Three matching pieces across complete a line.'],
['column','يُمْكِنُ إِكْمَالُ خَطٍّ رَأْسِيٍّ أَيْضًا. اُنْظُرْ مِنْ أَعْلَى إِلَى أَسْفَلَ.','A line can go down too. Look from top to bottom.'],
['diagonal','هُنَاكَ خَطٌّ مَائِلٌ مِنْ زَاوِيَةٍ إِلَى الزَّاوِيَةِ الْمُقَابِلَةِ.','A diagonal line joins one corner to the opposite corner.'],
['win','لَدَيْكَ رَمْزَانِ فِي خَطٍّ وَاحِدٍ. أَكْمِلِ الْخَانَةَ الثَّالِثَةَ لِتَفُوزَ.','You have two pieces in one line. Complete the third square to win.'],
['block','لِلْمُنَافِسِ رَمْزَانِ فِي خَطٍّ وَاحِدٍ. ضَعْ رَمْزَكَ فِي الْخَانَةِ الْفَارِغَةِ لِتَصُدَّهُ.','The other player has two in a line. Place your piece in its empty square to block.'],
['center','خَانَةُ الْوَسَطِ تَشْتَرِكُ فِي أَرْبَعَةِ خُطُوطٍ. لِنَكْتَشِفْ قُوَّتَهَا.','The center belongs to four lines. Let us explore its strength.'],
['fork','ضَعْ رَمْزَكَ حَيْثُ تَصْنَعُ فُرْصَتَيْنِ لِلْفَوْزِ فِي الدَّوْرِ الْقَادِمِ.','Place your piece where it creates two winning chances for your next turn.'],
['stop-fork','اِمْنَعِ الْمُنَافِسَ مِنْ صُنْعِ فُرْصَتَيْنِ مَعًا. تَأَمَّلِ الْخَانَاتِ الْجَانِبِيَّةَ.','Stop the other player from creating two threats. Look at the side squares.'],
['think','اُنْظُرْ أَوَّلًا: هَلْ تَسْتَطِيعُ الْفَوْزَ؟ وَإِنْ لَمْ تَسْتَطِعْ، فَهَلْ تَحْتَاجُ إِلَى الصَّدِّ؟','First look for a win. If there is no win, check whether you need to block.'],
['try','اَلْآنَ دَوْرُكَ. تَأَمَّلِ الْلَّوْحَةَ ثُمَّ اِخْتَرِ الْخَانَةَ بِنَفْسِكَ.','Your turn. Look at the board, then choose a square yourself.'],
['independent','جَرِّبْ بِدُونِ الْيَدِ. اِبْحَثْ عَنِ الْفَوْزِ وَالصَّدِّ، وَاطْلُبِ الْمُسَاعَدَةَ إِذَا احْتَجْتَ.','Try without the hand. Look for a win or a block, and ask for help when you need it.'],
['good','أَحْسَنْتَ الْمُلَاحَظَةَ! لَقَدِ اخْتَرْتَ خَانَةً تُسَاعِدُكَ.','Good observation! You chose a helpful square.'],
['victory','أَكْمَلْتَ ثَلَاثَةَ رُمُوزٍ فِي خَطٍّ وَاحِدٍ. تَخْطِيطٌ جَمِيلٌ!','You completed three pieces in a line. Lovely planning!'],
['loss','مُحَاوَلَةٌ طَيِّبَةٌ. لِنَبْحَثْ عَنِ الْخَطِّ الَّذِي كَانَ يَحْتَاجُ إِلَى الصَّدِّ.','A good try. Let us find the line that needed a block.'],
['draw','تَعَادُلٌ! حَمَيْتَ خُطُوطَكَ. مَعَ اللَّعِبِ الْمُتْقَنِ قَدْ تَنْتَهِي الْجَوْلَةُ بِالتَّعَادُلِ.','A draw! You protected your lines. When both players play well, a draw can be a good result.'],
['together','نُكْمِلُ الْخَطَّ الْمُضِيءَ مَعًا، خَانَةً بَعْدَ خَانَةٍ.','Complete the glowing line together, one square at a time.'],
['look','نَتَعَلَّمُ بِهُدُوءٍ. شَاهِدِ الْيَدَ، ثُمَّ جَرِّبْ أَنْتَ.','Learn at your own pace. Watch the hand, then try yourself.']
];
const items=rows.flatMap(([id,ar,en])=>[['ar',ar],['en',en]].map(([language,text])=>({id,language,text,path:'audio/guide/'+language+'/'+id+'.mp3',engine:'silma'})));
fs.mkdirSync(path.join(root,'data'),{recursive:true});fs.writeFileSync(path.join(root,'data/guidance-scripts.json'),JSON.stringify({schema_version:1,items},null,2)+'\n');
