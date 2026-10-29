(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory(require('./world-content.js'));else root.WonderWorldCore=factory(root.WonderWorldContent);})(this,function(content){
'use strict';
function copy(x){return JSON.parse(JSON.stringify(x));}
function list(age,level){return content.experiments.filter(function(e){return e.age===age&&e.level===level;});}
function find(id,age){for(var i=0;i<content.experiments.length;i++){var e=content.experiments[i];if(e.id===id&&(!age||age===e.age))return e;}return null;}
function fresh(e){return {id:e.id,events:[],values:copy(e.initial),step:0,mistakes:0};}
function done(r,e){return r.step===e.steps.length;}
function apply(r,e,id,n){
 if(done(r,e))return false;
 var s=e.steps[r.step],valid=id===s.answer;
 if(s.kind==='range')valid=valid&&typeof n==='number'&&n%1===0&&n>=s.target[0]&&n<=s.target[1];
 if(!valid){r.mistakes=Math.min(99,r.mistakes+1);return false;}
 r.events.push({id:id,value:s.kind==='range'?n:null});
 if(s.kind==='range')r.values[s.key]=n;
 for(var k in s.effect)if(Object.prototype.hasOwnProperty.call(s.effect,k))r.values[k]=s.effect[k];
 r.step++;return true;
}
function restore(raw,e){
 var r=fresh(e);if(!raw||raw.id!==e.id||!Array.isArray(raw.events)||raw.events.length>e.steps.length)return r;
 for(var i=0;i<raw.events.length;i++){var event=raw.events[i];if(!event||!apply(r,e,event.id,event.value))return fresh(e);}
 if(typeof raw.mistakes==='number'&&raw.mistakes%1===0&&raw.mistakes>=0&&raw.mistakes<=99)r.mistakes=raw.mistakes;
 return r;
}
function undo(r,e){if(!r.events.length)return r;var x=copy(r);x.events.pop();return restore(x,e);}
function store(raw,age){
 var result={schema:1,level:1,selected:{},rounds:{}};
 if(raw&&raw.schema===1&&typeof raw.level==='number'&&raw.level%1===0&&raw.level>=1&&raw.level<=4)result.level=raw.level;
 for(var level=1;level<=4;level++){var choices=list(age,level),id=raw&&raw.selected&&raw.selected[level];result.selected[level]=choices[0].id;for(var i=0;i<choices.length;i++){var e=choices[i];if(e.id===id)result.selected[level]=id;if(raw&&raw.schema===1&&raw.rounds&&Object.prototype.hasOwnProperty.call(raw.rounds,e.id))result.rounds[e.id]=restore(raw.rounds[e.id],e);}}
 return result;
}
return {list:list,find:find,fresh:fresh,apply:apply,restore:restore,undo:undo,store:store,done:done,copy:copy};
});
