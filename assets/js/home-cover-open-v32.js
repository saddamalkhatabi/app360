(function(w,d){
'use strict';
var down=false,moved=false,startX=0,startY=0,suppressUntil=0;
function point(e){var t=e&&e.touches&&e.touches[0]?e.touches[0]:(e&&e.changedTouches&&e.changedTouches[0]?e.changedTouches[0]:e);return{x:t&&typeof t.clientX==='number'?t.clientX:0,y:t&&typeof t.clientY==='number'?t.clientY:0}}
function hasClass(n,name){return !!(n&&n.className&&(' '+String(n.className)+' ').indexOf(' '+name+' ')>=0)}
function coverFrom(t){var n=t;while(n&&n!==d){if(hasClass(n,'showcase-cover-link'))return hasClass(n,'disabled')?null:n;n=n.parentNode}return null}
function start(e){var c=coverFrom(e.target||e.srcElement);if(!c)return;var p=point(e);down=true;moved=false;startX=p.x;startY=p.y}
function move(e){if(!down)return;var p=point(e);if(Math.abs(p.x-startX)>10||Math.abs(p.y-startY)>10)moved=true}
function end(){if(down&&moved)suppressUntil=Date.now()+700;down=false;moved=false}
function click(e){var c=coverFrom(e.target||e.srcElement);if(!c)return;if(Date.now()<suppressUntil)return;var href=c.getAttribute?c.getAttribute('href'):'';if(!href||href==='#')return;if(e.preventDefault)e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();else if(e.stopPropagation)e.stopPropagation();w.location.href=href;return false}
if(d.addEventListener){d.addEventListener('touchstart',start,true);d.addEventListener('touchmove',move,true);d.addEventListener('touchend',end,true);d.addEventListener('touchcancel',end,true);d.addEventListener('mousedown',start,true);d.addEventListener('mousemove',move,true);d.addEventListener('mouseup',end,true);d.addEventListener('click',click,true)}
})(window,document);
