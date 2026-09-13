'use strict';
var categories=[];
var activeCategory='mixed';
var browseItems=[];
var browseIndex=0;
var MAX_SESSION_ITEMS=12;
var DEFAULT_MIX_COUNT=6;

function escapeHtml(s){return safeText(s).replace(/[&<>\"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]})}
function ensureBrowserStyles(){
  if(document.getElementById('categoryBrowserStyles'))return;
  var link=document.createElement('link');link.id='categoryBrowserStyles';link.rel='stylesheet';link.href='browser.css?v=1';document.head.appendChild(link);
}
function categoryById(id){for(var i=0;i<categories.length;i++)if(categories[i].id===id)return categories[i];return null}
function categoryLabel(w){var c=categoryById(w&&w.category);return c?c.label_ar:'كلمات متنوعة'}
function mixedWords(){
  var groups=[],i,j,max=0,out=[];
  for(i=0;i<categories.length;i++){
    var g=[];for(j=0;j<words.length;j++)if(words[j].category===categories[i].id)g.push(words[j]);
    groups.push(g);if(g.length>max)max=g.length;
  }
  for(j=0;j<max;j++)for(i=0;i<groups.length;i++)if(groups[i][j])out.push(groups[i][j]);
  return out.length?out:words.slice();
}
function currentCategoryWords(){
  if(activeCategory==='mixed')return mixedWords();
  var out=[];for(var i=0;i<words.length;i++)if(words[i].category===activeCategory)out.push(words[i]);return out;
}
function rebuildBrowse(reset){browseItems=currentCategoryWords();if(reset)browseIndex=0;if(browseIndex>=browseItems.length)browseIndex=Math.max(0,browseItems.length-1)}
function wordVisualMarkup(w,context){
  if(w&&w.asset)return '<img src="'+escapeHtml(w.asset)+'" alt="">';
  return '<span class="'+(context==='browser'?'browser-emoji':'word-emoji')+'" aria-hidden="true">'+escapeHtml((w&&w.emoji)||'🔹')+'</span>';
}
function speakWord(w,where){
  if(!w)return;playCue('listen');
  var msgTarget=$('audioStatus');
  if(!('speechSynthesis'in window)||typeof SpeechSynthesisUtterance==='undefined'){
    if(msgTarget)msgTarget.textContent='لا يتوفر نطق آلي هنا. قل أنت: «'+w.ar+'»';
    toast('قل أنت الكلمة: '+w.ar);return;
  }
  try{
    speechSynthesis.cancel();var u=new SpeechSynthesisUtterance(w.ar);u.lang='ar-SA';u.rate=.72;u.pitch=1.02;u.volume=1;
    var vs=speechSynthesis.getVoices?speechSynthesis.getVoices():[],voice=null;for(var i=0;i<vs.length;i++){if(/^ar(-|_)/i.test(vs[i].lang)){voice=vs[i];break}}if(voice)u.voice=voice;
    u.onstart=function(){if(msgTarget&&where==='session')msgTarget.textContent='استمعوا للاسم، ثم ابحثوا عن الشيء الحقيقي.'};
    u.onerror=function(){if(msgTarget&&where==='session')msgTarget.textContent='تعذر النطق الآلي. قل أنت: «'+w.ar+'»'};
    speechSynthesis.speak(u);
  }catch(e){if(msgTarget&&where==='session')msgTarget.textContent='تعذر النطق الآلي. قل أنت: «'+w.ar+'»'}
}
function speakCurrent(){if(!session)return;var w=byId(session.task_ids[currentIndex]);speakWord(w,'session')}
function facilitatorSpeak(){if(!session)return;var w=byId(session.task_ids[currentIndex]);$('audioStatus').textContent='قل ببطء وبصوت طبيعي: «'+w.ar+'» ثم انتظر استجابة الطفل.';playCue('listen')}

function injectBrowser(){
  ensureBrowserStyles();
  var start=$('startPanel');if(!start||$('categoryBrowser'))return;
  var selectionHead=start.querySelector('.selection-head');
  var box=document.createElement('section');box.id='categoryBrowser';box.className='catalog-browser';
  box.innerHTML='<div class="browser-head"><div><h3>استكشف الكلمات حسب التصنيف</h3><p>اختر تصنيفًا أو «منوّع»، ثم تنقّل بالسهمين أو شريط التنقل. اضغط الصورة أو الاسم لسماع الكلمة.</p></div></div><div id="categoryTabs" class="category-tabs" aria-label="تصنيفات الكلمات"></div><div class="browser-stage"><button id="browsePrev" class="browser-nav" type="button" aria-label="السابق">›</button><button id="browseSpeakCard" class="browser-card" type="button" aria-label="استمع إلى الكلمة"><span id="browseVisual" class="browser-visual"></span><strong id="browseWord">—</strong><small id="browseCategory">—</small><span class="browser-sound">🔊 اضغط للاستماع</span></button><button id="browseNext" class="browser-nav" type="button" aria-label="التالي">‹</button></div><div class="browser-range-row"><input id="browseRange" type="range" min="1" max="1" value="1" aria-label="شريط التنقل بين الكلمات"><span id="browsePosition">1 من 1</span></div><div class="browser-actions"><button id="browseSelectBtn" class="primary" type="button">أضف للجولة</button><button id="randomMixBtn" class="ghost" type="button">🎲 اختر 6 متنوعة</button></div>';
  start.insertBefore(box,selectionHead);
  var title=document.createElement('div');title.className='word-grid-title';title.innerHTML='<strong id="wordGridTitle">كل الكلمات</strong><span id="wordGridMeta"></span>';start.insertBefore(title,$('wordGrid'));
  var tools=document.createElement('div');tools.className='selection-tools';var all=$('selectAllBtn');if(all){all.parentNode.removeChild(all);tools.appendChild(all)}selectionHead.appendChild(tools);
  $('browsePrev').onclick=function(){moveBrowse(-1)};$('browseNext').onclick=function(){moveBrowse(1)};
  $('browseRange').oninput=function(){browseIndex=Math.max(0,parseInt(this.value,10)-1);renderBrowseCard()};
  $('browseSpeakCard').onclick=function(){if(browseItems[browseIndex])speakWord(browseItems[browseIndex],'browse')};
  $('browseSelectBtn').onclick=function(){var w=browseItems[browseIndex];if(!w)return;setSelected(w.id,selectedIds.indexOf(w.id)<0)};
  $('randomMixBtn').onclick=function(){var picks=shuffle(words).slice(0,Math.min(DEFAULT_MIX_COUNT,words.length));selectedIds=[];for(var i=0;i<picks.length;i++)selectedIds.push(picks[i].id);activeCategory='mixed';rebuildBrowse(true);renderCategoryTabs();renderBrowseCard();renderWordGrid();toast('تم اختيار مجموعة متنوعة للجولة.')};
}
function renderCategoryTabs(){
  var box=$('categoryTabs');if(!box)return;box.innerHTML='';
  var options=[{id:'mixed',label_ar:'منوّع',emoji:'🔀'}].concat(categories||[]);
  for(var i=0;i<options.length;i++)(function(c){var b=document.createElement('button');b.type='button';b.className='category-chip'+(activeCategory===c.id?' is-active':'');b.textContent=(c.emoji?c.emoji+' ':'')+c.label_ar;b.onclick=function(){activeCategory=c.id;rebuildBrowse(true);renderCategoryTabs();renderBrowseCard();renderWordGrid()};box.appendChild(b)})(options[i]);
}
function moveBrowse(delta){if(!browseItems.length)return;browseIndex=(browseIndex+delta+browseItems.length)%browseItems.length;renderBrowseCard()}
function renderBrowseCard(){
  if(!$('browseWord'))return;if(!browseItems.length)rebuildBrowse(false);var w=browseItems[browseIndex];if(!w)return;
  $('browseVisual').innerHTML=wordVisualMarkup(w,'browser');$('browseWord').textContent=w.ar;$('browseCategory').textContent=categoryLabel(w);
  var range=$('browseRange');range.max=String(Math.max(1,browseItems.length));range.value=String(browseIndex+1);$('browsePosition').textContent=(browseIndex+1)+' من '+browseItems.length;
  var selected=selectedIds.indexOf(w.id)>=0;$('browseSelectBtn').textContent=selected?'✓ موجود في الجولة':'＋ أضف للجولة';$('browseSelectBtn').className=selected?'ghost':'primary';
}
function setSelected(id,on){
  var ix=selectedIds.indexOf(id);
  if(on&&ix<0){if(selectedIds.length>=MAX_SESSION_ITEMS){toast('الحد الأقصى للجولة '+MAX_SESSION_ITEMS+' كلمة.');return}selectedIds.push(id)}
  if(!on&&ix>=0)selectedIds.splice(ix,1);
  renderWordGrid();renderBrowseCard();
}
function renderWordGrid(){
  var grid=$('wordGrid');if(!grid)return;grid.innerHTML='';if(!browseItems.length)rebuildBrowse(false);var list=browseItems;
  for(var i=0;i<list.length;i++)(function(w){
    var selected=selectedIds.indexOf(w.id)>=0;var card=document.createElement('div');card.className='word-choice'+(selected?' is-selected':'');
    var cat=categoryLabel(w);
    card.innerHTML='<button class="check" type="button" aria-label="'+(selected?'إزالة ':'إضافة ')+escapeHtml(w.ar)+' من الجولة" aria-pressed="'+(selected?'true':'false')+'">✓</button><span class="listen-dot" aria-hidden="true">🔊</span><button class="word-speak" type="button" aria-label="استمع إلى '+escapeHtml(w.ar)+'"><span class="word-visual">'+wordVisualMarkup(w,'grid')+'</span><strong>'+escapeHtml(w.ar)+'</strong><small>'+escapeHtml(cat)+'</small></button>';
    card.querySelector('.check').onclick=function(){setSelected(w.id,selectedIds.indexOf(w.id)<0)};card.querySelector('.word-speak').onclick=function(){speakWord(w,'grid')};grid.appendChild(card);
  })(list[i]);
  var c=selectedIds.length;$('selectionStatus').textContent=c?('تم اختيار '+c+' من '+MAX_SESSION_ITEMS+' كحد أقصى'):'اختر 3 أشياء على الأقل';
  var helper=$('selectionStatus').nextElementSibling;if(helper)helper.textContent='يمكن تكوين الجولة من أي تصنيف أو من مجموعة منوعة';
  $('startSessionBtn').disabled=c<3;$('startSessionBtn').textContent=c>=3?('ابدأ الجولة بـ '+c+' أشياء'):'ابدأ الجولة';
  var visibleSelected=0;for(i=0;i<list.length;i++)if(selectedIds.indexOf(list[i].id)>=0)visibleSelected++;
  $('selectAllBtn').textContent=visibleSelected===list.length&&list.length<=MAX_SESSION_ITEMS?'إلغاء اختيار التصنيف':'اختيار الظاهر';
  $('selectAllBtn').onclick=function(){
    var allHere=list.length&&visibleSelected===list.length&&list.length<=MAX_SESSION_ITEMS,j,id;
    if(allHere){for(j=0;j<list.length;j++){id=list[j].id;var p=selectedIds.indexOf(id);if(p>=0)selectedIds.splice(p,1)}}
    else{for(j=0;j<list.length&&selectedIds.length<MAX_SESSION_ITEMS;j++){id=list[j].id;if(selectedIds.indexOf(id)<0)selectedIds.push(id)}}
    renderWordGrid();renderBrowseCard();
  };
  if($('wordGridTitle'))$('wordGridTitle').textContent=activeCategory==='mixed'?'الكلمات المنوعة':'كل كلمات '+(categoryById(activeCategory)?categoryById(activeCategory).label_ar:'التصنيف');
  if($('wordGridMeta'))$('wordGridMeta').textContent=list.length+' كلمة';
}
function showPracticeVisual(w){
  var img=$('practiceImage'),shell=img&&img.parentNode;if(!img||!shell)return;var emoji=$('practiceEmoji');if(!emoji){emoji=document.createElement('div');emoji.id='practiceEmoji';emoji.className='practice-emoji';emoji.hidden=true;shell.appendChild(emoji)}
  if(w.asset){img.src=w.asset;img.alt='صورة '+w.ar;img.classList.remove('practice-picture-hidden');emoji.hidden=true}
  else{img.removeAttribute('src');img.alt='';img.classList.add('practice-picture-hidden');emoji.textContent=w.emoji||'🔹';emoji.hidden=false}
}
function renderPractice(){
  if(!session)return;if(currentIndex>=session.task_ids.length){finishSession();return}selectedResponse='';
  var id=session.task_ids[currentIndex],w=byId(id);if(!w)return;showPracticeVisual(w);$('practiceWord').textContent=w.ar;$('practiceHint').textContent=w.hint||'';
  $('progressText').textContent=(currentIndex+1)+' من '+session.task_ids.length;$('progressBar').style.width=((currentIndex/session.task_ids.length)*100)+'%';$('sessionSavedState').textContent=session.attempts.length?'تم حفظ '+session.attempts.length+' موقف':'غير محفوظ بعد';
  $('coachCard').hidden=true;$('childNote').value='';$('adultExpansion').value='';var radios=document.querySelectorAll('input[name="assist"]');for(var i=0;i<radios.length;i++)radios[i].checked=radios[i].value==='hint';
  var buttons=$('responseButtons').querySelectorAll('button');for(var j=0;j<buttons.length;j++)buttons[j].classList.remove('is-selected');$('audioStatus').textContent='اضغط للاستماع. إذا لم يتوفر صوت عربي على الجهاز، قل الكلمة أنت ببطء وبشكل طبيعي.';document.title=w.ar+' | كلماتي مع أشيائي';
}

function renderLog(){
  var list=$('sessionList');list.innerHTML='';$('logEmpty').style.display=memorySessions.length?'none':'block';
  memorySessions.forEach(function(s){var item=document.createElement('article');item.className='session-item';var n=(s.attempts||[]).length;item.innerHTML='<div><h3>جولة فيها '+n+' موقف تواصل</h3><p>'+formatDate(s.completed_at||s.started_at)+' · '+(s.task_ids?s.task_ids.length:n)+' أشياء مختارة</p></div><div class="session-actions"><button class="ghost open" type="button">فتح</button><button class="ghost danger del" type="button">حذف</button></div>';item.querySelector('.open').onclick=function(){openSessionDetail(s.session_id)};item.querySelector('.del').onclick=function(){deleteSession(s.session_id)};list.appendChild(item)});
}
function openSessionDetail(id){
  var s=null;for(var i=0;i<memorySessions.length;i++)if(memorySessions[i].session_id===id){s=memorySessions[i];break}if(!s)return;
  var html='<span class="pill">سجل جولة</span><h2 id="detailTitle">'+(s.attempts||[]).length+' مواقف تواصل</h2><p class="muted">'+formatDate(s.completed_at||s.started_at)+' — هذا سجل وصفي وليس درجة.</p>';
  (s.attempts||[]).forEach(function(a){var w=byId(a.task_id)||{ar:a.artifact.word_ar,id:a.task_id,emoji:'🔹'};var visual=w.asset?'<img src="'+escapeHtml(w.asset)+'" alt="">':'<div class="detail-emoji" aria-hidden="true">'+escapeHtml(w.emoji||'🔹')+'</div>';html+='<article class="detail-attempt">'+visual+'<div><strong>'+escapeHtml(w.ar)+'</strong><p><b>الاستجابة:</b> '+escapeHtml(a.artifact.response_label_ar)+'</p>'+(a.artifact.child_note?'<p><b>ملاحظة:</b> '+escapeHtml(a.artifact.child_note)+'</p>':'')+'<p><b>توسيع المرافق:</b> '+escapeHtml(a.artifact.adult_expansion||'—')+'</p><p><b>المساعدة:</b> '+escapeHtml(ASSIST_LABELS[a.assistance_level]||'—')+'</p></div></article>'});
  $('detailContent').innerHTML=html;$('detailDialog').hidden=false;$('closeDetailBtn').focus();
}
function closeDetail(){$('detailDialog').hidden=true}
function deleteSession(id){if(!confirm('حذف هذه الجولة من هذا الجهاز؟'))return;memorySessions=memorySessions.filter(function(s){return s.session_id!==id});persistSessions();renderLogCount();renderLog();toast('تم حذف الجولة من هذا الجهاز.')}
function download(name,type,text){var blob=new Blob([text],{type:type});var url=URL.createObjectURL(blob);var a=document.createElement('a');a.href=url;a.download=name;document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(url);a.remove()},100)}
function exportJson(){var pack={schema_version:SCHEMA,app_id:APP_ID,exported_at:nowIso(),sessions:memorySessions};download('kalimati-communication-log.json','application/json;charset=utf-8',JSON.stringify(pack,null,2));toast('تم تجهيز ملف JSON.')}
function exportTxt(){
  var lines=['كلماتي مع أشيائي — سجل مواقف التواصل','ملاحظة: سجل وصفي، لا درجة آلية للنطق.',''];
  memorySessions.forEach(function(s,ix){lines.push('الجولة '+(ix+1)+' — '+formatDate(s.completed_at||s.started_at));(s.attempts||[]).forEach(function(a){lines.push('• '+a.artifact.word_ar+' | '+a.artifact.response_label_ar+' | '+(ASSIST_LABELS[a.assistance_level]||''));if(a.artifact.child_note)lines.push('  ملاحظة الطفل: '+a.artifact.child_note);if(a.artifact.adult_expansion)lines.push('  توسيع المرافق: '+a.artifact.adult_expansion)});lines.push('')});download('kalimati-communication-log.txt','text/plain;charset=utf-8',lines.join('\n'));toast('تم تجهيز الملف النصي.')
}
function bind(){
  var tabs=document.querySelectorAll('.tab');for(var ti=0;ti<tabs.length;ti++)(function(b){b.addEventListener('click',function(){switchView(b.getAttribute('data-view'))})})(tabs[ti]);
  $('startSessionBtn').onclick=startSession;$('backToSelectionBtn').onclick=cancelSession;$('speakBtn').onclick=speakCurrent;$('facilitatorModeBtn').onclick=facilitatorSpeak;
  var responses=$('responseButtons').querySelectorAll('button');for(var ri=0;ri<responses.length;ri++)(function(b){b.onclick=function(){chooseResponse(b.getAttribute('data-response'),b)}})(responses[ri]);
  $('saveAttemptBtn').onclick=saveAttempt;$('skipAttemptBtn').onclick=skipAttempt;$('newSessionBtn').onclick=newSession;$('openFinishedLogBtn').onclick=function(){switchView('log');if(lastFinishedId)setTimeout(function(){openSessionDetail(lastFinishedId)},80)};
  $('exportJsonBtn').onclick=exportJson;$('exportTxtBtn').onclick=exportTxt;$('closeDetailBtn').onclick=closeDetail;$('detailDialog').onclick=function(e){if(e.target===$('detailDialog'))closeDetail()};document.addEventListener('keydown',function(e){if((e.key==='Escape'||e.keyCode===27)&&!$('detailDialog').hidden)closeDetail()});
}
function init(){
  loadSessions();injectBrowser();bind();
  fetch('data/words.json',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('words');return r.json()}).then(function(data){categories=data.categories||[];words=data.items||[];activeCategory='mixed';rebuildBrowse(true);selectedIds=mixedWords().slice(0,4).map(function(w){return w.id});renderCategoryTabs();renderBrowseCard();renderWordGrid()}).catch(function(){$('wordGrid').innerHTML='<div class="banner warn">تعذر تحميل بطاقات الكلمات. أعد فتح التطبيق أو استخدم زر التحديث.</div>';$('startSessionBtn').disabled=true});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
