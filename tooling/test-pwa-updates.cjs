'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),crypto=require('node:crypto');
const root='https://school.test/',prefix='app360-offline-'+encodeURIComponent('/')+'-';
function cacheStorage(){const stores=new Map();return {keys:async()=>[...stores.keys()],delete:async n=>stores.delete(n),open:async n=>{if(!stores.has(n))stores.set(n,new Map());const rows=stores.get(n);return {match:async u=>{const r=rows.get(typeof u==='string'?u:u.url);return r&&r.clone()},put:async(u,r)=>{rows.set(typeof u==='string'?u:u.url,r.clone())},keys:async()=>[...rows.keys()].map(u=>new Request(u))}}}}
const digest=s=>crypto.createHash('sha256').update(s).digest('hex');
async function manager({app='',playing=false}={}){
 const caches=cacheStorage(),events={},timers=[],intervals=[],elements={},requests=[],files={},s={};let offline=false,broken='';
 const apps=['a','b'].map(id=>{const path='apps/1-4/'+id+'/',body='new-'+id,rows=[{path:path+'index.html',bytes:body.length,sha256:digest(body)}];files[root+path+'index.html']=body;files[root+'data/offline/'+id+'.json']=JSON.stringify({version:'new-'+id,files:rows});s[id]={version:'old',cache:prefix+id+'-old',directory:path,count:1};return {id,title:id,directory:path,entry:path+'index.html',version:'new-'+id,manifest:'data/offline/'+id+'.json',bytes:body.length,count:1}});
 files[root+'data/offline-catalog.json']=JSON.stringify({apps,ages:[]});
 await(await caches.open(prefix+'meta-v1')).put(root+'__offline_state__',new Response(JSON.stringify(s)));
 for(const a of apps){const c=await caches.open(s[a.id].cache);await c.put(root+a.entry,new Response('old'));await c.put(root+'__offline_complete__',new Response('{}'))}
 function element(){return {style:{},setAttribute(){},appendChild(n){if(n.id)elements[n.id]=n}}}
 const d={hidden:false,currentScript:{src:root+'assets/js/offline-manager-v2.js'},head:element(),body:element(),getElementById:id=>elements[id]||null,createElement:element,querySelector:()=>null,querySelectorAll:()=>[],addEventListener:(n,f)=>events['document:'+n]=f};
 let reloads=0;const location={href:root+(app?'apps/1-4/'+app+'/index.html':'index.html'),hash:'',reload(){reloads++}};
 const storage={getItem:()=>null,setItem(){},removeItem(){}};
 const navigator={onLine:true,serviceWorker:{getRegistrations:async()=>[]}};
 const fetch=async u=>{u=String(u).split('?')[0];requests.push(u);if(offline||u===broken)throw Error('network failure');return new Response(files[u]||'',{status:u in files?200:404})};
 const w={caches,isSecureContext:true,Promise,fetch,crypto:crypto.webcrypto,TextDecoder,TextEncoder,location,addEventListener:(n,f)=>events[n]=f,APP360_FAMILY_SHELL:{getActiveApp:()=>playing?{id:'lesson'}:null}};
 vm.runInNewContext(fs.readFileSync('assets/js/offline-manager-v2.js','utf8'),{window:w,document:d,navigator,location,caches,fetch,crypto:crypto.webcrypto,URL,Response,Headers,Promise,Date,Uint8Array,TextDecoder,TextEncoder,localStorage:storage,setTimeout:f=>(timers.push(f),timers.length),clearTimeout(){},setInterval:f=>intervals.push(f),alert(){}});
 // Yield to async CacheStorage / response operations; timers are advanced explicitly.
 async function flush(){for(let i=0;i<100;i++){await new Promise(r=>setTimeout(r,2));while(timers.length)timers.shift()()}}
 await flush();return {api:w.APP360_OFFLINE,apps,requests,elements,events,caches,flush,reloads:()=>reloads,setOffline(v){offline=v;navigator.onLine=!v},fail(id){broken=id?root+'apps/1-4/'+id+'/index.html':''},setPlaying(v){playing=v}};
}
test('automatic entry updates every installed app and reloads the idle portal once',async()=>{const h=await manager();assert.equal(h.api.status('a').version,'new-a');assert.equal(h.api.status('b').version,'new-b');assert.equal(h.reloads(),1)});
test('an open lesson defers updates; closing it schedules a full update',async()=>{const h=await manager({playing:true});assert.equal(h.api.status('a').version,'old');assert.equal(h.reloads(),0);h.setPlaying(false);h.events['document:app360:shellchange']();await h.flush();assert.equal(h.api.status('a').version,'new-a');assert.equal(h.reloads(),1)});
test('standalone apps update their own bundle and offer reload without interrupting the child',async()=>{const h=await manager({app:'a'});assert.equal(h.api.status('a').version,'new-a');assert.equal(h.api.status('b').version,'old');assert.equal(h.reloads(),0);assert(h.elements.app360UpdateReady);h.elements.app360UpdateReady.onclick();assert.equal(h.reloads(),1)});
test('a failed app keeps its old complete copy while the next app updates; retry recovers',async()=>{const h=await manager({playing:true});h.fail('a');const resultPromise=h.api.refresh();await h.flush();const result=await resultPromise;assert.equal(result.ok,false);assert.equal(result.updated,1);assert.equal(result.failed[0].id,'a');assert.equal(h.api.status('a').version,'old');assert.equal(h.api.status('b').version,'new-b');h.fail('');const retry=h.api.refresh();await h.flush();assert.equal((await retry).ok,true);assert.equal(h.api.status('a').version,'new-a')});
test('offline checks preserve installed versions and reconnect triggers automatic recovery',async()=>{const h=await manager({playing:true});h.setPlaying(false);h.setOffline(true);h.events['document:app360:shellchange']();await h.flush();assert.equal(h.api.status('a').version,'old');h.setOffline(false);h.events.online();await h.flush();assert.equal(h.api.status('a').version,'new-a');assert.equal(h.reloads(),1)});
test('shared update controls and portal HTML bypass old app bundles; content and offline fallbacks remain local',async()=>{
 const caches=cacheStorage(),handlers={},pending=[];let offline=false,network=0;
 const cache=await caches.open('installed');const s={a:{directory:'apps/1-4/a/',cache:'installed'}};
 await(await caches.open(prefix+'meta-v1')).put(root+'__offline_state__',new Response(JSON.stringify(s)));
 const paths=['assets/js/offline-manager-v2.js','assets/js/offline-client-v1.js','assets/js/integration-context-v1.js','assets/js/family-reels-v1.js','index.html','apps/1-4/a/app.js'];for(const p of paths)await cache.put(root+p,new Response('old:'+p));
 const self={APP360_OFFLINE_ROOT:'../../../',location:{href:root+'apps/1-4/a/sw.js',origin:new URL(root).origin},registration:{scope:root+'apps/1-4/a/'},addEventListener:(n,f)=>handlers[n]=f};
 vm.runInNewContext(fs.readFileSync('assets/js/offline-worker-v1.js','utf8'),{self,caches,URL,Request,Response,Headers,Promise,fetch:async r=>{network++;if(offline)throw Error();return new Response('new:'+new URL(r.url).pathname)}});
 async function get(p){let response;handlers.fetch({request:new Request(root+p),respondWith:r=>response=r,waitUntil:r=>pending.push(r)});return response&&await(await response).text()}
 for(const p of paths.slice(0,-1))assert.equal(await get(p),'new:/'+p,p);
 assert.equal(await get(paths.at(-1)),'old:'+paths.at(-1));const before=network;assert.equal(await get('api/profile.json'),undefined);assert.equal(network,before);
 await Promise.all(pending);offline=true;assert.equal(await get('assets/js/family-reels-v1.js'),'new:/assets/js/family-reels-v1.js');assert.equal(await get(paths.at(-1)),'old:'+paths.at(-1));
});
test('the bottom Reels entry is outside the hidden footer, launches the selected age and hides only inside Reels',()=>{
 for(const embedded of [false,true]){
  const els={},listeners={},calls=[];
  function node(tag){const n={tagName:tag,style:{},children:[],setAttribute(k,v){this[k]=v},getAttribute(k){return this[k]},appendChild(c){this.children.push(c);c.parentNode=this;if(c.id)els[c.id]=c},insertBefore(c){this.appendChild(c)}};return n}
  const body=node('body'),showcase=node('section');showcase.id='homeShowcase';body.appendChild(showcase);els.portalReelsBtn=node('button');
  const d={readyState:'complete',body,head:node('head'),getElementById:id=>els[id]||null,createElement:node,querySelector:q=>q==='#showcaseAges button.on'?{getAttribute:()=> '4-8'}:null,addEventListener:(n,f)=>listeners[n]=f};
  const w={APP360_INTEGRATION_CONTEXT:{fromReels:embedded},location:{pathname:'/index.html',search:'',protocol:'https:',host:'school.test'},navigator:{},APP360_REELS_WORKSPACE:{open:f=>(calls.push(f),true)}};
  vm.runInNewContext(fs.readFileSync('assets/js/family-reels-v1.js','utf8'),{window:w,document:d});
  const bottom=els.schoolReelsFooterBtn;assert(bottom);assert.equal(bottom.parentNode.id,'schoolReelsEntry');assert.equal(bottom.hidden,embedded);assert.equal(els.portalReelsBtn.hidden,embedded);assert.equal(bottom.parentNode.style.display,embedded?'none':'block');bottom.onclick({preventDefault(){}});assert.equal(calls.length,embedded?0:1);if(!embedded)assert.equal(calls[0].age,'4-8');
 }
});
test('every downloadable standalone app loads the versioned common automatic update client',()=>{for(const a of require('../data/offline-catalog.json').apps)assert.match(fs.readFileSync(a.entry,'utf8'),/offline-client-v1\.js\?v=[^"\']+/,a.id)});

test('an application download can report measured file and byte progress to its own screen',async()=>{const f=await manager(),progress=[];const downloading=f.api.downloadApp('a',{onProgress:row=>progress.push(row)});await f.flush();assert.equal(await downloading,true);assert(progress.length>0);const last=progress.at(-1);assert.equal(last.bytes,f.apps[0].bytes);assert.equal(last.totalBytes,f.apps[0].bytes);assert.equal(last.count,1);assert.equal(last.totalCount,1);});
