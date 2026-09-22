from pathlib import Path
import json,re

ROOT=Path('.')
APP=ROOT/'apps/1-4/screen-to-move'

def read(p): return Path(p).read_text(encoding='utf-8')
def write(p,s): Path(p).write_text(s,encoding='utf-8')
def must(old,s,label):
    if old not in s: raise SystemExit('missing '+label)

def replace_func(s,name,next_name,new):
    pat=r'function '+re.escape(name)+r'\([^\n]*?\)\{.*?\}\n(?=function '+re.escape(next_name)+r'\()'
    out,n=re.subn(pat,new+'\n',s,count=1,flags=re.S)
    if n!=1: raise SystemExit('function replace failed '+name)
    return out

# ---------- worksheet core: multi-selection + mobile-safe touch ----------
p=APP/'designer-v9.js'; s=read(p)
s=s.replace("var state={game:null,items:[],selected:null,tool:'select'","var state={game:null,items:[],selected:null,selectedIds:[],multiSelect:false,tool:'select'",1)
s=s.replace("state.z=x.z||10;state.selected=null;renderPage()","state.z=x.z||10;state.selected=null;state.selectedIds=[];renderPage()",1)
s=s.replace("(state.selected===it.id?'selected ':'')","(isSelected(it.id)?'selected ':'')",1)
old="function selectedItem(){for(var i=0;i<state.items.length;i++)if(state.items[i].id===state.selected)return state.items[i];return null}"
must(old,s,'worksheet selectedItem')
helpers=r'''function selectedItem(){for(var i=0;i<state.items.length;i++)if(state.items[i].id===state.selected)return state.items[i];return null}
function idIn(a,id){for(var i=0;i<a.length;i++)if(a[i]===id)return i;return-1}
function selectionItems(){var out=[],ids=state.selectedIds||[],i;if(ids.length){for(i=0;i<state.items.length;i++)if(idIn(ids,state.items[i].id)>=0)out.push(state.items[i])}else{var one=selectedItem();if(one)out.push(one)}return out}
function isSelected(id){return idIn(state.selectedIds||[],id)>=0||(!(state.selectedIds||[]).length&&state.selected===id)}
function selectionCount(){return selectionItems().length}
function selectionGroup(){var a=selectionItems();return a.length>=2?a:state.items.slice()}
function paintSelectionClasses(){var nodes=qa('.wd-item',el('wdItems')),i,id;for(i=0;i<nodes.length;i++){id=nodes[i].getAttribute('data-id');if(isSelected(id))addClass(nodes[i],'selected');else removeClass(nodes[i],'selected')}syncSelectionPanel()}
function feedback(text){if(root.App360DesignerFeedback)root.App360DesignerFeedback('worksheet',text)}
function toggleSelectionId(id){var ids=state.selectedIds||[],i=idIn(ids,id);if(i>=0)ids.splice(i,1);else ids.push(id);state.selected=ids.length?ids[ids.length-1]:null;state.selectedIds=ids;paintSelectionClasses();feedback(ids.length?'تم تحديد '+ids.length+' عنصر'+(ids.length>1?' للعلاج الجماعي':''):'تم إلغاء التحديد')}
function setMultiSelect(on){state.multiSelect=!!on;if(state.multiSelect){if(state.selected&&idIn(state.selectedIds,state.selected)<0)state.selectedIds=[state.selected]}else{state.selectedIds=state.selected?[state.selected]:[]}paintSelectionClasses();feedback(state.multiSelect?'وضع التحديد المتعدد جاهز — المس العناصر المطلوبة':'تم الرجوع إلى تحديد عنصر واحد')}
function isMultiSelect(){return!!state.multiSelect}
function selectAll(){state.multiSelect=true;state.selectedIds=[];for(var i=0;i<state.items.length;i++)state.selectedIds.push(state.items[i].id);state.selected=state.selectedIds.length?state.selectedIds[state.selectedIds.length-1]:null;paintSelectionClasses();feedback('تم تحديد كل العناصر: '+state.selectedIds.length)}
function clearSelection(){state.selected=null;state.selectedIds=[];paintSelectionClasses();feedback('تم إلغاء تحديد العناصر')}
function boundsOf(a){if(!a.length)return null;var minX=a[0].x,minY=a[0].y,maxX=a[0].x+a[0].w,maxY=a[0].y+a[0].h;for(var i=1;i<a.length;i++){minX=Math.min(minX,a[i].x);minY=Math.min(minY,a[i].y);maxX=Math.max(maxX,a[i].x+a[i].w);maxY=Math.max(maxY,a[i].y+a[i].h)}return{x:minX,y:minY,w:maxX-minX,h:maxY-minY,maxX:maxX,maxY:maxY}}
function scaleSelection(factor){var a=selectionItems(),d=pageDims(),b=boundsOf(a),i,it,cx,cy,nw,nh,ncx,ncy;if(!a.length)return;factor=Number(factor)||1;if(factor<.5)factor=.5;if(factor>1.6)factor=1.6;snapshot();cx=b.x+b.w/2;cy=b.y+b.h/2;for(i=0;i<a.length;i++){it=a[i];nw=clamp(it.w*factor,28,Math.min(520,d.w));nh=clamp(it.h*factor,28,Math.min(650,d.h));ncx=cx+((it.x+it.w/2)-cx)*factor;ncy=cy+((it.y+it.h/2)-cy)*factor;it.w=nw;it.h=nh;it.x=clamp(ncx-nw/2,0,d.w-nw);it.y=clamp(ncy-nh/2,0,d.h-nh)}renderPage();feedback((factor>1?'تم تكبير ':'تم تصغير ')+a.length+' عنصر')}
'''
s=s.replace(old,helpers,1)
s=s.replace("function selectNodeFast(node,id){state.selected=id;qa('.wd-item',el('wdItems')).forEach(function(x){removeClass(x,'selected')});addClass(node,'selected');syncSelectionPanel()}","function selectNodeFast(node,id){state.selected=id;state.selectedIds=[id];qa('.wd-item',el('wdItems')).forEach(function(x){removeClass(x,'selected')});addClass(node,'selected');syncSelectionPanel();feedback('تم تحديد العنصر — اسحبه للتحريك أو استخدم المقابض لتغيير الحجم')}",1)
s=replace_func(s,'startItemDrag','dragMove',"function startItemDrag(e,node,resizing){if(state.tool!=='select')return;var id=node.getAttribute('data-id'),it=null,i;for(i=0;i<state.items.length;i++)if(state.items[i].id===id){it=state.items[i];break}if(!it)return;if(state.multiSelect&&!resizing){toggleSelectionId(id);if(e.preventDefault)e.preventDefault();return}snapshot();selectNodeFast(node,id);var p=eventPoint(e),page=el('wdPage'),r=page.getBoundingClientRect(),d=pageDims();state.drag={id:id,resizing:!!resizing,dir:resizing||'',startX:p.x,startY:p.y,x:it.x,y:it.y,w:it.w,h:it.h,sx:d.w/Math.max(1,r.width),sy:d.h/Math.max(1,r.height)};addClass(node,'v16-manipulating');if(e.preventDefault)e.preventDefault()}")
s=replace_func(s,'dragEnd','addItem',"function dragEnd(){if(state.drag){var n=document.querySelector('.wd-item[data-id=\"'+state.drag.id+'\"]');if(n)removeClass(n,'v16-manipulating');syncSelectionPanel();feedback(state.drag.resizing?'تم تثبيت الحجم الجديد':'تم تثبيت موضع العنصر')}state.drag=null}")
s=s.replace("state.items.push(it);state.selected=it.id;renderPage()","state.items.push(it);state.selected=it.id;state.selectedIds=[it.id];renderPage();feedback('تمت إضافة '+(it.label||it.text||it.shape||'العنصر')+' وأصبح محددًا')",1)

