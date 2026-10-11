/* Recovery snippet for app-v16.js, not loaded by checkpoint branch.
Integration: mount(true,x.id) before setupReel(); clearReel() on library navigation.
markDone and openSheet invoke voice.onManual before other actions.
index.html changes: app-v16.js?v=8; voice-map.js?v=2; recorded-voice.js?v=2.
*/
function setupReel(){
clearReel();var strip=el('reelStrip'),viewport=el('reelViewport'),reel=el('storyReel');if(!strip||!viewport||!reel)return;
var frame=0,playing=false,overview=false,total=5,play=el('reelPlay'),dots=el('reelDots'),counter=el('reelCounter'),label=el('reelStageLabel'),voice=window.A1RecordedVoice,id=state.experience.id;
function setDots(current,all){Array.prototype.forEach.call(dots.children,function(d,i){d.classList.toggle('on',all||i===current)})}
function showFrame(n){overview=false;reel.className='reel frame-active';frame=Math.max(0,Math.min(total-1,n));viewport.className='reel-viewport frame-mode';strip.style.transform='translate3d('+(-20*frame)+'%,0,0)';setDots(frame,false);counter.textContent=(frame+1)+' / '+total;label.textContent='اللقطة '+(frame+1)+' من '+total}
function showOverview(){overview=true;playing=false;clearTimeout(reelTimer);reelTimer=null;if(voice)voice.stop();reel.className='reel overview-active';viewport.className='reel-viewport overview-mode';strip.style.transform='translate3d(0,0,0)';setDots(frame,true);counter.textContent='الصورة كاملة';label.textContent='كل لقطات التجربة';play.textContent='▶ تشغيل من البداية'}
function stop(){playing=false;clearTimeout(reelTimer);reelTimer=null;if(voice)voice.stop();play.textContent=overview?'▶ تشغيل من البداية':'▶ متابعة'}
function schedule(){clearTimeout(reelTimer);if(!playing)return;reelTimer=setTimeout(function(){if(frame<total-1){showFrame(frame+1);narrate(false,true);return}showOverview()},2200)}
function narrate(first,advance){if(voice)voice.playFrame(id,frame,function(){if(advance&&playing&&!overview)schedule()},first);else if(advance)schedule()}
function start(reset){clearTimeout(reelTimer);if(reset||overview)showFrame(0);playing=true;play.textContent='⏸ إيقاف';narrate(reset||frame===0,true)}
play.onclick=function(){if(playing)stop();else start(overview)};el('reelReplay').onclick=function(){start(true)};
Array.prototype.forEach.call(dots.children,function(d,i){d.onclick=function(){stop();showFrame(i);narrate(false,false)}});
if(voice){voice.onManual=stop;voice.onChange=function(){if(playing)start(false);else if(!overview)narrate(false,false)}}
showFrame(0);start(true)
}
function clearReel(){if(reelTimer){clearTimeout(reelTimer);reelTimer=null}if(window.A1RecordedVoice){window.A1RecordedVoice.stop();window.A1RecordedVoice.onChange=null;window.A1RecordedVoice.onManual=null}}
