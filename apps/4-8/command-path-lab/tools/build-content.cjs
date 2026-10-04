'use strict';
const fs=require('fs'),path=require('path');
const app=path.resolve(__dirname,'..'),M=require('../src/model.js');
const touchPhrases=require('../data/touch-phrases.json');
const pair=(ar,en)=>({ar,en});
const phrases={
 library:pair('اخْتَرْ خَرِيطَةً، ثُمَّ سَاعِدِ الرُّوبُوتَ عَلَى الْوُصُولِ.','Choose a map, then help the robot reach its destination.'),
 predict:pair('كَيْفَ سَيَسِيرُ الرُّوبُوتُ؟ الْمَسِ الْمُرَبَّعَ التَّالِي لِتَرْسُمَ تَوَقُّعَكَ.','How will the robot travel? Touch the next square to draw your prediction.'),
 plan:pair('الْمَسِ الْأَوَامِرَ لِتَرْتِيبِ الطَّرِيقِ. ثُمَّ شَغِّلْ خُطْوَةً وَشَاهِدْ.','Touch commands to build the route. Then run a step and watch.'),
 n:pair('إِلَى أَعْلَى الْخَرِيطَةِ.','Move up the map.'), e:pair('إِلَى يَمِينِ الْخَرِيطَةِ.','Move right on the map.'), s:pair('إِلَى أَسْفَلِ الْخَرِيطَةِ.','Move down the map.'), w:pair('إِلَى يَسَارِ الْخَرِيطَةِ.','Move left on the map.'),
 f:pair('تَقَدَّمْ إِلَى الْمُرَبَّعِ التَّالِي أَمَامَ الرُّوبُوتِ.','Move to the next square in front of the robot.'), l:pair('دُرْ إِلَى يَسَارِكَ فِي مَكَانِكَ.','Turn left in place.'), r:pair('دُرْ إِلَى يَمِينِكَ فِي مَكَانِكَ.','Turn right in place.'),
 repeat:pair('كَرِّرْ هَذِهِ الْمَجْمُوعَةَ مِنَ الْأَوَامِرِ.','Repeat this group of commands.'), if:pair('إِذَا كَانَ أَمَامَكَ حَاجِزٌ أَوْ حَافَّةٌ، دُرْ يَمِينًا. وَإِلَّا، تَقَدَّمْ.','If there is a barrier or edge ahead, turn right. Otherwise, move forward.'),
 blocked:pair('تَوَقَّفْنَا عِنْدَ حَاجِزٍ أَوْ حَافَّةٍ. أَيُّ أَمْرٍ نُغَيِّرُ؟','We stopped at a barrier or edge. Which command could we change?'),
 arrived:pair('وَصَلْنَا. شَاهِدْ طَرِيقَكَ، ثُمَّ احْفَظْهُ إِنْ شِئْتَ.','We arrived. Look at your route, then save it if you wish.'),
 away:pair('انْتَهَتِ الْأَوَامِرُ هُنَا. هَلْ نُضِيفُ أَمْرًا أَمْ نُغَيِّرُ أَمْرًا؟','The commands ended here. Could we add a command or change one?'),
 step:pair('نُجَرِّبُ أَمْرًا وَاحِدًا، ثُمَّ نَتَوَقَّفُ لِنَرَى.','Try one command, then stop and look.'),
 paused:pair('تَوَقَّفْنَا. يَبْقَى طَرِيقُكَ مَحْفُوظًا لِتُكْمِلَ.','We paused. Your route stays here so you can continue.'),
 saved:pair('حَفِظْنَا طَرِيقَكَ. يُمْكِنُكَ فَتْحُ نُسْخَةٍ وَتَجْرِبَةُ فِكْرَةٍ أُخْرَى.','We saved your route. Open a copy to try another idea.'),
 hint:pair('شَاهِدْ أَوَّلَ مُرَبَّعٍ لَمْ يَسِرْ كَمَا تَوَقَّعْتَ. عَدِّلْ أَمْرًا وَجَرِّبْ.','Look at the first square that differed from your prediction. Change a command and try again.'),
 predictSkip:pair('يُمْكِنُكَ أَنْ تَتَوَقَّعَ أَوْ تَكْتَشِفَ بِالْمُشَاهَدَةِ.','You can predict first or discover by watching.'),
 designer:pair('اخْتَرِ الْبِدَايَةَ أَوِ الْمَقْصِدَ أَوِ الْحَاجِزَ، ثُمَّ الْمَسِ الْمُرَبَّعَ.','Choose start, destination or barrier, then touch a square.'),
 start:pair('اخْتَرْ مُرَبَّعَ الْبِدَايَةِ.','Choose the starting square.'), goal:pair('اخْتَرْ مُرَبَّعَ الْمَقْصِدِ.','Choose the destination square.'), wall:pair('ضَعْ حَاجِزًا فِي مُرَبَّعٍ فَارِغٍ.','Place a barrier in an empty square.'), erase:pair('الْمَسْ حَاجِزًا لِتُزِيلَهُ.','Touch a barrier to remove it.'),
 demo:pair('شَاهِدْ هَذَا الْمِثَالَ. نُرَتِّبُ الْأَوَامِرَ ثُمَّ نُجَرِّبُ خُطْوَةً خُطْوَةً.','Watch this separate example. Arrange the commands, then try them one step at a time.'),
 rotation:pair('مُقَدِّمَةُ الرُّوبُوتِ تَدُلُّ عَلَى اتِّجَاهِهِ. الدَّوَرَانُ يُغَيِّرُ اتِّجَاهَهُ دُونَ أَنْ يَنْتَقِلَ.','The robot points in its facing direction. Turning changes its direction without changing its square.'),
 real:pair('ضَعْ بَطَاقَاتِ الْأَوَامِرِ عَلَى طَاوِلَةٍ أَوْ فِي مَسَاحَةٍ آمِنَةٍ مَعَ الْمُرَبِّي.','Use command cards on a table or in a safe space with your coach.')
};
Object.assign(phrases,touchPhrases);
const missions=[{id:'entry-book',size:3,start:{x:0,y:1,dir:1},goal:{x:2,y:1},walls:[],title:pair('إلى الكتاب','To the book'),mode:'absolute',level:1,goal_asset:'book'}];
if(process.argv.includes('--one')){write(missions);process.exit();}
const assets=['book','ball','apple','bear','cat','car'];
const objectNames=JSON.parse(fs.readFileSync(path.resolve(app,'../../../resources/early-child-market-objects/manifest.json'),'utf8')).items;
for(let i=1;i<12;i++){
 const size=i<6?3:4,reverse=i%2===1,vertical=i%3===0,span=i<6?2:3;
 const start=vertical?{x:1,y:reverse?span:0,dir:reverse?0:2}:{x:reverse?span:0,y:1,dir:reverse?3:1};
 const goal=vertical?{x:1,y:reverse?0:span}:{x:reverse?0:span,y:1};
 if(i>=8){start.x=reverse?3:0;start.y=3;goal.x=reverse?1:2;goal.y=2;}
 const walls=i>=6?[vertical?{x:0,y:1}:{x:1,y:0}]:[];
 missions.push({id:'entry-'+i,size,start,goal,walls,title:pair('إلى '+objectNames.find(q=>q.id===assets[i%6]).ar,'To the '+objectNames.find(q=>q.id===assets[i%6]).en.toLowerCase()),mode:'absolute',level:1,goal_asset:assets[i%6]});
}
for(let i=0;i<12;i++){
 const size=4,start={x:i%2?3:0,y:3,dir:i%2?3:0},goal={x:i%2?0:3,y:i<4?2:1};
 const walls=i>=3?[{x:1,y:2},{x:2,y:2}]:[];
 const m={id:'turn-'+i,size,start,goal,walls,title:pair(['أمر ثم دوران','حول الحاجز','أغير اتجاهي','أول أمر أعدله','طريق آخر للمقصد','أدور في مكاني'][i%6],['Move, then turn','Around a barrier','Change my direction','The first command I change','Another route to the goal','Turn in place'][i%6]),mode:'relative',level:2,goal_asset:assets[i%6]};
 if(i%4===3){m.challenge='debug';m.starter=M.solve(m);m.starter[0]={op:'r'};}
 missions.push(m);
}
for(let i=0;i<12;i++){
 const start={x:i%2?4:0,y:4,dir:0},goal={x:i%2?0:4,y:i<4?4:0},walls=i<4?[]:[{x:1,y:2},{x:2,y:2},{x:3,y:2}];
 const m={id:'build-'+i,size:5,start,goal,walls,title:pair(['أكرر مجموعة أوامر','طريقان إلى المقصد','أرى الحاجز وأقرر','أقصر البطاقات بالتكرار','أختبر فكرتي','لغز لصديقي'][i%6],['Repeat a command group','Two routes to the goal','Look ahead and decide','A shorter tape with repeats','Test my idea','A puzzle for a friend'][i%6]),mode:'relative',level:3,goal_asset:assets[i%6]};
 if(i===0)m.starter=[{op:'r'},{op:'repeat',count:3,body:[{op:'f'}]}];
 if(i===2)m.starter=[{op:'if'}];
 missions.push(m);
}
write(missions);
function write(maps){const data={schema_version:1,coordinate_frame:'screen-fixed; x right, y down; robot direction 0 north, 1 east, 2 south, 3 west; never mirrored by RTL',levels:[{id:1,title:pair('أرتب الطريق','Arrange the route'),age:'4–5'},{id:2,title:pair('أدور وأصحح','Turn and debug'),age:'5–6'},{id:3,title:pair('أكرر وأبتكر','Repeat and invent'),age:'6–8'}],phrases:phrases,maps:maps.map(M.map)};fs.mkdirSync(path.join(app,'data'),{recursive:true});fs.writeFileSync(path.join(app,'data/content.json'),JSON.stringify(data,null,2)+'\n');fs.writeFileSync(path.join(app,'data/content.js'),'window.COMMAND_CONTENT='+JSON.stringify(data)+';\n');['book','ball','apple','bear','cat','car'].forEach(id=>{const p=JSON.parse(fs.readFileSync(path.resolve(app,'../../../resources/early-child-market-objects/manifest.json'),'utf8')).items.find(q=>q.id===id);phrases['goal-'+id]=pair('الْمَقْصِدُ فِي هَذِهِ الْخَرِيطَةِ: '+({book:'كِتَاب',ball:'كُرَة',apple:'تُفَّاح',bear:'دُبّ',cat:'قِطَّة',car:'سَيَّارَة'}[id])+'.','Our destination on this map is the '+p.en.toLowerCase()+'.');});data.phrases=phrases;fs.writeFileSync(path.join(app,'data/content.json'),JSON.stringify(data,null,2)+'\n');fs.writeFileSync(path.join(app,'data/content.js'),'window.COMMAND_CONTENT='+JSON.stringify(data)+';\n');const items=[];Object.keys(phrases).forEach(k=>['ar','en'].forEach(l=>items.push({path:'audio/'+l+'-'+k+'.mp3',language:l,text:phrases[k][l]})));fs.writeFileSync(path.join(app,'data/audio-manifest.json'),JSON.stringify({schema_version:1,voices:{ar:'ar-SA-HamedNeural',en:'en-US-GuyNeural'},rate:'-10%',items},null,2)+'\n');}