align_new=r'''function alignSelected(mode){var a=selectionItems(),d=pageDims(),m=28,i,it,b;if(!a.length)return;snapshot();if(a.length===1){it=a[0];if(mode==='left')it.x=m;else if(mode==='right')it.x=d.w-m-it.w;else if(mode==='top')it.y=m;else if(mode==='bottom')it.y=d.h-m-it.h;else if(mode==='centerX')it.x=(d.w-it.w)/2;else if(mode==='centerY')it.y=(d.h-it.h)/2;it.x=clamp(it.x,0,d.w-it.w);it.y=clamp(it.y,0,d.h-it.h)}else{b=boundsOf(a);for(i=0;i<a.length;i++){it=a[i];if(mode==='left')it.x=b.x;else if(mode==='right')it.x=b.maxX-it.w;else if(mode==='top')it.y=b.y;else if(mode==='bottom')it.y=b.maxY-it.h;else if(mode==='centerX')it.x=b.x+(b.w-it.w)/2;else if(mode==='centerY')it.y=b.y+(b.h-it.h)/2;it.x=clamp(it.x,0,d.w-it.w);it.y=clamp(it.y,0,d.h-it.h)}}renderPage();feedback('تمت محاذاة '+a.length+' عنصر') }'''
s=replace_func(s,'alignSelected','distributeAll',align_new)
distribute_new=r'''function distributeAll(axis){var chosen=selectionItems(),a=chosen.length>=2?chosen:state.items.slice(),d=pageDims(),i,total=0,gap,pos,b;if(a.length<2){feedback('اختر عنصرين أو أكثر للتوزيع');return}snapshot();a.sort(function(x,y){return axis==='x'?x.x-y.x:x.y-y.y});b=boundsOf(a);for(i=0;i<a.length;i++)total+=axis==='x'?a[i].w:a[i].h;if(axis==='x'){gap=(b.w-total)/Math.max(1,a.length-1);if(gap<8)gap=8;pos=b.x;for(i=0;i<a.length;i++){a[i].x=clamp(pos,0,d.w-a[i].w);pos+=a[i].w+gap}}else{gap=(b.h-total)/Math.max(1,a.length-1);if(gap<8)gap=8;pos=b.y;for(i=0;i<a.length;i++){a[i].y=clamp(pos,0,d.h-a[i].h);pos+=a[i].h+gap}}renderPage();feedback('تم توزيع '+a.length+' عنصر '+(axis==='x'?'أفقيًا':'رأسيًا'))}'''
s=replace_func(s,'distributeAll','snapAll',distribute_new)
snap_new=r'''function snapAll(step){step=Number(step)||10;var d=pageDims(),a=selectionItems(),i,it;if(!a.length)a=state.items.slice();if(!a.length)return;snapshot();for(i=0;i<a.length;i++){it=a[i];it.x=clamp(Math.round(it.x/step)*step,0,d.w-it.w);it.y=clamp(Math.round(it.y/step)*step,0,d.h-it.h)}renderPage();feedback('تم تثبيت '+a.length+' عنصر على الشبكة')}'''
s=replace_func(s,'snapAll','normalizeSizes',snap_new)
normalize_new=r'''function normalizeSizes(){var chosen=selectionItems(),src=chosen.length>=2?chosen:state.items,groups={image:[],shape:[],text:[]},i,k,a,ws,hs,mw,mh;for(i=0;i<src.length;i++)if(groups[src[i].type])groups[src[i].type].push(src[i]);snapshot();for(k in groups){a=groups[k];if(a.length<2)continue;ws=a.map(function(x){return x.w}).sort(function(x,y){return x-y});hs=a.map(function(x){return x.h}).sort(function(x,y){return x-y});mw=ws[Math.floor(ws.length/2)];mh=hs[Math.floor(hs.length/2)];for(i=0;i<a.length;i++){a[i].w=mw;a[i].h=mh}}renderPage();feedback('تم توحيد أحجام العناصر المتشابهة في النطاق المحدد')}'''
s=replace_func(s,'normalizeSizes','smartFinish',normalize_new)
smart_new=r'''function smartFinish(){if(!state.items.length){toastLocal('أضف عناصر أولًا ثم استخدم التحسين السحري');return}var d=pageDims(),m=30,i,j,it,chosen=selectionItems(),a=chosen.length>=2?chosen:state.items.slice(),b,cols,rows,cellW,cellH,gap=18,order;if(a.length>=2&&chosen.length>=2){snapshot();b=boundsOf(a);b.x=clamp(b.x,m,d.w-m);b.y=clamp(b.y,m,d.h-m);b.w=Math.max(180,Math.min(d.w-b.x-m,b.w));b.h=Math.max(180,Math.min(d.h-b.y-m,b.h));cols=Math.max(1,Math.ceil(Math.sqrt(a.length*Math.max(.7,b.w/Math.max(1,b.h)))));cols=Math.min(cols,a.length);rows=Math.ceil(a.length/cols);cellW=Math.max(70,(b.w-gap*(cols-1))/cols);cellH=Math.max(70,(b.h-gap*(rows-1))/rows);order=a.slice().sort(function(x,y){var dy=(x.y+x.h/2)-(y.y+y.h/2);return Math.abs(dy)>40?dy:x.x-y.x});for(i=0;i<order.length;i++){it=order[i];var row=Math.floor(i/cols),col=i%cols,maxW=cellW*.82,maxH=cellH*.82,ratio=it.h/Math.max(1,it.w),nw=it.w,nh=it.h;if(nw>maxW){nw=maxW;nh=nw*ratio}if(nh>maxH){nh=maxH;nw=nh/Math.max(.05,ratio)}it.w=Math.max(28,nw);it.h=Math.max(28,nh);it.x=clamp(b.x+col*(cellW+gap)+(cellW-it.w)/2,m,d.w-m-it.w);it.y=clamp(b.y+row*(cellH+gap)+(cellH-it.h)/2,m,d.h-m-it.h)}renderPage();feedback('التحسين السحري رتّب '+a.length+' عناصر محددة في شبكة متوازنة');return}var changed=true,pass=0;snapshot();for(i=0;i<a.length;i++){it=a[i];it.x=clamp(Math.round(it.x/10)*10,m,Math.max(m,d.w-m-it.w));it.y=clamp(Math.round(it.y/10)*10,m,Math.max(m,d.h-m-it.h))}while(changed&&pass<5){changed=false;pass++;for(i=0;i<a.length;i++)for(j=i+1;j<a.length;j++){var A=a[i],B=a[j],ox=Math.min(A.x+A.w,B.x+B.w)-Math.max(A.x,B.x),oy=Math.min(A.y+A.h,B.y+B.h)-Math.max(A.y,B.y);if(ox>8&&oy>8){var ny=A.y+A.h+16;if(ny+B.h<=d.h-m)B.y=ny;else B.x=clamp(A.x+A.w+16,m,d.w-m-B.w);changed=true}}}renderPage();feedback('تم تحسين التصميم كاملًا: حدود آمنة وتقليل التداخل والمحاذاة')}'''
s=replace_func(s,'smartFinish','syncSelectionPanel',smart_new)
s=replace_func(s,'syncSelectionPanel','syncControls',"function syncSelectionPanel(){var a=selectionItems(),it=selectedItem(),size=el('wdSize');if(size&&it)size.value=Math.round(Math.max(it.w,it.h));var label=el('wdSelectedLabel');if(label)label.textContent=a.length>1?('تم تحديد '+a.length+' عناصر — أدوات المحاذاة ستعمل عليها معًا'):(it?(it.label||it.text||it.shape||it.type):'لا يوجد عنصر محدد')}")
s=replace_func(s,'setSelectedSize','deleteSelected',"function setSelectedSize(v){var a=selectionItems(),d=pageDims(),i,it,ratio;if(!a.length)return;snapshot();v=clamp(Number(v)||120,35,420);for(i=0;i<a.length;i++){it=a[i];ratio=it.h&&it.w?it.h/it.w:1;it.w=Math.min(v,d.w-it.x);it.h=Math.min(it.type==='text'?Math.max(45,Math.min(130,v*.28)):v*ratio,d.h-it.y)}renderPage();feedback('تم تغيير حجم '+a.length+' عنصر')}")
s=replace_func(s,'deleteSelected','duplicateSelected',"function deleteSelected(){var a=selectionItems(),ids=[],i;if(!a.length)return;snapshot();for(i=0;i<a.length;i++)ids.push(a[i].id);state.items=state.items.filter(function(x){return idIn(ids,x.id)<0});state.selected=null;state.selectedIds=[];renderPage();feedback('تم حذف '+a.length+' عنصر')}")
s=replace_func(s,'duplicateSelected','zMove',"function duplicateSelected(){var a=selectionItems(),added=[],i,it,n,d=pageDims();if(!a.length)return;snapshot();for(i=0;i<a.length;i++){it=a[i];n=cloneObj(it);n.id=uid();n.x=clamp(n.x+24,0,d.w-n.w);n.y=clamp(n.y+24,0,d.h-n.h);n.z=++state.z;state.items.push(n);added.push(n.id)}state.selectedIds=added;state.selected=added.length?added[added.length-1]:null;renderPage();feedback('تم نسخ '+added.length+' عنصر')}")
s=replace_func(s,'zMove','pagePoint',"function zMove(dir){var a=selectionItems(),i,it;if(!a.length)return;snapshot();for(i=0;i<a.length;i++){it=a[i];it.z=dir>0?++state.z:Math.max(1,(it.z||1)-2)}renderPage();feedback(dir>0?'تم تقديم العناصر المحددة':'تم إرسال العناصر المحددة للخلف')}")
# Modern Chrome root touch listeners must explicitly be non-passive while manipulating.
s=s.replace("document.addEventListener('touchmove',dragMove,false)","document.addEventListener('touchmove',dragMove,root.App360TouchOptions||false)")
s=s.replace("document.addEventListener('touchend',dragEnd,false)","document.addEventListener('touchend',dragEnd,root.App360TouchOptions||false)")
# reset selection mode on open
s=s.replace("state.game=game||null;state.items=[];state.selected=null;state.tool='select'","state.game=game||null;state.items=[];state.selected=null;state.selectedIds=[];state.multiSelect=false;state.tool='select'",1)
old_export="root.App360WorksheetDesigner={open:open,version:15,placeAssetAtClient:placeAssetAtClient,placeToolAtClient:placeToolAtClient,align:alignSelected,distribute:distributeAll,snap:snapAll,normalize:normalizeSizes,smartFinish:smartFinish,getData:designData,loadData:loadDesign};"
must(old_export,s,'worksheet export')
new_export="root.App360WorksheetDesigner={open:open,version:16,placeAssetAtClient:placeAssetAtClient,placeToolAtClient:placeToolAtClient,align:alignSelected,distribute:distributeAll,snap:snapAll,normalize:normalizeSizes,smartFinish:smartFinish,getData:designData,loadData:loadDesign,setMultiSelect:setMultiSelect,isMultiSelect:isMultiSelect,selectAll:selectAll,clearSelection:clearSelection,getSelectionCount:selectionCount,scaleSelection:scaleSelection};"
s=s.replace(old_export,new_export,1)
write(p,s)

