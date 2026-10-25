'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const read=p=>fs.readFileSync(p,'utf8');
function ConfirmedXHR(){this.open=function(){};this.setRequestHeader=function(){};this.send=function(){this.status=200;this.responseText=JSON.stringify({token:'confirmed-test-session',profile:{user_id:'test-child',display_name:'نور',role:'learner'}});this.onload()}}

test('login keeps the current tab and original app, query and fragment; an existing session opens account',()=>{
 const saved={},location={protocol:'https:',host:'school.yem1.com',pathname:'/apps/1-4/drawing-writing-foundations/index.html',search:'?mode=draw',hash:'#board'};
 let authenticated=false,opened=0;const S={isAuthenticated:()=>authenticated,open:()=>opened++};
 const w={APP360_SESSION:S,crypto:{getRandomValues:a=>a.fill(23)},sessionStorage:{setItem:(k,v)=>saved[k]=v},addEventListener(){},open(){throw Error('Must not open a tab')}};
 vm.runInNewContext(read('assets/js/unified-login-v1.js'),{window:w,document:{},location,Uint32Array,encodeURIComponent,clearInterval(){},clearTimeout(){}});
 S.unifiedLogin();const back=new URL(new URL(location.href).searchParams.get('return'));assert.equal(back.pathname,'/auth-complete.html');assert.equal(back.searchParams.get('next'),location.pathname+location.search+location.hash);assert.equal(back.searchParams.get('request'),saved['app360:signin-request:v1']);
 location.href='unchanged';authenticated=true;S.unifiedLogin();assert.equal(opened,1);assert.equal(location.href,'unchanged');
});
test('same-tab callback returns to the original app even if window.opener exists; wrong nonce stays on callback',()=>{
 function run(request){const state={'app360:auth-token:v1':'"test-session"','app360:auth-profile:v1':'{"user_id":"test-child"}','app360:signin-request:v1':'request-123'},status={};
 let target='',messages=0;const location={search:'?request='+request+'&next='+encodeURIComponent('/apps/demo/index.html?mode=draw#board'),replace:v=>target=v};
 const ctx={XMLHttpRequest:ConfirmedXHR,location,history:{replaceState(){}},sessionStorage:{getItem:k=>state[k],removeItem:k=>delete state[k]},document:{getElementById:()=>status},opener:{postMessage:()=>messages++},window:{close(){}}};
 vm.runInNewContext(read('assets/js/auth-complete-v1.js'),ctx);return{target,messages,status};}
 const ok=run('request-123');assert.equal(ok.target,'/apps/demo/index.html?mode=draw#board');assert.equal(ok.messages,0);const fail=run('wrong');assert.equal(fail.target,'');assert.match(fail.status.textContent,/مطابقة/);
});
test('shared drawing praise uses authenticated learner identity, cancels a pending load at logout and keeps guests generic',()=>{
 let p={user_id:'test-child',display_name:'نور',role:'learner',entitlements:{active:true,named_encouragement:true,ends_at:new Date(Date.now()+3600000).toISOString()}},calls=[],scripts=[],audios=[],events={},stops=0;
 const w={APP360_SESSION:{isAuthenticated:()=>!!p,getProfile:()=>p},Audio:function(src){audios.push(src);this.pause=()=>{};this.play=()=>{}},addEventListener(){},speechSynthesis:{cancel(){}}};
 const d={getElementsByTagName:()=>[],createElement:()=>({}),head:{appendChild:s=>scripts.push(s)},addEventListener:(k,v)=>events[k]=v};
 vm.runInNewContext(read('resources/celebration-audio/player-v1.js'),{window:w,document:d,navigator:{userAgent:''},setTimeout:()=>1,clearTimeout(){}});
 let completed=false;w.App360Celebration.play({name:'اسم محلي مختلف'},ok=>completed=ok);assert.equal(audios.length,0);assert.equal(scripts.length,1);
 w.APP360_TEACHER_ENCOURAGEMENT={play:(o,done)=>calls.push([p.display_name,o,done]),stop:()=>stops++};scripts[0].onload();assert.equal(calls[0][0],'نور');calls[0][2]();assert.equal(completed,true);
 w.App360Celebration.play({kind:'creative'});assert.equal(calls[1][1].kind,'creative');
 p=null;events['app360:authchange']();assert(stops>0);w.App360Celebration.play({name:'نور'});assert.match(audios[0],/well-done-m.mp3$/);assert.equal(calls.length,2);
});
