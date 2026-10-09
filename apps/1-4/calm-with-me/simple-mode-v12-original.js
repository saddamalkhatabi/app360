(function(w,d){
'use strict';
if(!d)return;
var KEY='app360:a1-calm:simple-v12';
var GAMES=[
 {id:'app-shape-builder',label_ar:'ألغاز تركيب الأشكال',symbol:'🧩',image:w.APP360_CALM_VISUALS&&w.APP360_CALM_VISUALS.getImage('block'),speech_ar:'نلعب تركيب الأشكال',href:'../tangram-builder/index.html?v=17',age_bands:['1-2','2-3','3-4','4-5'],category:'app'},
 {id:'app-picture-puzzles',label_ar:'ألغاز الصور',symbol:'🖼️',image:w.APP360_CALM_VISUALS&&w.APP360_CALM_VISUALS.getImage('book'),speech_ar:'نلعب ألغاز الصور',href:'../picture-puzzles/index.html?v=3',age_bands:['1-2','2-3','3-4','4-5'],category:'app'}
];
function E(id){return d.getElementById(id)}
function store(v){try{if(w.localStorage)w.localStorage.setItem(KEY,v?'1':'0')}catch(e){}}
function loadMode(){return true}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]})}
function clickNode(n){if(!n)return;try{if(n.click)n.click();else if(n.onclick)n.onclick()}catch(e){}}
function smooth(id){var n=E(id);if(!n)return;setTimeout(function(){try{n.scrollIntoView({behavior:'smooth',block:'start'})}catch(e){try{n.scrollIntoView(true)}catch(x){}}},60)}
function extendTransitions(){var c=w.APP360_CALM_CONTENT,i,j,found;if(!c)return;if(!c.transitions)c.transitions=[];for(i=0;i<GAMES.length;i++){found=false;for(j=0;j<c.transitions.length;j++)if(c.transitions[j]&&c.transitions[j].id===GAMES[i].id){found=true;break}if(!found)c.transitions.push(GAMES[i])}}
extendTransitions();
function advanced(on){if(on){if((' '+d.body.className+' ').indexOf(' calm-advanced ')<0)d.body.className+=(d.body.className?' ':'')+'calm-advanced';store(false)}else{d.body.className=(' '+d.body.className+' ').replace(' calm-advanced ',' ').replace(/^\s+|\s+$/g,'');store(true);var b=E('nav-child');if(b)clickNode(b);setTimeout(function(){w.scrollTo(0,0)},40)}syncHeader();var coach=E('calmCoachBtn'),child=E('calmChildBtn');if(coach)coach.style.display=on?'none':'';if(child)child.style.display=on?'':'none'}
function syncHeader(){var h=d.querySelector?d.querySelector('.head-copy'):null;if(!h)return;var eye=h.querySelector?h.querySelector('.eyebrow'):null,p=h.querySelector?h.querySelector('p'):null;if((' '+d.body.className+' ').indexOf(' calm-advanced ')>=0){if(eye)eye.innerHTML='مدرسة العائلة 360 · الفئة 1-4 · التفاصيل الكاملة';if(p)p.innerHTML='استكشف المواقف والمشاعر والمساعدات وبطاقات الآن/بعد والسجل عندما تحتاج تفاصيل أكثر.'}else{if(eye)eye.innerHTML='للطفل والمرافق · 3 خطوات فقط';if(p)p.innerHTML='المس صورة لتسمعها، ثم اختر ما يساعدك.';var s=d.querySelector?d.querySelector('.safety-line'):null;if(s)s.innerHTML='لا تحتاج لتسمية الشعور بدقة. ابدأ بما يحتاجه الطفل الآن، واختر مساعدة واحدة فقط.'}}
function html(){return '<section id="simpleCalmHome" aria-label="واجهة الطفل">'+
'<div class="simple-stepbar"><span id="simpleBar1" class="on">١ · أشعر</span><span id="simpleBar2">٢ · نجرب</span><span id="simpleBar3">٣ · الآن وبعد</span></div>'+
'<section id="simpleStep1" class="simple-step ready"><h2>كيف أشعر؟</h2><p>المس الصورة لتسمع الشعور.</p><div id="simpleFeelingCards" class="simple-choice-grid" aria-label="صور المشاعر"></div><h3>ماذا أحتاج؟</h3><div id="simpleSignalCards" class="simple-choice-grid" aria-label="صور الاحتياجات"></div><div class="simple-wide-actions"><button id="simpleUnknown" type="button">لا أعرف بعد</button></div></section>'+
'<section id="simpleStep2" class="simple-step" hidden><h2>ماذا نجرب الآن؟</h2><p>المس الصورة لتسمع المساعدة.</p><div id="simpleHelpCards" class="simple-choice-grid" aria-label="صور المساعدات"></div><div class="simple-wide-actions"><button id="simpleBackToFeeling" type="button">السابق: أشعر</button></div></section>'+
'<section id="simpleStep3" class="simple-step" hidden><h2>بطاقة الآن وبعد ذلك</h2><p>اختر صورتين لنفعل شيئًا الآن ثم شيئًا بعده.</p><h3>الآن</h3><div id="simpleNowCards" class="simple-choice-grid"></div><h3>بعد ذلك</h3><div id="simpleThenCards" class="simple-choice-grid"></div><div id="simpleNowThenPreview" class="plan-preview" aria-live="polite"></div><div class="simple-wide-actions"><button id="simpleGood" class="primary" type="button">انتهينا ✓</button><button id="simpleAgain" type="button">مساعدة أخرى</button><button id="simpleBackToHelp" type="button">السابق</button></div><div id="simpleResult" class="simple-result">رائع! يمكنك المحاولة من جديد.</div></section>'+
'</section>'}

