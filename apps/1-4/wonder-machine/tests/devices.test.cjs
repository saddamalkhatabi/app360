'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm'),C=require('../device-core.js'),D=require('../device-content.js');
test('12 distinct panels, 36 missions and four explicit age-appropriate levels',()=>{
assert.equal(D.devices.length,12);assert.equal(new Set(D.devices.map(d=>d.id)).size,12);assert.equal(D.devices.reduce((n,d)=>n+d.tasks.length,0),36);
for(const age of ['1-4','4-8'])for(let n=1;n<=4;n++){assert(C.list(age,n).length>=2);assert(D.levels[age][n-1].ar&&D.levels[age][n-1].en);}
assert.equal(D.devices.filter(d=>d.levels['1-4']).length,10);assert(!C.find('crossing','1-4'));assert(!C.find('fire','1-4'));
for(const d of D.devices){assert(d.title.ar&&d.title.en&&d.idea.ar&&d.idea.en);assert(d.tools.length>=2);assert.deepEqual(d.photoKeys,d.tools.slice(0,2).map(t=>t.key));for(const t of d.tools){assert(t.name.ar&&t.name.en);for(const s of t.states)assert(s.ar&&s.en);}for(const t of d.tasks)assert(t.title.ar&&t.title.en&&t.note.ar&&t.note.en);}
assert(!D.devices.some(d=>['shadow','magnet','float','ramp','balance','mix'].includes(d.id)));
});
for(const d of D.devices)test('all controls, missions, restores and undo are consistent: '+d.id,()=>{
const free=C.fresh(d,'free');assert(!C.progress(free.machine,C.task(d,'free')).done);assert(!C.act(free,d,'__unknown__',1,2).changed);
for(const t of d.tasks){const r=C.fresh(d,t.id);assert(C.valid(d,r.machine));assert(!C.progress(r.machine,t).done);
const plan=C.plan(d,r.machine,t);assert(plan.length>0);let turn=0;
for(const action of plan){const before=C.copy(r);assert(C.act(r,d,action.tool,action.value,2).changed);turn=1-turn;assert.equal(r.turn,turn);assert(C.valid(d,r.machine));assert.deepEqual(C.restore(C.copy(r),d,t.id),r);const clone=C.copy(r);assert(C.undo(clone));assert.deepEqual(clone,before);}
assert(C.progress(r.machine,t).done);const snapshot=C.copy(r);assert(!C.act(r,d,plan[plan.length-1].tool,plan[plan.length-1].value,2).changed);assert.deepEqual(r,snapshot);
}
for(let bits=0;bits<Math.pow(2,d.tools.length);bits++){const m=C.empty(d);d.tools.forEach((tool,i)=>m[tool.key]=(bits>>i)&1);if(!C.valid(d,m))continue;assert(C.frame(d,m)>=0&&C.frame(d,m)<4);const freePlan=C.plan(d,m,C.task(d,'free'));for(const action of freePlan){assert.equal(C.guard(d,m,action.tool,action.value),null,'a demonstration must respect all tool prerequisites');const preview=C.copy(m);preview[action.tool]=action.value;assert(C.valid(d,preview),'a demonstration cannot show an unsafe state');}if(!freePlan.length)assert(d.tools.every(tool=>C.guard(d,m,tool.key,1-m[tool.key])));
for(const tool of d.tools)for(const n of [0,1]){const r={machine:C.copy(m),turn:0,history:[]},before=C.copy(r),result=C.act(r,d,tool.key,n,2);if(result.changed){assert(C.valid(d,r.machine));assert.equal(r.machine[tool.key],n);}else assert.deepEqual(r,before);}
}
});
test('safety interlocks explain ordering and never change state or partner on refusal',()=>{
for(const [id,k,n,reason] of [['laundry','run',1,'closeDoor'],['delivery','cart',1,'openDoor'],['harbor','boat',1,'raiseBridge'],['crossing','walk',1,'checkWithAdult'],['crossing','check',1,'waitTraffic'],['fire','help',1,'outsideFirst']]){
const d=C.find(id),r=C.fresh(d,'free'),before=C.copy(r),result=C.act(r,d,k,n,2);assert.equal(result.reason,reason);assert.deepEqual(r,before);
}
const cross=C.find('crossing'),r=C.fresh(cross,'free');assert(C.act(r,cross,'request',1).changed);assert(!C.act(r,cross,'walk',1).changed);assert(C.act(r,cross,'check',1).changed);assert(C.act(r,cross,'walk',1).changed);assert.equal(C.frame(cross,r.machine),3);assert(!C.act(r,cross,'request',0).changed);assert(!C.act(r,cross,'walk',0).changed);
const fire=C.find('fire'),f=C.fresh(fire,'free');assert(C.act(f,fire,'outside',1).changed);assert(C.act(f,fire,'help',1).changed);assert(!C.act(f,fire,'outside',0).changed);assert.equal(C.frame(fire,f.machine),3);
});
test('planning includes prerequisite tools, rather than merely setting the final goal',()=>{
const wash=C.find('wash'),rinse=C.task(wash,'rinse');assert.deepEqual(C.plan(wash,rinse.initial,rinse),[{tool:'water',value:1},{tool:'soap',value:0},{tool:'water',value:0}]);
const laundry=C.find('laundry'),finish=C.task(laundry,'finish');assert.deepEqual(C.plan(laundry,finish.initial,finish),[{tool:'run',value:0},{tool:'door',value:0}]);
});
test('corrupt, unsafe, inherited and obsolete saves recover without importing forged progress',()=>{
for(const d of D.devices){const fresh=C.fresh(d,'free');for(const raw of [null,{machine:{},turn:0,history:[]},{machine:C.empty(d),turn:2,history:[]},{machine:C.empty(d),turn:0,history:Array(31).fill({})}])assert.deepEqual(C.restore(raw,d,'free'),fresh);}
const d=C.find('laundry');assert.deepEqual(C.restore({machine:{door:0,run:1},turn:0,history:[]},d,'free'),C.fresh(d,'free'));
const raw={schema:3,level:4,selected:{4:'fire'},tasks:{fire:'help'},rounds:{'fire:help':{machine:{outside:0,help:1},turn:0,history:[]}}};assert.equal(C.store(raw,'4-8').rounds['fire:help'].machine.help,0);assert(!C.store(raw,'1-4').rounds['fire:help']);assert.equal(C.store({schema:1,level:4},'4-8').level,1);assert.equal(C.store({schema:3,level:1.5},'4-8').level,1);
const r=C.fresh(C.find('room'),'free');for(let i=0;i<80;i++)C.act(r,C.find('room'),'lamp',1-r.machine.lamp,2);assert.equal(r.history.length,30);for(let i=0;i<30;i++)assert(C.undo(r));assert(!C.undo(r));
});
test('drawings reflect the same tool states as photographic frames for every device',()=>{
const window={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../device-scene.js'),'utf8'),{window});
for(const d of D.devices){for(const t of d.tasks){const r=C.fresh(d,t.id),before=window.WonderDeviceScene.render(d,r.machine);for(const a of C.plan(d,r.machine,t))C.act(r,d,a.tool,a.value);const after=window.WonderDeviceScene.render(d,r.machine);assert.notEqual(after,before,d.id+':'+t.id);assert(after.includes('<svg'));}}
});
test('compact 2 by 2 atlases have exact dimensions, HD sources and small separate thumbnails',()=>{
const dir=path.join(__dirname,'../assets/devices'),manifest=JSON.parse(fs.readFileSync(path.join(dir,'manifest.json')));assert.deepEqual(manifest.frame,[1024,576]);assert.deepEqual(manifest.masterAtlas,[3328,1872]);assert.equal(manifest.devices.length,12);let bytes=0;
for(const d of manifest.devices){const b=fs.readFileSync(path.join(dir,d.id+'.webp'));assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');assert.equal(b.length,d.bytes);assert(b.length<750000);const marker=b.indexOf(Buffer.from([0x9d,0x01,0x2a]));assert(marker>0);assert.equal(b.readUInt16LE(marker+3)&0x3fff,2048);assert.equal(b.readUInt16LE(marker+5)&0x3fff,1152);assert(d.thumbBytes<30000);for(const s of d.sources){assert(s.width>=1500&&s.height>=800);assert.equal(s.sha256.length,64);}bytes+=d.bytes+d.thumbBytes;}
const download=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../../../data/offline/fun-wonder-machine.json'))),records=new Set(download.files.map(f=>f.path)),prepared=JSON.parse(fs.readFileSync(path.join(__dirname,'../offline-files.json'))).files;for(const d of manifest.devices){for(const name of [d.id+'.webp',d.id+'-thumb.webp']){const rel='assets/devices/'+name;assert(records.has('apps/1-4/wonder-machine/'+rel),'offline package must contain '+rel);assert(prepared.includes(rel),'preparation must contain '+rel);}}assert(bytes<5600000,bytes);const app=fs.readFileSync(path.join(__dirname,'../device-app.js'),'utf8');assert(app.includes("if(store.photo)loadPhoto()"));assert(app.includes("if(photos[id])return"));assert(app.includes('loading="lazy"'));
});
