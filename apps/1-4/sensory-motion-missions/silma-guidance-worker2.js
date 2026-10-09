/* Worker 2: optional pre-recorded narration adapter, ES5 compatible. */
(function(w,d){
'use strict';
var clips={},player=null,target=null;
function clear(){if(target){target.style.outline='';target=null}}
function focus(id){clear();var e=d.getElementById(id);if(e){target=e;e.style.outline='3px solid #ffca28'}}
function stop(){if(player){try{player.pause();player.currentTime=0}catch(e){}}clear()}
function play(key){
 var row=clips[key];if(!row||row.ready!==true)return false;
 stop();focus(row.focus||'missionText');
 try{player=new Audio(row.path);player.onended=clear;player.onerror=clear;var p=player.play();if(p&&p.catch)p.catch(clear);return true}catch(e){clear();return false}
}
function load(){
 try{var x=new XMLHttpRequest();x.open('GET','audio/silma/worker-2-manifest.json',true);
 x.onreadystatechange=function(){if(x.readyState!==4||x.status!==200)return;
 try{var rows=JSON.parse(x.responseText).items||[];for(var i=0;i<rows.length;i++)clips[rows[i].key]=rows[i]}catch(e){}};x.send(null)}catch(e){}
}
w.SILMA_BASKET={play:play,focus:focus,stop:stop,has:function(k){return !!(clips[k]&&clips[k].ready)}};
load();
})(window,document);
