'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),os=require('node:os'),path=require('node:path');
const cookie=require('../services/app360-data-core/src/browser-session');
const TOKEN='a'.repeat(64),expiry=new Date(Date.now()+3600000).toISOString();
function ConfirmedXHR(){this.open=function(){};this.setRequestHeader=function(){};this.send=function(){this.status=200;this.responseText=JSON.stringify({token:'confirmed-test-session',profile:{user_id:'test-child',display_name:'نور',role:'learner'}});this.onload()}}

test('host-only secure HttpOnly cookie has bounded expiry and cannot inject headers',()=>{
 const headers={},res={setHeader:(k,v)=>headers[k]=v};cookie.write(res,TOKEN,expiry);assert.match(headers['Set-Cookie'],/__Host-app360_session=.*; Path=\/; HttpOnly; Secure; SameSite=Lax; Max-Age=/);assert(!headers['Set-Cookie'].includes('Domain='));assert.equal(cookie.read({headers:{cookie:'other=x; __Host-app360_session='+TOKEN}}),TOKEN);
 cookie.clear(res);assert.match(headers['Set-Cookie'],/Max-Age=0$/);cookie.write(res,'x\r\nBad: true',expiry);assert.match(headers['Set-Cookie'],/Max-Age=0$/);
 assert.equal(cookie.sameOrigin({headers:{host:'school.test',origin:'https://evil.test'}}),false);
 assert.equal(cookie.sameOrigin({headers:{host:'school.test','sec-fetch-site':'cross-site'}}),false);
 assert.equal(cookie.sameOrigin({headers:{host:'school.test',origin:'https://school.test','sec-fetch-site':'same-origin'}}),true);
});
function endpoint(){let revoked=false,authorized=0;const current={session:{source:'safe-reels-360',expires_at:expiry},user:{id:'child',display_name:'نور',role:'learner'},account_id:'family'};
 const fakeDb={destroy:async()=>{}};const sessions={findIdentitySession:async(db,t)=>!revoked&&t===TOKEN?current:null};
 const requires={'http':{createServer:()=>({})},'url':require('node:url'),'./index':{db:{requestDb:async()=>fakeDb,releaseRequestDb:async db=>db.destroy()}},'./session-repository':sessions,'./demo-auth':{},'./safe-reels-adapter':{},'./file-store':{createFileStore:()=>({})},'./reels-bridge':{authorize:async()=>authorized++},'./celebration-service':{createCelebrationService:()=>({})},'./browser-session':cookie};
 const module={exports:{}};vm.runInNewContext(fs.readFileSync('services/app360-data-core/src/http-server.js','utf8'),{require:Object.assign(n=>requires[n],{main:null}),module,process:{env:{}},URL,Buffer,console,setInterval});
 return{revoke:()=>revoked=true,authorized:()=>authorized,call:async(headers)=>{const res={headers:{},setHeader(k,v){this.headers[k]=v},end(s){this.body=JSON.parse(s)}};await module.exports.handler({url:'/api/app360/auth/session',method:'GET',headers:{host:'school.test',...headers}},res);return res}};
}
test('does not substitute a cookie for an explicitly rejected bearer; restores matching cookie identity; rejects revoked and cross-origin sessions; no-store response',async()=>{
 const x=endpoint();let r=await x.call({cookie:'__Host-app360_session='+TOKEN,authorization:'Bearer old-token'});assert.equal(r.statusCode,401);r=await x.call({cookie:'__Host-app360_session='+TOKEN});assert.equal(r.statusCode,200);assert.equal(r.body.profile.display_name,'نور');assert.equal(r.body.token,TOKEN);assert.equal(r.headers['Cache-Control'],'no-store');assert.equal(x.authorized(),1);
 r=await x.call({cookie:'__Host-app360_session='+TOKEN,'sec-fetch-site':'cross-site'});assert.equal(r.statusCode,403);assert.equal(r.body.token,undefined);
 x.revoke();r=await x.call({cookie:'__Host-app360_session='+TOKEN});assert.equal(r.statusCode,401);assert.equal(r.headers['Set-Cookie'],undefined,'background checks must not erase a newer login cookie');
});
test('hosting .env loads before startup and never overwrites injected platform values',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'a360-env-')),file=path.join(dir,'.env'),key='APP360_ENV_LOADER_TEST';
 fs.writeFileSync(file,key+'="loaded"\nAPP360_ENV_INJECTED_TEST=from-file\n');process.env.APP360_ENV_INJECTED_TEST='from-platform';
 try{require('../services/family-relay/src/load-env').load(file);assert.equal(process.env[key],'loaded');assert.equal(process.env.APP360_ENV_INJECTED_TEST,'from-platform')}finally{delete process.env[key];delete process.env.APP360_ENV_INJECTED_TEST;fs.rmSync(dir,{recursive:true})}
});
function client(){const events={},winEvents={},requests=[],saved={},session={},d={title:'School',readyState:'loading',hidden:false,addEventListener:(n,f)=>events[n]=f,getElementById:()=>null,createElement:()=>({}),head:{appendChild(){}},createEvent:()=>({initCustomEvent(){}}),dispatchEvent:()=>{}};
 function XHR(){requests.push(this);this.open=(m,p)=>this.url=p;this.setRequestHeader=()=>{};this.send=()=>{};this.respond=(status,data)=>{this.status=status;this.responseText=JSON.stringify(data);this.readyState=4;this.onreadystatechange()}}
 const w={location:{pathname:'/index.html'},navigator:{onLine:true},localStorage:{getItem:k=>saved[k],setItem:(k,v)=>saved[k]=v},sessionStorage:{getItem:k=>session[k],setItem:(k,v)=>session[k]=v,removeItem:k=>delete session[k]},addEventListener:(n,f)=>winEvents[n]=f};vm.runInNewContext(fs.readFileSync('assets/js/app360-session-v1.js','utf8'),{window:w,document:d,XMLHttpRequest:XHR,setInterval(){},setTimeout(){},clearTimeout(){},Date,JSON});events.DOMContentLoaded();return{api:w.APP360_SESSION,requests,session,events,winEvents,saved}};
