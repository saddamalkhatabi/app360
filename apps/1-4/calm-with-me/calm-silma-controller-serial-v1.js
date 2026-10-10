(function(w,d){
'use strict';
/* Optional SILMA layer. Never tries an unverified or missing generated clip. */
var current=null,target=null,timer=null,generation=0,last=null,lastReport=null;
function status(fn,msg){if(typeof fn==='function')try{fn(msg)}catch(e){}}
function add(el){if(el&&(' '+(el.className||'')+' ').indexOf(' audio-target-active ')<0)el.className=(el.className?el.className+' ':'')+'audio-target-active'}
function remove(el){if(el)el.className=(' '+(el.className||'')+' ').replace(' audio-target-active ',' ').replace(/^\s+|\s+$/g,'')}
function sourceKind(item){
 var source=w.APP360_CALM_CONTENT||{},names=['signals','feelings','helps','transitions'],i,j,arr,one;
 if(!item||!item.id)return '';
 for(i=0;i<names.length;i++){
  arr=source[names[i]]||[];
  for(j=0;j<arr.length;j++){one=arr[j];
   if(one&&one.id===item.id&&(one===item||(one.speech_ar===item.speech_ar&&one.label_ar===item.label_ar)))return names[i];
  }
 }
 return '';
}
function findTarget(id,kind){
 if(!id||!d.querySelectorAll)return null;
 var a=d.querySelectorAll('button[data-id],button[data-help],button[data-step]'),i,b;
 for(i=0;i<a.length;i++){
  b=a[i];
  if(kind==='helps'&&b.getAttribute('data-help')!==id)continue;
  if(kind==='transitions'&&b.getAttribute('data-step')!==id)continue;
  if((kind==='signals'||kind==='feelings')&&b.getAttribute('data-id')!==id)continue;
  if(b.getAttribute('data-id')===id||b.getAttribute('data-help')===id||b.getAttribute('data-step')===id)return b;
 }
 return null;
}
function clearFocus(){if(timer){clearTimeout(timer);timer=null}remove(target);target=null}
function stop(){
 generation++;clearFocus();
 if(current){try{current.onended=null;current.onerror=null;current.pause()}catch(e){}current=null}
 if(w.APP360CalmVoice&&w.APP360CalmVoice.stop)w.APP360CalmVoice.stop();
 if(w.APP360CalmIntro&&w.APP360CalmIntro.stop)w.APP360CalmIntro.stop();
}
function play(item,report){
 stop();if(!item)return false;
 last=item;lastReport=report;var replay=d.getElementById('calmReplayVoiceBtn');if(replay)replay.disabled=false;
 var token=generation,phrase=item.speech_ar||item.label_ar||'',failedOnce=false,kind=sourceKind(item);
 target=findTarget(item.id,kind);add(target);
 if(target)timer=setTimeout(function(){if(token===generation)clearFocus()},20000);
 function finish(){if(token===generation){current=null;clearFocus()}}
 var locale=w.APP360CalmVoice?w.APP360CalmVoice.getLanguage():'ar';
 var index=w.APP360_CALM_SILMA_INDEX||{},entry=(kind&&index[kind+':'+item.id])||index[item.id],path='';
 var bilingual=w.APP360_CALM_BILINGUAL_AUDIO||{},choice=kind&&bilingual.choices&&bilingual.choices[kind+':'+item.id];
 if(item.audio)path=item.audio;
 else if(locale==='en'){
   if(choice&&choice.en&&choice.en.path)path=choice.en.path;
 }else if(entry&&entry.verified===true&&entry.path&&entry.engine==='silma'&&entry.event_id==='calm-with-me:'+entry.kind+':'+item.id)path=entry.path;
 if(!path){finish();status(report,locale==='en'?'English MP3 missing; recording is being prepared.':'التسجيل العربي غير متاح لهذا الخيار.');return false}
 function fallback(){
  if(token!==generation||failedOnce)return;
  failedOnce=true;
  if(current){try{current.pause()}catch(e){}current=null}
  finish();status(report,locale==='en'?'Could not play saved English MP3.':'تعذر تشغيل التسجيل المحفوظ.');
 }
 try{
  if(!w.Audio)return fallback(),false;
  var audio=new w.Audio(path);current=audio;
  audio.onended=finish;audio.onerror=fallback;
  if(w.APP360CalmVoice&&w.APP360CalmVoice.showChoiceCaption&&!item.audio)w.APP360CalmVoice.showChoiceCaption(kind,item.id);
  status(report,item.audio?'تشغيل تسجيل الأسرة المحلي.':locale==='en'?'تشغيل ملف MP3 الإنجليزي المحفوظ.':'تشغيل الصوت المسجل.');
  var p=audio.play();
  if(p&&typeof p.then==='function')p.then(null,fallback);
  return true;
 }catch(e){fallback();return false}
}
function replayLast(){var sw=d.getElementById('speechToggle');if(sw&&!sw.checked){status(lastReport,'الصوت مُوقَف في الإعدادات.');return false}return last?play(last,lastReport):false}
function addReplay(){
 var host=d.getElementById('signalCards');if(!host||!host.parentNode||d.getElementById('calmReplayVoiceBtn'))return;
 var b=d.createElement('button');b.type='button';b.id='calmReplayVoiceBtn';b.className='secondary calm-replay-btn';b.textContent='🔊 أَعِدْ سَمَاعَ آخِرِ اخْتِيَارٍ';b.disabled=true;
 b.setAttribute('aria-label','إعادة سماع آخر اختيار');b.onclick=replayLast;
 host.parentNode.insertBefore(b,host.nextSibling);
}
w.APP360CalmNarration={play:play,stop:stop,replay:replayLast,source:'prerecorded-MP3-only-bilingual'};
if(d.readyState==='loading'&&d.addEventListener)d.addEventListener('DOMContentLoaded',addReplay,false);else addReplay();
if(d.addEventListener){d.addEventListener('visibilitychange',function(){if(d.hidden)stop()},false);d.addEventListener('change',function(e){var t=e&&e.target;if(t&&t.id==='speechToggle'&&!t.checked)stop()},true);d.addEventListener('click',function(e){var t=e&&e.target;while(t&&t!==d){if(t.id&&(/^nav-/.test(t.id)||t.id==='schoolOpenNav')){stop();return}t=t.parentNode}},true)}
})(window,document);
