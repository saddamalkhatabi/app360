#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'../../..');
const targets={'screen-to-move':[42,260],'imitate-one-step':[50,300],'my-little-routine':[12,72],'plan-runner-360':[24,85]};
const strict=process.argv.includes('--require-audio');
let total=0,missing=0;const unique=new Set();
for(const app of Object.keys(targets)){
 const m=JSON.parse(fs.readFileSync(path.join(__dirname,'narration-'+app+'.json'),'utf8'));
 const ids=new Set();assert.strictEqual(m.items.length,targets[app][1]);
 for(const clip of m.items){
  assert(clip.text&&clip.clip_id&&clip.engine==='silma');
  assert(clip.path.startsWith('apps/1-4/'+app+'/audio/silma/worker-4/'));
  assert(!unique.has(clip.clip_id));unique.add(clip.clip_id);
  if(clip.clip_id.split(':')[1]!=='shared')ids.add(clip.clip_id.split(':')[1]);
  if(strict){const f=path.join(root,clip.path);if(!fs.existsSync(f)||fs.statSync(f).size<1000)missing++}
 }
 assert.strictEqual(ids.size,targets[app][0]);total+=m.items.length;
 console.log(app,ids.size,m.items.length);
}
assert.strictEqual(total,717);
console.log('Narration entries:',total,'Missing audio files:',strict?missing:'not checked');
if(strict&&missing)process.exitCode=1;
