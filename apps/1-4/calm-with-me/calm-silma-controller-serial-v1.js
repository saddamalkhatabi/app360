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
 try{if(w.speechSynthesis&&w.speechSynthesis.cancel)w.speechSynthesis.cancel()}catch(e){}
}
function play(item,report){
 stop();if(!item)return false;
 last=item;lastReport=report;var replay=d.getElementById('calmReplayVoiceBtn');if(replay)replay.disabled=false;
 var token=generation,phrase=item.speech_ar||item.label_ar||'',failedOnce=false,kind=sourceKind(item);
 target=findTarget(item.id,kind);add(target);
 if(target)timer=setTimeout(function(){if(token===generation)clearFocus()},20000);
 function finish(){if(token===generation){current=null;clearFocus()}}
 function browserVoice(){
  if(token!==generation)return false;
  if(!phrase){finish();status(report,'لا توجد عبارة صوتية لهذا الخيار.');return false}
  try{
   if(w.speechSynthesis&&w.SpeechSynthesisUtterance){
    var u=new w.SpeechSynthesisUtterance(phrase);u.lang='ar-SA';u.rate=.86;
    u.onend=finish;u.onerror=finish;w.speechSynthesis.speak(u);
    status(report,'الصوت من المتصفح؛ تسجيل SILMA غير متوفر لهذا الخيار.');
    return true;
   }
  }catch(e){}
  finish();status(report,'الصوت غير متاح؛ اتبع النص والصورة.');return false;
 }
 var index=w.APP360_CALM_SILMA_INDEX||{},entry=(kind&&index[kind+':'+item.id])||index[item.id],path='';
 if(item.audio)path=item.audio;
 else if(entry&&entry.verified===true&&entry.path&&entry.engine==='silma'&&entry.event_id==='calm-with-me:'+entry.kind+':'+item.id)path=entry.path;
 if(!path)return browserVoice();
 function fallback(){
  if(token!==generation||failedOnce)return;
  failedOnce=true;
  if(current){try{current.pause()}catch(e){}current=null}
  browserVoice();
 }
 try{
  if(!w.Audio)return fallback(),false;
  var audio=new w.Audio(path);current=audio;
  audio.onended=finish;audio.onerror=fallback;
  status(report,item.audio?'تشغيل التسجيل العائلي المحلي.':entry&&entry.preview_only?'تشغيل صوت SILMA التجريبي؛ لم يُعتمد بعد.':'تشغيل تسجيل SILMA المعتمد.');
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
w.APP360CalmNarration={play:play,stop:stop,replay:replayLast,source:'optional-verified-SILMA'};
if(d.readyState==='loading'&&d.addEventListener)d.addEventListener('DOMContentLoaded',addReplay,false);else addReplay();
if(d.addEventListener){d.addEventListener('visibilitychange',function(){if(d.hidden)stop()},false);d.addEventListener('change',function(e){var t=e&&e.target;if(t&&t.id==='speechToggle'&&!t.checked)stop()},true);d.addEventListener('click',function(e){var t=e&&e.target;while(t&&t!==d){if(t.id&&(/^nav-/.test(t.id)||t.id==='schoolOpenNav')){stop();return}t=t.parentNode}},true)}
})(window,document);
