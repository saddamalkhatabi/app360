from pathlib import Path
import json,re

ROOT=Path('.')
APP=ROOT/'apps/1-4/screen-to-move'

def read(p): return Path(p).read_text(encoding='utf-8')
def write(p,s): Path(p).write_text(s,encoding='utf-8')

def must_replace(s,old,new,label):
    if old not in s:
        raise SystemExit('missing pattern: '+label)
    return s.replace(old,new,1)

# --- v15 CSS ---
v15_css=r'''/* screen-to-move v15: fast legacy manipulation, fixed desktop inspector, alignment + smart finish */
/* On computers and large modern screens the inspector is permanently visible on the right. */
@media (min-width:1000px){
 html:not(.legacy-android) .wd10-panel .wd-settings-toggle,html:not(.legacy-android) .gd-panel .gd-settings-toggle{display:none!important}
 html:not(.legacy-android) .wd10-panel .wd-settings-drawer{display:block!important;position:absolute!important;top:64px!important;right:10px!important;bottom:10px!important;left:auto!important;width:370px!important;max-width:370px!important;margin:0!important;border-radius:15px!important}
 html:not(.legacy-android) .wd10-panel .wd-work{margin-right:390px!important;width:auto!important;max-width:none!important;min-width:0!important}
 html:not(.legacy-android) .wd10-panel .wd-paper-zone{max-height:calc(98vh - 190px)!important}
 html:not(.legacy-android) .gd-panel .gd-settings{display:block!important;position:absolute!important;top:64px!important;right:10px!important;bottom:66px!important;left:auto!important;width:370px!important;max-width:370px!important;margin:0!important;border-radius:15px!important}
 html:not(.legacy-android) .gd-panel .gd-work{margin-right:390px!important;width:auto!important;max-width:none!important;height:calc(100% - 58px)!important}
}
@media (min-width:1500px){
 html:not(.legacy-android) .wd10-panel .wd-settings-drawer,html:not(.legacy-android) .gd-panel .gd-settings{width:410px!important;max-width:410px!important}
 html:not(.legacy-android) .wd10-panel .wd-work,html:not(.legacy-android) .gd-panel .gd-work{margin-right:430px!important}
}
/* Fast direct manipulation on the old tablet. */
html.legacy-android .wd-item,html.legacy-android .gd-item{-webkit-transform:translateZ(0);transform:translateZ(0);box-shadow:none!important}
html.legacy-android .wd-item.selected .wd-handle{width:30px!important;height:30px!important;bottom:-16px!important;border-width:3px!important}
html.legacy-android .wd-item.selected .wd-handle-se{right:-16px!important}html.legacy-android .wd-item.selected .wd-handle-sw{left:-16px!important}
html.legacy-android .gd-item.selected .gd-resize{width:30px!important;height:30px!important;left:-16px!important;bottom:-16px!important}
html.legacy-android .wd-page,html.legacy-android .gd-board{-webkit-user-select:none!important;-webkit-touch-callout:none!important;-ms-touch-action:none!important;touch-action:none!important}
.v15-touch-active{outline:3px solid #ffd54f!important;outline-offset:3px!important}
.v15-tool-ghost{position:fixed!important;z-index:2000020!important;min-width:72px!important;min-height:58px!important;max-width:110px!important;padding:8px!important;background:#fff!important;border:3px solid #0f8f8a!important;border-radius:13px!important;box-shadow:0 8px 24px #0005!important;pointer-events:none!important;text-align:center!important;font:900 12px Tahoma,Arial,sans-serif!important;color:#17302f!important;opacity:.95!important}
.v15-tool-ghost img{display:block;width:52px;height:52px;object-fit:contain;margin:auto}
/* Creative assistant / alignment / storage block. */
.v15-assist-block{border:2px solid #0f8f8a!important;background:#f4fffd!important;box-shadow:0 4px 14px #0f8f8a18!important}
.gd-settings .v15-assist-block{border-color:#7c3aed!important;background:#fbf8ff!important}
.v15-assist-block>strong{display:block;font-size:14px;color:#17302f;margin-bottom:7px}
.v15-magic{display:block;width:100%;min-height:48px;border:2px solid #b77b00!important;background:linear-gradient(135deg,#ffd54f,#fff0a3)!important;color:#422f00!important;border-radius:12px!important;font-weight:900!important;font-size:14px!important;padding:8px 10px!important;margin-bottom:8px!important;box-shadow:0 3px 0 #b77b0033!important}
.v15-magic small{display:block;font-size:9px;font-weight:700;margin-top:2px;opacity:.8}
.v15-tool-group{display:flex;flex-wrap:wrap;gap:5px;margin:6px 0}.v15-tool-group button{flex:1 1 28%;min-width:82px;min-height:37px;border:1px solid #b7d5d1;background:#fff;border-radius:9px;padding:5px;font-weight:800;font-size:11px;color:#17302f}
.gd-settings .v15-tool-group button{border-color:#d5c8eb}
.v15-storage{border-top:1px solid #cfe1df;margin-top:8px;padding-top:8px}.v15-storage b{display:block;margin-bottom:6px}.v15-storage-row{display:flex;gap:5px;flex-wrap:wrap}.v15-storage select{flex:1;min-width:140px;min-height:38px;border:1px solid #bdd5d2;border-radius:8px;background:#fff;padding:5px}.v15-storage button{min-height:38px;border:1px solid #bdd5d2;border-radius:8px;background:#fff;padding:5px 8px;font-weight:800}.v15-save-browser{background:#0f8f8a!important;color:#fff!important;border-color:#0f8f8a!important}.gd-settings .v15-save-browser{background:#7c3aed!important;border-color:#7c3aed!important}.v15-storage-note{display:block;font-size:10px;color:#58716e;line-height:1.5;margin-top:5px}.v15-draft-badge{display:inline-block;background:#fff7d8;color:#6f5300;border:1px solid #e0c55d;border-radius:999px;padding:3px 7px;font-size:10px;font-weight:800;margin-top:5px}.v15-draft-badge.ok{background:#e9faf4;color:#12633f;border-color:#8fd8bb}
/* Shapes can be dragged just like images. */
.wd-tools [data-wdshape],#wdAddLine,#wdAddCheckbox{cursor:grab}.wd-tools [data-wdshape]:active,#wdAddLine:active,#wdAddCheckbox:active{cursor:grabbing}
html.legacy-android .v15-tool-group button,html.legacy-android .v15-magic,html.legacy-android .v15-storage button{min-height:44px!important}
'''
write(APP/'v15.css',v15_css)

