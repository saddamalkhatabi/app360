'use strict';
const {test}=require('node:test'),A=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),M=require('../src/model.js');
function setup(){
 const root=path.resolve(__dirname,'..'),D=JSON.parse(fs.readFileSync(path.join(root,'data/stories.json'))),plan=require('../tools/silma-target/plan.json');Object.assign(D.guides,plan.guides);D.stories.forEach(s=>s.meaning_feedback=plan.meaning_feedback[s.id]);
 const nodes={},events={},storage={},plays=[];let ended=null;
 function node(id){return nodes[id]||(nodes[id]={innerHTML:'',textContent:'',style:{},setAttribute(){},focus(){}})}
 const doc={documentElement:{},getElementById:node,addEventListener:(name,fn)=>events[name]=fn};
 const w={STORY_DATA:D,STORY_MODEL:M,scrollTo(){},addEventListener(){},APP360_STORY_AUDIO:{play(p,end){plays.push(p);ended=end},stop(){ended=null},warm(){},unlock(){},onState(){}}};w.parent=w;
 const ctx={window:w,document:doc,navigator:{},Audio:function(){this.pause=()=>{}},localStorage:{getItem:k=>storage[k]||null,setItem:(k,v)=>storage[k]=v},setTimeout(){},clearTimeout(){},setInterval(){},console};
 vm.runInNewContext(fs.readFileSync(path.join(root,'tools/silma-target/app.js'),'utf8'),ctx);
 function click(cmd,value){events.click({target:{getAttribute:k=>k==='data-do'?cmd:k==='data-value'?String(value):null,parentNode:doc}})}
 return {w,D,plays,nodes,click,finish(){const cb=ended;ended=null;if(cb)cb()},clear(){plays.length=0}};
}
test('correct picture explains the answer and prompts Next without advancing the child',()=>{
 const r=setup();r.w.APP360_STORY.open('ar-cup','meaning');r.clear();r.click('meaning',0);A.match(r.nodes.app.innerHTML,/الْكِتَابُ حَجَبَ الْكُوبَ/);A.doesNotMatch(r.nodes.app.innerHTML,/ماذا لاحظت/);r.finish();r.finish();A.deepEqual(r.plays,['audio/ar-guide-meaning-found.mp3','audio/ar-cup-meaning-feedback.mp3','audio/ar-guide-continue.mp3']);A.equal(r.w.APP360_STORY.snapshot().page,'meaning');
});
test('wrong picture replays the question and never discloses the successful answer',()=>{
 const r=setup();r.w.APP360_STORY.open('ar-cup','meaning');r.clear();r.click('meaning',1);r.finish();A.deepEqual(r.plays,['audio/ar-guide-retry.mp3','audio/ar-cup-question.mp3']);A.doesNotMatch(r.nodes.app.innerHTML,/الْكِتَابُ حَجَبَ الْكُوبَ/);
});
test('leaving a step cancels the rest of the response and disabling guidance prevents it',()=>{
 const r=setup();r.w.APP360_STORY.open('ar-cup','meaning');r.click('meaning',0);r.click('library');r.clear();r.finish();A.deepEqual(r.plays,[]);r.w.APP360_STORY.open('ar-cup','meaning');r.click('voice');r.clear();r.click('meaning',0);r.finish();A.deepEqual(r.plays,[]);
});
test('each Arabic story has an answer-specific narration and the trainer remains inactive',()=>{
 const r=setup();const rows=r.D.stories.filter(s=>s.language==='ar');A.equal(rows.length,42);A.equal(new Set(rows.map(s=>s.meaning_feedback.audio)).size,42);for(const s of rows){A(s.meaning_feedback.text.length>15);A(!s.meaning_feedback.text.includes('ماذا لاحظت'))}const coach=require('../data/coach-audio-prepared.json');A.equal(coach.enabled,false);A.equal(Object.keys(coach.clips).length,6);
});
