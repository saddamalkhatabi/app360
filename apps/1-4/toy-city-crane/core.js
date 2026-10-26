(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.ToyCraneCore=factory();})(this,function(){
'use strict';
var MAX=2400,SHAPES=['house','tree','boat','rocket','arch'];
function int(n,min,max,fallback){return typeof n==='number'&&isFinite(n)&&n%1===0&&n>=min&&n<=max?n:fallback;}
function clone(x){return JSON.parse(JSON.stringify(x));}
function settings(x){x=x||{};return {level:int(x.level,1,4,1),players:x.players===2?2:1,theme:['garden','harbor','moon'].indexOf(x.theme)>=0?x.theme:'garden',language:x.language==='en'?'en':'ar',sound:x.sound===true,motion:x.motion!==false,hints:x.hints!==false};}
function board(level,index){level=int(level,1,4,1);index=int(index,0,2,0);var count=level+1,items=[],i;for(i=0;i<count;i++)items.push({id:i,shape:SHAPES[(i+index)%5],source:(i+index+1)%count,target:i,angle:level===4?(i+index)%4:0});return {level:level,index:index,count:count,items:items};}
function fresh(level,players){return {level:int(level,1,4,1),players:players===2?2:1,steps:[]};}
function initial(round){return {index:0,player:0,board:board(round.level,0),column:0,holding:null,rotation:0,placed:[],finished:false,complete:false,results:[]};}
function sourceAt(state,column){for(var i=0;i<state.board.items.length;i++){var p=state.board.items[i];if(p.source===column&&state.placed.indexOf(p.id)<0&&state.holding!==p.id)return p;}return null;}
function targetAt(state,column){for(var i=0;i<state.board.items.length;i++)if(state.board.items[i].target===column)return state.board.items[i];return null;}
function held(state){return state.holding===null?null:state.board.items[state.holding];}
function apply(state,round,step){if(!step||typeof step!=='object'||state.complete)return false;
if(step.kind==='next'){if(!state.finished&&step.skip!==true)return false;state.results.push({player:state.player,project:Math.floor(state.index/round.players),placed:state.placed.length,finished:state.finished});if(state.index===round.players*3-1){state.complete=true;return true;}state.index++;state.player=state.index%round.players;state.board=board(round.level,Math.floor(state.index/round.players));state.column=0;state.holding=null;state.rotation=0;state.placed=[];state.finished=false;return true;}
if(state.finished)return false;
if(step.kind==='move'){if(int(step.column,0,state.board.count-1,-1)<0||step.column===state.column)return false;state.column=step.column;return true;}
if(step.kind==='pick'){if(state.holding!==null)return false;var piece=sourceAt(state,state.column);if(!piece)return false;state.holding=piece.id;state.rotation=0;return true;}
if(step.kind==='rotate'){if(round.level!==4||state.holding===null)return false;state.rotation=(state.rotation+1)%4;return true;}
if(step.kind==='place'){piece=held(state);if(!piece||piece.target!==state.column||piece.angle!==state.rotation)return false;state.placed.push(piece.id);state.holding=null;state.rotation=0;state.finished=state.placed.length===state.board.count;return true;}
return false;}
function command(round,state,step){if(round.steps.length>=MAX)return false;var copy=clone(state);if(!apply(copy,round,step))return false;for(var k in copy)if(Object.prototype.hasOwnProperty.call(copy,k))state[k]=copy[k];round.steps.push(step.kind==='move'?{kind:'move',column:step.column}:step.kind==='next'?{kind:'next',skip:step.skip===true}:{kind:step.kind});return true;}
function replay(raw,level,players){var round=fresh(level,players),state=initial(round);if(!raw||raw.level!==round.level||raw.players!==round.players||!Array.isArray(raw.steps)||raw.steps.length>MAX)return {round:round,state:state};for(var i=0;i<raw.steps.length;i++)if(!command(round,state,raw.steps[i])){round=fresh(level,players);return {round:round,state:initial(round)};}return {round:round,state:state};}
function state(round){return replay(round,round.level,round.players).state;}
function undo(round){return round.steps.length?!!round.steps.pop():false;}
function suggest(state){if(state.finished||state.complete)return null;var p=held(state);if(!p){p=sourceAt(state,state.column);if(!p)for(var i=0;i<state.board.items.length;i++)if(state.placed.indexOf(i)<0){p=state.board.items[i];break;}return p.source!==state.column?{kind:'move',column:p.source}:{kind:'pick'};}if(state.column!==p.target)return {kind:'move',column:p.target};if(state.rotation!==p.angle)return {kind:'rotate'};return {kind:'place'};}
function key(s){return s.level+':'+s.players;}
function restore(raw,defaults){var out={schema:1,settings:settings(defaults),games:{}};if(raw&&raw.schema===1){out.settings=settings(raw.settings);for(var l=1;l<=4;l++)for(var p=1;p<=2;p++){var k=l+':'+p;if(raw.games&&Object.prototype.hasOwnProperty.call(raw.games,k))out.games[k]={round:replay(raw.games[k]&&raw.games[k].round,l,p).round};}}return out;}
return {settings:settings,board:board,fresh:fresh,initial:initial,sourceAt:sourceAt,targetAt:targetAt,held:held,command:command,replay:replay,state:state,undo:undo,suggest:suggest,key:key,restore:restore,clone:clone,maxSteps:MAX};
});