# --- storage layer: IndexedDB modern, localStorage legacy fallback ---
storage_js=r'''(function(win){'use strict';
var legacy=/Android\s(?:[0-4])(?:\.|;)/i.test(navigator.userAgent||'');
var hasIDB=!legacy&&!!win.indexedDB,DB='app360-designer-v15',VER=1,LS='app360:designer-store-v15',LSD='app360:designer-drafts-v15';
function clone(x){try{return JSON.parse(JSON.stringify(x))}catch(e){return x}}
function uid(kind){return kind+'-'+new Date().getTime()+'-'+Math.floor(Math.random()*10000)}
function open(cb){if(!hasIDB){cb(null);return}var q;try{q=indexedDB.open(DB,VER)}catch(e){hasIDB=false;cb(null);return}q.onupgradeneeded=function(){var d=q.result;if(!d.objectStoreNames.contains('designs'))d.createObjectStore('designs',{keyPath:'key'});if(!d.objectStoreNames.contains('drafts'))d.createObjectStore('drafts',{keyPath:'kind'})};q.onsuccess=function(){cb(q.result)};q.onerror=function(){hasIDB=false;cb(null)}}
function lsRead(key){try{return JSON.parse(localStorage.getItem(key)||'[]')||[]}catch(e){return[]}}
function lsWrite(key,a){try{localStorage.setItem(key,JSON.stringify(a));return true}catch(e){return false}}
function record(kind,data){data=clone(data||{});var id=data.id||uid(kind);data.id=id;return{key:kind+':'+id,kind:kind,id:id,title:data.title||data.name||'تصميم',updated_at:new Date().toISOString(),data:data}}
function saveLS(kind,data,cb){var r=record(kind,data),a=lsRead(LS),out=[r],i;for(i=0;i<a.length;i++)if(a[i].key!==r.key)out.push(a[i]);if(out.length>40)out.length=40;lsWrite(LS,out);if(cb)cb(r)}
function save(kind,data,cb){var r=record(kind,data);open(function(db){if(!db){saveLS(kind,r.data,cb);return}try{var tx=db.transaction('designs','readwrite');tx.objectStore('designs').put(r);tx.oncomplete=function(){if(cb)cb(r)};tx.onerror=function(){saveLS(kind,r.data,cb)}}catch(e){saveLS(kind,r.data,cb)}})}
function listLS(kind,cb){var a=lsRead(LS),o=[],i;for(i=0;i<a.length;i++)if(a[i].kind===kind)o.push(a[i]);o.sort(function(x,y){return String(y.updated_at).localeCompare(String(x.updated_at))});cb(o)}
function list(kind,cb){open(function(db){if(!db){listLS(kind,cb);return}var o=[];try{var q=db.transaction('designs','readonly').objectStore('designs').openCursor();q.onsuccess=function(){var c=q.result;if(c){if(c.value&&c.value.kind===kind)o.push(c.value);c.continue()}else{o.sort(function(x,y){return String(y.updated_at).localeCompare(String(x.updated_at))});cb(o)}};q.onerror=function(){listLS(kind,cb)}}catch(e){listLS(kind,cb)}})}
function getLS(kind,id,cb){var a=lsRead(LS),i;for(i=0;i<a.length;i++)if(a[i].kind===kind&&a[i].id===id){cb(a[i]);return}cb(null)}
function get(kind,id,cb){open(function(db){if(!db){getLS(kind,id,cb);return}try{var q=db.transaction('designs','readonly').objectStore('designs').get(kind+':'+id);q.onsuccess=function(){cb(q.result||null)};q.onerror=function(){getLS(kind,id,cb)}}catch(e){getLS(kind,id,cb)}})}
function removeLS(kind,id,cb){var a=lsRead(LS),o=[],i;for(i=0;i<a.length;i++)if(!(a[i].kind===kind&&a[i].id===id))o.push(a[i]);lsWrite(LS,o);if(cb)cb()}
function remove(kind,id,cb){open(function(db){if(!db){removeLS(kind,id,cb);return}try{var tx=db.transaction('designs','readwrite');tx.objectStore('designs').delete(kind+':'+id);tx.oncomplete=function(){if(cb)cb()};tx.onerror=function(){removeLS(kind,id,cb)}}catch(e){removeLS(kind,id,cb)}})}
function draftLS(kind,data,cb){var a=lsRead(LSD),r={kind:kind,updated_at:new Date().toISOString(),data:clone(data)},o=[r],i;for(i=0;i<a.length;i++)if(a[i].kind!==kind)o.push(a[i]);lsWrite(LSD,o);if(cb)cb(r)}
function saveDraft(kind,data,cb){var r={kind:kind,updated_at:new Date().toISOString(),data:clone(data)};open(function(db){if(!db){draftLS(kind,data,cb);return}try{var tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').put(r);tx.oncomplete=function(){if(cb)cb(r)};tx.onerror=function(){draftLS(kind,data,cb)}}catch(e){draftLS(kind,data,cb)}})}
function loadDraftLS(kind,cb){var a=lsRead(LSD),i;for(i=0;i<a.length;i++)if(a[i].kind===kind){cb(a[i]);return}cb(null)}
function loadDraft(kind,cb){open(function(db){if(!db){loadDraftLS(kind,cb);return}try{var q=db.transaction('drafts','readonly').objectStore('drafts').get(kind);q.onsuccess=function(){cb(q.result||null)};q.onerror=function(){loadDraftLS(kind,cb)}}catch(e){loadDraftLS(kind,cb)}})}
function clearDraftLS(kind,cb){var a=lsRead(LSD),o=[],i;for(i=0;i<a.length;i++)if(a[i].kind!==kind)o.push(a[i]);lsWrite(LSD,o);if(cb)cb()}
function clearDraft(kind,cb){open(function(db){if(!db){clearDraftLS(kind,cb);return}try{var tx=db.transaction('drafts','readwrite');tx.objectStore('drafts').delete(kind);tx.oncomplete=function(){if(cb)cb()};tx.onerror=function(){clearDraftLS(kind,cb)}}catch(e){clearDraftLS(kind,cb)}})}
win.App360DesignerStore={save:save,list:list,get:get,remove:remove,saveDraft:saveDraft,loadDraft:loadDraft,clearDraft:clearDraft,mode:function(){return hasIDB?'IndexedDB':'LocalStorage'},legacy:legacy};
})(window);'''
write(APP/'storage-v15.js',storage_js)

