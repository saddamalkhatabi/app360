from pathlib import Path
import re

app = Path('apps/1-4/say-and-name')

# ---------- index.html ----------
p = app / 'index.html'
s = p.read_text(encoding='utf-8')
s = s.replace('say-and-name-v18-20260915', 'say-and-name-v19-20260915')
s = s.replace('data-build="v18"', 'data-build="v19"')
s = s.replace('?v=18', '?v=19')
s = s.replace('styles-v18.css?v=19', 'styles-v19.css?v=19')
s = s.replace('runtime-v18.js?v=19', 'runtime-v19.js?v=19')
s = s.replace('<h2 id="levelTitle">المستوى 1 — عمر 2</h2>', '<h2 id="levelTitle">المستوى 1</h2>')
needle = '<button id="advancedSettingsBtn" class="settings-btn" type="button">⚙ <span data-i18n="settings">الإعدادات</span></button>'
if 'id="helpBtn"' not in s:
    s = s.replace(needle, '<button id="helpBtn" class="help-btn" type="button">❓ <span data-i18n="help">تعليمات</span></button>\n          ' + needle)
p.write_text(s, encoding='utf-8')

# ---------- runtime-v19.js ----------
src = app / 'runtime-v18.js'
p = app / 'runtime-v19.js'
s = src.read_text(encoding='utf-8')
s = s.replace("displayLanguage:'لغة العرض',settings:'الإعدادات'", "displayLanguage:'لغة العرض',help:'تعليمات',settings:'الإعدادات'")
s = s.replace("displayLanguage:'Display language',settings:'Settings'", "displayLanguage:'Display language',help:'Help',settings:'Settings'")
s = s.replace("categoriesHint:'تظهر تصنيفات المستوى المختار أولًا، ثم التصنيفات السابقة.'", "categoriesHint:'تصنيفات المستوى المختار تظهر أولًا. التصنيفات السابقة مجمعة أسفلها لتبقى الصفحة واضحة.'")
s = s.replace("categoriesHint:'Categories from the selected level appear first, followed by earlier ones.'", "categoriesHint:'Categories from the selected level appear first. Earlier levels are grouped below to keep the page clear.'")
s = s.replace("var SETTINGS='app360:say-name:v18';\nvar LEGACY=", "var SETTINGS='app360:say-name:v19';\nvar LEGACY18='app360:say-name:v18';\nvar LEGACY=")
s = s.replace("localStorage.getItem(SETTINGS)||localStorage.getItem(LEGACY)||'{}'", "localStorage.getItem(SETTINGS)||localStorage.getItem(LEGACY18)||localStorage.getItem(LEGACY)||'{}'")
s = s.replace("$('levelTitle').textContent='Level '+state.level+' — Age '+(state.level+1)", "$('levelTitle').textContent='Level '+state.level")
s = s.replace("$('levelTitle').textContent='المستوى '+state.level+' — عمر '+(state.level+1)+' / Level '+state.level+' — Age '+(state.level+1)", "$('levelTitle').textContent='المستوى '+state.level+' / Level '+state.level")
s = s.replace("$('levelTitle').textContent='المستوى '+state.level+' — عمر '+(state.level+1)", "$('levelTitle').textContent='المستوى '+state.level")

if 'function scrollToStage()' not in s:
    s = s.replace('function renderLevels(){', "function scrollToStage(){var el=$('stage');if(!el)return;setTimeout(function(){try{el.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){el.scrollIntoView(true)}},100)}\nfunction renderLevels(){")

new_render_cats = """function renderCats(){var a=cats(),currentNames=currentLevelNames(),isCurrent={},current=[],previous=[];for(var i=0;i<currentNames.length;i++)isCurrent[currentNames[i]]=1;for(i=0;i<a.length;i++){if(isCurrent[a[i].name])current.push(a[i]);else previous.push(a[i])}var t=tr(),h='<div class=\"category-group current\"><div class=\"category-group-title\"><span class=\"dot\"></span>'+esc(t.currentCats)+' '+state.level+'</div><div class=\"category-row\">';for(i=0;i<current.length;i++)h+=catButton(current[i],true);h+='</div></div>';if(previous.length){h+='<details class=\"previous-categories\"><summary>'+esc(t.previousCats)+' <small>('+previous.length+')</small></summary><div class=\"category-row\">';for(i=0;i<previous.length;i++)h+=catButton(previous[i],false);h+='</div></details>'}$('categoryChips').innerHTML=h;var b=$('categoryChips').querySelectorAll('[data-cat]');for(var j=0;j<b.length;j++)b[j].onclick=function(){state.category=this.getAttribute('data-cat');state.view='category';state.randomPool=[];state.index=0;saveSettings();render();if(state.speech)speak();scrollToStage()}}"""
s, count = re.subn(r'function renderCats\(\)\{.*?\}\nfunction renderViewSwitch', new_render_cats + '\nfunction renderViewSwitch', s, count=1, flags=re.S)
if count != 1:
    raise RuntimeError('Could not replace renderCats')

