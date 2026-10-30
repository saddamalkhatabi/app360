(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.ToyCraneCore=factory();})(this,function(){
'use strict';
var MAX=4800,SHAPES=['house','tree','boat','rocket','arch'],MISSIONS=6;
function int(n,min,max,fallback){return typeof n==='number'&&isFinite(n)&&n%1===0&&n>=min&&n<=max?n:fallback;}
function clone(x){return JSON.parse(JSON.stringify(x));}
function settings(x){x=x||{};return {level:int(x.level,1,4,1),players:x.players===2?2:1,theme:['garden','harbor','moon'].indexOf(x.theme)>=0?x.theme:'garden',language:x.language==='en'?'en':'ar',sound:x.sound===true,motion:x.motion!==false,hints:x.hints!==false};}
function board(level,index,legacy){level=int(level,1,4,1);index=int(index,0,5,0);var count=level+1,items=[],i,reverse=index>=3,ordered=!legacy&&level>=2&&index%3===1;
for(i=0;i<count;i++)items.push({id:i,shape:SHAPES[(i+index)%5],source:reverse?count-1-i:(i+index+1)%count,target:i,angle:level===4?(i+index)%4:0,weight:level<3?1:1+(i+index)%3});
return {level:level,index:index,count:count,items:items,ordered:ordered,tolerance:level===1?18:level===2?12:level===3?8:6};}
function fresh(level,players){return {version:2,level:int(level,1,4,1),players:players===2?2:1,steps:[]};}
function missionCount(round){return MISSIONS;}
function initial(round){return {index:0,player:0,board:board(round.level,0,round.legacy===true),column:0,holding:null,rotation:0,placed:[],finished:false,complete:false,results:[],projects:{}};}
function sourceAt(state,column){for(var i=0;i<state.board.items.length;i++){var p=state.board.items[i];if(p.source===column&&state.placed.indexOf(p.id)<0&&state.holding!==p.id)return p;}return null;}
function targetAt(state,column){return state.board.items[column]||null;}
function held(state){return state.holding===null?null:state.board.items[state.holding];}
function placementIssue(state){var p=held(state);if(!p||p.target!==state.column)return 'wrong';if(p.angle!==state.rotation)return 'angle';if(state.board.ordered&&p.id!==state.placed.length)return 'order';return '';}
function dropIssue(state,load){var issue=placementIssue(state);if(issue)return issue;load=load||{};if(typeof load.angle!=='number'||!isFinite(load.angle)||typeof load.velocity!=='number'||!isFinite(load.velocity)||typeof load.offset!=='number'||!isFinite(load.offset))return 'balance';if(Math.abs(load.angle)>state.board.tolerance||Math.abs(load.velocity)>5||Math.abs(load.offset)>.34)return 'balance';return '';}
function pendulum(load,impulse,weight,dt){dt=Math.max(.001,Math.min(.04,dt||.016));var velocity=(load.velocity-impulse*(18+weight*4)-load.angle*22*dt)*Math.exp(-4.6*dt),angle=Math.max(-32,Math.min(32,load.angle+velocity*dt));if(Math.abs(angle)<.02&&Math.abs(velocity)<.08)return {angle:0,velocity:0};return {angle:angle,velocity:velocity};}
function remember(state){state.projects[state.index]={column:state.column,holding:state.holding,rotation:state.rotation,placed:state.placed.slice(),finished:state.finished};if(state.finished)state.results[state.index]={player:state.player,project:state.board.index,placed:state.placed.length,finished:true};}
function visit(state,round,index){remember(state);state.index=index;state.player=index%round.players;state.board=board(round.level,Math.floor(index/round.players),round.version!==2);var saved=state.projects[index];state.column=saved?saved.column:0;state.holding=saved?saved.holding:null;state.rotation=saved?saved.rotation:0;state.placed=saved?saved.placed.slice():[];state.finished=saved?saved.finished:false;state.complete=false;}
function apply(state,round,step){if(!step||typeof step!=='object')return false;
if(step.kind==='visit'){if(int(step.index,0,round.players*missionCount(round)-1,-1)<0||step.index===state.index&&!state.complete)return false;visit(state,round,step.index);return true;}
if(state.complete)return false;
if(step.kind==='next'){if(!state.finished&&step.skip!==true)return false;remember(state);if(state.index===round.players*missionCount(round)-1){state.complete=true;return true;}visit(state,round,state.index+1);return true;}
if(state.finished)return false;
if(step.kind==='move'){if(int(step.column,0,state.board.count-1,-1)<0||step.column===state.column)return false;state.column=step.column;return true;}
if(step.kind==='pick'){if(state.holding!==null)return false;var piece=sourceAt(state,state.column);if(!piece)return false;state.holding=piece.id;state.rotation=0;return true;}
if(step.kind==='rotate'){if(round.level!==4||state.holding===null)return false;state.rotation=(state.rotation+1)%4;return true;}
if(step.kind==='return'){piece=held(state);if(!piece)return false;state.column=piece.source;state.holding=null;state.rotation=0;return true;}
if(step.kind==='place'){piece=held(state);if(placementIssue(state))return false;state.placed.push(piece.id);state.holding=null;state.rotation=0;state.finished=state.placed.length===state.board.count;return true;}
return false;}
function command(round,state,step){if(round.steps.length>=MAX)return false;var copy=clone(state);if(!apply(copy,round,step))return false;for(var k in copy)if(Object.prototype.hasOwnProperty.call(copy,k))state[k]=copy[k];round.steps.push(step.kind==='move'?{kind:'move',column:step.column}:step.kind==='visit'?{kind:'visit',index:step.index}:step.kind==='next'?{kind:'next',skip:step.skip===true}:{kind:step.kind});return true;}
function replay(raw,level,players){var round=fresh(level,players);var state=initial(round);if(!raw||raw.level!==round.level||raw.players!==round.players||!Array.isArray(raw.steps)||raw.steps.length>MAX)return {round:round,state:state};if(raw.version!==2||raw.legacy===true){round.legacy=true;state=initial(round);}for(var i=0;i<raw.steps.length;i++)if(!command(round,state,raw.steps[i])){round=fresh(level,players);return {round:round,state:initial(round)};}return {round:round,state:state};}
function state(round){return replay(round,round.level,round.players).state;}
function undo(round){return round.steps.length?!!round.steps.pop():false;}
function suggest(state){if(state.finished||state.complete)return null;var p=held(state);if(!p){p=state.board.ordered?state.board.items[state.placed.length]:sourceAt(state,state.column);if(!p)for(var i=0;i<state.board.items.length;i++)if(state.placed.indexOf(i)<0){p=state.board.items[i];break;}return p.source!==state.column?{kind:'move',column:p.source}:{kind:'pick'};}if(state.board.ordered&&p.id!==state.placed.length)return {kind:'return'};if(state.column!==p.target)return {kind:'move',column:p.target};if(state.rotation!==p.angle)return {kind:'rotate'};return {kind:'place'};}
function key(s){return s.level+':'+s.players;}
function restore(raw,defaults){var out={schema:1,settings:settings(defaults),games:{}};if(raw&&raw.schema===1){out.settings=settings(raw.settings);for(var l=1;l<=4;l++)for(var p=1;p<=2;p++){var k=l+':'+p;if(raw.games&&Object.prototype.hasOwnProperty.call(raw.games,k))out.games[k]={round:replay(raw.games[k]&&raw.games[k].round,l,p).round};}}return out;}
return {settings:settings,board:board,fresh:fresh,initial:initial,sourceAt:sourceAt,targetAt:targetAt,held:held,command:command,replay:replay,state:state,undo:undo,suggest:suggest,key:key,restore:restore,clone:clone,maxSteps:MAX,missionCount:missionCount,dropIssue:dropIssue,pendulum:pendulum};
});
