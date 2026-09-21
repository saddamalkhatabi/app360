(function(){'use strict';
var doc=document,win=window,dirty=false,lastPanel=null,activeMouse=null,assetDrag=null,suppressClickUntil=0;
var ua=navigator.userAgent||'',legacy=/Android\s(?:[0-4])(?:\.|;)/i.test(ua)||((' '+doc.documentElement.className+' ').indexOf(' legacy-android ')>=0);
function hasClass(n,c){return !!n&&(' '+(n.className||'')+' ').indexOf(' '+c+' ')>=0}
function parentClass(n,c){while(n&&n!==doc){if(hasClass(n,c))return n;n=n.parentNode}return null}
function parentAttr(n,a){while(n&&n!==doc){if(n.getAttribute&&n.getAttribute(a)!==null)return n;n=n.parentNode}return null}
function designerPanel(){return doc.querySelector('.wd9-panel')||doc.querySelector('.gd-panel')}
function designerVisible(){var o=doc.getElementById('drawingOverlay');return !!(o&&!o.hidden&&designerPanel())}
function warnText(){return'يوجد عمل غير محفوظ في المصمم. هل تريد إغلاقه وفقد التعديلات الحالية؟'}
function stop(e){if(e.preventDefault)e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();else if(e.stopPropagation)e.stopPropagation();e.cancelBubble=true;return false}
function note(t){var n=doc.createElement('div');n.className='v14-save-warning';n.innerHTML=t;doc.body.appendChild(n);setTimeout(function(){if(n.parentNode)n.parentNode.removeChild(n)},2300)}
function markDirty(){if(designerVisible())dirty=true}
function clearDirty(){dirty=false}
win.App360DesignerGuard={isDirty:function(){return dirty},markDirty:markDirty,clearDirty:clearDirty};
function pointFromTouch(e){var t=e.touches&&e.touches[0]?e.touches[0]:(e.changedTouches&&e.changedTouches[0]?e.changedTouches[0]:e),x=t.clientX,y=t.clientY;if(x==null&&t.pageX!=null)x=t.pageX-(win.pageXOffset||0);if(y==null&&t.pageY!=null)y=t.pageY-(win.pageYOffset||0);return{x:Number(x)||0,y:Number(y)||0}}
function mouseEvent(type,p){var ev;try{ev=doc.createEvent('MouseEvents');ev.initMouseEvent(type,true,true,win,1,p.x,p.y,p.x,p.y,false,false,false,false,0,null)}catch(e){try{ev=doc.createEvent('Event');ev.initEvent(type,true,true);ev.clientX=p.x;ev.clientY=p.y}catch(e2){return null}}return ev}
function dispatchMouse(target,type,p){var ev=mouseEvent(type,p);if(ev&&target&&target.dispatchEvent)target.dispatchEvent(ev)}
function moveSelectedTo(end,kind){setTimeout(function(){var item=doc.querySelector(kind==='wd'?'.wd-item.selected':'.gd-item.selected');if(!item)return;if(kind==='wd'){var sel=doc.querySelector('[data-wdtool="select"]');if(sel&&sel.onclick)sel.onclick()}var r=item.getBoundingClientRect(),start={x:r.left+r.width/2,y:r.top+r.height/2};dispatchMouse(item,'mousedown',start);dispatchMouse(doc,'mousemove',end);dispatchMouse(doc,'mouseup',end);markDirty()},20)}
function ghostFor(asset,p){var g=doc.createElement('div');g.className='v14-drag-ghost';var img=asset.getElementsByTagName('img')[0];if(img)g.innerHTML='<img src="'+img.src+'" alt="">';doc.body.appendChild(g);positionGhost(g,p);return g}
function positionGhost(g,p){if(!g)return;g.style.left=Math.max(0,p.x-37)+'px';g.style.top=Math.max(0,p.y-37)+'px'}
function removeGhost(){if(assetDrag&&assetDrag.ghost&&assetDrag.ghost.parentNode)assetDrag.ghost.parentNode.removeChild(assetDrag.ghost)}
function resetOnOpen(){var p=designerPanel();if(p!==lastPanel){lastPanel=p;dirty=false}}
setInterval(resetOnOpen,350);
/* Capture accidental designer closes before the designers/app handlers. */
doc.addEventListener('click',function(e){var t=e.target||e.srcElement,close=parentAttr(t,'data-close-wd')||parentAttr(t,'data-close-gd');
 if(close&&designerVisible()){
   if(hasClass(close,'drawing-backdrop')){note('لن تُغلق مساحة العمل بلمس الخلفية. استخدم زر × عند الانتهاء.');return stop(e)}
   if(dirty&&win.confirm&&!win.confirm(warnText()))return stop(e);
   dirty=false;return;
 }
 if(t&&t.id==='updateBtn'&&dirty){if(win.confirm&&!win.confirm('لديك عمل غير محفوظ. التحديث قد يعيد تحميل الصفحة. هل تريد المتابعة؟'))return stop(e);dirty=false}
 if(parentClass(t,'wd-item')||parentClass(t,'gd-item')||parentClass(t,'wd-asset')||parentClass(t,'gd-asset'))markDirty();
},true);
doc.addEventListener('input',function(e){var t=e.target||e.srcElement;if(!designerVisible()||!t)return;if(t.id==='wdAssetSearch'||t.id==='wdWebSearch'||t.id==='gdSearch')return;markDirty()},true);
doc.addEventListener('change',function(e){var t=e.target||e.srcElement;if(!designerVisible()||!t)return;if(t.id==='wdSaved'||t.id==='gdSaved')return;markDirty()},true);
win.addEventListener('beforeunload',function(e){if(!dirty)return;var m='لديك عمل غير محفوظ.';e.returnValue=m;return m});
/* Registered before app.js: stop browser-back from destroying pending designer work. */
win.addEventListener('popstate',function(e){if(!designerVisible()||!dirty)return;if(win.confirm&&win.confirm(warnText())){dirty=false;return}try{history.pushState({a1Overlay:'drawing-guard'},'',location.href)}catch(err){}stop(e)},false);
/* Registered before app.js: never auto-reload a page that has pending designer work. */
if(navigator.serviceWorker&&navigator.serviceWorker.addEventListener)navigator.serviceWorker.addEventListener('controllerchange',function(e){if(!dirty)return;note('تم تجهيز التحديث، وسيُطبق بعد حفظ العمل وإعادة فتح التطبيق.');stop(e)},false);
if(legacy){
 doc.addEventListener('touchstart',function(e){var t=e.target||e.srcElement,p=pointFromTouch(e),asset=parentClass(t,'wd-asset')||parentClass(t,'gd-asset');
   if(asset){assetDrag={asset:asset,start:p,last:p,moved:false,ghost:null,kind:hasClass(asset,'wd-asset')?'wd':'gd'};return}
   var handle=parentClass(t,'wd-handle')||parentClass(t,'gd-resize'),item=parentClass(t,'wd-item')||parentClass(t,'gd-item'),target=handle||item;
   if(!target)return;
   if(item&&hasClass(item,'wd-item')){var sel=doc.querySelector('[data-wdtool="select"]');if(sel&&sel.onclick)sel.onclick()}
   activeMouse={target:target,last:p};stop(e);dispatchMouse(target,'mousedown',p);markDirty();
 },true);
 doc.addEventListener('touchmove',function(e){var p=pointFromTouch(e);
   if(activeMouse){activeMouse.last=p;stop(e);dispatchMouse(doc,'mousemove',p);return}
   if(assetDrag){assetDrag.last=p;var dx=p.x-assetDrag.start.x,dy=p.y-assetDrag.start.y;if(!assetDrag.moved&&Math.sqrt(dx*dx+dy*dy)>9){assetDrag.moved=true;assetDrag.ghost=ghostFor(assetDrag.asset,p)}if(assetDrag.moved){stop(e);positionGhost(assetDrag.ghost,p)}}
 },true);
 doc.addEventListener('touchend',function(e){var p=pointFromTouch(e);
   if(activeMouse){stop(e);dispatchMouse(doc,'mouseup',p);activeMouse=null;return}
   if(!assetDrag)return;var a=assetDrag;if(a.moved){stop(e);removeGhost();var under=doc.elementFromPoint?doc.elementFromPoint(p.x,p.y):null,target=a.kind==='wd'?parentClass(under,'wd-page'):parentClass(under,'gd-board');if(target){if(a.asset.onclick)a.asset.onclick();moveSelectedTo(p,a.kind);suppressClickUntil=new Date().getTime()+650}else note('اسحب الصورة وأفلتها داخل مساحة العمل.')}assetDrag=null;
 },true);
 doc.addEventListener('touchcancel',function(){if(activeMouse){dispatchMouse(doc,'mouseup',activeMouse.last);activeMouse=null}removeGhost();assetDrag=null},true);
 doc.addEventListener('click',function(e){if(new Date().getTime()<suppressClickUntil&&(parentClass(e.target||e.srcElement,'wd-asset')||parentClass(e.target||e.srcElement,'gd-asset')))stop(e)},true);
}
})(window);
