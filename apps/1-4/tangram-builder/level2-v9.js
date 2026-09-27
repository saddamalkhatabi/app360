'use strict';
(function(){
/* v9: rebuilt medium level — 70 handcrafted stages, richer connected compositions, no random distortion. */
var PI=Math.PI;
var R='#ef4b4d',Y='#f4c845',B='#41a8e5',G='#79c94b',P='#8a4fc5',K='#e967b2',O='#f08f35',N='#8b5a2b',C='#34c7cf',M='#f3e2bd';
function Q(t,x,y,r,s,c){return [t,x,y,r||0,s||1,c||null]}
function O1(name,pieces,scale){return{name:name,pieces:pieces,pieceScale:scale||1}}
function mirror(ps){var out=[],i,a;for(i=0;i<ps.length;i++){a=ps[i];out.push([a[0],1-a[1],a[2],-(a[3]||0),a[4]||1,a[5]||null])}return out}
function F(kind,v){var a;switch(kind){
case'elephant':a=[Q('semi',.39,.47,PI,.92,G),Q('circle',.59,.36,0,.58,G),Q('arc',.70,.43,-PI/2,.58,G),Q('rect',.32,.66,PI/2,.52,N),Q('rect',.49,.66,PI/2,.52,N),Q('tri',.20,.43,-PI/2,.46,K)];break;
case'giraffe':a=[Q('circle',.62,.18,0,.48,Y),Q('rect',.58,.34,PI/2,.48,Y),Q('rect',.53,.49,PI/2,.50,Y),Q('semi',.40,.53,PI,.82,Y),Q('rect',.35,.69,PI/2,.44,N),Q('rect',.52,.69,PI/2,.44,N)];break;
case'horse':a=[Q('circle',.65,.27,0,.50,O),Q('rect',.57,.39,-.24,.54,O),Q('semi',.44,.50,PI,.88,O),Q('rect',.38,.69,PI/2,.44,N),Q('rect',.55,.69,PI/2,.44,N),Q('para',.24,.47,.72,.54,K)];break;
case'dog':a=[Q('circle',.65,.28,0,.50,O),Q('semi',.58,.35,PI/2,.48,N),Q('rect',.51,.43,0,.58,O),Q('semi',.38,.51,PI,.85,O),Q('rect',.39,.69,PI/2,.43,N),Q('rect',.56,.69,PI/2,.43,N)];break;
case'cat':a=[Q('circle',.64,.29,0,.49,K),Q('tri',.57,.16,-.20,.36,K),Q('tri',.70,.16,.20,.36,K),Q('semi',.48,.50,PI,.88,P),Q('rect',.43,.69,PI/2,.42,N),Q('arc',.25,.49,PI,.60,G)];break;
case'rabbit':a=[Q('circle',.60,.31,0,.52,M),Q('leaf',.54,.13,PI/2,.54,K),Q('leaf',.66,.13,PI/2,.54,K),Q('semi',.46,.51,PI,.86,M),Q('circle',.30,.49,0,.36,M),Q('tri',.23,.42,-PI/2,.32,Y)];break;
case'duck':a=[Q('circle',.60,.31,0,.49,Y),Q('tri',.75,.31,PI/2,.34,O),Q('semi',.45,.51,PI,.84,Y),Q('semi',.33,.44,-PI/2,.50,B),Q('rect',.43,.68,PI/2,.35,N),Q('rect',.55,.68,PI/2,.35,N)];break;
case'owl':a=[Q('circle',.50,.34,0,.76,N),Q('circle',.40,.28,0,.34,Y),Q('circle',.60,.28,0,.34,Y),Q('tri',.50,.40,PI,.28,O),Q('semi',.34,.49,-PI/2,.50,P),Q('semi',.66,.49,PI/2,.50,P)];break;
case'peacock':a=[Q('circle',.50,.50,0,.58,C),Q('circle',.50,.32,0,.39,C),Q('semi',.31,.40,-PI/2,.63,G),Q('semi',.69,.40,PI/2,.63,G),Q('tri',.50,.17,0,.30,Y),Q('rect',.50,.68,PI/2,.37,N)];break;
case'fish':a=[Q('circle',.28,.42,0,.38,Y),Q('diamond',.42,.42,0,.62,O),Q('rect',.56,.42,0,.64,R),Q('tri',.76,.42,PI/2,.52,B),Q('tri',.49,.25,0,.40,C),Q('tri',.49,.59,PI,.40,C)];break;
case'whale':a=[Q('semi',.43,.47,PI,.92,B),Q('circle',.59,.41,0,.44,B),Q('tri',.23,.44,-PI/2,.48,C),Q('semi',.38,.60,PI,.50,B),Q('semi',.54,.60,PI,.50,B),Q('arc',.60,.24,-PI/2,.48,C)];break;
case'octopus':a=[Q('circle',.50,.29,0,.60,P),Q('semi',.28,.56,-PI/2,.48,K),Q('semi',.39,.58,-PI/2,.48,K),Q('semi',.50,.60,PI,.48,K),Q('semi',.61,.58,PI/2,.48,K),Q('semi',.72,.56,PI/2,.48,K)];break;
case'butterfly':a=[Q('rect',.50,.43,PI/2,.44,N),Q('semi',.34,.31,-PI/2,.64,K),Q('semi',.66,.31,PI/2,.64,K),Q('semi',.34,.55,-PI/2,.61,P),Q('semi',.66,.55,PI/2,.61,P),Q('circle',.50,.19,0,.30,Y)];break;
case'bee':a=[Q('circle',.42,.29,0,.42,N),Q('rect',.56,.44,0,.67,Y),Q('semi',.39,.43,-PI/2,.50,C),Q('semi',.71,.43,PI/2,.50,C),Q('semi',.56,.49,PI,.54,N),Q('tri',.76,.44,PI/2,.30,Y)];break;
case'snail':a=[Q('circle',.38,.42,0,.66,O),Q('semi',.55,.51,PI,.76,Y),Q('rect',.68,.51,0,.55,Y),Q('circle',.77,.43,0,.34,G),Q('rect',.77,.29,PI/2,.29,N),Q('circle',.77,.18,0,.24,N)];break;
case'turtle':a=[Q('semi',.46,.43,0,.84,G),Q('circle',.66,.45,0,.38,Y),Q('rect',.34,.62,.45,.36,N),Q('rect',.56,.62,-.45,.36,N),Q('tri',.23,.43,-PI/2,.34,G),Q('tri',.47,.26,0,.30,G)];break;
case'camel':a=[Q('semi',.45,.49,PI,.82,O),Q('tri',.36,.34,0,.40,O),Q('tri',.53,.34,0,.40,O),Q('circle',.69,.31,0,.38,O),Q('rect',.39,.69,PI/2,.38,N),Q('rect',.55,.69,PI/2,.38,N)];break;
case'bus':a=[Q('rect',.45,.43,0,.75,R),Q('square',.64,.37,0,.50,B),Q('rect',.31,.43,0,.44,R),Q('circle',.31,.64,0,.36,N),Q('circle',.54,.64,0,.36,N),Q('circle',.73,.64,0,.36,N)];break;
case'truck':a=[Q('rect',.36,.45,0,.72,R),Q('square',.57,.39,0,.52,B),Q('tri',.74,.40,PI/2,.42,Y),Q('circle',.31,.65,0,.36,N),Q('circle',.55,.65,0,.36,N),Q('circle',.74,.65,0,.36,N)];break;
case'train':a=[Q('rect',.34,.45,0,.66,R),Q('square',.54,.37,0,.50,B),Q('square',.73,.37,0,.50,Y),Q('circle',.28,.65,0,.35,N),Q('circle',.49,.65,0,.35,N),Q('circle',.70,.65,0,.35,N)];break;
case'airplane':a=[Q('rect',.50,.42,0,.70,B),Q('tri',.75,.42,PI/2,.46,Y),Q('tri',.38,.25,0,.42,R),Q('tri',.38,.59,PI,.42,R),Q('circle',.54,.42,0,.30,C),Q('tri',.23,.42,-PI/2,.34,G)];break;
case'helicopter':a=[Q('semi',.46,.46,PI,.78,R),Q('semi',.32,.41,-PI/2,.48,B),Q('rect',.48,.20,0,.78,Y),Q('rect',.48,.65,0,.58,N),Q('para',.69,.45,.22,.47,G),Q('circle',.80,.45,0,.28,Y)];break;
case'sailboat':a=[Q('semi',.48,.62,PI,.88,R),Q('rect',.48,.41,PI/2,.39,N),Q('tri',.36,.31,0,.50,Y),Q('tri',.60,.33,0,.50,B),Q('circle',.57,.60,0,.25,C),Q('tri',.71,.59,PI/2,.30,G)];break;
case'ship':a=[Q('semi',.47,.62,PI,.90,R),Q('rect',.47,.39,PI/2,.39,N),Q('tri',.36,.29,0,.48,Y),Q('tri',.58,.29,0,.48,B),Q('tri',.47,.17,PI/2,.28,G),Q('rect',.47,.69,0,.65,N)];break;
case'bridge':a=[Q('rect',.50,.33,0,.88,R),Q('arch',.25,.53,0,.48,B),Q('arch',.42,.53,0,.48,B),Q('arch',.58,.53,0,.48,B),Q('arch',.75,.53,0,.48,B),Q('rect',.50,.67,0,.70,N)];break;
case'lighthouse':a=[Q('tri',.50,.11,0,.48,R),Q('rect',.50,.31,PI/2,.45,B),Q('rect',.50,.50,PI/2,.53,R),Q('circle',.50,.23,0,.30,Y),Q('semi',.39,.69,PI,.48,C),Q('semi',.61,.69,PI,.48,C)];break;
case'castle':a=[Q('square',.50,.48,0,.62,Y),Q('rect',.30,.48,PI/2,.52,R),Q('rect',.70,.48,PI/2,.52,R),Q('tri',.30,.21,0,.42,P),Q('tri',.70,.21,0,.42,P),Q('rect',.50,.68,PI/2,.36,N)];break;
case'windmill':a=[Q('square',.50,.58,0,.50,N),Q('tri',.50,.33,0,.40,R),Q('rect',.43,.22,.78,.50,Y),Q('rect',.57,.22,-.78,.50,B),Q('rect',.43,.31,2.35,.50,G),Q('rect',.57,.31,-2.35,.50,K)];break;
case'house':a=[Q('tri',.50,.18,0,.62,R),Q('square',.41,.45,0,.52,Y),Q('square',.59,.45,0,.52,Y),Q('rect',.41,.67,PI/2,.36,B),Q('rect',.59,.67,PI/2,.36,B),Q('rect',.50,.51,PI/2,.32,N)];break;
case'appletree':a=[Q('circle',.35,.29,0,.48,G),Q('circle',.50,.23,0,.48,G),Q('circle',.65,.29,0,.48,G),Q('circle',.50,.36,0,.48,G),Q('rect',.50,.61,PI/2,.42,N),Q('semi',.50,.70,PI,.50,G)];break;
case'hotair':a=[Q('circle',.50,.24,0,.64,K),Q('semi',.50,.39,0,.58,Y),Q('rect',.42,.51,PI/2,.30,N),Q('rect',.58,.51,PI/2,.30,N),Q('square',.50,.66,0,.38,O),Q('rect',.50,.57,0,.42,N)];break;
case'rocket':a=[Q('tri',.50,.12,0,.50,R),Q('rect',.50,.32,PI/2,.54,B),Q('circle',.50,.36,0,.28,Y),Q('tri',.36,.58,-PI/2,.38,G),Q('tri',.64,.58,PI/2,.38,G),Q('semi',.50,.70,PI,.38,O)];break;
case'tractor':a=[Q('rect',.43,.45,0,.70,G),Q('square',.62,.36,0,.50,Y),Q('circle',.32,.65,0,.42,N),Q('circle',.62,.59,0,.32,N),Q('rect',.24,.30,PI/2,.30,N),Q('rect',.50,.25,0,.38,B)];break;
case'submarine':a=[Q('rect',.49,.45,0,.70,O),Q('semi',.28,.45,-PI/2,.52,Y),Q('tri',.74,.45,PI/2,.40,B),Q('circle',.38,.45,0,.28,C),Q('circle',.52,.45,0,.28,C),Q('rect',.56,.23,PI/2,.32,N)];break;
case'robot':a=[Q('square',.50,.29,0,.54,B),Q('rect',.50,.48,PI/2,.52,R),Q('rect',.32,.48,0,.40,Y),Q('rect',.68,.48,0,.40,Y),Q('rect',.41,.68,PI/2,.36,N),Q('rect',.59,.68,PI/2,.36,N)];break;
default:a=[Q('circle',.50,.27,0,.50,Y),Q('square',.50,.44,0,.56,R),Q('rect',.35,.61,0,.40,B),Q('rect',.65,.61,0,.40,B),Q('tri',.50,.67,0,.36,G),Q('diamond',.50,.35,0,.30,P)];
}return v?mirror(a):a}
var specs=[
['فيل قوي','elephant'],['فيل الغابة','elephant'],['زرافة طويلة','giraffe'],['زرافة مرحة','giraffe'],['حصان سريع','horse'],['حصان المزرعة','horse'],['كلب لطيف','dog'],['كلب مرح','dog'],['قطة صغيرة','cat'],['قطة تلعب','cat'],['أرنب صغير','rabbit'],['أرنب الحديقة','rabbit'],['بطة جميلة','duck'],['بطة البحيرة','duck'],['بومة','owl'],['بومة لطيفة','owl'],['طاووس','peacock'],['طاووس ملون','peacock'],['سمكة متوسطة','fish'],['سمكة الزعانف','fish'],['حوت البحر','whale'],['حوت لطيف','whale'],['أخطبوط','octopus'],['أخطبوط مرح','octopus'],['فراشة جميلة','butterfly'],['فراشة الحديقة','butterfly'],['نحلة صغيرة','bee'],['نحلة الزهور','bee'],['حلزون','snail'],['حلزون لطيف','snail'],['سلحفاة','turtle'],['سلحفاة هادئة','turtle'],['جمل','camel'],['جمل الصحراء','camel'],['حافلة','bus'],['حافلة المدرسة','bus'],['شاحنة','truck'],['شاحنة نقل','truck'],['قطار','train'],['قطار المحطة','train'],['طائرة','airplane'],['طائرة سفر','airplane'],['مروحية','helicopter'],['مروحية الإنقاذ','helicopter'],['قارب شراعي','sailboat'],['قارب صغير','sailboat'],['سفينة','ship'],['سفينة شراعية','ship'],['جسر','bridge'],['جسر الأقواس','bridge'],['منارة','lighthouse'],['منارة الساحل','lighthouse'],['قلعة','castle'],['قلعة الأبراج','castle'],['طاحونة','windmill'],['طاحونة هواء','windmill'],['بيت واسع','house'],['بيت المدخنة','house'],['شجرة تفاح','appletree'],['شجرة مثمرة','appletree'],['منطاد','hotair'],['منطاد ملون','hotair'],['صاروخ','rocket'],['صاروخ الفضاء','rocket'],['جرار','tractor'],['جرار المزرعة','tractor'],['غواصة','submarine'],['غواصة البحر','submarine'],['روبوت','robot'],['روبوت مرح','robot']
];
var out=[],i,s;for(i=0;i<specs.length;i++){s=specs[i];out.push(O1(s[0],F(s[1],i%2),1))}puzzles[1]=out;
})();
