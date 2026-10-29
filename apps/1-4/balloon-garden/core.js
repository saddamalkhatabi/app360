/* Pure ES5 farm model. Discovery and planting are separate, saved transactions. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.BalloonGardenCore=factory();})(this,function(){
'use strict';
var LETTERS={ar:'أ ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي'.split(' '),en:'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')};
var COLORS=[{id:'red',hex:'#ef6574',ar:'أحمر',en:'Red'},{id:'yellow',hex:'#f6be45',ar:'أصفر',en:'Yellow'},{id:'green',hex:'#5eb596',ar:'أخضر',en:'Green'},{id:'blue',hex:'#65ace6',ar:'أزرق',en:'Blue'},{id:'purple',hex:'#aa87d3',ar:'بنفسجي',en:'Purple'},{id:'pink',hex:'#ed94b6',ar:'وردي',en:'Pink'}];
var NAMES={ar:{'1-4':['ألوان وأشكال','أعدّ وأزرع','حروفي تزهر','صوري وكلماتي'],'4-8':['ألوان وأشكال المزرعة','أعداد تنمو','حروف وكلمات','مزرعة الاكتشاف']},en:{'1-4':['Colors & shapes','Count & plant','Blooming letters','Pictures & words'],'4-8':['Farm colors & shapes','Growing numbers','Letters & words','Discovery farm']}};
var STAGES={ar:['روضة الورد','حقل دوّار الشمس','بستان التوليب'],en:['Rose garden','Sunflower field','Tulip garden']};
// Twelve short, reproducible units per age. Free discovery keeps its own gardens.
function route(s){var older=s.age==='4-8',index=(s.level-1)*3+s.stage,rows=[
 ['colors','ألوان مزرعتي','Farm colors'],['shapes','أشكال حولي','Shapes around me'],['colorsShapes','ألوان وأشكال','Colors and shapes'],
 ['numbers',older?'الأعداد ١–١٠':'الأعداد ١–٥',older?'Numbers 1–10':'Numbers 1–5'],['numbers',older?'الأعداد ١١–٢٠':'الأعداد ٦–١٠',older?'Numbers 11–20':'Numbers 6–10'],['numbers','أعدّ وأراجع','Count and revisit'],
 ['letters','حروفي الأولى','My first letters'],['letters','حروف جديدة','More letters'],['letters','أراجع حروفي','Revisit letters'],
 ['words','حيوانات أعرفها','Animals I know','الحيوانات'],['words','فواكه أحبها','Fruit I like','الفواكه'],['words',older?'كلمات المدرسة وجملها':'كلمات من بيتي',older?'School words and sentences':'Words from home',older?'المدرسة':'المنزل']
 ],r=rows[index],min=0,max=0;
 if(r[0]==='numbers'){min=s.stage===1?(older?11:6):1;max=s.stage===0?(older?10:5):(older?20:10);}
 return{id:s.age+':'+index,index:index,topic:r[0],ar:r[1],en:r[2],category:r[3]||'',minNumber:min,maxNumber:max,letterOffset:s.level===3&&s.stage===1?10:0,letterCount:s.level===3&&s.stage<2?10:0};
}
function int(x,min,max,f){return typeof x==='number'&&isFinite(x)&&Math.floor(x)===x&&x>=min&&x<=max?x:f;}
function settings(s){s=s||{};return{age:s.age==='4-8'?'4-8':'1-4',level:int(Number(s.level),1,4,1),stage:int(Number(s.stage),0,2,0),language:s.language==='en'?'en':'ar',players:s.players===2?2:1,sound:s.sound!==false,music:s.music===true,motion:s.motion!==false,world:s.age==='4-8'?'orchard':'garden',approach:s.approach==='farm'?'farm':'discover',category:typeof s.category==='string'?s.category:'',showText:s.showText!==false,sentences:typeof s.sentences==='boolean'?s.sentences:s.age==='4-8',coach:s.coach===true,topic:['colors','shapes','numbers','letters','words'].indexOf(s.topic)>=0?s.topic:'auto'};}
function config(s){s=settings(s);var r=s.coach?route(s):null;return{route:r,plots:s.age==='1-4'?4:6,count:s.age==='1-4'?(s.level===1?2:3):4,maxNumber:s.age==='1-4'?10:20,mode:r?r.topic:s.topic!=='auto'?s.topic:s.level===1?'colorsShapes':s.level===2?'numbers':s.level===3?(s.age==='1-4'?'letters':'letterWords'):(s.age==='1-4'?'words':'mixed')};}
function create(s){s=settings(s);var a=[],i;for(i=0;i<config(s).plots;i++)a.push({growth:0,color:i%COLORS.length,word:null});return{schema:2,age:s.age,level:s.level,stage:s.stage,pops:0,seed:0,plots:a,active:0,pending:null,discoveries:[],ended:false};}
function restore(raw,s,contentSize){s=settings(s);var clean=create(s),max=config(s).plots*3,i,p;
if(!raw||raw.schema!==2||raw.age!==s.age||raw.level!==s.level||raw.stage!==s.stage||!raw.plots||raw.plots.length!==clean.plots.length)return clean;
var sum=0;for(i=0;i<raw.plots.length;i++){p=raw.plots[i];if(!p||int(p.growth,0,3,-1)<0||int(p.color,0,5,-1)<0)return clean;sum+=p.growth;clean.plots[i]={growth:p.growth,color:p.color,word:int(p.word,0,Math.max(0,contentSize-1),null)};}
clean.seed=int(raw.seed,0,1000000,0);clean.active=int(raw.active,0,clean.plots.length-1,0);clean.ended=sum===max;
if(raw.pending){p=raw.pending;if(clean.ended||p.plot!==clean.active||p.step!==clean.plots[p.plot].growth||int(p.item,0,10000,-1)<0||['colors','numbers','letters','words','shapes'].indexOf(p.kind)<0||int(p.color,0,5,-1)<0)return create(s);clean.pending={plot:p.plot,step:p.step,item:p.item,kind:p.kind,color:p.color};}
clean.pops=sum+(clean.pending?1:0);
if(raw.pops!==clean.pops)return create(s);
if(raw.discoveries&&raw.discoveries.length<=max)for(i=0;i<raw.discoveries.length;i++){p=raw.discoveries[i];if(p&&['colors','numbers','letters','words','shapes'].indexOf(p.kind)>=0&&int(p.item,0,10000,-1)>=0)clean.discoveries.push({kind:p.kind,item:p.item});}
if(!clean.ended&&clean.plots[clean.active].growth===3){for(i=0;i<clean.plots.length;i++)if(clean.plots[i].growth<3){clean.active=i;break;}}
return clean;}
function kindFor(s,n){var mode=config(s).mode;return mode==='colorsShapes'?(n%2?'shapes':'colors'):mode==='mixed'?['colors','numbers','letters','words','shapes'][n%5]:mode==='letterWords'?(n%2?'words':'letters'):mode;}
function offers(r,s,size){s=settings(s);var list=[],i,n,kind,item,limit,cfg=config(s),unit=cfg.route,offset; for(i=0;i<config(s).count;i++){n=s.coach?r.pops+i:r.seed+r.pops*7+i+s.stage*7+(s.level-1)*11;kind=kindFor(s,n);limit=kind==='letters'?LETTERS[s.language].length:kind==='numbers'?config(s).maxNumber:kind==='shapes'?6:kind==='colors'?COLORS.length:Math.max(1,typeof size==='number'?size:size.length);offset=0;if(unit&&kind==='numbers'){offset=unit.minNumber-1;limit=unit.maxNumber-offset;}if(unit&&kind==='letters'&&unit.letterCount){offset=unit.letterOffset;limit=Math.min(unit.letterCount,limit-offset);}item=offset+n%limit;if(kind==='words'&&typeof size!=='number')item=size[item];list.push({id:r.pops+':'+i,kind:kind,item:item,color:kind==='colors'?item:(n+i)%COLORS.length});}return list;}
function pop(r,s,id,size){if(r.ended||r.pending)return null;var list=offers(r,s,size),chosen=null,i;for(i=0;i<list.length;i++)if(list[i].id===id)chosen=list[i];if(!chosen)return null;r.pending={plot:r.active,step:r.plots[r.active].growth,kind:chosen.kind,item:chosen.item,color:chosen.color};r.pops++;r.discoveries.push({kind:chosen.kind,item:chosen.item});return r.pending;}
function apply(r,index){if(!r.pending||r.ended||index!==r.pending.plot)return null;var p=r.pending,plot=r.plots[index];if(plot.growth!==p.step)return null;plot.growth++;if(p.step===0){plot.color=p.color;plot.word=p.kind==='words'?p.item:null;}var result={plot:index,growth:plot.growth,bloom:plot.growth===3};r.pending=null;var i;for(i=0;i<r.plots.length;i++)if(r.plots[i].growth<3)break;r.ended=i===r.plots.length;if(!r.ended&&plot.growth===3)r.active=i;return result;}
return{route:route,settings:settings,config:config,create:create,restore:restore,offers:offers,pop:pop,apply:apply,colors:COLORS,letters:LETTERS,names:NAMES,stages:STAGES,flowers:function(r){var n=0;for(var i=0;i<r.plots.length;i++)if(r.plots[i].growth===3)n++;return n;}};
});
