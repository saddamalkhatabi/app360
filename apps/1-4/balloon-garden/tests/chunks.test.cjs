'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.resolve(__dirname,'..');
test('on-demand sentence buckets preserve every canonical sentence and measured clip cue',()=>{
 const original={window:{}},split={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(dir,'learning.js'),'utf8'),original);
 const files=fs.readdirSync(path.join(dir,'learning'));assert.equal(files.length,16);
 for(const f of files){const source=fs.readFileSync(path.join(dir,'learning',f),'utf8');assert(Buffer.byteLength(source)<150000);vm.runInNewContext(source,split);}
 for(const key of ['items','clips'])assert.deepEqual(JSON.parse(JSON.stringify(split.window.BalloonGardenLearning[key])),JSON.parse(JSON.stringify(original.window.BalloonGardenLearning[key])));
});
