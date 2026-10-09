/* Worker 2 experimental narration adapter. Does not alter game state. ES5 for older tablets. */
(function(w,d){
'use strict';
var map={},clip=null,lit=null,active=false,loaded=false;
function el(id){return d.getElementById(id)}
function clear(){if(lit){lit.className=lit.className.replace(/\bsilma-lit\b/g,'').replace(/\s+/g,' ');lit=null}}
function focus(id){clear();var e=el(id);if(!e)return;lit=e;if((' '+e.className+' ').indexOf(' silma-lit ')<0)e.className+=' silma-lit'}
function stop(){if(clip){try{clip.pause();clip.currentTime=0}catch(e){}}clear()}
function play(key,focusId){
 if(!active)return false;
 var row=map[key];if(!row||row.ready!==true||!row.path)return false;
 stop();focus(focusId||row.focus||'puzzleTitle');
 try{clip=new Audio(row.path);clip.preload='auto';clip.onended=clear;clip.onerror=clear;var p=clip.play();if(p&&p.catch)p.catch(clear);return true}catch(e){clear();return false}
}
function fallback(text){if(!active||!w.soundEnabled)return false;try{if(typeof w.speakTts==='function')return w.speakTts(text)}catch(e){}return false}
function puzzleKey(){return 'puzzle-'+(w.level||0)+'-'+(w.puzzleIndex||0)}
function announce(){
 if(!w.soundEnabled)return;
 focus('puzzleTitle');
 var row=map[puzzleKey()];
 if(play(puzzleKey(),'puzzleTitle'))return;
 if(!row||row.ready!==true)fallback('هيا نركب '+((w.currentPuzzle&&w.currentPuzzle().name)||'الشكل')+'. اسحب القطعة إلى ظلها.');
}
function hint(){focus('gameCanvas');if(!play('hint','gameCanvas'))fallback('انظر إلى مكان القطعة في الظل، ثم قرّب القطعة منه.')}
function load(){
 try{var x=new XMLHttpRequest();x.open('GET','audio/silma/worker-2-manifest.json?v=1',true);
 x.onreadystatechange=function(){if(x.readyState!==4)return;loaded=true;if(x.status<200||x.status>=300)return;try{var j=JSON.parse(x.responseText),a=j.items||[];for(var i=0;i<a.length;i++)map[a[i].key]=a[i]}catch(e){}};x.send(null)}catch(e){}
}
function attach(){
 if(typeof w.refresh!=='function')return;
 active=true;load();
 var oldRefresh=w.refresh;
 w.refresh=function(reset){stop();var result=oldRefresh(reset);setTimeout(function(){focus('puzzleTitle');if(w.soundEnabled)announce()},90);return result};
 var actions=d.querySelector?d.querySelector('.missionActions'):null,button;
 if(actions){button=d.createElement('button');button.type='button';button.id='silmaReplay';button.className='textBtn';button.appendChild(d.createTextNode('🔁 استمع'));actions.appendChild(button);button.onclick=function(){announce()}}
 var h=el('hintBtn');if(h&&h.addEventListener)h.addEventListener('click',function(){setTimeout(hint,30)},false);
 var sound=el('soundBtn');if(sound&&sound.addEventListener)sound.addEventListener('click',function(){if(!w.soundEnabled)stop()},false);
 focus('puzzleTitle');
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',attach,false);else attach();
})(window,document);