# ---------- electronic game designer: same selection model ----------
p=APP/'game-designer-v10.js'; g=read(p)
g=g.replace("items:[],selected:null,z:5","items:[],selected:null,selectedIds:[],multiSelect:false,z:5",1)
g=g.replace("(S.selected===it.id?'selected':'')","(isSelected(it.id)?'selected':'')",1)
old="function selected(){for(var i=0;i<S.items.length;i++)if(S.items[i].id===S.selected)return S.items[i];return null}"
must(old,g,'game selected')
helpers_g=r'''function selected(){for(var i=0;i<S.items.length;i++)if(S.items[i].id===S.selected)return S.items[i];return null}
function idIn(a,id){for(var i=0;i<a.length;i++)if(a[i]===id)return i;return-1}
function selectionItems(){var out=[],ids=S.selectedIds||[],i;if(ids.length){for(i=0;i<S.items.length;i++)if(idIn(ids,S.items[i].id)>=0)out.push(S.items[i])}else{var one=selected();if(one)out.push(one)}return out}
function isSelected(id){return idIn(S.selectedIds||[],id)>=0||(!(S.selectedIds||[]).length&&S.selected===id)}
function selectionCount(){return selectionItems().length}
function selectionGroup(){var a=selectionItems();return a.length>=2?a:S.items.slice()}
function feedback(text){if(root.App360DesignerFeedback)root.App360DesignerFeedback('game',text)}
function paintSelection(){var nodes=qa('.gd-item',el('gdItems')),i,id;for(i=0;i<nodes.length;i++){id=nodes[i].getAttribute('data-id');if(isSelected(id))addClass(nodes[i],'selected');else removeClass(nodes[i],'selected')}syncInspector()}
function toggleSelectionId(id){var ids=S.selectedIds||[],i=idIn(ids,id);if(i>=0)ids.splice(i,1);else ids.push(id);S.selected=ids.length?ids[ids.length-1]:null;S.selectedIds=ids;paintSelection();feedback(ids.length?'تم تحديد '+ids.length+' عنصر في اللعبة':'تم إلغاء التحديد')}
function setMultiSelect(on){S.multiSelect=!!on;if(S.multiSelect){if(S.selected&&idIn(S.selectedIds,S.selected)<0)S.selectedIds=[S.selected]}else S.selectedIds=S.selected?[S.selected]:[];paintSelection();feedback(S.multiSelect?'وضع التحديد المتعدد جاهز':'تم الرجوع إلى عنصر واحد')}
function isMultiSelect(){return!!S.multiSelect}
function selectAll(){S.multiSelect=true;S.selectedIds=[];for(var i=0;i<S.items.length;i++)S.selectedIds.push(S.items[i].id);S.selected=S.selectedIds.length?S.selectedIds[S.selectedIds.length-1]:null;paintSelection();feedback('تم تحديد كل عناصر اللعبة: '+S.selectedIds.length)}
function clearSelection(){S.selected=null;S.selectedIds=[];paintSelection();feedback('تم إلغاء تحديد العناصر')}
function boundsOf(a){if(!a.length)return null;var minX=a[0].x,minY=a[0].y,maxX=a[0].x+a[0].w,maxY=a[0].y+a[0].h;for(var i=1;i<a.length;i++){minX=Math.min(minX,a[i].x);minY=Math.min(minY,a[i].y);maxX=Math.max(maxX,a[i].x+a[i].w);maxY=Math.max(maxY,a[i].y+a[i].h)}return{x:minX,y:minY,w:maxX-minX,h:maxY-minY,maxX:maxX,maxY:maxY}}
function scaleSelection(factor){var a=selectionItems(),b=boundsOf(a),i,it,cx,cy,nw,nh,ncx,ncy;if(!a.length)return;factor=Number(factor)||1;snapshot();cx=b.x+b.w/2;cy=b.y+b.h/2;for(i=0;i<a.length;i++){it=a[i];nw=clamp(it.w*factor,50,520);nh=clamp(it.h*factor,45,420);ncx=cx+((it.x+it.w/2)-cx)*factor;ncy=cy+((it.y+it.h/2)-cy)*factor;it.w=nw;it.h=nh;it.x=clamp(ncx-nw/2,0,W-nw);it.y=clamp(ncy-nh/2,0,H-nh)}renderBoard();feedback((factor>1?'تم تكبير ':'تم تصغير ')+a.length+' عنصر')}
'''
g=g.replace(old,helpers_g,1)
g=g.replace("function selectGameNodeFast(n,id){S.selected=id;qa('.gd-item',el('gdItems')).forEach(function(x){removeClass(x,'selected')});addClass(n,'selected');syncInspector()}","function selectGameNodeFast(n,id){S.selected=id;S.selectedIds=[id];qa('.gd-item',el('gdItems')).forEach(function(x){removeClass(x,'selected')});addClass(n,'selected');syncInspector();feedback('تم تحديد العنصر — اسحبه أو غيّر حجمه')}",1)
g=replace_func(g,'startDrag','dragMove',"function startDrag(e,n,resizing){var id=n.getAttribute('data-id'),it=null;for(var i=0;i<S.items.length;i++)if(S.items[i].id===id){it=S.items[i];break}if(!it)return;if(S.multiSelect&&!resizing){toggleSelectionId(id);if(e.preventDefault)e.preventDefault();return}snapshot();selectGameNodeFast(n,id);var p=eventPoint(e),r=el('gdBoard').getBoundingClientRect();S.drag={id:id,resizing:resizing,startX:p.x,startY:p.y,x:it.x,y:it.y,w:it.w,h:it.h,sx:W/Math.max(1,r.width),sy:H/Math.max(1,r.height)};addClass(n,'v16-manipulating');if(e.preventDefault)e.preventDefault()}")
g=replace_func(g,'dragEnd','addImage',"function dragEnd(){if(S.drag){var n=document.querySelector('.gd-item[data-id=\"'+S.drag.id+'\"]');if(n)removeClass(n,'v16-manipulating');syncInspector();feedback(S.drag.resizing?'تم تثبيت الحجم الجديد':'تم تثبيت موضع العنصر')}S.drag=null}")
g=s if False else g
# replace add image/text to initialize one-item selection and feedback
g=g.replace("S.selected=S.items[S.items.length-1].id;renderBoard()}","S.selected=S.items[S.items.length-1].id;S.selectedIds=[S.selected];renderBoard();feedback('تمت إضافة '+(label||'الصورة')+' وأصبحت محددة')}",1)
g=g.replace("S.selected=S.items[S.items.length-1].id;renderBoard()}","S.selected=S.items[S.items.length-1].id;S.selectedIds=[S.selected];renderBoard();feedback('تمت إضافة النص وأصبح محددًا')}",1)

