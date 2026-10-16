(function(w,d){'use strict';
var root='../say-and-name/',sentenceMedia='../say-and-name/audio/meaning/',audio=null,clock=null,generation=0,item=null,older=/[?&](?:launch_age|age)=4-8(?:&|$)/.test(location.search),key='app360:a1-picture-puzzles:'+(older?'4-8:':'1-4:')+'sentences',enabled=older,box=d.getElementById('puzzleLesson'),toggle=d.getElementById('showSentencesToggle');
try{var saved=localStorage.getItem(key);if(saved!==null)enabled=saved==='1'}catch(e){}toggle.checked=enabled;
function $(id){return d.getElementById(id)}
function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function unhighlight(){var nodes=box.querySelectorAll('.speaking'),i;for(i=0;i<nodes.length;i++)nodes[i].className='lessonWord'}
function stop(){generation++;if(w.App360Celebration)w.App360Celebration.stop();clearInterval(clock);clock=null;if(audio){audio.onended=null;audio.onerror=null;audio.pause();audio=null}unhighlight()}
function close(){stop();if(w.App360Celebration)w.App360Celebration.stop();box.style.display='none';box.setAttribute('aria-hidden','true')}
function language(){if(w.PicturePuzzleAudio)return w.PicturePuzzleAudio.language();var select=$('voiceLangSelect');return select?select.value:'ar'}
function play(number,done){stop();if(w.PicturePuzzleAudio)w.PicturePuzzleAudio.stop();if(!item)return;var row=item.sentences[number],lang=language(),queue=lang==='both'?['ar','en']:[lang],seq=generation;
 function next(){if(seq!==generation)return;var current=queue.shift();if(!current){$('lessonStatus').textContent='';if(done)done();return}var data=row[current],manifest=w.APP360_MEANING_AUDIO||{},clip=data&&manifest.clips&&manifest.clips[data.clip];if(!clip||clip.text!==data.text){$('lessonStatus').textContent='هذا التسجيل قيد التجهيز · Recording pending';return}if(String($('soundBtn').textContent).indexOf('🔇')>=0){$('lessonStatus').textContent='فعّل الصوت للاستماع · Turn sound on';return}
 audio=new Audio(clip.path.indexOf('audio/meaning/')===0?sentenceMedia+clip.path.slice(14):root+clip.path);$('lessonStatus').textContent=current==='ar'?'استمع وتابع الكلمات':'Listen and follow the words';
 clock=setInterval(function(){if(seq!==generation||!audio)return;unhighlight();var ms=audio.currentTime*1000,i,c;for(i=0;i<clip.cues.length;i++){c=clip.cues[i];if(ms>=c[1]&&ms<c[2]){var el=$('lesson-'+number+'-'+current+'-'+c[0]);if(el)el.className='lessonWord speaking';break}}},45);
 audio.onended=function(){clearInterval(clock);unhighlight();next()};audio.onerror=function(){stop();$('lessonStatus').textContent='تعذر تشغيل التسجيل، اضغط للمحاولة مجددًا · Tap to retry'};var promise=audio.play();if(promise&&promise.catch)promise.catch(function(){if(seq===generation){stop();$('lessonStatus').textContent='اضغط على الجملة للاستماع · Tap to listen'}});
 }next();
}
function show(picture,path){close();if(!enabled)return;var items=(w.APP360_MEANING_CONTENT||{}).items||[],i,j,row,html='';item=null;for(i=0;i<items.length;i++)if(items[i].key===picture.category+'\u0001'+picture.word){item=items[i];break}if(!item){for(i=0;i<items.length;i++)if(items[i].ar===picture.word){item=items[i];break}}if(!item)return;
 $('winCard').style.display='none';$('lessonImage').src=path;$('lessonImage').alt=picture.word;$('lessonTitle').textContent=picture.word+' · '+item.en;
 for(i=0;i<item.sentences.length;i++){row=item.sentences[i];html+='<article><button type="button" data-sentence="'+i+'">🔊 استمع · Listen</button>';for(j=0;j<2;j++){var lang=j?'en':'ar',line=row[lang];if(!line)continue;html+='<p lang="'+lang+'" dir="'+(j?'ltr':'rtl')+'">';for(var k=0;k<line.words.length;k++)html+='<span class="lessonWord" id="lesson-'+i+'-'+lang+'-'+k+'">'+esc(line.words[k])+'</span> ';html+='</p>'}html+='</article>'}
 $('lessonSentences').innerHTML=html;$('lessonStatus').textContent='أحسنت! استمع إلى الجمل · Listen to the sentences';box.style.display='block';box.setAttribute('aria-hidden','false');$('lessonClose').focus();var start=generation;function read(){if(start!==generation)return;var n=0;function nextSentence(){if(n<item.sentences.length)play(n++,nextSentence)}nextSentence()}if(String($('soundBtn').textContent).indexOf('🔇')<0){if(w.PicturePuzzleAudio)w.PicturePuzzleAudio.stop();if(w.App360Celebration)w.App360Celebration.play({language:language()==='en'?'en':'ar'},read);else read()}
}
$('lessonSentences').onclick=function(e){var node=e.target;while(node&&node!==this){if(node.getAttribute('data-sentence')!==null){play(parseInt(node.getAttribute('data-sentence'),10));return}node=node.parentNode}};
$('lessonClose').onclick=function(){close();$('winCard').style.display='block'};$('lessonNext').onclick=function(){close();$('nextBtn').click()};toggle.onchange=function(){enabled=!!toggle.checked;try{localStorage.setItem(key,enabled?'1':'0')}catch(e){}if(!enabled)close()};
$('soundBtn').addEventListener('click',stop,false);$('settingsBtn').addEventListener('click',stop,false);w.addEventListener('pagehide',close,false);d.addEventListener('visibilitychange',function(){if(d.hidden)stop()},false);d.addEventListener('keydown',function(e){if(e.keyCode===27&&box.style.display==='block')$('lessonClose').click()},false);
var app=$('app');if(app&&box.parentNode!==app)app.appendChild(box);
w.PicturePuzzleLearning={show:show,close:close,stop:stop,enabled:function(){return enabled}};
})(window,document);
