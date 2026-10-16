'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),w={};
for(const f of ['audio/narration-timings.js','audio/narration-timings-en.js','audio/routine-word-cues-v1.js'])vm.runInNewContext(fs.readFileSync(path.join(root,f),'utf8'),{window:w});
const cues=w.APP360_ROUTINE_WORD_CUES;assert.equal(Object.keys(cues).length,100);
for(const catalog of [w.APP360_ROUTINE_NARRATIONS,w.APP360_ROUTINE_NARRATIONS_EN])for(const clip of Object.values(catalog.habits)){
 const entry=cues[clip.path];assert(entry,clip.path);
 assert.equal(entry.sha256,clip.sha256,clip.path);
 assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,clip.path))).digest('hex'),entry.sha256,clip.path);
 assert.equal(entry.text,clip.segments.map(s=>s.text).join(' '));
 assert.equal(entry.cues.length,entry.text.split(/\s+/).length);
 for(let i=0;i<entry.cues.length;i++){const [word,start,end]=entry.cues[i];assert.equal(word,i);assert(start>=0&&end>start&&end<=entry.duration_ms);if(i)assert(start>=entry.cues[i-1][2]);}
}
console.log('PASS: all words measured in 100 original AR/EN clips, exact source hashes, full word coverage and ordered cue boundaries');
