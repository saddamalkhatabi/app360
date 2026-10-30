(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory(require('./device-content.js'));else root.WonderDeviceCore=factory(root.WonderDeviceContent);})(this,function(content){
'use strict';
function copy(x){return JSON.parse(JSON.stringify(x));}
function list(age,level){return content.devices.filter(function(d){return d.levels[age]===level;});}
function find(id,age){for(var i=0;i<content.devices.length;i++){var d=content.devices[i];if(d.id===id&&(!age||d.levels[age]))return d;}return null;}
function empty(d){var m={};for(var i=0;i<d.tools.length;i++)m[d.tools[i].key]=0;return m;}
function task(d,id){for(var i=0;i<d.tasks.length;i++)if(d.tasks[i].id===id)return d.tasks[i];return {id:'free',initial:empty(d),goal:null};}
function key(d,id){return d.id+':'+task(d,id).id;}
function valid(d,m){if(!m||typeof m!=='object')return false;for(var i=0;i<d.tools.length;i++)if(m[d.tools[i].key]!==0&&m[d.tools[i].key]!==1)return false;
 if(d.id==='laundry'&&m.run&&!m.door)return false;
 if(d.id==='crossing'&&((m.walk&&(!m.request||!m.check))||(m.check&&!m.request)))return false;
 if(d.id==='fire'&&m.help&&!m.outside)return false;
 return true;
}
function fresh(d,id){return {machine:copy(task(d,id).initial),turn:0,history:[]};}
function restore(raw,d,id){var r=fresh(d,id);if(!raw||!valid(d,raw.machine)||[0,1].indexOf(raw.turn)<0||!Array.isArray(raw.history)||raw.history.length>30)return r;
 for(var i=0;i<raw.history.length;i++)if(!raw.history[i]||!valid(d,raw.history[i].machine)||[0,1].indexOf(raw.history[i].turn)<0)return r;
 var m=empty(d),history=[];for(var k in m)if(Object.prototype.hasOwnProperty.call(m,k))m[k]=raw.machine[k];
 for(i=0;i<raw.history.length;i++){var x=empty(d);for(k in x)if(Object.prototype.hasOwnProperty.call(x,k))x[k]=raw.history[i].machine[k];history.push({machine:x,turn:raw.history[i].turn});}
 return {machine:m,turn:raw.turn,history:history};
}
function guard(d,m,k,n){
 var exists=d.tools.some(function(t){return t.key===k;});if(!exists||(n!==0&&n!==1))return 'invalid';if(m[k]===n)return 'unchanged';
 if(d.id==='laundry'){if(k==='run'&&n===1&&!m.door)return 'closeDoor';if(k==='door'&&n===0&&m.run)return 'stopFirst';}
 if(d.id==='wash'&&k==='soap'&&n===0&&!m.water)return 'openWater';
 if(d.id==='delivery'&&k==='cart'&&!m.door)return 'openDoor';
 if(d.id==='harbor'&&k==='boat'&&!m.bridge)return 'raiseBridge';
 if(d.id==='access'&&k==='ramp'&&n===0&&m.door)return 'closeDoor';
 if(d.id==='crossing'){if(n===0)return 'staySafe';if(k==='check'&&!m.request)return 'waitTraffic';if(k==='walk'&&(!m.request||!m.check))return 'checkWithAdult';}
 if(d.id==='fire'){if(n===0)return 'stayOutside';if(k==='help'&&!m.outside)return 'outsideFirst';}
 return null;
}
function act(r,d,k,n,players){var reason=guard(d,r.machine,k,n);if(reason)return {changed:false,reason:reason};r.history.push({machine:copy(r.machine),turn:r.turn});if(r.history.length>30)r.history.shift();r.machine[k]=n;if(players===2)r.turn=1-r.turn;return {changed:true,reason:null};}
function undo(r){var old=r.history.pop();if(!old)return false;r.machine=old.machine;r.turn=old.turn;return true;}
function progress(m,t){var count=0,total=0,next=null;if(!t.goal)return {count:0,total:0,done:false,next:null};for(var k in t.goal)if(Object.prototype.hasOwnProperty.call(t.goal,k)){total++;if(m[k]===t.goal[k])count++;else if(!next)next={tool:k,value:t.goal[k]};}return {count:count,total:total,done:count===total,next:next};}
function frame(d,m){return m[d.photoKeys[0]]+2*m[d.photoKeys[1]];}
function plan(d,m,t){if(!t.goal)return [{tool:d.tools[0].key,value:1-m[d.tools[0].key]}];var queue=[{m:copy(m),path:[]}],seen={};
 while(queue.length){var item=queue.shift(),signature=d.tools.map(function(x){return item.m[x.key];}).join('');if(seen[signature])continue;seen[signature]=true;if(progress(item.m,t).done)return item.path;
  for(var i=0;i<d.tools.length;i++){var k=d.tools[i].key,n=1-item.m[k];if(guard(d,item.m,k,n))continue;var next=copy(item.m);next[k]=n;queue.push({m:next,path:item.path.concat([{tool:k,value:n}])});}
 }return [];
}
function store(raw,age){var result={schema:3,level:1,selected:{},tasks:{},rounds:{},photo:true};if(raw&&raw.schema===3){if(typeof raw.level==='number'&&raw.level%1===0&&raw.level>=1&&raw.level<=4)result.level=raw.level;result.photo=raw.photo!==false;}
 for(var level=1;level<=4;level++){var choices=list(age,level);result.selected[level]=choices[0].id;for(var i=0;i<choices.length;i++){var d=choices[i];if(raw&&raw.schema===3&&raw.selected&&raw.selected[level]===d.id)result.selected[level]=d.id;var selected=task(d,raw&&raw.schema===3&&raw.tasks&&raw.tasks[d.id]);result.tasks[d.id]=selected.id;
   for(var j=-1;j<d.tasks.length;j++){var id=j<0?'free':d.tasks[j].id,k=key(d,id);if(raw&&raw.schema===3&&raw.rounds&&Object.prototype.hasOwnProperty.call(raw.rounds,k))result.rounds[k]=restore(raw.rounds[k],d,id);}
 }}return result;
}
return {copy:copy,list:list,find:find,empty:empty,task:task,key:key,valid:valid,fresh:fresh,restore:restore,guard:guard,act:act,undo:undo,progress:progress,frame:frame,plan:plan,store:store};
});
