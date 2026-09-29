(function(w,d){
'use strict';
var KEY='app360:a1-plan-runner:responsive-v2',state={sessions:[]},current=null;
function E(id){return d.getElementById(id)}
function txt(v){return String(v==null?'':v)}
function trim(v){return txt(v).replace(/^\s+|\s+$/g,'')}
function esc(v){return txt(v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]})}
function now(){try{return new Date().toISOString()}catch(e){return String(+new Date())}}
function uid(){return'rs-'+(+new Date()).toString(36)+'-'+Math.floor(Math.random()*99999).toString(36)}
function store(){try{return w.localStorage}catch(e){return null}}
function load(){var s=store(),x;if(!s)return;try{x=JSON.parse(s.getItem(KEY)||'null')}catch(e){}if(x&&x.sessions&&x.sessions.push)state=x}
function save(){var s=store();if(!s)return false;try{s.setItem(KEY,JSON.stringify(state));return true}catch(e){return false}}
function trigger(n){if(!n)return;try{if(n.click)n.click();else if(n.onclick)n.onclick()}catch(e){}}
function field(id,def){var n=E(id);return n?trim(n.value)||def:def}
var APPS={
 'a1-first-words':{title:'كلماتي مع أشيائي',href:'apps/1-4/say-and-name/index.html?v=26',role:'لغة ومفردات وربط الصورة بالواقع'},
 'a1-imitate':{title:'دوري ودورك',href:'apps/1-4/imitate-one-step/index.html?v=21',role:'تقليد وتبادل دور وانتباه مشترك'},
 'a1-screen-move':{title:'ألعاب إبداعية',href:'apps/1-4/screen-to-move/index.html?v=16',role:'حركة ولعب ورقي وانتقال من الشاشة للواقع'},
 'a1-drawing-writing':{title:'لوحة الرسم والكتابة المبكرة',href:'apps/1-4/drawing-writing-foundations/index.html?v=23',role:'رسم حر وتتبع وتعبير بصري'},
 'a1-calm':{title:'مشاعري معك',href:'apps/1-4/calm-with-me/index.html?v=10',role:'تنظيم مشترك ومساعدة وانتقال هادئ'},
 'a1-sensory':{title:'سلتي العجيبة',href:'apps/1-4/sensory-motion-missions/index.html?v=12',role:'لمس وفرز ونقل ولعب حسي حركي'},
 'a1-routine':{title:'أستطيع خطوة',href:'apps/1-4/my-little-routine/index.html?v=8',role:'عادات وروتين واستقلالية بالصور'},
 'a1-tangram':{title:'ألغاز تركيب الأشكال',href:'apps/1-4/tangram-builder/index.html?v=17',role:'تمييز الشكل والحجم والمطابقة البصرية الحركية وبناء صورة من القطع'},
 'a1-picture-puzzles':{title:'ألغاز الصور',href:'apps/1-4/picture-puzzles/index.html?v=3',role:'تركيب صورة حقيقية من قطع متدرجة وتنمية الملاحظة والاستمرار في المحاولة'}
};
var FOCUS={
 interaction:{label:'تفاعل مشترك',prompt:'اتبع ما بدأه الطفل، صف ما يفعله بكلمات قليلة، ثم انتظر قبل أن تقترح شيئًا جديدًا.',app:'a1-imitate'},
 language:{label:'لغة ووصف',prompt:'صف شيئًا واحدًا يراه الطفل، انتظر 3–5 ثوانٍ، ثم وسّع كلمة أو إشارة واحدة فقط.',app:'a1-first-words'},
 imitation:{label:'تقليد',prompt:'قلّد حركة الطفل أولًا، ثم اعرض حركة واحدة قصيرة يمكنه تقليدها أو تجاهلها.',app:'a1-imitate'},
 turn:{label:'تبادل دور',prompt:'اجعل الدور واضحًا: دوري ثم دورك، وانتظر دون استعجال أو تكرار الأوامر.',app:'a1-imitate'},
 transition:{label:'انتقال وتنظيم مشترك',prompt:'أعلن النهاية بهدوء قبلها بقليل، اعرض خيارًا بسيطًا للمساعدة، واسمح بالتوقف دون عقوبة.',app:'a1-calm'},
 independence:{label:'استقلالية مبكرة',prompt:'قسّم المهمة إلى خطوة واحدة واضحة، ساعد بقدر الحاجة فقط، ثم اترك مساحة للمحاولة الذاتية.',app:'a1-routine'},
 sensory:{label:'لعب حسي وحركي',prompt:'استخدم مواد كبيرة وآمنة، دع الطفل يلمس وينقل ويفرز بحرية، وصف الفعل بدل كثرة الأسئلة.',app:'a1-sensory'},
 creative:{label:'رسم وابتكار',prompt:'اعرض أداة أو شكلًا واحدًا ثم اترك للطفل مساحة يختار فيها الرسم أو العلامة التي يريدها.',app:'a1-drawing-writing'},
 matching:{label:'تركيب ومطابقة',prompt:'ابدأ بقطعتين أو ثلاث واضحتين، دع الطفل يلاحظ الشكل والحجم، وانتظر محاولته قبل تقريب القطعة أو الإشارة إلى مكانها.',app:'a1-tangram'},
 visual:{label:'ملاحظة الصورة وحل اللغز',prompt:'دع الطفل ينظر إلى الصورة أولًا، ثم يبحث عن جزء واضح منها ويجرب مكانه. امدح المحاولة نفسها قبل تصحيح الموضع.',app:'a1-picture-puzzles'}
};
function chooseApp(focus,energy){var f=FOCUS[focus]||FOCUS.interaction;if(energy==='move'&&(focus==='interaction'||focus==='sensory'))return APPS['a1-screen-move'];return APPS[f.app]||APPS['a1-imitate']}
function secondApp(focus,energy){if(focus==='transition')return APPS['a1-routine'];if(focus==='language')return APPS['a1-picture-puzzles'];if(focus==='independence')return APPS['a1-calm'];if(focus==='creative')return APPS['a1-first-words'];if(focus==='matching')return APPS['a1-picture-puzzles'];if(focus==='visual')return APPS['a1-first-words'];if(energy==='move')return APPS['a1-sensory'];return null}
function buildPlan(){var interest=field('rsInterest','ما يختاره الطفل الآن'),setting=field('rsSetting','home'),materials=field('rsMaterials','المواد المتاحة والآمنة'),energy=field('rsEnergy','mixed'),focus=field('rsFocus','interaction'),level=field('rsLevel','2-3'),minutes=parseInt(field('rsMinutes','8'),10)||8,f=FOCUS[focus]||FOCUS.interaction,app=chooseApp(focus,energy),app2=secondApp(focus,energy),settingLabel={home:'المنزل',floor:'الأرض',table:'الطاولة',outside:'الخارج'}[setting]||'المكان المتاح';return{
 id:uid(),created_at:now(),interest:interest,setting:settingLabel,materials:materials,energy:energy,focus:focus,focus_label:f.label,level:level,minutes:minutes,
 cards:[
  {title:'ابدأ من مبادرة الطفل',text:'ابدأ بما يجذب انتباهه الآن: '+interest+'. استخدم '+materials+' في '+settingLabel+' دون تحويل البداية إلى اختبار أو سؤال متكرر.',fallback:'إذا لم يبدأ اللعب: اعرض خيارين بسيطين فقط واترك له وقتًا للاختيار.'},
  {title:'استجابة المرافق',text:f.prompt,fallback:'إذا لم يناسب الأسلوب: قلّل الكلام وارجع إلى التقليد أو الوصف القصير.'},
  {title:'تطبيق مساند اختياري',text:'استخدم '+app.title+' لفترة قصيرة كنقطة انطلاق، ثم عد إلى اللعب الواقعي.',fallback:'إذا لم تحتج الشاشة: تجاوز هذه البطاقة واستمر في الواقع.',app_id:keyForApp(app),app:app},
  {title:'نهاية وانتقال متوقع',text:'قبل النهاية بقليل قل بوضوح: بقيت محاولة واحدة ثم ننتهي. اعرض ما سيأتي بعد ذلك بلغة قصيرة وهادئة.',fallback:'إذا أصبح الانتقال صعبًا: خفف المطلوب، قدّم مساعدة واحدة، ويمكن التوقف.'}
 ],
 app:app,app2:app2,reminder:f.prompt,reflection:null
 }}
