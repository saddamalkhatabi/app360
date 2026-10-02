'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../../../../assets/js/app360-read-along-v1.js'),'utf8');
function setup(){
 const timers=new Map();let next=0,clock={path:'clip',state:'playing',time:0};
 const root={textContent:'عُمَرُ يَلْعَبُ.',getAttribute(n){return n==='data-ra-path'?'clip':null},querySelectorAll(){return nodes}};
 const nodes=[0,1].map(index=>({parentNode:root,className:'ra-token',textContent:['عُمَرُ','يَلْعَبُ.'][index],getAttribute(){return String(index)},setAttribute(){},removeAttribute(){}}));
 const document={hidden:false,querySelectorAll(){return[root]},addEventListener(){},removeEventListener(){}};
 const window={setTimeout(fn){const id=++next;timers.set(id,fn);return id},clearTimeout(id){timers.delete(id)},addEventListener(){},removeEventListener(){},innerHeight:900};
 vm.runInNewContext(source,{window,document,XMLHttpRequest:class{}});
 const entry={text:'عُمَرُ يَلْعَبُ.',language:'ar',duration:1800,cues:[[0,100,450],[1,650,1500]]};
 const api=window.APP360_READ_ALONG,reader=api.create({clock:()=>clock,resolve:()=>entry});
 return{api,reader,nodes,timers,setClock(c){clock=Object.assign({},clock,c)},tick(){const pair=timers.entries().next().value;assert.ok(pair,'one scheduled tick');timers.delete(pair[0]);pair[1]()}};
}
test('Arabic words retain connected letters, vowel marks, punctuation and escaped HTML',()=>{
 const r=setup(),html=r.api.markup('عُمَرُ يَلْعَبُ. <img>','a"b');
 assert.equal((html.match(/class="ra-token"/g)||[]).length,3);assert.ok(html.includes('عُمَرُ</span> '));assert.ok(html.includes('يَلْعَبُ.'));assert.ok(html.includes('&lt;img&gt;'));assert.ok(html.includes('a&quot;b'));assert.equal(r.api.normal('عُمَرُ'),'عمر');
});
test('the real playback clock selects words, retains silent gaps, and supports seeking back',()=>{
 const r=setup();r.reader.follow('clip');assert.equal(r.timers.size,1);
 r.setClock({time:.2});r.tick();assert.match(r.nodes[0].className,/ra-active/);assert.doesNotMatch(r.nodes[1].className,/ra-active/);
 r.setClock({time:.55});r.tick();assert.ok(r.nodes.every(n=>!n.className.includes('ra-active')));
 r.setClock({time:1});r.tick();assert.match(r.nodes[1].className,/ra-active/);
 r.setClock({time:.15});r.tick();assert.match(r.nodes[0].className,/ra-active/);assert.equal(r.timers.size,1);
});
test('paused playback freezes the word; stopping removes both highlighting and the timer',()=>{
 const r=setup();r.reader.follow('clip');r.setClock({time:.2});r.tick();r.setClock({state:'paused',time:1});r.tick();assert.match(r.nodes[0].className,/ra-active/);
 r.reader.stop();assert.equal(r.timers.size,0);assert.ok(r.nodes.every(n=>!n.className.includes('ra-active')));assert.equal(r.reader.debug().path,'');
});
test('a clock for another clip cannot keep stale highlighting or scheduled work alive',()=>{
 const r=setup();r.reader.follow('clip');r.setClock({time:.2});r.tick();r.setClock({path:'other'});r.tick();assert.equal(r.timers.size,0);assert.ok(r.nodes.every(n=>!n.className.includes('ra-active')));
});
test('edited text is never highlighted against a different recorded sentence',()=>{
 const r=setup();r.nodes[0].parentNode.textContent='تعليقي الخاص';r.reader.follow('clip');r.setClock({time:.2});r.tick();assert.ok(r.nodes.every(n=>!n.className.includes('ra-active')));
 assert.notEqual(r.api.normal('سَأَلَ'),r.api.normal('سَالَ'));
});
test('synchronous cached data and repeated refreshes never create extra playback loops',()=>{
 const r=setup();r.reader.follow('clip');r.reader.refresh();r.reader.refresh();assert.equal(r.timers.size,1);r.setClock({time:.2});r.tick();const changes=r.reader.debug().changes;r.tick();assert.equal(r.reader.debug().changes,changes);r.reader.destroy();assert.equal(r.timers.size,0);
});
test('every shipped cue matches a real file and covers the text with ordered, bounded timings',{skip:!fs.existsSync(path.join(__dirname,'../data/read-along'))},()=>{
 const dir=path.join(__dirname,'../data/read-along');
 const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/audio-manifest.json'),'utf8'));
 const items=Object.assign({},...fs.readdirSync(dir).filter(p=>p.endsWith('.json')).map(p=>JSON.parse(fs.readFileSync(path.join(dir,p),'utf8')).items));
 assert.equal(Object.keys(items).length,manifest.items.length);
 const r=setup();
 for(const item of manifest.items){const entry=items[item.path];assert.equal(entry.text,item.text);assert.ok(fs.statSync(path.join(__dirname,'..',item.path)).size>0);assert.ok(entry.duration>0);const words=entry.text.match(/\S+/g)||[];assert.equal(entry.cues.length,words.length);let previous=-1;
  for(const [index,start,end] of entry.cues){assert.ok(index>=0&&index<words.length);assert.ok(start>=previous&&start>=0&&end>start&&end<=entry.duration+1,`${item.path}: ${start} ${end}`);assert.equal(r.api.cueIndex(entry.cues,(start+end)/2),index);previous=start;}}
});
