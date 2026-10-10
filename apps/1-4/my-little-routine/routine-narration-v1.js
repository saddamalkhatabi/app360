(function (w,d) {
'use strict';
// All child-facing narration comes from verified prerecorded files.
// No on-device TTS or invented scene timing; supports older Android browsers (ES5).
var reel=w.APP360_RoutineReel,media=null,clock=null,mode='',frame=0,token=0,sceneButton=null,statusNode=null;
function E(id){return d.getElementById(id)}
function current(){return reel&&reel.currentHabit?reel.currentHabit():null}
function catalog(){return w.APP360_ROUTINE_NARRATIONS&&w.APP360_ROUTINE_NARRATIONS.habits||{}}
function entry(a){var x=a&&catalog()[a.id];return x&&x.verified===true&&x.segments&&x.segments.length===7?x:null}
function muted(){return E('sound')&&E('sound').innerHTML.indexOf('🔇')>=0}
function feedback(t){var x=E('toast');if(!x)return;x.textContent=t;x.style.display='block';w.setTimeout(function(){x.style.display='none'},1900)}
function text(el,t){if(el)el.textContent=t}
function setButtons(){
 var listen=E('listenFullRoutine'),play=E('playStory'),a=current(),v=entry(a);
 if(listen){listen.disabled=!v;listen.title=v?'شرح صوتي مسجل مع الصور':'لم تُنشر التسجيلات لهذا الروتين بعد';text(listen,mode==='full'?'⏸ إيقاف الشرح':'🔊 استمع للروتين كاملاً')}
 if(play)text(play,mode==='silent'?'⏸ إيقاف':'▶ تشغيل من البداية');
 if(sceneButton){sceneButton.disabled=!v;sceneButton.title=v?'تشغيل صوت هذه اللقطة':'التسجيل غير متاح';}
 if(statusNode)text(statusNode,v?'صوت مسجّل جاهز · تتزامن الصور مع الشرح':'التسجيل الصوتي لم يُنشر بعد · يمكن مشاهدة الصور');
}
function clearAudio(){if(!media)return;var a=media;media=null;a.onended=null;a.onerror=null;a.ontimeupdate=null;a.onloadedmetadata=null;try{a.pause()}catch(e){}}
function stop(keepFrame){
 token++;if(clock){clearTimeout(clock);clock=null}clearAudio();mode='';
 try{w.speechSynthesis.cancel()}catch(e){}
 if(reel&&reel.stop)reel.stop();
 if(!keepFrame&&reel&&reel.showOverview)reel.showOverview();
 setButtons();
}
function showScene(n){
 frame=Math.max(0,Math.min(4,n));
 if(reel&&reel.showFrame)reel.showFrame(frame);
}
function ending(){
 stop(false);
 feedback('⭐ أحسنت! شاهدت الروتين كاملاً، والآن نجربه معًا.');
}
function syncPosition(a,ms){
 var list=a.segments,last=null,i;
 for(i=0;i<list.length;i++){if(ms>=list[i].start_ms)last=list[i];else break}
 if(!last)return;
 if(last.kind==='step'&&typeof last.step==='number'&&last.step!==frame)showScene(last.step);
 else if(last.kind==='outro'&&reel&&reel.showOverview)reel.showOverview();
}
function useAudio(a,kind,segment){
 if(muted()){feedback('الصوت مغلق. اضغط زر الصوت أولاً.');return}
 var e=entry(a);if(!e){feedback('التسجيل الصوتي لم يُنشر بعد.');return}
 stop(true);
 var myToken=token;mode=kind;frame=-1;setButtons();
 var audio;
 try{audio=new w.Audio(e.path+'?routine-audio=1')}catch(err){stop(true);feedback('هذا المتصفح لا يدعم تشغيل التسجيل');return}
 media=audio;audio.preload='auto';
 audio.onerror=function(){if(myToken!==token)return;stop(true);feedback('تعذر فتح الملف الصوتي المسجل');};
 audio.onended=function(){if(myToken!==token)return;if(kind==='full')ending();else stop(true)};
 audio.ontimeupdate=function(){
  if(myToken!==token)return;
  var ms=audio.currentTime*1000;
  if(kind==='full')syncPosition(e,ms);
  if(kind==='segment'&&segment&&ms>=segment.end_ms-50){stop(true)}
 };
 function go(){
  if(myToken!==token)return;
  try{
   if(segment){audio.currentTime=Math.max(0,segment.start_ms/1000);if(typeof segment.step==='number')showScene(segment.step)}
   else if(reel&&reel.showOverview)reel.showOverview();
   var p=audio.play();
   if(p&&typeof p.then==='function')p.then(null,function(){if(myToken===token){stop(true);feedback('اضغط زر التشغيل لتفعيل الصوت على جهازك')}})
  }catch(err){stop(true);feedback('تعذر تشغيل الملف الصوتي')}
  setButtons();
 }
 // Start directly in the child's tap gesture for older mobile audio policies.
 try{
  var initial=audio.play();
  if(initial&&typeof initial.then==='function')initial.then(null,function(){if(myToken===token){stop(true);feedback('اضغط زر التشغيل لتفعيل الصوت على جهازك')}});
 }catch(ex){stop(true);feedback('تعذر بدء التسجيل على هذا الجهاز');return}
 if(audio.readyState>=1)go();else audio.onloadedmetadata=go;
}
function listenFull(){if(mode==='full'){stop(true);return}var a=current();if(a)useAudio(a,'full',null)}
function visualPlay(){
 if(mode==='silent'){stop(true);return}
 stop(true);var myToken=token;mode='silent';frame=0;showScene(0);setButtons();
 function next(){if(myToken!==token||mode!=='silent')return;if(frame>=4){ending();return}showScene(frame+1);clock=setTimeout(next,3200)}
 clock=setTimeout(next,3200);
}
function replayStep(){
 var a=current(),e=entry(a),i=frame<0?0:frame,j;
 if(!e){feedback('هذا المشهد ليس له تسجيل منشور بعد');return}
 for(j=0;j<e.segments.length;j++)if(e.segments[j].kind==='step'&&e.segments[j].step===i){useAudio(a,'segment',e.segments[j]);return}
}
function playIntro(){
 var a=current(),e=entry(a);
 if(!e){feedback('التسجيل الصوتي لم يُنشر بعد');return}
 useAudio(a,'segment',e.segments[0]);
}
function playChildStep(){
 var x=null,a,i,seg=null,e,k,j;
 try{x=JSON.parse(w.localStorage.getItem('app360-a1-routine-v2')||'null')}catch(err){}
 if(!x||!x.routine||!x.run){feedback('اختر روتينًا لتسمع الخطوة');return}
 a=(w.ROUTINE_DATA&&w.ROUTINE_DATA.habits||[]).filter(function(h){return h.id===x.routine.sourceHabit})[0];
 e=entry(a);if(!e){feedback('لا يوجد ملف صوتي مسجّل لهذا الروتين');return}
 i=Math.min(x.run.current,x.routine.steps.length-1);
 for(k=0;k<a.steps.length;k++)if(a.steps[k]===x.routine.steps[i].label){seg=k;break}
 if(seg===null){feedback('هذه الخطوة المخصصة ليس لها تسجيل بعد');return}
 for(j=0;j<e.segments.length;j++)if(e.segments[j].kind==='step'&&e.segments[j].step===seg){useAudio(a,'segment',e.segments[j]);return}
}
function addButton(){
 var wrap=E('playStory')&&E('playStory').parentNode;
 if(!wrap||E('listenFullRoutine'))return;
 var b=d.createElement('button');b.id='listenFullRoutine';b.type='button';b.className='routineNarrationBtn';
 b.textContent='🔊 استمع للروتين كاملاً';b.onclick=listenFull;
 wrap.appendChild(b);
 var help=d.createElement('div');help.className='routineNarrationStatus';help.id='routineNarrationStatus';
 wrap.parentNode.insertBefore(help,wrap.nextSibling);statusNode=help;
 var bar=d.querySelector('.habitActionBar');
 if(bar){sceneButton=d.createElement('button');sceneButton.id='listenRoutineScene';sceneButton.className='routineSceneBtn';sceneButton.type='button';sceneButton.textContent='🔉 اسمع هذا المشهد';sceneButton.onclick=replayStep;bar.appendChild(sceneButton)}
}
function bind(){
 if(!reel)return;
 addButton();
 if(E('playStory'))E('playStory').onclick=visualPlay;
 if(E('reelReplay'))E('reelReplay').onclick=function(){stop(true);visualPlay()};
 if(E('speakStory'))E('speakStory').onclick=playIntro;
 if(E('speakStep'))E('speakStep').onclick=playChildStep;
 var clicks=['prevHabit','nextHabit','habitCards','categoryRail','tabs','useHabit','sound'],i;
 for(i=0;i<clicks.length;i++){var node=E(clicks[i]);if(node)node.addEventListener('click',function(){stop(true);w.setTimeout(function(){frame=0;setButtons()},90)},false)}
 var dots=E('storyDots');if(dots)dots.addEventListener('click',function(ev){
  var target=ev.target||ev.srcElement,els=dots.getElementsByTagName('i'),i;
  for(i=0;i<els.length;i++)if(els[i]===target){stop(true);showScene(i);setButtons();break}
 },false);
 var strip=E('sceneStrip');if(strip)strip.addEventListener('click',function(ev){
  var x=ev.target||ev.srcElement;
  while(x&&x!==strip){if(x.getAttribute&&x.getAttribute('data-scene')!==null){var n=parseInt(x.getAttribute('data-scene'),10);if(!isNaN(n)){stop(true);showScene(n)}return}x=x.parentNode}
 },false);
 if(d.addEventListener)d.addEventListener('visibilitychange',function(){if(d.hidden)stop(true)},false);
 w.addEventListener('pagehide',function(){stop(true)},false);
 setButtons();
}
w.APP360_RoutineVoice={disableBrowserSpeech:true,noBrowserSpeech:true,stop:function(){stop(true)},listen:listenFull};
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',bind,false);else bind();
})(window,document);
