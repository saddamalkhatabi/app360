'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm');
const root=path.resolve(__dirname,'..'),catalog=require('../data/offline-catalog.json');
test('every downloadable app has a complete manifest with current byte sizes and content digests',()=>{
 assert.equal(catalog.policy,'cache-on-use');assert.ok(catalog.apps.length>=16);
 for(const a of catalog.apps){const m=JSON.parse(fs.readFileSync(path.join(root,a.manifest)));assert.equal(a.version,m.version);assert.equal(a.count,m.files.length);assert.equal(a.bytes,m.files.reduce((n,f)=>n+f.bytes,0));assert.ok(m.files.some(f=>f.path===a.entry));
 for(const f of m.files){const b=fs.readFileSync(path.join(root,f.path));assert.equal(b.length,f.bytes,f.path);assert.equal(crypto.createHash('sha256').update(b).digest('hex'),f.sha256,f.path);}
 }
});
test('all application workers share cache-on-use engine without install-time precaching',()=>{
 for(const a of catalog.apps){const source=fs.readFileSync(path.join(root,a.directory,'sw.js'),'utf8');assert.match(source,/importScripts.*offline-worker-v1/);assert.doesNotMatch(source,/addAll|cacheCore|function fill/);}
});
test('installation performs no asset fetch and uncached offline navigation never returns another app or home',async()=>{
 const handlers={};let fetches=0;const cache={match:async()=>null,put:async()=>{}};
 const self={APP360_OFFLINE_ROOT:'../../../',location:{href:'https://example.test/release/apps/4-8/command-path-lab/sw.js',origin:'https://example.test'},registration:{scope:'https://example.test/release/apps/4-8/command-path-lab/'},clients:{claim:async()=>{}},skipWaiting:async()=>{},addEventListener:(n,f)=>handlers[n]=f};
 vm.runInNewContext(fs.readFileSync(path.join(root,'assets/js/offline-worker-v1.js'),'utf8'),{self,caches:{open:async()=>cache},URL,Request,Response,Promise,fetch:async()=>{fetches++;throw new Error('offline');}});
 let install;handlers.install({waitUntil:p=>install=p});await install;assert.equal(fetches,0);
 let response;handlers.fetch({request:new Request('https://example.test/release/apps/4-8/command-path-lab/index.html'),respondWith:p=>response=p,waitUntil:()=>{}});assert.equal((await response).status,503);assert.equal(fetches,1);
 response=null;handlers.fetch({request:new Request('https://example.test/release/api/profile.json'),respondWith:p=>response=p});assert.equal(response,null,'private API requests are not cached');
});
