'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/audio.js'),'utf8');
function runtime(){
  const requests=[];
  class Request{
    open(method,path){this.path=path;}
    send(){requests.push(this);}
    resolve(){this.status=200;this.response=new ArrayBuffer(16);this.onload();}
  }
  const window={AudioContext:class{
    constructor(){this.state='running';}
    resume(){return Promise.resolve();}
    decodeAudioData(data,done){done({});}
    createBufferSource(){return{connect(){},disconnect(){},start(){},stop(){}};}
  }};
  vm.runInNewContext(source,{window,XMLHttpRequest:Request,Audio:class{},ArrayBuffer,URL,Blob});
  return{api:window.APP360_STORY_AUDIO,requests};
}
test('a tapped sound moves ahead of queued background clips on a slow connection',()=>{
  const r=runtime();r.api.warm(['first','second','background-a','background-b','target']);
  assert.deepEqual(r.requests.map(x=>x.path),['first','second']);
  r.api.play('target');r.requests[0].resolve();assert.equal(r.requests[2].path,'target');
  r.requests[2].resolve();assert.equal(r.api.debug().path,'target');assert.equal(r.api.debug().plays,1);
});
test('changing lesson discards queued old preloads without blocking the new lesson',()=>{
  const r=runtime();r.api.warm(['old-a','old-b','old-c','old-d','old-e']);
  r.api.warm(['new-instruction','new-word']);r.requests[0].resolve();r.requests[1].resolve();
  assert.deepEqual(r.requests.map(x=>x.path),['old-a','old-b','new-instruction','new-word']);
  r.requests[2].resolve();r.requests[3].resolve();assert.equal(r.requests.length,4);
});
test('only the latest tap becomes audible when earlier requests finish later',()=>{
  const r=runtime();let staleEnded=0;
  r.api.warm(['background-a','background-b','first-tap','last-tap']);
  r.api.play('first-tap',()=>staleEnded++);r.api.play('last-tap');
  r.requests[0].resolve();assert.equal(r.requests[2].path,'last-tap');r.requests[2].resolve();
  r.requests[1].resolve();const stale=r.requests.find(x=>x.path==='first-tap');stale.resolve();
  assert.equal(r.api.debug().path,'last-tap');assert.equal(r.api.debug().plays,1);assert.equal(staleEnded,0);
});
