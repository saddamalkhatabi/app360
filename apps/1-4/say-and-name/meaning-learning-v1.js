(function(){'use strict';
var content=window.APP360_MEANING_CONTENT||{items:[],categories:[]},recordings=window.APP360_MEANING_AUDIO||{clips:{}},active=false,index=0,category='',audio=null,token=0,timer=null,frame=null,panel;
function $(id){return document.getElementById(id)}
function esc(v){return String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;')}
function prefs(){return window.App360WordPlayer?window.App360WordPlayer.preferences():{display:'ar',voice:'ar',repeat:true,speech:true}}
function list(){return content.items.filter(function(it){return !category||it.category===category})}
function current(){return list()[index]}
function clearHighlight(){if(!panel)return;Array.prototype.forEach.call(panel.querySelectorAll('.meaning-word'),function(el){el.classList.remove('is-speaking')})}
function stop(){token++;clearTimeout(timer);timer=null;if(frame)cancelAnimationFrame(frame);frame=null;if(audio){audio.onended=null;audio.onerror=null;audio.pause();audio=null}clearHighlight();if($('meaningStatus'))$('meaningStatus').textContent=''}
function cueIndex(cues,time){for(var i=0;i<cues.length;i++)if(time>=cues[i][1]&&time<cues[i][2])return cues[i][0];return -1}
function play(number){
 stop();var it=current(),p=prefs();if(!it||!p.speech)return;var seq=token,langs=p.voice==='both'?['ar','en']:[p.voice],queue=[];
 langs.forEach(function(lang){if(it.sentences[number][lang])queue.push(lang)});
 var missing=queue.some(function(lang){return !recordings.clips[it.sentences[number][lang].clip]});
 if(missing){$('meaningStatus').textContent='تسجيل SILMA لهذه الجملة قيد التجهيز · Recording pending';return}
 if(window.App360WordPlayer)window.App360WordPlayer.stop();
 function one(pos,repeatRound){
  if(seq!==token)return;
  if(pos>=queue.length){if(p.repeat&&!repeatRound){timer=setTimeout(function(){one(0,true)},1400)}else{clearHighlight();$('meaningStatus').textContent=''}return}
  var lang=queue[pos],row=it.sentences[number][lang],clip=recordings.clips[row.clip];audio=new Audio(clip.path);audio.playbackRate=repeatRound?1.05:1;audio.preservesPitch=!repeatRound;audio.mozPreservesPitch=!repeatRound;audio.webkitPreservesPitch=!repeatRound;
  $('meaningStatus').textContent=(repeatRound?'ترديد · Repeat':'استمع · Listen')+' — SILMA';
  function tick(){if(seq!==token||!audio)return;clearHighlight();var word=cueIndex(clip.cues,audio.currentTime*1000),el=$('meaning-'+number+'-'+lang+'-'+word);if(el)el.classList.add('is-speaking');frame=requestAnimationFrame(tick)}
  audio.onended=function(){if(seq!==token)return;if(frame)cancelAnimationFrame(frame);clearHighlight();one(pos+1,repeatRound)};
  audio.onerror=function(){if(seq!==token)return;stop();$('meaningStatus').textContent='تعذر تحميل التسجيل. حاول مرة أخرى · Please try again'};
  tick();var promise=audio.play();if(promise&&promise.catch)promise.catch(function(){if(seq===token){stop();$('meaningStatus').textContent='اضغط على الجملة لتشغيل الصوت · Tap the sentence to play'}});
 }
 one(0,false);
}
function render(){
 if(!panel)return;stop();var it=current(),p=prefs(),rows=list();if(!it)return;
 var maps=window.APP360_WORD_IMAGE_CONTEXT_MAP||{},map=window.APP360_WORD_IMAGE_MAP||{},file=maps[it.key]||map[it.ar];
 $('meaningImage').src=file?'assets/word-images/'+file:'';$('meaningImage').alt=p.display==='en'?it.en:it.ar;
 $('meaningName').textContent=p.display==='both'?it.ar+' · '+it.en:p.display==='en'?it.en:it.ar;$('meaningCount').textContent=(index+1)+' / '+rows.length;
 $('meaningCategory').value=category;
 var langs=p.display==='both'?['ar','en']:[p.display],html='';
 it.sentences.forEach(function(row,n){html+='<article class="meaning-sentence"><button type="button" data-sentence="'+n+'" class="meaning-play" aria-label="استمع إلى الجملة '+(n+1)+'">🔊 '+(n+1)+'</button><div>';
  langs.forEach(function(lang){html+='<p dir="'+(lang==='ar'?'rtl':'ltr')+'" lang="'+lang+'">';row[lang].words.forEach(function(word,w){html+='<span class="meaning-word" id="meaning-'+n+'-'+lang+'-'+w+'">'+esc(word)+'</span> '});html+='</p>'});html+='</div></article>';
 });$('meaningSentences').innerHTML=html;
 var ready=Object.keys(recordings.clips).length,total=recordings.expected||0;$('meaningCoverage').textContent=ready===total&&total?'تسجيلات الجمل جاهزة باللغتين · SILMA':'تسجيلات SILMA الجاهزة: '+ready+' / '+total+' · اضغط على الجملة للاستماع';
}
function move(n){stop();var rows=list();if(!rows.length)return;index=(index+n+rows.length)%rows.length;render()}
function setActive(value){
 stop();if(window.App360WordPlayer)window.App360WordPlayer.stop();active=!!value;
 Array.prototype.forEach.call(document.querySelectorAll('.learn-panel,.facilitator'),function(el){el.hidden=active});panel.hidden=!active;
 ['childAudioHelpBtn','helpBtn'].forEach(function(id){if($(id))$(id).hidden=active});
 Array.prototype.forEach.call(document.querySelectorAll('[data-learning-track]'),function(el){var on=el.getAttribute('data-learning-track')===(active?'sentences':'names');el.classList.toggle('is-active',on);el.setAttribute('aria-pressed',String(on))});
 if(active)render();try{localStorage.setItem('app360:say-name:track',active?'sentences':'names')}catch(e){}
}
function init(){
 panel=$('meaningPanel');if(!panel)return;
 $('meaningCategory').innerHTML='<option value="">كل الأشياء · All things</option>'+content.categories.map(function(cat){return '<option value="'+esc(cat.ar)+'">'+esc(cat.ar)+' · '+esc(cat.en)+'</option>'}).join('');
 $('meaningCategory').onchange=function(){category=this.value;index=0;render()};$('meaningPrevious').onclick=function(){move(-1)};$('meaningNext').onclick=function(){move(1)};
 $('meaningSentences').onclick=function(e){var b=e.target.closest('[data-sentence]');if(b)play(Number(b.getAttribute('data-sentence')))};
 Array.prototype.forEach.call(document.querySelectorAll('[data-learning-track]'),function(el){el.onclick=function(){setActive(el.getAttribute('data-learning-track')==='sentences')}});
 var query=new URLSearchParams(location.search),saved='';try{saved=localStorage.getItem('app360:say-name:track')||''}catch(e){}
 var explicit=query.get('launch_age')||query.get('age'),level=query.get('launch_level');
 setActive(query.get('learn')==='sentences'||level==='2'||explicit==='4-8'||(!explicit&&!level&&saved==='sentences'));
 document.addEventListener('visibilitychange',function(){if(document.hidden)stop()});window.addEventListener('pagehide',stop);
}
window.App360MeaningLearning={active:function(){return active},speak:function(){play(0)},move:move,refresh:function(){if(active)render()},stop:stop,cueIndex:cueIndex};
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
