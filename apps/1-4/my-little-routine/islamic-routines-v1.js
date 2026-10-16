/* One application, two age-adapted libraries. ES5 for older family tablets. */
(function(w,d){
'use strict';
var C=w.APP360_ISLAMIC_ROUTINES,D=w.ROUTINE_DATA,A=w.APP360_ISLAMIC_AUDIO||{clips:{},habits:{ar:{},en:{}}};
if(!C||!D)return;
function q(k,s){var m=String(s||'').match(new RegExp('[?&]'+k+'=([^&]*)'));try{return m?decodeURIComponent(m[1]):''}catch(e){return ''}}
var search=w.location.search,age=q('routine_age',search)||q('launch_age',search)||q('age',search),level=q('launch_level',search);
if(!age&&level)age=level==='2'?'4-8':'1-4';
if(!age)try{if(w.parent!==w)age=q('age',w.parent.location.search)}catch(e){}
if(age!=='4-8'&&age!=='1-4')try{age=w.localStorage.getItem('app360-routine-age-v1')}catch(e){}
if(age!=='4-8')age='1-4';
w.APP360_ROUTINE_AGE=age;
w.APP360_ROUTINE_STORAGE_KEY=age==='4-8'?'app360-a4-routine-v1':'app360-a1-routine-v2';
var advanced=age==='4-8',byId={},i,j,r,h,rows=[],next=51;
function E(id){return d.getElementById(id)}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function en(){return w.APP360_ROUTINE_LANG==='en'}
function t(ar,english){return en()?english:ar}
for(i=0;i<D.habits.length;i++)byId[D.habits[i].id]=D.habits[i];
for(i=0;i<C.routines.length;i++){
 r=C.routines[i];
 if(r.basic===advanced)continue;
 h=advanced?null:byId[({'greet':'hello','bedtime':'get-ready-for-sleep'})[r.id]||r.id];
 if(!h){h={id:r.id,num:advanced?rows.length+1:next++,category:r.category,icon:'',demo:false};rows.push(h)}
 if(h.steps)h.previousRoutineSteps={ar:h.steps.slice(0),en:((w.APP360_ROUTINE_ENGLISH_LABELS||{})[h.id]||{}).steps||[]};
 h.title=r.title;h.steps=r.steps.slice(0);h.tip=r.tip||'';h.islamic=r;h.storyboard='';h.demo=false;
 h.icon='<img class="routineScenePicture" src="assets/routine-scenes/'+r.scenes[0]+'.svg" alt="'+esc(r.title)+'">';
 h.arts=[];
 for(j=0;j<5;j++)h.arts.push('<img class="routineScenePicture" src="assets/routine-scenes/'+r.scenes[j]+'.svg" alt="'+esc(r.steps[j])+'">');
 (w.APP360_ROUTINE_ENGLISH_LABELS||{})[h.id]={title:r.title_en,steps:r.steps_en.slice(0)};
}
if(advanced){D.habits=rows;D.categories=[
 {id:'food',title:'آداب الطعام والشراب',icon:'🍽',accent:'#e49c30'},
 {id:'daily',title:'بدايات يومي ونهاياته',icon:'☀',accent:'#8665cd'},
 {id:'hygiene',title:'النظافة والخصوصية',icon:'💧',accent:'#2694bb'},
 {id:'faith',title:'الوضوء والمسجد والصلاة',icon:'🕌',accent:'#21896c'},
 {id:'social',title:'الأخلاق والتعامل',icon:'💛',accent:'#c45c70'},
 {id:'nature',title:'الماء والمكان والمخلوقات',icon:'🌱',accent:'#438e51'},
 {id:'learning',title:'العلم والمسؤولية',icon:'📚',accent:'#5472be'}];
}else D.habits=D.habits.concat(rows);
D.templates=D.habits.slice(0);
// A changed text must never play an older recording of a different sentence.
function sameSteps(a,b){return a&&b&&a.join('|')===b.join('|')}
function installAudio(){
 var langs=['ar','en'],k,index,entries,habit,entry,expected;
 for(k=0;k<langs.length;k++){
  index=langs[k]==='ar'?w.APP360_ROUTINE_NARRATIONS:w.APP360_ROUTINE_NARRATIONS_EN;
  if(!index)continue;
  entries=A.habits&&A.habits[langs[k]]||{};
  for(i=0;i<D.habits.length;i++){
   habit=D.habits[i];if(!habit.islamic)continue;
   expected=habit.islamic[langs[k]==='ar'?'steps':'steps_en'];entry=entries[habit.islamic.id];
   if(entry&&entry.verified&&sameSteps(entry.steps,expected))index.habits[habit.id]=entry;
   else delete index.habits[habit.id];
  }
 }
}
w.APP360_ROUTINE_INSTALL_ISLAMIC_AUDIO=installAudio;
// After narration indexes load, the small bridge invokes the installer before voice binding.
var playing=null,active='',currentId='',repeated=false;
function clearWords(){var words=E('routineDuaText')&&E('routineDuaText').querySelectorAll('.duaWord'),i;if(words)for(i=0;i<words.length;i++)words[i].className='duaWord'}
function followWords(clip,ms){var api=w.APP360_FAMILY_SYNC;if(api&&api.getReadingFocus&&!api.getReadingFocus()){clearWords();return}var words=E('routineDuaText').querySelectorAll('.duaWord'),cues=clip.cues||[],n=-1,i;for(i=0;i<cues.length;i++)if(ms>=cues[i][1]&&ms<=cues[i][2])n=cues[i][0];for(i=0;i<words.length;i++)words[i].className='duaWord'+(i===n?' active':'')}
function stop(){clearWords();active='';if(playing){playing.pause();playing=null}if(E('duaRepeat'))E('duaRepeat').textContent=t('🔁 أسمع وأردد','🔁 Listen and repeat')}
function play(id,repeat){
 stop();if(E('sound')&&E('sound').textContent.indexOf('🔇')>=0)return;
 var clip=A.clips&&A.clips[id];if(!clip||!clip.verified)return;
 if(w.APP360_RoutineVoice)w.APP360_RoutineVoice.stop();
 var audio=new w.Audio(clip.path+'?v=20261016');playing=audio;active=id;repeated=false;
 audio.ontimeupdate=function(){if(playing===audio&&id.indexOf('dua-')===0)followWords(clip,audio.currentTime*1000)};
 audio.onended=function(){if(playing!==audio)return;clearWords();if(repeat&&!repeated){repeated=true;E('duaRepeat').textContent=t('دورك الآن… ثم نسمعها مجددًا','Your turn… then listen again');w.setTimeout(function(){if(playing!==audio)return;audio.currentTime=0;var p=audio.play();if(p&&p.catch)p.catch(stop)},Math.max(1800,Math.min(6000,clip.duration_ms)))}else stop()};
 audio.onerror=stop;var p=audio.play();if(p&&p.catch)p.catch(stop);
}
function current(){return w.APP360_RoutineReel&&w.APP360_RoutineReel.currentHabit?w.APP360_RoutineReel.currentHabit():null}
function selectedDua(h){
 var keys=[],key,r=h&&h.islamic;if(!r)return keys;
 for(key in r.duas)if(r.duas.hasOwnProperty(key)&&keys.indexOf(r.duas[key])<0)keys.push(r.duas[key]);return keys;
}
function renderDua(){
 var h=current(),box=E('routineDuaPanel'),list=selectedDua(h),id=E('routineDuaSelect')&&E('routineDuaSelect').value;
 if(!box)return;if(!list.length){box.style.display='none';currentId=h?h.id:'';stop();return}
 if(currentId!==h.id||list.indexOf(id)<0)id=list[0];
 if(currentId!==h.id)stop();currentId=h.id;
 var v=C.duas[id],options='',i;
 for(i=0;i<list.length;i++)options+='<option value="'+esc(list[i])+'"'+(id===list[i]?' selected':'')+'>'+esc(C.duas[list[i]].text)+'</option>';
 box.style.display='block';E('routineDuaSelect').innerHTML=options;E('routineDuaSelect').style.display=list.length>1?'block':'none';
 var quick='';for(i=0;i<list.length;i++){var dk=list[i],label=dk==='bismillah'?t('قبل الطعام أو الشراب','Before eating or drinking'):dk==='hamd'?t(h.islamic.scene==='sneeze'?'بعد عطاسي':'بعد الطعام أو الشراب',h.islamic.scene==='sneeze'?'After my sneeze':'After eating or drinking'):t('أسمع هذا الذكر','Hear this remembrance');quick+='<button type="button" data-quick-dua="'+dk+'"'+(!(A.clips['dua-'+dk]&&A.clips['dua-'+dk].verified)?' disabled':'')+'><small>'+esc(label)+'</small><b dir="rtl" lang="ar">'+esc(C.duas[dk].text)+'</b></button>'}E('routineDuaQuick').innerHTML=list.length>1?quick:'';
 E('routineDuaText').innerHTML=v.text.split(/\s+/).map(function(word){return '<span class="duaWord">'+esc(word)+'</span>'}).join(' ');E('routineDuaMeaning').textContent=t(v.meaning_ar,v.meaning_en);
 E('routineDuaSource').href=v.url;E('routineDuaSource').textContent=t('المصدر: ','Source: ')+v.source;
 E('duaListen').disabled=E('duaRepeat').disabled=!(A.clips['dua-'+id]&&A.clips['dua-'+id].verified);
 E('duaMeaningListen').disabled=!(A.clips['meaning-'+id+'-'+(en()?'en':'ar')]&&A.clips['meaning-'+id+'-'+(en()?'en':'ar')].verified);
 E('routineDuaAudioStatus').textContent=E('duaListen').disabled?t('التسجيل قيد التجهيز','Recording is being prepared'):'';
}
function challenge(){
 var h=current(),panel=E('routineChallenge');if(!advanced||!h||!h.islamic){panel.style.display='none';return}
 panel.style.display='block';var correct=h.islamic.duas,keys=selectedDua(h),answer=keys[0],other,choices=[],j;
 if(answer){
  for(j in C.duas)if(j!==answer&&keys.indexOf(j)<0){other=j;break}
  choices=[answer,other];if(h.num%2===0)choices.reverse();
  E('routineQuestion').textContent=t(h.islamic.question_ar||'أي ذكر يناسب هذا الموقف؟',h.islamic.question_en||'Which remembrance fits this situation?');
  E('routineChoices').innerHTML=choices.map(function(id){return '<button type="button" data-dua-answer="'+id+'">'+esc(C.duas[id].text)+'</button>'}).join('');
 }else{
  E('routineQuestion').textContent=t('أي تصرف أختار؟','Which action should I choose?');
  var right=h.steps[2],wrong=t('أدفع غيري وأتجاهل ما يحتاجه','I push others and ignore their needs');
  var opts=[{text:right,ok:true},{text:wrong,ok:false}];if(h.num%2===0)opts.reverse();
  E('routineChoices').innerHTML=opts.map(function(x){return '<button type="button" data-action-answer="'+x.ok+'">'+esc(x.text)+'</button>'}).join('');
 }
 E('routineQuestionFeedback').textContent='';
 E('routineChoices').onclick=function(ev){var b=ev.target||ev.srcElement;if(!b.getAttribute)return;var ok=answer?b.getAttribute('data-dua-answer')===answer:b.getAttribute('data-action-answer')==='true';E('routineQuestionFeedback').textContent=ok?t('أحسنت! نجرب هذا في حياتنا.','Well done! Let us practise in real life.'):t('نحاول مرة أخرى. استمع للموقف أو اكشف الإجابة.','Try again. Listen to the situation or show the answer.');if(ok){b.className='correct';if(answer)play('dua-'+answer,false)}};
 E('routineShowAnswer').onclick=function(){E('routineQuestionFeedback').textContent=answer?C.duas[answer].text:h.steps[2]};
}
function sync(){renderDua();challenge();}
w.APP360_ROUTINE_DUA_STOP=stop;
function init(){
 var top=d.querySelector('.top'),switcher=d.createElement('div');switcher.className='routineAgeSwitch';
 switcher.innerHTML='<label for="routineAge">'+t('محتوى الفئة العمرية','Age group content')+'</label><select id="routineAge"><option value="1-4">'+t('1–4 · عاداتي الأولى','1–4 · My first routines')+'</option><option value="4-8">'+t('4–8 · عاداتي وأذكاري','4–8 · My routines and remembrance')+'</option></select>';
 top.parentNode.insertBefore(switcher,top.nextSibling);E('routineAge').value=age;
 E('routineAge').onchange=function(){stop();if(w.APP360_RoutineVoice)w.APP360_RoutineVoice.stop();try{w.localStorage.setItem('app360-routine-age-v1',this.value)}catch(e){}var u=w.location.href.split('#')[0].replace(/([?&])(?:routine_age|launch_age|launch_level)=[^&]*/g,'$1').replace(/[?&]+$/,'').replace(/\?&/,'?').replace(/&&+/g,'&');w.location.href=u+(u.indexOf('?')>=0?'&':'?')+'routine_age='+this.value+'&launch_age='+this.value+'&launch_level='+(this.value==='4-8'?'2':'1')};
 var home=d.querySelector('.top a.home');if(home)home.href=home.getAttribute('href').replace(/age=1-4/,'age='+age);
 var brand=d.querySelector('.brand small');if(brand)brand.textContent=t('مدرسة العائلة 360 · الفئة '+age+' سنوات','Family School 360 · Ages '+age);
 d.querySelector('.habitCount').textContent=D.habits.length+t(' عادة',' routines');
 d.querySelector('.brand p').textContent=advanced?t('عادات وأذكار نفهمها ونجربها في حياتنا.','Routines and remembrance to understand and practise.'):t('عادات قصيرة بالصورة والصوت والتقليد اللطيف.','Small routines with pictures, sound and gentle imitation.');
 d.querySelector('.libraryHead h2').textContent=advanced?t('24 موقفًا لبناء العادات والأخلاق والأذكار','24 situations for routines, kindness and remembrance'):t('52 عادة صغيرة للحياة اليومية','52 small everyday routines');
 d.querySelector('.libraryHead p').textContent=t('اختر عادة، شاهد خطواتها، ثم جربها في الواقع.','Choose a routine, watch the steps, then try it in real life.');
 d.querySelector('.routineIntro h2').textContent=advanced?t('أشاهد، أفهم، أردد، ثم أطبق','Watch, understand, repeat and practise'):t('خطوة قصيرة… ثم أجرب مع المرافق','One small step, then practise with a grown-up');
 d.querySelector('.routineIntro p').textContent=t('يمكن مشاهدة القصة كاملة أو التركيز على خطوة وإعادة صوتها. نختصر حسب استعداد الطفل.','Watch the whole story or focus on a step and replay its sound. Shorten the routine to suit the child.');
 d.querySelector('.designNote').style.display='none';
 d.querySelector('.introMark small').textContent=t('أتعلم خطوة خطوة','I learn step by step');
 var box=d.createElement('section');box.id='routineDuaPanel';box.className='routineDuaPanel';box.setAttribute('aria-label',t('الذكر ومعناه','Remembrance and meaning'));
 box.innerHTML='<h3>'+t('ذكر يناسب الموقف','Remembrance for this moment')+'</h3><select id="routineDuaSelect" aria-label="'+t('اختر الذكر','Choose remembrance')+'"></select><div id="routineDuaQuick" class="routineDuaQuick"></div><p id="routineDuaText" lang="ar" dir="rtl"></p><p id="routineDuaMeaning"></p><div class="duaActions"><button id="duaListen" type="button">'+t('🔊 أسمع الذكر','🔊 Hear the remembrance')+'</button><button id="duaRepeat" type="button">'+t('🔁 أسمع وأردد','🔁 Listen and repeat')+'</button><button id="duaMeaningListen" type="button">'+t('🔉 أسمع المعنى','🔉 Hear the meaning')+'</button></div><small id="routineDuaAudioStatus" role="status"></small><details><summary>'+t('للمرافق: المصدر','For grown-ups: source')+'</summary><a id="routineDuaSource" target="_blank" rel="noopener"></a></details>';
 E('storyBoard').appendChild(box);
 E('routineDuaSelect').onchange=function(){stop();renderDua()};
 E('routineDuaQuick').onclick=function(e){var b=e.target||e.srcElement;while(b&&b!==this){if(b.getAttribute&&b.getAttribute('data-quick-dua')){E('routineDuaSelect').value=b.getAttribute('data-quick-dua');renderDua();play('dua-'+E('routineDuaSelect').value,false);return}b=b.parentNode}};
 E('duaListen').onclick=function(){play('dua-'+E('routineDuaSelect').value,false)};
 E('duaRepeat').onclick=function(){play('dua-'+E('routineDuaSelect').value,true)};
 E('duaMeaningListen').onclick=function(){play('meaning-'+E('routineDuaSelect').value+'-'+(en()?'en':'ar'),false)};
 var cp=d.createElement('section');cp.id='routineChallenge';cp.className='routineChallenge';cp.innerHTML='<h3 id="routineQuestion"></h3><div id="routineChoices"></div><button type="button" id="routineShowAnswer">'+t('أرني الإجابة','Show the answer')+'</button><p id="routineQuestionFeedback" role="status" aria-live="polite"></p>';E('storyBoard').appendChild(cp);
 var ids=['prevHabit','nextHabit','habitCards','categoryRail'],i;
 for(i=0;i<ids.length;i++)if(E(ids[i])){E(ids[i]).addEventListener('click',function(){w.setTimeout(sync,100)},false);E(ids[i]).addEventListener('touchend',function(){w.setTimeout(sync,110)},false)}
 var stopIds=['tabs','sound','useHabit','listenFullRoutine','speakStory','listenRoutineScene','playStory','speakStep'];
 d.addEventListener('click',function(e){var x=e.target||e.srcElement;while(x&&x!==d){if(x.id&&stopIds.indexOf(x.id)>=0){stop();return}x=x.parentNode}},true);
 for(i=0;i<stopIds.length;i++)if(E(stopIds[i]))E(stopIds[i]).addEventListener('click',stop,false);
 w.addEventListener('pagehide',stop,false);d.addEventListener('visibilitychange',function(){if(d.hidden)stop()},false);
 sync();
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
