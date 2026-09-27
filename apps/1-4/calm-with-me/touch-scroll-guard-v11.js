(function(w,d){
'use strict';
if(!d||!d.addEventListener)return;
var active=false,moved=false,startX=0,startY=0,startScrollX=0,startScrollY=0,startAction=null,lastScrollAt=0,lastScrollAction=null;
var MOVE_PX=12,CLICK_GUARD_MS=700;
function abs(n){return n<0?-n:n}
function scrollX(){return typeof w.pageXOffset==='number'?w.pageXOffset:(d.documentElement&&d.documentElement.scrollLeft)||d.body&&d.body.scrollLeft||0}
function scrollY(){return typeof w.pageYOffset==='number'?w.pageYOffset:(d.documentElement&&d.documentElement.scrollTop)||d.body&&d.body.scrollTop||0}
function point(e,end){var list=end?(e.changedTouches||[]):(e.touches||[]),p=list&&list[0];return p?{x:p.clientX,y:p.clientY}:null}
function actionOf(node){var tag,role,type;while(node&&node!==d){if(node.nodeType===1){tag=(node.tagName||'').toLowerCase();role=node.getAttribute?node.getAttribute('role'):'';type=node.getAttribute?String(node.getAttribute('type')||'').toLowerCase():'';if(tag==='button'||tag==='a'||tag==='summary'||role==='button'||(tag==='input'&&(type==='button'||type==='submit'||type==='reset'||type==='checkbox'||type==='radio')))return node}node=node.parentNode}return null}
function movementAt(e,end){var p=point(e,end);if(!active||!p)return;if(abs(p.x-startX)>MOVE_PX||abs(p.y-startY)>MOVE_PX||abs(scrollX()-startScrollX)>3||abs(scrollY()-startScrollY)>3)moved=true}
function onStart(e){var p=point(e,false);if(!p||!e.touches||e.touches.length!==1){active=false;moved=false;startAction=null;return}active=true;moved=false;startX=p.x;startY=p.y;startScrollX=scrollX();startScrollY=scrollY();startAction=actionOf(e.target||e.srcElement)}
function onMove(e){movementAt(e,false)}
function stopAppTouch(e){if(e.stopImmediatePropagation)e.stopImmediatePropagation();else if(e.stopPropagation)e.stopPropagation()}
function onEnd(e){if(!active)return;movementAt(e,true);var wasMoved=moved,action=startAction;active=false;moved=false;startAction=null;if(!wasMoved)return;lastScrollAt=+new Date();lastScrollAction=action;stopAppTouch(e)}
function onCancel(){active=false;moved=false;startAction=null}
function onClick(e){if((+new Date())-lastScrollAt>CLICK_GUARD_MS)return;var a=actionOf(e.target||e.srcElement);if(lastScrollAction&&a===lastScrollAction){if(e.preventDefault)e.preventDefault();stopAppTouch(e)}}
d.addEventListener('touchstart',onStart,true);
d.addEventListener('touchmove',onMove,true);
d.addEventListener('touchend',onEnd,true);
d.addEventListener('touchcancel',onCancel,true);
d.addEventListener('click',onClick,true);
w.APP360_CALM_TOUCH_SCROLL_GUARD={version:'11',threshold:MOVE_PX};
})(window,document);
