#!/usr/bin/env node
'use strict';
// Run from the repository root: node tooling/age1-4-silma/validate-inventory.cjs
// Optional strict gate after generation: --require-audio
// This validates draft source inventories; it does not verify speech quality or approval.
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const crypto=require('crypto');
const root=path.resolve(__dirname,'../..');
const strict=process.argv.indexOf('--require-audio')>=0;
const expected={'screen-to-move':{items:170,steps:850,questions:49},'imitate-one-step':{items:200,steps:1000,questions:0},'my-little-routine':{items:50,steps:250,questions:0}};
const sources={
 'screen.games-data':'apps/1-4/screen-to-move/games-data.js',
 'screen.games-data-v12':'apps/1-4/screen-to-move/games-data-v12.js',
 'imitate.experiences':'apps/1-4/imitate-one-step/experiences.json',
 'routine.storyboard-v6':'apps/1-4/my-little-routine/storyboard-data-v6.js',
 'routine.storyboard-v7':'apps/1-4/my-little-routine/storyboard-data-v7-extra.js'
};
function gitSha(buffer){return crypto.createHash('sha1').update(Buffer.from('blob '+buffer.length+'\\0','utf8')).update(buffer).digest('hex');}
const found={}; const keys=new Set(); const missing=[]; let units=0;
for(let n=1;n<=4;n++){
 const fname=path.join(__dirname,'worker-'+n+'-source-inventory.json');
 const batch=JSON.parse(fs.readFileSync(fname,'utf8'));
 assert.strictEqual(batch.worker,n);
 assert.strictEqual(batch.status,'source-inventory-only-not-generated-audio');
 let steps=0,questions=0;
 for(const [key,rel] of Object.entries(sources)){
  const sha=gitSha(fs.readFileSync(path.join(root,rel)));
  assert.strictEqual(batch.source_hashes[key],sha,'Source changed: '+rel+'. Regenerate inventories before synthesis.');
 }
 for(const entry of batch.items){
  assert(expected[entry.app], 'Unrecognized app: '+entry.app);
  assert(entry.id && entry.source_title);
  const key=entry.app+'/'+entry.id;
  assert(!keys.has(key),'Duplicate item: '+key);keys.add(key);
  assert(Array.isArray(entry.source_steps) && entry.source_steps.length>0,key+' missing steps');
  assert(entry.voice_copy_status && entry.voice_copy_status!=='approved',key+' draft status unexpectedly approved');
  found[entry.app] ||= {items:0,steps:0,questions:0};
  const x=found[entry.app];x.items++;x.steps+=entry.source_steps.length;
  if(entry.source_question)x.questions++;
  steps+=entry.source_steps.length;questions+=entry.source_question?1:0;
  units+=1+entry.source_steps.length+(entry.source_question?1:0);
  if(strict){
   const expectedFiles=['title.mp3', ...entry.source_steps.map((_,i)=>'step-'+String(i+1).padStart(2,'0')+'.mp3')];
   if(entry.source_question)expectedFiles.push('question.mp3');
   for(const f of expectedFiles){
    const relative=entry.target_dir+'/'+f;
    const absolute=path.resolve(root,relative);
    assert(absolute.startsWith(root+path.sep),'Bad audio path: '+relative);
    if(!fs.existsSync(absolute) || fs.statSync(absolute).size<1000)missing.push(relative);
   }
  }
 }
 assert.strictEqual(batch.coverage.titles,batch.items.length);
 assert.strictEqual(batch.coverage.step_prompts,steps);
 assert.strictEqual(batch.coverage.explicit_game_questions,questions);
}
assert.deepStrictEqual(found,expected,'Inventory is incomplete or source IDs changed');
assert.strictEqual(keys.size,420);
assert.strictEqual(units,2569);
console.log('PASS: unique items='+keys.size+'; basic narration units='+units+'; step counts=2100');
if(strict){
 console.log('Missing/invalid MP3s: '+missing.length);
 if(missing.length){console.error(missing.slice(0,12).join('\\n'));process.exitCode=1;}
 else console.log('PASS: every declared audio file exists (content and speech quality still require review).');
}