test('installed app restores on initial load and foreground; expiry clears identity; older responses cannot erase a newer login',()=>{
 const c=client(),p={user_id:'child-1',display_name:'نور',role:'learner'};assert.match(c.requests[0].url,/auth\/session$/);c.requests[0].respond(200,{token:TOKEN,profile:p});assert.equal(c.api.getProfile().display_name,'نور');assert.equal(JSON.parse(c.session['app360:auth-token:v1']),TOKEN);assert.equal(c.saved['app360:auth-token:v1'],undefined,'bearer must not enter localStorage');
 c.winEvents.focus();const old=c.requests.at(-1);c.api.acceptBridgeSession({token:'b'.repeat(64),profile:{...p,user_id:'child-2',display_name:'علي'}});old.respond(401,{});assert.equal(c.api.getProfile().display_name,'علي');
 c.winEvents.focus();c.requests.at(-1).respond(401,{});assert.equal(c.api.isAuthenticated(),false);assert.equal(c.session['app360:auth-token:v1'],undefined);
 c.winEvents.storage({key:'app360:auth-signal:v1'});c.requests.at(-1).respond(200,{token:TOKEN,profile:p});assert.equal(c.api.getProfile().display_name,'نور');
});
test('installed mode keeps its original window and callback closes the login popup even with cloned request state',()=>{
 const storage={},popup={},location={protocol:'https:',host:'school.test',pathname:'/index.html',search:'?age=1-4',hash:''},events={};let opened='',accepted=null,closed=0;
 const w={APP360_SESSION:{isAuthenticated:()=>false,acceptBridgeSession:v=>accepted=v,close(){}},navigator:{standalone:true},crypto:{getRandomValues:a=>a.fill(1234567890)},sessionStorage:{setItem:(k,v)=>storage[k]=v},addEventListener:(n,f)=>events[n]=f,open:(url)=>{opened=url;return popup},focus(){}};
 vm.runInNewContext(fs.readFileSync('assets/js/unified-login-v1.js','utf8'),{window:w,document:{},location,Uint32Array,setInterval:()=>1,setTimeout:()=>1,clearInterval(){},clearTimeout(){}});w.APP360_SESSION.unifiedLogin();assert.equal(location.href,undefined);const back=new URL(new URL(opened).searchParams.get('return'));assert.equal(back.searchParams.get('popup'),'1');events.message({source:popup,origin:'https://school.test',data:{type:'app360:auth-complete',version:1,request:storage['app360:signin-request:v1'],session:{token:TOKEN,profile:{display_name:'نور'}}}});assert.equal(accepted.profile.display_name,'نور');
 const callbackLocation={search:back.search,protocol:'https:',host:'school.test',replace(){throw Error('Popup must not navigate the original app')}};
 const ss={'app360:auth-token:v1':JSON.stringify(TOKEN),'app360:auth-profile:v1':'{"display_name":"نور"}','app360:signin-request:v1':back.searchParams.get('request')};let posted=null;
 vm.runInNewContext(fs.readFileSync('assets/js/auth-complete-v1.js','utf8'),{XMLHttpRequest:ConfirmedXHR,location:callbackLocation,history:{replaceState(){callbackLocation.search=''}},sessionStorage:{getItem:k=>ss[k],removeItem:k=>delete ss[k]},localStorage:{setItem(){}},opener:{postMessage:(m)=>posted=m},window:{close:()=>closed++},document:{getElementById:()=>({})},Date,JSON});assert.equal(posted.request,back.searchParams.get('request'));assert.equal(closed,1);
});


test('popup callback without an opener retains popup mode after clearing its URL',()=>{
 const state={'app360:auth-token:v1':JSON.stringify(TOKEN),'app360:auth-profile:v1':'{"display_name":"نور"}','app360:signin-request:v1':'request-1234567890'};
 const status={},location={search:'?request=request-1234567890&popup=1&next=%2Findex.html',replace(){throw Error('Detached popup must not navigate')}};let closed=0;
 vm.runInNewContext(fs.readFileSync('assets/js/auth-complete-v1.js','utf8'),{XMLHttpRequest:ConfirmedXHR,location,history:{replaceState(){location.search=''}},sessionStorage:{getItem:k=>state[k],removeItem:k=>delete state[k]},localStorage:{setItem(){}},opener:null,window:{close:()=>closed++},document:{getElementById:()=>status},Date,JSON});
 assert.equal(closed,1);assert.match(status.textContent,/العودة إلى تطبيق المدرسة/);
});
