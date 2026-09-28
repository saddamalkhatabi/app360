(function(w,d){'use strict';
var tries=0;
function inject(){
 if(d.getElementById('tangramQuickLaunch'))return;
 var host=d.getElementById('homeShowcase'),intro=host&&host.querySelector?host.querySelector('.showcase-intro'):null;
 if(!host||!intro){if(tries++<30)setTimeout(inject,150);return}
 var a=d.createElement('a');
 a.id='tangramQuickLaunch';
 a.href='apps/1-4/tangram-builder/index.html?v=13';
 a.setAttribute('aria-label','فتح تانغرامي الصغير');
 a.style.cssText='display:flex;align-items:center;gap:14px;max-width:760px;margin:10px auto 16px;padding:10px 14px;border:2px solid #d59735;border-radius:18px;background:#fff7e5;color:#5d3516;text-decoration:none;box-shadow:0 8px 22px rgba(87,47,16,.16);box-sizing:border-box;';
 a.innerHTML='<img src="assets/covers/a1-tangram.svg?v=13" alt="" style="width:126px;height:74px;object-fit:cover;border-radius:12px;border:1px solid #ddb778;flex:0 0 auto"><span style="display:block;min-width:0"><b style="display:block;font-size:18px;margin-bottom:4px">تانغرامي الصغير: 200 مرحلة</b><span style="display:block;font-size:12px;line-height:1.6">تمييز واضح لأحجام القطع المتشابهة • مطابقة دقيقة من 20% • شاشة واحدة للعب</span></span><span style="margin-right:auto;font-size:26px">←</span>';
 if(intro.nextSibling)intro.parentNode.insertBefore(a,intro.nextSibling);else intro.parentNode.appendChild(a);
}
if(d.readyState==='loading'){if(d.addEventListener)d.addEventListener('DOMContentLoaded',inject,false);else w.attachEvent&&w.attachEvent('onload',inject)}else inject();
})(window,document);