var SIGNALS={'need-help':1,'stay-close':1,'water-now':1,quiet:1},FEELINGS={happy:1,sad:1,afraid:1},HELPS={'comfort-touch':1,'quiet-place':1,'familiar-object':1,water:1,'move-together':1},ACTIVITIES={book:1,ball:1,water:1};
var currentChildStep=1;
function showStep(n){currentChildStep=n;for(var i=1;i<=3;i++){var el=E('simpleStep'+i),tab=E('simpleBar'+i);if(el){el.hidden=i!==n;el.style.display=i===n?'block':'none'}if(tab)tab.className=i===n?'on':i<n?'done':''}smooth('simpleStep'+n)}
function cloneCard(src,type){
 var b=d.createElement('button');b.type='button';b.className='simple-choice';b.innerHTML=src.innerHTML;
 var kinds=['data-kind','data-id','data-help','data-step'];for(var i=0;i<kinds.length;i++){var v=src.getAttribute(kinds[i]);if(v)b.setAttribute(kinds[i],v)}
 b.onclick=function(){clickNode(src);setTimeout(function(){refreshSelected();if(type==='signal'||type==='feeling')showStep(2);else if(type==='help')showStep(3)},100)};return b
}
function cloneFiltered(srcId,dstId,type,allowed){
 var src=E(srcId),dst=E(dstId),bs=src?src.getElementsByTagName('button'):[],i,key;
 if(!dst)return;dst.innerHTML='';
 for(i=0;i<bs.length;i++){key=bs[i].getAttribute(type==='help'?'data-help':type==='transition'?'data-step':'data-id');if(allowed[key])dst.appendChild(cloneCard(bs[i],type))}
}
function copyChoices(){
 cloneFiltered('feelingCards','simpleFeelingCards','feeling',FEELINGS);
 cloneFiltered('signalCards','simpleSignalCards','signal',SIGNALS);
 cloneFiltered('helpCards','simpleHelpCards','help',HELPS);
 cloneFiltered('nowPicker','simpleNowCards','transition',ACTIVITIES);
 cloneFiltered('thenPicker','simpleThenCards','transition',ACTIVITIES);
 refreshSelected()
}
function refreshSelected(){
 var lists=[['simpleFeelingCards','feelingCards','data-id'],['simpleSignalCards','signalCards','data-id'],['simpleHelpCards','helpCards','data-help'],['simpleNowCards','nowPicker','data-step'],['simpleThenCards','thenPicker','data-step']];
 for(var i=0;i<lists.length;i++){var dst=E(lists[i][0]),src=E(lists[i][1]);if(!dst||!src)continue;var bs=dst.getElementsByTagName('button'),old=src.getElementsByTagName('button');
 for(var j=0;j<bs.length;j++){var selected=false,key=bs[j].getAttribute(lists[i][2]);for(var k=0;k<old.length;k++)if(old[k].getAttribute(lists[i][2])===key&&(' '+old[k].className+' ').indexOf(' selected ')>=0){selected=true;break}bs[j].className='simple-choice'+(selected?' selected':'');bs[j].setAttribute('aria-pressed',selected?'true':'false')}}var preview=E('simpleNowThenPreview'),original=E('planPreview');if(preview&&original)preview.innerHTML=original.innerHTML;}
