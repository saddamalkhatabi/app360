'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),w={};vm.runInNewContext(fs.readFileSync(path.join(root,'audio/islamic-recordings-v1.js'),'utf8'),{window:w});
const A=w.APP360_ISLAMIC_AUDIO,manifest=JSON.parse(fs.readFileSync(path.join(root,'audio/islamic-scripts-v1.json')));
assert.equal(Object.keys(A.clips).length,119);assert.equal(Object.keys(A.habits.ar).length,31);assert.equal(Object.keys(A.habits.en).length,31);
for(const row of manifest.items){
 const clip=A.clips[row.id];assert(clip&&clip.verified,row.id);assert.equal(clip.text,row.text);assert.equal(clip.path,row.path);
 const bytes=fs.readFileSync(path.join(root,clip.path));assert(bytes.length>1000,row.id);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),clip.sha256,row.id);
 assert(clip.cues.length>0,row.id);for(const [i,start,end] of clip.cues)assert(start>=0&&end>start&&end<=clip.duration_ms,row.id);
 if(row.habit){const h=A.habits[row.language][row.habit];assert.equal(h.segments.length,7);assert.deepEqual(Array.from(h.steps),row.steps);for(let i=0;i<7;i++){assert.equal(h.segments[i].text,row.segments[i].text);assert(h.segments[i].end_ms>h.segments[i].start_ms);}}
}
console.log('PASS: 119 exact-text MP3 files, hashes, measured word cues and 62 routine timelines');
