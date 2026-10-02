'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../../../../assets/js/app360-read-along-v1.js'),'utf8');
function setup(options={}){
 const timers=new Map();let next=0,clock={path:'clip',state:'playing',time:0};
 const root={textContent:'عُمَرُ يَلْعَبُ.',getAttribute(n){return n==='data-ra-path'?'clip':null},querySelectorAll(){return nodes}};
 const nodes=[0,1].map(index=>({parentNode:root,className:'ra-token',textContent:['عُمَرُ','يَلْعَبُ.'][index],getAttribute(){return String(index)},setAttribute(){},removeAttribute(){}}));
 function events(target){const listeners=new Map();return Object.assign(target,{listeners,addEventListener(name,fn){if(!listeners.has(name))listeners.set(name,new Set());listeners.get(name).add(fn)},removeEventListener(name,fn){if(listeners.has(name))listeners.get(name).delete(fn)},dispatch(name){for(const fn of listeners.get(name)||[])fn()}})}
 const document=events({hidden:false,querySelectorAll(){return[root]}});
 const window=events({setTimeout(fn){const id=++next;timers.set(id,fn);return id},clearTimeout(id){timers.delete(id)},innerHeight:900});
 const parent=options.parent?{document:events({}),APP360_FAMILY_SYNC:{getReadingFocus:()=>options.parent.enabled}}:window;window.parent=parent;
 const fallback={setAttribute(){},contains(){return false},innerHTML:''},box={hidden:true};
 vm.runInNewContext(source,{window,document,XMLHttpRequest:class{}});
 const entry={text:'عُمَرُ يَلْعَبُ.',language:'ar',duration:1800,cues:[[0,100,450],[1,650,1500]]};
 const api=window.APP360_READ_ALONG,reader=api.create(Object.assign({clock:()=>clock,resolve:()=>entry},options.reader,options.fallback?{fallback,fallbackBox:box}:{}));
 return{api,reader,nodes,timers,document,window,parent,entry,fallback,box,getClock(){return clock},setClock(c){clock=Object.assign({},clock,c)},tick(){const pair=timers.entries().next().value;assert.ok(pair,'one scheduled tick');timers.delete(pair[0]);pair[1]()}};
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
test('word focus can turn off and back on during the same audio without changing its clock',()=>{
 const r=setup();r.reader.follow('clip');r.setClock({time:.2});r.tick();const before=r.getClock();
 r.reader.setEnabled(false);assert.strictEqual(r.getClock(),before);assert.equal(r.timers.size,0);assert.ok(r.nodes.every(n=>!n.className.includes('ra-active')));
 r.setClock({time:1});r.reader.refresh();assert.ok(r.nodes.every(n=>!n.className.includes('ra-active')));const resumed=r.getClock();
 r.reader.setEnabled(true);assert.strictEqual(r.getClock(),resumed);assert.match(r.nodes[1].className,/ra-active/);assert.equal(r.timers.size,1);
 r.reader.setEnabled(true);assert.equal(r.timers.size,1);r.reader.setEnabled('false');assert.equal(r.reader.isEnabled(),true);
});
test('disabled focus preserves the spoken instruction text and performs no tracking loop',()=>{
 const r=setup({reader:{enabled:false},fallback:true});r.reader.follow('clip');r.reader.refresh();
 assert.equal(r.timers.size,0);assert.equal(r.box.hidden,false);assert.match(r.fallback.innerHTML,/عُمَرُ/);assert.equal(r.reader.debug().ticks,0);assert.ok(r.nodes.every(n=>!n.className.includes('ra-active')));
 r.reader.stop();assert.equal(r.box.hidden,true);
});
test('disabled warm-up does not resolve or fetch cue files before playback',()=>{
 let calls=0;const r=setup({reader:{enabled:false,resolve(){calls++;return null}}});r.reader.warm(['a','b']);assert.equal(calls,0);assert.equal(r.reader.debug().requests,0);
});
test('embedded readers follow family changes and release parent listeners when a frame closes',()=>{
 const pref={enabled:false},r=setup({parent:pref});assert.equal(r.reader.isEnabled(),false);r.reader.follow('clip');
 pref.enabled=true;r.parent.document.dispatch('app360:reading-focus');assert.equal(r.reader.isEnabled(),true);assert.equal(r.timers.size,1);
 r.window.dispatch('pagehide');assert.equal(r.timers.size,0);assert.equal(r.parent.document.listeners.get('app360:reading-focus').size,0);
 pref.enabled=false;r.window.dispatch('pageshow');assert.equal(r.reader.isEnabled(),false);assert.equal(r.parent.document.listeners.get('app360:reading-focus').size,1);
 r.reader.destroy();assert.equal(r.parent.document.listeners.get('app360:reading-focus').size,0);assert.equal(r.parent.document.listeners.get('app360:namechange').size,0);
 for(const listeners of r.document.listeners.values())assert.equal(listeners.size,0);for(const listeners of r.window.listeners.values())assert.equal(listeners.size,0);
});
test('a late cue response after disabling cannot restart the highlighting loop',()=>{
 let complete,next=0;const timers=new Map(),entry=setup().entry;
 const doc={hidden:false,querySelectorAll:()=>[],addEventListener(){},removeEventListener(){}},win={setTimeout(fn){const id=++next;timers.set(id,fn);return id},clearTimeout(id){timers.delete(id)},addEventListener(){},removeEventListener(){}};win.parent=win;
 class Request{open(){}send(){complete=()=>{this.status=200;this.responseText=JSON.stringify({items:{clip:entry}});this.onload()}}}
 vm.runInNewContext(source,{window:win,document:doc,XMLHttpRequest:Request});const reader=win.APP360_READ_ALONG.create({clock:()=>({path:'clip',state:'playing',time:1}),resolve:()=>'/cue.json'});
 reader.follow('clip');assert.equal(timers.size,1);reader.setEnabled(false);complete();assert.equal(reader.isEnabled(),false);assert.equal(reader.debug().timer,false);assert.equal(timers.size,0);assert.equal(reader.debug().active,-2);reader.destroy();
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
