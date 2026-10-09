'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert');
const read=name=>JSON.parse(fs.readFileSync(path.join(__dirname,name),'utf8'));
const main=read('narration-draft.json'),calm=read('calm-choice-narration-draft.json'),pilot=read('silma-pilot-manifest.json');
assert.equal(main.items.length,640);
assert.equal(calm.items.length,74);
assert.equal(pilot.items.length,8);
const keys=new Set(),paths=new Set();
for(const row of main.items){
 assert(!keys.has(row.event_id),'duplicate event '+row.event_id);
 assert(!paths.has(row.output_path),'duplicate path '+row.output_path);
 keys.add(row.event_id);paths.add(row.output_path);
 assert(row.review_state&&row.audio_generated===false);
}
for(const row of pilot.items)assert(keys.has(row.event_id),'unknown pilot event');
console.log('Worker 3 manifest checks passed: 640 draft events, 74 calm choices, 8 pilot texts. No MP3 verified.');