s = s.replace("render();if(state.speech)speak()};if(state.view==='random')$('gridMeta')", "render();if(state.speech)speak();scrollToStage()};if(state.view==='random')$('gridMeta')")

helper = r'''
function helpContent(kind){if(kind==='child')return '<div class="help-card"><b>👧 للطفل الذي يقرأ ويفهم التعليمات</b><ol><li>اختر المستوى.</li><li>اختر مجموعة تحبها مثل الحيوانات أو الطعام.</li><li>انظر إلى الصورة وحاول أن تقول اسمها قبل سماع الصوت.</li><li>اضغط 🔊 لتسمع الاسم، ثم كرره بصوتك.</li><li>استخدم التالي والسابق، أو جرّب 🎲 المتنوع العشوائي.</li></ol><p>الفكرة: انظر ← فكّر ← سمِّ ← استمع ← كرّر.</p></div>';return '<div class="help-card"><b>👨‍👩‍👧 للمربي أو المعلم</b><ol><li>اختر المستوى المناسب، وسيفتح أول تصنيف خاص به مباشرة.</li><li>دع الطفل ينظر للصورة ويشير أو يسمي قبل تشغيل الصوت.</li><li>شغّل النطق عند الحاجة، ويمكن اختيار العربية أو English أو كليهما من الإعدادات.</li><li>اربط البطاقة بشيء حقيقي كلما أمكن.</li><li>استخدم المتنوع العشوائي للمراجعة، وليس كبداية للتعلم.</li></ol><p>جلسات قصيرة ومتكررة أفضل من جلسة طويلة أو تحويل النشاط إلى اختبار.</p></div>'}
function openHelp(){if(!window.Swal){toast('التعليمات غير متاحة الآن.');return}var selected='adult';Swal.fire({title:'❓ كيف نستخدم التطبيق؟',html:'<div class="help-sheet"><div class="help-tabs"><button class="is-active" data-help="adult">للمربي والمعلم</button><button data-help="child">للطفل الواعي</button></div><div id="helpBody" class="help-body">'+helpContent('adult')+'</div></div>',showCloseButton:true,showCancelButton:true,confirmButtonText:'ابدأ جولة داخل التطبيق',cancelButtonText:'إغلاق',customClass:{popup:'app360-help'},didOpen:function(){var root=document.querySelector('.swal2-popup'),btns=root.querySelectorAll('[data-help]'),body=root.querySelector('#helpBody');for(var i=0;i<btns.length;i++)btns[i].onclick=function(){selected=this.getAttribute('data-help');for(var j=0;j<btns.length;j++)btns[j].className=btns[j]===this?'is-active':'';body.innerHTML=helpContent(selected)}}}).then(function(r){if(r.isConfirmed)runTour(0,selected)})}
function clearTourTarget(){var n=document.querySelector('.tour-target');if(n)n.classList.remove('tour-target')}
function runTour(index,kind){if(!window.Swal)return;var steps=kind==='child'?[{s:'#levelTabs',t:'1. اختر المستوى',d:'اضغط على رقم المستوى الذي تريد أن تتعلم منه.'},{s:'#categoryChips',t:'2. اختر التصنيف',d:'اختر الحيوانات أو الطعام أو أي مجموعة أخرى تحبها.'},{s:'#stage',t:'3. انظر وسمِّ',d:'انظر للصورة أولًا وحاول قول الاسم بنفسك.'},{s:'#stageSpeakBtn',t:'4. استمع',d:'اضغط زر الصوت واسمع الكلمة ثم كررها.'},{s:'.bottom-nav',t:'5. تنقّل والعب',d:'استخدم السابق والتالي، أو زر الاختيار العشوائي للمراجعة.'}]:[{s:'#levelTabs',t:'1. اختر المستوى',d:'ابدأ بالمستوى الذي تريد تدريبه. عند تغييره يفتح أول تصنيف خاص به مباشرة.'},{s:'#categoryChips',t:'2. اختر التصنيف',d:'ابدأ بتصنيف واحد. بعد اختياره سينتقل التطبيق تلقائيًا إلى بطاقة التعلم.'},{s:'#stage',t:'3. الممارسة',d:'دع المتعلم ينظر ويشير أو يسمي قبل تشغيل النطق.'},{s:'#stageSpeakBtn',t:'4. استخدم الصوت بوعي',d:'شغّل النطق بعد محاولة المتعلم. يمكن تخصيص لغة النطق من الإعدادات.'},{s:'#viewSwitch',t:'5. المراجعة العشوائية',d:'بعد التعلم استخدم متنوع عشوائي 10 للمراجعة بين تصنيفات مختلفة.'},{s:'#advancedSettingsBtn',t:'6. الإعدادات المتقدمة',d:'اضبط لغة النطق والتشغيل التلقائي والسرعة ونطاق التنقل عند الحاجة.'}];if(index<0||index>=steps.length){clearTourTarget();return}clearTourTarget();var step=steps[index],target=document.querySelector(step.s);if(target){try{target.scrollIntoView({behavior:'smooth',block:'center'})}catch(e){}target.classList.add('tour-target')}setTimeout(function(){Swal.fire({title:step.t,text:step.d,showCloseButton:true,showDenyButton:index>0,confirmButtonText:index===steps.length-1?'إنهاء':'التالي',denyButtonText:'السابق',allowOutsideClick:false,customClass:{popup:'app360-help'}}).then(function(r){clearTourTarget();if(r.isConfirmed){if(index===steps.length-1)return;runTour(index+1,kind)}else if(r.isDenied)runTour(index-1,kind)})},220)}
function checkForUpdate(manual){if(!('serviceWorker' in navigator))return;navigator.serviceWorker.getRegistration('./').then(function(reg){if(!reg)return;reg.update().then(function(){if(reg.waiting)try{reg.waiting.postMessage({type:'SKIP_WAITING'})}catch(e){}if(manual){toast('جارٍ تحديث التطبيق إلى أحدث نسخة…');setTimeout(function(){location.reload()},900)}}).catch(function(){if(manual)toast('تعذر التحقق من التحديث الآن.')})})}
function initUpdateSystem(){if(!('serviceWorker' in navigator))return;var reloading=false;navigator.serviceWorker.addEventListener('controllerchange',function(){if(reloading)return;reloading=true;setTimeout(function(){location.reload()},160)});setTimeout(function(){checkForUpdate(false)},700);window.addEventListener('focus',function(){checkForUpdate(false)});document.addEventListener('visibilitychange',function(){if(!document.hidden)checkForUpdate(false)});var u=$('updateAppBtn');if(u)u.addEventListener('click',function(){checkForUpdate(true)},true)}
'''

