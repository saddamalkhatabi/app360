/* SILMA worker2 isolated optional adapter. ES5; does not change game data. */
(function(w,d){
'use strict';
var clips={},audio=null,focused=null,replay=null,token=0;
function E(id){return d.getElementById(id)}
function clearFocus(){if(focused){focused.className=focused.className.replace(/\bsilma-lit\b/g,'').replace(/\s+/g,' ');focused=null}}
function stop(){token++;if(audio){audio.onended=null;audio.onerror=null;try{audio.pause();audio.currentTime=0}catch(e){}audio=null}clearFocus()}
function highlight(id){clearFocus();var x=E(id);if(!x)return;focused=x;if((' '+x.className+' ').indexOf(' silma-lit ')<0)x.className+=' silma-lit'}
function key(){return 'puzzle-'+w.level+'-'+w.puzzleIndex}
function canPlay(k){return !!(w.soundEnabled&&clips[k]&&clips[k].ready===true&&clips[k].path)}
function update(){if(!replay)return;replay.disabled=!canPlay(key());replay.title=replay.disabled?'التسجيل الصوتي قيد الإعداد':'استمع إلى تعليمات الشكل'}
function play(k,id){if(!canPlay(k))return false;stop();var row=clips[k],t=token;highlight(id||row.focus||'puzzleTitle');try{audio=new Audio(row.path);audio.onended=function(){if(t===token)stop()};audio.onerror=function(){if(t===token)stop()};var p=audio.play();if(p&&p.catch)p.catch(function(){if(t===token)stop()});return true}catch(e){stop();return false}}
function load(){try{var x=new XMLHttpRequest();x.open('GET','audio/silma/worker-2-manifest.json?v=2',true);x.onreadystatechange=function(){if(x.readyState!==4)return;if(x.status!==200)return;try{var rows=JSON.parse(x.responseText).items||[];for(var i=0;i<rows.length;i++)if(rows[i].key)clips[rows[i].key]=rows[i];update()}catch(e){}};x.send(null)}catch(e){}}
function attach(){if(typeof w.refresh!=='function'||E('silmaReplay'))return;var actions=d.querySelector('.missionActions');if(!actions)return;replay=d.createElement('button');replay.id='silmaReplay';replay.type='button';replay.className='textBtn';replay.appendChild(d.createTextNode('استمع للتعليمات'));actions.appendChild(replay);replay.onclick=function(){play(key(),'puzzleTitle')};var prior=w.refresh;w.refresh=function(reset){stop();var result=prior(reset);update();return result};var hint=E('hintBtn');if(hint&&hint.addEventListener)hint.addEventListener('click',function(){play('hint','gameCanvas')},false);var sound=E('soundBtn');if(sound&&sound.addEventListener)sound.addEventListener('click',function(){if(!w.soundEnabled)stop();update()},false);w.addEventListener('pagehide',stop,false);load();update()}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',attach,false);else attach();
})(window,document);
