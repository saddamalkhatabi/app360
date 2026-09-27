'use strict';
(function(){
var PI=Math.PI;
function P(t,x,y,r){return [t,x,y,r||0]}
function O(name,pieces,scale){return {name:name,pieces:pieces,pieceScale:scale||1}}
function V(ps,v){
 if(!v)return ps;
 var out=[],i,a,dx=(v%2?0.012:-0.012);
 for(i=0;i<ps.length;i++){a=ps[i];out.push([a[0],Math.max(.18,Math.min(.82,a[1]+dx)),a[2],a[3]||0])}
 return out;
}
var L1=[
 O('بيت صغير',[P('tri',.50,.30,0),P('square',.50,.46,0),P('rect',.50,.60,PI/2)],1.00),
 O('شجرة جميلة',[P('semi',.50,.34,0),P('semi',.50,.44,0),P('rect',.50,.58,PI/2)],.98),
 O('سمكة صغيرة',[P('circle',.48,.42,0),P('tri',.59,.42,PI/2),P('leaf',.47,.51,.10)],.94),
 O('زهرة لطيفة',[P('circle',.50,.34,0),P('rect',.50,.49,PI/2),P('leaf',.56,.51,-.45)],.94),
 O('سيارة صغيرة',[P('rect',.50,.43,0),P('circle',.44,.54,0),P('circle',.56,.54,0)],.92),
 O('قارب صغير',[P('semi',.50,.52,PI),P('tri',.47,.37,0),P('rect',.50,.42,PI/2)],.95),
 O('صاروخ صغير',[P('tri',.50,.29,0),P('rect',.50,.44,PI/2),P('semi',.50,.58,PI)],.94),
 O('فطر لطيف',[P('semi',.50,.36,0),P('rect',.50,.49,PI/2),P('trap',.50,.59,0)],.94),
 O('طائر صغير',[P('circle',.48,.42,0),P('tri',.59,.40,PI/2),P('leaf',.45,.46,.20)],.92),
 O('فراشة صغيرة',[P('semi',.44,.42,-PI/2),P('rect',.50,.42,PI/2),P('semi',.56,.42,PI/2)],.93),
 O('مثلجات',[P('circle',.50,.34,0),P('semi',.50,.42,0),P('tri',.50,.56,PI)],.92),
 O('بالون',[P('circle',.50,.34,0),P('tri',.50,.46,PI),P('rect',.50,.57,PI/2)],.90),
 O('تفاحة',[P('circle',.50,.43,0),P('rect',.50,.31,PI/2),P('leaf',.56,.32,-.45)],.94),
 O('سلحفاة صغيرة',[P('semi',.48,.43,0),P('circle',.59,.44,0),P('rect',.48,.54,0)],.92),
 O('فنجان',[P('semi',.48,.44,PI),P('arc',.58,.43,-PI/2),P('rect',.49,.54,0)],.90),
 O('شمس فوق جبل',[P('circle',.50,.34,0),P('tri',.45,.51,0),P('tri',.55,.51,0)],.91),
 O('مظلة',[P('semi',.50,.35,0),P('rect',.50,.49,PI/2),P('arc',.51,.59,PI/2)],.91),
 O('كمثرى',[P('circle',.50,.45,0),P('semi',.50,.36,0),P('rect',.52,.28,PI/2)],.91),
 O('كرزتان',[P('circle',.46,.47,0),P('circle',.54,.47,0),P('arc',.50,.34,PI)],.88),
 O('جزرة',[P('tri',.50,.47,PI),P('leaf',.46,.32,-.35),P('leaf',.54,.32,.35)],.90),
 O('شمعة',[P('rect',.50,.45,PI/2),P('drop',.50,.31,0),P('rect',.50,.58,0)],.91),
 O('جرس',[P('semi',.50,.42,0),P('circle',.50,.52,0),P('arc',.50,.31,-PI/4)],.90),
 O('طائرة ورقية',[P('diamond',.50,.38,0),P('rect',.50,.52,PI/2),P('tri',.50,.62,PI)],.90),
 O('ورقة شجر',[P('leaf',.48,.42,-.25),P('rect',.50,.54,PI/2),P('leaf',.56,.45,.55)],.89),
 O('بطة',[P('circle',.56,.37,0),P('semi',.49,.48,PI),P('tri',.65,.37,PI/2)],.91),
 O('هدية',[P('square',.50,.46,0),P('rect',.50,.46,PI/2),P('diamond',.50,.32,0)],.91),
 O('روبوت صغير',[P('circle',.50,.33,0),P('square',.50,.48,0),P('rect',.50,.61,0)],.92),
 O('قطار صغير',[P('rect',.48,.45,0),P('square',.59,.41,0),P('circle',.53,.56,0)],.90),
 O('كاميرا',[P('rect',.50,.44,0),P('circle',.50,.44,0),P('square',.59,.32,0)],.91),
 O('تاج',[P('tri',.44,.46,0),P('tri',.50,.38,0),P('tri',.56,.46,0)],.89),
 O('دعسوقة',[P('circle',.50,.44,0),P('semi',.47,.44,-PI/2),P('semi',.53,.44,PI/2)],.89),
 O('حلزون',[P('circle',.47,.42,0),P('semi',.53,.50,PI),P('circle',.62,.46,0)],.89),
 O('وجه قطة',[P('circle',.50,.44,0),P('tri',.45,.33,-.20),P('tri',.55,.33,.20)],.89),
 O('وجه أرنب',[P('circle',.50,.45,0),P('leaf',.46,.31,PI/2),P('leaf',.54,.31,PI/2)],.88),
 O('كتكوت',[P('circle',.50,.44,0),P('tri',.60,.43,PI/2),P('semi',.46,.48,PI)],.90),
 O('شريحة بطيخ',[P('semi',.50,.45,0),P('arch',.50,.47,0),P('drop',.50,.39,PI)],.87),
 O('مصاصة',[P('circle',.50,.36,0),P('rect',.50,.52,PI/2),P('diamond',.50,.47,0)],.88),
 O('طبلة',[P('rect',.50,.45,0),P('tri',.45,.45,PI/2),P('tri',.55,.45,-PI/2)],.88),
 O('مفتاح',[P('circle',.45,.43,0),P('rect',.55,.43,0),P('tri',.63,.47,PI)],.87),
 O('علم',[P('rect',.46,.47,PI/2),P('tri',.55,.37,PI/2),P('square',.46,.61,0)],.88),
 O('قبعة',[P('semi',.50,.40,0),P('rect',.50,.52,0),P('circle',.50,.30,0)],.89),
 O('كتاب مفتوح',[P('slope',.46,.44,-.05),P('slope',.54,.44,PI+.05),P('rect',.50,.44,PI/2)],.87),
 O('جورب',[P('rect',.50,.38,PI/2),P('arc',.53,.50,0),P('square',.50,.27,0)],.87),
 O('إبريق',[P('semi',.50,.46,PI),P('arc',.59,.44,-PI/2),P('tri',.40,.43,-PI/2)],.88),
 O('كوب بعصا',[P('trap',.50,.47,0),P('rect',.55,.33,PI/2),P('circle',.45,.34,0)],.88),
 O('فانوس',[P('circle',.50,.44,0),P('arch',.50,.31,0),P('rect',.50,.57,0)],.88),
 O('قلم رصاص',[P('rect',.50,.43,PI/2),P('tri',.50,.29,0),P('semi',.50,.58,PI)],.88),
 O('قارب بعلم',[P('semi',.50,.51,PI),P('rect',.50,.39,PI/2),P('tri',.57,.31,PI/2)],.89),
 O('سحابة',[P('circle',.44,.44,0),P('circle',.50,.40,0),P('circle',.56,.44,0)],.86),
 O('قمر ونجمتان',[P('crescent',.47,.43,0),P('star',.58,.37,0),P('star',.59,.49,0)],.86),
 O('قنفذ',[P('semi',.50,.48,PI),P('tri',.45,.37,0),P('tri',.55,.37,0)],.88),
 O('زهرة توليب',[P('semi',.50,.35,0),P('rect',.50,.49,PI/2),P('leaf',.56,.51,-.45)],.89),
 O('جسر صغير',[P('rect',.50,.37,0),P('arch',.45,.50,0),P('arch',.55,.50,0)],.85),
 O('منارة',[P('tri',.50,.30,0),P('rect',.50,.46,PI/2),P('semi',.50,.60,PI)],.90),
 O('خيمة',[P('slope',.46,.45,.06),P('slope',.54,.45,PI-.06),P('rect',.50,.49,PI/2)],.87),
 O('ساعة',[P('circle',.50,.44,0),P('rect',.50,.44,PI/2),P('rect',.53,.44,.65)],.87),
 O('زهرة في أصيص',[P('circle',.50,.33,0),P('rect',.50,.47,PI/2),P('trap',.50,.59,0)],.89),
 O('مثلجات بالعصا',[P('rect',.50,.42,PI/2),P('semi',.50,.31,0),P('rect',.50,.59,PI/2)],.88),
 O('حوت صغير',[P('semi',.50,.46,PI),P('tri',.39,.44,-PI/2),P('arc',.57,.32,-PI/2)],.88),
 O('غواصة صغيرة',[P('rect',.50,.44,0),P('semi',.40,.44,-PI/2),P('tri',.61,.44,PI/2)],.88)
];
function M(kind,v){var a;switch(kind){
case'elephant':a=[P('semi',.48,.45,PI),P('circle',.59,.37,0),P('arc',.67,.42,-PI/2),P('rect',.45,.58,PI/2),P('rect',.55,.58,PI/2)];break;
case'giraffe':a=[P('circle',.57,.31,0),P('rect',.55,.41,PI/2),P('semi',.49,.51,PI),P('rect',.45,.62,PI/2),P('rect',.55,.62,PI/2)];break;
case'horse':a=[P('circle',.59,.36,0),P('rect',.55,.44,-.35),P('semi',.48,.50,PI),P('rect',.45,.61,PI/2),P('arc',.37,.47,PI)];break;
case'dog':a=[P('circle',.50,.36,0),P('semi',.43,.34,-PI/2),P('semi',.57,.34,PI/2),P('semi',.50,.51,PI),P('arc',.62,.49,-PI/2)];break;
case'cat':a=[P('circle',.50,.37,0),P('tri',.45,.29,-.25),P('tri',.55,.29,.25),P('semi',.50,.51,PI),P('arc',.62,.48,-PI/2)];break;
case'bus':a=[P('rect',.50,.45,0),P('square',.59,.40,0),P('circle',.44,.56,0),P('circle',.56,.56,0),P('rect',.49,.34,0)];break;
case'helicopter':a=[P('semi',.50,.45,PI),P('semi',.42,.43,-PI/2),P('rect',.50,.31,0),P('rect',.50,.56,0),P('para',.61,.44,.15)];break;
case'airplane':a=[P('rect',.50,.44,0),P('tri',.62,.44,PI/2),P('tri',.46,.35,0),P('tri',.46,.53,PI),P('semi',.40,.44,-PI/2)];break;
case'train':a=[P('rect',.48,.45,0),P('square',.59,.40,0),P('circle',.44,.57,0),P('circle',.56,.57,0),P('rect',.59,.31,PI/2)];break;
case'castle':a=[P('square',.50,.48,0),P('rect',.42,.47,PI/2),P('rect',.58,.47,PI/2),P('tri',.42,.34,0),P('tri',.58,.34,0)];break;
case'windmill':a=[P('square',.50,.52,0),P('rect',.50,.37,.78),P('rect',.50,.37,-.78),P('rect',.50,.37,2.35),P('rect',.50,.37,-2.35)];break;
case'sailboat':a=[P('semi',.50,.54,PI),P('rect',.50,.43,PI/2),P('tri',.46,.37,0),P('tri',.54,.37,0),P('circle',.50,.54,0)];break;
case'peacock':a=[P('circle',.50,.45,0),P('circle',.50,.35,0),P('semi',.43,.43,-PI/2),P('semi',.57,.43,PI/2),P('rect',.50,.57,PI/2)];break;
case'rooster':a=[P('circle',.53,.43,0),P('circle',.58,.34,0),P('tri',.66,.34,PI/2),P('semi',.45,.44,-PI/2),P('rect',.52,.57,PI/2)];break;
case'bunny':a=[P('circle',.50,.40,0),P('leaf',.46,.30,PI/2),P('leaf',.54,.30,PI/2),P('semi',.50,.52,PI),P('circle',.61,.50,0)];break;
case'turtle':a=[P('semi',.49,.44,0),P('circle',.60,.45,0),P('rect',.44,.56,.45),P('rect',.54,.56,-.45),P('tri',.39,.45,-PI/2)];break;
case'fish':a=[P('circle',.45,.44,0),P('diamond',.53,.44,0),P('tri',.63,.44,PI/2),P('tri',.52,.35,0),P('tri',.52,.53,PI)];break;
case'flowerpot':a=[P('circle',.50,.34,0),P('semi',.44,.38,-PI/2),P('semi',.56,.38,PI/2),P('rect',.50,.49,PI/2),P('trap',.50,.59,0)];break;
case'house':a=[P('tri',.50,.32,0),P('square',.50,.47,0),P('rect',.46,.59,PI/2),P('square',.56,.45,0),P('rect',.58,.31,PI/2)];break;
case'appletree':a=[P('circle',.45,.37,0),P('circle',.55,.37,0),P('circle',.50,.43,0),P('rect',.50,.57,PI/2),P('circle',.57,.43,0)];break;
case'camel':a=[P('semi',.49,.49,PI),P('tri',.45,.39,0),P('tri',.53,.39,0),P('circle',.61,.38,0),P('rect',.58,.46,-.35)];break;
case'whale':a=[P('semi',.50,.47,PI),P('circle',.57,.43,0),P('tri',.39,.45,-PI/2),P('semi',.48,.56,PI),P('arc',.59,.34,-PI/2)];break;
case'octopus':a=[P('circle',.50,.36,0),P('arc',.43,.50,PI),P('arc',.48,.52,PI),P('arc',.52,.52,-PI/2),P('arc',.57,.50,-PI/2)];break;
case'crab':a=[P('semi',.50,.45,0),P('semi',.40,.38,-PI/2),P('semi',.60,.38,PI/2),P('rect',.45,.56,.55),P('rect',.55,.56,-.55)];break;
case'butterfly':a=[P('rect',.50,.44,PI/2),P('semi',.43,.38,-PI/2),P('semi',.57,.38,PI/2),P('semi',.43,.50,-PI/2),P('semi',.57,.50,PI/2)];break;
case'dragonfly':a=[P('rect',.50,.44,PI/2),P('leaf',.43,.38,-.35),P('leaf',.57,.38,.35),P('leaf',.43,.50,.35),P('leaf',.57,.50,-.35)];break;
case'bee':a=[P('circle',.45,.38,0),P('semi',.52,.46,PI),P('semi',.43,.49,-PI/2),P('semi',.59,.45,PI/2),P('rect',.53,.46,0)];break;
case'snail':a=[P('circle',.47,.42,0),P('semi',.52,.51,PI),P('circle',.61,.47,0),P('rect',.60,.36,PI/2),P('circle',.63,.30,0)];break;
case'hotair':a=[P('circle',.50,.35,0),P('semi',.50,.43,0),P('rect',.46,.51,PI/2),P('rect',.54,.51,PI/2),P('square',.50,.59,0)];break;
case'rocket':a=[P('tri',.50,.29,0),P('rect',.50,.44,PI/2),P('circle',.50,.44,0),P('tri',.43,.56,-PI/2),P('tri',.57,.56,PI/2)];break;
case'truck':a=[P('rect',.47,.45,0),P('square',.59,.42,0),P('circle',.43,.57,0),P('circle',.56,.57,0),P('tri',.65,.44,PI/2)];break;
case'tractor':a=[P('rect',.48,.45,0),P('square',.58,.40,0),P('circle',.44,.57,0),P('circle',.57,.55,0),P('rect',.40,.37,PI/2)];break;
case'submarine':a=[P('rect',.50,.45,0),P('semi',.40,.45,-PI/2),P('tri',.61,.45,PI/2),P('circle',.50,.45,0),P('rect',.54,.34,PI/2)];break;
case'lighthouse':a=[P('tri',.50,.30,0),P('rect',.50,.45,PI/2),P('circle',.50,.36,0),P('semi',.50,.59,PI),P('rect',.50,.53,PI/2)];break;
case'bridge':a=[P('rect',.50,.37,0),P('arch',.43,.50,0),P('arch',.50,.50,0),P('arch',.57,.50,0),P('rect',.50,.59,0)];break;
default:a=[P('circle',.50,.35,0),P('square',.50,.46,0),P('rect',.44,.58,PI/2),P('rect',.56,.58,PI/2),P('tri',.50,.28,0)]}
return V(a,v)}
var mediumKinds=['elephant','giraffe','horse','dog','cat','bus','helicopter','airplane','train','castle','windmill','sailboat','peacock','rooster','bunny','turtle','fish','flowerpot','house','appletree','camel','whale','octopus','crab','butterfly','dragonfly','bee','snail','hotair','rocket','truck','tractor','submarine','lighthouse','bridge'];
var mediumNames1=['فيل','زرافة','حصان','كلب','قطة','حافلة','مروحية','طائرة','قطار','قلعة','طاحونة هواء','قارب شراعي','طاووس','ديك','أرنب','سلحفاة','سمكة','زهرة متوسطة في أصيص','بيت بمدخنة','شجرة تفاح','جمل','حوت','أخطبوط','سلطعون','فراشة','يعسوب','نحلة','حلزون متوسط','منطاد','صاروخ','شاحنة','جرار','غواصة','منارة متوسطة','جسر'];
var mediumNames2=['فيل صغير','زرافة تمشي','حصان مرح','كلب يلعب','قطة تمشي','حافلة المدرسة','مروحية إنقاذ','طائرة سفر','قطار سريع','قلعة صغيرة','طاحونة المزرعة','قارب في البحر','طاووس جميل','ديك المزرعة','أرنب يقفز','سلحفاة تمشي','سمكة كبيرة','زهرة كبيرة','بيت وحديقة','شجرة مثمرة','جمل الصحراء','حوت في البحر','أخطبوط مرح','سلطعون البحر','فراشة جميلة','يعسوب طائر','نحلة صغيرة','حلزون الحديقة','منطاد ملون','صاروخ فضائي','شاحنة كبيرة','جرار المزرعة','غواصة بحرية','منارة البحر','جسر حجري'];
function A(kind,v){var a;switch(kind){
case'lion':a=[P('circle',.50,.36,0),P('tri',.44,.28,-.25),P('tri',.56,.28,.25),P('semi',.50,.49,PI),P('rect',.45,.60,PI/2),P('rect',.55,.60,PI/2),P('arc',.63,.49,-PI/2)];break;
case'monkey':a=[P('circle',.50,.35,0),P('circle',.43,.36,0),P('circle',.57,.36,0),P('square',.50,.49,0),P('arc',.42,.50,PI),P('arc',.58,.50,-PI/2),P('arc',.63,.47,-PI/2)];break;
case'bear':a=[P('circle',.50,.36,0),P('circle',.44,.30,0),P('circle',.56,.30,0),P('square',.50,.49,0),P('semi',.44,.58,PI),P('semi',.56,.58,PI),P('circle',.50,.38,0)];break;
case'fox':a=[P('circle',.50,.36,0),P('tri',.44,.28,-.25),P('tri',.56,.28,.25),P('semi',.50,.49,PI),P('rect',.44,.59,PI/2),P('rect',.56,.59,PI/2),P('crescent',.64,.49,0)];break;
case'owl':a=[P('circle',.46,.37,0),P('circle',.54,.37,0),P('semi',.50,.49,PI),P('semi',.42,.49,-PI/2),P('semi',.58,.49,PI/2),P('tri',.50,.43,PI),P('rect',.50,.60,0)];break;
case'dolphin':a=[P('semi',.50,.45,PI),P('circle',.56,.41,0),P('tri',.40,.45,-PI/2),P('tri',.58,.34,0),P('semi',.49,.54,PI),P('arc',.62,.42,-PI/2),P('circle',.59,.39,0)];break;
case'swan':a=[P('semi',.49,.51,PI),P('arc',.57,.39,PI),P('circle',.59,.33,0),P('tri',.67,.33,PI/2),P('leaf',.44,.47,.20),P('rect',.45,.60,0),P('rect',.55,.60,0)];break;
case'carriage':a=[P('semi',.50,.40,0),P('rect',.50,.49,0),P('circle',.43,.58,0),P('circle',.57,.58,0),P('square',.46,.47,0),P('square',.54,.47,0),P('star',.50,.31,0)];break;
case'palace':a=[P('square',.50,.48,0),P('rect',.40,.49,PI/2),P('rect',.60,.49,PI/2),P('tri',.40,.35,0),P('tri',.60,.35,0),P('semi',.50,.34,0),P('arch',.50,.59,0)];break;
case'penguin':a=[P('semi',.50,.48,PI),P('circle',.50,.36,0),P('semi',.43,.48,-PI/2),P('semi',.57,.48,PI/2),P('tri',.50,.40,PI),P('semi',.45,.59,PI),P('semi',.55,.59,PI)];break;
case'deer':a=[P('circle',.56,.36,0),P('rect',.51,.45,-.35),P('semi',.47,.50,PI),P('rect',.44,.60,PI/2),P('rect',.54,.60,PI/2),P('arc',.53,.28,PI),P('arc',.61,.28,-PI/2)];break;
case'frog':a=[P('semi',.50,.47,PI),P('circle',.45,.36,0),P('circle',.55,.36,0),P('semi',.41,.53,PI),P('semi',.59,.53,PI),P('leaf',.42,.56,.15),P('leaf',.58,.56,-.15)];break;
case'scooter':a=[P('circle',.43,.57,0),P('circle',.58,.57,0),P('rect',.50,.51,0),P('slope',.55,.43,-.25),P('rect',.60,.34,PI/2),P('rect',.60,.27,0),P('semi',.45,.45,PI)];break;
case'bicycle':a=[P('circle',.43,.55,0),P('circle',.57,.55,0),P('rect',.50,.50,.55),P('rect',.50,.50,-.55),P('rect',.50,.42,0),P('rect',.58,.39,.25),P('rect',.44,.39,-.25)];break;
case'trophy':a=[P('semi',.50,.39,PI),P('arc',.42,.40,PI),P('arc',.58,.40,-PI/2),P('rect',.50,.51,PI/2),P('rect',.50,.58,0),P('star',.50,.38,0),P('trap',.50,.64,0)];break;
case'personkite':a=[P('circle',.45,.39,0),P('square',.45,.49,0),P('rect',.41,.59,.55),P('rect',.49,.59,-.55),P('arc',.54,.47,-PI/2),P('diamond',.62,.34,0),P('rect',.58,.43,.55)];break;
case'teacup':a=[P('semi',.46,.47,PI),P('arc',.55,.46,-PI/2),P('rect',.46,.57,0),P('drop',.39,.34,0),P('drop',.47,.32,0),P('drop',.55,.34,0),P('rect',.50,.61,0)];break;
case'clock':a=[P('circle',.50,.45,0),P('rect',.50,.45,PI/2),P('rect',.54,.45,.65),P('circle',.50,.32,0),P('circle',.50,.58,0),P('circle',.39,.45,0),P('circle',.61,.45,0)];break;
case'bouquet':a=[P('circle',.44,.36,0),P('circle',.50,.32,0),P('circle',.56,.36,0),P('rect',.46,.49,PI/2),P('rect',.54,.49,PI/2),P('trap',.50,.60,0),P('diamond',.50,.54,0)];break;
case'sun':a=[P('circle',.50,.44,0),P('tri',.50,.30,0),P('tri',.50,.58,PI),P('tri',.38,.44,-PI/2),P('tri',.62,.44,PI/2),P('tri',.42,.34,-.75),P('tri',.58,.34,.75)];break;
case'zebra':a=[P('circle',.58,.36,0),P('semi',.50,.49,PI),P('rect',.44,.60,PI/2),P('rect',.56,.60,PI/2),P('tri',.62,.29,.20),P('rect',.50,.49,PI/2),P('arc',.39,.48,PI)];break;
case'kangaroo':a=[P('circle',.58,.35,0),P('rect',.54,.44,-.30),P('semi',.49,.51,PI),P('rect',.44,.61,PI/2),P('rect',.55,.61,PI/2),P('crescent',.38,.49,PI),P('circle',.50,.48,0)];break;
case'panda':a=[P('circle',.50,.36,0),P('circle',.44,.30,0),P('circle',.56,.30,0),P('square',.50,.50,0),P('semi',.44,.59,PI),P('semi',.56,.59,PI),P('leaf',.61,.48,-.45)];break;
case'koala':a=[P('circle',.50,.36,0),P('circle',.43,.34,0),P('circle',.57,.34,0),P('semi',.50,.51,PI),P('rect',.58,.50,PI/2),P('leaf',.63,.43,-.40),P('leaf',.62,.55,.40)];break;
case'chicken':a=[P('circle',.55,.37,0),P('semi',.50,.49,PI),P('tri',.65,.37,PI/2),P('semi',.42,.48,-PI/2),P('rect',.48,.59,PI/2),P('rect',.56,.59,PI/2),P('drop',.55,.28,0)];break;
case'racecar':a=[P('rect',.50,.48,0),P('slope',.48,.40,0),P('circle',.43,.57,0),P('circle',.57,.57,0),P('semi',.37,.48,-PI/2),P('rect',.63,.43,PI/2),P('star',.50,.48,0)];break;
case'treehouse':a=[P('rect',.50,.55,PI/2),P('circle',.45,.38,0),P('circle',.55,.38,0),P('square',.50,.45,0),P('tri',.50,.34,0),P('rect',.58,.56,PI/2),P('rect',.62,.56,PI/2)];break;
case'bridge':a=[P('rect',.50,.36,0),P('arch',.38,.50,0),P('arch',.50,.50,0),P('arch',.62,.50,0),P('rect',.38,.59,0),P('rect',.50,.59,0),P('rect',.62,.59,0)];break;
case'robot':a=[P('circle',.50,.32,0),P('square',.50,.46,0),P('rect',.39,.46,0),P('rect',.61,.46,0),P('rect',.45,.59,PI/2),P('rect',.55,.59,PI/2),P('circle',.50,.46,0)];break;
case'fruitbasket':a=[P('semi',.50,.53,PI),P('arch',.50,.40,0),P('circle',.43,.43,0),P('circle',.50,.40,0),P('circle',.57,.43,0),P('leaf',.45,.34,-.45),P('leaf',.55,.34,.45)];break;
case'cake':a=[P('rect',.50,.52,0),P('rect',.50,.43,0),P('semi',.45,.36,0),P('semi',.55,.36,0),P('rect',.43,.29,PI/2),P('rect',.50,.28,PI/2),P('rect',.57,.29,PI/2)];break;
case'gifttrain':a=[P('rect',.45,.49,0),P('square',.56,.45,0),P('circle',.42,.58,0),P('circle',.55,.58,0),P('square',.63,.46,0),P('diamond',.63,.35,0),P('rect',.50,.36,PI/2)];break;
case'dragon':a=[P('circle',.58,.36,0),P('semi',.50,.50,PI),P('tri',.65,.35,PI/2),P('tri',.45,.38,-.70),P('tri',.45,.51,-2.2),P('rect',.50,.60,PI/2),P('crescent',.38,.49,PI)];break;
case'unicorn':a=[P('circle',.56,.36,0),P('semi',.50,.50,PI),P('tri',.60,.27,.20),P('leaf',.50,.32,-.50),P('rect',.45,.60,PI/2),P('rect',.55,.60,PI/2),P('crescent',.39,.49,PI)];break;
case'dinosaur':a=[P('circle',.60,.36,0),P('rect',.55,.43,-.35),P('semi',.49,.50,PI),P('tri',.40,.48,-PI/2),P('rect',.45,.60,PI/2),P('rect',.55,.60,PI/2),P('tri',.62,.28,.15)];break;
default:a=[P('circle',.50,.35,0),P('square',.50,.47,0),P('rect',.40,.49,0),P('rect',.60,.49,0),P('rect',.45,.60,PI/2),P('rect',.55,.60,PI/2),P('star',.50,.25,0)]}
return V(a,v)}
var advKinds=['lion','monkey','bear','fox','owl','dolphin','swan','carriage','palace','penguin','deer','frog','scooter','bicycle','trophy','personkite','teacup','clock','bouquet','sun','zebra','kangaroo','panda','koala','chicken','racecar','treehouse','bridge','robot','fruitbasket','cake','gifttrain','dragon','unicorn','dinosaur'];
var advNames1=['أسد','قرد','دب','ثعلب','بومة','دلفين','بجعة','عربة أميرة','قصر','بطريق','غزال','ضفدع','سكوتر','دراجة','كأس بطولة','طفل مع طائرة ورقية','طقم شاي','ساعة كبيرة','باقة زهور','شمس مبتسمة','حمار وحشي','كنغر','باندا','كوالا','دجاجة','سيارة سباق','بيت شجرة','جسر كبير','روبوت','سلة فاكهة','كعكة','قطار الهدايا','تنين','وحيد القرن','ديناصور'];
var advNames2=['أسد مرح','قرد يتسلق','دب صغير','ثعلب سريع','بومة على غصن','دلفين يقفز','بجعة في الماء','عربة ملكية','قصر الأبراج','بطريق صغير','غزال الغابة','ضفدع يقفز','سكوتر صغير','دراجة سريعة','كأس النجمة','طفل يطير طائرة ورقية','إبريق وفنجان','ساعة الحائط','حديقة زهور','شمس كبيرة','حمار وحشي يمشي','كنغر صغير','باندا مع خيزران','كوالا على شجرة','دجاجة المزرعة','سيارة سباق سريعة','بيت شجرة كبير','جسر فوق الماء','روبوت مرح','سلة فواكه','كعكة عيد','قطار مع هدية','تنين طائر','وحيد القرن الجميل','ديناصور طويل'];
var L2=[],L3=[],i;
for(i=0;i<mediumKinds.length;i++)L2.push(O(mediumNames1[i],M(mediumKinds[i],0),1));
for(i=0;i<mediumKinds.length;i++)L2.push(O(mediumNames2[i],M(mediumKinds[i],1),1));
for(i=0;i<advKinds.length;i++)L3.push(O(advNames1[i],A(advKinds[i],0),1));
for(i=0;i<advKinds.length;i++)L3.push(O(advNames2[i],A(advKinds[i],1),1));
puzzles=[L1,L2,L3];
})();
