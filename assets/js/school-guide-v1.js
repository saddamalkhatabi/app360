(function(w,d){
'use strict';
// A non-modal, ES5 guide: the real controls remain usable on touch and keyboard.
if(w.APP360_SCHOOL_GUIDE||!d.body||d.body.getAttribute('data-page')!=='home')return;
var KEY='app360:school-guide:v1',active=false,compact=false,index=0,card,ring,arrow,launcher,opener,timer,autoTimer,tries=0,steps=[];
function el(id){return d.getElementById(id)}
function saved(){try{return w.localStorage.getItem(KEY)==='seen'}catch(e){return false}}
function mark(){try{w.localStorage.setItem(KEY,'seen')}catch(e){}}
function visible(n){if(!n||!d.documentElement.contains(n))return false;var r=n.getBoundingClientRect();return r.width>0&&r.height>0}
function target(){var s=steps[index];return s&&s.selector?d.querySelector(s.selector):null}
function modal(){var list=d.querySelectorAll('[role="dialog"][aria-modal="true"],.swal2-container,.app360-swal-overlay,#app360ChildrenPanel,#app360FamilyShell');for(var i=0;i<list.length;i++)if(visible(list[i]))return list[i];return null}
function hide(n,yes){n.hidden=yes;if(yes)n.setAttribute('hidden','');else n.removeAttribute('hidden')}
function event(on){try{var e=d.createEvent('Event');e.initEvent('app360:school-guide',false,false);e.active=on;d.dispatchEvent(e)}catch(x){}}
function buildSteps(){return [
 {title:'أهلاً بك في مدرسة العائلة 360',text:'تعلم ولعب ومهارات لكل عمر. سنعرّفك بأزرار المدرسة خطوة خطوة. يمكنك تجربة الأزرار أثناء الجولة، أو تخطيها والعودة إليها من «دليل المدرسة».',hint:'التجربة متاحة كزائر. تسجيل الدخول يضيف المتابعة ومزايا الحساب.'},
 {selector:'#showcaseAges',title:'تنقّل بين الفئات العمرية',text:'اضغط أي فئة لتظهر تطبيقاتها فوراً، أو اختر «الكل» للاستكشاف. البدء بفئة 1–4 لا يحصرك فيها؛ يمكنك تغييرها في أي وقت.',hint:'جرّب اختيار فئة أخرى الآن، ثم اضغط «التالي». تغيير العرض لا يغيّر عمر الطفل أو بياناته.'},
 {selector:'#showcaseCategories',title:'التعلّم والتسلية الهادفة',text:'من هنا تنتقل بين كل التطبيقات وتطبيقات التسلية المتاحة للفئة المعروضة. قد يختلف المحتوى المتاح من فئة لأخرى.',hint:'جرّب التبويبين المضاءين. «قادم» و«فكرة» لا يعنيان أن التطبيق جاهز للاستخدام.'},
 {selector:'#carouselPanel',fallback:'#classicPanel',title:'استكشف التطبيقات وافتحها',text:'اسحب بطاقات الشريط، أو استخدم أسهم التنقل. اضغط غلاف التطبيق المتاح أو «فتح التطبيق» لتجربته. يمكنك العودة إلى المدرسة لمتابعة الاستكشاف.',hint:'زر «التفاصيل» يشرح الهدف وطريقة الممارسة والجمهور المناسب؛ انتبه للفرق بين تطبيق المتعلم وأداة المدرب.'},
 {selector:'#showcaseToolsToggle',title:'الفلاتر والمزايا في مكان واحد',text:'يفتح هذا الزر البحث وحالة التطبيق وطريقة العرض. اضغطه الآن لتجربة الأدوات؛ يمكنك إغلاقه بالزر نفسه.',action:'فتح الفلاتر',run:function(){if(!visible(el('showcaseTools')))el('showcaseToolsToggle').click()}},
 {selector:'#showcaseSearch',prepare:'tools',title:'ابحث عن التطبيق أو المهارة',text:'اكتب اسم تطبيق أو كلمة مثل «رسم» لتصفية النتائج في الفئة الحالية. امسح النص لإظهارها مجدداً.',hint:'جرّب الكتابة بنفسك؛ البحث لا يحتاج تسجيل دخول.'},
 {selector:'#showcaseStatusFilters',prepare:'tools',title:'ميّز المتاح عن القادم',text:'اختر «المتاح» للتطبيقات التي تستطيع فتحها الآن. «القادم» و«الأفكار» يعرضان ما نعمل على تطويره.',hint:'إن لم تجد نتائج، راجع الفئة وكلمة البحث وحالة التطبيق معاً.'},
 {selector:'#modeClassic',prepare:'tools',title:'اختر طريقة العرض التي تناسبك',text:'«العرض التفصيلي» يجمع البطاقات ووصفها، و«الشريط» يعيد العرض المتحرك. يمكن استخدام الطريقتين بالجوال والتاب والشاشة الكبيرة.',action:'تجربة العرض التفصيلي',run:function(){el('modeClassic').click()}},
 {selector:'#portalAccountBtn',title:'حساب موحّد مع فصل الأدوار',text:'سجّل دخول الطفل أو المتدرب للاستفادة من حسابه. حساب ولي الأمر أو مسؤول التدريب مخصص للإدارة والمتابعة، وله جلسة منفصلة عن حساب الطفل.',hint:'التشجيع بالاسم يعتمد على هوية الطفل واستحقاق الاشتراك. عند غياب الاستحقاق يبقى التشجيع العام.'},
 {selector:'#childrenProfilesBtn',title:'الأطفال والمتدربون',text:'من «أطفالي» تتعامل مع ملفات الأطفال بحسب صلاحيات حسابك. اختر الملف الصحيح قبل النشاط لكي تُنسب المتابعة إلى صاحبه.',hint:'إدارة أفراد الأسرة والتقارير تكون من لوحة الإدارة وبحسب صلاحيات ولي الأمر أو مسؤول التدريب.'},
 {selector:'#portalUsageBtn',title:'راقب وقت الاستخدام',text:'هنا تجد وقت استخدام التطبيقات وحدوده المتاحة لحسابك. تظهر تفاصيل الاستحقاق والتجديد عند تسجيل الدخول بحسب حالة الحساب.',hint:'للزائر حدود استخدام يحددها المدير؛ تسجيل الدخول وحده لا يلغي حدود اشتراك منتهٍ.'},
 {selector:'#shareAgeBtn',title:'شارك الفئة المناسبة',text:'شارك رابط الفئة المعروضة لتصل الأسرة أو المتدرب إلى التطبيقات المناسبة بسهولة. يبقى التنقل إلى الفئات الأخرى متاحاً.',hint:'رابط المشاركة يحدد العرض، ولا يمنح صلاحيات حسابك أو يسجّل الآخرين باسمك.'},
 {selector:'#offlineAppsBtn',title:'التطبيقات دون إنترنت',text:'افتح مدير التنزيل لاختيار التطبيقات التي تريد حفظها. بعد اكتمال التنزيل تعمل المواد المحلية المدعومة دون اتصال؛ الدخول والمزامنة وبعض الخدمات تحتاج الإنترنت.',hint:'لا يلزم تنزيل جميع التطبيقات. احتفظ بمساحة كافية واتصل بالإنترنت عند تنزيل نسخة جديدة.'},
 {selector:'#installPortalBtn',title:'ثبّت المدرسة على جهازك',text:'هذا الزر يتيح التثبيت عندما يدعمه المتصفح، أو يعرض إرشاداته. تظهر المدرسة بعد التثبيت كأيقونة سهلة الفتح.',hint:'التثبيت لا يعني تنزيل كل المحتوى؛ مدير «التطبيقات دون إنترنت» هو المسؤول عن تنزيل التطبيقات.'},
 {selector:'#checkUpdateBtn',title:'تابع التحديثات بأمان',text:'تحقق من الإصدارات الجديدة من هنا. انتظر اكتمال تحديث التطبيقات المنزّلة قبل فصل الإنترنت.',hint:'يمكنك إعادة هذه الجولة في أي وقت من «دليل المدرسة». استمتع بالتجربة واختر نشاطاً مناسباً للعمر والهدف.'}
]}
function mount(){
 if(card)return;
 ring=d.createElement('div');ring.id='schoolGuideRing';ring.setAttribute('aria-hidden','true');hide(ring,true);
 arrow=d.createElement('div');arrow.id='schoolGuideArrow';arrow.setAttribute('aria-hidden','true');hide(arrow,true);
 card=d.createElement('section');card.id='schoolGuideCard';hide(card,true);card.dir='rtl';card.setAttribute('role','dialog');card.setAttribute('aria-modal','false');card.setAttribute('aria-labelledby','schoolGuideTitle');card.setAttribute('aria-describedby','schoolGuideText');
 card.innerHTML='<div class="sg-heading"><span id="schoolGuideCount"></span><button type="button" id="schoolGuideSkip" aria-label="إغلاق دليل المدرسة">×</button></div><div class="sg-progress" aria-hidden="true"><span id="schoolGuideProgress"></span></div><h2 id="schoolGuideTitle" tabindex="-1"></h2><p id="schoolGuideText"></p><p id="schoolGuideHint"></p><button type="button" id="schoolGuideTry" hidden></button><div class="sg-actions"><button type="button" id="schoolGuidePrev">السابق</button><button type="button" id="schoolGuideLater">تخطي الشرح</button><button type="button" id="schoolGuideNext">التالي ←</button></div><button type="button" id="schoolGuideResume" hidden>متابعة دليل المدرسة ↑</button>';
 d.body.appendChild(ring);d.body.appendChild(arrow);d.body.appendChild(card);
 el('schoolGuideSkip').onclick=function(){close(true)};el('schoolGuideLater').onclick=function(){close(true)};
 el('schoolGuidePrev').onclick=function(){go(index-1)};el('schoolGuideNext').onclick=function(){if(index===steps.length-1)close(true);else go(index+1)};
 el('schoolGuideTry').onclick=function(){var s=steps[index];if(s.run)s.run();else{var n=target();if(n)n.focus()}setTimeout(position,80)};
 el('schoolGuideResume').onclick=function(){compact=false;render(false)};
}
function box(n){var r=n.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height}}
function position(){
 if(!active||!card)return;
 var v=w.visualViewport,vw=v?v.width:w.innerWidth,vh=v?v.height:w.innerHeight,ox=v?v.offsetLeft:0,oy=v?v.offsetTop:0;
 card.style.maxHeight=Math.max(110,Math.floor(vh*(compact?0.25:0.58)))+'px';card.style.width=Math.min(390,vw-24)+'px';
 if(compact){hide(ring,true);hide(arrow,true);card.style.left=(ox+12)+'px';card.style.top=(oy+vh-card.offsetHeight-12)+'px';return}
 var n=target();if(!visible(n)&&steps[index].fallback)n=d.querySelector(steps[index].fallback);
 var r=n&&visible(n)?box(n):null,cw=card.offsetWidth,ch=card.offsetHeight,left=ox+(vw-cw)/2,top=oy+Math.max(12,(vh-ch)/2);
 hide(ring,!r);hide(arrow,!r);
 if(r){
  var t=Math.max(oy+3,r.top-5),b=Math.min(oy+vh-3,r.bottom+5),l=Math.max(ox+3,r.left-5),right=Math.min(ox+vw-3,r.right+5);
  if(b<t||right<l){hide(ring,true);hide(arrow,true)}else{
   ring.style.left=l+'px';ring.style.top=t+'px';ring.style.width=(right-l)+'px';ring.style.height=(b-t)+'px';
   left=Math.max(ox+12,Math.min(r.left+(r.width-cw)/2,ox+vw-cw-12));
   if(vh+oy-b>=ch+30)top=b+19;else if(t-oy>=ch+30)top=t-ch-19;else top=(t-oy<vh/2?oy+vh-ch-12:oy+12);
   var below=top>=b;arrow.className=below?'sg-arrow-up':'sg-arrow-down';arrow.style.left=Math.max(left+18,Math.min(l+(right-l)/2,left+cw-32))+'px';arrow.style.top=(below?top-11:top+ch)+'px';
   if(top<b&&top+ch>t)hide(arrow,true);
  }
 }
 card.style.left=left+'px';card.style.top=Math.max(oy+8,Math.min(top,oy+vh-ch-8))+'px';
}
function render(scroll){
 var s=steps[index],n;
 card.className=compact?'sg-compact':'';
 el('schoolGuideCount').textContent='دليل المدرسة · '+(index+1)+' / '+steps.length;
 el('schoolGuideTitle').textContent=s.title;el('schoolGuideText').textContent=s.text;el('schoolGuideHint').textContent=s.hint||'يمكنك تجربة الزر المضاء أثناء الشرح، ثم متابعة الجولة.';
 el('schoolGuideProgress').style.width=((index+1)*100/steps.length)+'%';el('schoolGuidePrev').disabled=index===0;
 el('schoolGuideNext').textContent=index===steps.length-1?'ابدأ الاستكشاف ✓':'التالي ←';
 hide(el('schoolGuideTry'),!s.action);el('schoolGuideTry').textContent=s.action||'';hide(el('schoolGuideResume'),!compact);
 hide(card,false);n=target();if(!visible(n)&&s.fallback)n=d.querySelector(s.fallback);
 if(scroll&&visible(n)){var r=box(n);try{w.scrollBy(0,r.top-w.innerHeight*0.2)}catch(e){}}
 position();setTimeout(position,120);
 if(!compact)try{el('schoolGuideTitle').focus({preventScroll:true})}catch(e){try{el('schoolGuideTitle').focus()}catch(x){}}
}
function go(i){
 index=Math.max(0,Math.min(steps.length-1,i));compact=false;
 if(steps[index].prepare==='tools'&&el('showcaseTools')&&!visible(el('showcaseTools')))el('showcaseToolsToggle').click();
 render(true);
}
function start(){
 if(active){compact=false;render(true);return}
 if(!el('showcaseAges')||!el('showcaseAges').querySelector('[data-age="1-4"]'))return;
 clearTimeout(autoTimer);mount();opener=d.activeElement;steps=buildSteps().filter(function(s){return !s.selector||!!d.querySelector(s.selector)});active=true;index=0;w.APP360_SCHOOL_GUIDE.active=true;event(true);
 var tip=el('showcaseFirstTip');if(tip)tip.className='showcase-first-tip';
 go(0);timer=w.setInterval(function(){if(active){if(!compact&&visible(modal())){compact=true;card.className='sg-compact';hide(el('schoolGuideResume'),false)}position()}},350);
}
function close(remember){
 active=false;compact=false;w.APP360_SCHOOL_GUIDE.active=false;clearInterval(timer);clearTimeout(autoTimer);if(remember)mark();if(card)hide(card,true);if(ring)hide(ring,true);if(arrow)hide(arrow,true);event(false);
 try{(visible(opener)?opener:launcher).focus()}catch(e){}
}
function ready(){
 clearTimeout(autoTimer);
 var controls=d.querySelector('.portal-controls');if(!controls)return;
 if(!launcher){launcher=d.createElement('button');launcher.id='schoolGuideBtn';launcher.className='update-action';launcher.type='button';launcher.textContent='؟ دليل المدرسة';launcher.setAttribute('aria-label','فتح دليل مدرسة العائلة التفاعلي');launcher.onclick=start;controls.insertBefore(launcher,controls.firstChild)}
 if(saved()||active||d.hidden)return;
 if(!el('showcaseAges')||!el('showcaseAges').querySelector('[data-age="1-4"]')||visible(modal())){if(++tries<90)autoTimer=setTimeout(ready,1000);return}
 autoTimer=setTimeout(function(){if(!saved()&&!active&&!d.hidden&&!visible(modal()))start();else if(!saved())ready()},1000);
}
 w.APP360_SCHOOL_GUIDE={active:false,start:start,close:function(){close(true)}};
 w.addEventListener('resize',position,false);w.addEventListener('orientationchange',position,false);d.addEventListener('scroll',position,true);
 d.addEventListener('visibilitychange',function(){if(!d.hidden&&!saved()&&!active)ready()},false);
 if(w.visualViewport){w.visualViewport.addEventListener('resize',position);w.visualViewport.addEventListener('scroll',position)}
 d.addEventListener('keydown',function(e){if(active&&(e.key==='Escape'||e.keyCode===27)&&!visible(modal())){e.preventDefault();close(true)}},false);
 w.addEventListener('click',function(e){if(!active||compact)return;var n=e.target;while(n&&n!==d){if(n.id&&/^(portalAccountBtn|childrenProfilesBtn|portalUsageBtn|shareAgeBtn|offlineAppsBtn|installPortalBtn|checkUpdateBtn)$/.test(n.id)||n.getAttribute&&n.getAttribute('data-detail-app')){compact=true;card.className='sg-compact';hide(el('schoolGuideResume'),false);position();return}n=n.parentNode}},true);
 if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',ready,false);else ready();
})(window,document);
