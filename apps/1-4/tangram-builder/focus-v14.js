'use strict';
(function(){
var btn=null,bar=null,inFocus=false,pushed=false;
function has(c){return (' '+(d.body.className||'')+' ').indexOf(' '+c+' ')>=0}
function add(c){if(!has(c))d.body.className+=(d.body.className?' ':'')+c}
function rem(c){d.body.className=(' '+(d.body.className||'')+' ').replace(' '+c+' ',' ').replace(/^\s+|\s+$/g,'')}
function requestFS(){var el=d.getElementById('app'),fn=el&&(el.requestFullscreen||el.webkitRequestFullscreen||el.webkitRequestFullScreen||el.mozRequestFullScreen||el.msRequestFullscreen);try{if(fn)fn.call(el)}catch(e){}}
function exitFS(){var fn=d.exitFullscreen||d.webkitExitFullscreen||d.webkitCancelFullScreen||d.mozCancelFullScreen||d.msExitFullscreen;try{if(fn&&(d.fullscreenElement||d.webkitFullscreenElement||d.webkitCurrentFullScreenElement||d.mozFullScreenElement||d.msFullscreenElement))fn.call(d)}catch(e){}}
function prev(){var total=puzzles[level].length,idx=(puzzleIndex-1+total)%total;setPuzzle(idx)}
function next(){nextPuzzle()}
function enter(){if(inFocus)return;inFocus=true;add('shapeFocus');bar.style.display='block';requestFS();try{if(w.history&&history.pushState){history.pushState({shapeFocus:1},'',location.href);pushed=true}}catch(e){}setTimeout(size,60);setTimeout(size,300)}
function leave(fromPop){if(!inFocus)return;inFocus=false;rem('shapeFocus');bar.style.display='none';exitFS();if(pushed&&!fromPop){try{history.back()}catch(e){}}pushed=false;setTimeout(size,60);setTimeout(size,300)}
function make(){var host=d.querySelector?d.querySelector('.missionActions'):null,app=d.getElementById('app'),h=d.querySelector?d.querySelector('.titleWrap h1'):null;if(h)h.innerHTML='ألغاز تركيب الأشكال';d.title='ألغاز تركيب الأشكال - مختبر التطبيق 360';if(!host||!app)return;btn=d.createElement('button');btn.id='focusBtn';btn.className='textBtn focusLaunch';btn.type='button';btn.innerHTML='⛶ تكبير';host.appendChild(btn);bar=d.createElement('div');bar.id='focusControls';bar.innerHTML='<button type="button" id="focusBack">↩ عودة</button><button type="button" id="focusPrev">السابق</button><button type="button" id="focusNext">التالي</button>';app.appendChild(bar);btn.onclick=enter;d.getElementById('focusBack').onclick=function(){leave(false)};d.getElementById('focusPrev').onclick=prev;d.getElementById('focusNext').onclick=next;w.addEventListener('popstate',function(){if(inFocus)leave(true)},false);d.addEventListener('keydown',function(e){if((e.keyCode||e.which)===27&&inFocus)leave(false)},false)}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',make,false);else make();
})();
