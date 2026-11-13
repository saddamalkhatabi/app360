(function(){'use strict';
var engine=window.ExperienceEngine,activityApi=window.A1ActivityStore,communityEngine=window.A1CommunityEngine,drawingApi=window.A1DrawingLab,legacyDrawingApi=window.A1LegacyDrawing,root=document.getElementById('practiceRoot');
var data=null,items=[],byId={},families={},levels={},storyboards={},previews={},localized={},covers={},community={enabled:false},rawStorage=null,activity=null,timerInt=null,timerLeft=60,reelTimer=null,drawingSession=null,sheetHistoryActive=false,sheetClosingFromPop=false,legacySheetScroll=0,communityCache={comments:null,loadedAt:0};
var route=window.A1SessionRoutes.parse(window.location.search),ageGroup=route.age,autoMode=route.autoplay,sessionTimer=null,sessionRemaining=route.seconds,sessionPaused=false,sessionStarted=false,sessionTick=0,sessionPhase='explain',practice=window.A1PracticeCountdown.create(),practiceSeconds=route.practice_seconds;
var state={experience:null,filters:{text:'',levels:[],families:[],availability:[],energy:'all',place:'all'},visible:24,prefs:{largeText:false},refocusSearch:false};
try{rawStorage=window.localStorage;if(!route.explicit_age&&rawStorage.getItem('app360:a1-imitate:age-group:v1')==='4-8')ageGroup='4-8'}catch(e){}activity=activityApi.create(rawStorage);
function rememberAge(){if(window.A1AutoCoach)window.A1AutoCoach.refresh(ageGroup);try{if(rawStorage)rawStorage.setItem('app360:a1-imitate:age-group:v1',ageGroup)}catch(e){}}
var english=window.A1English;
function language(){return state.prefs.language==='en'&&english?'en':'ar'}
function t(ar,en){return language()==='en'?en:ar}
function title(x){return language()==='en'?english.experiences[x.id].title:x.title}
function familyName(f){return language()==='en'?english.families[f.id]:f.title}
function levelName(l){return language()==='en'?english.levels[l.id-1]:l.short}
function board(x){return localized[x.id]&&localized[x.id][language()]||storyboards[x.id]}
function updateLanguage(){
 var lang=language(),select=el('appLanguage');
 document.documentElement.lang=lang;
 document.documentElement.dir=lang==='en'?'ltr':'rtl';
 document.title=t('دوري ودورك | مدرسة العائلة 360','My Turn, Your Turn | Family School 360');
 eachNode('[data-english]',function(node){
  if(!node.hasAttribute('data-arabic'))node.setAttribute('data-arabic',node.textContent);
  node.textContent=node.getAttribute(lang==='en'?'data-english':'data-arabic');
 });
 if(select)select.value=lang;
 if(window.A1RecordedVoice&&window.A1RecordedVoice.setLanguage)window.A1RecordedVoice.setLanguage(lang);
 if(window.A1AutoCoach)window.A1AutoCoach.refresh(ageGroup);
}
function changeLanguage(){
 state.prefs.language=el('appLanguage').value==='en'?'en':'ar';
 savePrefs();
 updateLanguage();
 if(state.experience)openExperience(state.experience.id);else renderLibrary();
}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]})}
function el(id){return document.getElementById(id)}
function eachNode(selector,fn,scope){var list=(scope||document).querySelectorAll(selector),i;for(i=0;i<list.length;i++)fn(list[i],i)}
function appShell(){var x=document.getElementsByClassName?document.getElementsByClassName('app-shell'):null;return x&&x.length?x[0]:null}
function toast(msg){var n=el('appPwaNotice');n.textContent=msg;n.style.display='block';clearTimeout(toast.t);toast.t=setTimeout(function(){n.style.display='none'},3000)}
function toggle(arr,v){var a=arr.slice(),i=a.indexOf(v);if(i>=0)a.splice(i,1);else a.push(v);return a}
function chip(text,active,attr){return'<button class="chip '+(active?'active':'')+'" type="button" '+attr+'>'+text+'</button>'}
function toolLabel(a){var x=(data.availability||[]).find(function(v){return v.id===a});return x?x.icon+' '+(language()==='en'?english.availability[a]:x.label):a}
function energyLabel(x){return x==='quiet'?t('هادئة','Quiet'):x==='active'?t('حركية','Active'):t('متوسطة','Moderate')}
function placeLabel(x){return x==='floor'?t('على الأرض','On the floor'):x==='table'?t('على الطاولة','At a table'):t('أي مكان','Anywhere')}
function loadPrefs(){try{var p=rawStorage&&rawStorage.getItem('app360:a1-imitate:v3:prefs');if(p)state.prefs=Object.assign(state.prefs,JSON.parse(p))}catch(e){}if(route.language)state.prefs.language=route.language;else if(!state.prefs.language&&window.A1RecordedVoice&&window.A1RecordedVoice.getLanguage)state.prefs.language=window.A1RecordedVoice.getLanguage();applyPrefs();updateLanguage()}
function savePrefs(){try{if(rawStorage)rawStorage.setItem('app360:a1-imitate:v3:prefs',JSON.stringify(state.prefs))}catch(e){}}
function applyPrefs(){document.documentElement.classList.toggle('large-text',!!state.prefs.largeText)}
function storageStatus(){var b=el('storageBanner');if(activity.isPersistent()){b.hidden=true;return}b.hidden=false;b.innerHTML='<strong>الحفظ الدائم غير متاح.</strong> سيعمل العداد مؤقتًا حتى إغلاق الصفحة.'}
function ageItems(){return items.filter(function(x){return x.age_groups.indexOf(ageGroup)>=0})}
function getFiltered(){
 var query=state.filters.text.trim().toLowerCase();
 if(language()!=='en'||!query)return engine.filter(ageItems(),state.filters);
 var filters=Object.assign({},state.filters,{text:''});
 return engine.filter(ageItems(),filters).filter(function(x){
  var en=english.experiences[x.id];
  return [x.id,en.title,familyName(families[x.family])].concat(en.steps).join(' ').toLowerCase().indexOf(query)>=0;
 });
}
function cardVisual(x){var cover=covers[x.id],asset=board(x),preview=previews[x.id];if(preview)return '<div class="card-thumb-frame photo-preview"><img src="'+esc(preview)+'" alt="'+t('لقطة من تجربة ','Scene from ')+esc(title(x))+'" loading="lazy"><em>'+x.id+'</em></div>';if(asset)return '<div class="card-thumb-frame"><img src="'+esc(asset)+'" alt="'+t('لقطة من تجربة ','Scene from ')+esc(title(x))+'" loading="lazy"><em>'+x.id+'</em></div>';if(cover)return '<div class="card-cover-icon"><img src="'+esc(cover)+'" alt="'+t('غلاف تجربة ','Cover for ')+esc(title(x))+'" loading="lazy"><em>'+x.id+'</em></div>';return '<div class="card-art"><span>'+esc(x.icon)+'</span><em>'+x.id+'</em></div>'}
function globalMethod(){return'<section class="global-method"><div class="method-title"><span>'+t('طريقة واحدة لكل التجارب','How to play')+'</span><h3>'+t('شاهد الفكرة ثم العبها بطريقتكم','Watch first, then play your way')+'</h3></div><div class="method-row"><div><b>1</b><span>'+t('شاهد اللقطات','Watch the scenes')+'</span></div><div><b>2</b><span>'+t('نفّذ أنت مرة','Show it once')+'</span></div><div><b>3</b><span>'+t('دع الطفل يجرب','Let your child try')+'</span></div><div><b>4</b><span>'+t('بدّلوا القيادة','Switch who leads')+'</span></div><div><b>5</b><span>'+t('سجّل التنفيذ والتحسين','Mark it done and save an idea')+'</span></div></div><p>'+t('لا يلزم الالتزام بحركات حرفية. الهدف هو المشاركة والانتظار والتبادل، ويمكن تبسيط أي فكرة أو تطويرها بحسب استعداد الطفل.','Take turns, wait for each other, and adapt the activity to your child.')+'</p></section>'}
function renderLoading(){root.innerHTML='<div class="loading"><div class="spinner"></div><b>'+t('جارٍ تجهيز مكتبة التجارب…','Loading activities…')+'</b></div>'}
function renderError(msg){root.innerHTML='<div class="empty-state"><div>⚠️</div><h2>'+t('تعذر تحميل المكتبة','The activities could not load')+'</h2><p>'+esc(msg)+'</p><button class="btn primary" id="retryBtn">'+t('إعادة المحاولة','Try again')+'</button></div>';el('retryBtn').onclick=boot}
function renderLibrary(){
clearReel();if(window.A1RecordedVoice)window.A1RecordedVoice.stop();state.experience=null;autoMode=false;sessionPaused=false;stopSession();var filtered=getFiltered(),shown=filtered.slice(0,state.visible),active=state.filters.levels.length+state.filters.families.length+state.filters.availability.length+(state.filters.energy!=='all'?1:0)+(state.filters.place!=='all'?1:0)+(state.filters.text?1:0);
var h='<section class="hero-mini"><div><span class="count-pill">'+ageItems().length+t(' تجربة مشتركة',' shared activities')+'</span><h2>'+t('الفكرة أمامك واللعب بينكم','Watch it, then play together')+'</h2><p>'+t('شاهد اللقطات، طبّق الفكرة في الواقع، ثم سجّل أنها تمت وأضف أي تحسين اكتشفته.','Watch the scenes, try the activity, then save any ideas.')+'</p></div><div class="hero-stats"><strong>'+activity.total()+'</strong><span>'+t('إجمالي تنفيذاتك','Activities you tried')+'</span><button id="surpriseBtn" class="surprise-btn"><span>🎲</span>'+t('فاجئني','Surprise me')+'</button></div></section>';
h+='<div class="level-strip"><button class="chip '+(ageGroup==='1-4'?'active':'')+'" data-age="1-4">'+t('المستوى الأول · 1–4','First level · Ages 1–4')+'</button><button class="chip '+(ageGroup==='4-8'?'active':'')+'" data-age="4-8">'+t('المستوى المتقدم · 4–8','Advanced level · Ages 4–8')+'</button><button id="startSequence" class="btn primary">'+t('تشغيل المسار بالتتابع','Play activities in order')+'</button></div>';
h+='<div class="search-row"><label class="search-box"><span>⌕</span><input id="searchInput" value="'+esc(state.filters.text)+'" placeholder="'+t('ابحث: تركيز، ورق، رسم…','Search: focus, paper, drawing…')+'" autocomplete="off"></label><button id="filtersBtn" class="filter-btn">'+t('☰ فلاتر','☰ Filters') + (active?' <b>'+active+'</b>':'')+'</button></div><div class="level-strip">'+chip(t('كل المستويات','All levels'),!state.filters.levels.length,'data-level="all"');
data.levels.filter(function(l){return ageGroup==='4-8'?l.id===5:l.id<5}).forEach(function(l){h+=chip(l.id+' · '+t(l.title,levelName(l)),state.filters.levels.indexOf(l.id)>=0,'data-level="'+l.id+'"')});h+='</div><div class="family-strip">'+chip(t('كل المجالات','All categories'),!state.filters.families.length,'data-family="all"');data.families.forEach(function(f){h+=chip(f.icon+' '+familyName(f),state.filters.families.indexOf(f.id)>=0,'data-family="'+f.id+'"')});h+='</div><div class="results-head"><b>'+filtered.length+t(' تجربة',' activities')+'</b><span>'+t('يعرض ','Showing ')+shown.length+t(' الآن','')+'</span></div><div class="experience-grid">';
shown.forEach(function(x){var f=families[x.family],l=levels[x.level],stat=activity.get(x.id);h+='<button class="experience-card" data-exp="'+x.id+'">'+cardVisual(x)+'<div class="card-body"><div class="card-kicker">'+esc(f.icon+' '+familyName(f))+' · '+esc(levelName(l))+'</div><b>'+esc(title(x))+'</b><div class="card-meta"><span>⏱ '+x.duration_minutes+t(' د',' min')+'</span><span>'+esc(toolLabel(x.availability))+'</span>'+(stat.count?'<span class="done-mini">✓ '+stat.count+'</span>':'')+'</div></div></button>'});h+='</div>';
if(shown.length<filtered.length)h+='<div class="load-more"><button id="moreBtn" class="btn secondary">'+t('عرض المزيد (','Show more (') + (filtered.length-shown.length)+')</button></div>';if(!filtered.length)h+='<div class="empty-state"><div>🔎</div><h3>'+t('لا توجد نتيجة بهذه الفلاتر','No matching activities')+'</h3><button class="btn secondary" id="resetFilters">'+t('مسح الفلاتر','Clear filters')+'</button></div>';
h+=globalMethod();root.innerHTML=h;
eachNode('[data-age]',function(b){b.onclick=function(){ageGroup=this.getAttribute('data-age');rememberAge();state.filters.levels=[];state.visible=24;renderLibrary()}});el('startSequence').onclick=function(){var list=getFiltered();if(list.length){autoMode=true;sessionRemaining=route.seconds;sessionStarted=false;openExperience(list[0].id)}};
var search=el('searchInput');search.oninput=function(){state.filters.text=this.value;state.visible=24;state.refocusSearch=true;clearTimeout(renderLibrary.t);renderLibrary.t=setTimeout(renderLibrary,140)};if(state.refocusSearch){state.refocusSearch=false;setTimeout(function(){search.focus();var n=search.value.length;try{search.setSelectionRange(n,n)}catch(e){}},0)}
root.querySelectorAll('[data-level]').forEach(function(b){b.onclick=function(){var v=this.getAttribute('data-level');state.filters.levels=v==='all'?[]:toggle(state.filters.levels,Number(v));state.visible=24;renderLibrary()}});
root.querySelectorAll('[data-family]').forEach(function(b){b.onclick=function(){var v=this.getAttribute('data-family');state.filters.families=v==='all'?[]:toggle(state.filters.families,v);state.visible=24;renderLibrary()}});
root.querySelectorAll('[data-exp]').forEach(function(b){b.onclick=function(){openExperience(this.getAttribute('data-exp'))}});
el('surpriseBtn').onclick=function(){var x=engine.pick(filtered.length?filtered:ageItems());if(x)openExperience(x.id)};el('filtersBtn').onclick=openFilters;
if(window.A1RecordedVoice)window.A1RecordedVoice.mount(false);
if(el('moreBtn'))el('moreBtn').onclick=function(){state.visible+=24;renderLibrary()};if(el('resetFilters'))el('resetFilters').onclick=function(){state.filters={text:'',levels:[],families:[],availability:[],energy:'all',place:'all'};state.visible=24;renderLibrary()}
}
function renderReel(x){
var asset=board(x);if(!asset)return '<div class="symbol-placeholder"><b>'+esc(title(x))+'</b><p>'+t('اتبع تعليمات المشاهد أدناه وجربها مع شريكك.','Follow the scene instructions below and try them together.')+'</p><button id="reelPlay" class="btn">تشغيل الشرح</button><button id="reelReplay" class="btn">'+t('إعادة من البداية','Replay from start')+'</button></div>';
var dots='';for(var i=0;i<5;i++)dots+='<i class="'+(i===0?'on':'')+'" aria-label="اللقطة '+(i+1)+'"></i>';
return'<div class="reel" id="storyReel" data-frames="5"><div class="reel-stage-label" id="reelStageLabel">اللقطة 1 من 5</div><div class="reel-viewport frame-mode" id="reelViewport"><img id="reelStrip" class="reel-strip" src="'+esc(asset)+'" alt="'+t('لقطات متتابعة لتجربة ','Scenes for ')+esc(title(x))+'"></div><div class="reel-controls"><button id="reelPlay" class="reel-play" type="button">⏸ إيقاف</button><div id="reelDots" class="reel-dots">'+dots+'</div><span id="reelCounter">1 / 5</span><button id="reelReplay" class="reel-replay" type="button">'+t('↺ إعادة','↺ Replay')+'</button></div></div>'
}
function setupReel(){if(window.A1ScenePlayer)window.A1ScenePlayer.mount(state.experience,afterExplanation,{language:language(),autoplay:!sessionPaused,beforePlay:stopPraise})}
function focusExperience(){var nav=root.querySelector('.detail-nav');if(nav&&nav.getBoundingClientRect)window.scrollTo(0,Math.max(0,nav.getBoundingClientRect().top+(window.pageYOffset||0)-8));else window.scrollTo(0,0)}
function clearReel(){stopPraise();if(reelTimer){clearTimeout(reelTimer);reelTimer=null}if(window.A1ScenePlayer)window.A1ScenePlayer.stop()}
function afterExplanation(){
 if(!autoMode||sessionPhase==='practice')return;
 sessionPhase='practice';
 practice.start(practiceSeconds||state.experience.practice_seconds);
 sessionTick=Date.now();
 if(el('sessionPhase'))el('sessionPhase').textContent=t('حان وقت التجربة معًا','Time to try it together');
 updatePractice();
}
function updatePractice(){
 var panel=el('practiceCountdown');
 if(!panel)return;
 panel.hidden=!autoMode||sessionPhase!=='practice';
 if(panel.hidden)return;
 var meter=el('practiceProgress'),left=Math.ceil(practice.remaining());
 meter.max=practice.total();
 meter.value=practice.remaining();
 el('practiceLeft').textContent=left+t(' ثانية',' seconds');
 el('practiceExtend').disabled=practice.extended()||sessionPaused;
 el('practiceExtend').textContent=practice.extended()?t('تمت إضافة 10 ثوانٍ','10 seconds added'):t('+10 ثوانٍ','+10 seconds');
}
function stopPraise(){
 if(window.APP360_TEACHER_ENCOURAGEMENT)window.APP360_TEACHER_ENCOURAGEMENT.stop();
}
function playPraise(){
 var praise=window.APP360_TEACHER_ENCOURAGEMENT,node=el('practicePraise');
 if(!praise){if(window.A1RecordedVoice)window.A1RecordedVoice.play('done');return}
 praise.play({language:praise.profile()?'ar':language(),caption:function(value){
  if(node){node.textContent=value;node.hidden=!value}
 }});
}
function advanceSequence(){var list=getFiltered(),index=list.indexOf(state.experience);if(index<0||index>=list.length-1){endSession('route-finished');return}openExperience(list[index+1].id)}
function stopSession(){clearInterval(sessionTimer);sessionTimer=null;sessionStarted=false}
function emitSession(type,payload){var detail={app_id:'a1-imitate',type:type,launch_id:route.launch_id,payload:payload||{}};try{window.dispatchEvent(new CustomEvent('a1-session',{detail:detail}))}catch(e){var evt=document.createEvent('CustomEvent');evt.initCustomEvent('a1-session',false,false,detail);window.dispatchEvent(evt)}}
function endSession(reason){autoMode=false;stopSession();stopPraise();if(window.A1RecordedVoice)window.A1RecordedVoice.stop();if(window.A1ScenePlayer)window.A1ScenePlayer.pause();sessionPaused=false;updateSession();if(el('sessionPhase'))el('sessionPhase').textContent=reason==='time'?t('انتهى وقت الجلسة','Session time is up'):reason==='stopped'?t('تم إنهاء الجلسة','Session ended'):t('اكتمل عرض المسار','You reached the end of the route');if(el('sessionMinutes'))el('sessionMinutes').disabled=false;emitSession('session-ended',{reason:reason,practice_confirmed:false});}
function sessionBar(){
 return '<section class="session-controls"><strong>'+t('مسار التجارب','Activity route')+'</strong><span id="sessionPhase">'+t('شاهد الشرح ثم جرّب في الواقع','Watch, then try it together')+'</span>'+
 '<div id="practiceCountdown" class="practice-countdown" hidden><div class="practice-heading"><strong>'+t('الوقت المتبقي للتجربة','Practice time left')+'</strong><span id="practiceLeft"></span></div>'+
 '<div class="practice-meter"><progress id="practiceProgress" aria-label="'+t('وقت التمرين','Practice time')+'" max="10" value="10"></progress><button id="practiceExtend" type="button" class="btn secondary">'+t('+10 ثوانٍ','+10 seconds')+'</button></div></div>'+
 '<div class="action-row"><label>'+t('وقت المسار بالدقائق','Route length in minutes')+' <input id="sessionMinutes" type="number" min="1" max="30" value="'+Math.ceil(route.seconds/60)+'"></label>'+
 '<button id="sessionToggle" class="btn"></button><button id="sessionStop" class="btn">'+t('إنهاء المسار','End route')+'</button><span id="sessionClock"></span></div></section>';
}
function updateSession(){
 var btn=el('sessionToggle'),clock=el('sessionClock');
 if(btn)btn.textContent=autoMode?(sessionPaused?t('متابعة المسار','Resume route'):t('إيقاف مؤقت للمسار','Pause route')):t('تشغيل المسار تلقائيًا','Play the route automatically');
 if(clock)clock.textContent=autoMode?Math.max(0,Math.ceil(sessionRemaining))+t(' ثانية للجلسة',' seconds in session'):'';
 updatePractice();
}
function pauseSession(){
 if(autoMode)sessionPaused=true;
 if(window.A1ScenePlayer)window.A1ScenePlayer.pause();
 stopPraise();
 updateSession();
}
function bindSession(){
 el('sessionToggle').onclick=function(){
  if(!autoMode){
   autoMode=true;
   sessionPaused=false;
   sessionRemaining=Math.max(60,Math.min(1800,(Number(el('sessionMinutes').value)||5)*60));
   stopSession();
   openExperience(state.experience.id);
   return;
  }
  if(!sessionPaused){pauseSession();return}
  sessionPaused=false;
  sessionTick=Date.now();
  updateSession();
  if(sessionPhase==='explain'&&window.A1ScenePlayer)window.A1ScenePlayer.play();
 };
 el('sessionStop').onclick=function(){endSession('stopped')};
 el('practiceExtend').onclick=function(){
  if(!autoMode||sessionPaused||sessionPhase!=='practice')return;
  sessionRemaining+=practice.extend();
  updateSession();
 };
 el('sessionMinutes').disabled=autoMode;
 updateSession();
 if(!autoMode||sessionStarted)return;
 sessionStarted=true;
 sessionTick=Date.now();
 sessionTimer=setInterval(function(){
  var now=Date.now(),elapsed=Math.max(0,(now-sessionTick)/1000);
  sessionTick=now;
  if(!autoMode||sessionPaused||document.hidden)return;
  sessionRemaining-=elapsed;
  if(sessionRemaining<=0){endSession('time');return}
  if(sessionPhase==='practice'&&practice.tick(elapsed)<=0){advanceSequence();return}
  updateSession();
 },100);
}
document.addEventListener('visibilitychange',function(){if(document.hidden)pauseSession()},false);
function ideaText(x){if(language()==='en')return 'Try “'+title(x)+'” together. Show the activity, let your child try it, then switch who leads.';return'جرّبوا «'+x.title+'» كتجربة مشتركة قصيرة. يعرض المرافق الفكرة مرة، ثم يجرب الطفل بطريقته، وبعدها يتبادل الطرفان القيادة ويضيفان تعديلًا صغيرًا إذا رغبا.'}
function previousExperienceId(id){var list=getFiltered(),i=list.indexOf(byId[id]);return list[(i-1+list.length)%list.length].id}
function goPreviousExperience(){if(state.experience)openExperience(previousExperienceId(state.experience.id))}
function nextExperienceId(id){var list=getFiltered(),i=list.indexOf(byId[id]);return list[(i+1)%list.length].id}
function goNextExperience(){if(state.experience)openExperience(nextExperienceId(state.experience.id))}
function isLegacyDrawingDevice(){var ua=(window.navigator&&navigator.userAgent)||'',style=document.documentElement&&document.documentElement.style||{};return /Android\s+4\./i.test(ua)||/Android.*Version\/4/i.test(ua)||typeof style.flex==='undefined'}
function setClassFlag(node,name,on){if(!node)return;if(node.classList){if(on)node.classList.add(name);else node.classList.remove(name);return}var c=' '+(node.className||'')+' ',needle=' '+name+' ';if(on&&c.indexOf(needle)<0)node.className=(node.className+' '+name).replace(/^\s+|\s+$/g,'');if(!on&&c.indexOf(needle)>=0)node.className=c.replace(needle,' ').replace(/^\s+|\s+$/g,'')}
function openDrawingLab(){
var legacy=isLegacyDrawingDevice();openSheet('🎨 الرسم الجماعي','<div id="drawLabRoot"></div>');var sh=el('sheet');setClassFlag(sh,'drawing-open',true);setClassFlag(sh,'legacy-drawing-open',legacy);
try{
 if(legacy){
   if(!legacyDrawingApi)throw new Error('legacy drawing unavailable');
   drawingSession=legacyDrawingApi.mount(el('drawLabRoot'),{experience:state.experience});
 }else{
   if(!drawingApi)throw new Error('drawing unavailable');
   drawingSession=drawingApi.mount(el('drawLabRoot'),{experience:state.experience,legacy:false});
 }
 setTimeout(function(){if(drawingSession&&drawingSession.resize)drawingSession.resize()},60);
}catch(e){
 el('sheetBody').innerHTML='<div class="legacy-draw-error"><b>تعذر تشغيل الرسم داخل هذه الصفحة.</b><p>يمكنك فتح لوحة الرسم الأساسية.</p><a class="btn primary" href="../drawing-writing-foundations/index.html">فتح لوحة الرسم الأساسية</a></div>';
}}
function notesHtml(stat){if(!stat.notes.length)return'<div class="no-notes">'+t('لا توجد ملاحظات شخصية لهذه التجربة بعد.','No private notes for this activity yet.')+'</div>';return'<div class="note-list">'+stat.notes.slice(0,5).map(function(n){return'<div class="note-item"><span>'+formatDate(n.at)+'</span><p>'+esc(n.text)+'</p></div>'}).join('')+'</div>'}
function formatDate(v){if(!v)return'';try{return new Date(v).toLocaleDateString(language(),{year:'numeric',month:'short',day:'numeric'})}catch(e){return''}}
function openExperience(id){
clearReel();sessionTick=Date.now();sessionPhase='explain';practice.reset();var x=byId[id];if(!x)return;state.experience=x;var f=families[x.family],l=levels[x.level],stat=activity.get(x.id),tools=x.tools.length?x.tools.map(function(t){return'<span class="tool-pill">'+esc(t.icon+' '+(language()==='en'?english.tools[t.name]:t.name))+'</span>'}).join(''):'<span class="tool-pill">'+t('🙌 بدون أدوات','🙌 No materials needed')+'</span>';
root.innerHTML='<div class="detail-nav"><button class="back-link" id="backLibrary">'+t('→ المكتبة','← Activities')+'</button><div class="detail-nav-pair"><button class="btn prev-exp-btn" id="previousExperience">'+t('→ التجربة السابقة','← Previous activity')+'</button><button class="btn next-exp-btn" id="nextExperience">'+t('التجربة التالية ←','Next activity →')+'</button></div></div><div class="experience-title compact"><div class="big-icon">'+esc(x.icon)+'</div><div><div class="card-kicker">'+t('التجربة ','Activity ')+x.id+' · '+esc(familyName(f))+' · '+esc(levelName(l))+'</div><h2>'+esc(title(x))+'</h2><div class="detail-meta"><span>⏱ '+x.duration_minutes+t(' د',' min')+'</span><span>⚡ '+energyLabel(x.energy)+'</span><span>📍 '+placeLabel(x.place)+'</span></div></div></div>'+
renderReel(x)+sessionBar()+
'<section class="idea-card"><span>'+t('الفكرة','Activity idea')+'</span><p>'+esc(ideaText(x))+'</p><div class="tool-list">'+tools+'</div>'+(x.alternatives.length?'<small><b>'+t('بديل:','Alternative:')+'</b> '+esc(x.alternatives.map(function(a){return language()==='en'?english.alternatives[a]:a}).join(' · '))+'</small>':'')+'</section>'+
'<section class="done-card compact-done"><div class="done-count"><strong id="doneCount">'+stat.count+'</strong><span>'+t('مرات تنفيذك لهذه التجربة','Times you tried this activity')+'</span></div><div class="action-row"><button id="markDone" class="btn primary grow">'+t('✓ تم عمل التجربة','✓ Mark activity done')+'</button><button id="openDrawLab" class="btn drawing-btn">'+t('🎨 رسم جماعي','🎨 Draw together')+'</button>'+(x.helper?'<button id="openHelperForExp" class="btn ghost">'+t('أداة مساعدة','Activity tools')+'</button>':'')+'<button id="previousExperienceBottom" class="btn ghost">'+t('→ التجربة السابقة','← Previous activity')+'</button><button id="nextExperienceBottom" class="btn secondary">'+t('التجربة التالية ←','Next activity →')+'</button></div></section>'+
'<details id="feedbackPanel" class="feedback-fold"><summary><span>'+t('💬 التعليقات والتحسينات','💬 Notes and ideas')+'</span><small>'+t('ملاحظاتي: ','My notes: ') + stat.notes.length + t(' · اضغط للفتح',' · Tap to open')+'</small></summary><div class="feedback-body"><section class="personal-feedback"><label class="improve-label">'+t('ملاحظة أو تحسين خاص بك','A private note or idea')+'<textarea id="improveNote" maxlength="500" placeholder="'+t('مثال: نجحت أكثر عندما جعلنا الطفل يختار الكوب التالي…','Example: My child picked the next cup…')+'"></textarea></label><button id="saveNoteOnly" class="btn secondary">'+t('حفظ الملاحظة على جهازي','Save note on this device')+'</button><div id="myNotes">'+notesHtml(stat)+'</div></section><section class="community-inline"><div class="community-head"><div><span>'+t('تعليقات المجتمع','Community notes')+'</span><h3>'+t('تحسينات وتجارب من مستخدمين آخرين','Ideas from other families')+'</h3></div><button id="refreshCommunity" class="icon-round" title="تحديث">↻</button></div><div id="communityComments" class="community-comments"><div class="community-empty">'+t('افتح هذا القسم لتحميل التعليقات العامة.','Open this section to load public notes.')+'</div></div><label class="community-compose">'+t('شارك تحسينًا عامًا','Share a public idea')+'<textarea id="publicComment" maxlength="800" placeholder="'+t('اكتب ملاحظة مفيدة دون أسماء أو بيانات شخصية.','Leave out names and personal information.')+'"></textarea></label><button id="publishCommunity" class="btn community-btn">'+t('نسخ التعليق وفتح صفحة النشر العام','Copy note and open the public page')+'</button><small class="community-help">'+t('النشر العام يتم عبر GitHub ويحتاج تسجيل الدخول هناك.','Public notes require signing in to GitHub.')+'</small></section></div></details>'+
'<p id="practicePraise" class="practice-praise" role="status" dir="auto" hidden></p>'+globalMethod();
el('backLibrary').onclick=renderLibrary;el('previousExperience').onclick=goPreviousExperience;el('nextExperience').onclick=goNextExperience;el('previousExperienceBottom').onclick=goPreviousExperience;el('nextExperienceBottom').onclick=goNextExperience;el('openDrawLab').onclick=openDrawingLab;
el('markDone').onclick=function(){if(window.A1ScenePlayer)window.A1ScenePlayer.pause();var r=activity.markDone(x.id,'');refreshLocal(r);toast(t('تم تسجيل تنفيذ التجربة.','Activity marked as done.'));emitSession('activity-completed',{experience:x.id,confirmed_by_user:true});if(window.A1RecordedVoice)window.A1RecordedVoice.stop();afterExplanation();playPraise()};
el('saveNoteOnly').onclick=function(){var note=el('improveNote').value.trim();if(!note)return toast(t('اكتب الملاحظة أولًا.','Write a note first.'));var r=activity.addNote(x.id,note);el('improveNote').value='';refreshLocal(r);toast(t('تم حفظ الملاحظة على جهازك.','Note saved on this device.'))};
if(el('openHelperForExp'))el('openHelperForExp').onclick=function(){openHelpers(x.helper)};
el('refreshCommunity').onclick=function(){loadCommunity(x.id,true)};el('publishCommunity').onclick=function(){preparePublicComment(x.id)};
var feedback=el('feedbackPanel');feedback.ontoggle=function(){if(feedback.open)loadCommunity(x.id,false)};
if(window.A1RecordedVoice)window.A1RecordedVoice.mount(true);bindSession();setupReel();if(autoMode&&sessionPaused&&window.A1ScenePlayer)window.A1ScenePlayer.pause();focusExperience()
}
function refreshLocal(r){el('doneCount').textContent=r.count;el('myNotes').innerHTML=notesHtml(r)}
function loadCommunity(id,force){var box=el('communityComments');if(!box)return;if(!community.enabled){box.innerHTML='<div class="community-empty">التعليقات العامة غير مفعلة.</div>';return}var fresh=communityCache.comments&&Date.now()-communityCache.loadedAt<120000;if(fresh&&!force)return renderCommunity(id,communityCache.comments);box.innerHTML='<div class="community-loading">جارٍ تحميل التعليقات العامة…</div>';fetch(community.api_comments_url+'?per_page=100',{headers:{Accept:'application/vnd.github+json'}}).then(function(r){if(!r.ok)throw new Error(String(r.status));return r.json()}).then(function(rows){communityCache={comments:rows,loadedAt:Date.now()};renderCommunity(id,rows)}).catch(function(){box.innerHTML='<div class="community-empty">تعذر تحميل التعليقات الآن. يمكنك فتح صفحة المجتمع مباشرة.</div>'})}
function renderCommunity(id,rows){var box=el('communityComments');if(!box)return;var list=communityEngine.filter(rows,id);if(!list.length){box.innerHTML='<div class="community-empty">لا توجد تعليقات عامة لهذه التجربة بعد. كن أول من يشارك تحسينًا.</div>';return}box.innerHTML=list.slice().reverse().map(function(c){return'<article class="public-comment"><div class="comment-author">'+(c.avatar?'<img src="'+esc(c.avatar)+'" alt="">':'')+'<b>@'+esc(c.user)+'</b><span>'+formatDate(c.created_at)+'</span></div><p>'+esc(c.text)+'</p></article>'}).join('')}
function copyText(text){if(navigator.clipboard&&navigator.clipboard.writeText)return navigator.clipboard.writeText(text);return new Promise(function(resolve,reject){try{var ta=document.createElement('textarea');ta.value=text;ta.style.position='fixed';ta.style.opacity='0';document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove();resolve()}catch(e){reject(e)}})}
function preparePublicComment(id){var ta=el('publicComment'),text=ta.value.trim();if(!text)return toast('اكتب التعليق العام أولًا.');var payload=communityEngine.compose(id,text),url=community.web_url+'#new_comment_field';copyText(payload).then(function(){toast('تم نسخ التعليق. الصقه في GitHub ثم انشره.');window.open(url,'_blank','noopener')}).catch(function(){window.prompt('انسخ هذا التعليق ثم انشره في صفحة المجتمع:',payload);window.open(url,'_blank','noopener')})}
function openFilters(){var h='<div class="filter-groups"><div><b>الأدوات</b><div class="chip-wrap">';data.availability.forEach(function(a){h+=chip(toolLabel(a.id),state.filters.availability.indexOf(a.id)>=0,'data-tool="'+a.id+'"')});h+='</div></div><div><b>الطاقة</b><div class="chip-wrap">'+[['all','الكل'],['quiet',t('هادئة','Quiet')],['medium',t('متوسطة','Moderate')],['active',t('حركية','Active')]].map(function(v){return chip(v[1],state.filters.energy===v[0],'data-energy="'+v[0]+'"')}).join('')+'</div></div><div><b>المكان</b><div class="chip-wrap">'+[['all',t('أي مكان','Anywhere')],['floor','الأرض'],['table','الطاولة']].map(function(v){return chip(v[1],state.filters.place===v[0],'data-place="'+v[0]+'"')}).join('')+'</div></div><button class="btn ghost wide" id="clearAdvanced">مسح الفلاتر الإضافية</button></div>';openSheet(t('الفلاتر','Filters'),h);eachNode('[data-tool]',function(b){b.onclick=function(){state.filters.availability=toggle(state.filters.availability,this.getAttribute('data-tool'));openFilters()}});eachNode('[data-energy]',function(b){b.onclick=function(){state.filters.energy=this.getAttribute('data-energy');openFilters()}});eachNode('[data-place]',function(b){b.onclick=function(){state.filters.place=this.getAttribute('data-place');openFilters()}});el('clearAdvanced').onclick=function(){state.filters.availability=[];state.filters.energy='all';state.filters.place='all';closeSheet();renderLibrary()}}
function openSettings(){openSheet(t('الإعدادات','Settings'),'<div class="settings-list"><label><span><b>'+t('نص أكبر','Larger text')+'</b><small>'+t('يكبّر العناوين والنصوص','Increase the size of headings and text')+'</small></span><input id="largeTextToggle" type="checkbox" '+(state.prefs.largeText?'checked':'')+'></label></div>');el('largeTextToggle').onchange=function(){state.prefs.largeText=this.checked;savePrefs();applyPrefs()}}
function openHistory(){var rows=activity.all(),ids=Object.keys(rows).filter(function(id){return rows[id]&&((rows[id].count||0)||(rows[id].notes||[]).length)}).sort(function(a,b){return String(rows[b].last_done||'').localeCompare(String(rows[a].last_done||''))}),h=ids.length?'':'<div class="history-empty">'+t('لم تسجل أي تجربة بعد.','You have no saved activities yet.')+'</div>';ids.forEach(function(id){var r=rows[id],x=byId[id];h+='<div class="history-row"><b>'+esc(x?x.title:id)+'</b><small>نفذت '+(r.count||0)+' مرات · '+(r.notes||[]).length+' ملاحظات</small></div>'});h+='<div class="sheet-actions"><button class="btn secondary" id="exportAll">'+t('تصدير سجلي','Export history')+'</button><button class="btn danger" id="clearAll">'+t('حذف سجلي','Delete history')+'</button></div>';openSheet(t('سجلي','History'),h);el('exportAll').onclick=downloadExport;el('clearAll').onclick=function(){if(confirm('حذف كل العدادات والملاحظات المحلية؟')){activity.clear();closeSheet();renderLibrary();toast('تم حذف السجل المحلي.')}}}
function downloadExport(){var blob=new Blob([JSON.stringify(activity.exportPayload(),null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='a1-activity-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(function(){URL.revokeObjectURL(url)},400)}
function openHelpers(prefer){openSheet(t('أدوات مساعدة','Activity tools'),'<div class="helper-tabs"><button class="chip" data-helper-tab="timer">'+t('⏱ مؤقت','⏱ Timer')+'</button><button class="chip" data-helper-tab="signal">'+t('🚦 إشارة','🚦 Signal')+'</button><button class="chip" data-helper-tab="whiteboard">'+t('✏️ صبورة','✏️ Whiteboard')+'</button></div><div id="helperBody"></div>');var tab=prefer||'timer';eachNode('[data-helper-tab]',function(b){if(b.getAttribute('data-helper-tab')===tab)setClassFlag(b,'active',true);b.onclick=function(){eachNode('[data-helper-tab]',function(x){setClassFlag(x,'active',false)});setClassFlag(this,'active',true);renderHelperTab(this.getAttribute('data-helper-tab'))}});renderHelperTab(tab)}
function renderHelperTab(tab){var b=el('helperBody');if(timerInt){clearInterval(timerInt);timerInt=null}if(tab==='timer'){b.innerHTML='<div class="timer-tool"><div id="timerDisplay">01:00</div><div class="action-row"><button class="btn secondary" data-min="1">1 دقيقة</button><button class="btn secondary" data-min="3">3 دقائق</button><button class="btn secondary" data-min="5">5 دقائق</button></div><button id="timerStart" class="btn primary wide">ابدأ</button></div>';timerLeft=60;eachNode('[data-min]',function(x){x.onclick=function(){timerLeft=Number(this.getAttribute('data-min'))*60;updateTimer()}});el('timerStart').onclick=function(){if(timerInt)clearInterval(timerInt);timerInt=setInterval(function(){timerLeft--;updateTimer();if(timerLeft<=0){clearInterval(timerInt);timerInt=null;toast('انتهى الوقت')}},1000)};return}if(tab==='signal'){b.innerHTML='<div class="signal-tool"><div id="signalFace" class="signal-face wait">انتظر</div><div class="signal-buttons"><button data-signal="go">ابدأ</button><button data-signal="wait">انتظر</button><button data-signal="stop">توقف</button></div></div>';eachNode('[data-signal]',function(x){x.onclick=function(){var v=this.getAttribute('data-signal'),f=el('signalFace');f.className='signal-face '+v;f.textContent=v==='go'?'ابدأ':v==='stop'?'توقف':'انتظر'}});return}b.innerHTML='<div class="whiteboard-tool"><canvas id="board" width="900" height="520"></canvas><div class="action-row"><button id="clearBoard" class="btn ghost">مسح الصبورة</button></div></div>';setupBoard()}
function updateTimer(){var m=Math.floor(timerLeft/60),s=timerLeft%60;if(el('timerDisplay'))el('timerDisplay').textContent=String(m).padStart(2,'0')+':'+String(s).padStart(2,'0')}
function setupBoard(){var c=el('board'),ctx=c.getContext('2d'),down=false,last=null;ctx.lineWidth=10;ctx.lineCap='round';ctx.strokeStyle='#17343a';function pos(e){var r=c.getBoundingClientRect(),p=e.touches?e.touches[0]:e;return{x:(p.clientX-r.left)*c.width/r.width,y:(p.clientY-r.top)*c.height/r.height}}function start(e){down=true;last=pos(e);if(e.cancelable)e.preventDefault()}function move(e){if(!down)return;var p=pos(e);ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;if(e.cancelable)e.preventDefault()}function end(){down=false;last=null}c.addEventListener('mousedown',start);c.addEventListener('mousemove',move);window.addEventListener('mouseup',end);c.addEventListener('touchstart',start,{passive:false});c.addEventListener('touchmove',move,{passive:false});c.addEventListener('touchend',end);el('clearBoard').onclick=function(){ctx.clearRect(0,0,c.width,c.height)}}
function openSheet(title,body){
pauseSession();
if(window.A1RecordedVoice)window.A1RecordedVoice.stop();
var sh=el('sheet'),buttons,i,card=sh?sh.querySelector('.sheet-card'):null,bodyEl=el('sheetBody'),legacy=isLegacyDrawingDevice(),shell=appShell();if(!sh)return;
el('sheetTitle').textContent=title;bodyEl.innerHTML=body;setClassFlag(sh,'legacy-sheet-page',legacy);setClassFlag(document.body,'legacy-sheet-active',legacy);
try{sh.hidden=false}catch(e){}sh.removeAttribute('hidden');sh.style.display='block';sh.setAttribute('aria-hidden','false');
if(legacy){
 legacySheetScroll=window.pageYOffset||document.documentElement.scrollTop||document.body.scrollTop||0;
 if(shell)shell.style.display='none';document.body.style.overflow='auto';sh.style.position='static';sh.style.minHeight='100%';
 try{window.scrollTo(0,0)}catch(e){}
}else{
 document.body.style.overflow='hidden';sh.style.position='';sh.style.minHeight='';
}
if(card)card.scrollTop=0;if(bodyEl)bodyEl.scrollTop=0;buttons=sh.querySelectorAll?sh.querySelectorAll('[data-close-sheet]'):[];for(i=0;i<buttons.length;i++)buttons[i].onclick=function(e){if(e&&e.preventDefault)e.preventDefault();closeSheet(false)};
if(!sheetHistoryActive&&window.history&&history.pushState){try{history.pushState({a1Sheet:true},'',window.location.href);sheetHistoryActive=true}catch(e){}}
}
function hideSheet(){
if(timerInt){clearInterval(timerInt);timerInt=null}if(drawingSession&&drawingSession.destroy){drawingSession.destroy();drawingSession=null}
var sh=el('sheet'),shell=appShell(),legacy=sh&&sh.className&&(' '+sh.className+' ').indexOf(' legacy-sheet-page ')>=0;
setClassFlag(sh,'drawing-open',false);setClassFlag(sh,'legacy-drawing-open',false);setClassFlag(sh,'legacy-sheet-page',false);setClassFlag(document.body,'legacy-sheet-active',false);
if(!sh)return;try{sh.hidden=true}catch(e){}sh.setAttribute('hidden','hidden');sh.setAttribute('aria-hidden','true');sh.style.display='none';sh.style.position='';sh.style.minHeight='';document.body.style.overflow='';
if(shell)shell.style.display='';if(legacy)setTimeout(function(){try{window.scrollTo(0,legacySheetScroll||0)}catch(e){}},0)
}
function closeSheet(fromPop){hideSheet();if(sheetHistoryActive){sheetHistoryActive=false;if(!fromPop&&window.history&&history.back){sheetClosingFromPop=true;try{history.back()}catch(e){sheetClosingFromPop=false}}}}
function bindHeader(){
var select=el('appLanguage');if(select)select.onchange=changeLanguage;var b=el('libraryBtn');if(b)b.onclick=renderLibrary;b=el('historyBtn');if(b)b.onclick=openHistory;b=el('helpersBtn');if(b)b.onclick=function(){openHelpers(null)};b=el('drawingBtn');if(b)b.onclick=openDrawingLab;b=el('settingsBtn');if(b)b.onclick=openSettings;
document.addEventListener('keydown',function(e){var sh=el('sheet');if(e.key==='Escape'&&sh&&!sh.hidden)closeSheet(false)});
window.addEventListener('popstate',function(){var sh=el('sheet');if(sheetClosingFromPop){sheetClosingFromPop=false;return}if(sh&&sh.getAttribute('aria-hidden')==='false'){sheetHistoryActive=false;hideSheet()}},false)
}
function boot(){renderLoading();Promise.all([fetch('experiences.json?v=20261022',{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error('experiences '+r.status);return r.json()}),fetch('storyboards/manifest.json?v=20261023-photo1-20261113',{cache:'no-store'}).then(function(r){return r.ok?r.json():{assets:{}}}).catch(function(){return{assets:{}}}),fetch('icons/manifest.json?v=1',{cache:'no-store'}).then(function(r){return r.ok?r.json():{assets:{}}}).catch(function(){return{assets:{}}}),fetch('community.json?v=1',{cache:'no-store'}).then(function(r){return r.ok?r.json():{enabled:false}}).catch(function(){return{enabled:false}})]).then(function(res){data=res[0];items=data.experiences||[];storyboards=res[1].assets||{};previews=res[1].previews||{};localized=res[1].localized_assets||{};covers=res[2].assets||{};community=res[3]||{enabled:false};families=engine.familyMap(data);levels=engine.levelMap(data);byId={};items.forEach(function(x){byId[x.id]=x});if(items.length!==data.count)throw new Error('المكتبة غير مكتملة: '+items.length);loadPrefs();storageStatus();rememberAge();if(route.family&&families[route.family])state.filters.families=[route.family];if(route.level)state.filters.levels=[route.level];window.A1TurnTaking={open:function(id){var x=/^[0-9]{3}$/.test(String(id))&&byId[id];if(!x)return false;ageGroup=x.age_groups[0];rememberAge();state.filters={text:'',levels:[],families:[],availability:[],energy:'all',place:'all'};openExperience(id);return true},library:renderLibrary,start:function(options){options=options||{};ageGroup=options.age==='4-8'?'4-8':'1-4';rememberAge();state.filters.levels=ageGroup==='4-8'?[5]:[];state.filters.families=options.family&&families[options.family]?[options.family]:[];state.filters.text='';state.filters.availability=[];state.filters.energy='all';state.filters.place='all';var list=getFiltered();if(!list.length)return false;autoMode=options.autoplay!==false;sessionPaused=false;stopSession();sessionRemaining=Math.max(30,Math.min(1800,Number(options.duration_seconds)||300));route.seconds=sessionRemaining;practiceSeconds=window.A1PracticeCountdown.seconds(options.practice_seconds);openExperience(list[0].id);return true},pause:function(){if(autoMode&&!sessionPaused&&el('sessionToggle'))el('sessionToggle').click();if(window.A1ScenePlayer)window.A1ScenePlayer.pause();if(window.A1RecordedVoice)window.A1RecordedVoice.stop()},resume:function(){if(autoMode&&sessionPaused&&el('sessionToggle'))el('sessionToggle').click();else if(!autoMode&&state.experience&&window.A1ScenePlayer)window.A1ScenePlayer.play()},stop:function(){endSession('stopped')},state:function(){return{age:ageGroup,auto:autoMode,experience:state.experience&&state.experience.id,remaining:sessionRemaining,paused:sessionPaused,phase:sessionPhase,practice_remaining:practice.remaining(),practice_extended:practice.extended()}}};if(window.A1AutoCoach)window.A1AutoCoach.mount({openSheet:openSheet,closeSheet:closeSheet,families:data.families,t:t,familyName:familyName});if(route.experience&&byId[route.experience]){ageGroup=byId[route.experience].age_groups[0];rememberAge();state.filters.levels=[];state.filters.families=[];openExperience(route.experience)}else if(autoMode&&getFiltered().length)openExperience(getFiltered()[0].id);else renderLibrary()}).catch(function(e){renderError(e.message||'خطأ غير معروف')})}
bindHeader();boot();
}());
