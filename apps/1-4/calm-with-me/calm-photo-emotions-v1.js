(function(w){
'use strict';
/* Four human-readable photographic emotion cards. This is intentionally limited
 * to verified photos; the remaining emotion/help/transition drawings still
 * require separate semantic image review. ES5 and offline-friendly paths. */
var C=w.APP360_CALM_CONTENT;
if(!C||!C.feelings)return;
var photos={happy:1,sad:1,afraid:1,angry:1};
var dir='assets/images/emotions/',updated=0;
for(var i=0;i<C.feelings.length;i++){
 var item=C.feelings[i],id=item&&item.id;
 if(!photos[id])continue;
 item.photoFallback=item.image||'';
 item.image=dir+id+'-512.webp';
 item.imageSrcSet=dir+id+'-320.webp 320w, '+dir+id+'-512.webp 512w';
 item.imageSizes='(max-width: 470px) 44vw, 205px';
 updated++;
}
w.APP360_CALM_PHOTO_EMOTIONS={version:1,updated:updated,ids:['happy','sad','afraid','angry']};
})(window);