g=replace_func(g,'alignSelected','distributeAll',r'''function alignSelected(mode){var a=selectionItems(),m=24,i,it,b;if(!a.length)return;snapshot();if(a.length===1){it=a[0];if(mode==='left')it.x=m;else if(mode==='right')it.x=W-m-it.w;else if(mode==='top')it.y=m;else if(mode==='bottom')it.y=H-m-it.h;else if(mode==='centerX')it.x=(W-it.w)/2;else if(mode==='centerY')it.y=(H-it.h)/2}else{b=boundsOf(a);for(i=0;i<a.length;i++){it=a[i];if(mode==='left')it.x=b.x;else if(mode==='right')it.x=b.maxX-it.w;else if(mode==='top')it.y=b.y;else if(mode==='bottom')it.y=b.maxY-it.h;else if(mode==='centerX')it.x=b.x+(b.w-it.w)/2;else if(mode==='centerY')it.y=b.y+(b.h-it.h)/2}}for(i=0;i<a.length;i++){a[i].x=clamp(a[i].x,0,W-a[i].w);a[i].y=clamp(a[i].y,0,H-a[i].h)}renderBoard();feedback('تمت محاذاة '+a.length+' عنصر')}''')
g=replace_func(g,'distributeAll','snapAll',r'''function distributeAll(axis){var chosen=selectionItems(),a=chosen.length>=2?chosen:S.items.slice(),i,total=0,gap,pos,b;if(a.length<2){feedback('اختر عنصرين أو أكثر للتوزيع');return}snapshot();a.sort(function(x,y){return axis==='x'?x.x-y.x:x.y-y.y});b=boundsOf(a);for(i=0;i<a.length;i++)total+=axis==='x'?a[i].w:a[i].h;if(axis==='x'){gap=(b.w-total)/Math.max(1,a.length-1);if(gap<8)gap=8;pos=b.x;for(i=0;i<a.length;i++){a[i].x=clamp(pos,0,W-a[i].w);pos+=a[i].w+gap}}else{gap=(b.h-total)/Math.max(1,a.length-1);if(gap<8)gap=8;pos=b.y;for(i=0;i<a.length;i++){a[i].y=clamp(pos,0,H-a[i].h);pos+=a[i].h+gap}}renderBoard();feedback('تم توزيع '+a.length+' عنصر')}''')
g=replace_func(g,'snapAll','normalizeSizes',r'''function snapAll(step){step=Number(step)||10;var a=selectionItems(),i,it;if(!a.length)a=S.items.slice();if(!a.length)return;snapshot();for(i=0;i<a.length;i++){it=a[i];it.x=clamp(Math.round(it.x/step)*step,0,W-it.w);it.y=clamp(Math.round(it.y/step)*step,0,H-it.h)}renderBoard();feedback('تم تثبيت '+a.length+' عنصر على الشبكة')}''')
g=replace_func(g,'normalizeSizes','smartFinish',r'''function normalizeSizes(){var chosen=selectionItems(),a=chosen.length>=2?chosen:S.items.filter(function(x){return x.type==='image'}),i,ws,hs,mw,mh;if(a.length<2){feedback('اختر صورتين أو أكثر لتوحيد الحجم');return}snapshot();ws=a.map(function(x){return x.w}).sort(function(x,y){return x-y});hs=a.map(function(x){return x.h}).sort(function(x,y){return x-y});mw=ws[Math.floor(ws.length/2)];mh=hs[Math.floor(hs.length/2)];for(i=0;i<a.length;i++){a[i].w=mw;a[i].h=mh}renderBoard();feedback('تم توحيد حجم '+a.length+' عنصر')}''')
g=replace_func(g,'smartFinish','duplicateSelected',r'''function smartFinish(){if(!S.items.length){status('أضف عناصر أولًا ثم استخدم التحسين السحري');return}var chosen=selectionItems(),a=chosen.length>=2?chosen:S.items.slice(),m=24,b,cols,rows,cellW,cellH,gap=16,order,i,it;if(chosen.length>=2){snapshot();b=boundsOf(a);b.x=clamp(b.x,m,W-m);b.y=clamp(b.y,m,H-m);b.w=Math.max(180,Math.min(W-b.x-m,b.w));b.h=Math.max(150,Math.min(H-b.y-m,b.h));cols=Math.max(1,Math.ceil(Math.sqrt(a.length*Math.max(.9,b.w/Math.max(1,b.h)))));cols=Math.min(cols,a.length);rows=Math.ceil(a.length/cols);cellW=Math.max(80,(b.w-gap*(cols-1))/cols);cellH=Math.max(70,(b.h-gap*(rows-1))/rows);order=a.slice().sort(function(x,y){var dy=(x.y+x.h/2)-(y.y+y.h/2);return Math.abs(dy)>35?dy:x.x-y.x});for(i=0;i<order.length;i++){it=order[i];var row=Math.floor(i/cols),col=i%cols,maxW=cellW*.82,maxH=cellH*.78,ratio=it.h/Math.max(1,it.w),nw=it.w,nh=it.h;if(nw>maxW){nw=maxW;nh=nw*ratio}if(nh>maxH){nh=maxH;nw=nh/Math.max(.05,ratio)}it.w=Math.max(50,nw);it.h=Math.max(45,nh);it.x=clamp(b.x+col*(cellW+gap)+(cellW-it.w)/2,m,W-m-it.w);it.y=clamp(b.y+row*(cellH+gap)+(cellH-it.h)/2,m,H-m-it.h)}renderBoard();feedback('تم ترتيب '+a.length+' عناصر محددة في تخطيط متوازن');return}snapshot();a.sort(function(x,y){var dy=x.y-y.y;return Math.abs(dy)>40?dy:x.x-y.x});cols=Math.min(4,Math.max(2,Math.ceil(Math.sqrt(a.length*1.45))));rows=Math.ceil(a.length/cols);cellW=(W-2*m-gap*(cols-1))/cols;cellH=(H-2*m-gap*(rows-1))/rows;for(i=0;i<a.length;i++){it=a[i];var rr=Math.floor(i/cols),cc=i%cols;it.x=clamp(m+cc*(cellW+gap)+(cellW-it.w)/2,0,W-it.w);it.y=clamp(m+rr*(cellH+gap)+(cellH-it.h)/2,0,H-it.h)}renderBoard();feedback('تم تنظيم لوحة اللعبة كاملة في توزيع واضح')}''')
g=replace_func(g,'duplicateSelected','deleteSelected',r'''function duplicateSelected(){var a=selectionItems(),added=[],i,n;if(!a.length)return;snapshot();for(i=0;i<a.length;i++){n=clone(a[i]);n.id=uid();n.x=clamp(n.x+24,0,W-n.w);n.y=clamp(n.y+24,0,H-n.h);n.z=++S.z;S.items.push(n);added.push(n.id)}S.selectedIds=added;S.selected=added.length?added[added.length-1]:null;renderBoard();feedback('تم نسخ '+added.length+' عنصر')}''')
g=replace_func(g,'deleteSelected','moveZ',r'''function deleteSelected(){var a=selectionItems(),ids=[],i;if(!a.length)return;snapshot();for(i=0;i<a.length;i++)ids.push(a[i].id);S.items=S.items.filter(function(x){return idIn(ids,x.id)<0});S.selected=null;S.selectedIds=[];renderBoard();feedback('تم حذف '+a.length+' عنصر')}''')
g=replace_func(g,'moveZ','setSize',r'''function moveZ(d){var a=selectionItems(),i;if(!a.length)return;snapshot();for(i=0;i<a.length;i++)a[i].z=d>0?++S.z:Math.max(1,(a[i].z||1)-2);renderBoard();feedback(d>0?'تم تقديم العناصر المحددة':'تم إرسال العناصر المحددة للخلف')}''')
g=replace_func(g,'setSize','syncInspector',r'''function setSize(v){var a=selectionItems(),i,it,ratio;if(!a.length)return;snapshot();v=clamp(Number(v)||140,60,420);for(i=0;i<a.length;i++){it=a[i];ratio=it.h/Math.max(1,it.w);it.w=Math.min(v,W-it.x);it.h=Math.min(it.w*ratio,H-it.y)}renderBoard();feedback('تم تغيير حجم '+a.length+' عنصر')}''')
g=replace_func(g,'syncInspector','renderAssets',r'''function syncInspector(){var a=selectionItems(),it=selected(),name=el('gdSelectedName');if(name)name.textContent=a.length>1?('تم تحديد '+a.length+' عناصر — المحاذاة والحجم سيطبقان عليها معًا'):(it?(it.label||it.text||'عنصر'):'اختر عنصرًا من اللوحة');var role=el('gdRoleControls');if(!role)return;if(a.length>1){role.innerHTML='<small>لتعديل دور عنصر واحد داخل منطق اللعبة، أوقف التحديد المتعدد واختر العنصر منفردًا.</small>';var sz=el('gdSize');if(sz&&it)sz.value=Math.round(Math.max(it.w,it.h));return}if(!it){role.innerHTML='<small>بعد تحديد عنصر ستظهر هنا إعدادات دوره داخل اللعبة.</small>';return}var h='';if(S.type==='choice'||S.type==='mark'){h='<label class="gd-check"><input id="gdCorrect" type="checkbox" '+(it.correct?'checked':'')+'> '+(S.type==='choice'?'هذه إجابة صحيحة':'هذا عنصر مطلوب تحديده')+'</label>'}else if(S.type==='match'){h='<label>رقم الزوج<input id="gdPair" type="number" min="1" max="12" value="'+esc(it.pair||'')+'" placeholder="1"></label><small>ضع الرقم نفسه على العنصرين اللذين يمثلان زوجًا.</small>'}else if(S.type==='sort'){h='<label>مجموعة العنصر<select id="gdGroup"><option value="A" '+(it.group!=='B'?'selected':'')+'>'+esc(S.groupA)+'</option><option value="B" '+(it.group==='B'?'selected':'')+'>'+esc(S.groupB)+'</option></select></label>'}else if(S.type==='order'){h='<label>ترتيب العنصر<input id="gdOrder" type="number" min="1" max="20" value="'+esc(it.order||'')+'" placeholder="1"></label>'}role.innerHTML=h;var c=el('gdCorrect');if(c)c.onchange=function(){it.correct=!!this.checked;renderBoard()};var p=el('gdPair');if(p)p.onchange=function(){it.pair=this.value;renderBoard()};var gg=el('gdGroup');if(gg)gg.onchange=function(){it.group=this.value;renderBoard()};var o=el('gdOrder');if(o)o.onchange=function(){it.order=Number(this.value)||0;renderBoard()};var size=el('gdSize');if(size)size.value=Math.round(Math.max(it.w,it.h))}''')
# passive touch fix
g=g.replace("document.addEventListener('touchmove',dragMove,false)","document.addEventListener('touchmove',dragMove,root.App360TouchOptions||false)")
g=g.replace("document.addEventListener('touchend',dragEnd,false)","document.addEventListener('touchend',dragEnd,root.App360TouchOptions||false)")
# reset selection after blank board tap / load / new / open
g=g.replace("S.selected=null;renderBoard()}};document.addEventListener('mousemove'","S.selected=null;S.selectedIds=[];renderBoard()}};document.addEventListener('mousemove'",1)
g=g.replace("S.items=clone(d.items||[]);S.selected=null;S.z=10","S.items=clone(d.items||[]);S.selected=null;S.selectedIds=[];S.multiSelect=false;S.z=10",1)
g=g.replace("S.items=[];S.selected=null;S.history=[];syncMeta()","S.items=[];S.selected=null;S.selectedIds=[];S.multiSelect=false;S.history=[];syncMeta()",1)
g=g.replace("loadSaved();S.items=[];S.selected=null;S.history=[]","loadSaved();S.items=[];S.selected=null;S.selectedIds=[];S.multiSelect=false;S.history=[]",1)
old_export="root.App360GameDesigner={open:open,version:15,printCurrent:printGame,placeAssetAtClient:placeAssetAtClient,align:alignSelected,distribute:distributeAll,snap:snapAll,normalize:normalizeSizes,smartFinish:smartFinish,getData:function(){syncFromInputs();return gameDef()},loadData:applyDef};"
must(old_export,g,'game export')
new_export="root.App360GameDesigner={open:open,version:16,printCurrent:printGame,placeAssetAtClient:placeAssetAtClient,align:alignSelected,distribute:distributeAll,snap:snapAll,normalize:normalizeSizes,smartFinish:smartFinish,getData:function(){syncFromInputs();return gameDef()},loadData:applyDef,setMultiSelect:setMultiSelect,isMultiSelect:isMultiSelect,selectAll:selectAll,clearSelection:clearSelection,getSelectionCount:selectionCount,scaleSelection:scaleSelection};"
g=g.replace(old_export,new_export,1)
write(p,g)

