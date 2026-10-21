/* Authored centre-line strokes; no font raster tracing or image scanning. ES5. */
(function(root,factory){var data=factory();if(typeof module==='object'&&module.exports)module.exports=data;else root.DrawingCurriculum=data})(this,function(){'use strict';
var lessons=[],groups=[{id:'lines',label:'خطوطي الأولى'},{id:'shapes',label:'أشكالي'},{id:'letters',label:'حروفي العربية'},{id:'numbers',label:'أرقامي الإنجليزية'},{id:'pictures',label:'أرسم صورة'}];
function line(){var out=[],i;for(i=0;i<arguments.length;i+=2)out.push([arguments[i],arguments[i+1]]);return out}
function curve(start,segments){var out=[start],a=start,i,j,s,t;for(i=0;i<segments.length;i++){s=segments[i];for(j=1;j<=20;j++){t=j/20;out.push([(1-t)*(1-t)*a[0]+2*(1-t)*t*s[0]+t*t*s[2],(1-t)*(1-t)*a[1]+2*(1-t)*t*s[1]+t*t*s[3]])}a=[s[2],s[3]]}return out}
function arc(cx,cy,rx,ry,a,b){var out=[],i,t;for(i=0;i<=64;i++){t=a+(b-a)*i/64;out.push([cx+Math.cos(t)*rx,cy+Math.sin(t)*ry])}return out}
function dot(x,y){return line(x,y,x+.006,y+.006)}
function add(id,group,label,spoken,paths,language){lessons.push({id:id,group:group,label:label,spoken:spoken||label,language:language||'ar',paths:paths})}
add('horizontal','lines','خط أفقي','خَطٌّ أُفُقِيٌّ', [line(.78,.5,.22,.5)]);
add('vertical','lines','خط رأسي','خَطٌّ رَأْسِيٌّ',[line(.5,.2,.5,.8)]);
add('slant','lines','خط مائل','خَطٌّ مَائِلٌ',[line(.25,.2,.75,.8)]);
add('zigzag','lines','خط متعرج','خَطٌّ مُتَعَرِّجٌ',[line(.15,.62,.32,.34,.5,.62,.68,.34,.85,.62)]);
add('wave','lines','موجة','مَوْجَةٌ',[curve([.15,.5],[[.24,.22,.33,.5],[.42,.78,.5,.5],[.59,.22,.67,.5],[.76,.78,.85,.5]])]);
add('arch','lines','قوس','قَوْسٌ',[curve([.2,.7],[[.5,-.1,.8,.7]])]);
add('circle','shapes','دائرة','دَائِرَةٌ',[arc(.5,.5,.3,.3,-Math.PI/2,Math.PI*1.5)]);
add('square','shapes','مربع','مُرَبَّعٌ',[line(.22,.22,.78,.22),line(.78,.22,.78,.78),line(.78,.78,.22,.78),line(.22,.78,.22,.22)]);
add('triangle','shapes','مثلث','مُثَلَّثٌ',[line(.5,.18,.82,.78),line(.82,.78,.18,.78),line(.18,.78,.5,.18)]);
add('rectangle','shapes','مستطيل','مُسْتَطِيلٌ',[line(.15,.3,.85,.3),line(.85,.3,.85,.7),line(.85,.7,.15,.7),line(.15,.7,.15,.3)]);
add('oval','shapes','بيضاوي','بَيْضَاوِيٌّ',[arc(.5,.5,.34,.22,-Math.PI/2,Math.PI*1.5)]);
add('diamond','shapes','معين','مُعَيَّنٌ',[line(.5,.16,.8,.5),line(.8,.5,.5,.84),line(.5,.84,.2,.5),line(.2,.5,.5,.16)]);
var bowl=curve([.8,.43],[[.88,.78,.5,.76],[.17,.78,.22,.55]]),body=curve([.76,.3],[[.54,.19,.36,.36],[.55,.4,.75,.4],[.54,.5,.3,.64],[.21,.83,.68,.83]]);
function letter(id,label,spoken,paths){add(id,'letters',label,spoken,paths)}
letter('alif','ا','أَلِفٌ',[line(.54,.2,.5,.8)]);
letter('ba','ب','بَاءٌ',[bowl,dot(.5,.87)]);
letter('ta','ت','تَاءٌ',[bowl,dot(.57,.32),dot(.43,.32)]);
letter('tha','ث','ثَاءٌ',[bowl,dot(.6,.32),dot(.4,.32),dot(.5,.2)]);
letter('jeem','ج','جِيمٌ',[body,dot(.5,.63)]);
letter('ha','ح','حَاءٌ',[body]);letter('kha','خ','خَاءٌ',[body,dot(.6,.15)]);
var dal=curve([.45,.25],[[.91,.62,.7,.68],[.5,.73,.26,.68]]);
letter('dal','د','دَالٌ',[dal]);letter('dhal','ذ','ذَالٌ',[dal,dot(.5,.14)]);
var ra=curve([.69,.38],[[.7,.8,.3,.83]]);
letter('ra','ر','رَاءٌ',[ra]);letter('zay','ز','زَايٌ',[ra,dot(.64,.23)]);
var seen=curve([.85,.4],[[.89,.66,.74,.61],[.66,.6,.67,.43],[.7,.68,.52,.62],[.45,.6,.48,.45],[.55,.91,.26,.82],[.13,.77,.21,.6]]);
letter('seen','س','سِينٌ',[seen]);letter('sheen','ش','شِينٌ',[seen,dot(.74,.28),dot(.53,.28),dot(.64,.15)]);
var sad=curve([.55,.59],[[.83,.27,.86,.53],[.89,.68,.48,.64],[.55,.9,.26,.83],[.12,.77,.2,.61]]);
letter('sad','ص','صَادٌ',[sad]);letter('dad','ض','ضَادٌ',[sad,dot(.71,.22)]);
var tah=curve([.23,.69],[[.8,.3,.84,.56],[.93,.74,.23,.69]]);
letter('tah','ط','طَاءٌ',[tah,line(.5,.69,.5,.2)]);letter('zah','ظ','ظَاءٌ',[tah,line(.5,.69,.5,.2),dot(.7,.3)]);
var ayn=curve([.67,.27],[[.46,.15,.35,.35],[.48,.5,.71,.42],[.34,.52,.29,.68],[.24,.88,.7,.85]]);
letter('ayn','ع','عَيْنٌ',[ayn]);letter('ghayn','غ','غَيْنٌ',[ayn,dot(.49,.13)]);
var fa=curve([.68,.55],[[.96,.55,.76,.31],[.59,.27,.62,.56],[.87,.88,.27,.76],[.14,.73,.21,.54]]);
letter('fa','ف','فَاءٌ',[fa,dot(.72,.18)]);
letter('qaf','ق','قَافٌ',[curve([.68,.55],[[.96,.55,.76,.31],[.59,.27,.62,.56],[.9,.94,.45,.87],[.16,.87,.23,.53]]),dot(.78,.18),dot(.64,.18)]);
letter('kaf','ك','كَافٌ',[line(.78,.18,.76,.7),curve([.76,.7],[[.45,.91,.22,.67],[.16,.61,.22,.49]]),line(.53,.39,.43,.48,.54,.5)]);
letter('lam','ل','لَامٌ',[curve([.69,.18],[[.7,.52,.66,.71],[.43,.99,.25,.73],[.19,.67,.24,.56]])]);
letter('meem','م','مِيمٌ',[curve([.69,.5],[[.89,.21,.82,.58],[.68,.65,.58,.49],[.44,.48,.4,.67],[.4,.79,.4,.9]])]);
letter('noon','ن','نُونٌ',[curve([.79,.4],[[.9,.89,.5,.82],[.17,.85,.23,.46]]),dot(.52,.34)]);
letter('haa','ه','هَاءٌ',[curve([.65,.34],[[.4,.13,.29,.49],[.24,.74,.59,.71],[.84,.65,.72,.42],[.64,.28,.48,.48],[.37,.64,.6,.67]])]);
letter('waw','و','وَاوٌ',[curve([.7,.5],[[.45,.64,.49,.38],[.7,.2,.76,.5],[.74,.82,.3,.86]])]);
letter('ya','ي','يَاءٌ',[curve([.76,.3],[[.5,.25,.54,.46],[.84,.52,.66,.68],[.24,.97,.2,.61]]),dot(.48,.89),dot(.62,.89)]);
var digits=[
 [arc(.5,.5,.25,.33,-Math.PI/2,Math.PI*1.5)],
 [line(.4,.31,.55,.18,.55,.82)],
 [curve([.25,.32],[[.5,.02,.75,.3],[.81,.43,.25,.82]]),line(.25,.82,.8,.82)],
 [curve([.28,.23],[[.85,.12,.68,.43],[.6,.5,.43,.5],[.85,.43,.74,.73],[.6,.96,.25,.79]])],
 [line(.68,.18,.25,.62,.8,.62),line(.68,.18,.68,.84)],
 [line(.76,.2,.3,.2,.28,.5),curve([.28,.5],[[.8,.32,.76,.71],[.65,.96,.25,.77]])],
 [curve([.71,.21],[[.22,.3,.25,.69],[.27,.94,.68,.79],[.88,.59,.58,.51],[.34,.46,.25,.69]])],
 [line(.22,.2,.78,.2,.4,.82)],
 [arc(.5,.34,.2,.17,-Math.PI/2,Math.PI*1.5),arc(.5,.68,.25,.19,-Math.PI/2,Math.PI*1.5)],
 [arc(.5,.35,.24,.19,0,Math.PI*2),curve([.74,.35],[[.81,.71,.32,.85]])]
];
var names=['Zero','One','Two','Three','Four','Five','Six','Seven','Eight','Nine'];
for(var n=0;n<10;n++)add('number-'+n,'numbers',String(n)+' — '+names[n],names[n],digits[n],'en');
add('number-10','numbers','10 — Ten','Ten',[line(.23,.25,.28,.2,.28,.8),arc(.66,.5,.18,.3,-Math.PI/2,Math.PI*1.5)],'en');
add('house','pictures','بيت','بَيْتٌ',[line(.2,.45,.5,.18,.8,.45),line(.27,.45,.27,.82,.73,.82,.73,.45),line(.45,.82,.45,.6,.59,.6,.59,.82)]);
var sun=[arc(.5,.5,.18,.18,0,Math.PI*2)];for(n=0;n<8;n++){var a=Math.PI*n/4;sun.push(line(.5+.26*Math.cos(a),.5+.26*Math.sin(a),.5+.36*Math.cos(a),.5+.36*Math.sin(a)))}
add('sun','pictures','شمس','شَمْسٌ',sun);
add('flower','pictures','زهرة','زَهْرَةٌ',[arc(.5,.35,.14,.14,0,Math.PI*2),line(.5,.49,.5,.85),curve([.5,.65],[[.2,.42,.24,.68],[.34,.79,.5,.65]]),curve([.5,.73],[[.79,.48,.76,.73],[.64,.87,.5,.73]])]);
add('boat','pictures','قارب','قَارِبٌ',[line(.18,.64,.32,.83,.7,.83,.83,.64,.18,.64),line(.5,.64,.5,.18),line(.5,.22,.76,.57,.5,.57)]);
return {version:1,groups:groups,lessons:lessons};
});