# --- legacy touch + guard v15 ---
legacy_js=r'''(function(){'use strict';
var doc=document,win=window,dirty=false,lastPanel=null,activeMouse=null,drag=null,suppressClickUntil=0,lastMoveAt=0;
var ua=navigator.userAgent||'',legacy=/Android\s(?:[0-4])(?:\.|;)/i.test(ua)||((' '+doc.documentElement.className+' ').indexOf(' legacy-android ')>=0);
function hasClass(n,c){return !!n&&(' '+(n.className||'')+' ').indexOf(' '+c+' ')>=0}
function parentClass(n,c){while(n&&n!==doc){if(hasClass(n,c))return n;n=n.parentNode}return null}
function parentAttr(n,a){while(n&&n!==doc){if(n.getAttribute&&n.getAttribute(a)!==null)return n;n=n.parentNode}return null}
function designerPanel(){return doc.querySelector('.wd9-panel')||doc.querySelector('.gd-panel')}
function designerVisible(){var o=doc.getElementById('drawingOverlay');return !!(o&&!o.hidden&&designerPanel())}
function kindNow(){return doc.querySelector('.wd9-panel')?'worksheet':(doc.querySelector('.gd-panel')?'game':null)}
function warnText(){return'يوجد عمل غير محفوظ في المصمم. هل تريد إغلاقه وفقد التعديلات الحالية؟'}
function stop(e){if(e.preventDefault)e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();else if(e.stopPropagation)e.stopPropagation();e.cancelBubble=true;return false}
function note(t){var n=doc.createElement('div');n.className='v14-save-warning';n.innerHTML=t;doc.body.appendChild(n);setTimeout(function(){if(n.parentNode)n.parentNode.removeChild(n)},2500)}
function markDirty(){if(designerVisible())dirty=true}
function clearDirty(){dirty=false}
win.App360DesignerGuard={isDirty:function(){return dirty},markDirty:markDirty,clearDirty:clearDirty};
function point(e){var t=e.touches&&e.touches[0]?e.touches[0]:(e.changedTouches&&e.changedTouches[0]?e.changedTouches[0]:e),x=t.clientX,y=t.clientY;if(x==null&&t.pageX!=null)x=t.pageX-(win.pageXOffset||0);if(y==null&&t.pageY!=null)y=t.pageY-(win.pageYOffset||0);return{x:Number(x)||0,y:Number(y)||0}}
function mouseEvent(type,p){var ev;try{ev=doc.createEvent('MouseEvents');ev.initMouseEvent(type,true,true,win,1,p.x,p.y,p.x,p.y,false,false,false,false,0,null)}catch(e){try{ev=doc.createEvent('Event');ev.initEvent(type,true,true);ev.clientX=p.x;ev.clientY=p.y}catch(e2){return null}}return ev}
function dispatchMouse(target,type,p){var ev=mouseEvent(type,p);if(ev&&target&&target.dispatchEvent)target.dispatchEvent(ev)}
function ghost(label,img,p){var g=doc.createElement('div');g.className='v15-tool-ghost';if(img)g.innerHTML='<img src="'+img+'" alt=""><small>'+label+'</small>';else g.innerHTML=label;doc.body.appendChild(g);positionGhost(g,p);return g}
function positionGhost(g,p){if(!g)return;g.style.left=Math.max(0,p.x-42)+'px';g.style.top=Math.max(0,p.y-36)+'px'}
function removeGhost(){if(drag&&drag.ghost&&drag.ghost.parentNode)drag.ghost.parentNode.removeChild(drag.ghost)}
function toolInfo(t){var b=parentAttr(t,'data-wdshape');if(b)return{kind:'tool',tool:'shape:'+b.getAttribute('data-wdshape'),label:b.textContent||'شكل'};b=parentClass(t,'wd-tools');var n=t;while(n&&n!==b){if(n.id==='wdAddLine')return{kind:'tool',tool:'line',label:'خط'};if(n.id==='wdAddCheckbox')return{kind:'tool',tool:'checkbox',label:'مربع اختيار'};n=n.parentNode}return null}
function resetOnOpen(){var p=designerPanel();if(p!==lastPanel){lastPanel=p;dirty=false}}
setInterval(resetOnOpen,350);
doc.addEventListener('click',function(e){var t=e.target||e.srcElement,close=parentAttr(t,'data-close-wd')||parentAttr(t,'data-close-gd');if(close&&designerVisible()){if(hasClass(close,'drawing-backdrop')){note('لن تُغلق مساحة العمل بلمس الخلفية. استخدم زر × عند الانتهاء.');return stop(e)}if(dirty&&win.confirm&&!win.confirm(warnText()))return stop(e);if(win.App360DesignerStore){var k=kindNow();if(k)win.App360DesignerStore.clearDraft(k,function(){})}dirty=false;return}if(t&&t.id==='updateBtn'&&dirty){if(win.confirm&&!win.confirm('لديك عمل غير محفوظ. التحديث قد يعيد تحميل الصفحة. هل تريد المتابعة؟'))return stop(e);dirty=false}if(parentClass(t,'wd-item')||parentClass(t,'gd-item')||parentClass(t,'wd-asset')||parentClass(t,'gd-asset'))markDirty()},true);
doc.addEventListener('input',function(e){var t=e.target||e.srcElement;if(!designerVisible()||!t)return;if(t.id==='wdAssetSearch'||t.id==='wdWebSearch'||t.id==='gdSearch')return;markDirty()},true);
doc.addEventListener('change',function(e){var t=e.target||e.srcElement;if(!designerVisible()||!t)return;if(t.id==='wdSaved'||t.id==='gdSaved'||t.id==='v15BrowserSaved')return;markDirty()},true);
win.addEventListener('beforeunload',function(e){if(!dirty)return;var m='لديك عمل غير محفوظ.';e.returnValue=m;return m});
win.addEventListener('popstate',function(e){if(!designerVisible()||!dirty)return;if(win.confirm&&win.confirm(warnText())){var k=kindNow();if(win.App360DesignerStore&&k)win.App360DesignerStore.clearDraft(k,function(){});dirty=false;return}try{history.pushState({a1Overlay:'drawing-guard'},'',location.href)}catch(err){}stop(e)},false);
if(navigator.serviceWorker&&navigator.serviceWorker.addEventListener)navigator.serviceWorker.addEventListener('controllerchange',function(e){if(!dirty)return;note('التحديث جاهز، وسيُطبق بعد حفظ العمل.');stop(e)},false);
if(legacy){
 doc.addEventListener('touchstart',function(e){var t=e.target||e.srcElement,p=point(e),asset=parentClass(t,'wd-asset')||parentClass(t,'gd-asset'),ti=toolInfo(t);if(asset){var im=asset.getElementsByTagName('img')[0];drag={type:'asset',asset:asset,start:p,last:p,moved:false,ghost:null,kind:hasClass(asset,'wd-asset')?'wd':'gd',img:im?im.src:'',label:asset.getAttribute('data-label')||asset.textContent||'صورة'};return}if(ti){drag={type:'tool',tool:ti.tool,start:p,last:p,moved:false,ghost:null,kind:'wd',label:ti.label};return}var handle=parentClass(t,'wd-handle')||parentClass(t,'gd-resize'),item=parentClass(t,'wd-item')||parentClass(t,'gd-item'),target=handle||item;if(!target)return;if(item&&hasClass(item,'wd-item')){var sel=doc.querySelector('[data-wdtool="select"]');if(sel&&sel.onclick)sel.onclick()}activeMouse={target:target,last:p,item:item};if(item)item.className+=' v15-touch-active';stop(e);dispatchMouse(target,'mousedown',p);markDirty()},true);
 doc.addEventListener('touchmove',function(e){var p=point(e),now=new Date().getTime();if(activeMouse){activeMouse.last=p;stop(e);if(now-lastMoveAt>=20){lastMoveAt=now;dispatchMouse(doc,'mousemove',p)}return}if(drag){drag.last=p;var dx=p.x-drag.start.x,dy=p.y-drag.start.y;if(!drag.moved&&Math.sqrt(dx*dx+dy*dy)>8){drag.moved=true;drag.ghost=ghost(drag.label,drag.img,p)}if(drag.moved){stop(e);positionGhost(drag.ghost,p)}}},true);
 doc.addEventListener('touchend',function(e){var p=point(e);if(activeMouse){stop(e);dispatchMouse(doc,'mousemove',p);dispatchMouse(doc,'mouseup',p);if(activeMouse.item)activeMouse.item.className=(' '+activeMouse.item.className+' ').replace(' v15-touch-active ',' ').replace(/^\s+|\s+$/g,'');activeMouse=null;return}if(!drag)return;var d=drag;if(d.moved){stop(e);removeGhost();var under=doc.elementFromPoint?doc.elementFromPoint(p.x,p.y):null;if(d.type==='asset'){var target=d.kind==='wd'?parentClass(under,'wd-page'):parentClass(under,'gd-board');if(target){var src=d.asset.getAttribute('data-src')||d.img,label=d.asset.getAttribute('data-label')||d.label;if(d.kind==='wd'&&win.App360WorksheetDesigner&&win.App360WorksheetDesigner.placeAssetAtClient)win.App360WorksheetDesigner.placeAssetAtClient(src,label,p.x,p.y);else if(d.kind==='gd'&&win.App360GameDesigner&&win.App360GameDesigner.placeAssetAtClient)win.App360GameDesigner.placeAssetAtClient(src,label,p.x,p.y);markDirty();suppressClickUntil=new Date().getTime()+700}else note('أفلت الصورة داخل مساحة العمل.')}else if(d.type==='tool'){var pg=parentClass(under,'wd-page');if(pg&&win.App360WorksheetDesigner&&win.App360WorksheetDesigner.placeToolAtClient){win.App360WorksheetDesigner.placeToolAtClient(d.tool,p.x,p.y);markDirty();suppressClickUntil=new Date().getTime()+700}else note('أفلت الأداة داخل ورقة التصميم.')}}drag=null},true);
 doc.addEventListener('touchcancel',function(){if(activeMouse){dispatchMouse(doc,'mouseup',activeMouse.last);activeMouse=null}removeGhost();drag=null},true);
 doc.addEventListener('click',function(e){var t=e.target||e.srcElement;if(new Date().getTime()<suppressClickUntil&&(parentClass(t,'wd-asset')||parentClass(t,'gd-asset')||parentAttr(t,'data-wdshape')||(t&&t.id==='wdAddLine')||(t&&t.id==='wdAddCheckbox')))stop(e)},true);
}
})(window);'''
write(APP/'legacy-v15.js',legacy_js)

