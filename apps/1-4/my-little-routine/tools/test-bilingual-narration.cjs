'use strict';
const assert=require('assert');
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'..');
const load=p=>fs.readFileSync(path.join(root,p),'utf8');
const ar=JSON.parse(load('audio/narration-scripts.json')).items;
const en=JSON.parse(load('audio/narration-scripts-en.json')).items;
assert.equal(ar.length,50);assert.equal(en.length,50);
for(let i=0;i<50;i++){
 const a=ar[i],e=en[i];
 assert.equal(a.id,e.id);assert.equal(e.language,'en');
 assert.equal(a.steps.length,5);assert.equal(e.steps.length,5);
 assert.equal(e.segments.length,7);assert(e.path.indexOf('/en/')>0);
 assert.equal(e.segments[0].kind,'intro');
 for(let j=0;j<5;j++){
  assert.equal(e.segments[j+1].kind,'step');
  assert.equal(e.segments[j+1].step,j);
  assert(e.segments[j+1].text.toLowerCase().includes(e.steps[j].toLowerCase()));
 }
}
const html=load('index.html');
const files=['storyboard-remap-v8.js','audio/routine-english-labels.js','routine-language-v1.js','app.js','audio/narration-timings.js','audio/narration-timings-en.js','routine-narration-v1.js'];
for(let i=0;i<files.length;i++){
 assert(html.includes(files[i]),files[i]);
 if(i)assert(html.indexOf(files[i])>html.indexOf(files[i-1]),'Wrong bilingual initialization '+files[i]);
}
for(const name of ['routine-language-v1.js','routine-narration-v1.js','app.js']){
 new Function(load(name));
}
const enInfo=load('audio/routine-english-labels.js');
const dict={};
new Function('window',enInfo)(dict);
assert.equal(Object.keys(dict.APP360_ROUTINE_ENGLISH_LABELS).length,50);
for(const row of en){assert.deepEqual(dict.APP360_ROUTINE_ENGLISH_LABELS[row.id],{title:row.title,steps:row.steps});}
function voiceChoice(lang,available){
 const nodes={},children=[];
 const mk=id=>({id,children:[],style:{},disabled:false,innerHTML:'🔊',textContent:'',
   appendChild(el){this.children.push(el);el.parentNode=this;nodes[el.id]=el},
   insertBefore(el){this.children.push(el);el.parentNode=this;nodes[el.id]=el},
   addEventListener(){},getElementsByTagName(){return []}});
 ['playStory','sound','speakStory','speakStep','prevHabit','nextHabit','habitCards','categoryRail','tabs','useHabit','toast','reelReplay','storyDots','sceneStrip'].forEach(x=>{nodes[x]=mk(x)});
 const controls=mk('controls'),parent=mk('parent'),bar=mk('bar');controls.appendChild(nodes.playStory);parent.appendChild(controls);
 let opened='';
 const habit={id:'wash-hands',title:'test'};
 const sample=(where)=>({path:where,verified:true,segments:Array.from({length:7},(_,i)=>({kind:i===0?'intro':i===6?'outro':'step',step:i===0||i===6?null:i-1,start_ms:i*900,end_ms:(i+1)*900}))});
 const w={APP360_ROUTINE_LANG:lang,APP360_RoutineReel:{currentHabit:()=>habit,showOverview(){},stop(){},showFrame(){}},
 APP360_ROUTINE_NARRATIONS:{habits:{'wash-hands':sample('audio/silma/routines/ar.mp3')}},
 APP360_ROUTINE_NARRATIONS_EN:{habits:available?{'wash-hands':sample('audio/en/routines/en.mp3')}:{}},
 Audio:function(p){opened=p;this.readyState=1;this.currentTime=0;this.play=()=>Promise.resolve();this.pause=()=>{}},
 setTimeout:()=>1,addEventListener(){},speechSynthesis:{cancel(){}},localStorage:{getItem(){return'null'}},ROUTINE_DATA:{habits:[]}};
 const d={readyState:'complete',getElementById:id=>nodes[id]||null,
 createElement:tag=>mk(tag),querySelector:s=>s==='.habitActionBar'?bar:null,addEventListener(){}};
 new Function('window','document',load('routine-narration-v1.js'))(w,d);
 if(available||lang==='ar'){assert.equal(nodes.listenFullRoutine.disabled,false);w.APP360_RoutineVoice.listen();assert(opened.includes(lang==='en'?'/en/':'/silma/'),opened)}
 else{assert.equal(nodes.listenFullRoutine.disabled,true);assert.equal(opened,'')}
 return opened;
}

function localeChoice(lang){
 const sample={id:'wash-hands',title:'أغسل يدي',steps:ar[0].steps.slice()};
 const data={habits:[sample],categories:[{id:'hygiene',title:'النظافة'}]};
 const parent={children:[],appendChild(x){this.children.push(x)}};
 const d={documentElement:{},body:{className:''},querySelector:s=>s==='.topTools'?parent:null,
 createElement:()=>({type:'',textContent:'',title:'',className:''})};
 const calls=[];
 const w={ROUTINE_DATA:data,APP360_ROUTINE_ENGLISH_LABELS:dict.APP360_ROUTINE_ENGLISH_LABELS,
 localStorage:{getItem(){return lang},setItem(k,v){calls.push([k,v])}},
 location:{search:'',reload(){calls.push(['reload'])}}};
 new Function('window','document',load('routine-language-v1.js'))(w,d);
 assert.equal(w.APP360_ROUTINE_LANG,lang);
 assert.equal(data.habits[0].title,lang==='en'?'I wash my hands':'أغسل يدي');
 assert.equal(data.habits[0].steps[0],lang==='en'?'I turn on the water':'أفتح الماء');
 assert.equal(parent.children.length,1);
 assert.equal(parent.children[0].textContent,lang==='en'?'العربية':'English');
 parent.children[0].onclick();
 assert(calls.some(([k,v])=>k==='app360-routine-language-v1'&&v===(lang==='en'?'ar':'en')));
 return true;
}
assert(localeChoice('ar'));assert(localeChoice('en'));

const a=voiceChoice('ar',true),e=voiceChoice('en',true),disabled=voiceChoice('en',false);
console.log('PASS: 50 bilingual texts, 350 English lines, script order, Arabic/English recording path isolation, fail-closed when English unavailable:',a,e,disabled);
