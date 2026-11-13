/* The countdown uses only active practice time. ES5 for older tablets. */
(function(w){'use strict';
var DEFAULT_SECONDS=10, EXTENSION_SECONDS=10;
function seconds(value){
 var n=Number(value);
 return isFinite(n)&&n>0?Math.max(1,Math.min(300,Math.round(n))):0;
}
function create(){
 var total=0,left=0,extended=false;
 return {
  reset:function(){total=0;left=0;extended=false},
  start:function(duration){total=left=seconds(duration)||DEFAULT_SECONDS;extended=false},
  tick:function(elapsed){left=Math.max(0,left-elapsed);return left},
  extend:function(){
   if(!total||!left||extended)return 0;
   total+=EXTENSION_SECONDS;
   left+=EXTENSION_SECONDS;
   extended=true;
   return EXTENSION_SECONDS;
  },
  remaining:function(){return left},
  total:function(){return total},
  extended:function(){return extended}
 };
}
var api={create:create,seconds:seconds};
if(typeof module==='object'&&module.exports)module.exports=api;
w.A1PracticeCountdown=api;
})(typeof window!=='undefined'?window:globalThis);
