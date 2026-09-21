'use strict';
const fs=require('node:fs');
const path=require('node:path');
const ROOT=process.cwd();
const APP=path.join(ROOT,'apps/1-4/screen-to-move');
function read(name){return fs.readFileSync(path.join(APP,name),'utf8')}
function write(name,s){fs.writeFileSync(path.join(APP,name),s)}

const css=`/* screen-to-move v14: desktop restoration, opposite-side designer settings, legacy touch drag */
/* Keep the compact v13 landscape treatment for the old tablet, but restore a spacious desktop layout. */
@media (min-width:1200px){
 html:not(.legacy-android) .compact-topbar{padding:8px 14px!important;min-height:54px!important;flex-wrap:wrap!important}
 html:not(.legacy-android) .compact-topbar .brand{display:flex!important}
 html:not(.legacy-android) .compact-topbar .top-actions{width:auto!important;max-width:calc(100% - 235px)!important;padding:2px!important;gap:5px!important}
 html:not(.legacy-android) .compact-topbar .top-actions button{min-height:38px!important;padding:6px 9px!important;font-size:12px!important;border-radius:10px!important}
 html:not(.legacy-android) .compact-topbar .top-actions img,html:not(.legacy-android) .compact-topbar .ui-icon{width:20px!important;height:20px!important;flex-basis:20px!important}
 html:not(.legacy-android) .app-root{max-width:1500px!important;margin:0 auto!important;padding:14px 18px 24px!important}
 html:not(.legacy-android) .compact-hero{padding:15px 18px!important;border-radius:18px!important;min-height:112px!important}
 html:not(.legacy-android) .compact-hero h2{font-size:30px!important;margin:3px 0!important}
 html:not(.legacy-android) .compact-hero p{display:block!important;font-size:14px!important;line-height:1.55!important;margin:5px 0!important}
 html:not(.legacy-android) .compact-hero .hero-badge{font-size:12px!important;padding:5px 9px!important}
 html:not(.legacy-android) .hero-mini{display:block!important;padding:9px 12px!important;min-width:120px!important;border-radius:14px!important}
 html:not(.legacy-android) .hero-mini b{font-size:28px!important}
 html:not(.legacy-android) .hero-mini span{font-size:11px!important}
 html:not(.legacy-android) .level-tabs{padding:10px 0 6px!important;gap:8px!important}
 html:not(.legacy-android) .level-tabs .chip{min-height:52px!important;padding:8px 12px!important;border-radius:13px!important}
 html:not(.legacy-android) .level-tabs .chip b{font-size:14px!important}
 html:not(.legacy-android) .level-tabs .chip small{font-size:10px!important;margin-top:3px!important}
 html:not(.legacy-android) .library-head{margin:12px 4px 8px!important}
 html:not(.legacy-android) .library-head h2{font-size:24px!important}
 html:not(.legacy-android) .library-head p{display:block!important}
 html:not(.legacy-android) .game-card{width:calc(25% - 16px)!important;margin:8px!important;min-height:250px!important;border-radius:16px!important}
 html:not(.legacy-android) .game-cover-art{height:148px!important}
 html:not(.legacy-android) .game-body{padding:10px 12px!important}
 html:not(.legacy-android) .game-body>b{font-size:16px!important;margin-bottom:7px!important;line-height:1.35!important}
 html:not(.legacy-android) .meta{font-size:11px!important}
 html:not(.legacy-android) .meta span{padding:4px 7px!important}
 html:not(.legacy-android) .play-now{font-size:12px!important;margin-top:8px!important}
 html:not(.legacy-android) .game-view>*{margin-bottom:10px!important}
 html:not(.legacy-android) .game-switcher{padding:7px!important;margin-bottom:9px!important;border-radius:16px!important}
 html:not(.legacy-android) .game-switcher button{min-height:40px!important;padding:7px 10px!important;font-size:12px!important}
 html:not(.legacy-android) .game-count{min-width:62px!important}
 html:not(.legacy-android) .game-count span{font-size:11px!important}
 html:not(.legacy-android) .screen-game{padding:14px 16px!important;border-radius:18px!important}
 html:not(.legacy-android) .screen-game-head h2{font-size:28px!important}
 html:not(.legacy-android) .screen-game-head p{font-size:13px!important;margin:4px 0!important}
 html:not(.legacy-android) .game-heading>.ui-icon{width:42px!important;height:42px!important;flex-basis:42px!important}
 html:not(.legacy-android) .screen-game-head .btn{min-height:40px!important;padding:7px 10px!important;font-size:12px!important}
 html:not(.legacy-android) .score-hud{display:block!important;padding:12px 14px!important;margin:10px 0!important;border-radius:16px!important}
 html:not(.legacy-android) .score-top{min-width:0!important}
 html:not(.legacy-android) .score-top small{font-size:11px!important}
 html:not(.legacy-android) .score-top strong{font-size:18px!important;margin-top:2px!important}
 html:not(.legacy-android) .score-top button{min-height:38px!important;padding:6px 9px!important;font-size:12px!important}
 html:not(.legacy-android) .score-counters{margin:9px 0!important;gap:8px!important}
 html:not(.legacy-android) .score-counters span{padding:6px 9px!important;font-size:12px!important}
 html:not(.legacy-android) .progress-track{width:100%!important;height:9px!important;margin:5px 0 0!important;display:block!important}
 html:not(.legacy-android) .challenge{min-height:315px!important;padding:14px!important;border-radius:16px!important}
 html:not(.legacy-android) .challenge h3{font-size:23px!important;margin:8px 0 12px!important}
 html:not(.legacy-android) .challenge-msg{font-size:13px!important;min-height:24px!important;margin:9px 0!important}
 html:not(.legacy-android) .choice-grid{gap:12px!important}
 html:not(.legacy-android) .choice-grid button{min-width:105px!important;min-height:98px!important;padding:10px!important;font-size:46px!important}
 html:not(.legacy-android) .mark-option{min-height:126px!important;padding:12px 8px 31px!important}
 html:not(.legacy-android) .mark-value{min-height:72px!important;font-size:34px!important}
 html:not(.legacy-android) .stable-visual img,html:not(.legacy-android) .stable-visual.legacy-real-visual img{width:66px!important;height:66px!important}
 html:not(.legacy-android) .stable-visual small{font-size:12px!important}
 html:not(.legacy-android) .game-tools{margin-top:10px!important;gap:8px!important}
 html:not(.legacy-android) .game-tools .btn{min-height:42px!important;padding:8px 11px!important;font-size:12px!important}
 html:not(.legacy-android) .score-note{display:block!important}
 html:not(.legacy-android) .after-play{margin-top:16px!important}
 html:not(.legacy-android) .section-title{padding:12px 15px!important;border-radius:16px!important}
 html:not(.legacy-android) .section-title h3{font-size:20px!important}
 html:not(.legacy-android) .section-title p{font-size:13px!important}
}
/* Put designer settings on the side opposite the close button. In RTL the close control is at the left edge. */
.wd-settings-toggle,.gd-settings-toggle{left:auto!important;right:10px!important;border-radius:13px 0 0 13px!important}
.wd-settings-drawer,.gd-settings{left:auto!important;right:8px!important}
html.legacy-android .wd-settings-drawer.open,html.legacy-android .gd-settings.open{left:auto!important;right:6px!important}
/* Make touch targets explicit on legacy tablets. */
html.legacy-android .wd-asset,html.legacy-android .gd-asset,html.legacy-android .wd-item,html.legacy-android .gd-item{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important}
html.legacy-android .wd-item,html.legacy-android .gd-item,html.legacy-android .wd-handle,html.legacy-android .gd-resize{-ms-touch-action:none!important;touch-action:none!important}
.v14-drag-ghost{position:fixed!important;z-index:2000005!important;width:74px!important;height:74px!important;padding:5px!important;background:#fff!important;border:2px solid #0f8f8a!important;border-radius:12px!important;box-shadow:0 8px 24px #0005!important;pointer-events:none!important;opacity:.92!important}
.v14-drag-ghost img{width:100%!important;height:100%!important;object-fit:contain!important}
.v14-save-warning{position:fixed;right:12px;bottom:12px;z-index:2000010;background:#17302f;color:#fff;border-radius:12px;padding:9px 12px;font:700 12px Tahoma,Arial,sans-serif;box-shadow:0 6px 20px #0004}
`;
write('v14.css',css);

