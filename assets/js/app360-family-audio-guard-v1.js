(function(w,d){
'use strict';
if(w.APP360_FAMILY_AUDIO_GUARD&&w.APP360_FAMILY_AUDIO_GUARD.__ready)return;
var VERSION='1.0.0',shell=null,originalSet=null,active=false,timer=0,patches=[],mediaSeen=[];
function dispatch(win,on){var doc;try{doc=win&&win.document;if(!doc)return;var ev=doc.createEvent('CustomEvent');ev.initCustomEvent('app360:voice-active',true,false,{active:!!on});doc.dispatchEvent(ev)}catch(e){try{doc=win&&win.document;var e2=doc.createEvent('Event');e2.initEvent('app360:voice-active',true,false);e2.active=!!on;doc.dispatchEvent(e2)}catch(x){}}}
function seen(el){var i;for(i=0;i<mediaSeen.length;i++)if(mediaSeen[i].el===el)return true;return false}
function remember(el){if(!el||seen(el))return;mediaSeen.push({el:el,muted:!!el.muted,volume:typeof el.volume==='number'?el.volume:1})}
function restoreMedia(){var i,x;for(i=0;i<mediaSeen.length;i++){x=mediaSeen[i];try{x.el.muted=x.muted;x.el.volume=x.volume}catch(e){}}mediaSeen=[]}
function findPatch(win){var i;for(i=0;i<patches.length;i++)if(patches[i].win===win)return patches[i];return null}
function patchWindow(win){if(!win||findPatch(win))return;var p={win:win,mediaProto:null,play:null,synth:null,speak:null};try{p.mediaProto=win.HTMLMediaElement&&win.HTMLMediaElement.prototype;p.play=p.mediaProto&&p.mediaProto.play;if(p.mediaProto&&p.play){p.mediaProto.play=function(){if(active){remember(this);try{this.muted=true;this.volume=0}catch(e){}}return p.play.apply(this,arguments)}}}catch(e1){}try{p.synth=win.speechSynthesis||null;p.speak=p.synth&&p.synth.speak;if(p.synth&&p.speak){p.synth.speak=function(u){if(active&&u){try{u.volume=0}catch(e){}}return p.speak.call(p.synth,u)};if(active&&p.synth.cancel)p.synth.cancel()}}catch(e2){}patches.push(p);dispatch(win,active)}
function restorePatches(){var i,p;for(i=0;i<patches.length;i++){p=patches[i];try{if(p.mediaProto&&p.play)p.mediaProto.play=p.play}catch(e){}try{if(p.synth&&p.speak)p.synth.speak=p.speak}catch(e2){}dispatch(p.win,false)}patches=[];restoreMedia()}
function currentFrameWindow(){var f;try{f=shell&&shell.getFrame?shell.getFrame():null;return f&&f.contentWindow?f.contentWindow:null}catch(e){return null}}
function tick(){if(!active)return;var fw=currentFrameWindow();if(fw)patchWindow(fw)}
function setActive(on){active=!!on;if(timer){clearInterval(timer);timer=0}if(active){tick();timer=setInterval(tick,850)}else restorePatches()}
function install(){shell=w.APP360_FAMILY_SHELL;if(!shell||!shell.__ready||shell._audioGuardWrapped){setTimeout(install,150);return}shell._audioGuardWrapped=true;originalSet=shell.setVoiceActive;shell.setVoiceActive=function(on){if(originalSet)originalSet.call(shell,on);setActive(!!on)};w.APP360_FAMILY_AUDIO_GUARD={__ready:true,version:VERSION,setActive:setActive}}
if(d.readyState==='loading'){if(d.addEventListener)d.addEventListener('DOMContentLoaded',install,false);else if(w.attachEvent)w.attachEvent('onload',install)}else install();
})(window,document);
