'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {JSDOM}=require('jsdom');
const dir=path.resolve(__dirname,'..'),root=path.resolve(dir,'../../..');
function runtime(age='4-8',saved){
 const dom=new JSDOM(fs.readFileSync(path.join(dir,'index.html'),'utf8'),{url:'https://school.example/apps/1-4/balloon-garden/index.html?launch_age='+age,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,played=[],praise=[];
 w.HTMLElement.prototype.scrollIntoView=function(){};Object.defineProperty(w.HTMLImageElement.prototype,'complete',{get:()=>true});Object.defineProperty(w.HTMLImageElement.prototype,'naturalWidth',{get:()=>100});w.Math.random=()=>.351;w.Audio=function(src){const a=w.document.createElement('audio');a.src=src||'';let paused=true;Object.defineProperty(a,'paused',{get:()=>paused});Object.defineProperty(a,'currentTime',{value:0,writable:true});a.play=()=>{paused=false;played.push(a);return Promise.resolve();};a.pause=()=>{paused=true;};return a;};
 const activityPauses=new Set();w.APP360_SESSION={getProfile:()=>null,pauseActivity:(reason,on)=>on?activityPauses.add(reason):activityPauses.delete(reason),isUsageActive:()=>activityPauses.size===0};w.APP360_TEACHER_ENCOURAGEMENT={play:(o,done)=>{praise.push(o);if(done)done();},stop(){}};
 if(saved)for(const [k,v] of saved)w.localStorage.setItem(k,v);
 for(const name of ['core','art','content','learning','guidance','speech','app'])w.eval(fs.readFileSync(path.join(dir,name+'.js'),'utf8'));
 const el=id=>w.document.getElementById(id),state=()=>w.BalloonGarden.getState();
 function topic(value){el('topicSelect').value=value;el('topicSelect').onchange();}
 function pop(){el('balloonField').querySelector('.balloon:not([disabled])').click();return state().round.discoveries.at(-1);}
 function drain(){let n=0;while(played.at(-1)?.onended&&n++<12)played.at(-1).onended();assert(n<12);}
 function close(){w.BalloonGarden.stop();dom.window.close();}
 return{dom,w,played,praise,el,state,topic,pop,drain,close};
}
test('Arabic and English number discoveries use the matching digit, label, recording and useful sentence',()=>{const r=runtime();try{r.topic('numbers');const token=r.pop(),n=token.item%Cmax(r)+1,row=r.w.BalloonGardenContent.numbers[n-1];assert(r.el('discoveryLabel').textContent.includes(String(n).replace(/\d/g,c=>'٠١٢٣٤٥٦٧٨٩'[c])));assert(r.played.at(-1).src.endsWith(row.audio.ar.replace('../say-and-name/','/apps/1-4/say-and-name/')));r.played.at(-1).onended();const line=r.w.BalloonGardenLearning.items[row.word_id][0].ar,clip=r.w.BalloonGardenLearning.clips[line.clip];assert.equal(r.el('sentenceText').textContent.trim(),line.words.join(' '));const cue=clip.cues[1],a=r.played.at(-1);a.currentTime=(cue[1]+cue[2])/2000;a.ontimeupdate();assert.equal(r.el('sentenceText').querySelectorAll('.is-speaking').length,1);
 r.el('settingsBtn').click();r.el('languageSelect').value='en';r.el('applySettings').click();const enToken=r.pop(),en=r.w.BalloonGardenContent.numbers[enToken.item%Cmax(r)];assert(r.el('discoveryLabel').textContent.startsWith(String(en.value)));assert(r.played.at(-1).src.endsWith(en.audio.en.replace('../say-and-name/','/apps/1-4/say-and-name/')));
}finally{r.close();}});
function Cmax(r){return r.state().settings.age==='1-4'?10:20;}
test('sentences default on for older learners and can be enabled, persisted, and switched off for younger learners',()=>{const r=runtime('1-4');let saved;try{assert.equal(r.state().settings.sentences,false);r.topic('colors');r.pop();assert(r.el('readAlong').hidden);r.el('settingsBtn').click();r.el('sentencesCheck').checked=true;r.el('applySettings').click();r.pop();assert(!r.el('readAlong').hidden);r.played.at(-1).onended();assert(r.el('sentenceText').textContent.trim().length>8);saved=Object.entries(r.w.localStorage);r.el('settingsBtn').click();r.el('sentencesCheck').checked=false;r.el('applySettings').click();assert(r.el('readAlong').hidden);r.pop();r.drain();assert(r.el('sentenceText').textContent==='');}finally{r.close();}const reopened=runtime('1-4',saved);try{assert.equal(reopened.state().settings.sentences,true);}finally{reopened.close();}});
test('all six shapes and colors select their own canonical lessons, and larger numbers cannot leak through younger word discovery',()=>{for(const age of ['1-4','4-8']){const r=runtime(age);try{for(const topic of ['shapes','colors']){r.topic(topic);const t=r.pop(),data=topic==='shapes'?r.w.BalloonGardenContent.shapes[t.item%6]:r.w.BalloonGardenContent.colors[t.item%6],rows=r.w.BalloonGardenLearning.items[data.word_id];assert(rows.length);if(age==='4-8'){r.played.at(-1).onended();assert.equal(r.el('sentenceText').textContent.trim(),rows[0].ar.words.join(' '));}}r.topic('words');r.el('settingsBtn').click();r.el('categorySelect').value='الأعداد والكميات';r.el('applySettings').click();while(!r.state().round.ended){const t=r.pop(),word=r.w.BalloonGardenContent.words[t.item];assert(word.category==='الأعداد والكميات');if(age==='1-4')assert(word.number_value===null||word.number_value<=10);} }finally{r.close();}}});
test('encouragement follows every discovery after its lesson and stale audio cannot praise another child',()=>{const r=runtime();try{r.topic('colors');r.pop();r.drain();assert.equal(r.praise.length,1);r.pop();r.drain();assert.equal(r.praise.length,2);r.pop();assert.equal(r.praise.length,2);r.drain();assert.equal(r.praise.length,3);assert.equal(r.praise[0].language,'ar');r.pop();r.pop();r.pop();const late=r.played.at(-1).onended;r.w.APP360_SESSION.getProfile=()=>({user_id:'other-child'});r.w.document.dispatchEvent(new r.w.Event('app360:authchange'));late();assert.equal(r.praise.length,3);assert.equal(r.state().round.pops,0);}finally{r.close();}});
test('real shared policy routes a guest to generic praise, a subscribed learner to one full-name clip, and a parent recording first',()=>{
 for(const mode of ['guest','named','parent']){const r=runtime('1-4');try{let profile=mode==='guest'?null:{user_id:'noor',display_name:'نور',role:'learner',gender:'girl',entitlements:{active:true,named_encouragement:true}},nameRequests=0,privateRequests=0;
  r.w.APP360_SESSION.isAuthenticated=()=>!!profile;r.w.APP360_SESSION.getProfile=()=>profile;r.w.APP360_SESSION.bridgeRequest=(method,url,input,done)=>{if(url==='/school/media/prepare'&&input.kind==='praise'){privateRequests++;done(200,{media:mode==='parent'?{base64:'UklGRg==',mime:'audio/wav',version:'voice-1',event_id:'praise-event',duration_ms:1000}:null});}else done(200,{});};
  r.w.URL.createObjectURL=()=> 'blob:https://school.example/parent-voice';r.w.URL.revokeObjectURL=()=>{};
  r.w.XMLHttpRequest=function(){this.open=()=>{};this.abort=()=>{};this.send=()=>{nameRequests++;this.status=200;this.responseText=JSON.stringify({records:[{id:'name-1',name:'نور',gender:'girl',praise_audio:{f:{kind:'full-praise',gender:'f',path:'audio/praise/name-1-f.mp3',sha256:'verified'}}}]});this.onload();};};
  r.w.eval(fs.readFileSync(path.join(root,'assets/js/parent-experiences-v1.js'),'utf8'));r.w.eval(fs.readFileSync(path.join(root,'assets/js/teacher-encouragement-v1.js'),'utf8'));
  r.topic('colors');r.pop();let steps=0;while(r.played.at(-1)?.onended&&!/well-done|praise\/name-|blob:/.test(r.played.at(-1).src)&&steps++<8)r.played.at(-1).onended();
  const src=r.played.at(-1).src;if(mode==='guest'){assert.match(src,/well-done-dear-m\.mp3$/);assert.equal(privateRequests,0);assert.equal(nameRequests,0);}else if(mode==='named'){assert.match(src,/praise\/name-1-f\.mp3$/);assert.equal(privateRequests,1);assert.equal(nameRequests,1);}else{assert.match(src,/^blob:.*parent-voice$/);assert.equal(privateRequests,1);assert.equal(nameRequests,0);}
 }finally{r.close();}}
});

test('muting recordings leaves the enabled useful sentence readable without starting speech',()=>{const r=runtime();try{r.topic('colors');r.el('soundBtn').click();const n=r.played.length;r.pop();assert.equal(r.played.length,n);assert(!r.el('readAlong').hidden);assert(r.el('sentenceText').textContent.trim().length>8);}finally{r.close();}});

test('canonical vocabulary also keeps the added advanced number lessons in the older age launch',()=>{for(const age of ['1-4','4-8']){const source=path.join(root,'apps/1-4/say-and-name'),dom=new JSDOM(fs.readFileSync(path.join(source,'index.html'),'utf8'),{url:'https://school.example/apps/1-4/say-and-name/index.html?launch_age='+age,runScripts:'outside-only'}),w=dom.window;try{for(const file of ['data/levels-inline-v8.js','data/translations-en.js','data/meaning-sentences-v1.js','runtime-v27.js'])w.eval(fs.readFileSync(path.join(source,file),'utf8'));const words=w.App360WordPlayer.coachItems(4),newWords=JSON.parse(fs.readFileSync(path.join(source,'data/number-lessons-20.json'),'utf8')).numbers.map(n=>n.ar);assert.equal(words.filter(word=>newWords.includes(word.ar)).length,age==='4-8'?10:0);}finally{dom.window.close();}}});

test('the last flower still receives encouragement after gameplay activity pauses at round completion',()=>{const r=runtime('1-4');try{r.topic('colors');while(!r.state().round.ended){r.pop();r.drain();}assert.equal(r.w.APP360_SESSION.isUsageActive(),false);assert.equal(r.praise.length,12);}finally{r.close();}});

test('changing levels returns to the level content while changing fields preserves a chosen topic',()=>{const r=runtime();try{r.topic('shapes');r.el('stageTabs').querySelector('[data-stage="1"]').click();assert.equal(r.state().settings.topic,'shapes');r.el('levelTabs').querySelector('[data-level="2"]').click();assert.equal(r.state().settings.topic,'auto');assert.equal(r.w.BalloonGardenCore.config(r.state().settings).mode,'numbers');}finally{r.close();}});

for(const language of ['ar','en'])test('every farm change speaks encouraging growth feedback before praise: '+language,()=>{
 const r=runtime('1-4');try{
  if(language==='en'){r.el('settingsBtn').click();r.el('languageSelect').value='en';r.el('applySettings').click();}
  r.topic('colors');
  for(const [index,id] of ['growSeed','growWater','growFlower'].entries()){
   r.pop();assert.equal(r.praise.length,index);r.drain();
   assert(r.played.some(a=>a.src.endsWith('/audio/guide/'+language+'/'+id+'.mp3')));
   assert.equal(r.praise.length,index+1);
  }
  assert(!r.played.some(a=>/\/(?:seed|water|sun)\.mp3$/.test(a.src)),'procedural narration is replaced');
 }finally{r.close();}
});

for(const age of ['1-4','4-8'])test('coach waits for lesson AND praise, advances automatically, and cancels on identity change: '+age,()=>{
 const r=runtime(age);try{
  const scheduled=new Map(),native=r.w.setTimeout;let counter=0,finishPraise;
  r.w.setTimeout=(fn,ms)=>ms===1200||ms===2400?(scheduled.set(++counter,fn),counter):native(fn,ms);
  r.w.clearTimeout=id=>scheduled.delete(id);
  r.w.APP360_TEACHER_ENCOURAGEMENT.play=(options,done)=>{finishPraise=done;return true;};
  r.topic('shapes');r.pop();r.drain();const freePops=r.state().round.pops;
  r.el('coachBtn').click();assert.equal(r.state().round.pops,0);assert(r.state().settings.coach);
  assert.equal(r.w.BalloonGardenCore.config(r.state().settings).mode,'colors');
  r.pop();assert(r.state().coachBusy);assert.equal(scheduled.size,0);
  r.drain();assert.equal(scheduled.size,0,'the child hears praise before the next trial');
  finishPraise();assert.equal(scheduled.size,1);r.el('repeatBtn').click();assert.equal(scheduled.size,0,'replaying the lesson cancels the pending advance');r.drain();finishPraise();assert.equal(scheduled.size,1);const resume=[...scheduled.values()][0];scheduled.clear();resume();
  assert.equal(r.state().coachBusy,false);assert(r.el('balloonField').querySelector('.balloon:not([disabled])'));
  r.pop();r.drain();const late=finishPraise;r.w.APP360_SESSION.getProfile=()=>({user_id:'new-child'});r.w.document.dispatchEvent(new r.w.Event('app360:authchange'));late();assert.equal(scheduled.size,0);assert.equal(r.state().round.pops,0);
  r.w.APP360_SESSION.getProfile=()=>null;r.w.document.dispatchEvent(new r.w.Event('app360:authchange'));assert(r.state().settings.coach);assert.equal(r.state().round.pops,2);
  r.el('coachBtn').click();assert.equal(r.state().round.pops,freePops,'free discovery was preserved');
 }finally{r.close();}
});
for(const age of ['1-4','4-8'])test('muted coach crosses fields automatically, stops at final route, and respects pause: '+age,()=>{
 const r=runtime(age);try{const scheduled=new Map(),native=r.w.setTimeout;let counter=0;
  r.w.setTimeout=(fn,ms)=>ms===2400?(scheduled.set(++counter,fn),counter):native(fn,ms);r.w.clearTimeout=id=>scheduled.delete(id);
  function advance(){assert.equal(scheduled.size,1);const fn=[...scheduled.values()][0];scheduled.clear();fn();}
  r.el('soundBtn').click();r.el('coachBtn').click();
  r.pop();const late=[...scheduled.values()][0];r.el('pauseBtn').click();late();assert.equal(r.state().round.pops,1);assert(r.state().paused);assert.equal(scheduled.size,0);
  r.el('resumeBtn').click();advance();
  while(r.state().settings.stage===0){r.pop();advance();}
  assert.equal(r.state().settings.stage,1);assert.equal(r.state().round.pops,0);assert.equal(r.w.BalloonGardenCore.config(r.state().settings).mode,'shapes');
  r.el('levelTabs').querySelector('[data-level="4"]').click();r.el('stageTabs').querySelector('[data-stage="2"]').click();
  while(!r.state().round.ended){r.pop();advance();}
  assert.equal(r.state().settings.level,4);assert.equal(r.state().settings.stage,2);assert.equal(r.state().coachBusy,false);assert.equal(scheduled.size,0);
 }finally{r.close();}
});