# --- core worksheet performance and APIs ---
p=APP/'designer-v9.js'; s=read(p)
old="function bindItems(){qa('.wd-item',el('wdItems')).forEach(function(n){n.onmousedown=function(e){startItemDrag(e,n,false)};n.ontouchstart=function(e){startItemDrag(e,n,false)};qa('[data-resize]',n).forEach(function(h){h.onmousedown=function(e){startItemDrag(e,n,true);if(e.stopPropagation)e.stopPropagation()};h.ontouchstart=function(e){startItemDrag(e,n,true);if(e.stopPropagation)e.stopPropagation()}})})}"
new="function bindItems(){qa('.wd-item',el('wdItems')).forEach(function(n){n.onmousedown=function(e){startItemDrag(e,n,false)};n.ontouchstart=function(e){startItemDrag(e,n,false)};qa('[data-resize]',n).forEach(function(h){h.onmousedown=function(e){startItemDrag(e,n,h.getAttribute('data-resize')||true);if(e.stopPropagation)e.stopPropagation()};h.ontouchstart=function(e){startItemDrag(e,n,h.getAttribute('data-resize')||true);if(e.stopPropagation)e.stopPropagation()}})})}"
s=must_replace(s,old,new,'worksheet bindItems')
old="function startItemDrag(e,node,resizing){if(state.tool!=='select')return;var id=node.getAttribute('data-id'),it=null,i;for(i=0;i<state.items.length;i++)if(state.items[i].id===id){it=state.items[i];break}if(!it)return;snapshot();state.selected=id;renderPage();var p=eventPoint(e);state.drag={id:id,resizing:resizing,startX:p.x,startY:p.y,x:it.x,y:it.y,w:it.w,h:it.h};if(e.preventDefault)e.preventDefault()}\nfunction dragMove(e){if(!state.drag)return;var page=el('wdPage'),r=page.getBoundingClientRect(),d=pageDims(),p=eventPoint(e),dx=(p.x-state.drag.startX)*d.w/r.width,dy=(p.y-state.drag.startY)*d.h/r.height,it=selectedItem();if(!it)return;if(state.drag.resizing){it.w=clamp(state.drag.w+dx,28,d.w-state.drag.x);it.h=clamp(state.drag.h+dy,28,d.h-state.drag.y)}else{it.x=clamp(state.drag.x+dx,0,d.w-it.w);it.y=clamp(state.drag.y+dy,0,d.h-it.h)}renderPage();if(e.preventDefault)e.preventDefault()}\nfunction dragEnd(){state.drag=null}"
new="function selectNodeFast(node,id){state.selected=id;qa('.wd-item',el('wdItems')).forEach(function(x){removeClass(x,'selected')});addClass(node,'selected');syncSelectionPanel()}\nfunction paintItemFast(it){var page=el('wdPage'),node=document.querySelector('.wd-item[data-id=\"'+it.id+'\"]');if(!page||!node)return;var d=pageDims();node.style.left=(it.x/d.w*100)+'%';node.style.top=(it.y/d.h*100)+'%';node.style.width=(it.w/d.w*100)+'%';node.style.height=(it.h/d.h*100)+'%'}\nfunction startItemDrag(e,node,resizing){if(state.tool!=='select')return;var id=node.getAttribute('data-id'),it=null,i;for(i=0;i<state.items.length;i++)if(state.items[i].id===id){it=state.items[i];break}if(!it)return;snapshot();selectNodeFast(node,id);var p=eventPoint(e),page=el('wdPage'),r=page.getBoundingClientRect(),d=pageDims();state.drag={id:id,resizing:!!resizing,dir:resizing||'',startX:p.x,startY:p.y,x:it.x,y:it.y,w:it.w,h:it.h,sx:d.w/Math.max(1,r.width),sy:d.h/Math.max(1,r.height)};if(e.preventDefault)e.preventDefault()}\nfunction dragMove(e){if(!state.drag)return;var p=eventPoint(e),dx=(p.x-state.drag.startX)*state.drag.sx,dy=(p.y-state.drag.startY)*state.drag.sy,it=selectedItem(),d=pageDims();if(!it)return;if(state.drag.resizing){if(state.drag.dir==='sw'){var nx=clamp(state.drag.x+dx,0,state.drag.x+state.drag.w-28);it.w=state.drag.w+(state.drag.x-nx);it.x=nx;it.h=clamp(state.drag.h+dy,28,d.h-state.drag.y)}else{it.w=clamp(state.drag.w+dx,28,d.w-state.drag.x);it.h=clamp(state.drag.h+dy,28,d.h-state.drag.y)}}else{it.x=clamp(state.drag.x+dx,0,d.w-it.w);it.y=clamp(state.drag.y+dy,0,d.h-it.h)}paintItemFast(it);if(e.preventDefault)e.preventDefault()}\nfunction dragEnd(){if(state.drag)syncSelectionPanel();state.drag=null}"
s=must_replace(s,old,new,'worksheet fast drag')
insert_after="function addCheckbox(){addItem({type:'checkbox',w:48,h:48})}"
extra=r'''function placeAssetAtClient(src,label,cx,cy){var p=pagePoint({clientX:cx,clientY:cy}),s=state.autoSize?150:state.size;insertImage(src,label,p.x-s/2,p.y-s/2)}
function placeToolAtClient(tool,cx,cy){var p=pagePoint({clientX:cx,clientY:cy}),s=state.autoSize?125:state.size;if(tool.indexOf('shape:')===0){addItem({type:'shape',shape:tool.split(':')[1],color:state.color,w:s,h:s,x:p.x-s/2,y:p.y-s/2});return}if(tool==='line'){addItem({type:'line',color:state.color,w:Math.max(120,s*1.7),h:34,x:p.x-Math.max(120,s*1.7)/2,y:p.y-17});return}if(tool==='checkbox'){addItem({type:'checkbox',w:48,h:48,x:p.x-24,y:p.y-24})}}
function alignSelected(mode){var it=selectedItem();if(!it)return;var d=pageDims(),m=28;snapshot();if(mode==='left')it.x=m;else if(mode==='right')it.x=d.w-m-it.w;else if(mode==='top')it.y=m;else if(mode==='bottom')it.y=d.h-m-it.h;else if(mode==='centerX')it.x=(d.w-it.w)/2;else if(mode==='centerY')it.y=(d.h-it.h)/2;it.x=clamp(it.x,0,d.w-it.w);it.y=clamp(it.y,0,d.h-it.h);renderPage()}
function distributeAll(axis){if(state.items.length<2)return;var d=pageDims(),m=32,a=state.items.slice(),i,total=0,gap,pos;snapshot();a.sort(function(x,y){return axis==='x'?x.x-y.x:x.y-y.y});for(i=0;i<a.length;i++)total+=axis==='x'?a[i].w:a[i].h;gap=((axis==='x'?d.w:d.h)-2*m-total)/Math.max(1,a.length-1);if(gap<8)gap=8;pos=m;for(i=0;i<a.length;i++){if(axis==='x'){a[i].x=clamp(pos,0,d.w-a[i].w);pos+=a[i].w+gap}else{a[i].y=clamp(pos,0,d.h-a[i].h);pos+=a[i].h+gap}}renderPage()}
function snapAll(step){step=Number(step)||10;var d=pageDims();snapshot();for(var i=0;i<state.items.length;i++){var it=state.items[i];it.x=clamp(Math.round(it.x/step)*step,0,d.w-it.w);it.y=clamp(Math.round(it.y/step)*step,0,d.h-it.h)}renderPage()}
function normalizeSizes(){var groups={image:[],shape:[],text:[]},i,k,a,ws,hs,mw,mh;for(i=0;i<state.items.length;i++)if(groups[state.items[i].type])groups[state.items[i].type].push(state.items[i]);snapshot();for(k in groups){a=groups[k];if(a.length<2)continue;ws=a.map(function(x){return x.w}).sort(function(x,y){return x-y});hs=a.map(function(x){return x.h}).sort(function(x,y){return x-y});mw=ws[Math.floor(ws.length/2)];mh=hs[Math.floor(hs.length/2)];for(i=0;i<a.length;i++){if(Math.abs(a[i].w-mw)<=mw*.45)a[i].w=mw;if(Math.abs(a[i].h-mh)<=mh*.45)a[i].h=mh}}renderPage()}
function smartFinish(){if(!state.items.length){toastLocal('أضف عناصر أولًا ثم استخدم التحسين السحري');return}var d=pageDims(),m=30,i,j,it,a=state.items.slice(),changed=true,pass=0;snapshot();for(i=0;i<a.length;i++){it=a[i];it.x=clamp(Math.round(it.x/10)*10,m,Math.max(m,d.w-m-it.w));it.y=clamp(Math.round(it.y/10)*10,m,Math.max(m,d.h-m-it.h))}while(changed&&pass<5){changed=false;pass++;for(i=0;i<a.length;i++)for(j=i+1;j<a.length;j++){var A=a[i],B=a[j],ox=Math.min(A.x+A.w,B.x+B.w)-Math.max(A.x,B.x),oy=Math.min(A.y+A.h,B.y+B.h)-Math.max(A.y,B.y);if(ox>8&&oy>8){var ny=A.y+A.h+16;if(ny+B.h<=d.h-m)B.y=ny;else B.x=clamp(A.x+A.w+16,m,d.w-m-B.w);changed=true}}}var rows=[];a.sort(function(x,y){return(x.y+x.h/2)-(y.y+y.h/2)});for(i=0;i<a.length;i++){var cy=a[i].y+a[i].h/2,row=null;if(rows.length&&Math.abs(rows[rows.length-1].cy-cy)<55)row=rows[rows.length-1];else{row={cy:cy,items:[]};rows.push(row)}row.items.push(a[i]);row.cy=(row.cy*(row.items.length-1)+cy)/row.items.length}for(i=0;i<rows.length;i++){var r=rows[i],sum=0;for(j=0;j<r.items.length;j++)sum+=r.items[j].w;r.items.sort(function(x,y){return x.x-y.x});if(r.items.length>1&&sum<d.w-2*m){var g=(d.w-2*m-sum)/(r.items.length-1),x=m;g=Math.max(10,g);for(j=0;j<r.items.length;j++){r.items[j].x=clamp(x,m,d.w-m-r.items[j].w);r.items[j].y=clamp(r.cy-r.items[j].h/2,m,d.h-m-r.items[j].h);x+=r.items[j].w+g}}}renderPage();toastLocal('تم التحسين: محاذاة، مسافات، حدود آمنة وتقليل التداخل')}
'''
s=must_replace(s,insert_after,insert_after+'\n'+extra,'worksheet APIs')
old="function pageDrop(e){if(e.preventDefault)e.preventDefault();var src='',label='';try{src=e.dataTransfer.getData('text/x-app360-image');label=e.dataTransfer.getData('text/x-app360-label')}catch(err){}if(!src)return;var p=pagePoint(e),s=state.autoSize?150:state.size;insertImage(src,label,p.x-s/2,p.y-s/2)}"
new="function pageDrop(e){if(e.preventDefault)e.preventDefault();var src='',label='',tool='';try{src=e.dataTransfer.getData('text/x-app360-image');label=e.dataTransfer.getData('text/x-app360-label');tool=e.dataTransfer.getData('text/x-app360-tool')}catch(err){}if(tool){var pp=eventPoint(e);placeToolAtClient(tool,pp.x,pp.y);return}if(!src)return;var p=pagePoint(e),sz=state.autoSize?150:state.size;insertImage(src,label,p.x-sz/2,p.y-sz/2)}"
s=must_replace(s,old,new,'worksheet drop')
old="root.App360WorksheetDesigner={open:open,version:9};"
new="root.App360WorksheetDesigner={open:open,version:15,placeAssetAtClient:placeAssetAtClient,placeToolAtClient:placeToolAtClient,align:alignSelected,distribute:distributeAll,snap:snapAll,normalize:normalizeSizes,smartFinish:smartFinish,getData:designData,loadData:loadDesign};"
s=must_replace(s,old,new,'worksheet export')
write(p,s)

