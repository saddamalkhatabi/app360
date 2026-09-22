(function(w,d){
'use strict';
var KEY='app360:a1-calm:link-plan-v1';
var VERSION='5';
var DEFAULTS=[
{id:'words',icon:'🗣️',title:'كلماتي مع أشيائي: اسمع وأشر وسمِّ',url:'apps/1-4/say-and-name/index.html',seconds:90,kind:'internal'},
{id:'imitate',icon:'👏',title:'دوري ودورك: قلّد حركة واحدة',url:'apps/1-4/imitate-one-step/index.html',seconds:90,kind:'internal'},
{id:'screen-move',icon:'🧩',title:'ألعاب إبداعية عبر الشاشة — أو بدون الشاشة',url:'apps/1-4/screen-to-move/index.html',seconds:120,kind:'internal'},
{id:'drawing',icon:'✏️',title:'لوحة الطفل للرسم والكتابة المبكرة',url:'apps/1-4/drawing-writing-foundations/index.html?v=23',seconds:120,kind:'internal'},
{id:'safe-reels',icon:'▶️',title:'الريلز الآمن 360',url:'https://yem1.com',seconds:120,kind:'external'}
];
var state=null;
var run=null;
var currentIndex=-1;
var deadline=0;
var timer=null;
var externalWin=null;
var $=function(id){return d.getElementById(id)};
function text(v){return String(v==null?'':v)}
function trim(v){return text(v).replace(/^\s+|\s+$/g,'')}
function esc(s){return text(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function now(){return new Date().toISOString()}
function uid(p){return(p||'id')+'-'+(+new Date()).toString(36)+'-'+Math.floor(Math.random()*99999)}
function copy(o){try{return JSON.parse(JSON.stringify(o))}catch(e){return o}}
function clampSeconds(v){v=parseInt(v,10);if(isNaN(v))v=60;if(v<5)v=5;if(v>3600)v=3600;return v}
function rootHref(){var a=d.createElement('a');a.href='../../../';return a.href}
function normalizeUrl(u){u=trim(u);if(!u)return'';if(/^www\./i.test(u))u='https://'+u;if(/^[^\s\/]+\.[a-z]{2,}(\/|$)/i.test(u)&&!/^https?:\/\//i.test(u))u='https://'+u;if(/^https?:\/\//i.test(u))return u;if(/^\/\//.test(u)||u.indexOf('..')>=0)return'';return u.replace(/^\/+/, '')}
function resolveUrl(u){var n=normalizeUrl(u),a;if(!n)return'';if(/^https?:\/\//i.test(n))return n;a=d.createElement('a');a.href=rootHref()+n;return a.href}
function isExternal(u){return /^https?:\/\//i.test(normalizeUrl(u))}
function defaultStep(x){return {step_id:uid('step'),source_id:x.id,title:x.title,url:x.url,seconds:x.seconds,icon:x.icon,kind:x.kind||'internal'}}
function freshState(){var a=[],i;for(i=0;i<DEFAULTS.length;i++)a.push(defaultStep(DEFAULTS[i]));return {schema_version:'1.0',app_id:'a1-calm',feature:'timed-link-plan',version:VERSION,initialized:true,plan:a,custom_links:[],history:[],updated_at:now()}}
function load(){var x=null;try{x=JSON.parse(w.localStorage.getItem(KEY)||'null')}catch(e){x=null}if(!x||!x.initialized)x=freshState();if(!x.plan)x.plan=[];if(!x.custom_links)x.custom_links=[];if(!x.history)x.history=[];state=x;save()}
function save(){state.updated_at=now();try{w.localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){setStatus('الحفظ المحلي غير متاح؛ يمكن استخدام الخطة الحالية حتى إغلاق الصفحة.');return false}}
function setStatus(msg){var n=$('lpStatus');if(n)n.innerHTML=esc(msg)}
function sourceInPlan(id){var i;for(i=0;i<state.plan.length;i++)if(state.plan[i].source_id===id)return true;return false}
function defaultById(id){var i;for(i=0;i<DEFAULTS.length;i++)if(DEFAULTS[i].id===id)return DEFAULTS[i];return null}
function customById(id){var i;for(i=0;i<state.custom_links.length;i++)if(state.custom_links[i].id===id)return state.custom_links[i];return null}
function libraryHtml(){var h='',i,x,inPlan;for(i=0;i<DEFAULTS.length;i++){x=DEFAULTS[i];inPlan=sourceInPlan(x.id);h+='<div class="lp-lib '+(x.kind==='external'?'external':'')+'"><span class="ico">'+x.icon+'</span><strong>'+esc(x.title)+'</strong><small>'+(x.kind==='external'?'رابط خارجي جاهز':'تطبيق من الفئة 1-4')+' · '+clampSeconds(x.seconds)+' ثانية افتراضيًا</small><button type="button" onclick="App360LinkPlan.addDefault(\''+x.id+'\')" '+(inPlan?'disabled':'')+'>'+(inPlan?'موجود في الخطة':'أضف للخطة')+'</button></div>'}
for(i=0;i<state.custom_links.length;i++){x=state.custom_links[i];h+='<div class="lp-lib '+(isExternal(x.url)?'external':'')+'"><span class="ico">🔗</span><strong>'+esc(x.title)+'</strong><small>'+esc(x.url)+'</small><button type="button" onclick="App360LinkPlan.addCustomSaved(\''+x.id+'\')">أضف للخطة</button></div>'}
return h}
function planHtml(){var h='',i,s;if(!state.plan.length)return '<div class="lp-empty">الخطة فارغة. أضف رابطًا من المكتبة الجاهزة أو أضف رابطك الخاص.</div>';for(i=0;i<state.plan.length;i++){s=state.plan[i];h+='<div class="lp-step"><span class="lp-num">'+(i+1)+'</span><div class="lp-step-main"><div class="lp-step-title">'+esc(s.icon||'🔗')+' '+esc(s.title)+'</div><div class="lp-url">'+esc(s.url)+'</div></div><div class="lp-duration"><input type="number" min="5" max="3600" value="'+clampSeconds(s.seconds)+'" onchange="App360LinkPlan.duration('+i+',this.value)" aria-label="مدة الخطوة بالثواني"><span> ثانية</span></div><div class="lp-actions"><button type="button" onclick="App360LinkPlan.test('+i+')">اختبار الرابط</button><button type="button" onclick="App360LinkPlan.move('+i+',-1)">↑</button><button type="button" onclick="App360LinkPlan.move('+i+',1)">↓</button><button type="button" class="danger" onclick="App360LinkPlan.remove('+i+')">حذف</button></div></div>'}return h}
function historyHtml(){var h='',i,r;if(!state.history.length)return '<div class="lp-empty">لم تُنفذ خطة بعد. سيظهر هنا سجل كل تشغيل.</div>';for(i=0;i<state.history.length&&i<8;i++){r=state.history[i];h+='<div class="lp-history-item"><strong>'+esc(r.status==='completed'?'✓ اكتملت الخطة':'توقفت الخطة')+'</strong> · '+esc(formatDate(r.started_at))+'<br><small>'+((r.steps&&r.steps.length)||0)+' خطوة مسجلة'+(r.finished_at?' · انتهت '+esc(formatDate(r.finished_at)):'')+'</small></div>'}return h}
function formatDate(v){try{return new Date(v).toLocaleString('ar')}catch(e){return text(v)}}
function render(){var p=$('lpPlan'),l=$('lpLibrary'),h=$('lpHistory'),b=$('lpStart');if(p)p.innerHTML=planHtml();if(l)l.innerHTML=libraryHtml();if(h)h.innerHTML=historyHtml();if(b)b.disabled=!state.plan.length;setStatus(state.plan.length?'الخطة جاهزة: '+state.plan.length+' خطوة. عدّل الزمن ثم اضغط «ابدأ الخطة».':'أضف خطوة واحدة على الأقل.')}
function addDefault(id){var x=defaultById(id);if(!x||sourceInPlan(id))return;state.plan.push(defaultStep(x));save();render()}
function addCustomSaved(id){var x=customById(id);if(!x)return;state.plan.push({step_id:uid('step'),source_id:'custom:'+x.id,title:x.title,url:x.url,seconds:clampSeconds(x.seconds),icon:'🔗',kind:isExternal(x.url)?'external':'internal'});save();render()}
function addManual(){var title=trim($('lpCustomTitle').value),url=normalizeUrl($('lpCustomUrl').value),seconds=clampSeconds($('lpCustomSeconds').value);if(!title){setStatus('اكتب اسمًا واضحًا للرابط.');return}if(!url){setStatus('الرابط غير صالح. استخدم رابط https أو مسارًا داخليًا بدون ..');return}var x={id:uid('link'),title:title,url:url,seconds:seconds};state.custom_links.unshift(x);state.plan.push({step_id:uid('step'),source_id:'custom:'+x.id,title:title,url:url,seconds:seconds,icon:'🔗',kind:isExternal(url)?'external':'internal'});$('lpCustomTitle').value='';$('lpCustomUrl').value='';$('lpCustomSeconds').value='60';save();render();setStatus('تمت إضافة الرابط إلى المكتبة وإلى الخطة الحالية.')}
function duration(i,v){if(!state.plan[i])return;state.plan[i].seconds=clampSeconds(v);save();render()}
function move(i,dir){var j=i+dir,t;if(i<0||i>=state.plan.length||j<0||j>=state.plan.length)return;t=state.plan[i];state.plan[i]=state.plan[j];state.plan[j]=t;save();render()}
function removeStep(i){if(i<0||i>=state.plan.length)return;state.plan.splice(i,1);save();render()}
function resetPlan(){if(!w.confirm('إعادة الخطة إلى الروابط الافتراضية الخمسة؟'))return;state.plan=[];var i;for(i=0;i<DEFAULTS.length;i++)state.plan.push(defaultStep(DEFAULTS[i]));save();render()}
function test(i){var s=state.plan[i],u=s&&resolveUrl(s.url);if(!u){setStatus('الرابط غير صالح.');return}var x=w.open(u,'_blank');if(!x)setStatus('المتصفح منع فتح الرابط. اسمح بالنوافذ الجديدة أو استخدم بدء الخطة.')}
function resizeFrame(){var f=$('lpFrame'),bar=$('lpRunBar'),h;if(!f)return;h=(w.innerHeight||d.documentElement.clientHeight||700)-(bar?bar.offsetHeight:120)-8;if(h<320)h=320;f.style.height=h+'px'}
function showRunner(on){var setup=$('lpSetup'),runner=$('lpRunner');if(setup)setup.style.display=on?'none':'block';if(runner)runner.className=on?'lp-runner show':'lp-runner';if(on){w.scrollTo(0,0);setTimeout(resizeFrame,20)}}
function closeExternal(){try{if(externalWin&&!externalWin.closed)externalWin.close()}catch(e){}externalWin=null}
function start(){if(!state.plan.length){setStatus('الخطة فارغة.');return}stopTimer();closeExternal();run={run_id:uid('run'),started_at:now(),finished_at:'',status:'running',steps:[]};currentIndex=0;showRunner(true);openCurrent()}
function currentStep(){return state.plan[currentIndex]||null}
function openCurrent(){var s=currentStep(),u,f,note;if(!s){finish();return}closeExternal();u=resolveUrl(s.url);if(!u){recordCurrent('invalid');nextInternal();return}f=$('lpFrame');$('lpRunCount').innerHTML='الخطوة '+(currentIndex+1)+' من '+state.plan.length;$('lpRunTitle').innerHTML=esc((s.icon||'🔗')+' '+s.title);$('lpRunUrl').innerHTML=esc(s.url);note=$('lpExternalNote');if(note)note.className=isExternal(s.url)?'lp-external-note show':'lp-external-note';if(f){f.src='about:blank';setTimeout(function(){try{f.src=u}catch(e){}},25)}deadline=(+new Date())+clampSeconds(s.seconds)*1000;run.steps.push({index:currentIndex,step_id:s.step_id,title:s.title,url:s.url,planned_seconds:clampSeconds(s.seconds),started_at:now(),ended_at:'',result:'running'});updateTimer();stopTimer();timer=w.setInterval(tick,1000);resizeFrame()}
function updateTimer(){var remain=Math.ceil((deadline-(+new Date()))/1000);if(remain<0)remain=0;var m=Math.floor(remain/60),s=remain%60,n=$('lpTimer');if(n)n.innerHTML=(m<10?'0':'')+m+':'+(s<10?'0':'')+s}
function tick(){updateTimer();if((+new Date())>=deadline){recordCurrent('time-finished');currentIndex++;openCurrent()}}
function recordCurrent(result){var a=run&&run.steps&&run.steps.length?run.steps[run.steps.length-1]:null;if(a&&a.result==='running'){a.ended_at=now();a.result=result}}
function next(){if(!run)return;recordCurrent('next-manual');currentIndex++;openCurrent()}
function previous(){if(!run||currentIndex<=0)return;recordCurrent('previous');currentIndex--;openCurrent()}
function nextInternal(){currentIndex++;openCurrent()}
function finish(){stopTimer();recordCurrent('completed');closeExternal();if(run){run.status='completed';run.finished_at=now();state.history.unshift(run);if(state.history.length>30)state.history=state.history.slice(0,30);save()}run=null;currentIndex=-1;var f=$('lpFrame');if(f)f.src='about:blank';showRunner(false);render();setStatus('✓ اكتملت الخطة وتم تسجيل التجربة في سجل التنفيذ.')}
function stop(){if(!run){showRunner(false);return}stopTimer();recordCurrent('stopped');closeExternal();run.status='stopped';run.finished_at=now();state.history.unshift(run);if(state.history.length>30)state.history=state.history.slice(0,30);save();run=null;currentIndex=-1;var f=$('lpFrame');if(f)f.src='about:blank';showRunner(false);render();setStatus('تم إيقاف الخطة وحفظ ما تم تنفيذه حتى هذه اللحظة.')}
function stopTimer(){if(timer){w.clearInterval(timer);timer=null}}
function openExternal(){var s=currentStep(),u=s&&resolveUrl(s.url);if(!u)return;try{externalWin=w.open(u,'app360_link_plan_external');if(!externalWin)setStatus('المتصفح منع التبويب الجديد. استخدم الصفحة داخل الإطار أو اسمح بالنوافذ الجديدة.')}catch(e){setStatus('تعذر فتح تبويب جديد.') }}
function exportData(){var obj={schema_version:'1.0',app_id:'a1-calm',feature:'timed-link-plan',exported_at:now(),plan:state.plan,custom_links:state.custom_links,history:state.history},raw=JSON.stringify(obj,null,2),ta=$('lpTransfer');ta.value=raw;ta.style.display='block';try{ta.focus();ta.select();if(d.execCommand&&d.execCommand('copy'))setStatus('تم تجهيز السجل ونسخه.')}catch(e){setStatus('تم تجهيز السجل. حدده وانسخه يدويًا.')}}
function clearHistory(){if(!w.confirm('حذف سجل التنفيذ فقط؟ لن تُحذف الخطة الحالية.'))return;state.history=[];save();render()}
function init(){load();render();var f=$('lpFrame');if(f)f.onload=function(){var n=$('lpFrameStatus');if(n)n.innerHTML='تم فتح الصفحة. استخدمها بشكل طبيعي حتى ينتهي المؤقت أو اضغط «التالي الآن».'};if(w.addEventListener){w.addEventListener('resize',resizeFrame,false);w.addEventListener('orientationchange',resizeFrame,false)}}
w.App360LinkPlan={addDefault:addDefault,addCustomSaved:addCustomSaved,addManual:addManual,duration:duration,move:move,remove:removeStep,reset:resetPlan,test:test,start:start,next:next,previous:previous,stop:stop,openExternal:openExternal,exportData:exportData,clearHistory:clearHistory};
if(d.readyState==='loading'){if(d.addEventListener)d.addEventListener('DOMContentLoaded',init,false);else w.attachEvent&&w.attachEvent('onload',init)}else init();
})(window,document);
