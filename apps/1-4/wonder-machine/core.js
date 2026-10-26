(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory(require('./content.js'));else root.WonderMachineCore=factory(root.WonderMachineContent);})(this,function(content){
'use strict';
var tools=['light','wheel','lever','wind'],limits={light:1,wheel:2,lever:1,wind:3};
function number(x,min,max,fallback){return typeof x==='number'&&x%1===0&&x>=min&&x<=max?x:fallback;}
function settings(x){x=x||{};return {level:number(x.level,1,4,1),players:x.players===2?2:1,theme:['garden','harbor','lunar'].indexOf(x.theme)>=0?x.theme:'garden',language:x.language==='en'?'en':'ar',sound:x.sound===true,motion:x.motion!==false,hints:x.hints!==false};}
function machine(x){x=x||{};return {light:number(x.light,0,1,0),wheel:number(x.wheel,0,2,0),lever:number(x.lever,0,1,0),wind:number(x.wind,0,3,0)};}
function tasks(level){return content.tasks.filter(function(t){return t.level===level;});}
function task(level,id){var list=tasks(level);for(var i=0;i<list.length;i++)if(list[i].id===id)return list[i];return list[0]||null;}
function key(level,id){var found=task(level,id);return String(level)+':'+(found?found.id:'free');}
function create(level,id){var found=task(level,id);return {machine:machine(found&&found.initial),turn:0,history:[]};}
function validMachine(x){if(!x||typeof x!=='object')return false;for(var i=0;i<tools.length;i++){var k=tools[i];if(number(x[k],0,limits[k],-1)<0)return false;}return true;}
function restore(raw,level,id){var fresh=create(level,id);if(!raw||!validMachine(raw.machine)||[0,1].indexOf(raw.turn)<0||!Array.isArray(raw.history)||raw.history.length>30)return fresh;var history=[];for(var i=0;i<raw.history.length;i++){var h=raw.history[i];if(!h||!validMachine(h.machine)||[0,1].indexOf(h.turn)<0)return fresh;history.push({machine:machine(h.machine),turn:h.turn});}return {machine:machine(raw.machine),turn:raw.turn,history:history};}
function progress(m,found){if(!found)return {count:0,total:0,done:false,next:null};var count=0,next=null;for(var i=0;i<found.targets.length;i++){var target=found.targets[i];if(m[target.tool]===target.value)count++;else if(next===null)next=target;}return {count:count,total:found.targets.length,done:count===found.targets.length,next:next};}
function apply(round,tool,value,input){var s=settings(input);if(tools.indexOf(tool)<0||(s.level===1&&tool!=='light')||number(value,0,limits[tool],-1)<0||round.machine[tool]===value)return false;round.history.push({machine:machine(round.machine),turn:round.turn});if(round.history.length>30)round.history.shift();round.machine[tool]=value;if(s.players===2)round.turn=round.turn===0?1:0;return true;}
function undo(round){var last=round.history.pop();if(!last)return false;round.machine=machine(last.machine);round.turn=last.turn;return true;}
function nextValue(m,tool){return (m[tool]+1)%(limits[tool]+1);}
function restoreStore(raw,defaults){var s=settings(defaults),selected={},rounds={},level,i,found;if(!raw||raw.schema!==1)return {settings:s,selected:selected,rounds:rounds};s=settings(raw.settings);for(level=1;level<=4;level++){found=task(level,raw.selected&&raw.selected[level]);if(found)selected[level]=found.id;var list=tasks(level);if(!list.length)list=[null];for(i=0;i<list.length;i++){var id=list[i]?list[i].id:null,k=key(level,id);if(raw.rounds&&Object.prototype.hasOwnProperty.call(raw.rounds,k))rounds[k]=restore(raw.rounds[k],level,id);}}return {settings:s,selected:selected,rounds:rounds};}
return {tools:tools,limits:limits,settings:settings,machine:machine,tasks:tasks,task:task,key:key,create:create,restore:restore,progress:progress,apply:apply,undo:undo,nextValue:nextValue,restoreStore:restoreStore};
});