const js=`(function(){'use strict';
var doc=document,win=window,dirty=false,lastPanel=null,activeMouse=null,assetDrag=null,suppressClickUntil=0;
var ua=navigator.userAgent||'',legacy=/Android\\s(?:[0-4])(?:\\.|;)/i.test(ua)||((' '+doc.documentElement.className+' ').indexOf(' legacy-android ')>=0);
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
})(window);\n`;
write('legacy-v14.js',js);

let html=read('index.html').replace(/\?v=13/g,'?v=14');
if(html.indexOf('v14.css?v=14')<0)html=html.replace('<link rel="stylesheet" href="v13.css?v=14">','<link rel="stylesheet" href="v13.css?v=14">\n<link rel="stylesheet" href="v14.css?v=14">');
if(html.indexOf('legacy-v14.js?v=14')<0)html=html.replace('<script src="app.js?v=14"></script>','<script src="legacy-v14.js?v=14"></script>\n<script src="app.js?v=14"></script>');
write('index.html',html);

let sw=read('sw.js').replace(/screen-to-move-v13/g,'screen-to-move-v14').replace(/\?v=13/g,'?v=14');
if(sw.indexOf("'./v14.css?v=14'")<0)sw=sw.replace("'./v13.css?v=14'","'./v13.css?v=14','./v14.css?v=14','./legacy-v14.js?v=14'");
/* Do not activate a new service worker in the middle of unfinished designer work. Activation remains available through the explicit SKIP_WAITING message. */
sw=sw.replace(';if(self.skipWaiting)self.skipWaiting()','');
write('sw.js',sw);