# ---------- v16 UI enhancer / feedback / modern passive-touch detection ----------
v16_js=r'''(function(win){'use strict';
var touchOpt=false;
function noop(){}
try{var opt=Object.defineProperty({},'passive',{get:function(){touchOpt={passive:false}}});win.addEventListener('a360passive',noop,opt);win.removeEventListener('a360passive',noop,opt)}catch(e){touchOpt=false}
win.App360TouchOptions=touchOpt||false;
function el(id){return document.getElementById(id)}
function qa(sel,base){return Array.prototype.slice.call((base||document).querySelectorAll(sel)||[])}
function addClass(n,c){if(n&&(' '+n.className+' ').indexOf(' '+c+' ')<0)n.className=(n.className+' '+c).replace(/^\s+|\s+$/g,'')}
function removeClass(n,c){if(n)n.className=(' '+n.className+' ').replace(' '+c+' ',' ').replace(/^\s+|\s+$/g,'')}
function api(kind){return kind==='worksheet'?win.App360WorksheetDesigner:win.App360GameDesigner}
function panel(kind){return document.querySelector(kind==='worksheet'?'.wd9-panel':'.gd-panel')}
function settings(kind){return el(kind==='worksheet'?'wdSettingsDrawer':'gdSettings')}
function work(kind){var p=panel(kind);return p&&p.querySelector(kind==='worksheet'?'.wd-work':'.gd-work')}
function feedbackNode(){var n=el('v16DesignerFeedback');if(n)return n;n=document.createElement('div');n.id='v16DesignerFeedback';n.className='v16-feedback';n.setAttribute('role','status');n.setAttribute('aria-live','polite');var o=el('drawingOverlay');(o||document.body).appendChild(n);return n}
function feedback(kind,text){var n=feedbackNode();n.textContent=text;n.style.display='block';removeClass(n,'show');setTimeout(function(){addClass(n,'show')},1);clearTimeout(feedback.t);feedback.t=setTimeout(function(){removeClass(n,'show');setTimeout(function(){n.style.display='none'},180)},1600);try{if(navigator.vibrate)navigator.vibrate(10)}catch(e){}setTimeout(function(){refresh(kind)},0)}
win.App360DesignerFeedback=feedback;
function selectionHtml(kind){return'<div class="v16-selection-box" data-v16-selection="'+kind+'"><b>التحديد الجماعي</b><div class="v16-selection-actions"><button type="button" data-v16-multi>تحديد متعدد</button><button type="button" data-v16-all>تحديد الكل</button><button type="button" data-v16-clear>إلغاء التحديد</button></div><small data-v16-count>اختر عنصرين أو أكثر ليتم ترتيبها معًا.</small></div>'}
function mobileBarHtml(kind){return'<div class="v16-mobile-bar" data-v16-bar="'+kind+'"><span data-v16-mobile-count>لا يوجد عنصر محدد</span><button type="button" data-v16-smaller aria-label="تصغير العناصر">− تصغير</button><button type="button" data-v16-larger aria-label="تكبير العناصر">+ تكبير</button><button type="button" data-v16-mobile-multi>تحديد متعدد</button><button type="button" data-v16-mobile-clear>إلغاء</button></div>'}
function setButtonState(b,on,label){if(!b)return;b.textContent=(on?'✓ ':'')+label;if(on)addClass(b,'active');else removeClass(b,'active')}
function refresh(kind){var p=panel(kind),a=api(kind);if(!p||!a||!a.getSelectionCount)return;var count=a.getSelectionCount(),multi=a.isMultiSelect&&a.isMultiSelect(),countText=count?('المحدد حاليًا: '+count+' عنصر'):'لا يوجد عنصر محدد';qa('[data-v16-count]',p).forEach(function(n){n.textContent=count>=2?countText+' — أدوات المحاذاة والترتيب ستعمل على هذه المجموعة فقط.':countText+' — فعّل «تحديد متعدد» ثم المس العناصر المطلوبة.'});qa('[data-v16-mobile-count]',p).forEach(function(n){n.textContent=countText});qa('[data-v16-multi]',p).forEach(function(b){setButtonState(b,multi,'تحديد متعدد')});qa('[data-v16-mobile-multi]',p).forEach(function(b){setButtonState(b,multi,'متعدد')});var magic=p.querySelector('[data-v15-magic]');if(magic){var sm=magic.getElementsByTagName('small')[0];if(sm)sm.textContent=count>=2?('سيتم تحسين '+count+' عناصر محددة فقط: محاذاة ومسافات وتوزيع واضح.'):'اختر عنصرين أو أكثر لمعالجة المجموعة فقط؛ بدون مجموعة سيتم تحسين التصميم كاملًا.'}}
function bindSelectionControls(kind,scope){var a=api(kind);if(!a)return;qa('[data-v16-multi]',scope).forEach(function(b){b.onclick=function(){a.setMultiSelect(!a.isMultiSelect());refresh(kind)}});qa('[data-v16-all]',scope).forEach(function(b){b.onclick=function(){a.selectAll();refresh(kind)}});qa('[data-v16-clear]',scope).forEach(function(b){b.onclick=function(){a.clearSelection();refresh(kind)}});qa('[data-v16-mobile-multi]',scope).forEach(function(b){b.onclick=function(){a.setMultiSelect(!a.isMultiSelect());refresh(kind)}});qa('[data-v16-mobile-clear]',scope).forEach(function(b){b.onclick=function(){a.clearSelection();refresh(kind)}});qa('[data-v16-smaller]',scope).forEach(function(b){b.onclick=function(){a.scaleSelection(.9);refresh(kind)}});qa('[data-v16-larger]',scope).forEach(function(b){b.onclick=function(){a.scaleSelection(1.1);refresh(kind)}})}
function enhance(kind){var p=panel(kind),s=settings(kind),w=work(kind),a=api(kind);if(!p||!s||!w||!a||p.getAttribute('data-v16')==='1')return;p.setAttribute('data-v16','1');var assist=s.querySelector('[data-v15-assist]');if(assist){var box=document.createElement('div');box.innerHTML=selectionHtml(kind);assist.insertBefore(box.firstChild,assist.querySelector('[data-v15-magic]')||assist.firstChild)}var mb=document.createElement('div');mb.innerHTML=mobileBarHtml(kind);w.appendChild(mb.firstChild);bindSelectionControls(kind,p);refresh(kind);p.addEventListener('click',function(){setTimeout(function(){refresh(kind)},30)},false);p.addEventListener('touchend',function(){setTimeout(function(){refresh(kind)},40)},win.App360TouchOptions||false)}
function wrap(){var w=win.App360WorksheetDesigner,g=win.App360GameDesigner;if(w&&w.open&&!w._v16Wrapped){var ow=w.open;w.open=function(game){ow(game);setTimeout(function(){enhance('worksheet')},90)};w._v16Wrapped=true}if(g&&g.open&&!g._v16Wrapped){var og=g.open;g.open=function(){og();setTimeout(function(){enhance('game')},90)};g._v16Wrapped=true}}
wrap();
win.App360DesignerV16={enhance:enhance,refresh:refresh,feedback:feedback};
})(window);'''
write(APP/'designer-v16.js',v16_js)

