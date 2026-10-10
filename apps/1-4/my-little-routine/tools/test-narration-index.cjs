/* Validate published prerecorded Arabic stories without network or TTS models. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const authored=JSON.parse(fs.readFileSync(path.join(root,'audio/narration-scripts.json'),'utf8'));
const file=fs.readFileSync(path.join(root,'audio/narration-timings.js'),'utf8').trim();
const json=file.replace(/^window\.APP360_ROUTINE_NARRATIONS\s*=\s*/,'').replace(/;$/,'');
const timeline=JSON.parse(json);
const byId={};authored.items.forEach((x,i)=>{assert.equal(i+1,x.number);byId[x.id]=x});
assert.equal(authored.items.length,50);
const ids=Object.keys(timeline.habits);
assert.equal(ids.length,timeline.clip_count);
assert(ids.length===40||ids.length===50,'Expected a verified partial or complete publication');
assert.equal(timeline.status,ids.length===50?'recorded':'partial_recorded');
for(const id of ids){
 const audio=timeline.habits[id],original=byId[id];
 assert(original,'Unregistered recorded voice: '+id);
 assert.equal(audio.title,original.title);
 assert.deepEqual(audio.steps,original.steps);
 assert.equal(audio.verified,true);
 assert.equal(audio.segments.length,7);
 assert.equal(audio.segments[0].kind,'intro');
 assert.equal(audio.segments[6].kind,'outro');
 assert(audio.duration_ms>4000&&audio.duration_ms<40000);
 let pos=0;
 for(let i=0;i<7;i++){
  const s=audio.segments[i];
  assert.equal(s.text,original.segments[i].text);
  assert.equal(s.step,original.segments[i].step);
  assert.equal(s.kind,original.segments[i].kind);
  assert(s.start_ms>=pos&&s.end_ms>s.start_ms,'Non-monotonic audio cues for '+id);
  if(i<6)assert.equal(s.end_ms,audio.segments[i+1].start_ms);
  pos=s.end_ms;
 }
 assert.equal(pos,audio.duration_ms);
 const mp3=path.join(root,audio.path),bytes=fs.readFileSync(mp3);
 assert(bytes.length>5000,'Missing or too-short MP3: '+audio.path);
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),audio.sha256);
}
for(const name of ['routine-narration-v1.js','story-reel-v6.js','app.js']){
 new Function(fs.readFileSync(path.join(root,name),'utf8'));
}
console.log('OK:',ids.length,'recorded routines and',ids.length*5,'synchronized scenes, audio file hashes and scripts.');