let manifest=JSON.parse(read('manifest.webmanifest'));manifest.start_url='./index.html?v=14';manifest.description='170 لعبة متدرجة مع تخطيط حاسوب منظم، توافق Android 4.4، سحب لمسي في المصممين وحماية من فقدان العمل غير المحفوظ.';write('manifest.webmanifest',JSON.stringify(manifest,null,2)+'\n');
let pkg=JSON.parse(read('package.json'));pkg.version='0.14.0';write('package.json',JSON.stringify(pkg,null,2)+'\n');
let meta=JSON.parse(read('app.json'));meta.version=14;meta.implementation.state='live-v14-desktop-layout-legacy-touch-drag-and-unsaved-work-guard';meta.implementation.features.push('desktop layout restoration prevents the old-tablet compact landscape rules from flattening laptop game cards');meta.implementation.features.push('legacy Android touch bridge supports moving resizing and touch drag-drop from both designer asset libraries');meta.implementation.features.push('worksheet and electronic game settings open from the side opposite the RTL close control');meta.implementation.features.push('designer close back update and unload guards protect pending unsaved work and backdrop taps never close designers');meta.implementation.features.push('service worker no longer calls skipWaiting during install, preventing surprise controller reloads while designing');write('app.json',JSON.stringify(meta,null,2)+'\n');

let test=read('app.test.js').replace(/\?v=13/g,'?v=14').replace(/screen-to-move-v13/g,'screen-to-move-v14').replace(/1\[0123\]/g,'1[01234]');
if(test.indexOf('v14 restores laptop layout while preserving legacy tablet compact mode')<0)test += `\n\ntest('v14 restores laptop layout while preserving legacy tablet compact mode',()=>{const css=fs.readFileSync('./v14.css','utf8');assert.match(css,/@media \\(min-width:1200px\\)/);assert.match(css,/html:not\\(\\.legacy-android\\) \\.game-card\\{width:calc\\(25% - 16px\\)/);assert.match(css,/game-cover-art\\{height:148px/);});\ntest('v14 puts designer settings opposite the close control',()=>{const css=fs.readFileSync('./v14.css','utf8');assert.match(css,/\\.wd-settings-toggle,\\.gd-settings-toggle\\{left:auto!important;right:10px!important/);assert.match(css,/\\.wd-settings-drawer,\\.gd-settings\\{left:auto!important;right:8px!important/);});\ntest('v14 adds legacy touch drag and drop for both designers',()=>{const js=fs.readFileSync('./legacy-v14.js','utf8');assert.match(js,/wd-asset/);assert.match(js,/gd-asset/);assert.match(js,/wd-item/);assert.match(js,/gd-item/);assert.match(js,/dispatchMouse/);assert.match(js,/elementFromPoint/);assert.doesNotMatch(js,/=>|\\bconst\\b|\\blet\\b|`/);});\ntest('v14 guards unfinished designer work from accidental close back update and reload',()=>{const js=fs.readFileSync('./legacy-v14.js','utf8');assert.match(js,/beforeunload/);assert.match(js,/popstate/);assert.match(js,/controllerchange/);assert.match(js,/drawing-backdrop/);assert.match(js,/updateBtn/);assert.match(js,/App360DesignerGuard/);});\ntest('v14 service worker waits for explicit activation instead of surprise reload',()=>{const sw=fs.readFileSync('./sw.js','utf8');assert.match(sw,/screen-to-move-v14/);assert.match(sw,/legacy-v14\\.js\\?v=14/);assert.match(sw,/v14\\.css\\?v=14/);const install=sw.match(/self\\.addEventListener\\('install',[^\\n]+/)[0];assert.doesNotMatch(install,/skipWaiting/);assert.match(sw,/SKIP_WAITING/);});\ntest('v14 guard loads before app runtime so it can intercept back and service-worker reloads',()=>{const html=fs.readFileSync('./index.html','utf8');assert.ok(html.indexOf('legacy-v14.js?v=14')<html.indexOf('app.js?v=14'));assert.match(html,/v14\\.css\\?v=14/);});\n`;
write('app.test.js',test);
console.log('v14 prepared');
