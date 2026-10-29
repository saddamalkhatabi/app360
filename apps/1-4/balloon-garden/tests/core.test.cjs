'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),C=require('../core.js');
for(const age of ['1-4','4-8'])for(let level=1;level<=4;level++)for(let stage=0;stage<3;stage++)test(`${age} level ${level} stage ${stage}: discovery, saved gift, seed/water/sun, all flowers`,()=>{
 const s=C.settings({age,level,stage}),r=C.create(s);let round=r;
 assert.equal(round.plots.length,age==='1-4'?4:6);let pops=0;
 while(!round.ended){const index=round.active,step=round.plots[index].growth,offer=C.offers(round,s,36)[pops%C.config(s).count];
 assert.equal(C.apply(round,index),null,'planting requires a gift');assert(C.pop(round,s,offer.id,36));pops++;
 assert.equal(C.pop(round,s,offer.id,36),null,'duplicate pop cannot award twice');assert.equal(C.pop(round,s,C.offers(round,s,36)[0].id,36),null,'only one pending gift');
 const saved=JSON.parse(JSON.stringify(round));round=C.restore(saved,s,36);assert.deepEqual(round,saved,'pending resource survives close/reopen');
 assert.equal(C.apply(round,(index+1)%round.plots.length),null,'gift belongs to active bed');const result=C.apply(round,index);assert.equal(result.growth,step+1);assert.equal(C.apply(round,index),null,'duplicate plant has no effect');
 assert.equal(C.flowers(round),Math.floor(pops/3));round=C.restore(JSON.parse(JSON.stringify(round)),s,36);
 }
 assert.equal(pops,round.plots.length*3);assert.equal(C.pop(round,s,'18:0',36),null);assert.equal(C.flowers(round),round.plots.length);
});
test('invalid and foreign saves start a safe farm',()=>{const s=C.settings({age:'1-4',level:2}),r=C.create(s);r.plots[0].growth=2;r.pops=0;assert.deepEqual(C.restore(r,s,36),C.create(s));const good=C.create(s);assert.equal(C.restore(good,C.settings({age:'4-8',level:2}),36).plots.length,6);for(const raw of [null,{}, {schema:2,plots:[null]}])assert.deepEqual(C.restore(raw,s,36),C.create(s));});
test('settings normalize corruption and all stages are available immediately',()=>{const s=C.settings({level:99,stage:-2,age:'bad',players:8,language:'xx'});assert.equal(s.level,1);assert.equal(s.stage,0);assert.equal(s.players,1);assert.equal(C.create({age:'4-8',level:4,stage:2}).stage,2);});
test('older mixed farm and younger level progression use their own content modes',()=>{assert.equal(C.config({age:'1-4',level:1}).count,2);assert.equal(C.config({age:'1-4',level:4}).mode,'words');const s=C.settings({age:'4-8',level:4});const r=C.create(s),seen=new Set();for(let n=0;n<10;n++){r.pops=n;for(const o of C.offers(r,s,36))seen.add(o.kind);}assert.deepEqual(seen,new Set(['colors','numbers','letters','words','shapes']));});

test('sentence defaults, localized number ranges and explicit shape discovery follow age settings',()=>{assert.equal(C.settings({age:'1-4'}).sentences,false);assert.equal(C.settings({age:'4-8'}).sentences,true);assert.equal(C.settings({age:'1-4',sentences:true}).sentences,true);assert.equal(C.settings({age:'4-8',sentences:false}).sentences,false);for(const age of ['1-4','4-8']){const s=C.settings({age,topic:'numbers'}),r=C.create(s),seen=new Set();for(let i=0;i<100;i++){r.pops=i;for(const o of C.offers(r,s,1203)){assert.equal(o.kind,'numbers');seen.add(o.item+1);}}assert.equal(Math.max(...seen),age==='1-4'?10:20);assert(seen.has(10));}const shape=C.settings({topic:'shapes'}),r=C.create(shape);assert(C.offers(r,shape,1203).every(o=>o.kind==='shapes'));const a=C.pop(r,shape,C.offers(r,shape,1203)[0].id,1203);C.apply(r,r.active);assert.equal(C.restore(JSON.parse(JSON.stringify(r)),shape,1203).discoveries[0].kind,'shapes');});

for(const age of ['1-4','4-8'])test('twelve coach routes keep their precise topic and number range: '+age,()=>{
 const ids=new Set();for(let level=1;level<=4;level++)for(let stage=0;stage<3;stage++){
  const s=C.settings({age,level,stage,coach:true,topic:'words'}),unit=C.route(s),r=C.create(s);ids.add(unit.id);
  for(let n=0;n<36;n++){r.pops=n;for(const o of C.offers(r,s,100)){
   if(unit.topic==='colorsShapes')assert(['colors','shapes'].includes(o.kind));else assert.equal(o.kind,unit.topic);
   if(o.kind==='numbers'){assert(o.item+1>=unit.minNumber);assert(o.item+1<=unit.maxNumber);}
  }}
 }assert.equal(ids.size,12);
});
