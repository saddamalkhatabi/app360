'use strict';
(function(){
/* v14 touch continuity for small hands and legacy Android: grace re-touch, final-position sampling, and safe recovery. */
var activeId=null,graceTimer=null,lastPt=null,graceMs=520,cancelGraceMs=760;
function stop(e){try{if(e.preventDefault)e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();else if(e.stopPropagation)e.stopPropagation()}catch(x){}}
function tp(list,id){var i;if(!list)return null;for(i=0;i<list.length;i++)if(list[i].identifier===id)return list[i];return list.length?list[0]:null}
function clearGrace(){if(graceTimer){clearTimeout(graceTimer);graceTimer=null}}
function nearDragged(pt){if(!drag||!drag.p||!pt)return false;var p=drag.p,dx=pt.x-p.x,dy=pt.y-p.y,r=Math.max(52,p.size*1.55);return dx*dx+dy*dy<=r*r}
function nearestStack(pt){var i,g,dx,dy,dd,best=null,bestD=1e9,r;for(i=0;i<trayStacks.length;i++){g=trayStacks[i];dx=pt.x-g.x;dy=pt.y-g.y;dd=Math.sqrt(dx*dx+dy*dy);r=Math.max(42,g.size*1.08);if(dd<=r&&dd<bestD){best=g;bestD=dd}}return best}
function safeReturn(){var p;if(!drag||!drag.p)return;clearGrace();p=drag.p;p.state='tray';p.placed=false;p.magnet=false;drag=null;activeId=null;buildTrayStacks();updateStatus();draw()}
function tryStart(pt){var g;if(drag&&nearDragged(pt)){clearGrace();drag.dx=0;drag.dy=0;return true}if(drag)safeReturn();beginDrag(pt);if(drag)return true;g=nearestStack(pt);if(g){beginDrag({x:g.x,y:g.y});if(drag){drag.p.x=pt.x;drag.p.y=pt.y;draw();return true}}return false}
function finishOrGrace(ms){var p,s,near;if(!drag||!drag.p)return;p=drag.p;s=snapRadius();near=nearestCompatibleTarget(p);if(near&&near.d<=s*1.08){endDrag();activeId=null;return}clearGrace();graceTimer=setTimeout(function(){graceTimer=null;if(drag)endDrag();activeId=null},ms)}
function start(e){var t,pt;if(!e.touches||!e.touches.length)return;t=e.touches[0];activeId=t.identifier;pt=screenPos(t.clientX,t.clientY);lastPt=pt;if(tryStart(pt))stop(e)}
function move(e){var t,pt;if(!drag)return;t=tp(e.touches,activeId);if(!t)return;activeId=t.identifier;pt=screenPos(t.clientX,t.clientY);lastPt=pt;moveDrag(pt);stop(e)}
function end(e){var t,pt;if(!drag)return;t=tp(e.changedTouches,activeId);if(t){pt=screenPos(t.clientX,t.clientY);lastPt=pt;moveDrag(pt)}finishOrGrace(graceMs);stop(e)}
function cancel(e){if(!drag)return;finishOrGrace(cancelGraceMs);stop(e)}
canvas.addEventListener('touchstart',start,true);canvas.addEventListener('touchmove',move,true);canvas.addEventListener('touchend',end,true);canvas.addEventListener('touchcancel',cancel,true);
w.addEventListener('blur',function(){if(drag)safeReturn()},false);
d.addEventListener('visibilitychange',function(){if(d.hidden&&drag)safeReturn()},false);
w.addEventListener('orientationchange',function(){if(drag)safeReturn()},false);
})();
