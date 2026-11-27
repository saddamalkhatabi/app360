(function(w){
'use strict';
if(w.APP360_FAMILY_FAST_START&&w.APP360_FAMILY_FAST_START.__ready)return;
var VERSION='1.0.0',queuedOpen=null,queuedClose=false,timer=0,tries=0;
var existing=w.APP360_FAMILY_SHELL;
function isReal(x){return !!(x&&x.__ready&&!x.__a360FastQueue&&typeof x.openApp==='function')}
if(!isReal(existing)){
  w.APP360_FAMILY_SHELL={
    __ready:false,
    __a360FastQueue:true,
    version:VERSION+'-queue',
    openApp:function(id,approved,launchAge){queuedOpen=id?[String(id),approved,launchAge]:null;queuedClose=false;return true},
    closeApp:function(){queuedClose=true;queuedOpen=null;return true},
    getActiveApp:function(){return null},
    getActivePath:function(){return''},
    getFrame:function(){return null},
    capturePreview:function(){return''},
    getStateSummary:function(){return''},
    setVoiceActive:function(){return false}
  };
}
function flush(){var sh=w.APP360_FAMILY_SHELL;if(!isReal(sh)){tries++;if(tries>400&&timer){clearInterval(timer);timer=0}return}if(timer){clearInterval(timer);timer=0}if(queuedClose&&sh.closeApp){queuedClose=false;try{sh.closeApp()}catch(e){}}else if(queuedOpen&&sh.openApp){var args=queuedOpen;queuedOpen=null;try{sh.openApp.apply(sh,args)}catch(e2){}}}
timer=setInterval(flush,25);
w.APP360_FAMILY_FAST_START={__ready:true,version:VERSION,flush:flush,getQueuedApp:function(){return queuedOpen?queuedOpen[0]:''}};
})(window);
