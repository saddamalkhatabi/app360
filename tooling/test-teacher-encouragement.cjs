'use strict';
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync('assets/js/teacher-encouragement-v1.js','utf8');
function fixture(){let current={entitlements:{named_encouragement:true},user_id:'child-1',display_name:'نور',role:'learner'},auth=true,clips=[],requests=[],captions=[],done=0,events={},timers=new Map(),id=0;
 const w={APP360_SESSION:{isAuthenticated:()=>auth,getProfile:()=>current},addEventListener(){},Audio:function(src){this.src=src;this.pause=()=>{};this.play=()=>{clips.push(this)}},XMLHttpRequest:function(){this.open=()=>{};this.send=()=>requests.push(this);this.abort=()=>{};}};
 const d={getElementsByTagName:()=>[],addEventListener:(name,fn)=>events[name]=fn};vm.runInNewContext(source,{window:w,document:d,setTimeout:(fn)=>{timers.set(++id,fn);return id},clearTimeout:n=>timers.delete(n)});
 function names(){let r=requests.at(-1);r.status=200;r.responseText=JSON.stringify({records:[{name:'نور',aliases:['Noor'],gender:'girl',audio:{path:'audio/names/name-1.mp3',sha256:'abc'}}]});r.onload()}
 return{w,clips,requests,captions,events,timers,names,play:()=>w.APP360_TEACHER_ENCOURAGEMENT.play({language:'ar',caption:t=>captions.push(t)},()=>done++),get done(){return done},switch:()=>{current={user_id:'child-2',display_name:'علي',role:'learner'};events['app360:authchange']()},guest:()=>auth=false,parent:()=>current.role='parent',expired:()=>current.entitlements.named_encouragement=false,missing:()=>delete current.entitlements,expiredDate:()=>current.entitlements.ends_at='2000-01-01T00:00:00Z'};
}
let f=fixture();f.play();assert.equal(f.clips.length,0);f.names();assert.match(f.clips[0].src,/well-done-name-f/);assert.equal(f.done,0);f.clips[0].onended();assert.match(f.clips[1].src,/name-1.mp3/);assert.equal(f.done,0);f.clips[1].onended();assert.equal(f.done,1);assert.equal(f.timers.size,0);assert(f.captions.includes('أحسنت يا نور!'));
f=fixture();f.play();const late=f.requests[0].onload;f.switch();late();assert.equal(f.clips.length,0);assert.equal(f.done,0);
f=fixture();f.play();f.names();const old=f.clips[0].onended;f.w.APP360_TEACHER_ENCOURAGEMENT.stop();old();assert.equal(f.clips.length,1);assert.equal(f.done,0);assert.equal(f.timers.size,0);
for(const mode of ['guest','parent','expired','missing','expiredDate']){f=fixture();f[mode]();f.play();assert.equal(f.requests.length,0);assert.match(f.clips[0].src,/well-done-m.mp3/);assert(!f.captions.some(s=>s.includes('نور')));f.clips[0].onended();assert.equal(f.done,1)}
f=fixture();f.play();f.requests[0].onerror();assert.match(f.clips[0].src,/well-done-m.mp3/);f.clips[0].onerror();assert.equal(f.done,1);
const W=require('../apps/4-8/wonder-experiment-lab/src/watch.js');let read,encourage,next,scheduled=[];
const q=W.create({setTimeout:fn=>(scheduled.push(fn),scheduled.length),clearTimeout(){},stop(){},render(){},blocked(){},lastStage:()=>0,speak:(s,done)=>read=done,encourage:(s,done)=>{encourage=s;next=done}});
q.start(['one','two']);read();scheduled.shift()();assert.equal(q.snapshot().id,'one');assert(q.snapshot().encouraging);assert(encourage);next();assert.equal(q.snapshot().id,'two');q.pause();next();assert(!q.snapshot().running);
console.log('PASS: name clips are sequential; guests/parents remain anonymous; logout, pause and stale callbacks cancel; failed audio completes; transitions wait for encouragement.');
