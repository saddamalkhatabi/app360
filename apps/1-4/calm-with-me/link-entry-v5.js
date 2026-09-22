(function(w,d){
'use strict';
function go(){w.location.href='link-plan.html?v=5'}
function init(){var nav=d.getElementById('nav-transition'),btn=d.getElementById('goTransitionBtn'),view=d.getElementById('childView'),box;if(nav){nav.removeAttribute('data-view');nav.innerHTML='الخطة';nav.onclick=go}if(btn){btn.innerHTML='افتح خطة التطبيقات والروابط';btn.onclick=go}if(view&&!d.getElementById('lpEntryCard')){box=d.createElement('section');box.id='lpEntryCard';box.className='practice-block accent-block';box.innerHTML='<span class="step-kicker">مسار سريع</span><h2 style="margin:4px 0 8px">نفّذ خطة تطبيقات بروابط ووقت محدد</h2><p style="margin:0 0 12px">يمكنك الدخول مباشرة إلى خطة جاهزة فيها تطبيقات الفئة 1-4 والريلز الآمن 360، وتحديد مدة كل خطوة ثم تشغيلها بالتتابع.</p><button id="lpEntryButton" class="primary huge" type="button" style="width:100%">افتح خطة التطبيقات والروابط ←</button>';view.insertBefore(box,view.firstChild);d.getElementById('lpEntryButton').onclick=go}}
if(d.readyState==='loading'){if(d.addEventListener)d.addEventListener('DOMContentLoaded',init,false);else w.attachEvent&&w.attachEvent('onload',init)}else init();
})(window,document);
