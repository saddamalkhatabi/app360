'use strict';
function speakCurrent(){
  if(!session)return;var w=byId(session.task_ids[currentIndex]);if(!w)return;playCue('listen');
  if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined'){$('audioStatus').textContent='لا يتوفر نطق آلي هنا. قل أنت: «'+w.ar+'»';toast('قل أنت الكلمة: '+w.ar);return}
  try{
    speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(w.ar);u.lang='ar-SA';u.rate=.72;u.pitch=1.02;u.volume=1;
    var vs=speechSynthesis.getVoices?speechSynthesis.getVoices():[],voice=null;for(var i=0;i<vs.length;i++){if(/^ar(-|_)/i.test(vs[i].lang)){voice=vs[i];break}}if(voice)u.voice=voice;
    u.onstart=function(){$('audioStatus').textContent='استمعوا للاسم، ثم ابحثوا عن الشيء الحقيقي.'};u.onerror=function(){$('audioStatus').textContent='تعذر النطق الآلي. قل أنت: «'+w.ar+'»'};speechSynthesis.speak(u);
  }catch(e){$('audioStatus').textContent='تعذر النطق الآلي. قل أنت: «'+w.ar+'»'}
}
function facilitatorSpeak(){if(!session)return;var w=byId(session.task_ids[currentIndex]);$('audioStatus').textContent='قل ببطء وبصوت طبيعي: «'+w.ar+'» ثم انتظر استجابة الطفل.';playCue('listen')}
function renderLog(){
  var list=$('sessionList');list.innerHTML='';$('logEmpty').style.display=memorySessions.length?'none':'block';
  memorySessions.forEach(function(s){var item=document.createElement('article');item.className='session-item';var n=(s.attempts||[]).length;item.innerHTML='<div><h3>جولة فيها '+n+' موقف تواصل</h3><p>'+formatDate(s.completed_at||s.started_at)+' · '+(s.task_ids?s.task_ids.length:n)+' أشياء مختارة</p></div><div class="session-actions"><button class="ghost open" type="button">فتح</button><button class="ghost danger del" type="button">حذف</button></div>';
    item.querySelector('.open').onclick=function(){openSessionDetail(s.session_id)};item.querySelector('.del').onclick=function(){deleteSession(s.session_id)};list.appendChild(item);
  });
}
function openSessionDetail(id){
  var s=null;for(var i=0;i<memorySessions.length;i++)if(memorySessions[i].session_id===id){s=memorySessions[i];break}if(!s)return;
  var html='<span class="pill">سجل جولة</span><h2 id="detailTitle">'+(s.attempts||[]).length+' مواقف تواصل</h2><p class="muted">'+formatDate(s.completed_at||s.started_at)+' — هذا سجل وصفي وليس درجة.</p>';
  (s.attempts||[]).forEach(function(a){var w=byId(a.task_id)||{ar:a.artifact.word_ar,id:a.task_id};html+='<article class="detail-attempt"><img src="assets/objects/'+safeText(w.id)+'.svg" alt=""><div><strong>'+safeText(w.ar)+'</strong><p><b>الاستجابة:</b> '+safeText(a.artifact.response_label_ar)+'</p>'+(a.artifact.child_note?'<p><b>ملاحظة:</b> '+escapeHtml(a.artifact.child_note)+'</p>':'')+'<p><b>توسيع المرافق:</b> '+escapeHtml(a.artifact.adult_expansion||'—')+'</p><p><b>المساعدة:</b> '+safeText(ASSIST_LABELS[a.assistance_level]||'—')+'</p></div></article>'});
  $('detailContent').innerHTML=html;$('detailDialog').hidden=false;$('closeDetailBtn').focus();
}
function closeDetail(){$('detailDialog').hidden=true}
function deleteSession(id){if(!confirm('حذف هذه الجولة من هذا الجهاز؟'))return;memorySessions=memorySessions.filter(function(s){return s.session_id!==id});persistSessions();renderLogCount();renderLog();toast('تم حذف الجولة من هذا الجهاز.')}
function escapeHtml(s){return safeText(s).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]})}
function download(name,type,text){var blob=new Blob([text],{type:type});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(url);a.remove()},100)}
function exportJson(){var pack={schema_version:SCHEMA,app_id:APP_ID,exported_at:nowIso(),sessions:memorySessions};download('kalimati-communication-log.json','application/json;charset=utf-8',JSON.stringify(pack,null,2));toast('تم تجهيز ملف JSON.')}
function exportTxt(){
  var lines=['كلماتي مع أشيائي — سجل مواقف التواصل','ملاحظة: سجل وصفي، لا درجة آلية للنطق.',''];
  memorySessions.forEach(function(s,ix){lines.push('الجولة '+(ix+1)+' — '+formatDate(s.completed_at||s.started_at));(s.attempts||[]).forEach(function(a){lines.push('• '+a.artifact.word_ar+' | '+a.artifact.response_label_ar+' | '+(ASSIST_LABELS[a.assistance_level]||''));if(a.artifact.child_note)lines.push('  ملاحظة الطفل: '+a.artifact.child_note);if(a.artifact.adult_expansion)lines.push('  توسيع المرافق: '+a.artifact.adult_expansion)});lines.push('')});
  download('kalimati-communication-log.txt','text/plain;charset=utf-8',lines.join('\n'));toast('تم تجهيز الملف النصي.')
}
function bind(){
  document.querySelectorAll('.tab').forEach(function(b){b.addEventListener('click',function(){switchView(b.getAttribute('data-view'))})});
  $('selectAllBtn').onclick=function(){selectedIds=selectedIds.length===words.length?[]:words.map(function(w){return w.id});renderWordGrid()};$('startSessionBtn').onclick=startSession;$('backToSelectionBtn').onclick=cancelSession;
  $('speakBtn').onclick=speakCurrent;$('facilitatorModeBtn').onclick=facilitatorSpeak;
  $('responseButtons').querySelectorAll('button').forEach(function(b){b.onclick=function(){chooseResponse(b.getAttribute('data-response'),b)}});
  $('saveAttemptBtn').onclick=saveAttempt;$('skipAttemptBtn').onclick=skipAttempt;$('newSessionBtn').onclick=newSession;$('openFinishedLogBtn').onclick=function(){switchView('log');if(lastFinishedId)setTimeout(function(){openSessionDetail(lastFinishedId)},80)};
  $('exportJsonBtn').onclick=exportJson;$('exportTxtBtn').onclick=exportTxt;$('closeDetailBtn').onclick=closeDetail;$('detailDialog').onclick=function(e){if(e.target===$('detailDialog'))closeDetail()};
  document.addEventListener('keydown',function(e){if(e.key==='Escape'&&!$('detailDialog').hidden)closeDetail()});
}
function init(){
  loadSessions();bind();
  fetch('data/words.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('words');return r.json()}).then(function(data){words=data.items||[];selectedIds=words.slice(0,4).map(function(w){return w.id});renderWordGrid()}).catch(function(){
    $('wordGrid').innerHTML='<div class="banner warn">تعذر تحميل بطاقات الكلمات. أعد فتح التطبيق أو استخدم زر التحديث.</div>';$('startSessionBtn').disabled=true;
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
