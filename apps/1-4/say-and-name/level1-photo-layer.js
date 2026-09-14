(function(){
'use strict';
var LEVELS=window.APP360_LEVELS||{};
var EN=window.APP360_EN||{words:{}};
var SEP='\u0001';
var levelOne={};
var rows=LEVELS['1']||LEVELS[1]||[];
for(var i=0;i<rows.length;i++){
  var parts=String(rows[i][2]||'').split('|');
  for(var j=0;j<parts.length;j++){var w=parts[j].replace(/^\s+|\s+$/g,'');if(w)levelOne[w]=1;}
}
var enForAr={},arForEn={};
try{
  var ew=EN.words||{};
  for(var k in ew){
    if(!Object.prototype.hasOwnProperty.call(ew,k))continue;
    var p=String(k).split(SEP),ar=p[p.length-1],en=String(ew[k]||'').trim();
    if(levelOne[ar]&&en&&!enForAr[ar])enForAr[ar]=en;
    if(levelOne[ar]&&en&&!arForEn[en.toLowerCase()])arForEn[en.toLowerCase()]=ar;
  }
}catch(e){}

/*
 * Local, designed family contact sheet.
 * The sprite is 5 columns × 2 rows. Every coordinate below is deliberately
 * mapped to one level-one word so a child never sees a random internet image.
 */
var familySprite={
  'أم':[0,0],'أب':[1,0],'طفل':[2,0],'ولد':[3,0],'بنت':[4,0],
  'أخ':[0,1],'أخت':[1,1],'جد':[2,1],'جدة':[3,1],'عائلة':[4,1]
};
var transparent='data:image/svg+xml;charset=utf-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="1" height="1" viewBox="0 0 1 1"><rect width="1" height="1" fill="transparent"/></svg>');

var colors={'أحمر':'#ef4444','أزرق':'#3b82f6','أصفر':'#facc15','أخضر':'#22c55e','أبيض':'#ffffff','أسود':'#111827'};
function svgUri(body,bg){
  var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><rect width="640" height="640" rx="52" fill="'+(bg||'#f8fbfb')+'"/>'+body+'</svg>';
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
function specialVisual(ar){
  if(colors[ar]){
    var c=colors[ar],stroke=ar==='أبيض'?'#9ca3af':'#ffffff';
    return svgUri('<defs><radialGradient id="g" cx="35%" cy="28%"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".25" stop-color="'+c+'"/><stop offset="1" stop-color="'+c+'"/></radialGradient></defs><circle cx="320" cy="320" r="205" fill="url(#g)" stroke="'+stroke+'" stroke-width="10"/>','#eef4f5');
  }
  if(ar==='دائرة')return svgUri('<circle cx="320" cy="320" r="205" fill="#62c8bd" stroke="#17343a" stroke-width="12"/>');
  if(ar==='مربع')return svgUri('<rect x="120" y="120" width="400" height="400" rx="18" fill="#f2c84b" stroke="#17343a" stroke-width="12"/>');
  if(ar==='مثلث')return svgUri('<path d="M320 90L555 525H85Z" fill="#f59e0b" stroke="#17343a" stroke-width="12"/>');
  if(ar==='نجمة')return svgUri('<path d="M320 75l58 150 160 9-124 102 42 155-136-86-136 86 42-155-124-102 160-9z" fill="#facc15" stroke="#17343a" stroke-width="10"/>');
  if(ar==='قلب')return svgUri('<path d="M320 520C125 395 95 275 165 205c60-60 132-27 155 30 23-57 95-90 155-30 70 70 40 190-155 315z" fill="#ef4444" stroke="#9f1239" stroke-width="10"/>');
  return '';
}
function resolveAr(label){
  label=String(label||'').trim();
  if(levelOne[label])return label;
  return arForEn[label.toLowerCase()]||'';
}
function clearSprite(img){
  img.classList.remove('level1-sprite-photo');
  img.style.backgroundImage='';
  img.style.backgroundPosition='';
  img.style.backgroundSize='';
  img.style.backgroundRepeat='';
  delete img.dataset.familySprite;
}
function rememberFallback(img){
  var current=img.getAttribute('src')||'';
  if(current&&current.indexOf('loremflickr.com')<0&&current!==transparent)img.dataset.fallbackSrc=current;
}
function restoreFallback(img){
  var fb=img.dataset.fallbackSrc||'';
  clearSprite(img);
  img.classList.remove('level1-real-photo');
  delete img.dataset.photoWord;
  img.onerror=null;
  if(fb&&img.getAttribute('src')!==fb)img.setAttribute('src',fb);
}
function applyFamilySprite(img,ar){
  var pos=familySprite[ar],b64=window.APP360_FAMILY_SPRITE_B64||'';
  if(!pos||!b64)return false;
  if(img.dataset.photoWord===ar&&img.dataset.familySprite==='1')return true;
  rememberFallback(img);
  var x=pos[0]*25,y=pos[1]*100;
  img.dataset.photoWord=ar;
  img.dataset.familySprite='1';
  img.classList.add('level1-real-photo','level1-sprite-photo');
  img.onerror=null;
  img.style.backgroundImage='url("data:image/webp;base64,'+b64+'")';
  img.style.backgroundRepeat='no-repeat';
  img.style.backgroundSize='500% 200%';
  img.style.backgroundPosition=x+'% '+y+'%';
  if(img.getAttribute('src')!==transparent)img.setAttribute('src',transparent);
  return true;
}
function applySpecial(img,ar,url){
  if(!url)return false;
  if(img.dataset.photoWord===ar&&img.getAttribute('src')===url&&!img.dataset.familySprite)return true;
  rememberFallback(img);
  clearSprite(img);
  img.dataset.photoWord=ar;
  img.classList.add('level1-real-photo');
  img.onerror=function(){restoreFallback(this);};
  img.setAttribute('src',url);
  return true;
}
function applyImage(img,label){
  if(!img)return;
  var ar=resolveAr(label);
  if(!ar){restoreFallback(img);return;}
  if(familySprite[ar]&&applyFamilySprite(img,ar))return;
  var local=specialVisual(ar);
  if(local&&applySpecial(img,ar,local))return;
  /* No web-photo fallback: until a word has a reviewed designed image,
     keep the app's original local visual rather than showing random content. */
  restoreFallback(img);
}
var busy=false;
function applyAll(){
  busy=false;
  var main=document.getElementById('itemImage');
  if(main)applyImage(main,main.getAttribute('alt')||((document.getElementById('itemName')||{}).textContent||''));
  var cards=document.querySelectorAll('#thumbGrid .thumb-card');
  for(var i=0;i<cards.length;i++){
    var strong=cards[i].querySelector('strong'),img=cards[i].querySelector('img');
    if(img&&strong){img.setAttribute('loading','lazy');applyImage(img,strong.textContent);}
  }
}
function schedule(){
  if(busy)return;
  busy=true;
  (window.requestAnimationFrame||function(fn){setTimeout(fn,16)})(applyAll);
}
try{
  var st=document.createElement('style');
  st.textContent='.picture-button img.level1-real-photo{display:block;width:min(100%,470px);aspect-ratio:1/1;height:auto;max-height:430px;object-fit:cover;background:#fff;border-radius:28px;box-shadow:0 12px 28px rgba(15,143,138,.12)}.thumb-card img.level1-real-photo{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:14px;background:#eef8f7}.picture-button img.level1-sprite-photo,.thumb-card img.level1-sprite-photo{object-fit:contain;background-color:#fff;background-repeat:no-repeat}@media(max-width:760px){.picture-button img.level1-real-photo{width:min(100%,340px);max-height:340px}}@media(max-width:430px){.picture-button img.level1-real-photo{width:min(100%,275px);max-height:275px}}';
  document.head.appendChild(st);
}catch(e){}
var obs=new MutationObserver(schedule),main=document.getElementById('itemImage'),name=document.getElementById('itemName'),grid=document.getElementById('thumbGrid');
if(main)obs.observe(main,{attributes:true,attributeFilter:['src','alt']});
if(name)obs.observe(name,{subtree:true,childList:true,characterData:true});
if(grid)obs.observe(grid,{subtree:true,childList:true});
window.addEventListener('load',schedule);
schedule();
})();