function trainerAudio(){
 var lang=w.APP360CalmVoice&&w.APP360CalmVoice.getLanguage&&w.APP360CalmVoice.getLanguage()==='en'?'en':'ar';
 var text=lang==='en'?'This is the coach area':'هذا مكان المدرب',status=E('calmCoachStatus');if(status)status.textContent=text;var sw=E('speechToggle');if(sw&&!sw.checked)return;
 if(w.APP360CalmIntro&&w.APP360CalmIntro.stop)w.APP360CalmIntro.stop();
 if(w.APP360CalmNarration&&w.APP360CalmNarration.stop)w.APP360CalmNarration.stop();
 try{if(w.APP360CalmCoachSound)w.APP360CalmCoachSound.pause();var audio=new w.Audio('audio/intro/coach-'+lang+'.mp3');w.APP360CalmCoachSound=audio;audio.play()}catch(e){}
}
function bind(){
 var n=E('simpleUnknown');if(n)n.onclick=function(){clickNode(E('skipSignalBtn'));showStep(2)};
 n=E('simpleBackToFeeling');if(n)n.onclick=function(){showStep(1)};
 n=E('simpleBackToHelp');if(n)n.onclick=function(){showStep(2)};
 n=E('simpleGood');if(n)n.onclick=function(){var r=E('simpleResult');if(r)r.className='simple-result show'};
 n=E('simpleAgain');if(n)n.onclick=function(){showStep(2)};
 n=E('calmCoachBtn');if(n)n.onclick=function(){advanced(true);trainerAudio();w.scrollTo(0,0)};
 n=E('calmChildBtn');if(n)n.onclick=function(){if(w.APP360CalmCoachSound)try{w.APP360CalmCoachSound.pause()}catch(e){}advanced(false);showStep(1)}
}

function observe(){var a=[E('signalCards'),E('feelingCards'),E('helpCards'),E('nowPicker'),E('thenPicker'),E('currentSignalText'),E('currentHelpText')],i;if(w.MutationObserver){for(i=0;i<a.length;i++)if(a[i])new MutationObserver(function(){copyChoices()}).observe(a[i],{childList:true,subtree:true,characterData:true})}else setInterval(copyChoices,1200)}
function inject(){extendTransitions();var child=E('childView');if(!child||E('simpleCalmHome'))return;var wrap=d.createElement('div');wrap.innerHTML=html();child.insertBefore(wrap.firstChild,child.firstChild);var back=d.createElement('button');back.id='simpleReturnBtn';back.type='button';back.innerHTML='← العودة للطفل';var main=E('mainContent');if(main)main.insertBefore(back,main.firstChild);bind();copyChoices();observe();advanced(false);showStep(1);syncHeader()}
function boot(){inject();setTimeout(copyChoices,250);setTimeout(copyChoices,900)}
if(d.readyState==='loading'){if(d.addEventListener)d.addEventListener('DOMContentLoaded',boot,false);else w.attachEvent&&w.attachEvent('onload',boot)}else boot();
})(window,document);
