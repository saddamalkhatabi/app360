(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.A1ActivityStore=api;}(typeof self!=='undefined'?self:this,function(){'use strict';
var DEFAULT_KEY='app360:a1-imitate:v3:activity';
function cleanNote(v){return String(v||'').trim().slice(0,500)}
function create(storage,key){key=key||DEFAULT_KEY;var memory='{}',persistent=true;
try{var p='__a1_activity_probe__';storage.setItem(p,'1');storage.removeItem(p)}catch(e){storage=null;persistent=false}
function readRaw(){if(storage){try{return storage.getItem(key)||'{}'}catch(e){storage=null;persistent=false}}return memory}
function writeRaw(v){memory=v;if(storage){try{storage.setItem(key,v);return true}catch(e){storage=null;persistent=false}}return false}
function all(){try{var x=JSON.parse(readRaw());return x&&typeof x==='object'&&!Array.isArray(x)?x:{}}catch(e){return{}}}
function save(x){writeRaw(JSON.stringify(x));return x}
function get(id){var x=all(),r=x[id]||{};return{count:Number(r.count)||0,last_done:r.last_done||null,notes:Array.isArray(r.notes)?r.notes:[]}}
function markDone(id,note,at){var x=all(),r=get(id),n=cleanNote(note),stamp=at||new Date().toISOString();r.count+=1;r.last_done=stamp;if(n){r.notes.unshift({at:stamp,text:n});r.notes=r.notes.slice(0,20)}x[id]=r;save(x);return r}
function addNote(id,note,at){var n=cleanNote(note);if(!n)return get(id);var x=all(),r=get(id),stamp=at||new Date().toISOString();r.notes.unshift({at:stamp,text:n});r.notes=r.notes.slice(0,20);x[id]=r;save(x);return r}
function total(){var x=all(),n=0;Object.keys(x).forEach(function(k){n+=Number(x[k].count)||0});return n}
function clear(){memory='{}';if(storage){try{storage.removeItem(key)}catch(e){storage=null;persistent=false}}}
return{isPersistent:function(){return persistent&&!!storage},all:all,get:get,markDone:markDone,addNote:addNote,total:total,clear:clear,exportPayload:function(){return{schema_version:1,app_id:'a1-imitate',exported_at:new Date().toISOString(),activity:all()}}}
}
return{DEFAULT_KEY:DEFAULT_KEY,create:create,cleanNote:cleanNote};
}));