# ---------- v16 CSS: mobile cards + touch ergonomics ----------
v16_css=r'''/* screen-to-move v16: mobile-first covers, modern touch ergonomics and multi-selection */
.game-cover-art{display:flex!important;align-items:center!important;justify-content:center!important;background:#f5fbfa!important}.game-cover{object-fit:contain!important;object-position:center!important;max-width:100%!important;max-height:100%!important;background:#fff;border-radius:10px}
@media(max-width:720px){
 .app-root{padding-left:8px!important;padding-right:8px!important}.compact-hero{margin:8px 0 10px!important;padding:12px!important;border-radius:16px!important}.compact-hero h2{font-size:20px!important;margin:4px 0!important}.compact-hero p{font-size:12px!important;line-height:1.55!important}.hero-mini{min-width:82px!important}
 .level-tabs{gap:6px!important;margin:8px 0!important}.level-tabs .chip{padding:7px 8px!important;min-height:54px!important}.level-tabs .chip b{font-size:11px!important}.level-tabs .chip small{font-size:9px!important}
 .library-head{padding:8px 4px!important}.library-head h2{font-size:18px!important}.library-head p{font-size:11px!important;line-height:1.5!important}
 .games-grid{display:flex!important;display:-webkit-flex!important;-webkit-flex-wrap:wrap!important;flex-wrap:wrap!important;gap:10px!important;align-items:stretch!important}
 .game-card{box-sizing:border-box!important;display:flex!important;display:-webkit-flex!important;-webkit-flex-direction:column!important;flex-direction:column!important;-webkit-flex:0 0 calc(50% - 5px)!important;flex:0 0 calc(50% - 5px)!important;width:calc(50% - 5px)!important;min-width:0!important;margin:0!important;border-radius:15px!important;box-shadow:0 3px 12px #17302f18!important;text-align:right!important}
 .game-cover-art{height:112px!important;min-height:112px!important;padding:6px!important;box-sizing:border-box!important;border-bottom:1px solid #e1ecea!important}.game-cover{width:100%!important;height:100%!important;object-fit:contain!important;border-radius:9px!important}
 .game-body{padding:8px 9px 9px!important;display:flex!important;display:-webkit-flex!important;-webkit-flex-direction:column!important;flex-direction:column!important;flex:1!important}.game-body>b{font-size:12px!important;line-height:1.45!important;min-height:35px!important;display:block!important}.game-body .meta{font-size:9px!important;gap:3px!important;margin:5px 0!important;white-space:normal!important}.play-now{font-size:10px!important;min-height:34px!important;padding:7px 5px!important;margin-top:auto!important;border-radius:9px!important;text-align:center!important}
 .library-designer-footer{margin-top:12px!important;border-radius:16px!important}.designer-invite-copy h3{font-size:17px!important}
}
@media(max-width:370px){.game-cover-art{height:100px!important;min-height:100px!important}.game-body{padding:7px!important}.game-body>b{font-size:11px!important}.play-now{font-size:9px!important}}
/* Coarse-touch controls: modern phones should be at least as easy as the legacy tablet. */
@media(max-width:980px){
 .wd-page,.gd-board,.wd-item,.gd-item{-webkit-user-select:none!important;user-select:none!important;-webkit-touch-callout:none!important;touch-action:none!important;-ms-touch-action:none!important}
 .wd-item>img,.gd-item>img{-webkit-user-drag:none!important;user-drag:none!important;pointer-events:none!important}
 .wd-item.selected,.gd-item.selected{outline:3px solid #0f8f8a!important;outline-offset:3px!important;box-shadow:0 0 0 5px #0f8f8a18!important}
 .wd-item.selected .wd-handle{display:block!important;width:32px!important;height:32px!important;bottom:-18px!important;border:3px solid #17302f!important;background:#ffd54f!important}.wd-item.selected .wd-handle-se{right:-18px!important}.wd-item.selected .wd-handle-sw{left:-18px!important}
 .gd-item.selected .gd-resize{display:block!important;width:32px!important;height:32px!important;left:-18px!important;bottom:-18px!important;border:3px solid #17302f!important;background:#ffd54f!important}
 .wd-item.v16-manipulating,.gd-item.v16-manipulating{outline-color:#ffd54f!important;box-shadow:0 0 0 7px #ffd54f33!important;will-change:left,top,width,height!important}
 .wd-paper-zone,.gd-board-wrap{overscroll-behavior:contain!important;-webkit-overflow-scrolling:touch!important;padding-bottom:74px!important}
 .v16-mobile-bar{display:flex!important;display:-webkit-flex!important;position:sticky!important;bottom:6px!important;z-index:85!important;align-items:center!important;gap:5px!important;flex-wrap:wrap!important;background:#17302ff2!important;color:#fff!important;border-radius:13px!important;padding:7px!important;margin:7px!important;box-shadow:0 5px 20px #0005!important}.v16-mobile-bar span{flex:1 1 100%!important;font-size:11px!important;font-weight:800!important;text-align:center!important}.v16-mobile-bar button{flex:1 1 22%!important;min-height:44px!important;border:1px solid #ffffff66!important;border-radius:9px!important;background:#fff!important;color:#17302f!important;font-weight:900!important;font-size:11px!important}.v16-mobile-bar button.active{background:#ffd54f!important;color:#3d3000!important;border-color:#ffd54f!important}
}
@media(min-width:981px){.v16-mobile-bar{display:none!important}}
.v16-selection-box{border:1px solid #93cbc5;background:#fff;border-radius:11px;padding:8px;margin:7px 0}.v16-selection-box>b{display:block;color:#17302f;margin-bottom:5px}.v16-selection-actions{display:flex;display:-webkit-flex;gap:5px;flex-wrap:wrap}.v16-selection-actions button{flex:1 1 30%;min-height:38px;border:1px solid #bdd8d4;background:#fff;border-radius:8px;font-weight:800;color:#17302f}.v16-selection-actions button.active{background:#0f8f8a;color:#fff;border-color:#0f8f8a}.v16-selection-box small{display:block;color:#55706d;font-size:10px;line-height:1.5;margin-top:5px}
.wd-item.selected:before,.gd-item.selected:before{content:'✓';position:absolute;top:-13px;right:-13px;z-index:20;width:25px;height:25px;line-height:25px;text-align:center;border-radius:50%;background:#0f8f8a;color:#fff;font:bold 14px Arial;box-shadow:0 2px 6px #0003}.wd-item.selected .wd-handle:before,.gd-item.selected .gd-resize:before{content:''}
.v16-feedback{display:none;position:fixed;z-index:2000040;left:50%;bottom:20px;max-width:min(88vw,520px);transform:translate(-50%,18px);opacity:0;background:#17302f;color:#fff;border:2px solid #ffd54f;border-radius:12px;padding:10px 14px;font:800 12px/1.5 Tahoma,Arial,sans-serif;text-align:center;box-shadow:0 8px 26px #0006;transition:opacity .16s ease,transform .16s ease;pointer-events:none}.v16-feedback.show{opacity:1;transform:translate(-50%,0)}
@media(max-width:980px){.v16-feedback{bottom:78px;font-size:11px}}
'''
write(APP/'v16.css',v16_css)