# --- core game designer performance and APIs ---
p=APP/'game-designer-v10.js'; g=read(p)
old="function startDrag(e,n,resizing){var id=n.getAttribute('data-id'),it=null;for(var i=0;i<S.items.length;i++)if(S.items[i].id===id){it=S.items[i];break}if(!it)return;snapshot();S.selected=id;var p=eventPoint(e);S.drag={id:id,resizing:resizing,startX:p.x,startY:p.y,x:it.x,y:it.y,w:it.w,h:it.h};renderBoard();if(e.preventDefault)e.preventDefault()}\nfunction dragMove(e){if(!S.drag)return;var board=el('gdBoard'),r=board.getBoundingClientRect(),p=eventPoint(e),dx=(p.x-S.drag.startX)*W/r.width,dy=(p.y-S.drag.startY)*H/r.height,it=selected();if(!it)return;if(S.drag.resizing){it.w=clamp(S.drag.w+dx,60,W-it.x);it.h=clamp(S.drag.h+dy,60,H-it.y)}else{it.x=clamp(S.drag.x+dx,0,W-it.w);it.y=clamp(S.drag.y+dy,0,H-it.h)}renderBoard();if(e.preventDefault)e.preventDefault()}\nfunction dragEnd(){S.drag=null}"
new="function paintGameItemFast(it){var n=document.querySelector('.gd-item[data-id=\"'+it.id+'\"]');if(!n)return;n.style.left=(it.x/W*100)+'%';n.style.top=(it.y/H*100)+'%';n.style.width=(it.w/W*100)+'%';n.style.height=(it.h/H*100)+'%'}\nfunction selectGameNodeFast(n,id){S.selected=id;qa('.gd-item',el('gdItems')).forEach(function(x){removeClass(x,'selected')});addClass(n,'selected');syncInspector()}\nfunction startDrag(e,n,resizing){var id=n.getAttribute('data-id'),it=null;for(var i=0;i<S.items.length;i++)if(S.items[i].id===id){it=S.items[i];break}if(!it)return;snapshot();selectGameNodeFast(n,id);var p=eventPoint(e),r=el('gdBoard').getBoundingClientRect();S.drag={id:id,resizing:resizing,startX:p.x,startY:p.y,x:it.x,y:it.y,w:it.w,h:it.h,sx:W/Math.max(1,r.width),sy:H/Math.max(1,r.height)};if(e.preventDefault)e.preventDefault()}\nfunction dragMove(e){if(!S.drag)return;var p=eventPoint(e),dx=(p.x-S.drag.startX)*S.drag.sx,dy=(p.y-S.drag.startY)*S.drag.sy,it=selected();if(!it)return;if(S.drag.resizing){it.w=clamp(S.drag.w+dx,60,W-S.drag.x);it.h=clamp(S.drag.h+dy,60,H-S.drag.y)}else{it.x=clamp(S.drag.x+dx,0,W-it.w);it.y=clamp(S.drag.y+dy,0,H-it.h)}paintGameItemFast(it);if(e.preventDefault)e.preventDefault()}\nfunction dragEnd(){if(S.drag)syncInspector();S.drag=null}"
g=must_replace(g,old,new,'game fast drag')
anchor="function addText(){var input=el('gdText'),text=input&&input.value?input.value:'نص';snapshot();S.items.push({id:uid(),type:'text',text:text,label:text,x:W*.35,y:H*.2,w:270,h:75,z:++S.z,correct:false,pair:'',group:'A',order:0});S.selected=S.items[S.items.length-1].id;renderBoard()}"
extra_g=r'''function placeAssetAtClient(src,label,cx,cy){var p=boardPoint({clientX:cx,clientY:cy}),w=150,h=150;addImage(src,label,p.x-w/2,p.y-h/2)}
function alignSelected(mode){var it=selected(),m=24;if(!it)return;snapshot();if(mode==='left')it.x=m;else if(mode==='right')it.x=W-m-it.w;else if(mode==='top')it.y=m;else if(mode==='bottom')it.y=H-m-it.h;else if(mode==='centerX')it.x=(W-it.w)/2;else if(mode==='centerY')it.y=(H-it.h)/2;it.x=clamp(it.x,0,W-it.w);it.y=clamp(it.y,0,H-it.h);renderBoard()}
function distributeAll(axis){if(S.items.length<2)return;var a=S.items.slice(),m=25,total=0,gap,pos,i;snapshot();a.sort(function(x,y){return axis==='x'?x.x-y.x:x.y-y.y});for(i=0;i<a.length;i++)total+=axis==='x'?a[i].w:a[i].h;gap=((axis==='x'?W:H)-2*m-total)/Math.max(1,a.length-1);if(gap<8)gap=8;pos=m;for(i=0;i<a.length;i++){if(axis==='x'){a[i].x=clamp(pos,0,W-a[i].w);pos+=a[i].w+gap}else{a[i].y=clamp(pos,0,H-a[i].h);pos+=a[i].h+gap}}renderBoard()}
function snapAll(step){step=Number(step)||10;snapshot();for(var i=0;i<S.items.length;i++){var it=S.items[i];it.x=clamp(Math.round(it.x/step)*step,0,W-it.w);it.y=clamp(Math.round(it.y/step)*step,0,H-it.h)}renderBoard()}
function normalizeSizes(){var imgs=S.items.filter(function(x){return x.type==='image'}),i,ws,hs,mw,mh;if(imgs.length<2)return;snapshot();ws=imgs.map(function(x){return x.w}).sort(function(a,b){return a-b});hs=imgs.map(function(x){return x.h}).sort(function(a,b){return a-b});mw=ws[Math.floor(ws.length/2)];mh=hs[Math.floor(hs.length/2)];for(i=0;i<imgs.length;i++){if(Math.abs(imgs[i].w-mw)<=mw*.45)imgs[i].w=mw;if(Math.abs(imgs[i].h-mh)<=mh*.45)imgs[i].h=mh}renderBoard()}
function smartFinish(){if(!S.items.length){status('أضف عناصر أولًا ثم استخدم التحسين السحري');return}var a=S.items.slice(),m=24,i,j,changed=true,pass=0;snapshot();for(i=0;i<a.length;i++){a[i].x=clamp(Math.round(a[i].x/10)*10,m,W-m-a[i].w);a[i].y=clamp(Math.round(a[i].y/10)*10,m,H-m-a[i].h)}while(changed&&pass<4){changed=false;pass++;for(i=0;i<a.length;i++)for(j=i+1;j<a.length;j++){var A=a[i],B=a[j],ox=Math.min(A.x+A.w,B.x+B.w)-Math.max(A.x,B.x),oy=Math.min(A.y+A.h,B.y+B.h)-Math.max(A.y,B.y);if(ox>8&&oy>8){var ny=A.y+A.h+14;if(ny+B.h<=H-m)B.y=ny;else B.x=clamp(A.x+A.w+14,m,W-m-B.w);changed=true}}}var rows=[];a.sort(function(x,y){return(x.y+x.h/2)-(y.y+y.h/2)});for(i=0;i<a.length;i++){var cy=a[i].y+a[i].h/2,r=null;if(rows.length&&Math.abs(rows[rows.length-1].cy-cy)<45)r=rows[rows.length-1];else{r={cy:cy,items:[]};rows.push(r)}r.items.push(a[i]);r.cy=(r.cy*(r.items.length-1)+cy)/r.items.length}for(i=0;i<rows.length;i++){var rr=rows[i],sum=0;for(j=0;j<rr.items.length;j++)sum+=rr.items[j].w;rr.items.sort(function(x,y){return x.x-y.x});if(rr.items.length>1&&sum<W-2*m){var gap=(W-2*m-sum)/(rr.items.length-1),x=m;gap=Math.max(10,gap);for(j=0;j<rr.items.length;j++){rr.items[j].x=clamp(x,m,W-m-rr.items[j].w);rr.items[j].y=clamp(rr.cy-rr.items[j].h/2,m,H-m-rr.items[j].h);x+=rr.items[j].w+gap}}}renderBoard();status('تم التحسين السحري: محاذاة، توزيع، حدود آمنة وتقليل التداخل')}
'''
g=must_replace(g,anchor,anchor+'\n'+extra_g,'game APIs')
old="root.App360GameDesigner={open:open,version:10,printCurrent:printGame};"
new="root.App360GameDesigner={open:open,version:15,printCurrent:printGame,placeAssetAtClient:placeAssetAtClient,align:alignSelected,distribute:distributeAll,snap:snapAll,normalize:normalizeSizes,smartFinish:smartFinish,getData:function(){syncFromInputs();return gameDef()},loadData:applyDef};"
g=must_replace(g,old,new,'game export')
write(p,g)

