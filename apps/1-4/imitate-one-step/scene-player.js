/* Narration owns frame advancement. Timers are only for explicit silent playback. ES5 for Android 4.4. */
(function(w,d){'use strict';
var visual=null,audio=null,speech=null,token=0,timer=null,current=null,active=false,paused=true,muted=false,caption=true;
function el(id){return d.getElementById(id)}
function stopSpeech(){if(speech){speech.onend=speech.onerror=null;speech=null;w.speechSynthesis.cancel()}}
function stop(){stopSpeech();token++;clearTimeout(timer);timer=null;active=false;paused=true;if(visual){visual.onload=visual.onerror=null;visual=null}if(audio){audio.onended=audio.onerror=audio.onplaying=null;try{audio.pause()}catch(e){}audio=null}}
function mount(exp,complete,options){stop();options=options||{};var entries=(w.A1SceneVoiceMap||{})[exp.id]||[],frame=0,finished=false,attempt=0,hasArt=!!el('reelStrip'),run=token;
var english=options.language==='en'&&w.A1English&&w.A1English.experiences[exp.id];
function t(ar,en){return english?en:ar}
function step(){return english?{text:english.steps[frame],label:w.A1English.labels[exp.level===5?1:0][frame]}:exp.steps[frame]}
current={exp:exp,frame:0};
var art=el('reelStrip'),imageReady=!art||typeof art.complete!=='boolean',imageFailed=false;
function checkImage(){if(!art)return true;return art.naturalWidth>0&&art.naturalHeight>0&&art.naturalWidth===art.naturalHeight*5}
function imageError(){if(run!==token)return;imageFailed=true;paused=true;ui();message(t('تعذر تحميل مشاهد الصورة. أعد فتح التجربة أو تحقق من اتصالك.','The scenes could not load. Reopen the activity or check your connection.'))}
if(art&&typeof art.complete==='boolean'){visual=art;imageReady=art.complete&&checkImage();art.onload=function(){if(run!==token)return;if(!checkImage()){imageError();return}imageReady=true;imageFailed=false;if(!paused)play(false)};art.onerror=imageError;if(art.complete&&!imageReady)imageFailed=true}
var modernSizing=w.CSS&&w.CSS.supports&&w.CSS.supports('width','1cqh')&&w.CSS.supports('container-type','size');
function fit(){
 if(modernSizing||run!==token||!hasArt)return;
 var reel=el('storyReel'),view=el('reelViewport'),ratio=finished?5:1;
 if(!reel.clientWidth||!reel.clientHeight)return;
 var width=Math.min(reel.clientWidth-8,(reel.clientHeight-8)*ratio,finished?1180:840);
 view.style.width=Math.max(0,width)+'px';
 view.style.height=Math.max(0,width/ratio)+'px';
}
function ui(){
 var s=step(),n=el('sceneCaption');
 if(n){n.textContent=s.label+' · '+s.text;n.hidden=!caption}
 var strip=el('reelStrip');
 if(strip){
  var reel=el('storyReel'),view=el('reelViewport');
  if(finished){
   reel.className='reel overview-active';view.className='reel-viewport overview-mode';
   strip.style.transform='translate3d(0,0,0)';
  }else{
   reel.className='reel frame-active';view.className='reel-viewport frame-mode';
   strip.style.transform='translate3d('+(-20*frame)+'%,0,0)';
  }
 }
 var counter=el('reelCounter');
 if(counter)counter.textContent=(frame+1)+' / '+exp.steps.length;
 var dots=el('reelDots');
 if(dots)for(var i=0;i<dots.children.length;i++){
  var dot=dots.children[i];
  dot.className='scene-dot'+(i===frame?' on':'');
  if(dot.setAttribute)dot.setAttribute('aria-current',i===frame?'step':'false');
 }
 if(el('scenePrev'))el('scenePrev').disabled=frame===0;
 if(el('sceneNext'))el('sceneNext').disabled=frame===exp.steps.length-1;
 if(el('reelPlay'))el('reelPlay').textContent=paused?t('▶ تشغيل','▶ Play'):t('⏸ إيقاف','⏸ Pause');
 current.frame=frame;fit();
}
function message(text){if(el('sceneStatus'))el('sceneStatus').textContent=text;fit()}
function endFrame(){if(run!==token||paused)return;if(frame<exp.steps.length-1){frame++;play(false)}else{paused=true;finished=true;ui();message(t('انتهى الشرح. الآن وقت التجربة معا في الواقع.','You are ready to try it together away from the screen.'));if(complete)complete()}}
function play(resume){if(run!==token)return;clearTimeout(timer);active=true;paused=false;finished=false;ui();message('');if(!imageReady){if(imageFailed){imageError()}else message(t('جارٍ تحميل مشاهد التجربة…','Loading the activity scenes…'));return}if(options.beforePlay)options.beforePlay();if(w.A1RecordedVoice)w.A1RecordedVoice.stop();stopSpeech();
 if(english&&!muted){speakEnglish();return}
 if(muted){attempt++;if(audio){audio.onended=audio.onerror=null;audio.pause();audio=null}timer=setTimeout(endFrame,Math.max(4500,step().text.length*85));return}
 if(resume&&audio){startAudio();return}
 if(audio){audio.onended=audio.onerror=null;audio.pause();audio=null}
 var clip=entries[frame];if(!clip){paused=true;ui();message(t('الشرح الصوتي غير متاح. اقرأ التعليمات أو انتقل يدويا.','Audio is unavailable. Read the instructions or move to the next scene.'));return}
 var serial=++attempt;audio=new w.Audio(clip.path);audio.preload='auto';audio.onended=function(){if(serial===attempt)endFrame()};audio.onerror=function(){if(serial===attempt)failed()};audio.onplaying=function(){if(run===token&&serial===attempt)message('')};startAudio()
}
function showEnglishText(){
 message('English voice is unavailable on this device. Read along with the scenes.');
 var node=el('sceneCaption');if(node)node.hidden=false;
 timer=setTimeout(endFrame,Math.max(4500,step().text.length*85));
}
function speakEnglish(){
 if(!w.speechSynthesis||!w.SpeechSynthesisUtterance){showEnglishText();return}
 var serial=++attempt,voice=new w.SpeechSynthesisUtterance(step().text);
 var voices=w.speechSynthesis.getVoices?w.speechSynthesis.getVoices():[],selected=null;
 for(var i=0;i<voices.length;i++)if(/^en(?:-|_|$)/i.test(voices[i].lang)){
  if(!selected||voices[i].localService&&!selected.localService)selected=voices[i];
 }
 if(selected)voice.voice=selected;
 voice.lang=selected?selected.lang:'en-US';voice.rate=.9;
 speech=voice;
 voice.onend=function(){if(run===token&&serial===attempt&&speech===voice){speech=null;endFrame()}};
 voice.onerror=function(e){
  if(run!==token||serial!==attempt||speech!==voice)return;
  speech=null;
  if(e.error==='not-allowed')failed();else showEnglishText();
 };
 try{w.speechSynthesis.speak(voice)}catch(e){speech=null;showEnglishText()}
}
function startAudio(){var playingAudio=audio;try{var p=audio.play();if(p&&p.catch)p.catch(function(){if(audio===playingAudio)failed()})}catch(e){if(audio===playingAudio)failed()}}
function failed(){if(run!==token)return;attempt++;if(audio){audio.onended=audio.onerror=null;audio.pause();audio=null}paused=true;ui();message(t('تعذر تشغيل الصوت. اضغط تشغيل للمحاولة أو استخدم التالي.','Tap Play to try the audio again or use Next scene.'));}
function pause(){stopSpeech();paused=true;clearTimeout(timer);if(audio)audio.pause();ui()}
function jump(n,autoplay){if(n<0||n>=exp.steps.length)return;attempt++;stopSpeech();finished=false;if(audio){audio.onended=audio.onerror=null;audio.pause();audio=null}clearTimeout(timer);frame=n;paused=true;ui();if(autoplay)play(false)}
var controls=d.createElement('section');
controls.id='sceneControls';controls.className='scene-controls';
var dotsMarkup='';
for(var i=0;i<exp.steps.length;i++){
 dotsMarkup+='<button class="scene-dot" type="button" aria-label="'+t('المشهد ','Scene ')+(i+1)+'"></button>';
}
controls.innerHTML='<div class="scene-progress"><span id="reelCounter" dir="ltr"></span><div id="reelDots" class="reel-dots" dir="ltr">'+dotsMarkup+'</div></div>'+
 '<div class="scene-copy" tabindex="0"><p id="sceneCaption" class="scene-caption" aria-live="polite"></p><p id="sceneStatus" role="status"></p></div>'+
 '<div class="scene-main-actions"><button type="button" id="scenePrev" class="btn">'+t('→ مشهد سابق','← Prev. scene')+'</button><button type="button" id="reelPlay" class="btn primary">'+t('▶ تشغيل','▶ Play')+'</button><button type="button" id="sceneNext" class="btn">'+t('مشهد تالٍ ←','Next scene →')+'</button></div>'+
 '<div class="scene-options"><button type="button" id="reelReplay" class="btn">'+t('↺ إعادة','↺ Replay')+'</button><button type="button" id="sceneMute" class="btn">'+(muted?t('تشغيل الصوت','Unmute'):t('كتم الصوت','Mute'))+'</button><button type="button" id="sceneText" class="btn">'+(caption?t('إخفاء النص','Hide text'):t('إظهار النص','Show text'))+'</button></div>';
var reel=el('storyReel');reel.parentNode.insertBefore(controls,reel.nextSibling);
el('scenePrev').onclick=function(){jump(frame-1,!paused)};el('sceneNext').onclick=function(){jump(frame+1,!paused)};
el('sceneMute').onclick=function(){muted=!muted;this.textContent=muted?t('تشغيل الصوت','Unmute'):t('كتم الصوت','Mute');if(!paused)play(false)};
el('sceneText').onclick=function(){caption=!caption;this.textContent=caption?t('إخفاء النص','Hide text'):t('إظهار النص','Show text');ui()};
if(el('reelPlay'))el('reelPlay').onclick=function(){if(paused){if(finished)jump(0,false);play(true)}else pause()};if(el('reelReplay'))el('reelReplay').onclick=function(){jump(0,true)};
var dots=el('reelDots');if(dots)for(var i=0;i<dots.children.length;i++)(function(n){dots.children[n].onclick=function(){jump(n,true)}})(i);
current.fit=fit;current.pause=pause;current.play=function(){play(true)};current.replay=function(){jump(0,true)};ui();if(options.autoplay!==false)play(false);return current;
}
d.addEventListener('visibilitychange',function(){if(d.hidden&&current&&current.pause)current.pause()},false);w.addEventListener('pagehide',stop,false);
w.addEventListener('resize',function(){if(current&&current.fit)current.fit()},false);
w.A1ScenePlayer={mount:mount,stop:stop,pause:function(){if(current&&current.pause)current.pause()},play:function(){if(current&&current.play)current.play()},state:function(){return current?{experience:current.exp.id,frame:current.frame,paused:paused,active:active}:null}};
})(window,document);
