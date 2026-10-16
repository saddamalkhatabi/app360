'use strict';
(function(){
/* One input owner. An accidentally released piece waits visibly for the child. */
var activeId=null,mouseDown=false,waiting=false,lastTouch=0,pending=null,queued=false;
var originalBegin=beginDrag,originalMove=moveDrag;
function stop(e){if(e.cancelable!==false&&e.preventDefault)e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation()}
function touch(list,id){var i;for(i=0;i<(list?list.length:0);i++)if(list[i].identifier===id)return list[i];return null}
function clearInput(){activeId=null;touchId=null;mouseDown=false;waiting=false;pending=null}
function returnPiece(){var p=drag&&drag.p;clearInput();if(!p)return;p.state='tray';p.placed=false;p.magnet=false;drag=null;d.body.className=d.body.className.replace(/\s*grabCursor/g,'');buildTrayStacks();updateStatus();draw()}
function nearPiece(pt){if(!drag||!drag.p)return false;var p=drag.p,dx=pt.x-p.x,dy=pt.y-p.y,r=Math.max(42,p.size*.85);return dx*dx+dy*dy<=r*r}
function nearestStack(pt){var i,g,dx,dy,dd,best=null,limit=Infinity;for(i=0;i<trayStacks.length;i++){g=trayStacks[i];dx=pt.x-g.x;dy=pt.y-g.y;dd=dx*dx+dy*dy;if(dd<=Math.pow(Math.max(32,g.size*.85),2)&&dd<limit){best=g;limit=dd}}return best}
function startAt(pt){var g,p,near,oldX,oldY;
 if(won)return false;
 if(drag&&waiting){
  p=drag.p;oldX=p.x;oldY=p.y;p.x=pt.x;p.y=pt.y;near=nearestCompatibleTarget(p);p.x=oldX;p.y=oldY;
  if(near&&near.d<=snapRadius()*1.05){placeNow(p,near.p);waiting=false;return true}
  if(nearPiece(pt)){drag.dx=pt.x-drag.p.x;drag.dy=pt.y-drag.p.y;waiting=false;return true}
 }
 g=nearestStack(pt);if(!g)return false;
 if(drag)returnPiece();originalBegin({x:g.x,y:g.y});if(!drag)return false;
 drag.dx=pt.x-g.x;drag.dy=pt.y-g.y;waiting=false;draw();return true;
}
function moveAt(pt){if(!drag)return;pending=pt;if(queued)return;queued=true;raf(function(){queued=false;var next=pending;pending=null;if(next&&drag&&!waiting)originalMove(next)})}
function finish(pt){pending=null;if(!drag){waiting=false;return}if(pt)originalMove(pt);if(!drag){waiting=false;return}var near=nearestCompatibleTarget(drag.p);if(near&&near.d<=snapRadius()*1.05){placeNow(drag.p,near.p);waiting=false;return}waiting=true;draw();showMsg('القطعة تنتظرك: المسها لتكمل أو المس مكانها الصحيح','',0)}
var options=true;try{var probe=Object.defineProperty({},'passive',{get:function(){options={passive:false,capture:true};return false}});w.addEventListener('shape-passive-probe',null,probe);w.removeEventListener('shape-passive-probe',null,probe)}catch(e){}
canvas.addEventListener('touchstart',function(e){lastTouch=Date.now();if(activeId!==null){stop(e);return}var t=e.changedTouches&&e.changedTouches[0];if(!t)return;var pt=screenPos(t.clientX,t.clientY);if(startAt(pt)){activeId=t.identifier;touchId=activeId;stop(e)}},options);
d.addEventListener('touchmove',function(e){var t=touch(e.touches,activeId);if(!t)return;moveAt(screenPos(t.clientX,t.clientY));stop(e)},options);
d.addEventListener('touchend',function(e){var t=touch(e.changedTouches,activeId);if(!t)return;finish(screenPos(t.clientX,t.clientY));activeId=null;touchId=null;stop(e)},options);
d.addEventListener('touchcancel',function(e){if(!touch(e.changedTouches,activeId))return;finish(pending);activeId=null;touchId=null;stop(e)},options);
canvas.addEventListener('mousedown',function(e){if(Date.now()-lastTouch<1000||e.button>0)return;mouseDown=startAt(screenPos(e.clientX,e.clientY));if(mouseDown)stop(e)},false);
w.addEventListener('mousemove',function(e){if(mouseDown)moveAt(screenPos(e.clientX,e.clientY))},false);
w.addEventListener('mouseup',function(e){if(!mouseDown)return;finish(screenPos(e.clientX,e.clientY));mouseDown=false},false);
w.addEventListener('blur',returnPiece,false);d.addEventListener('visibilitychange',function(){if(d.hidden)returnPiece()},false);
function guard(fn){return function(){returnPiece();return fn.apply(this,arguments)}}
size=guard(size);refresh=guard(refresh);resetPuzzle=guard(resetPuzzle);
})();
