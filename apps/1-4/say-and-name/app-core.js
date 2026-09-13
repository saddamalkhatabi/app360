'use strict';
var APP_ID='a1-first-words';
var SCHEMA='1.1';
var STORAGE_KEY='app360:'+APP_ID+':schema-'+SCHEMA+':sessions';
var words=[];
var selectedIds=[];
var session=null;
var currentIndex=0;
var selectedResponse='';
var storageOk=true;
var memorySessions=[];
var lastFinishedId='';
var RESPONSE_LABELS={pointed:'أشار',imitated:'قلّد أو حاول صوتًا',said:'قال الكلمة',used:'طلب أو استخدم', 'not-yet':'ليس بعد'};
var ASSIST_LABELS={none:'بدون مساعدة',hint:'تلميح بسيط',model:'نموذج كامل من المرافق'};
var $=function(id){return document.getElementById(id)};
function nowIso(){return new Date().toISOString()}
function uuid(prefix){return (prefix||'id')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
function safeText(v){return String(v==null?'':v)}
function byId(id){for(var i=0;i<words.length;i++)if(words[i].id===id)return words[i];return null}
function toast(msg){var n=$('toast');n.textContent=msg;n.classList.add('show');clearTimeout(toast.t);toast.t=setTimeout(function(){n.classList.remove('show')},2600)}
function playCue(name){try{var a=new Audio('audio/cues/'+name+'.wav');a.volume=.7;var p=a.play();if(p&&p.catch)p.catch(function(){})}catch(e){}}
function testStorage(){try{var k='__app360_test__';localStorage.setItem(k,'1');localStorage.removeItem(k);return true}catch(e){return false}}
function loadSessions(){
  storageOk=testStorage();
  $('storageBanner').hidden=storageOk;
  if(storageOk){try{var raw=localStorage.getItem(STORAGE_KEY);memorySessions=raw?JSON.parse(raw):[];if(!Array.isArray(memorySessions))memorySessions=[]}catch(e){memorySessions=[];storageOk=false;$('storageBanner').hidden=false}}
  renderLogCount();
}
function persistSessions(){
  if(!storageOk)return false;
  try{localStorage.setItem(STORAGE_KEY,JSON.stringify(memorySessions));return true}catch(e){storageOk=false;$('storageBanner').hidden=false;return false}
}
function formatDate(iso){try{return new Intl.DateTimeFormat('ar',{dateStyle:'medium',timeStyle:'short'}).format(new Date(iso))}catch(e){return new Date(iso).toLocaleString()}}
function renderLogCount(){$('logCount').textContent=String(memorySessions.length)}
function switchView(name){
  ['practice','log','guide'].forEach(function(v){$(v+'View').hidden=v!==name;var t=$('tab'+v.charAt(0).toUpperCase()+v.slice(1));if(t)t.classList.toggle('is-active',v===name)});
  if(name==='log')renderLog();
  window.scrollTo(0,0);
}
function setSelected(id,on){
  var ix=selectedIds.indexOf(id);
  if(on&&ix<0)selectedIds.push(id);
  if(!on&&ix>=0)selectedIds.splice(ix,1);
  renderWordGrid();
}
function renderWordGrid(){
  var grid=$('wordGrid');grid.innerHTML='';
  words.forEach(function(w){
    var b=document.createElement('button');b.type='button';b.className='word-choice'+(selectedIds.indexOf(w.id)>=0?' is-selected':'');b.setAttribute('aria-pressed',selectedIds.indexOf(w.id)>=0?'true':'false');
    b.innerHTML='<span class="check">✓</span><img src="assets/objects/'+w.id+'.svg" alt=""><strong>'+safeText(w.ar)+'</strong><small>شيء مألوف</small>';
    b.onclick=function(){setSelected(w.id,selectedIds.indexOf(w.id)<0)};grid.appendChild(b);
  });
  var c=selectedIds.length;
  $('selectionStatus').textContent=c?('تم اختيار '+c+' من 12'): 'اختر 3 أشياء على الأقل';
  $('startSessionBtn').disabled=c<3;
  $('startSessionBtn').textContent=c>=3?('ابدأ الجولة بـ '+c+' أشياء'):'ابدأ الجولة';
  $('selectAllBtn').textContent=c===words.length?'إلغاء الاختيار':'اختيار الكل';
}
function shuffle(arr){var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t}return a}
function startSession(){
  if(selectedIds.length<3)return;
  session={schema_version:SCHEMA,app_id:APP_ID,session_id:uuid('session'),started_at:nowIso(),completed_at:null,task_ids:shuffle(selectedIds),attempts:[],reflection:{note:'سجل مواقف تواصل وصفي؛ لا يتضمن درجة للنطق.'}};
  currentIndex=0;selectedResponse='';$('startPanel').hidden=true;$('finishPanel').hidden=true;$('sessionPanel').hidden=false;renderPractice();window.scrollTo(0,0);
}
function renderPractice(){
  if(!session)return;
  if(currentIndex>=session.task_ids.length){finishSession();return}
  selectedResponse='';
  var id=session.task_ids[currentIndex],w=byId(id);if(!w)return;
  $('practiceImage').src='assets/objects/'+w.id+'.svg';$('practiceImage').alt='صورة '+w.ar;$('practiceWord').textContent=w.ar;$('practiceHint').textContent=w.hint||'';
  $('progressText').textContent=(currentIndex+1)+' من '+session.task_ids.length;
  $('progressBar').style.width=((currentIndex/session.task_ids.length)*100)+'%';
  $('sessionSavedState').textContent=session.attempts.length?'تم حفظ '+session.attempts.length+' موقف':'غير محفوظ بعد';
  $('coachCard').hidden=true;$('childNote').value='';$('adultExpansion').value='';
  var radios=document.querySelectorAll('input[name="assist"]');for(var i=0;i<radios.length;i++)radios[i].checked=radios[i].value==='hint';
  var buttons=$('responseButtons').querySelectorAll('button');for(var j=0;j<buttons.length;j++)buttons[j].classList.remove('is-selected');
  $('audioStatus').textContent='اضغط للاستماع. إذا لم يتوفر صوت عربي على الجهاز، قل الكلمة أنت ببطء وبشكل طبيعي.';
  document.title=w.ar+' | كلماتي مع أشيائي';
}
function chooseResponse(type,button){
  selectedResponse=type;var buttons=$('responseButtons').querySelectorAll('button');for(var i=0;i<buttons.length;i++)buttons[i].classList.remove('is-selected');button.classList.add('is-selected');
  var w=byId(session.task_ids[currentIndex]);var ex=(w.expand||[w.ar])[0];
  if(type==='pointed')ex=(w.expand&&w.expand[1])||('هذه '+w.ar);
  else if(type==='imitated')ex=w.ar+'… نعم، '+w.ar;
  else if(type==='said')ex=(w.expand&&w.expand[2])||w.ar;
  else if(type==='used')ex=(w.expand&&w.expand[2])||('أريد '+w.ar);
  else if(type==='not-yet')ex=w.ar+' — قلها مرة ثم عد إلى اللعب.';
  $('expansionExample').textContent=ex;$('adultExpansion').placeholder='مثال: '+ex;$('coachCard').hidden=false;
  setTimeout(function(){$('coachCard').scrollIntoView({behavior:'smooth',block:'nearest'})},60);
}
function selectedAssist(){var r=document.querySelector('input[name="assist"]:checked');return r?r.value:'hint'}
function saveAttempt(){
  if(!session||!selectedResponse)return toast('اختر أولًا ما فعله الطفل.');
  var w=byId(session.task_ids[currentIndex]);
  var attempt={task_id:w.id,attempt_id:uuid('attempt'),timestamp:nowIso(),attempts:1,artifact:{word_id:w.id,word_ar:w.ar,response_type:selectedResponse,response_label_ar:RESPONSE_LABELS[selectedResponse],child_note:$('childNote').value.trim(),adult_expansion:$('adultExpansion').value.trim()||$('expansionExample').textContent},reflection:{facilitator_note:'اتبع الاهتمام، انتظر، ثم وسّع الاستجابة.'},assistance_level:selectedAssist()};
  session.attempts.push(attempt);playCue('saved');currentIndex++;renderPractice();
}
function skipAttempt(){if(!session)return;currentIndex++;renderPractice()}
function finishSession(){
  if(!session)return;session.completed_at=nowIso();session.summary={selected_count:session.task_ids.length,recorded_count:session.attempts.length};
  memorySessions.unshift(session);persistSessions();renderLogCount();lastFinishedId=session.session_id;
  $('sessionPanel').hidden=true;$('finishPanel').hidden=false;$('progressBar').style.width='100%';
  $('finishSummary').textContent='تم تسجيل '+session.attempts.length+' موقف من أصل '+session.task_ids.length+' صور مختارة. الإشارة والمحاولة والكلمة كلها تُحفظ كملاحظات وصفية فقط.';
  var counts={pointed:0,imitated:0,said:0,used:0,'not-yet':0};session.attempts.forEach(function(a){counts[a.artifact.response_type]=(counts[a.artifact.response_type]||0)+1});
  var parts=[];Object.keys(counts).forEach(function(k){if(counts[k])parts.push('<div class="stat"><b>'+counts[k]+'</b><span>'+RESPONSE_LABELS[k]+'</span></div>')});$('finishStats').innerHTML=parts.join('')||'<div class="stat"><b>0</b><span>مواقف مسجلة</span></div>';
  session=null;document.title='كلماتي مع أشيائي | مختبر التطبيق 360';playCue('saved');persistSessions();window.scrollTo(0,0);
}
function cancelSession(){
  if(session&&session.attempts.length&&!confirm('لديك مواقف في الجولة الحالية لم تُضف إلى السجل بعد. هل تريد العودة للاختيار؟'))return;
  session=null;$('sessionPanel').hidden=true;$('finishPanel').hidden=true;$('startPanel').hidden=false;window.scrollTo(0,0);
}
function newSession(){lastFinishedId='';$('finishPanel').hidden=true;$('startPanel').hidden=false;renderWordGrid();window.scrollTo(0,0)}
