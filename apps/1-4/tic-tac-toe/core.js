(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.TicTacToeCore=factory();})(this,function(){
'use strict';
var LINES=[[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
function pick(v,list,fallback){return list.indexOf(v)>=0?v:fallback;}
function settings(s){s=s||{};return {mode:pick(s.mode,['coop','ai','local'],'coop'),difficulty:pick(Number(s.difficulty),[1,2,3],1),theme:pick(s.theme,['meadow','ocean','cosmos'],'meadow'),marks:pick(s.marks,['friends','classic'],'friends'),language:pick(s.language,['ar','en'],'ar'),sound:s.sound!==false,motion:s.motion!==false};}
function board(r){var b=['','','','','','','','',''];for(var i=0;i<r.moves.length;i++){var m=r.moves[i];b[m.cell]=m.mark;}return b;}
function result(b){for(var i=0;i<LINES.length;i++){var a=LINES[i];if(b[a[0]]&&b[a[0]]===b[a[1]]&&b[a[1]]===b[a[2]])return {winner:b[a[0]],line:a.slice(),ended:true};}return {winner:'',line:[],ended:b.indexOf('')<0};}
function create(s,starter,target){s=settings(s);return {schema:1,mode:s.mode,starter:s.mode!=='coop'&&starter==='O'?'O':'X',target:pick(target,[0,1,2,3,4,5,6,7],Math.floor(Math.random()*8)),moves:[]};}
function turn(r){return r.moves.length%2?(r.starter==='X'?'O':'X'):r.starter;}
function play(r,cell){if(typeof cell!=='number'||cell%1||cell<0||cell>8)return false;var b=board(r);if(b[cell]||result(b).ended)return false;if(r.mode==='coop'&&LINES[r.target].indexOf(cell)<0)return false;r.moves.push({cell:cell,mark:r.mode==='coop'?'X':turn(r)});return true;}
function restore(raw,s){s=settings(s);if(!raw||raw.schema!==1||raw.mode!==s.mode||['X','O'].indexOf(raw.starter)<0||typeof raw.target!=='number'||!isFinite(raw.target)||raw.target%1||raw.target<0||raw.target>7||!Array.isArray(raw.moves)||raw.moves.length>9)return create(s);var r=create(s,raw.starter,raw.target);for(var i=0;i<raw.moves.length;i++){var m=raw.moves[i],mark=r.mode==='coop'?'X':turn(r);if(!m||m.mark!==mark||!play(r,m.cell))return create(s);}return r;}
function empty(b){var a=[];for(var i=0;i<9;i++)if(!b[i])a.push(i);return a;}
function search(b,who,ai,depth){var end=result(b);if(end.ended)return end.winner?(end.winner===ai?10-depth:depth-10):0;var cells=empty(b),best=who===ai?-100:100;for(var i=0;i<cells.length;i++){b[cells[i]]=who;var score=search(b,who==='X'?'O':'X',ai,depth+1);b[cells[i]]='';best=who===ai?Math.max(best,score):Math.min(best,score);}return best;}
function bestMove(b,who){var cells=empty(b),best=-100,chosen=-1;var order=[4,0,2,6,8,1,3,5,7];for(var j=0;j<order.length;j++){var cell=order[j];if(cells.indexOf(cell)<0)continue;b[cell]=who;var score=search(b,who==='X'?'O':'X',who,1);b[cell]='';if(score>best){best=score;chosen=cell;}}return chosen;}
function aiMove(r,difficulty,random){var b=board(r);if(r.mode!=='ai'||turn(r)!=='O'||result(b).ended)return -1;var cells=empty(b),rand=random||Math.random;if(difficulty===3)return bestMove(b,'O');if(difficulty===2){for(var p=0;p<2;p++){var mark=p===0?'O':'X';for(var i=0;i<cells.length;i++){b[cells[i]]=mark;var win=result(b).winner===mark;b[cells[i]]='';if(win)return cells[i];}}if(b[4]==='')return 4;}return cells[Math.min(cells.length-1,Math.max(0,Math.floor(rand()*cells.length)))];}
function hint(r){var b=board(r);if(result(b).ended)return -1;if(r.mode==='coop'){for(var i=0;i<LINES[r.target].length;i++)if(!b[LINES[r.target][i]])return LINES[r.target][i];return -1;}return bestMove(b,turn(r));}
function undo(r){if(!r.moves.length)return false;r.moves.pop();if(r.mode==='ai'&&turn(r)==='O'&&r.moves.length)r.moves.pop();return true;}
return {lines:LINES,settings:settings,board:board,result:result,create:create,restore:restore,turn:turn,play:play,aiMove:aiMove,hint:hint,undo:undo};
});
