'use strict';
(function(){
var d=document,w=window,SAY_ROOT='../say-and-name/',KEY='app360:a1-picture-puzzles:',currentAudio=null,seq=0,unlocked=false,pendingStart=false,completed=false;
var ss=w.speechSynthesis||null,nativeSpeak=ss&&ss.speak?ss.speak.bind(ss):null,nativeCancel=ss&&ss.cancel?ss.cancel.bind(ss):null;
var prefs={lang:'ar',announceStart:true};
function $(id){return d.getElementById(id)}
function G(k,v){try{var x=w.localStorage?localStorage.getItem(k):null;return x===null?String(v):x}catch(e){return String(v)}}
function S(k,v){try{if(w.localStorage)localStorage.setItem(k,String(v))}catch(e){}}
function soundOn(){var b=$('soundBtn');return !b||String(b.innerHTML).indexOf('🔇')<0}
function title(){return $('imageTitle')?String($('imageTitle').textContent||'').replace(/^\s+|\s+$/g,''):''}
function category(){var s=$('imageMeta')?String($('imageMeta').textContent||''):'';return String(s.split('·')[0]||'').replace(/^\s+|\s+$/g,'')}
function englishWord(){var word=title(),cat=category(),map=w.APP360_EN&&w.APP360_EN.words,k;if(!map)return word;if(map[cat+'\u0001'+word])return map[cat+'\u0001'+word];for(k in map)if(map.hasOwnProperty(k)&&k.slice(k.lastIndexOf('\u0001')+1)===word)return map[k];return word}
function stopCurrent(){try{if(currentAudio){currentAudio.pause();currentAudio.currentTime=0}}catch(e){}currentAudio=null}
function playUrl(src,done,audioObj){if(!src){done(false);return}try{stopCurrent();var a=audioObj||new Audio(src);currentAudio=a;var finished=false,timer=setTimeout(function(){if(!finished){finished=true;done(false)}},5000);a.onended=function(){if(!finished){finished=true;clearTimeout(timer);currentAudio=null;done(true)}};a.onerror=function(){if(!finished){finished=true;clearTimeout(timer);currentAudio=null;done(false)}};try{a.currentTime=0}catch(e0){}var p=a.play();if(p&&p.catch)p.catch(function(){if(!finished){finished=true;clearTimeout(timer);currentAudio=null;done(false)}})}catch(e){done(false)}}
function tts(text,lang,done){if(!ss||!w.SpeechSynthesisUtterance){done(false);return}try{if(nativeCancel)nativeCancel();var u=new SpeechSynthesisUtterance(text);u.lang=lang;u.rate=lang.indexOf('ar')===0?.82:.88;u.pitch=1.03;var fin=false,t=setTimeout(function(){if(!fin){fin=true;done(false)}},4500);u.onend=function(){if(!fin){fin=true;clearTimeout(t);done(true)}};u.onerror=function(){if(!fin){fin=true;clearTimeout(t);done(false)}};(nativeSpeak||ss.speak.bind(ss))(u)}catch(e){done(false)}}
function arWord(done){var word=title(),m=w.APP360_AUDIO_MAP||{},src=m[word];if(src){playUrl(SAY_ROOT+src,function(ok){if(ok)done(true);else tts(word,'ar-SA',done)});return}tts(word,'ar-SA',done)}
function enWord(done){var word=englishWord(),m=w.APP360_AUDIO_MAP_EN||{},src=m[word];if(src){playUrl(SAY_ROOT+src,function(ok){if(ok)done(true);else tts(word,'en-US',done)});return}tts(word,'en-US',done)}
function playImageName(done){var my=++seq;if(!soundOn()){done&&done();return}function finish(){if(my===seq&&done)done()}if(prefs.lang==='ar'){arWord(function(){finish()});return}if(prefs.lang==='en'){enWord(function(){finish()});return}arWord(function(){if(my!==seq)return;setTimeout(function(){if(my!==seq)return;enWord(function(){finish()})},45)})}
function parseStatus(){var s=$('pieceStatus')?String($('pieceStatus').textContent||''):'',m=s.match(/(\d+)\s*\/\s*(\d+)/);if(!m)return;var a=parseInt(m[1],10)||0,b=parseInt(m[2],10)||0;if(b&&a>=b){if(!completed){completed=true;announceFinish()}}else completed=false}
function observeGame(){var titleEl=$('imageTitle'),statusEl=$('pieceStatus'),last=title();if(w.MutationObserver&&titleEl){new MutationObserver(function(){var t=title();if(t&&t!==last&&t!=='ألغاز الصور'){last=t;completed=false;seq++;announceStart()}}).observe(titleEl,{childList:true,characterData:true,subtree:true})}if(w.MutationObserver&&statusEl)new MutationObserver(parseStatus).observe(statusEl,{childList:true,characterData:true,subtree:true});setTimeout(function(){if(title()&&title()!=='ألغاز الصور')announceStart();parseStatus()},420)}
function announceStart(){if(!prefs.announceStart||!soundOn())return;if(!unlocked){pendingStart=true;return}pendingStart=false;var own=seq;setTimeout(function(){if(own===seq&&soundOn())playImageName()},180)}
function announceFinish(){seq++;stopCurrent();if(nativeCancel)nativeCancel();if(!soundOn())return;if(!(w.PicturePuzzleLearning&&w.PicturePuzzleLearning.enabled())&&w.App360Celebration)w.App360Celebration.play({language:prefs.lang==='en'?'en':'ar'})}
function unlock(){unlocked=true;if(w.App360Celebration)w.App360Celebration.unlock();if(pendingStart)announceStart()}
function closeSettings(){var p=$('audioSettingsPanel');p.setAttribute('aria-hidden','true');p.style.display='none'}
function openSettings(){$('voiceLangSelect').value=prefs.lang;$('announceStartToggle').checked=prefs.announceStart;var p=$('audioSettingsPanel');p.setAttribute('aria-hidden','false');p.style.display='flex'}
function saveSettings(){prefs.lang=$('voiceLangSelect').value;prefs.announceStart=!!$('announceStartToggle').checked;S(KEY+'voice-lang',prefs.lang);S(KEY+'announce-start',prefs.announceStart?'1':'0');closeSettings()}
function testAudio(){unlock();prefs.lang=$('voiceLangSelect').value;playImageName(function(){if(w.App360Celebration)w.App360Celebration.play({language:prefs.lang==='en'?'en':'ar'})})}
prefs.lang=G(KEY+'voice-lang','ar');if(prefs.lang!=='en'&&prefs.lang!=='both')prefs.lang='ar';prefs.announceStart=G(KEY+'announce-start','1')!=='0';
w.PicturePuzzleAudio={complete:function(){if(!completed){completed=true;announceFinish()}},language:function(){return prefs.lang},stop:function(){seq++;stopCurrent();if(nativeCancel)nativeCancel()}};
$('settingsBtn').onclick=openSettings;$('closeAudioSettings').onclick=closeSettings;$('saveAudioSettings').onclick=saveSettings;$('testPictureAudio').onclick=testAudio;$('audioSettingsPanel').onclick=function(e){if(e.target===this)closeSettings()};
d.addEventListener('touchstart',unlock,true);d.addEventListener('mousedown',unlock,true);observeGame();
})();
