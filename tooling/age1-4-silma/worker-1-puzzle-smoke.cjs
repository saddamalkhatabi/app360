'use strict';
/* Run from repository root: node tooling/age1-4-silma/worker-1-puzzle-smoke.cjs [--require-audio] */
const fs=require('fs'),vm=require('vm');
const dir='apps/1-4/picture-puzzles/';
const manifest=JSON.parse(fs.readFileSync('tooling/age1-4-silma/worker-1-picture-puzzles-pilot.json','utf8'));
const source=fs.readFileSync(dir+'silma-guidance-v1.js','utf8');
const errors=[];
if(manifest.status!=='TEXT_ONLY_NO_AUDIO')errors.push('Status must not claim generated audio');
if(manifest.items.length!==5)errors.push('Expected 5 guidance cues');
const cues=new Set(),paths=new Set();
for(const item of manifest.items){
 if(cues.has(item.cue)||paths.has(item.path))errors.push('Duplicate cue/path '+item.cue);
 cues.add(item.cue);paths.add(item.path);
 if(item.language!=='ar'||item.engine!=='silma'||!item.text)errors.push('Invalid authored cue '+item.cue);
 if(!source.includes(item.path.slice(dir.length)))errors.push('Missing runtime mapping '+item.cue);
}
if(!source.includes('ready: false'))errors.push('Runtime must remain disabled before audio verification');
let created=0,done=0;
const nodes={soundBtn:{innerHTML:'🔊',className:''},boardWrap:{className:'board'},hintBtn:{className:'hint'}};
function Audio(src){created++;this.src=src;this.play=function(){return {catch:function(){}}};this.pause=function(){}}
const document={getElementById:function(id){return nodes[id]||null}};
function run(text){
 const window={Audio:Audio};
 const sandbox={window:window,document:document,setTimeout:function(){return 1},clearTimeout:function(){}};
 vm.runInNewContext(text,sandbox,{timeout:1000});
 return window.APP360PictureSilmaGuide;
}
const off=run(source);
if(off.ready()||off.play('start','boardWrap')||created)errors.push('Unverified audio must not play');
const on=run(source.replace('ready: false','ready: true'));
if(!on.play('start','boardWrap',function(){done++})||created!==1||!nodes.boardWrap.className.includes('silma-cue-focus'))errors.push('Focus/play failed in simulated verified mode');
on.stop();
if(done||nodes.boardWrap.className.includes('silma-cue-focus'))errors.push('Stop must be silent and remove focus');
nodes.soundBtn.innerHTML='🔇';
if(on.play('hint','hintBtn'))errors.push('Mute must prevent narration');
const missing=[];
for(const item of manifest.items){
 if(!fs.existsSync(item.path)||fs.statSync(item.path).size<800)missing.push(item.path);
}
if(process.argv.includes('--require-audio')&&missing.length)errors.push('Missing MP3 files: '+missing.join(', '));
console.log(JSON.stringify({structural_tests:errors.length?'FAIL':'PASS',authored_cues:manifest.items.length,missing_mp3:missing.length,audio_test:missing.length?'NOT_RUN':'FILES_PRESENT_NOT_LISTENING_TESTED',errors},null,2));
if(errors.length)process.exitCode=1;
