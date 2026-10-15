/* Local modal fallback for the isolated vocabulary test page. */
(function(){
'use strict';
if(window.Swal)return;
window.Swal={fire:function(options){return new Promise(function(resolve){
var previous=document.activeElement,overlay=document.createElement('div');
overlay.style.cssText='position:fixed;inset:0;z-index:9999;background:rgba(15,35,40,.5);display:flex;align-items:center;justify-content:center;padding:12px';
var popup=document.createElement('div');popup.className='swal2-popup '+(options.customClass&&options.customClass.popup||'');popup.style.cssText='background:white;border-radius:22px;padding:20px;max-width:640px;width:100%;max-height:90vh;overflow:auto;color:#17343a';popup.setAttribute('role','dialog');popup.setAttribute('aria-modal','true');popup.setAttribute('aria-labelledby','previewDialogTitle');
var title=document.createElement('h2');title.id='previewDialogTitle';title.textContent=options.title||'';popup.appendChild(title);
var body=document.createElement('div');if(options.html)body.innerHTML=options.html;else body.textContent=options.text||'';popup.appendChild(body);
var footer=document.createElement('div');footer.style.cssText='display:flex;gap:10px;margin-top:18px;flex-wrap:wrap';
function finish(result){document.removeEventListener('keydown',key);overlay.remove();if(previous&&previous.focus)previous.focus();resolve(result)}
function add(label,result){var b=document.createElement('button');b.type='button';b.textContent=label;b.style.cssText='padding:12px 18px;border:0;border-radius:12px;background:#087f78;color:white;font:inherit;cursor:pointer';b.onclick=function(){finish(result)};footer.appendChild(b);return b}
var confirm=add(options.confirmButtonText||(document.documentElement.lang==='en'?'Done':'تم'),{isConfirmed:true});if(options.showDenyButton)add(options.denyButtonText||'السابق',{isDenied:true});if(options.showCloseButton||options.showCancelButton)add(options.cancelButtonText||(document.documentElement.lang==='en'?'Close':'إغلاق'),{isDismissed:true});
function key(e){if(e.key==='Escape'){e.preventDefault();finish({isDismissed:true})}else if(e.key==='Tab'){var a=popup.querySelectorAll('button,input,select,[tabindex="0"]');if(!a.length)return;var first=a[0],last=a[a.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus()}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus()}}}
popup.appendChild(footer);overlay.appendChild(popup);document.body.appendChild(overlay);document.addEventListener('keydown',key);if(options.didOpen)options.didOpen();confirm.focus();
})}};
})();
