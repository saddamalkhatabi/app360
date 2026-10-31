'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),source=fs.readFileSync(path.join(root,'assets/js/offline-worker-v1.js'),'utf8');
function deferred(){let resolve;const promise=new Promise(r=>resolve=r);return {promise,resolve};}
function harness(options={}){
 const handlers={},rows=new Map(),jobs=[];let full=0,active=0,peak=0,offline=false;
 const cache={match:async u=>rows.get(String(u))?.clone(),put:async(u,r)=>{if(options.quota)throw Error('QuotaExceededError');rows.set(String(u),new Response(await r.arrayBuffer(),{status:r.status,headers:r.headers}));}};
 const self={APP360_OFFLINE_ROOT:'./',location:{href:'https://school.test/sw.js',origin:'https://school.test'},registration:{scope:'https://school.test/'},clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(n,f)=>handlers[n]=f};
 vm.runInNewContext(source,{self,caches:{open:async()=>cache},URL,Request,Response,Headers,Promise,fetch:async req=>{
  if(offline)throw Error('offline');
  if(req.headers.has('Range'))return new Response(new Uint8Array([1,2]),{status:206,headers:{'Content-Range':'bytes 0-1/8'}});
  full++;active++;peak=Math.max(peak,active);
  try{if(options.gate)await options.gate.promise;if(options.failFirst&&full===1)throw Error('network failed');return new Response(new Uint8Array(8),{status:200});}finally{active--;}
 }});
 async function request(name='one.mp4'){
  let response;handlers.fetch({request:new Request('https://school.test/'+name,{headers:{Range:'bytes=0-1'}}),respondWith:p=>response=p,waitUntil:p=>jobs.push(p)});return response;
 }
 return {request,handlers,jobs,rows,offline:()=>{offline=true;},stats:()=>({full,peak}),settle:()=>Promise.all(jobs)};
}
test('duplicate range requests return promptly and share one optional full download',async()=>{
 const gate=deferred(),h=harness({gate});
 const replies=await Promise.all(Array.from({length:7},()=>h.request()));
 assert.ok(replies.every(r=>r.status===206));gate.resolve();await h.settle();
 assert.equal(h.stats().full,1);await h.request();await h.settle();assert.equal(h.stats().full,1);
 h.offline();const reply=await h.request();assert.equal(reply.status,206);assert.equal((await reply.arrayBuffer()).byteLength,2);
});
test('different media URLs serialize optional network work',async()=>{
 const gate=deferred(),h=harness({gate});await Promise.all([h.request('one.mp4'),h.request('two.mp4'),h.request('three.mp4')]);gate.resolve();await h.settle();assert.deepEqual(h.stats(),{full:3,peak:1});
});
test('failed full fetch releases its job and does not block another file or later retry',async()=>{
 const h=harness({failFirst:true});assert.equal((await h.request()).status,206);await h.settle();await h.request('two.mp4');await h.settle();await h.request();await h.settle();assert.equal(h.stats().full,3);assert.ok(h.rows.has('https://school.test/one.mp4'));
});
test('cache quota errors never replace the successful partial response',async()=>{
 const h=harness({quota:true});assert.equal((await h.request()).status,206);await h.settle();assert.equal((await h.request('two.mp4')).status,206);await h.settle();assert.equal(h.stats().full,2);
});
test('installation remains empty and API/auth requests bypass caching',async()=>{
 const h=harness();let installed;h.handlers.install({waitUntil:p=>installed=p});await installed;assert.equal(h.stats().full,0);
 for(const url of ['/api/private.json','/auth/profile.json','/sso/start']){let intercepted=false;h.handlers.fetch({request:new Request('https://school.test'+url),respondWith:()=>{intercepted=true;}});assert.equal(intercepted,false);}
});
test('offline manifests contain the current worker without stale hashes or totals',()=>{
 const b=Buffer.from(source),sha=crypto.createHash('sha256').update(b).digest('hex'),catalog=JSON.parse(fs.readFileSync(path.join(root,'data/offline-catalog.json'),'utf8'));
 for(const app of catalog.apps){const bundle=JSON.parse(fs.readFileSync(path.join(root,app.manifest),'utf8')),row=bundle.files.find(r=>r.path==='assets/js/offline-worker-v1.js');if(!row)continue;assert.equal(row.sha256,sha,app.id);assert.equal(row.bytes,b.length,app.id);assert.equal(app.version,bundle.version);assert.equal(app.bytes,bundle.files.reduce((sum,r)=>sum+r.bytes,0));assert.equal(app.count,bundle.files.length);assert.equal(bundle.version,crypto.createHash('sha256').update(JSON.stringify(bundle.files)).digest('hex').slice(0,16));}
});
