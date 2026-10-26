/* Age presentation only: game rules, saves and readiness choices remain owned by each app. ES5. */
(function(w,d){'use strict';
function age(){var m=/[?&](?:launch_age|age)=([^&]*)/.exec(w.location.search||'');return m&&m[1]==='4-8'?'4-8':'1-4';}
var band=age();
function refresh(){
 if(!d.body)return;
 d.body.setAttribute('data-fun-age',band);
 var english=d.documentElement.lang==='en',header=d.querySelector('.brand'),badge=d.getElementById('funAgeBadge');
 if(header&&!badge){badge=d.createElement('span');badge.id='funAgeBadge';badge.className='fun-age-badge';(header.querySelector('div')||header).appendChild(badge);}
 if(badge)badge.textContent=english?(band==='4-8'?'Explorer club · 4–8':'Little play garden · 1–4'):(band==='4-8'?'نادي المستكشفين · 4–8':'حديقة الصغار · 1–4');
 var overlay=d.getElementById('settingsOverlay'),view=d.getElementById('settingsView')||(overlay&&overlay.querySelector('.settings-panel')),note=d.getElementById('funAgeNote');
 if(view&&!note){note=d.createElement('p');note.id='funAgeNote';note.className='fun-age-note';var layout=view.querySelector('.settings-layout');view.insertBefore(note,layout||view.firstChild);}
 if(note)note.textContent=english?(band==='4-8'?'Your age has its own saved progress. Start with planning and longer paths; choose any easier level when helpful.':'Your age has its own saved progress. Start with big pieces and simple actions; explore other levels with a companion.'):(band==='4-8'?'تقدم مستقل لهذه الفئة. نبدأ بالتخطيط ومسارات أطول، ويمكن اختيار مستوى أبسط بحسب الاستعداد.':'تقدم مستقل لهذه الفئة. نبدأ بقطع كبيرة وخطوات بسيطة، ويمكن استكشاف المستويات الأخرى مع المرافق.');
 var select=d.getElementById('levelSelect');
 if(select&&select.options.length===4&&!select.getAttribute('data-age-groups')){
  var easy=d.createElement('optgroup'),explore=d.createElement('optgroup'),options=[],selectedValue=select.value,i;
  easy.setAttribute('data-fun-level-group','little');explore.setAttribute('data-fun-level-group','explorer');
  for(i=0;i<select.options.length;i++)options.push(select.options[i]);
  for(i=0;i<options.length;i++)(i<2?easy:explore).appendChild(options[i]);
  select.appendChild(easy);select.appendChild(explore);select.setAttribute('data-age-groups','true');select.value=selectedValue;
 }
 var groups=d.querySelectorAll('[data-fun-level-group]');
 for(var j=0;j<groups.length;j++){var little=groups[j].getAttribute('data-fun-level-group')==='little';groups[j].label=english?(little?'Little discoveries · 1–4':'Explorer challenges · 4–8'):(little?'اكتشاف بسيط · 1–4':'تحديات الاستكشاف · 4–8');}
}
w.APP360_FUN_AGE={age:age,refresh:refresh};
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',refresh,false);else refresh();
})(window,document);
