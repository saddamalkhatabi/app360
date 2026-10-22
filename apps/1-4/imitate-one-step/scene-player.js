/* Narration owns frame advancement. Timers are only for explicit silent playback. ES5 for Android 4.4. */
(function(w,d){'use strict';
var visual=null,audio=null,token=0,timer=null,current=null,active=false,paused=true,muted=false,caption=true;
function el(id){return d.getElementById(id)}
function stop(){token++;clearTimeout(timer);timer=null;active=false;paused=true;if(visual){visual.onload=visual.onerror=null;visual=null}if(audio){audio.onended=audio.onerror=audio.onplaying=null;try{audio.pause()}catch(e){}audio=null}}
function mount(exp,complete){stop();var entries=(w.A1SceneVoiceMap||{})[exp.id]||[],frame=0,finished=false,attempt=0,hasArt=!!el('reelStrip'),run=token;
current={exp:exp,frame:0};
var art=el('reelStrip'),imageReady=!art||typeof art.complete!=='boolean',imageFailed=false;
function checkImage(){if(!art)return true;return art.naturalWidth>0&&art.naturalHeight>0&&art.naturalWidth===art.naturalHeight*5}
function imageError(){if(run!==token)return;imageFailed=true;paused=true;ui();message('تعذر تحميل مشاهد الصورة. أعد فتح التجربة أو تحقق من اتصالك.')}
if(art&&typeof art.complete==='boolean'){visual=art;imageReady=art.complete&&checkImage();art.onload=function(){if(run!==token)return;if(!checkImage()){imageError();return}imageReady=true;imageFailed=false;if(!paused)play(false)};art.onerror=imageError;if(art.complete&&!imageReady)imageFailed=true}
function ui(){var s=exp.steps[frame],n=el('sceneCaption');if(n){n.textContent=s.label+' · '+s.text;n.hidden=!caption}var strip=el('reelStrip');if(strip){var reel=el('storyReel');if(reel)reel.className='reel frame-active';strip.style.transform='translate3d('+(-20*frame)+'%,0,0)';el('reelViewport').className='reel-viewport frame-mode'}var counter=el('reelCounter');if(counter)counter.textContent=(frame+1)+' / '+exp.steps.length;var label=el('reelStageLabel');if(label)label.textContent=s.label;var dots=el('reelDots');if(dots)for(var i=0;i<dots.children.length;i++)dots.children[i].className=i===frame?'on':'';if(el('scenePrev'))el('scenePrev').disabled=frame===0;if(el('sceneNext'))el('sceneNext').disabled=frame===exp.steps.length-1;if(el('reelPlay'))el('reelPlay').textContent=paused?'▶ تشغيل المشاهد':'⏸ إيقاف';current.frame=frame}
function message(text){if(el('sceneStatus'))el('sceneStatus').textContent=text}
function endFrame(){if(run!==token||paused)return;if(frame<exp.steps.length-1){frame++;play(false)}else{paused=true;finished=true;ui();if(hasArt){var reel=el('storyReel');reel.className='reel overview-active';el('reelViewport').className='reel-viewport overview-mode';el('reelStrip').style.transform='translate3d(0,0,0)'}message('انتهى الشرح. الآن وقت التجربة معا في الواقع.');if(complete)complete()}}
function play(resume){if(run!==token)return;clearTimeout(timer);active=true;paused=false;finished=false;ui();message('');if(!imageReady){if(imageFailed){imageError()}else message('جارٍ تحميل مشاهد التجربة…');return}if(w.A1RecordedVoice)w.A1RecordedVoice.stop();
 if(muted){attempt++;if(audio){audio.onended=audio.onerror=null;audio.pause();audio=null}timer=setTimeout(endFrame,Math.max(4500,exp.steps[frame].text.length*85));return}
 if(resume&&audio){startAudio();return}
 if(audio){audio.onended=audio.onerror=null;audio.pause();audio=null}
 var clip=entries[frame];if(!clip){paused=true;ui();message('الشرح الصوتي غير متاح. اقرأ التعليمات أو انتقل يدويا.');return}
 var serial=++attempt;audio=new w.Audio(clip.path);audio.preload='auto';audio.onended=function(){if(serial===attempt)endFrame()};audio.onerror=function(){if(serial===attempt)failed()};audio.onplaying=function(){if(run===token&&serial===attempt)message('')};startAudio()
}
function startAudio(){var playingAudio=audio;try{var p=audio.play();if(p&&p.catch)p.catch(function(){if(audio===playingAudio)failed()})}catch(e){if(audio===playingAudio)failed()}}
function failed(){if(run!==token)return;attempt++;if(audio){audio.onended=audio.onerror=null;audio.pause();audio=null}paused=true;ui();message('تعذر تشغيل الصوت. اضغط تشغيل للمحاولة أو استخدم التالي.');}
function pause(){paused=true;clearTimeout(timer);if(audio)audio.pause();ui()}
function jump(n,autoplay){if(n<0||n>=exp.steps.length)return;attempt++;finished=false;if(audio){audio.onended=audio.onerror=null;audio.pause();audio=null}clearTimeout(timer);frame=n;paused=true;ui();if(autoplay)play(false)}
var controls=d.createElement('section');controls.id='sceneControls';controls.className='scene-controls';controls.innerHTML='<small>شرح المشاهد بالعربية</small><p id="sceneCaption" class="scene-caption" aria-live="polite"></p><div class="action-row"><button type="button" id="scenePrev" class="btn">→ المشهد السابق</button><button type="button" id="sceneNext" class="btn">المشهد التالي ←</button><button type="button" id="sceneMute" class="btn">'+(muted?'تشغيل الشرح الصوتي':'كتم الشرح الصوتي')+'</button><button type="button" id="sceneText" class="btn">'+(caption?'إخفاء النص':'إظهار النص')+'</button></div><p id="sceneStatus" role="status"></p>';
var reel=el('storyReel');if(reel)reel.parentNode.insertBefore(controls,reel.nextSibling);else{var idea=d.querySelector('.idea-card');if(idea)idea.parentNode.insertBefore(controls,idea)}
el('scenePrev').onclick=function(){jump(frame-1,!paused)};el('sceneNext').onclick=function(){jump(frame+1,!paused)};
el('sceneMute').onclick=function(){muted=!muted;this.textContent=muted?'تشغيل الشرح الصوتي':'كتم الشرح الصوتي';if(!paused)play(false)};
el('sceneText').onclick=function(){caption=!caption;this.textContent=caption?'إخفاء النص':'إظهار النص';ui()};
if(el('reelPlay'))el('reelPlay').onclick=function(){if(paused){if(finished)jump(0,false);play(true)}else pause()};if(el('reelReplay'))el('reelReplay').onclick=function(){jump(0,true)};
var dots=el('reelDots');if(dots)for(var i=0;i<dots.children.length;i++)(function(n){dots.children[n].onclick=function(){jump(n,true)}})(i);
current.pause=pause;current.play=function(){play(true)};current.replay=function(){jump(0,true)};ui();play(false);return current;
}
d.addEventListener('visibilitychange',function(){if(d.hidden&&current&&current.pause)current.pause()},false);w.addEventListener('pagehide',stop,false);
w.A1ScenePlayer={mount:mount,stop:stop,pause:function(){if(current&&current.pause)current.pause()},play:function(){if(current&&current.play)current.play()},state:function(){return current?{experience:current.exp.id,frame:current.frame,paused:paused,active:active}:null}};
})(window,document);
