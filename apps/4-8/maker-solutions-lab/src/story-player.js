(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MAKER_STORY_PLAYER=factory();}(this,function(){'use strict';
// One owned timer and a generation token: late audio callbacks cannot advance another scene.
function create(options){var count=options.count,index=Math.max(0,Math.min(count-1,options.start||0)),playing=false,ended=false,dead=false,timer=0,generation=0,set=options.setTimeout||setTimeout,clear=options.clearTimeout||clearTimeout;
if(!count)throw Error('empty-story');
function state(){return {index:index,count:count,playing:playing,ended:ended};}
function emit(){if(options.onState)options.onState(state());}
function cancel(){generation++;if(timer){clear(timer);timer=0;}if(options.stop)options.stop();}
function paint(){options.onScene(index,state());emit();}
function advance(token){if(dead||!playing||token!==generation)return;timer=0;if(index===count-1){playing=false;ended=true;emit();if(options.onFinish)options.onFinish();return;}index++;paint();listen();}
function listen(){cancel();var token=generation,settled=false;function complete(ok){if(settled||dead||!playing||token!==generation)return;settled=true;if(timer){clear(timer);timer=0;}if(ok===false){playing=false;emit();return;}timer=set(function(){advance(token);},options.holdMs||1400);}
// A stalled media request pauses; it never skips an unheard explanation.
timer=set(function(){complete(false);},45000);
if(options.narrate)options.narrate(index,complete);else{clear(timer);timer=set(function(){advance(token);},options.silentMs||6500);}
}
function pause(){if(dead)return;playing=false;cancel();emit();}
function select(n,read){if(dead)return;pause();index=Math.max(0,Math.min(count-1,n));ended=false;paint();if(read&&options.narrate)options.narrate(index,function(){});}
function play(){if(dead)return;if(playing)return;if(ended){index=0;ended=false;paint();}playing=true;emit();listen();}
function destroy(){if(dead)return;playing=false;cancel();dead=true;}
paint();return {state:state,play:play,pause:pause,select:select,next:function(){select(index+1,true);},previous:function(){select(index-1,true);},restart:function(){select(0,false);play();},destroy:destroy};
}
return {create:create};
}));