# ---------- mobile homepage image loading ----------
p=APP/'app.js'; a=read(p)
a=a.replace('<img class="game-cover" src="assets/game-covers/'+"'",'<img class="game-cover" loading="lazy" decoding="async" src="assets/game-covers/'+"'",1)
# Fallback if string concatenation pattern above did not match exactly.
if 'class="game-cover" loading="lazy"' not in a:
    a=a.replace('<img class="game-cover" src="assets/game-covers/','<img class="game-cover" loading="lazy" decoding="async" src="assets/game-covers/',1)
write(p,a)

# ---------- version wiring ----------
p=APP/'index.html'; idx=read(p).replace('?v=15','?v=16')
idx=idx.replace('<link rel="stylesheet" href="v15.css?v=16">','<link rel="stylesheet" href="v15.css?v=16">\n<link rel="stylesheet" href="v16.css?v=16">')
idx=idx.replace('<script src="designer-v15.js?v=16"></script>','<script src="designer-v15.js?v=16"></script>\n<script src="designer-v16.js?v=16"></script>')
write(p,idx)
p=APP/'manifest.webmanifest'; write(p,read(p).replace('?v=15','?v=16'))

p=APP/'sw.js'; sw=read(p).replace('screen-to-move-v15','screen-to-move-v16').replace('?v=15','?v=16')
if "'./v16.css?v=16'" not in sw:
    sw=sw.replace("'./v15.css?v=16'","'./v15.css?v=16','./v16.css?v=16','./designer-v16.js?v=16'")