# --- v15 UI assistant + browser storage ---
designer15=r'''(function(win){'use strict';
var store=win.App360DesignerStore,timer=null;
function el(id){return document.getElementById(id)}
function api(kind){return kind==='worksheet'?win.App360WorksheetDesigner:win.App360GameDesigner}
function panel(kind){return document.querySelector(kind==='worksheet'?'.wd9-panel':'.gd-panel')}
function settings(kind){return el(kind==='worksheet'?'wdSettingsDrawer':'gdSettings')}
function status(kind,t){var n=el(kind==='worksheet'?'wdStatus':'gdStatus');if(n)n.textContent=t||''}
function markDirty(){if(win.App360DesignerGuard)win.App360DesignerGuard.markDirty()}
function clearDirty(){if(win.App360DesignerGuard)win.App360DesignerGuard.clearDirty()}
function modeText(){return store&&store.mode?store.mode():'LocalStorage'}
function html(kind){return '<section class="wd-block gd-block v15-assist-block" data-v15-assist="'+kind+'"><strong>مساعد التصميم 360</strong><button type="button" class="v15-magic" data-v15-magic>✨ تحسين سحري للتصميم<small>يضبط الحدود، المحاذاة، المسافات ويقلل التداخل مع الحفاظ على الفكرة</small></button><div class="v15-tool-group"><button data-v15-align="right">محاذاة يمين</button><button data-v15-align="left">محاذاة يسار</button><button data-v15-align="top">إلى الأعلى</button><button data-v15-align="bottom">إلى الأسفل</button><button data-v15-align="centerX">توسيط أفقي</button><button data-v15-align="centerY">توسيط رأسي</button><button data-v15-distribute="x">توزيع أفقي</button><button data-v15-distribute="y">توزيع رأسي</button><button data-v15-snap>تثبيت على شبكة</button><button data-v15-normalize>توحيد الأحجام</button></div><div class="v15-storage"><b>الحفظ والاسترجاع</b><div class="v15-storage-row"><button type="button" class="v15-save-browser" data-v15-save>حفظ في المتصفح</button><select data-v15-saved><option value="">المحفوظات</option></select><button type="button" data-v15-load>فتح</button><button type="button" data-v15-delete>حذف</button><button type="button" data-v15-draft>استرجاع المسودة</button></div><small class="v15-storage-note">التخزين الحالي: <b data-v15-mode>'+modeText()+'</b>. الأجهزة الحديثة تستخدم IndexedDB، والأجهزة القديمة تعود تلقائيًا إلى LocalStorage. الاستيراد والتصدير JSON يبقيان متاحين.</small><span class="v15-draft-badge ok" data-v15-draft-status>الحفظ التلقائي للمسودة فعّال</span></div></section>'}
function refresh(kind){var p=panel(kind),sel=p&&p.querySelector('[data-v15-saved]');if(!sel||!store)return;store.list(kind,function(a){var h='<option value="">المحفوظات ('+a.length+')</option>';for(var i=0;i<a.length;i++)h+='<option value="'+a[i].id+'">'+String(a[i].title||'تصميم')+' · '+String(a[i].updated_at||'').slice(0,16).replace('T',' ')+'</option>';sel.innerHTML=h})}
function current(kind){var a=api(kind);return a&&a.getData?a.getData():null}
function save(kind,quiet){var p=panel(kind),a=api(kind),d=current(kind);if(!p||!a||!d||!store)return;d.id=p._v15RecordId||d.id||kind+'-'+new Date().getTime();p._v15RecordId=d.id;store.save(kind,d,function(r){p._v15RecordId=r.id;store.clearDraft(kind,function(){});clearDirty();refresh(kind);if(!quiet)status(kind,'تم الحفظ الآمن في '+modeText())})}
function openSaved(kind){var p=panel(kind),sel=p&&p.querySelector('[data-v15-saved]'),a=api(kind);if(!sel||!sel.value||!a||!store)return;store.get(kind,sel.value,function(r){if(!r)return;a.loadData(r.data);p._v15RecordId=r.id;clearDirty();status(kind,'تم فتح التصميم المحفوظ')})}
function deleteSaved(kind){var p=panel(kind),sel=p&&p.querySelector('[data-v15-saved]');if(!sel||!sel.value||!store)return;if(win.confirm&&!win.confirm('حذف هذا التصميم المحفوظ من المتصفح؟'))return;store.remove(kind,sel.value,function(){refresh(kind);status(kind,'تم حذف التصميم المحفوظ')})}
function draft(kind,quiet){if(!store||!win.App360DesignerGuard||!win.App360DesignerGuard.isDirty())return;var d=current(kind);if(!d)return;store.saveDraft(kind,d,function(){var p=panel(kind),b=p&&p.querySelector('[data-v15-draft-status]');if(b){b.className='v15-draft-badge ok';b.textContent='تم حفظ مسودة تلقائية الآن'}if(!quiet)status(kind,'حُفظت مسودة استرداد تلقائيًا')})}
function restoreDraft(kind,ask){if(!store)return;var a=api(kind),p=panel(kind);store.loadDraft(kind,function(r){if(!r||!r.data||!a)return;var items=r.data.items||[];if(!items.length)return;var ok=true;if(ask&&win.confirm)ok=win.confirm('وجدنا مسودة غير مكتملة محفوظة بتاريخ '+String(r.updated_at||'').slice(0,16).replace('T',' ')+'. هل تريد استرجاعها؟');if(ok){a.loadData(r.data);p._v15RecordId=r.data.id||null;markDirty();status(kind,'تم استرجاع المسودة غير المكتملة')}})}
function bind(kind){var p=panel(kind),s=settings(kind),a=api(kind);if(!p||!s||!a||p.getAttribute('data-v15-enhanced')==='1')return;p.setAttribute('data-v15-enhanced','1');var box=document.createElement('div');box.innerHTML=html(kind);s.insertBefore(box.firstChild,s.firstChild);var assist=s.querySelector('[data-v15-assist]');assist.querySelector('[data-v15-magic]').onclick=function(){a.smartFinish();markDirty();draft(kind,true)};var als=assist.querySelectorAll('[data-v15-align]');for(var i=0;i<als.length;i++)als[i].onclick=function(){a.align(this.getAttribute('data-v15-align'));markDirty()};var ds=assist.querySelectorAll('[data-v15-distribute]');for(i=0;i<ds.length;i++)ds[i].onclick=function(){a.distribute(this.getAttribute('data-v15-distribute'));markDirty()};assist.querySelector('[data-v15-snap]').onclick=function(){a.snap(10);markDirty()};assist.querySelector('[data-v15-normalize]').onclick=function(){a.normalize();markDirty()};assist.querySelector('[data-v15-save]').onclick=function(){save(kind,false)};assist.querySelector('[data-v15-load]').onclick=function(){openSaved(kind)};assist.querySelector('[data-v15-delete]').onclick=function(){deleteSaved(kind)};assist.querySelector('[data-v15-draft]').onclick=function(){restoreDraft(kind,false)};refresh(kind);
 var nativeSave=el(kind==='worksheet'?'wdSaveLocal':'gdSaveBtn');if(nativeSave)nativeSave.addEventListener('click',function(){setTimeout(function(){save(kind,true)},80)},false);
 if(kind==='worksheet'){var tools=s.querySelectorAll('[data-wdshape]');for(i=0;i<tools.length;i++){tools[i].setAttribute('draggable','true');tools[i].ondragstart=function(e){try{e.dataTransfer.setData('text/x-app360-tool','shape:'+this.getAttribute('data-wdshape'))}catch(err){}}}var line=el('wdAddLine'),check=el('wdAddCheckbox');if(line){line.setAttribute('draggable','true');line.ondragstart=function(e){try{e.dataTransfer.setData('text/x-app360-tool','line')}catch(err){}}}if(check){check.setAttribute('draggable','true');check.ondragstart=function(e){try{e.dataTransfer.setData('text/x-app360-tool','checkbox')}catch(err){}}}}
 setTimeout(function(){restoreDraft(kind,true)},180)}
function wrap(){var w=win.App360WorksheetDesigner,g=win.App360GameDesigner;if(w&&w.open&&!w._v15Wrapped){var ow=w.open;w.open=function(game){ow(game);setTimeout(function(){bind('worksheet')},20)};w._v15Wrapped=true}if(g&&g.open&&!g._v15Wrapped){var og=g.open;g.open=function(){og();setTimeout(function(){bind('game')},20)};g._v15Wrapped=true}}
function visibleKind(){var o=el('drawingOverlay');if(!o||o.hidden)return null;if(document.querySelector('.wd9-panel'))return'worksheet';if(document.querySelector('.gd-panel'))return'game';return null}
wrap();timer=setInterval(function(){var k=visibleKind();if(k)draft(k,true)},2500);
win.App360DesignerV15={enhance:bind,save:save,restoreDraft:restoreDraft};
})(window);'''
write(APP/'designer-v15.js',designer15)