function keyForApp(a){var k;for(k in APPS)if(APPS[k]===a)return k;return''}
function renderCurrent(){var box=E('rsPlan'),p=current,i,h='';if(!box)return;if(!p){box.innerHTML='<div class="rs-empty">املأ البداية السريعة ثم اضغط «كوّن جلسة قصيرة».</div>';return}h='<div class="rs-plan-head"><div><span class="pr-kicker">جلسة قابلة للتعديل</span><h3>'+esc(p.focus_label)+' · '+esc(p.minutes)+' دقائق تقريبًا</h3></div><span class="rs-safe">لا تقييم ولا تشخيص</span></div><div class="rs-card-row">';for(i=0;i<p.cards.length;i++){h+='<article class="rs-card"><span class="n">'+(i+1)+'</span><h4>'+esc(p.cards[i].title)+'</h4><p>'+esc(p.cards[i].text)+'</p><small><b>بديل أبسط:</b> '+esc(p.cards[i].fallback)+'</small></article>'}h+='</div><div class="rs-app-pick"><div><b>التطبيق المساند المقترح: '+esc(p.app.title)+'</b><small>'+esc(p.app.role)+'</small></div><a class="btn" href="'+esc(rootUrl(p.app.href))+'" target="_blank">فتح التطبيق</a></div>';if(p.app2)h+='<div class="rs-app-pick"><div><b>مساند إضافي اختياري: '+esc(p.app2.title)+'</b><small>'+esc(p.app2.role)+'</small></div><a class="btn" href="'+esc(rootUrl(p.app2.href))+'" target="_blank">فتح المساند</a></div>';h+='<div class="rs-reminder"><b>تذكير واحد أثناء اللعب:</b> '+esc(p.reminder)+'</div><div class="rs-actions"><button id="rsHideScreen" type="button">🌙 أخفِ الشاشة واستمر باللعب</button><button id="rsToBuilder" class="primary" type="button">حوّل المساند إلى خطة تنفيذ</button><button id="rsSaveSession" type="button">حفظ الجلسة</button></div>';box.innerHTML=h;E('rsHideScreen').onclick=showMask;E('rsToBuilder').onclick=toBuilder;E('rsSaveSession').onclick=function(){persistCurrent(false)}}
function rootUrl(path){var p=w.location.pathname||'/',i=p.indexOf('/apps/');var prefix=i>=0?p.substring(0,i+1):p.substring(0,p.lastIndexOf('/')+1);return (w.location.origin||(w.location.protocol+'//'+w.location.host))+prefix+txt(path).replace(/^\/+/, '')}
function generate(){current=buildPlan();renderCurrent();E('rsReflectionBox').hidden=false;try{E('rsPlan').scrollIntoView()}catch(e){}}
function showMask(){var m=E('rsScreenMask'),t=E('rsMaskText');if(!m)return;if(t)t.innerHTML=esc(current?current.reminder:'تابع مبادرة الطفل وانتظر قبل المساعدة.');m.className='rs-screen-mask on';m.setAttribute('aria-hidden','false')}
function hideMask(){var m=E('rsScreenMask');if(!m)return;m.className='rs-screen-mask';m.setAttribute('aria-hidden','true')}
function persistCurrent(withReflection){if(!current)return;var p=JSON.parse(JSON.stringify(current));if(withReflection){p.reflection={child_initiative:field('rsChildNote',''),caregiver_response:field('rsCaregiverNote',''),what_changed:field('rsChangedNote',''),next_adjustment:field('rsNextNote','')}}var found=-1,i;for(i=0;i<state.sessions.length;i++)if(state.sessions[i].id===p.id){found=i;break}if(found>=0)state.sessions[found]=p;else state.sessions.unshift(p);if(state.sessions.length>30)state.sessions=state.sessions.slice(0,30);save();renderHistory();var n=E('rsSavedNote');if(n)n.innerHTML=withReflection?'حُفظت المراجعة والتعديل القادم.':'حُفظت الجلسة محليًا.'}
function toBuilder(){if(!current)return;var nb=E('newPlanBtn'),pt=E('planTitle'),pl=E('planLevel'),mt=E('manualTitle'),mu=E('manualUrl'),ms=E('manualSeconds'),ab=E('addManualBtn'),app=current.app,app2=current.app2;trigger(nb);if(pt){pt.value='جلسة مستجيبة · '+current.focus_label;if(pt.onchange)pt.onchange()}if(pl){pl.value=current.level||'custom';if(pl.onchange)pl.onchange()}function add(title,url,seconds){if(!mt||!mu||!ms||!ab)return;mt.value=title;mu.value=url;ms.value=seconds;trigger(ab)}add(app.title+' · مساند قصير',app.href,Math.max(30,Math.round(current.minutes*60*.25)));add('لعب واقعي · '+current.focus_label,'apps/1-4/plan-runner-360/real-play.html?v=2&prompt='+encodeURIComponent(current.reminder)+'&interest='+encodeURIComponent(current.interest),Math.max(60,Math.round(current.minutes*60*.5)));if(app2)add(app2.title+' · عند الحاجة',app2.href,Math.max(30,Math.round(current.minutes*60*.2)));var b=d.querySelector?d.querySelector('#mainTabs [data-tab="builder"]'):null;trigger(b)}
function saveReflection(){if(!current){var n=E('rsSavedNote');if(n)n.innerHTML='كوّن جلسة أولًا.';return}persistCurrent(true)}
function renderHistory(){var box=E('rsHistory'),h='',i,p;if(!box)return;for(i=0;i<state.sessions.length&&i<8;i++){p=state.sessions[i];h+='<article><b>'+esc(p.focus_label||'جلسة')+' · '+esc(p.interest||'')+'</b><small>'+esc(p.created_at||'')+(p.reflection&&p.reflection.next_adjustment?' · التعديل القادم: '+esc(p.reflection.next_adjustment):'')+'</small></article>'}box.innerHTML=h||'<div class="rs-empty">لا توجد جلسات مستجيبة محفوظة بعد.</div>'}
function renderCoverage(){var box=E('rsCoverage'),order=['a1-first-words','a1-imitate','a1-screen-move','a1-drawing-writing','a1-calm','a1-sensory','a1-routine','a1-tangram','a1-picture-puzzles'],h='',i,a;if(!box)return;for(i=0;i<order.length;i++){a=APPS[order[i]];h+='<div class="rs-app-chip"><b>'+esc(a.title)+'</b><small>'+esc(a.role)+'</small></div>'}box.innerHTML=h}
function bind(){var g=E('rsGenerate'),r=E('rsSaveReflection'),x=E('rsMaskReturn');if(g)g.onclick=generate;if(r)r.onclick=saveReflection;if(x)x.onclick=hideMask;renderCoverage();renderHistory();renderCurrent()}
function boot(){load();bind()}
if(d.readyState==='loading'){if(d.addEventListener)d.addEventListener('DOMContentLoaded',boot,false);else if(w.attachEvent)w.attachEvent('onload',boot)}else boot();
})(window,document);