/* Worker 2 basket SILMA adapter. ES5; dormant without verified MP3. */
(function(w,d){'use strict';
var rows={},player=null,focusEl=null,seq=0,replay=null;
var parts=['common','category-toys','category-fruits','category-animals','category-home','category-transport','category-nature'];
function E(id){return d.getElementById(id)}
function clear(){if(focusEl){focusEl.className=focusEl.className.replace(/\bsilma-basket-lit\b/g,'').replace(/\s+/g,' ');focusEl=null}}
function stop(){seq++;if(player){player.onended=null;player.onerror=null;try{player.pause();player.currentTime=0}catch(e){}player=null}clear()}
function enabled(){var sound=E('soundBtn');return d.documentElement.lang!=='en'&&sound&&sound.innerHTML.indexOf('🔇')<0}
function mode(){var el=d.querySelector('.modes button.on');return el?el.getAttribute('data-mode'):'basket'}
function ready(key){var r=rows[key];return !!(enabled()&&r&&r.ready===true&&r.path)}
function update(){if(!replay)return;var key=mode();replay.disabled=!ready(key);replay.title=replay.disabled?'التسجيل الصوتي قيد الإعداد':'إعادة تعليمات هذا النمط'}
function highlight(id){clear();var x=E(id);if(!x)return;focusEl=x;if((' '+x.className+' ').indexOf(' silma-basket-lit ')<0)x.className+=' silma-basket-lit'}
function play(key){if(!ready(key))return false;stop();var row=rows[key],t=seq;highlight(row.focus||'missionText');try{player=new Audio(row.path);player.onended=function(){if(t===seq)stop()};player.onerror=function(){if(t===seq)stop()};var p=player.play();if(p&&p.catch)p.catch(function(){if(t===seq)stop()});return true}catch(e){stop();return false}}
function loadPart(name){try{var x=new XMLHttpRequest();x.open('GET','audio/silma/worker-2-'+name+'-v2.json',true);x.onreadystatechange=function(){if(x.readyState!==4||x.status!==200)return;try{var list=JSON.parse(x.responseText).items||[];for(var i=0;i<list.length;i++)if(list[i].key)rows[list[i].key]=list[i];update()}catch(e){}};x.send(null)}catch(e){}}
function attach(){var bar=d.querySelector('.trayHead');if(!bar||E('silmaBasketReplay'))return;replay=d.createElement('button');replay.id='silmaBasketReplay';replay.type='button';replay.appendChild(d.createTextNode('استمع للتعليمات'));bar.appendChild(replay);replay.onclick=function(){play(mode())};var nav=d.querySelector('.modes');if(nav&&nav.addEventListener)nav.addEventListener('click',function(){stop();setTimeout(update,30)},false);var sound=E('soundBtn');if(sound&&sound.addEventListener)sound.addEventListener('click',function(){if(!enabled())stop();update()},false);var ar=E('langAr'),en=E('langEn');if(ar&&ar.addEventListener)ar.addEventListener('click',update,false);if(en&&en.addEventListener)en.addEventListener('click',function(){stop();update()},false);w.addEventListener('pagehide',stop,false);for(var i=0;i<parts.length;i++)loadPart(parts[i]);update()}
w.SILMA_BASKET_V2={play:play,stop:stop,has:ready,mode:mode,update:update};
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',attach,false);else attach();
})(window,document);
