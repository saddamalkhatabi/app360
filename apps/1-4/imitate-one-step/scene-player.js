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
function ui(){var s=step(),n=el('sceneCaption');if(n){n.textContent=s.label+' · '+s.text;n.hidden=!caption}var strip=el('reelStrip');if(strip){var reel=el('storyReel');if(reel)reel.className='reel frame-active';strip.style.transform='translate3d('+(-20*frame)+'%,0,0)';el('reelViewport').className='reel-viewport frame-mode'}var counter=el('reelCounter');if(counter)counter.textContent=(frame+1)+' / '+exp.steps.length;var label=el('reelStageLabel');if(label)label.textContent=s.label;var dots=el('reelDots');if(dots)for(var i=0;i<dots.children.length;i++)dots.children[i].className=i===frame?'on':'';if(el('scenePrev'))el('scenePrev').disabled=frame===0;if(el('sceneNext'))el('sceneNext').disabled=frame===exp.steps.length-1;if(el('reelPlay'))el('reelPlay').textContent=paused?t('▶ تشغيل المشاهد','▶ Play scenes'):t('⏸ إيقاف','⏸ Pause');current.frame=frame}
function message(text){if(el('sceneStatus'))el('sceneStatus').textContent=text}
function endFrame(){if(run!==token||paused)return;if(frame<exp.steps.length-1){frame++;play(false)}else{paused=true;finished=true;ui();if(hasArt){var reel=el('storyReel');reel.className='reel overview-active';el('reelViewport').className='reel-viewport overview-mode';el('reelStrip').style.transform='translate3d(0,0,0)'}message(t('انتهى الشرح. الآن وقت التجربة معا في الواقع.','You are ready to try it together away from the screen.'));if(complete)complete()}}
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
var controls=d.createElement('section');controls.id='sceneControls';controls.className='scene-controls';controls.innerHTML='<small>'+t('شرح المشاهد بالعربية','Scene instructions in English')+'</small><p id="sceneCaption" class="scene-caption" aria-live="polite"></p><div class="action-row"><button type="button" id="scenePrev" class="btn">'+t('→ المشهد السابق','← Previous scene')+'</button><button type="button" id="sceneNext" class="btn">'+t('المشهد التالي ←','Next scene →')+'</button><button type="button" id="sceneMute" class="btn">'+(muted?t('تشغيل الشرح الصوتي','Unmute narration'):t('كتم الشرح الصوتي','Mute narration'))+'</button><button type="button" id="sceneText" class="btn">'+(caption?t('إخفاء النص','Hide text'):t('إظهار النص','Show text'))+'</button></div><p id="sceneStatus" role="status"></p>';
var reel=el('storyReel');if(reel)reel.parentNode.insertBefore(controls,reel.nextSibling);else{var idea=d.querySelector('.idea-card');if(idea)idea.parentNode.insertBefore(controls,idea)}
el('scenePrev').onclick=function(){jump(frame-1,!paused)};el('sceneNext').onclick=function(){jump(frame+1,!paused)};
el('sceneMute').onclick=function(){muted=!muted;this.textContent=muted?t('تشغيل الشرح الصوتي','Unmute narration'):t('كتم الشرح الصوتي','Mute narration');if(!paused)play(false)};
el('sceneText').onclick=function(){caption=!caption;this.textContent=caption?t('إخفاء النص','Hide text'):t('إظهار النص','Show text');ui()};
if(el('reelPlay'))el('reelPlay').onclick=function(){if(paused){if(finished)jump(0,false);play(true)}else pause()};if(el('reelReplay'))el('reelReplay').onclick=function(){jump(0,true)};
var dots=el('reelDots');if(dots)for(var i=0;i<dots.children.length;i++)(function(n){dots.children[n].onclick=function(){jump(n,true)}})(i);
current.pause=pause;current.play=function(){play(true)};current.replay=function(){jump(0,true)};ui();if(options.autoplay!==false)play(false);return current;
}
d.addEventListener('visibilitychange',function(){if(d.hidden&&current&&current.pause)current.pause()},false);w.addEventListener('pagehide',stop,false);
w.A1ScenePlayer={mount:mount,stop:stop,pause:function(){if(current&&current.pause)current.pause()},play:function(){if(current&&current.play)current.play()},state:function(){return current?{experience:current.exp.id,frame:current.frame,paused:paused,active:active}:null}};
})(window,document);