write(p,sw)

p=APP/'app.json'; meta=json.loads(read(p));meta['version']=16;meta['implementation']['state']='live-v16-mobile-touch-multiselect-feedback-and-card-layout';features=meta['implementation'].setdefault('features',[])
for f in [
'mobile library cards use compact two-column covers with contain-fit artwork and clearer touch targets',
'modern mobile designers explicitly opt out of passive root touchmove while manipulating items',
'large touch resize handles and immediate visual plus status feedback on phone and tablet',
'multi-selection mode with select-all clear-selection and visible selected-item count',
'alignment distribution grid snapping size normalization and smart finish operate on the selected group when two or more items are selected',
'mobile quick manipulation bar provides group size increase decrease and multi-selection without reopening settings',
'smart finish visibly arranges a selected group into a balanced layout while preserving its local design region'
]:
    if f not in features: features.append(f)
write(p,json.dumps(meta,ensure_ascii=False,indent=2)+'\n')

p=APP/'package.json'; pkg=json.loads(read(p));pkg['version']='0.16.0';pkg['description']='ألعاب إبداعية عبر الشاشة أو بدون الشاشة: 170 لعبة ومصممان مع لمس حديث وتحديد متعدد ومحاذاة ذكية - App 360 Lab';pkg['scripts']['validate']=pkg['scripts']['validate'].replace('node --check designer-v15.js','node --check designer-v15.js && node --check designer-v16.js');write(p,json.dumps(pkg,ensure_ascii=False,indent=2)+'\n')

# ---------- tests: move asset query expectations to v16 and add regressions ----------
p=APP/'app.test.js'; t=read(p)
t=t.replace('?v=15','?v=16').replace('screen-to-move-v15','screen-to-move-v16')
if "v16 mobile library makes game covers readable without cropping" not in t:
    t+=r'''

test('v16 mobile library makes game covers readable without cropping',()=>{const css=fs.readFileSync('./v16.css','utf8'),js=fs.readFileSync('./app.js','utf8');assert.match(css,/@media\(max-width:720px\)/);assert.match(css,/game-card[^}]*calc\(50% - 5px\)/s);assert.match(css,/game-cover[^}]*object-fit:contain/s);assert.match(js,/game-cover[^>]*loading="lazy"/);});
test('v16 modern mobile touch manipulation explicitly uses non-passive document touch listeners',()=>{const wd=fs.readFileSync('./designer-v9.js','utf8'),gd=fs.readFileSync('./game-designer-v10.js','utf8'),ui=fs.readFileSync('./designer-v16.js','utf8');assert.match(wd,/touchmove',dragMove,root\.App360TouchOptions/);assert.match(gd,/touchmove',dragMove,root\.App360TouchOptions/);assert.match(ui,/passive:false/);assert.doesNotMatch(ui,/=>|\bconst\b|\blet\b|`/);});
test('v16 both designers support explicit multi-selection and group-aware creative tools',()=>{const wd=fs.readFileSync('./designer-v9.js','utf8'),gd=fs.readFileSync('./game-designer-v10.js','utf8'),ui=fs.readFileSync('./designer-v16.js','utf8');for(const src of [wd,gd]){assert.match(src,/selectedIds/);assert.match(src,/setMultiSelect/);assert.match(src,/selectAll/);assert.match(src,/selectionItems/);assert.match(src,/scaleSelection/)}assert.match(ui,/تحديد متعدد/);assert.match(ui,/تحديد الكل/);assert.match(ui,/المحدد حاليًا/);});
test('v16 selection gives immediate visible feedback and larger phone handles',()=>{const css=fs.readFileSync('./v16.css','utf8'),ui=fs.readFileSync('./designer-v16.js','utf8'),wd=fs.readFileSync('./designer-v9.js','utf8');assert.match(css,/wd-item\.selected \.wd-handle[^}]*width:32px/s);assert.match(css,/v16-feedback/);assert.match(ui,/App360DesignerFeedback/);assert.match(wd,/تم تحديد العنصر/);});
test('v16 smart finish uses selected groups and provides a quick mobile manipulation bar',()=>{const wd=fs.readFileSync('./designer-v9.js','utf8'),gd=fs.readFileSync('./game-designer-v10.js','utf8'),ui=fs.readFileSync('./designer-v16.js','utf8');assert.match(wd,/chosen\.length>=2\?chosen:state\.items/);assert.match(gd,/chosen\.length>=2\?chosen:S\.items/);assert.match(ui,/v16-mobile-bar/);assert.match(ui,/data-v16-smaller/);assert.match(ui,/data-v16-larger/);});
test('v16 assets are versioned and cached offline',()=>{const html=fs.readFileSync('./index.html','utf8'),sw=fs.readFileSync('./sw.js','utf8');assert.match(html,/v16\.css\?v=16/);assert.match(html,/designer-v16\.js\?v=16/);assert.match(sw,/screen-to-move-v16/);assert.match(sw,/designer-v16\.js\?v=16/);});
'''
write(p,t)
print('v16 prepared')
