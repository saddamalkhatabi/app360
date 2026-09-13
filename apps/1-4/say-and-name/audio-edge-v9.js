(function(){
'use strict';
var map=window.APP360_AUDIO_MAP||{};
var nativeSS=window.speechSynthesis||null;
var nativeSpeak=nativeSS&&typeof nativeSS.speak==='function'?nativeSS.speak.bind(nativeSS):null;
var nativeCancel=nativeSS&&typeof nativeSS.cancel==='function'?nativeSS.cancel.bind(nativeSS):null;
var nativeGetVoices=nativeSS&&typeof nativeSS.getVoices==='function'?nativeSS.getVoices.bind(nativeSS):null;
var player=null;

function stopPlayer(){
  try{if(player){player.pause();player.currentTime=0}}catch(e){}
}
function srcFor(text){
  if(!text)return '';
  return map[String(text)]||'';
}
function playRecorded(text,onFail){
  var src=srcFor(text);
  if(!src)return false;
  try{
    stopPlayer();
    if(!player)player=new Audio();
    player.preload='auto';
    player.src=src;
    var p=player.play();
    if(p&&typeof p.catch==='function')p.catch(function(){if(onFail)onFail()});
    return true;
  }catch(e){if(onFail)onFail();return false}
}

if(typeof window.SpeechSynthesisUtterance==='undefined'){
  window.SpeechSynthesisUtterance=function(text){this.text=String(text||'');this.lang='ar-SA';this.rate=1;this.pitch=1;};
}

var shim=nativeSS||{};
shim.cancel=function(){stopPlayer();if(nativeCancel){try{nativeCancel()}catch(e){}}};
shim.getVoices=function(){return nativeGetVoices?nativeGetVoices():[]};
shim.speak=function(utterance){
  var text=utterance&&utterance.text!=null?String(utterance.text):'';
  if(playRecorded(text,function(){if(nativeSpeak){try{nativeSpeak(utterance)}catch(e){}}}))return;
  if(nativeSpeak){try{return nativeSpeak(utterance)}catch(e){}}
};

try{window.speechSynthesis=shim}catch(e){try{Object.defineProperty(window,'speechSynthesis',{value:shim,configurable:true})}catch(ignore){}}
window.APP360_AUDIO_ENGINE={
  hasRecorded:function(text){return !!srcFor(text)},
  playRecorded:function(text){return playRecorded(text)},
  stop:stopPlayer
};
})();
