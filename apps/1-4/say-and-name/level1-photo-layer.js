(function(){
'use strict';
var EN=window.APP360_EN||{words:{}};
var SEP='\u0001';
var BASE='assets/word-images/';
var arForEn={};
var busy=false;
try{
  var ew=EN.words||{};
  for(var k in ew){
    if(!Object.prototype.hasOwnProperty.call(ew,k))continue;
    var parts=String(k).split(SEP),ar=parts[parts.length-1],en=String(ew[k]||'').trim();
    if(ar&&en&&!arForEn[en.toLowerCase()])arForEn[en.toLowerCase()]=ar;
  }
}catch(e){}
function map(){return window.APP360_WORD_IMAGE_MAP||{}}
function resolveAr(label){
  var m=map(); label=String(label||'').trim();
  if(m[label])return label;
  return arForEn[label.toLowerCase()]||'';
}
function rememberFallback(img){
  var src=img.getAttribute('src')||'';
  if(src&&src.indexOf(BASE)<0&&!img.dataset.wordFallback)img.dataset.wordFallback=src;
}
function restore(img){
  var fb=img.dataset.wordFallback||'';
  delete img.dataset.wordImage;
  img.classList.remove('app360-word-photo');
  img.onerror=null;
  if(fb&&img.getAttribute('src')!==fb)img.setAttribute('src',fb);
}
function apply(img,label){
  if(!img)return;
  var m=map(),ar=resolveAr(label),file=ar&&m[ar];
  if(!file){restore(img);return;}
  var url=BASE+file;
  if(img.dataset.wordImage===ar&&img.getAttribute('src')===url)return;
  rememberFallback(img);
  img.dataset.wordImage=ar;
  img.classList.add('app360-word-photo');
  img.onerror=function(){restore(this)};
  img.setAttribute('src',url);
}
function applyAll(){
  busy=false;
  var main=document.getElementById('itemImage');
  if(main)apply(main,main.getAttribute('alt')||((document.getElementById('itemName')||{}).textContent||''));
  var cards=document.querySelectorAll('#thumbGrid .thumb-card');
  for(var i=0;i<cards.length;i++){
    var strong=cards[i].querySelector('strong'),img=cards[i].querySelector('img');
    if(img&&strong){img.setAttribute('loading','lazy');apply(img,strong.textContent)}
  }
}
function schedule(){
  if(busy)return;busy=true;
  (window.requestAnimationFrame||function(fn){setTimeout(fn,16)})(applyAll);
}
function start(){
  try{
    var st=document.createElement('style');
    st.textContent='.picture-button img.app360-word-photo{display:block;width:min(100%,470px);aspect-ratio:1/1;height:auto;max-height:430px;object-fit:contain;background:#f4fafc;border-radius:28px;box-shadow:0 12px 28px rgba(15,143,138,.12)}.thumb-card img.app360-word-photo{display:block;width:100%;aspect-ratio:1/1;object-fit:contain;border-radius:14px;background:#f4fafc}@media(max-width:760px){.picture-button img.app360-word-photo{width:min(100%,340px);max-height:340px}}@media(max-width:430px){.picture-button img.app360-word-photo{width:min(100%,275px);max-height:275px}}';
    document.head.appendChild(st);
  }catch(e){}
  var obs=new MutationObserver(schedule),main=document.getElementById('itemImage'),name=document.getElementById('itemName'),grid=document.getElementById('thumbGrid');
  if(main)obs.observe(main,{attributes:true,attributeFilter:['src','alt']});
  if(name)obs.observe(name,{subtree:true,childList:true,characterData:true});
  if(grid)obs.observe(grid,{subtree:true,childList:true});
  window.addEventListener('load',schedule);
  schedule();
}
function loadMapAndStart(){
  if(window.APP360_WORD_IMAGE_MAP){start();return;}
  var s=document.createElement('script');
  s.src='data/word-images-map.js?v=14';
  s.onload=start;
  s.onerror=start; // keep the old generated SVGs working until the image bundle is installed.
  document.head.appendChild(s);
}
loadMapAndStart();
})();
