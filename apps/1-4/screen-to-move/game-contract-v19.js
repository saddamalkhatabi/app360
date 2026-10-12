(function(w){'use strict';
var names={choice:'اختيار إجابة',mark:'تحديد عدة عناصر',match:'وصل الأزواج',sort:'فرز مجموعات',order:'ترتيب وتسلسل',pattern:'إكمال نمط',memory:'ذاكرة الصور',puzzle:'تركيب قطع',dots:'وصل النقاط',path:'تتبع الخطوط والمسارات',draw:'رسم حر أو إكمال شكل',create:'ابتكار لغز'};
function clone(x){return JSON.parse(JSON.stringify(x))}
function unique(a){var o={},n=0;for(var i=0;i<a.length;i++)if(!o['$'+a[i]]){o['$'+a[i]]=1;n++}return n}
function id(){return'local-'+new Date().getTime()+'-'+Math.floor(Math.random()*1000000)}
function safeImage(s){return typeof s==='string'&&(/^(?:data:image\/(?:png|jpeg|webp|gif|svg\+xml)[;,]|blob:|https?:\/\/|\.{0,2}\/|assets\/)/i.test(s))}
function validate(g){var i,pts,a,seen={};if(!g||!names[g.type])return'اختر نوع لعبة صالحًا.';if(!String(g.title||'').trim())return'أضف اسمًا للعبة.';if(g.level<1||g.level>4||Math.floor(g.level)!==g.level)return'اختر مستوى من 1 إلى 4.';if(!g.frames||g.frames.length!==5||g.frames.some(function(t){return typeof t!=='string'||!t.trim()}))return'أضف خمس خطوات واضحة.';
if(g.type==='path'||g.type==='dots'){pts=g.type==='path'?g.path:g.points;if(!pts||pts.length<3||pts.length>60)return'حدد من 3 إلى 60 نقطة للمسار.';for(i=0;i<pts.length;i++){if(!Array.isArray(pts[i])||pts[i].length!==2||!isFinite(pts[i][0])||!isFinite(pts[i][1])||pts[i][0]<0||pts[i][0]>100||pts[i][1]<0||pts[i][1]>100)return'نقاط المسار يجب أن تكون داخل اللوحة.';if(i&&pts[i][0]===pts[i-1][0]&&pts[i][1]===pts[i-1][1])return'نقطتان متتاليتان في المكان نفسه؛ حرّك إحداهما.'}}
if(g.type==='choice'||g.type==='pattern'){if(!g.options||g.options.length<2||g.answer<0||g.answer>=g.options.length||Math.floor(g.answer)!==g.answer)return'أضف خيارين على الأقل وحدد الإجابة الصحيحة.';if(g.type==='pattern'&&(!g.sequence||g.sequence.length<2))return'أضف عنصرين على الأقل إلى النمط.'}
if(g.type==='mark'){if(!g.markOptions||g.markOptions.length<2||!g.markOptions.some(function(x){return x[1]})||!g.markOptions.some(function(x){return !x[1]}))return'أضف عناصر مطلوبة وأخرى غير مطلوبة.'}
if(g.type==='match'){if(!g.pairs||g.pairs.length<1||g.pairs.some(function(p){return !p||p.length!==2||!p[0]||!p[1]}))return'أضف أزواجًا كاملة.'}
if(g.type==='sort'){if(!g.bins||g.bins.length<2||!g.items||g.items.length<2)return'أضف مجموعتين وعناصر الفرز.';for(i=0;i<g.items.length;i++){a=g.items[i];if(!a||!a[0]||!(Math.floor(a[1])===a[1])||a[1]<0||a[1]>=g.bins.length)return'حدد المجموعة المناسبة لكل عنصر.';seen[a[1]]=true}if(Object.keys(seen).length<2)return'وزّع العناصر على مجموعتين على الأقل.'}
if(g.type==='memory'&&(!g.cards||g.cards.length<2||unique(g.cards)!==g.cards.length))return'أضف صورتين مختلفتين على الأقل للذاكرة.';
if(g.type==='order'&&(!g.order||g.order.length<2||unique(g.order)!==g.order.length))return'أضف عنصرين مختلفين على الأقل إلى التسلسل.';
if(g.type==='puzzle'&&(!g.symbols||g.symbols.length<2||g.symbols.length>4||unique(g.symbols)!==g.symbols.length))return'أضف من قطعتين إلى أربع قطع مختلفة.';
if(g.type==='create'&&(!g.symbols||unique(g.symbols)<3))return'أضف ثلاث صور مختلفة على الأقل للغز.';
if(g.visuals){for(a in g.visuals)if(!safeImage(g.visuals[a].src))return'إحدى الصور غير صالحة.'}
if(g.audio&&g.audio.prompt&&!/^data:audio\/[a-z0-9.+-]+;base64,/i.test(g.audio.prompt))return'ملف صوت السؤال غير صالح.';
if(g.audio&&g.audio.promptEn&&!/^data:audio\/[a-z0-9.+-]+;base64,/i.test(g.audio.promptEn))return'ملف صوت السؤال الإنجليزي غير صالح.';
return''}
function normalize(g){g=clone(g);g.schema='app360-native-game-v1';g.id=g.id||id();g.level=Number(g.level)||1;g.topic=g.topic||names[g.type];g.icon=g.icon||'🎲';g.symbols=g.symbols||['●','▲','■'];g.materials=g.materials||['ورقة','قلم','أدوات كبيرة وآمنة مع المرافق'];g.frames=g.frames||['شاهد فكرة اللعبة','اسمع التعليمات','جرب مع المرافق','بدّل الدور','جرب الفكرة بدون الشاشة'];g.updated_at=new Date().toISOString();return g}
function template(type,level,builtins){var source=null;for(var i=0;i<builtins.length;i++)if(builtins[i].type===type){source=builtins[i];break}var g=normalize(source||{type:type,title:names[type],level:level});g.id=id();g.type=type;g.level=level||1;g.title='لعبتي: '+names[type];if(type==='draw'){g.shape='free';g.frames=['اختر فكرة للرسم','ارسم بإصبعك','أضف خطوطًا أو أشكالًا','جرّب الرسم على الورق','أنجزت المحاولة'];g.prompt='ارسم بطريقتك'}return g}
function fromDesigner(def){if(!def||!def.items)return null;var g=normalize({id:'designer-'+def.id,title:def.title,prompt:def.prompt,level:def.level,type:def.type}),items=def.items,values=[],visuals={},pairs={},i,it,k;
for(i=0;i<items.length;i++){it=items[i];k=it.type==='text'?(it.text||it.label):'image-'+it.id;if(it.type!=='text')visuals[k]={src:it.src,label:it.label||'صورة'};values.push(k)}g.visuals=visuals;g.symbols=values.slice(0,4);if(def.audio)g.audio=clone(def.audio);
if(def.type==='choice'){g.options=values;g.answer=-1;for(i=0;i<items.length;i++)if(items[i].correct){if(g.answer>=0)return null;g.answer=i}}
if(def.type==='mark')g.markOptions=items.map(function(x,j){return[values[j],!!x.correct]});
if(def.type==='match'){for(i=0;i<items.length;i++){k=String(items[i].pair||'');if(!k)return null;if(!pairs[k])pairs[k]=[];pairs[k].push(values[i])}g.pairs=[];for(k in pairs){if(pairs[k].length!==2)return null;g.pairs.push(pairs[k])}}
if(def.type==='sort'){g.bins=[def.groupA||'المجموعة الأولى',def.groupB||'المجموعة الثانية'];g.items=items.map(function(x,j){return[values[j],x.group==='B'?1:0]})}
if(def.type==='order'){var indexed=items.map(function(x,j){return{order:Number(x.order),value:values[j]}});indexed.sort(function(a,b){return a.order-b.order});for(i=0;i<indexed.length;i++)if(indexed[i].order!==i+1)return null;g.order=indexed.map(function(x){return x.value})}
return validate(g)?null:g}
var api={names:names,validate:validate,normalize:normalize,template:template,fromDesigner:fromDesigner,safeImage:safeImage,clone:clone};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else w.CreativeGameContract=api;
})(typeof window!=='undefined'?window:this);
