'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),S=require('../src/simulation.js'),M=require('../src/model.js');
for(const id of M.ids)test(id+' has ordered captions and design-dependent visual outcomes',()=>{
 for(const level of [0,1,2]){const d=Object.fromEntries(M.keys[id].map(k=>[k,level])),r=M.simulate(id,d,'extend'),frames=[0,.15,.8,1].map(p=>S.frame(id,d,r,p));assert.deepEqual(frames.map(f=>f.stage),[0,1,2,2]);assert.equal(frames[3].complete,true);assert.notEqual(frames[0].transform,frames[3].transform);for(const f of frames){assert.ok(f.caption[0]&&f.caption[1]);assert.ok(!/NaN|undefined|Infinity/.test(f.transform));}}
});
test('pause, replay, stepping and destroy own exactly one animation callback',()=>{
 let jobs=new Map(),next=0,complete=0,paints=0;const win={requestAnimationFrame:fn=>{jobs.set(++next,fn);return next;},cancelAnimationFrame:id=>jobs.delete(id)};const design={base:1,back:1,lip:1},p=S.create({window:win,id:'book',design,result:M.simulate('book',design,'entry'),paint:()=>paints++,complete:()=>complete++});
 p.init();p.play();p.play();assert.equal(jobs.size,1);p.pause();assert.equal(jobs.size,0);p.step(1);assert.equal(p.state().progress,.15);p.step(1);assert.equal(p.state().progress,.8);p.step(1);assert.equal(complete,1);p.step(-1);assert.equal(p.state().progress,.8);p.play();assert.equal(jobs.size,1);p.destroy();assert.equal(jobs.size,0);const before=paints;p.play();p.seek(1);assert.equal(paints,before);
});
test('automatic playback reaches the same final frame as manual observation',()=>{
 let queue=[],time=0,final;const win={requestAnimationFrame:fn=>{queue=[fn];return 1;},cancelAnimationFrame:()=>{queue=[];}};const design={slope:2,rail:2,target:2};const p=S.create({window:win,id:'track',design,result:M.simulate('track',design,'entry'),paint:f=>final=f});p.play();for(let n=0;n<400&&queue.length;n++){const fn=queue.shift();time+=40;fn(time);}assert.equal(final.progress,1);assert.equal(queue.length,0);assert.equal(p.state().running,false);
});
