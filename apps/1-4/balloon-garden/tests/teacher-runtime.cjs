'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),{JSDOM}=require('jsdom'),M=require('../coach-session.js');
const dir=path.resolve(__dirname,'..');
function runtime(age='1-4',storage,search=''){
 const dom=new JSDOM(fs.readFileSync(path.join(dir,'index.html'),'utf8'),{url:'https://school.example/apps/1-4/balloon-garden/index.html?launch_age='+age+search,runScripts:'outside-only',pretendToBeVisual:true}),w=dom.window,played=[],praise=[],events=[],timers=new Map();let now=0,nextId=0;
 w.HTMLElement.prototype.scrollIntoView=function(){};Object.defineProperty(w.HTMLImageElement.prototype,'complete',{get:()=>true});Object.defineProperty(w.HTMLImageElement.prototype,'naturalWidth',{get:()=>100});
 w.Date.now=()=>now;w.setTimeout=(fn,ms)=>(timers.set(++nextId,{fn,at:now+(Number(ms)||0),repeat:0}),nextId);w.setInterval=(fn,ms)=>(timers.set(++nextId,{fn,at:now+ms,repeat:ms}),nextId);w.clearTimeout=w.clearInterval=id=>timers.delete(id);
 w.Audio=function(src){const a=w.document.createElement('audio');a.src=src||'';let paused=true;Object.defineProperty(a,'paused',{get:()=>paused});Object.defineProperty(a,'currentTime',{value:0,writable:true});a.play=()=>{paused=false;played.push(a);return Promise.resolve();};a.pause=()=>paused=true;return a;};
 w.APP360_SESSION={getProfile:()=>null,pauseActivity(){},isUsageActive:()=>true};w.APP360_TEACHER_ENCOURAGEMENT={play(options,done){praise.push({options,done});return true;},stop(){}};
 if(search.includes('pending_identity=1'))w.APP360_SESSION.isIdentityPending=()=>true;
 if(storage)for(const [key,value] of storage)w.localStorage.setItem(key,value);
 for(const kind of ['sessionstarted','sessionpaused','sessionresumed','sessioncomplete','sessionstopped','experienceviewed'])w.document.addEventListener('app360:balloon-trainer:'+kind,e=>events.push({kind,detail:e.detail}));
 for(const name of ['core','art','content','learning','guidance','speech','app','coach-session','auto-coach'])w.eval(fs.readFileSync(path.join(dir,name+'.js'),'utf8'));
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 const el=id=>w.document.getElementById(id),state=()=>w.BalloonGarden.getState(),trainer=w.APP360_BALLOON_TRAINER;
 function tick(ms=0){const end=now+ms;let count=0;while(true){const due=[...timers].filter(([,t])=>t.at<=end).sort((a,b)=>a[1].at-b[1].at)[0];if(!due)break;if(++count>2000)throw Error('Unbounded timer loop');const [id,t]=due;now=t.at;timers.delete(id);if(t.repeat)timers.set(id,{...t,at:now+t.repeat});t.fn();}now=end;}
 function drain(){let steps=0;while(played.at(-1)?.onended&&steps++<15)played.at(-1).onended();assert(steps<15);}
 function complete(){drain();const row=praise.at(-1);assert(row);row.done();tick(0);}
 return{w,el,state,trainer,played,praise,events,timers,tick,drain,complete,storage:()=>Object.entries(w.localStorage),close(){w.BalloonGarden.stop();dom.window.close();}};
}
for(const age of ['1-4','4-8'])test('teacher route catalog and shared entry icon: '+age,()=>{const r=runtime(age);try{
 assert.equal(M.routes(age).length,7);assert.equal(M.routes(age)[0].unit_ids.length,12);r.el('coachBtn').click();assert(!r.el('teacherChooser').hidden);assert.equal(r.el('teacherRoutes').querySelectorAll('input').length,7);assert.match(r.el('coachBtn').querySelector('img').src,/assets\/ui-icons\/family-teacher\.svg$/);
 assert(r.el('teacherChoiceTitle').textContent.includes(age==='1-4'?'مدربة الروضة':'مدربة المدرسة'));r.el('teacherClose').click();assert(r.el('teacherChooser').hidden);assert.equal(r.trainer.isActive(),false);
 }finally{r.close();}});
for(const age of ['1-4','4-8'])test('autonomous discoveries wait for real lesson and praise and leave child gardens untouched: '+age,()=>{const r=runtime(age);try{
 const original=JSON.stringify(r.state());assert(r.trainer.start({routeIds:['balloon-'+age+'-animals']}));assert.equal(r.state().round.pops,1);assert.equal(r.trainer.getState().phase,'narrating');r.tick(0);assert.equal(r.state().round.pops,1);
 r.drain();assert.equal(r.praise.length,1);r.tick(0);assert.equal(r.state().round.pops,1,'praise owns the last word');r.praise[0].done();r.tick(0);assert.equal(r.state().round.pops,2);assert.equal(r.trainer.getState().viewedCount,1);assert.equal(r.praise[0].options.language,'ar');
 r.trainer.stop();assert.equal(JSON.stringify(r.state()),original,'demonstration did not write free or legacy coach progress');assert(r.events.every(e=>e.detail.practice_confirmed===false));
 }finally{r.close();}});
for(const age of ['1-4','4-8'])test('selected routes run in order and terminate, without fabricated practice: '+age,()=>{const r=runtime(age);try{
 assert(r.trainer.start({routeIds:['balloon-'+age+'-fruit','balloon-'+age+'-animals']}));assert.equal(r.trainer.getState().unitId,10);let n=0;while(r.trainer.isActive()){r.complete();if(++n>40)throw Error('Route failed to terminate');}
 assert.equal(n,age==='1-4'?24:36);assert.equal(r.trainer.getState().phase,'ended');assert.equal(r.trainer.getState().viewedCount,n);assert.equal(r.events.filter(e=>e.kind==='sessioncomplete').length,1);assert.equal(r.events.filter(e=>e.kind==='experienceviewed').length,n);assert.equal(r.state().round.pops,0);
 }finally{r.close();}});
