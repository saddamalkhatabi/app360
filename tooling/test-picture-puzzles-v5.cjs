'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..'),code=fs.readFileSync(root+'/apps/1-4/picture-puzzles/app-v3.js','utf8');
function boot(search='',saved={}){
 const nodes={},events={},timers=[],circles=[];const context=new Proxy({arc(...a){circles.push(a)}},{get(o,k){return k in o?o[k]:function(){}}});
 function node(id){return nodes[id]||(nodes[id]={id,style:{},className:'',value:'classic',innerHTML:'',textContent:'',setAttribute(k,v){this[k]=v},addEventListener(type,fn){events[id+':'+type]=fn},getBoundingClientRect(){return {left:0,top:0,width:390,height:470}},getContext(){return context}})}
 const document={body:{className:''},hidden:false,getElementById:node,getElementsByClassName(){return []},addEventListener(type,fn){events['document:'+type]=fn}};
 const store={...saved},window={devicePixelRatio:1,APP360_WORD_IMAGE_CONTEXT_MAP:{'الأسرة\u0001أم':'w0001.jpg'},localStorage:{getItem(k){return store[k]??null},setItem(k,v){store[k]=v}},addEventListener(t,fn){events['window:'+t]=fn},removeEventListener(){},requestAnimationFrame(){},location:{search}};
 class Image{set src(v){this.width=400;this.height=400;this.naturalWidth=400;this.naturalHeight=400;this.onload()}}
 const source=code.replace('parseLibrary();loadPrefs();','window.testPuzzle={get:function(){return {tiles:tiles,drag:drag,selected:selected,hint:hint,level:level,touchId:touchId,won:won}},begin:beginDrag,move:moveDrag,end:endDrag,resize:size,reset:reset,setLevel:setLevel,draw:draw};parseLibrary();loadPrefs();');
 vm.runInNewContext(source,{window,document,localStorage:window.localStorage,navigator:{},location:{search,protocol:'file:'},Image,setTimeout(fn,ms){timers.push({fn,ms});return timers.length},clearTimeout(){},Date,Math,console});
 return {api:window.testPuzzle,events,nodes,store,circles,timers};
}
const child=boot(),older=boot('?launch_age=4-8');assert.equal(child.api.get().level,0);assert(child.api.get().hint);assert.equal(older.api.get().level,1);assert(!older.api.get().hint);
let t=child.api.get().tiles[0];child.api.begin({x:t.trayX+3,y:t.trayY+4});assert.equal(child.api.get().drag.tile.id,t.id);child.api.move({x:t.targetX+3,y:t.targetY+4});assert.equal(t.x,t.targetX);assert.equal(t.y,t.targetY);child.api.end();assert(t.placed,'drag preserves finger offset and snaps');
t=child.api.get().tiles[1];child.api.begin({x:t.trayX,y:t.trayY});child.api.end();assert.equal(t.state,'tray');assert.equal(child.api.get().selected.id,t.id);child.api.begin({x:t.targetX,y:t.targetY});assert(t.placed,'tap piece then correct slot works');
t=child.api.get().tiles[2];child.api.begin({x:t.trayX,y:t.trayY});child.api.move({x:2,y:3});child.api.resize();assert(!child.api.get().drag);assert(child.api.get().tiles.every(t=>t.state==='tray'||t.placed),'resize never hides a piece');assert.equal(child.api.get().tiles.filter(t=>t.placed).length,2);
function touch(id,x,y){return {identifier:id,clientX:x,clientY:y}}function event(touches,changed){return {touches,changedTouches:changed,preventDefault(){},cancelable:true}}
const multi=boot();t=multi.api.get().tiles[0];let a=touch(1,t.trayX,t.trayY),b=touch(2,4,4);multi.events['gameCanvas:touchstart'](event([a],[a]));multi.events['gameCanvas:touchstart'](event([a,b],[b]));assert.equal(multi.api.get().touchId,1);multi.events['document:touchend'](event([a],[b]));assert(multi.api.get().drag,'second finger release must not lose piece');multi.events['document:touchcancel'](event([],[a]));assert(!multi.api.get().drag);assert.equal(t.state,'tray');
const hint=boot();t=hint.api.get().tiles[0];hint.api.begin({x:t.trayX,y:t.trayY});assert(hint.circles.some(c=>c[0]===t.targetX&&c[1]===t.targetY),'hint draws circle at chosen target');
for(const puzzle of [child,older])for(const level of [0,1,2]){puzzle.api.setLevel(level);const ts=puzzle.api.get().tiles;for(let i=0;i<ts.length;i++)for(let j=i+1;j<ts.length;j++){let a=ts[i],b=ts[j];assert(Math.abs(a.trayX-b.trayX)>=(a.bw*a.trayScale+b.bw*b.trayScale)*100||Math.abs(a.trayY-b.trayY)>=(a.bh*a.trayScale+b.bh*b.trayScale)*100,'normal tray pieces should not overlap')}}
const cat=JSON.parse(fs.readFileSync(root+'/data/catalog.json')),runtime=JSON.parse(fs.readFileSync(root+'/data/runtime-apps.json'));for(const list of [runtime.apps]){const a=list.find(a=>a.id==='a1-picture-puzzles');assert(a.age_groups.includes('4-8'));assert.equal(a.age_entry_levels['4-8'],2)}
assert(fs.readFileSync(root+'/ages/4-8/index.html','utf8').includes('home-catalog-shape-builder-v1.js?v=20261016'));
console.log('Picture puzzle: age defaults, offset drag, tap placement, circle hints, multitouch cancellation, resize preservation, nonoverlapping tray and both catalogs passed');