if 'function openHelp()' not in s:
    s = s.replace('function bind(){', helper + '\nfunction bind(){')
s = s.replace("$('advancedSettingsBtn').onclick=openSettings;", "$('helpBtn').onclick=openHelp;$('advancedSettingsBtn').onclick=openSettings;")
s = s.replace('function init(){loadSettings();state.category=state.category||preferredCategoryId(state.level);bind();render();restart()}', 'function init(){loadSettings();state.category=state.category||preferredCategoryId(state.level);bind();render();restart();initUpdateSystem()}')
p.write_text(s, encoding='utf-8')

# ---------- styles-v19.css ----------
src = app / 'styles-v18.css'
p = app / 'styles-v19.css'
s = src.read_text(encoding='utf-8')
s += r'''
/* v19: clearer category groups, help tour and overflow fixes */
body{overflow-x:hidden}.learn-panel,.category-groups,.category-group{min-width:0;max-width:100%}.learn-panel{overflow:hidden}.category-row{display:flex;flex-wrap:wrap;gap:7px;max-width:100%;overflow:visible}.previous-categories{border:1px solid var(--line);border-radius:17px;background:#fbfefd;overflow:hidden}.previous-categories summary{cursor:pointer;padding:11px 13px;font-weight:900;color:var(--muted);list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px}.previous-categories summary::-webkit-details-marker{display:none}.previous-categories summary:after{content:'⌄';font-size:18px}.previous-categories[open] summary:after{transform:rotate(180deg)}.previous-categories .category-row{padding:0 10px 10px}.hero-tools .help-btn{background:#fff;color:var(--teal2)}.swal2-popup.app360-help{border-radius:24px!important;padding:18px!important}.help-sheet{text-align:right;color:var(--ink)}.help-tabs{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:10px}.help-tabs button{min-height:42px;border:1px solid var(--line);border-radius:12px;background:#fff;font-weight:900;color:var(--ink);cursor:pointer}.help-tabs button.is-active{background:var(--teal);color:#fff;border-color:var(--teal)}.help-card{padding:11px;border:1px solid var(--line);border-radius:15px;background:#f8fcfb;margin-top:8px}.help-body{font-size:13px;line-height:1.85;color:#38555b}.help-body ol{padding-inline-start:22px;margin:8px 0}.tour-target{outline:5px solid rgba(255,210,67,.9)!important;outline-offset:4px!important;position:relative;z-index:2600!important}.swal2-container{z-index:2700!important}html[dir="ltr"] .help-sheet{text-align:left}@media(max-width:760px){.category-row{flex-wrap:nowrap;overflow-x:auto;overscroll-behavior-x:contain;scrollbar-width:thin;padding-bottom:5px}.category-chip{flex:0 0 auto}.help-tabs{grid-template-columns:1fr}}
'''
p.write_text(s, encoding='utf-8')

# ---------- service worker ----------
p = app / 'sw.js'
s = p.read_text(encoding='utf-8')
s = s.replace('app360-app-say-and-name-v18', 'app360-app-say-and-name-v19')
s = s.replace('styles-v18.css?v=18', 'styles-v19.css?v=19')
s = s.replace('runtime-v18.js?v=18', 'runtime-v19.js?v=19')
s = s.replace('?v=18', '?v=19')
p.write_text(s, encoding='utf-8')
