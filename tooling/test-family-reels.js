'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),catalog=JSON.parse(read('data/catalog.json'));
function setup(blocked=false){let profile='name:نور';const memory=new Map(),listeners={};const w={location:{protocol:'https:',host:'school.example',pathname:'/repo/commit/index.html'},localStorage:{getItem:k=>{if(blocked)throw Error('disabled');return memory.get(k)||null},setItem:(k,v)=>{if(blocked)throw Error('disabled');memory.set(k,v)}},APP360_FAMILY_SYNC:{getProfileKey:()=>profile,getSession:()=>({role:'none'})}};w.parent=w;
 const d={head:{appendChild(){}},createElement(tag){if(tag!=='a')return {};let out={};Object.defineProperty(out,'href',{set(v){const u=new URL(v,'https://school.example/repo/commit/index.html');for(const k of ['protocol','host','pathname','search'])out[k]=u[k]}});return out},addEventListener:(k,fn)=>listeners[k]=fn};vm.runInNewContext(read('assets/js/family-reels-v1.js'),{window:w,document:d});return{api:w.APP360_REELS,w,setProfile:x=>profile=x,listeners};}
test('all 32 user-supplied age, role and language destinations are exact and validated',()=>{const {api}=setup();const ids=new Set();assert.equal(catalog.external_apps.length,16);for(const age of catalog.age_groups.map(g=>g.id))for(const role of ['learner','coach']){const a=catalog.external_apps.find(x=>x.age_group===age&&x.reels_role===role);assert(a);assert(!ids.has(a.id));ids.add(a.id);assert.equal(a.href,`reels/index.html?age=${age}&role=${role}`);assert.equal(a.offline_mode,'online-required');assert(fs.existsSync(path.join(root,a.cover)));for(const lang of ['ar','en'])assert.equal(api.buildUrl(age,role,lang),`https://yem1.com/watch?age=${age}&role=${role}&lang=${lang}`)}for(const args of [['1-4','admin','ar'],['999','coach','en'],['4-8','coach','mixed'],['1-4&role=coach','learner','ar']])assert.equal(api.buildUrl(...args),'');});
test('language preference is profile-specific and survives denied storage in memory',()=>{for(const denied of [false,true]){const r=setup(denied);assert.equal(r.api.preferredLanguage(),'ar');r.api.setLanguage('en');r.setProfile('name:سارة');assert.equal(r.api.preferredLanguage(),'ar');r.setProfile('name:نور');assert.equal(r.api.preferredLanguage(),'en');assert.equal(r.api.setLanguage('invalid'),false)}});
test('catalog integration is idempotent and only our local bridge is intercepted',()=>{const {api}=setup();const c=JSON.parse(JSON.stringify(catalog));api.mergeCatalog(c);const n=c.apps.length;api.mergeCatalog(c);assert.equal(c.apps.length,n);assert.equal(n,catalog.apps.length+16);assert.equal(api.appFromHref('reels/index.html?age=4-8&role=coach').id,'reels-coach-4-8');assert.equal(api.appFromHref('https://evil.example/repo/commit/reels/index.html?age=4-8&role=coach'),null);assert.equal(api.appFromHref('reels/index.html?age=4-8&role=mixed'),null);});
test('School embedded in Reels removes only Reels integrations and blocks nested launches',()=>{const {api,w}=setup();w.APP360_INTEGRATION_CONTEXT={fromReels:true};const c=JSON.parse(JSON.stringify(catalog)),other={id:'other-addon',integration:'other'};c.external_apps.push(other);api.mergeCatalog(c);assert(c.apps.every(a=>a.integration!=='family-reels'));assert.equal(c.external_apps.length,1);assert.equal(c.external_apps[0].id,'other-addon');assert.equal(api.register(catalog.external_apps).length,0);assert.equal(api.launch(catalog.external_apps[0]),false);});
test('actual School header sends guests to central sign-in and retains the signed-in account panel',()=>{let identity=null,central=0,panels=0;const button={setAttribute(){}},s={getProfile:()=>identity,unifiedLogin:()=>central++,open:()=>panels++},w={APP360_SESSION:s},d={readyState:'complete',addEventListener(){},getElementById:id=>id==='portalAccountBtn'?button:null,querySelector:()=>null};vm.runInNewContext(read('assets/js/app360-login-entry-v2.js'),{window:w,document:d,setInterval:()=>0,setTimeout:fn=>fn()});button.onclick();assert.equal(central,1);assert.equal(panels,0);identity={display_name:'Child'};button.onclick();assert.equal(central,1);assert.equal(panels,1);});
test('role selection preserves family restrictions and uses an adult planner cover',()=>{const {api,w}=setup();w.APP360_FAMILY_SYNC.getSession=()=>({role:'guest',adminRole:'member'});w.APP360_FAMILY_SYNC.getPolicy=()=>({mode:'locked',selected:'reels-learner-1-4'});assert.equal(api.roleAllowed('1-4','learner'),true);assert.equal(api.roleAllowed('1-4','coach'),false);w.APP360_FAMILY_SYNC.getPolicy=()=>({mode:'guided',allowed:['reels-coach-4-8']});assert.equal(api.roleAllowed('4-8','coach'),true);assert.equal(api.roleAllowed('1-4','coach'),false);const planner=catalog.apps.find(a=>a.id==='a1-plan-runner');assert.equal(planner.cover,'assets/covers/trainer-session-planner-v2-640.webp');assert.equal(planner.requires_adult_confirmation,true);assert.ok(fs.statSync(path.join(root,planner.cover)).size<150000);});
test('native launcher starts immediately with tools collapsed on school and preview origins',()=>{
 const {w}=setup(),els={},buttons=['ar','en'].map(lang=>({getAttribute:()=>lang,setAttribute(){}}));
 const el=id=>els[id]||(els[id]={value:'',hidden:false,style:{display:'none'},setAttribute(){},getAttribute(k){return this[k]||null},removeAttribute(){}});
 const d={getElementById:el,querySelectorAll:()=>buttons};
 w.location={hostname:'school.yem1.com',protocol:'https:',search:'?age=1-4&role=learner'};w.navigator={onLine:true};w.XMLHttpRequest=function(){this.open=function(){};this.send=function(){}};el('reelsFormat').value='auto';el('reelsTopTools').style.display='none';
 vm.runInNewContext(read('assets/js/family-reels-launcher-v1.js'),{window:w,document:d,setTimeout:fn=>fn()});
 assert.match(el('reelsFrame').src,/yem1.com\/watch\?age=1-4&role=learner/);assert.equal(el('reelsIntro').style.display,'none');assert.equal(el('reelsTopTools').style.display,'none');
 el('reelsToolsToggle').onclick();assert.equal(el('reelsTopTools').style.display,'block');el('reelsQuickSettings').onclick();assert.equal(el('reelsIntro').style.display,'block');assert.equal(el('reelsFrame').src.includes('yem1.com'),true,'settings retain playback');el('reelsOpen').onclick({preventDefault(){}});assert.equal(el('reelsIntro').style.display,'none');
});
test('legacy taps open a real same-tab page without registration in family sync',()=>{
 const {w,api,listeners}=setup();w.navigator={userAgent:'Mozilla/5.0 (Linux; Android 4.4.2; DMTAB-NV20A)'};
 let delegated=0;w.APP360_FAMILY_SYNC.openApp=()=>{delegated++};w.APP360_FAMILY_SYNC.apps=[];w.APP360_FAMILY_SYNC.canNavigate=()=>false;
 const link={getAttribute:k=>k==='href'?'reels/index.html?age=4-8&role=learner':null,parentNode:null};
 assert(api.appFromHref('reels/index.html?age=4-8&role=learner'),'valid destination does not depend on registration');
 const event=(x,y)=>({target:link,touches:[{clientX:x,clientY:y}],changedTouches:[{clientX:x,clientY:y}],preventDefault(){},stopImmediatePropagation(){}});
 listeners.touchstart(event(30,30));listeners.touchend(event(35,32));assert.match(w.location.href,/reels\/index.html\?age=4-8&role=learner&autoplay=1&legacy=1/);assert.equal(delegated,0);
});
test('swiping over a Reels card must never trigger its synthetic click',()=>{
 const {w,listeners}=setup();w.navigator={userAgent:'Android 4.4.2'};
 const link={getAttribute:k=>k==='href'?'reels/index.html?age=1-4&role=learner':null};const e=x=>({target:link,touches:[{clientX:x,clientY:10}],changedTouches:[{clientX:x,clientY:10}],preventDefault(){},stopImmediatePropagation(){}});
 listeners.touchstart(e(10));listeners.touchmove(e(90));listeners.touchend(e(90));listeners.click(e(90));assert.equal(w.location.href,undefined);
});
test('direct launch still checks family policy before any navigation',()=>{
 const {w,api}=setup();w.navigator={userAgent:'Android 4.4.2'};w.APP360_FAMILY_SYNC.getSession=()=>({role:'guest'});w.APP360_FAMILY_SYNC.getPolicy=()=>({mode:'locked',selected:'reels-learner-1-4'});
 assert.equal(api.launch({id:'reels-coach-4-8',age_group:'4-8',reels_role:'coach'}),false);assert.equal(w.location.href,undefined);
});

test('standalone return button on old Android uses same-tab navigation',()=>{
 const w={APP360_SESSION:{},navigator:{userAgent:'Android 4.4.2'},location:{pathname:'/apps/1-4/example/index.html'},open(){throw Error('old tablet must not depend on popups')}};w.parent=w;
 const d={readyState:'loading',addEventListener(){},documentElement:{lang:'ar'}};
 vm.runInNewContext(read('assets/js/reels-bridge-v1.js'),{window:w,document:d,location:w.location});w.APP360_REELS_BRIDGE.returnToReels();assert.equal(w.location.href,'/reels-return.html?lang=ar');
});

test('old Android opens the full workspace when it is ready',()=>{
 const {w,api}=setup();w.navigator={userAgent:'Android 4.4.2'};let launch=null;w.APP360_REELS_WORKSPACE={open(f){launch=f;return true}};assert.equal(api.launch({id:'reels-learner-4-8',age_group:'4-8',reels_role:'learner'}),true);assert.equal(w.location.href,undefined);assert.equal(launch.autoplay,true);assert.equal(launch.age,'4-8');
});