# --- index/version wiring ---
p=APP/'index.html'; idx=read(p)
idx=re.sub(r'\?v=14', '?v=15', idx)
idx=idx.replace('<link rel="stylesheet" href="v14.css?v=15">','<link rel="stylesheet" href="v14.css?v=15">\n<link rel="stylesheet" href="v15.css?v=15">')
idx=idx.replace('<script src="legacy-v14.js?v=15"></script>','<script src="storage-v15.js?v=15"></script>\n<script src="legacy-v15.js?v=15"></script>') if 'legacy-v14.js?v=15' in idx else idx
# Current v14 index did not necessarily have legacy-v14 visible in final old slot; insert before app.js.
if 'storage-v15.js?v=15' not in idx:
    idx=idx.replace('<script src="app.js?v=15"></script>','<script src="storage-v15.js?v=15"></script>\n<script src="legacy-v15.js?v=15"></script>\n<script src="app.js?v=15"></script>')
# Remove legacy-v14 if left.
idx=idx.replace('<script src="legacy-v14.js?v=15"></script>\n','')
idx=idx.replace('<script src="game-designer-v10.js?v=15"></script>','<script src="game-designer-v10.js?v=15"></script>\n<script src="designer-v15.js?v=15"></script>')
write(p,idx)

# manifest/app/package versions
p=APP/'manifest.webmanifest'; man=read(p).replace('?v=14','?v=15'); write(p,man)
p=APP/'app.json'; meta=json.loads(read(p)); meta['version']=15; write(p,json.dumps(meta,ensure_ascii=False,indent=2)+'\n')
p=APP/'package.json'; pkg=json.loads(read(p)); pkg['version']='0.15.0'; pkg['description']='ألعاب إبداعية عبر الشاشة أو بدون الشاشة: 170 لعبة، مصمم أوراق ومصمم ألعاب مع أدوات محاذاة وحفظ حديث - App 360 Lab'; pkg['scripts']['validate']='node --check app.js && node --check designer-v9.js && node --check designer-v10.js && node --check game-designer-v10.js && node --check designer-v15.js && node --check storage-v15.js && node --check legacy-v15.js && node --check designer-assets-v9.js && node --check games-data.js && node --check offline-alternatives.js && node --check sw.js && node --test app.test.js'; write(p,json.dumps(pkg,ensure_ascii=False,indent=2)+'\n')

