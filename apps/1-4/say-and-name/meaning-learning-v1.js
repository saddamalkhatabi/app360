(function(){'use strict';
var content=window.APP360_MEANING_CONTENT||{items:[],categories:[]},recordings=window.APP360_MEANING_AUDIO||{clips:{}},active=false,audio=null,token=0,timer=null,frame=null,panel;
function $(id){return document.getElementById(id)}
function esc(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function prefs(){return window.App360WordPlayer?window.App360WordPlayer.preferences():{display:'ar',voice:'ar',repeat:true,speech:true}}
function current(){var word=window.App360WordPlayer&&window.App360WordPlayer.current();return word?content.items.filter(function(it){return it.key===word.category_ar+'\u0001'+word.ar})[0]:null}
function clearHighlight(){if(!panel)return;Array.prototype.forEach.call(panel.querySelectorAll('.meaning-word'),function(el){el.classList.remove('is-speaking')});Array.prototype.forEach.call(panel.querySelectorAll('.meaning-audio-only'),function(el){el.hidden=true})}
function stop(){token++;clearTimeout(timer);timer=null;if(frame)cancelAnimationFrame(frame);frame=null;if(audio){audio.onended=null;audio.onerror=null;audio.pause();audio=null}clearHighlight();var reader=$('meaningReader');if(reader)reader.hidden=true;if($('meaningStatus'))$('meaningStatus').textContent=''}
function cueIndex(cues,time){for(var i=0;i<cues.length;i++)if(time>=cues[i][1]&&time<cues[i][2])return cues[i][0];return -1}
function play(number,done){
 if(window.App360WordPlayer)window.App360WordPlayer.stop();stop();var it=current(),p=prefs();if(!it||!p.speech)return;var seq=token,langs=p.voice==='both'?['ar','en']:[p.voice],queue=[];
 langs.forEach(function(lang){if(it.sentences[number][lang])queue.push(lang)});
 var missing=queue.some(function(lang){return !recordings.clips[it.sentences[number][lang].clip]});
 if(missing){$('meaningStatus').textContent='التسجيل قيد التجهيز · Recording pending';return}
 function one(pos,repeatRound){
  if(seq!==token)return;
  if(pos>=queue.length){clearHighlight();var reader=$('meaningReader');if(reader)reader.hidden=true;$('meaningStatus').textContent='';if(done)done();return}
  var lang=queue[pos],row=it.sentences[number][lang],clip=recordings.clips[row.clip];audio=new Audio(clip.path);audio.playbackRate=repeatRound?1.05:1;audio.preservesPitch=!repeatRound;audio.mozPreservesPitch=!repeatRound;audio.webkitPreservesPitch=!repeatRound;
  $('meaningStatus').textContent=p.display==='en'?'Listen':'استمع';var reader=$('meaningReader'),lastWord=-2;if(reader){reader.innerHTML='<p dir="'+(lang==='ar'?'rtl':'ltr')+'" lang="'+lang+'">'+row.words.map(function(word,i){return '<span id="meaning-reader-'+i+'" class="meaning-reader-word">'+esc(word)+'</span>'}).join(' ')+'</p>';reader.hidden=false;}
  function tick(){if(seq!==token||!audio)return;clearHighlight();var word=cueIndex(clip.cues,audio.currentTime*1000),el=word>=0?$('meaning-'+number+'-'+lang+'-'+word):null;if(el)el.classList.add('is-speaking');var line=$('meaning-line-'+number+'-'+lang);if(line&&word>=0)line.hidden=false;if(reader){Array.prototype.forEach.call(reader.querySelectorAll('.meaning-reader-word'),function(el){el.classList.remove('is-speaking')});var mirror=word>=0?$('meaning-reader-'+word):null;if(mirror)mirror.classList.add('is-speaking')}if(word>=0&&word!==lastWord){lastWord=word;if(el&&el.getBoundingClientRect){var rect=el.getBoundingClientRect(),height=window.innerHeight||document.documentElement.clientHeight;if(rect.top<10||rect.bottom>height-120)try{el.scrollIntoView({block:'center',inline:'nearest',behavior:'smooth'})}catch(e){el.scrollIntoView(false)}}}frame=requestAnimationFrame(tick)}
  audio.onended=function(){if(seq!==token)return;if(frame)cancelAnimationFrame(frame);clearHighlight();one(pos+1,repeatRound)};
  audio.onerror=function(){if(seq!==token)return;stop();$('meaningStatus').textContent='تعذر تحميل التسجيل. حاول مرة أخرى · Please try again'};
  tick();var promise=audio.play();if(promise&&promise.catch)promise.catch(function(){if(seq===token){stop();$('meaningStatus').textContent='اضغط على الجملة لتشغيل الصوت · Tap the sentence to play'}});
 }
 one(0,false);
}
function render(){
 if(!panel)return;stop();var button=$('stageSpeakBtn');if(button)button.querySelector('span').textContent=prefs().display==='en'?'Read word and sentences':'انطق الكلمة والجمل';var badge=$('learningTrackBadge');if(badge)badge.textContent=prefs().display==='en'?'4–8 · Words and useful sentences':'4–8 · الكلمات والجمل المفيدة';var it=current(),p=prefs();if(!it){$('meaningSentences').innerHTML='';return;}
 var visible=p.display==='both'?['ar','en']:[p.display],langs=visible.slice(),voiceLangs=p.voice==='both'?['ar','en']:[p.voice],html='';voiceLangs.forEach(function(lang){if(langs.indexOf(lang)<0)langs.push(lang)});
 it.sentences.forEach(function(row,n){html+='<article class="meaning-sentence"><button type="button" data-sentence="'+n+'" class="meaning-play" aria-label="استمع إلى الجملة '+(n+1)+'">🔊 '+(n+1)+'</button><div>';
  langs.forEach(function(lang){html+='<p id="meaning-line-'+n+'-'+lang+'"'+(visible.indexOf(lang)<0?' class="meaning-audio-only" hidden':'')+' dir="'+(lang==='ar'?'rtl':'ltr')+'" lang="'+lang+'">';row[lang].words.forEach(function(word,w){html+='<span class="meaning-word" id="meaning-'+n+'-'+lang+'-'+w+'">'+esc(word)+'</span> '});html+='</p>'});html+='</div></article>';
 });$('meaningSentences').innerHTML=html;
 var ready=Object.keys(recordings.clips).length,total=recordings.expected||0;$('meaningCoverage').innerHTML=ready===total&&total?'تسجيلات الجمل جاهزة باللغتين':'تسجيلات الجمل الجاهزة: <bdi dir="ltr">'+ready+' / '+total+'</bdi> · اضغط على الجملة للاستماع';
}
function setActive(value){
 stop();if(window.App360WordPlayer)window.App360WordPlayer.stop();active=!!value;
 panel.hidden=!active;document.body.setAttribute('data-learning-track',active?'sentences':'names');var badge=$('learningTrackBadge');if(badge)badge.textContent=active?(prefs().display==='en'?'4–8 · Words and useful sentences':'4–8 · الكلمات والجمل المفيدة'):(prefs().display==='en'?'1–4 · Listen and name':'1–4 · اسمع وسمِّ');
 Array.prototype.forEach.call(document.querySelectorAll('button[data-learning-track]'),function(el){var on=el.getAttribute('data-learning-track')===(active?'sentences':'names');el.classList.toggle('is-active',on);el.setAttribute('aria-pressed',String(on))});
 var button=$('stageSpeakBtn');if(button)button.querySelector('span').textContent=active?(prefs().display==='en'?'Read word and sentences':'انطق الكلمة والجمل'):(prefs().display==='en'?'Speak word':'انطق الكلمة');if(active)render();try{localStorage.setItem('app360:say-name:track',active?'sentences':'names')}catch(e){}
}
function init(){
 panel=$('meaningPanel');if(!panel)return;
 var stage=$('stage');stage.appendChild(panel);
 ['meaningImage','meaningName','meaningCategory','meaningPrevious','meaningNext','meaningCount'].forEach(function(id){var el=$(id);if(el)el.hidden=true});
 var top=panel.querySelector('.meaning-top');if(top)top.innerHTML='<h3>جمل مفيدة · Useful sentences</h3><button id="meaningWordOnly" type="button" class="meaning-play">🔊 الاسم فقط · Word only</button>';$('meaningWordOnly').onclick=function(){window.App360WordPlayer.sayCurrent(null,{once:true})};
 $('meaningSentences').onclick=function(e){var b=e.target.closest('[data-sentence]');if(b)play(Number(b.getAttribute('data-sentence')))};
 Array.prototype.forEach.call(document.querySelectorAll('button[data-learning-track]'),function(el){el.onclick=function(){setActive(el.getAttribute('data-learning-track')==='sentences')}});
 var query={get:function(key){var match=String(location.search||'').match(new RegExp('[?&]'+key+'=([^&]*)'));try{return match?decodeURIComponent(match[1]):''}catch(e){return ''}}},saved='';try{saved=localStorage.getItem('app360:say-name:track')||''}catch(e){}
 var explicit=query.get('launch_age')||query.get('age')||(window.App360AgeLaunch?window.App360AgeLaunch.age():''),level=query.get('launch_level');
 var track=query.get('learn');setActive(track==='sentences'||(track!=='names'&&(level==='2'||explicit==='4-8'||(!explicit&&!level&&saved==='sentences'))));
 document.addEventListener('visibilitychange',function(){if(document.hidden)stop()});window.addEventListener('pagehide',stop);
}
window.App360MeaningLearning={active:function(){return active},speak:function(){stop();var it=current();if(!it)return;var n=0;function next(){if(n<it.sentences.length)play(n++,next)}if(it.sentences[0].lead_name)next();else window.App360WordPlayer.sayCurrent(next,{once:true})},refresh:function(){if(active)render()},stop:stop,cueIndex:cueIndex};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
