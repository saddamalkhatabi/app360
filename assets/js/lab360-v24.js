(function(){
'use strict';
var d=document,body=d.body||d.getElementsByTagName('body')[0];
function byId(id){return d.getElementById(id)}
function attr(name,def){var v=body&&body.getAttribute(name);return v||def||''}
function esc(s){return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function norm(s){return String(s||'').toLowerCase().replace(/[أإآ]/g,'ا').replace(/ى/g,'ي').replace(/ة/g,'ه').replace(/[ًٌٍَُِّْـ]/g,'').replace(/\s+/g,' ').replace(/^\s+|\s+$/g,'')}
function loadJson(url,cb){
  var finished=false,x,t;
  function done(err,data){if(finished)return;finished=true;if(t)clearTimeout(t);cb(err,data)}
  try{
    x=new XMLHttpRequest();
    x.open('GET',url,true);
    x.onreadystatechange=function(){if(x.readyState!==4)return;if(x.status>=200&&x.status<300){try{done(null,JSON.parse(x.responseText))}catch(e){done(e)}}else done(new Error('HTTP '+x.status))};
    x.onerror=function(){done(new Error('network error'))};
    x.onabort=function(){done(new Error('aborted'))};
    try{x.timeout=12000;x.ontimeout=function(){done(new Error('timeout'))}}catch(ignore){}
    t=setTimeout(function(){try{x.abort()}catch(ignore){}done(new Error('timeout'))},15000);
    x.send(null);
  }catch(e){done(e)}
}
function rootPath(path){var r=attr('data-root','.');return r.replace(/\/$/,'')+'/'+String(path||'').replace(/^\//,'')}
function statusAr(s){return s==='live'?'يعمل الآن':s==='planned'?'مخطط للبناء':'فكرة تطوير'}
function kindAr(k){return k==='goal_aligned'?'مرتبط بالأهداف':k==='modern_extension'?'إضافة عصرية':'هجين ومعزز'}
function joinText(a){return a&&a.join?a.join(' '):''}
function contains(a,v){var i;if(!a)return false;for(i=0;i<a.length;i++)if(a[i]===v)return true;return false}
function applyPortalBrand(){var bm=d.querySelector?d.querySelector('.brand-mark'):null;if(bm)bm.innerHTML='<img src="'+esc(rootPath('assets/brand/app360-lab-icon-192.png?v=24'))+'" alt="">'}
var catalog=null,goals=null,activeStatus='all',page=attr('data-page','home'),age=attr('data-age','');
function applyLiveOverrides(o){var rows=o&&o.apps||[],apps=catalog&&catalog.apps||[],i,j,a,r,links,k;if(!rows.length||!apps.length)return;for(i=0;i<rows.length;i++){r=rows[i];for(j=0;j<apps.length;j++){a=apps[j];if(a.id!==r.id)continue;if(r.status)a.status=r.status;if(r.href)a.href=r.href;if(r.capabilities&&r.capabilities.join)a.capabilities=r.capabilities.slice(0);if(r.goal_delivery){links=a.goal_links||[];for(k=0;k<links.length;k++)links[k].delivery=r.goal_delivery}break}}}
function findGoal(key){var groups=goals&&goals.age_groups||{},g,i,j;for(i in groups){if(!Object.prototype.hasOwnProperty.call(groups,i))continue;g=groups[i];for(j=0;j<g.length;j++)if(g[j].key===key)return g[j]}return null}
function appSearchText(a){var names=[],links=a.goal_links||[],i,g;for(i=0;i<(a.goal_keys||[]).length;i++){g=findGoal(a.goal_keys[i]);if(g)names.push(g.title_ar)}for(i=0;i<links.length;i++)names.push(links[i].rationale_ar);return norm([a.title_ar,a.description_ar,a.practice_model,a.age_group,joinText(a.tags),joinText(a.goal_keys),joinText(names),kindAr(a.kind),statusAr(a.status)].join(' '))}
function listHtml(rows){var h='<ul>',i;for(i=0;i<(rows||[]).length;i++)h+='<li>'+esc(rows[i])+'</li>';return h+'</ul>'}
function goalPanel(a){var h='<div class="modal-detail-content">',keys=a.goal_keys||[],links=a.goal_links||[],i,j,g,l;h+='<p class="detail-intro">الارتباط يوضح مساهمة محددة في الهدف، وليس ادعاء تغطية كل أجزائه. '+(a.status==='live'?'الممارسة الحالية متاحة الآن، وتفاصيل المساهمة موضحة لكل هدف.':'هذه ممارسة مخططة تُنفذ عند بناء التطبيق.')+'</p>';if(!keys.length)h+='<p>لا يوجد هدف مرجعي مرتبط حاليًا.</p>';for(i=0;i<keys.length;i++){g=findGoal(keys[i]);l=null;for(j=0;j<links.length;j++)if(links[j].goal_key===keys[i]){l=links[j];break}h+='<div class="goal-relationship modal-goal"><span class="goal-chip '+esc(g?g.role:'')+'">'+(g?(g.role==='coach'?'هدف المدرب':'هدف المتعلم'):'هدف مرتبط')+'</span><h5>'+esc(g?g.title_ar:keys[i])+'</h5>';if(l)h+='<p><b>المساهمة العملية:</b> '+esc(l.rationale_ar)+'</p><p><b>ما الذي نلاحظه؟</b> '+esc(l.evidence_ar)+'</p>';else h+='<p>لم يوثق تفسير هذا الارتباط بعد.</p>';h+='</div>'}return h+'</div>'}
function planPanel(a){var b=a.blueprint;if(!b)return '<div class="modal-detail-content"><p>لا توجد خطة موثقة لهذا التطبيق حاليًا.</p></div>';var h='<div class="modal-detail-content"><h4>الناتج العملي</h4><p>'+esc(b.output_ar||'')+'</p>';if(b.audience_ar)h+='<p><b>المستخدم:</b> '+esc(b.audience_ar)+'</p>';h+='<h4>المكونات والخطوات</h4>'+listHtml(b.mvp_steps_ar);if(b.scenarios_ar&&b.scenarios_ar.length)h+='<h4>سيناريوهات الاستخدام</h4>'+listHtml(b.scenarios_ar);if(b.age_adaptation_ar)h+='<h4>ملاءمة الفئة والتدرج</h4><p>'+esc(b.age_adaptation_ar)+'</p>';if(b.acceptance_ar&&b.acceptance_ar.length)h+='<h4>كيف نراجع نجاح التنفيذ؟</h4>'+listHtml(b.acceptance_ar);h+='<p class="plan-status">'+(a.status==='live'?'التطبيق يعمل الآن؛ هذه الخطة تصف النسخة الفعلية وسيناريوهات استخدامها الحالية.':'الخطة جاهزة للبناء؛ التطبيق لم ينفذ بعد.')+'</p>';if(a.status!=='live'){h+='<div class="plan-links">';if(a.blueprint_path)h+='<a href="'+esc(rootPath(a.blueprint_path))+'">مواصفات البناء</a>';if(a.prompt_path)h+='<a href="'+esc(rootPath(a.prompt_path))+'">مطالبة البناء</a>';h+='</div>'}return h+'</div>'}
function findAppById(id){var a=catalog&&catalog.apps||[],i;for(i=0;i<a.length;i++)if(a[i].id===id)return a[i];return null}
var swalWait=[],swalLoading=false;
function ensureSwal(cb){if(window.Swal){cb();return}swalWait.push(cb);if(swalLoading)return;swalLoading=true;var l=d.createElement('link');l.rel='stylesheet';l.href='https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/dist/sweetalert2.min.css';d.head.appendChild(l);var sc=d.createElement('script');sc.src='https://cdn.jsdelivr.net/npm/sweetalert2@11.23.0/dist/sweetalert2.all.min.js';sc.onload=function(){swalLoading=false;var q=swalWait.slice();swalWait=[];for(var i=0;i<q.length;i++)q[i]()};sc.onerror=function(){swalLoading=false;swalWait=[];alert('تعذر فتح نافذة التفاصيل الآن. حاول مرة أخرى.')};d.head.appendChild(sc)}
function openAppDetail(type,a){if(!a)return;ensureSwal(function(){var isGoals=type==='goals',title=(isGoals?'الأهداف المرتبطة — ':'خطة التطبيق — ')+a.title_ar,html=isGoals?goalPanel(a):planPanel(a);window.Swal.fire({title:title,html:html,width:'min(940px,96vw)',showCloseButton:true,confirmButtonText:'إغلاق',focusConfirm:false,customClass:{popup:'app360-detail-popup',htmlContainer:'app360-detail-container'}})})}
function bindDetails(){var grid=byId('appGrid');if(!grid)return;grid.onclick=function(e){var t=(e||window.event).target||(e||window.event).srcElement;while(t&&t!==grid){if(t.getAttribute&&t.getAttribute('data-detail')){openAppDetail(t.getAttribute('data-detail'),findAppById(t.getAttribute('data-app')));return}t=t.parentNode}}}
function appHref(a){if(!a.href)return'';return rootPath(a.href)}
function appIcon(a){if(a.icon)return rootPath(a.icon);if(a.status==='live'&&a.href&&a.href.indexOf('apps/')===0){var p=a.href.split('?')[0].split('#')[0],i=p.lastIndexOf('/');if(i>0)return rootPath(p.substring(0,i)+'/icon.svg')}return''}
function appCard(a){var h='<article class="app-card" data-status="'+esc(a.status)+'">',ico=appIcon(a),offline=a.status==='live'&&contains(a.capabilities,'pwa.offline');h+='<div class="app-badges"><span class="badge status-'+esc(a.status)+'">'+esc(statusAr(a.status))+'</span><span class="badge kind-'+esc(a.kind)+'">'+esc(kindAr(a.kind))+'</span>'+(a.priority?'<span class="badge">أولوية '+esc(a.priority)+'</span>':'')+(offline?'<span class="offline-chip">⚡ دون اتصال</span>':'')+'</div>';h+='<div class="app-title-row">'+(ico?'<img class="app-logo" src="'+esc(ico)+'" alt="">':'')+'<h3>'+esc(a.title_ar)+'</h3></div><p>'+esc(a.description_ar)+'</p>';if(a.practice_model)h+='<div class="practice"><b>نمط الممارسة:</b> '+esc(a.practice_model)+'</div>';h+='<div class="app-badges">';var tags=a.tags||[],i;for(i=0;i<tags.length&&i<6;i++)h+='<span class="badge">'+esc(tags[i])+'</span>';h+='</div><div class="actions">';if(a.status==='live'&&a.href)h+='<a class="btn" href="'+esc(appHref(a))+'">فتح التطبيق</a>';else h+='<span class="btn disabled">'+(a.status==='planned'?'مخطط للبناء':'في بنك الأفكار')+'</span>';h+='<button type="button" class="goal-toggle" data-detail="goals" data-app="'+esc(a.id)+'" aria-label="عرض الأهداف المرتبطة بتطبيق '+esc(a.title_ar)+'">'+esc((a.goal_keys||[]).length)+' هدف مرتبط</button>';if(a.blueprint)h+='<button type="button" class="plan-toggle" data-detail="plan" data-app="'+esc(a.id)+'">خطة التطبيق</button>';h+='</div></article>';return h}
function filteredApps(){var apps=(catalog&&catalog.apps)||[],q=norm((byId('appSearch')&&byId('appSearch').value)||''),out=[],i,a;for(i=0;i<apps.length;i++){a=apps[i];if(age&&a.age_group!==age)continue;if(activeStatus!=='all'&&a.status!==activeStatus)continue;if(q&&appSearchText(a).indexOf(q)<0)continue;out.push(a)}out.sort(function(x,y){var sx=x.status==='live'?0:x.status==='planned'?1:2,sy=y.status==='live'?0:y.status==='planned'?1:2;if(sx!==sy)return sx-sy;return (x.priority||99)-(y.priority||99)});return out}
function renderApps(){var box=byId('appGrid'),count=byId('resultCount');if(!box||!catalog)return;var list=filteredApps(),i,h='';for(i=0;i<list.length;i++)h+=appCard(list[i]);box.innerHTML=h||'<div class="empty">لا توجد تطبيقات مطابقة للبحث الحالي.</div>';if(count)count.innerHTML='النتائج: <span class="count">'+list.length+'</span>';bindDetails()}
function appsForAge(g){var a=(catalog&&catalog.apps)||[],n=0,i;for(i=0;i<a.length;i++)if(a[i].age_group===g)n++;return n}
function liveForAge(g){var a=(catalog&&catalog.apps)||[],n=0,i;for(i=0;i<a.length;i++)if(a[i].age_group===g&&a[i].status==='live')n++;return n}
function renderAges(){var box=byId('ageGrid');if(!box||!catalog)return;var arr=catalog.age_groups||[],h='',i,g;for(i=0;i<arr.length;i++){g=arr[i];h+='<a class="age-card" href="'+esc(rootPath('ages/'+g.id+'/index.html'))+'"><div class="age-head"><span class="age-icon">'+esc(g.icon||'◉')+'</span><div><h3>'+esc(g.label_ar)+'</h3><div class="age-meta"><span class="mini">'+appsForAge(g.id)+' تطبيقات/أفكار</span>'+(liveForAge(g.id)?'<span class="mini">'+liveForAge(g.id)+' يعمل الآن</span>':'')+'</div></div></div><p>'+esc(g.focus_ar||'')+'</p></a>'}box.innerHTML=h||'<div class="empty">لا توجد فئات عمرية في الفهرس الحالي.</div>'}
function goalArrayForAge(){if(!goals||!goals.age_groups)return[];return goals.age_groups[age]||[]}
function renderGoals(){var box=byId('goalList');if(!box)return;var arr=goalArrayForAge(),h='',i,g;for(i=0;i<arr.length;i++){g=arr[i];h+='<span class="goal-chip '+esc(g.role)+'" title="'+esc(g.key)+'">'+(g.role==='coach'?'مدرب: ':'متعلم: ')+esc(g.title_ar)+'</span>'}box.innerHTML=h||'<span class="goal-chip">لم يتم تحميل قائمة الأهداف.</span>';var c=byId('goalCount');if(c)c.innerHTML=arr.length}
function ageInfo(){if(!catalog)return null;var arr=catalog.age_groups||[],i;for(i=0;i<arr.length;i++)if(arr[i].id===age)return arr[i];return null}
function renderAgeHeader(){var g=ageInfo();if(!g)return;var t=byId('ageTitle'),p=byId('ageFocus'),m=byId('ageMeta');if(t)t.innerHTML=esc(g.label_ar);if(p)p.innerHTML=esc(g.focus_ar);if(m)m.innerHTML=appsForAge(age)+' تطبيقات وأفكار · <span id="goalCount">'+goalArrayForAge().length+'</span> أهداف مرجعية'}
function statusFilters(){var box=byId('statusFilters');if(!box)return;var bs=box.getElementsByTagName('button'),i;for(i=0;i<bs.length;i++)bs[i].onclick=function(){activeStatus=this.getAttribute('data-status')||'all';var j;for(j=0;j<bs.length;j++)bs[j].className='filter-btn'+(bs[j]===this?' on':'');renderApps()}}
function bindSearch(){var s=byId('appSearch');if(s){s.oninput=renderApps;s.onkeyup=renderApps;s.onchange=renderApps}}
function renderStats(){if(!catalog)return;var apps=catalog.apps||[],live=0,planned=0,idea=0,i;for(i=0;i<apps.length;i++){if(apps[i].status==='live')live++;else if(apps[i].status==='planned')planned++;else idea++}var a=byId('totalApps'),b=byId('liveApps'),c=byId('plannedApps');if(a)a.innerHTML=apps.length;if(b)b.innerHTML=live;if(c)c.innerHTML=planned+idea}
function renderAll(){if(page==='home'){renderAges();renderStats()}else{renderAgeHeader();renderGoals()}statusFilters();bindSearch();renderApps()}
function showCatalogError(){var a=byId('ageGrid'),x=byId('appGrid');if(a)a.innerHTML='<div class="empty">تعذر تحميل الفئات العمرية الآن. أعد المحاولة من زر التحديث.</div>';if(x)x.innerHTML='<div class="empty">تعذر تحميل فهرس التطبيقات الآن. أعد المحاولة من زر التحديث.</div>'}
function rawCatalogFallback(cb){var u='https://raw.githubusercontent.com/saddamalkhatabi/app360/main/data/catalog.json';loadJson(u,cb)}
function init(){
  applyPortalBrand();
  var cu=attr('data-catalog',rootPath('data/catalog.json'));
  var gu=attr('data-goals',rootPath('data/goals.json'));
  var ou=attr('data-live-overrides',rootPath('data/live-overrides.json'));
  loadJson(cu,function(e,c){
    function afterCatalog(err,data){
      if(err||!data||!data.apps||!data.age_groups){showCatalogError();return}
      catalog=data;goals={age_groups:{}};
      /* Critical: render categories/apps immediately. Goals and overrides are
         enhancements and must never block the home portal. */
      renderAll();
      loadJson(gu,function(ge,g){if(!ge&&g)goals=g;renderAll()});
      loadJson(ou,function(oe,o){if(!oe&&o)applyLiveOverrides(o);renderAll()});
    }
    if(!e&&c){afterCatalog(null,c);return}
    rawCatalogFallback(afterCatalog);
  });
}
if(d.readyState==='loading'){
  if(d.addEventListener)d.addEventListener('DOMContentLoaded',init,false);
  else if(window.attachEvent)window.attachEvent('onload',init);
  else setTimeout(init,0);
}else init();
})();
