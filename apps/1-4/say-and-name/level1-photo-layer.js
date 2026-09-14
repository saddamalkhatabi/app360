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
  for(var k in ew){if(!Object.prototype.hasOwnProperty.call(ew,k))continue;var p=String(k).split(SEP),ar=p[p.length-1],en=String(ew[k]||'').trim();if(levelOne[ar]&&en&&!enForAr[ar])enForAr[ar]=en;if(levelOne[ar]&&en&&!arForEn[en.toLowerCase()])arForEn[en.toLowerCase()]=ar;}
}catch(e){}
var tags={
'أم':'mother portrait','أب':'father portrait','طفل':'toddler child','ولد':'young boy','بنت':'young girl','أخ':'brother siblings boy','أخت':'sister siblings girl','جد':'grandfather elderly man','جدة':'grandmother elderly woman','عائلة':'happy family',
'رأس':'human head','شعر':'human hair','وجه':'human face','عين':'human eye closeup','أنف':'human nose','فم':'human mouth','أذن':'human ear','أسنان':'teeth smile','لسان':'human tongue','يد':'human hand','إصبع':'human finger','قدم':'human foot','بطن':'human belly','ظهر':'human back',
'قميص':'shirt clothing','بنطال':'pants trousers','فستان':'dress clothing','حذاء':'shoe footwear','جورب':'sock clothing','قبعة':'hat cap','جاكيت':'jacket clothing',
'سرير':'bed bedroom','وسادة':'pillow','بطانية':'blanket','لعبة':'child toy','دمية':'doll toy','كرة':'ball toy','كتاب':'book','كرسي':'chair','طاولة':'table','صندوق':'box cardboard','باب':'door','نافذة':'window','مصباح':'lamp',
'بيت':'house','غرفة':'room interior','مطبخ':'kitchen interior','حمام':'bathroom interior','صالة':'living room','درج':'stairs staircase','مفتاح':'key','جدار':'wall','أرض':'floor wooden','سقف':'ceiling',
'كوب':'cup mug','كأس':'drinking glass','طبق':'plate dish','ملعقة':'spoon','شوكة':'fork','سكين':'kitchen knife','قدر':'cooking pot','إبريق':'kettle teapot','زجاجة':'bottle','ثلاجة':'refrigerator fridge',
'ماء':'glass water','صابون':'soap bar','منشفة':'towel','فرشاة':'brush','معجون':'toothpaste tube','مرآة':'mirror',
'خبز':'bread','أرز':'rice bowl','بيض':'egg','جبن':'cheese','حليب':'milk glass','عصير':'juice glass','كعك':'cake','بسكويت':'cookies biscuits','شوربة':'soup bowl',
'تفاح':'red apple','موز':'banana','برتقال':'orange fruit','عنب':'grapes','فراولة':'strawberry','بطيخ':'watermelon','مانجو':'mango fruit','تمر':'dates fruit',
'طماطم':'tomato','بطاطس':'potato','جزر':'carrot','خيار':'cucumber','بصل':'onion','خس':'lettuce','فلفل':'bell pepper',
'قطة':'cat','كلب':'dog','طائر':'bird','سمكة':'fish','أرنب':'rabbit','دجاجة':'hen chicken','بقرة':'cow','حصان':'horse','خروف':'sheep','ماعز':'goat','أسد':'lion','فيل':'elephant','قرد':'monkey',
'نملة':'ant macro','نحلة':'bee macro','فراشة':'butterfly',
'سيارة':'car','حافلة':'bus','شاحنة':'truck','دراجة':'bicycle','قطار':'train','طائرة':'airplane','سفينة':'ship','قارب':'boat',
'شمس':'sun sky','قمر':'moon night','نجم':'star night sky','سماء':'blue sky','سحابة':'cloud sky','مطر':'rain','شجرة':'tree','زهرة':'flower','عشب':'grass','حجر':'stone rock','بحر':'sea ocean',
'مكعب':'toy cube block','بالون':'balloon','أحجية':'jigsaw puzzle','طبلة':'drum toy','هاتف':'smartphone','ساعة':'clock watch','حقيبة':'bag','قلم':'pen','ورقة':'white paper sheet','صورة':'photograph frame','مظلة':'umbrella','نظارة':'eyeglasses'
};
var colors={'أحمر':'#ef4444','أزرق':'#3b82f6','أصفر':'#facc15','أخضر':'#22c55e','أبيض':'#ffffff','أسود':'#111827'};
function svgUri(body,bg){var svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><rect width="640" height="640" rx="52" fill="'+(bg||'#f8fbfb')+'"/>'+body+'</svg>';return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);}
function specialVisual(ar){
  if(colors[ar]){var c=colors[ar],stroke=ar==='أبيض'?'#9ca3af':'#ffffff';return svgUri('<defs><radialGradient id="g" cx="35%" cy="28%"><stop offset="0" stop-color="#fff" stop-opacity=".75"/><stop offset=".25" stop-color="'+c+'"/><stop offset="1" stop-color="'+c+'"/></radialGradient></defs><circle cx="320" cy="320" r="205" fill="url(#g)" stroke="'+stroke+'" stroke-width="10"/>','#eef4f5');}
  if(ar==='دائرة')return svgUri('<circle cx="320" cy="320" r="205" fill="#62c8bd" stroke="#17343a" stroke-width="12"/>');
  if(ar==='مربع')return svgUri('<rect x="120" y="120" width="400" height="400" rx="18" fill="#f2c84b" stroke="#17343a" stroke-width="12"/>');
  if(ar==='مثلث')return svgUri('<path d="M320 90L555 525H85Z" fill="#f59e0b" stroke="#17343a" stroke-width="12"/>');
  if(ar==='نجمة')return svgUri('<path d="M320 75l58 150 160 9-124 102 42 155-136-86-136 86 42-155-124-102 160-9z" fill="#facc15" stroke="#17343a" stroke-width="10"/>');
  if(ar==='قلب')return svgUri('<path d="M320 520C125 395 95 275 165 205c60-60 132-27 155 30 23-57 95-90 155-30 70 70 40 190-155 315z" fill="#ef4444" stroke="#9f1239" stroke-width="10"/>');
  return '';
}
function hash(s){var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h+=(h<<1)+(h<<4)+(h<<7)+(h<<8)+(h<<24);}return Math.abs(h>>>0)%9999+1;}
function photoUrl(ar){var special=specialVisual(ar);if(special)return special;var q=tags[ar]||enForAr[ar]||ar;return 'https://loremflickr.com/640/640/'+encodeURIComponent(q.replace(/\s+/g,','))+'?lock='+hash(ar);}
function resolveAr(label){label=String(label||'').trim();if(levelOne[label])return label;return arForEn[label.toLowerCase()]||'';}
function applyImage(img,label){
  if(!img)return;var ar=resolveAr(label);if(!ar){img.classList.remove('level1-real-photo');return;}
  var url=photoUrl(ar);if(img.dataset.photoWord===ar&&img.getAttribute('src')===url)return;
  if(!img.dataset.fallbackSrc||img.dataset.fallbackSrc.indexOf('loremflickr.com')>=0)img.dataset.fallbackSrc=img.getAttribute('src')||'';
  img.dataset.photoWord=ar;img.classList.add('level1-real-photo');img.onerror=function(){var fb=this.dataset.fallbackSrc;if(fb&&this.getAttribute('src')!==fb){this.onerror=null;this.setAttribute('src',fb);this.classList.remove('level1-real-photo');}};img.setAttribute('src',url);
}
var busy=false;
function applyAll(){busy=false;var main=document.getElementById('itemImage');if(main)applyImage(main,main.getAttribute('alt')||((document.getElementById('itemName')||{}).textContent||''));var cards=document.querySelectorAll('#thumbGrid .thumb-card');for(var i=0;i<cards.length;i++){var strong=cards[i].querySelector('strong'),img=cards[i].querySelector('img');if(img&&strong){img.setAttribute('loading','lazy');applyImage(img,strong.textContent);}}}
function schedule(){if(busy)return;busy=true;(window.requestAnimationFrame||function(fn){setTimeout(fn,16)})(applyAll);}
try{var st=document.createElement('style');st.textContent='.picture-button img.level1-real-photo{display:block;width:min(100%,470px);aspect-ratio:1/1;height:auto;max-height:430px;object-fit:cover;background:#fff;border-radius:28px;box-shadow:0 12px 28px rgba(15,143,138,.12)}.thumb-card img.level1-real-photo{display:block;width:100%;aspect-ratio:1/1;object-fit:cover;border-radius:14px;background:#eef8f7}@media(max-width:760px){.picture-button img.level1-real-photo{width:min(100%,340px);max-height:340px}}@media(max-width:430px){.picture-button img.level1-real-photo{width:min(100%,275px);max-height:275px}}';document.head.appendChild(st);}catch(e){}
var obs=new MutationObserver(schedule),main=document.getElementById('itemImage'),name=document.getElementById('itemName'),grid=document.getElementById('thumbGrid');if(main)obs.observe(main,{attributes:true,attributeFilter:['src','alt']});if(name)obs.observe(name,{subtree:true,childList:true,characterData:true});if(grid)obs.observe(grid,{subtree:true,childList:true});window.addEventListener('load',schedule);schedule();
})();