# service worker: version + new v15 assets, retain explicit activation only
p=APP/'sw.js'; sw=read(p).replace('screen-to-move-v14','screen-to-move-v15').replace('?v=14','?v=15')
if "'./v15.css?v=15'" not in sw:
    sw=sw.replace("'./v14.css?v=15'","'./v14.css?v=15','./v15.css?v=15','./storage-v15.js?v=15','./legacy-v15.js?v=15','./designer-v15.js?v=15'")
sw=sw.replace("'./legacy-v14.js?v=15',",'')
# Ensure install remains passive; SKIP_WAITING only on explicit message.
sw=re.sub(r"self\.addEventListener\('install',function\(e\)\{e\.waitUntil\(caches\.open\(CACHE\).*?\}\)\}\);", lambda m:m.group(0).replace('self.skipWaiting&&self.skipWaiting()','Promise.resolve()'), sw)
write(p,sw)

# Existing app tests: accept v15 and add regression tests.
p=APP/'app.test.js'; t=read(p)
t=t.replace('screen-to-move-v1[0123]','screen-to-move-v1[012345]').replace('?v=1[0123]','?v=1[012345]')
if "v15 fast legacy manipulation avoids full rerender on every touch move" not in t:
    t += r'''

test('v15 fast legacy manipulation avoids full rerender on every touch move',()=>{const wd=fs.readFileSync('./designer-v9.js','utf8'),gd=fs.readFileSync('./game-designer-v10.js','utf8');assert.match(wd,/paintItemFast/);assert.match(wd,/sx:d\.w\/Math\.max/);assert.match(gd,/paintGameItemFast/);assert.match(gd,/sx:W\/Math\.max/);});
test('v15 worksheet shapes can be dragged and placed at the requested point',()=>{const wd=fs.readFileSync('./designer-v9.js','utf8'),ui=fs.readFileSync('./designer-v15.js','utf8'),legacy=fs.readFileSync('./legacy-v15.js','utf8');assert.match(wd,/placeToolAtClient/);assert.match(wd,/text\/x-app360-tool/);assert.match(ui,/data-wdshape/);assert.match(legacy,/type:'tool'/);});
test('v15 large modern screens keep inspector on the right and workspace beside it',()=>{const css=fs.readFileSync('./v15.css','utf8');assert.match(css,/@media \(min-width:1000px\)/);assert.match(css,/wd-settings-drawer\{display:block!important/);assert.match(css,/wd-work\{margin-right:390px/);assert.match(css,/gd-work\{margin-right:390px/);});
test('v15 adds alignment distribution snap normalize and magic finish to both designers',()=>{const wd=fs.readFileSync('./designer-v9.js','utf8'),gd=fs.readFileSync('./game-designer-v10.js','utf8'),ui=fs.readFileSync('./designer-v15.js','utf8');for(const k of ['alignSelected','distributeAll','snapAll','normalizeSizes','smartFinish']){assert.match(wd,new RegExp(k));assert.match(gd,new RegExp(k))}assert.match(ui,/تحسين سحري للتصميم/);});
test('v15 uses IndexedDB on modern browsers with localStorage legacy fallback and autosaved drafts',()=>{const st=fs.readFileSync('./storage-v15.js','utf8'),ui=fs.readFileSync('./designer-v15.js','utf8');assert.match(st,/indexedDB/);assert.match(st,/LocalStorage/);assert.match(st,/saveDraft/);assert.match(st,/loadDraft/);assert.match(ui,/2500/);assert.match(ui,/استرجاع المسودة/);});
test('v15 assets are versioned and cached offline',()=>{const html=fs.readFileSync('./index.html','utf8'),sw=fs.readFileSync('./sw.js','utf8');assert.match(html,/v15\.css\?v=15/);assert.match(html,/storage-v15\.js\?v=15/);assert.match(html,/legacy-v15\.js\?v=15/);assert.match(html,/designer-v15\.js\?v=15/);assert.match(sw,/screen-to-move-v15/);assert.match(sw,/designer-v15\.js\?v=15/);});
'''
write(p,t)

print('v15 prepared')
