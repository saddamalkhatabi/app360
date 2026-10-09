#!/usr/bin/env node
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert');
const app=path.resolve(__dirname,'..'),root=path.resolve(app,'../../..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'tooling/age1-4-silma/worker-4/narration-plan-runner-360.json'),'utf8'));
const html=fs.readFileSync(path.join(app,'index.html'),'utf8');
const scripts=['coach-voice-loader-v1.js','coach-voice-v1.js','coach-voice-controller-v1.js','coach-voice-selector-v1.js'];
let last=-1;
for(const script of scripts){const at=html.indexOf('src="'+script);assert(at>last,'Script order or missing '+script);last=at}
for(const id of ['silmaCoachPanel','silmaCoachPlay','silmaCoachStop','silmaCoachInfo','silmaCoachText','silmaCoachAuto'])
 assert(html.indexOf('id="'+id+'"')>=0,'Missing UI '+id);
assert.strictEqual(manifest.items.length,85);
assert(manifest.items.every(x=>x.engine==='silma'));
const els={};
for(const id of ['silmaCoachPanel','silmaCoachPlay','silmaCoachStop','silmaCoachInfo','silmaCoachText','silmaCoachAuto','runner','runStepTitle','runPlanTitle','runProgress','presetList','nextBtn','pauseBtn','stopBtn']){
 els[id]={id,disabled:false,textContent:'',hidden:id==='runner',checked:id==='silmaCoachAuto',style:{},className:'',getAttribute(){return null},addEventListener(){}};
}
const document={readyState:'complete',getElementById:id=>els[id]||null,addEventListener(){}};
let playCount=0,stopCount=0;
const window={setInterval(){},Audio:function(src){this.src=src;this.play=function(){playCount++};this.pause=function(){stopCount++}}};
function XMLHttpRequest(){this.open=function(){};this.send=function(){this.status=200;this.readyState=4;this.responseText=JSON.stringify(manifest);this.onreadystatechange()}}
for(const script of scripts)vm.runInNewContext(fs.readFileSync(path.join(app,script),'utf8'),{window,document,XMLHttpRequest},{filename:script,timeout:2000});
assert(window.SilmaCoachManifest.get(),'Manifest not loaded');
assert(els.silmaCoachPlay.disabled,'Pending recording must be disabled');
assert(els.silmaCoachInfo.textContent.indexOf('غير مولدة')>=0,'Pending status must be explicit');
assert.strictEqual(playCount,0,'Must not substitute browser TTS');
window.SilmaCoachUI.select('plan-runner-360:shared:coach-safety');
assert(els.silmaCoachPlay.disabled,'Pending safety recording must be disabled');
const sample=window.SilmaCoachManifest.get().items.find(x=>x.clip_id==='plan-runner-360:shared:coach-safety');
sample.render_status='rendered_and_verified'; // Simulation only: does NOT mark source manifest as rendered.
window.SilmaCoachUI.select(sample.clip_id);
assert(!els.silmaCoachPlay.disabled,'Verified recording should be enabled');
els.silmaCoachPlay.onclick();
assert.strictEqual(playCount,1,'Expected exactly one playback');
els.silmaCoachStop.onclick();
assert(stopCount>=1,'Stop must pause playback');
console.log('PASS: manifest/UI order, pending audio safety, verified mock playback, stop. SILMA MP3 files are NOT generated.');