test('pause, replay, manual mode, time budget and stale callbacks cannot advance a different session',()=>{const r=runtime();try{
 r.trainer.start({routeIds:['balloon-1-4-animals'],autoplay:false});assert.equal(r.state().round.pops,0);r.trainer.next();assert.equal(r.state().round.pops,1);r.drain();const late=r.praise.at(-1).done;r.trainer.pause();late();r.tick(0);assert.equal(r.state().round.pops,1);assert(r.trainer.getState().paused);
 r.trainer.resume();r.complete();assert.equal(r.state().round.pops,1,'manual mode remains on this discovery');r.trainer.setAuto(true);r.tick(0);assert.equal(r.state().round.pops,2);r.trainer.previous();assert.equal(r.state().round.pops,1);r.trainer.stop();
 r.trainer.start({routeIds:['balloon-1-4-animals'],duration_seconds:1});r.tick(1000);assert(!r.trainer.isActive());assert.equal(r.state().round.pops,0);
 }finally{r.close();}});
test('saved sessions require explicit resume and remain scoped to child and age',()=>{const r=runtime();let stored;try{
 r.trainer.start({routeIds:['balloon-1-4-fruit']});r.drain();r.praise.at(-1).done();r.trainer.pause();stored=r.storage();assert.equal(r.state().round.pops,1);
 r.w.APP360_SESSION.getProfile=()=>({user_id:'child-two'});r.w.document.dispatchEvent(new r.w.Event('app360:authchange'));assert(!r.trainer.isActive());assert.equal(r.state().round.pops,0);r.el('coachBtn').click();assert(r.el('teacherResumeSaved').hidden);
 }finally{r.close();}const reopened=runtime('1-4',stored);try{assert(!reopened.trainer.isActive());assert(reopened.trainer.start({resume:true,routeIds:['balloon-1-4-fruit']}));assert.equal(reopened.state().round.pops,2,'the next discovery resumes after the completed one');}finally{reopened.close();}
 const older=runtime('4-8',stored);try{assert.equal(older.trainer.start({resume:true}),false);assert.equal(older.state().round.pops,0);}finally{older.close();}
});
test('planner launch rejects mixed ages, invalid routes and an empty explicit selection',()=>{assert(!M.normalize({routeIds:[]},'1-4').ok);assert(!M.normalize({routeIds:['balloon-4-8-numbers']},'1-4').ok);assert(!M.normalize({routeIds:['bad']},'4-8').ok);const c=M.normalize('?launch_age=4-8&route_ids=balloon-4-8-numbers,balloon-4-8-animals&autoplay=1&caller=planner&launch_id=run-1','4-8');assert(c.ok);assert.deepEqual(c.unitIds,[3,4,5,9]);assert.equal(c.caller,'planner');assert.equal(c.launch_id,'run-1');assert.deepEqual(require('../data/coach-routes.json'),M.catalog());const r=runtime('1-4',null,'&action=session&route_ids=balloon-4-8-numbers&autoplay=1');try{assert(!r.trainer.isActive());assert(!r.el('teacherChooser').hidden);assert(r.el('teacherChoiceError').textContent);}finally{r.close();}});

test('letter journeys cover every Arabic and English letter for both ages',()=>{const C=require('../core.js');for(const age of ['1-4','4-8'])for(const language of ['ar','en']){const seen=new Set();for(const id of [6,7,8]){const s=C.settings({age,language,coach:true,level:3,stage:id%3}),r=C.create(s);while(!r.ended){const o=C.offers(r,s,1203)[0];seen.add(C.letters[language][o.item]);C.pop(r,s,o.id,1203);C.apply(r,r.active);}}assert.deepEqual(seen,new Set(C.letters[language]));}});

test('an invalid empty selection cannot start a session and controls localize after changing language',()=>{const r=runtime();try{r.el('settingsBtn').click();r.el('languageSelect').value='en';r.el('applySettings').click();assert(r.el('coachBtn').querySelector('img'));r.el('coachBtn').click();assert.equal(r.el('teacherStart').textContent,'Start a new journey');const input=r.el('teacherRoutes').querySelector('input:checked');input.checked=false;r.el('teacherStart').click();assert.equal(r.trainer.isActive(),false);assert(!r.el('teacherChooser').hidden);assert(r.el('teacherChoiceError').textContent);r.el('teacherClose').click();assert.equal(r.w.document.body.style.overflow,'');}finally{r.close();}});

test('a planner autoplay launch waits for identity restoration and starts under the settled child',()=>{const r=runtime('1-4',null,'&action=session&route_ids=balloon-1-4-animals&autoplay=1&pending_identity=1');try{assert(!r.trainer.isActive());r.tick(1000);assert(!r.trainer.isActive());assert.equal(r.state().round.pops,0);r.w.APP360_SESSION.isIdentityPending=()=>false;r.w.APP360_SESSION.getProfile=()=>({user_id:'restored-child'});r.w.document.dispatchEvent(new r.w.Event('app360:authchange'));r.tick(250);assert(r.trainer.isActive());assert.equal(r.state().round.pops,1);r.trainer.pause();assert(r.storage().some(([key])=>key==='app360:balloon-teacher:v1:user:restored-child:1-4'));assert(!r.storage().some(([key])=>key==='app360:balloon-teacher:v1:guest:1-4'));}finally{r.close();}});
