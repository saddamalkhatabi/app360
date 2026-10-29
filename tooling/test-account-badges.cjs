'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {JSDOM}=require((process.env.APP360_TEST_MODULES||'/tmp/unified-identity-test/node_modules')+'/jsdom');
function fixture({active=false,admin=false,enabled=true}={}){
 const dom=new JSDOM('<!doctype html><body></body>',{url:'https://school.yem1.com/'+(admin?'admin/':'index.html'),pretendToBeVisual:true}),w=dom.window,timers=new Map(),intervals=[],opened=[];
 let now=0,next=0,profile=active?{user_id:'child',external:true}:null,quota={active,allowed:true,remaining_seconds:active?null:600,ends_at:active?'2026-12-01T00:00:00Z':null};
 w.setTimeout=(fn,ms)=>{timers.set(++next,{fn,at:now+ms});return next;};w.clearTimeout=id=>timers.delete(id);
 w.setInterval=fn=>{intervals.push(fn);return intervals.length;};
 w.FamilyAccountPanel={open:o=>opened.push(o),isOpen:()=>false};
 w.APP360_SESSION={getProfile:()=>profile,isUsageActive:()=>true,pauseActivity(){},refresh(){},bridgeRequest(method,path,body,cb){cb(200,{membership:quota});}};
 function XHR(){this.open=(m,url)=>this.url=url;this.setRequestHeader=()=>{};this.send=()=>{this.status=200;this.responseText=JSON.stringify(this.url==='/api/identity/config'?{enabled}:{});this.onload();};}
 const context=vm.createContext({window:w,document:w.document,XMLHttpRequest:XHR,location:w.location,Date,setInterval:w.setInterval});
 for(const name of ['membership-v1','yem1-login-v1'])vm.runInContext(fs.readFileSync('assets/js/'+name+'.js','utf8'),context);
 w.document.dispatchEvent(new w.Event('DOMContentLoaded'));
 return{dom,w,opened,get quota(){return quota;},setQuota(q){quota={...quota,...q};w.APP360_MEMBERSHIP.pulse();},advance(ms){now+=ms;for(const [id,t] of [...timers])if(t.at<=now){timers.delete(id);t.fn();}},button:w.document.getElementById('app360MembershipBadge'),login:w.document.getElementById('app360UnifiedLogin')};
}
for(const active of [false,true])test((active?'subscriber':'guest')+' summary collapses after five seconds, stays compact on quota refresh and reopens on tap',()=>{
 const f=fixture({active});try{
 assert.equal(f.button.getAttribute('aria-expanded'),'true');
 assert.match(f.button.textContent,active?/موعد التجديد/:/زائر/);
 f.advance(4999);assert.equal(f.button.getAttribute('aria-expanded'),'true');
 f.advance(1);assert.equal(f.button.getAttribute('aria-expanded'),'false');
 assert.equal(f.button.querySelector('[data-member-summary]').style.display,'none');
 f.setQuota({remaining_seconds:500});assert.equal(f.button.getAttribute('aria-expanded'),'false');
 f.button.click();assert.equal(f.button.getAttribute('aria-expanded'),'true');assert.equal(f.opened.length,0);
 f.button.click();assert.equal(f.opened.length,1);
 f.advance(5000);assert.equal(f.button.getAttribute('aria-expanded'),'false');
 }finally{f.dom.window.close();}
});
test('quota expiry still blocks play and a changed subscription is announced for a fresh five seconds',()=>{
 const f=fixture();try{f.advance(5000);f.setQuota({allowed:false,remaining_seconds:0});assert.match(f.w.document.body.textContent,/اكتمل وقت الاستخدام/);assert.equal(f.button.getAttribute('aria-expanded'),'true');f.advance(5000);f.setQuota({active:true,allowed:true,remaining_seconds:null});assert.doesNotMatch(f.w.document.body.textContent,/اكتمل وقت الاستخدام/);assert.equal(f.button.getAttribute('aria-expanded'),'true');}finally{f.dom.window.close();}
});
for(const admin of [false,true])test((admin?'admin':'learner')+' unified entry keeps its SSO scope while collapsing opposite the quota badge',()=>{
 const f=fixture({admin});try{
 assert.equal(f.login.getAttribute('href'),'/sso/start?scope='+(admin?'admin':'viewer'));
 assert.equal(f.login.style.left,'12px');assert.equal(f.button.style.right,'12px');
 f.advance(4999);assert.equal(f.login.getAttribute('aria-expanded'),'true');f.advance(1);assert.equal(f.login.getAttribute('aria-expanded'),'false');
 const event=new f.w.MouseEvent('click',{bubbles:true,cancelable:true});assert.equal(f.login.dispatchEvent(event),false);assert.equal(f.login.getAttribute('aria-expanded'),'true');
 assert.equal(f.login.getAttribute('href'),'/sso/start?scope='+(admin?'admin':'viewer'));
 f.advance(5000);assert.equal(f.login.getAttribute('aria-expanded'),'false');
 }finally{f.dom.window.close();}
});
test('disabled central identity does not add a dead login icon',()=>{const f=fixture({enabled:false});try{assert.equal(f.login,null);}finally{f.dom.window.close();}});
