'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../src/audio.js'),'utf8');
function runtime(){
  const requests=[];
  let context;
  class Request{
    open(method,path){this.path=path;}
    send(){requests.push(this);}
    resolve(){this.status=200;this.response=new ArrayBuffer(16);this.onload();}
  }
  const window={AudioContext:class{
    constructor(){this.state='running';this.currentTime=10;context=this;}
    resume(){return Promise.resolve();}
    decodeAudioData(data,done){done({duration:3});}
    createBufferSource(){return{connect(){},disconnect(){},start(){},stop(){}};}
  }};
  vm.runInNewContext(source,{window,XMLHttpRequest:Request,Audio:class{},ArrayBuffer,URL,Blob});
  return{api:window.APP360_STORY_AUDIO,requests,context:()=>context};
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
test('Web Audio clock starts at actual source playback and stops advancing while suspended',()=>{
 const r=runtime();r.api.play('speech');assert.equal(r.api.clock().state,'waiting');r.requests[0].resolve();assert.equal(r.api.clock().time,0);r.context().currentTime=10.45;assert.ok(Math.abs(r.api.clock().time-.45)<.0001);assert.equal(r.api.clock().duration,3);r.context().state='suspended';assert.equal(r.api.clock().state,'paused');r.api.stop();assert.equal(r.api.clock().state,'idle');assert.equal(r.api.clock().path,'');
});
test('HTMLAudio fallback reports its own playback position, pauses and natural ending',()=>{
 let media;const requests=[];
 class Request{open(){}send(){requests.push(this)}}
 class Media{constructor(){media=this;this.currentTime=0;this.duration=2;this.paused=true}play(){this.paused=false;this.onplaying();return Promise.resolve()}pause(){this.paused=true}}
 const window={};vm.runInNewContext(source,{window,XMLHttpRequest:Request,Audio:Media,ArrayBuffer,URL,Blob});
 const api=window.APP360_STORY_AUDIO;api.play('speech');requests[0].status=200;requests[0].response=new ArrayBuffer(16);requests[0].onload();media.currentTime=.7;assert.equal(api.clock().time,.7);assert.equal(api.clock().state,'playing');media.paused=true;assert.equal(api.clock().state,'paused');media.onended();assert.equal(api.clock().state,'idle');assert.equal(api.clock().path,'');
});
