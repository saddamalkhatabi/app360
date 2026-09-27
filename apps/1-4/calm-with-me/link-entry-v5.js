(function(w,d){
'use strict';
function go(){w.location.href='../plan-runner-360/index.html?v=2&from=a1-calm'}
function init(){var nav=d.getElementById('nav-transition'),btn=d.getElementById('goTransitionBtn'),view=d.getElementById('childView'),box;if(nav){nav.removeAttribute('data-view');nav.innerHTML='الخطة';nav.onclick=go}if(btn){btn.innerHTML='افتح مخطط التشغيل 360';btn.onclick=go}if(view&&!d.getElementById('lpEntryCard')){box=d.createElement('section');box.id='lpEntryCard';box.className='practice-block accent-block';box.innerHTML='<span class="step-kicker">مسار موحد</span><h2 style="margin:4px 0 8px">ابنِ خطة تطبيقات أو جلسة لعب مستجيبة</h2><p style="margin:0 0 12px">مخطط التشغيل 360 يجمع تطبيقات الفئة 1–4 في تسلسل واحد، ويضيف جلسة مستجيبة للمرافق مع تذكير واحد والعودة السريعة للعب الواقعي.</p><button id="lpEntryButton" class="primary huge" type="button" style="width:100%">افتح مخطط التشغيل 360 ←</button>';view.insertBefore(box,view.firstChild);d.getElementById('lpEntryButton').onclick=go}}
if(d.readyState==='loading'){if(d.addEventListener)d.addEventListener('DOMContentLoaded',init,false);else w.attachEvent&&w.attachEvent('onload',init)}else init();
})(window,document);
