/* Run: node apps/1-4/calm-with-me/tools/test_serial_player.cjs
 * Browser-like DOM simulation only. NOT a real browser, audio, or SILMA QA.
 */
'use strict';
const fs=require('fs'),vm=require('vm'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..');
const script=fs.readFileSync(path.join(root,'calm-silma-controller-serial-v1.js'),'utf8');
const nodes={},listeners={},clips=[],voices=[],logs=[],state={cancel:0};
const signal={className:'tile',getAttribute:k=>k==='data-id'?'need-help':null};
const sad={className:'tile',getAttribute:k=>k==='data-id'?'sad':null};
nodes.signalCards={parentNode:{insertBefore:x=>{nodes[x.id]=x}}};
nodes.speechToggle={checked:true};
const d={readyState:'complete',hidden:false,getElementById:k=>nodes[k]||null,
 createElement:()=>({setAttribute:function(k,v){this[k]=v}}),
 querySelectorAll:()=>[signal,sad],
 addEventListener:(k,cb)=>{listeners[k]=cb}};
function Audio(src){this.src=src;this.pause=()=>{this.paused=true};
 this.play=()=>({then:function(){}});clips.push(this)}
function Utterance(t){this.text=t;voices.push(this)}
const w={Audio,SpeechSynthesisUtterance:Utterance,speechSynthesis:{
 cancel:()=>{state.cancel++},speak:u=>logs.push(u.text)},
 APP360_CALM_SILMA_INDEX:{
 'need-help':{path:'audio/silma/signals/need-help.mp3',engine:'silma',verified:true,kind:'signals',event_id:'calm-with-me:signals:need-help'},
 'sad':{path:'audio/silma/feelings/sad.mp3',engine:'silma',verified:false,kind:'feelings',event_id:'calm-with-me:feelings:sad'}}};
vm.runInNewContext(script,{window:w,document:d,setTimeout:()=>11,clearTimeout:()=>{}},{filename:'calm-silma-controller-serial-v1.js'});
assert(nodes.calmReplayVoiceBtn&&nodes.calmReplayVoiceBtn.disabled,'replay disabled before first cue');
w.APP360CalmNarration.play({id:'need-help',speech_ar:'ساعدني'},()=>{});
assert.equal(clips.length,1);assert.equal(clips[0].src,'audio/silma/signals/need-help.mp3');
assert(signal.className.includes('audio-target-active'));
assert.equal(nodes.calmReplayVoiceBtn.disabled,false);
w.APP360CalmNarration.play({id:'sad',speech_ar:'أنا حزين'},()=>{});
assert.equal(clips[0].paused,true);assert(!signal.className.includes('audio-target-active'));
assert.equal(clips.length,1);assert.equal(voices.length,1);
assert(sad.className.includes('audio-target-active'));
w.APP360CalmNarration.replay();assert.equal(voices.length,2);
nodes.speechToggle.checked=false;w.APP360CalmNarration.replay();assert.equal(voices.length,2);
w.APP360CalmNarration.stop();assert(!sad.className.includes('audio-target-active'));
console.log('9/9 simulated narration/focus/replay checks passed; not a live browser or audio test');
