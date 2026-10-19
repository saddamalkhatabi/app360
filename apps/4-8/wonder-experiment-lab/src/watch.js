/* Finite, cancellable viewing queue. No observations, drafts or grades. ES5. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.WONDER_WATCH=factory()})(this,function(){'use strict';
function create(o){var ids=[],at=0,stage=0,running=false,ended=false,timer=null,epoch=0,encouraging=false;
function cancel(){encouraging=false;epoch++;if(timer!==null)o.clearTimeout(timer);timer=null;o.stop()}
function snapshot(){return{ids:ids.slice(),index:at,stage:stage,running:running,ended:ended,encouraging:encouraging,id:ids[at]||''}}
function show(){o.render(snapshot())}
function tick(){cancel();if(!running||!ids.length)return;var token=epoch,called=false;show();o.speak(snapshot(),function(error){if(called||token!==epoch||!running)return;called=true;if(error==='blocked'){pause();o.blocked();return}timer=o.setTimeout(function(){timer=null;if(token!==epoch||!running)return;var last=o.lastStage?o.lastStage(snapshot()):5;if(stage<last){stage++;tick()}else{function next(){if(token!==epoch||!running)return;encouraging=false;if(at+1<ids.length){at++;stage=0;tick()}else{running=false;ended=true;cancel();show()}}if(o.encourage){encouraging=true;show();o.encourage(snapshot(),next)}else next()}},error?4500:850)})}
function start(list){cancel();ids=list.slice();at=stage=0;ended=false;running=ids.length>0;if(running)tick();else show()}
function pause(){running=false;cancel();show()}
function play(){if(!ids.length)return;if(ended){at=stage=0;ended=false}running=true;tick()}
function move(delta,experiment){if(!ids.length)return;var resume=running;cancel();ended=false;if(experiment){at=Math.max(0,Math.min(ids.length-1,at+delta));stage=0}else stage=Math.max(0,Math.min(o.lastStage?o.lastStage(snapshot()):5,stage+delta));running=resume;if(running)tick();else show()}
return{start:start,pause:pause,play:play,move:move,snapshot:snapshot,close:function(){running=false;cancel();ids=[];ended=false}}}
return{create:create};
});
