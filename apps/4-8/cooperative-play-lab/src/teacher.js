/* Demonstration only: this controller cannot write practice drafts or agreements. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.COOPERATE_TEACHER=factory()})(this,function(){'use strict';
function create(o){var ids=[],index=0,scene=0,running=false,ended=false,epoch=0,timer=null,encouraging=false;
function snapshot(){return{ids:ids.slice(),id:ids[index]||'',index:index,scene:scene,running:running,ended:ended,encouraging:encouraging}}
function cancel(){epoch++;if(timer!==null)o.clearTimeout(timer);timer=null;encouraging=false;o.stop()}
function show(){o.render(snapshot())}
function tick(){cancel();if(!running||!ids.length)return;var token=epoch,settled=false;show();o.speak(snapshot(),function(error){if(settled||token!==epoch||!running)return;settled=true;if(error){running=false;cancel();show();o.error(error);return}timer=o.setTimeout(function(){timer=null;if(token!==epoch||!running)return;if(scene<7){scene++;tick();return}function next(){if(token!==epoch||!running)return;encouraging=false;if(index+1<ids.length){index++;scene=0;tick()}else{running=false;ended=true;cancel();show()}}if(o.encourage){encouraging=true;show();o.encourage(snapshot(),next)}else next()},900)})}
function pause(){running=false;cancel();show()}
function play(){if(!ids.length)return;if(ended){index=scene=0;ended=false}running=true;tick()}
function start(list){cancel();ids=list.slice();index=scene=0;ended=false;running=ids.length>0;if(running)tick();else show()}
function move(delta,wholeCase){if(!ids.length)return;var resume=running;cancel();ended=false;if(wholeCase){index=Math.max(0,Math.min(ids.length-1,index+delta));scene=0}else scene=Math.max(0,Math.min(7,scene+delta));running=resume;if(running)tick();else show()}
function close(){running=false;cancel();ids=[];ended=false}
return{start:start,pause:pause,play:play,move:move,close:close,snapshot:snapshot}}
return{create:create};
});
