(function(w,d){
'use strict';
/* Optional SILMA layer. Never tries an unverified or missing generated clip. */
var current=null,target=null,timer=null,generation=0;
function status(fn,msg){if(typeof fn==='function')try{fn(msg)}catch(e){}}
function add(el){if(el&&(' '+(el.className||'')+' ').indexOf(' audio-target-active ')<0)el.className=(el.className?el.className+' ':'')+'audio-target-active'}
function remove(el){if(el)el.className=(' '+(el.className||'')+' ').replace(' audio-target-active ',' ').replace(/^\s+|\s+$/g,'')}
function findTarget(id){
 if(!id||!d.querySelectorAll)return null;
 var a=d.querySelectorAll('button[data-id],button[data-help],button[data-step]'),i,b;
 for(i=0;i<a.length;i++){b=a[i];if(b.getAttribute('data-id')===id||b.getAttribute('data-help')===id||b.getAttribute('data-step')===id)return b}
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
 var token=generation,phrase=item.speech_ar||item.label_ar||'',failedOnce=false;
 target=findTarget(item.id);add(target);
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
 var index=w.APP360_CALM_SILMA_INDEX||{},entry=index[item.id],path='';
 if(item.audio)path=item.audio;
 else if(entry&&entry.verified===true&&entry.path&&entry.engine==='silma')path=entry.path;
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
  status(report,item.audio?'تشغيل التسجيل العائلي المحلي.':'تشغيل تسجيل SILMA المحقق.');
  var p=audio.play();
  if(p&&typeof p.then==='function')p.then(null,fallback);
  return true;
 }catch(e){fallback();return false}
}
w.APP360CalmNarration={play:play,stop:stop,source:'optional-verified-SILMA'};
if(d.addEventListener)d.addEventListener('visibilitychange',function(){if(d.hidden)stop()},false);
})(window,document);
