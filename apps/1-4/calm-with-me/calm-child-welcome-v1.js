(function(w,d){
'use strict';
/* A child can discover what the app does even without a trainer.
   Only two pre-recorded MP3 assets; never synthesize in the browser. */
var media=null,token=0,firstInteraction=false,initDone=false;
var W={ar:{
 title:'مرحبًا يا صديقي! كيف تشعر اليوم؟',
 description:'المس وجهًا لتسمع اسم الشعور، ثم اكتشف ما يساعدك.',
 button:'🔊 اسمع: ماذا نفعل هنا؟',
 idle:'اضغط زر الصوت للاستماع إلى الشرح.',
 blocked:'اضغط الزر الأخضر لتسمع صوت الترحيب.',
 playing:'هيا نتعرف على مشاعرنا معًا!',
 unavailable:'تعذّر تشغيل التسجيل الآن. المس صورة لتسمع اسم الشعور.',
 feelings:['سعيد','حزين','خائف'],
 labels:['أنا سعيد','أنا حزين','أنا خائف']
},en:{
 title:'Hello, my friend! How do you feel?',
 description:'Tap a face to hear the feeling, then find what helps.',
 button:'🔊 Listen: What is this app?',
 idle:'Tap the sound button to hear what to do.',
 blocked:'Tap the green button to hear the welcome message.',
 playing:'Let us explore our feelings together!',
 unavailable:'The recording could not play. Tap a face to hear a feeling.',
 feelings:['Happy','Sad','Scared'],
 labels:['I am happy','I am sad','I am scared']
}};
function $(id){return d.getElementById(id)}
function language(){return w.APP360CalmVoice&&w.APP360CalmVoice.getLanguage&&w.APP360CalmVoice.getLanguage()==='en'?'en':'ar'}
function tr(){return W[language()]}
function message(msg){var node=$('calmWelcomeStatus');if(node)node.textContent=msg||''}
function stop(){token++;if(media){try{media.onended=null;media.onerror=null;media.pause()}catch(e){}media=null}}
function render(){
 var lang=language(),txt=W[lang],ids=['happy','sad','afraid'];
 var a=$('calmWelcomeTitle'),b=$('calmWelcomeDescription'),c=$('calmPlayWelcomeBtn');
 if(a)a.textContent=txt.title;
 if(b)b.textContent=txt.description;
 if(c){c.textContent=txt.button;c.setAttribute('aria-label',txt.button)}
 var intro=$('calmChildWelcome');if(intro)intro.setAttribute('dir',lang==='en'?'ltr':'rtl');
 var box=$('calmQuickFeelings'),buttons=box&&box.getElementsByTagName('button'),i;
 if(box)box.setAttribute('aria-label',lang==='en'?'Tap a feeling to hear it':'اضغط على الشعور لتسمعه');
 for(i=0;buttons&&i<buttons.length;i++){var label=buttons[i].getElementsByTagName('b')[0];if(label)label.textContent=txt.feelings[i];buttons[i].setAttribute('aria-label',txt.labels[i])}
 message(txt.idle);
}
function enabled(){var toggle=$('speechToggle');return !toggle||toggle.checked}
function play(automatic){
 if(!enabled()){if(!automatic)message(tr().idle);return false}
 stop();
 if(w.APP360CalmNarration&&w.APP360CalmNarration.stop)w.APP360CalmNarration.stop();
 else if(w.APP360CalmVoice&&w.APP360CalmVoice.stop)w.APP360CalmVoice.stop();
 var lang=language(),path='audio/intro/intro-'+lang+'.mp3',mark=++token;
 if(!w.Audio){message(tr().unavailable);return false}
 try{
  var clip=new w.Audio(path);media=clip;
  clip.preload='auto';
  clip.onended=function(){if(token===mark){media=null;message(tr().idle)}};
  clip.onerror=function(){if(token===mark){media=null;message(tr().unavailable)}};
  var result=clip.play();
  if(result&&typeof result.then==='function')result.then(function(){if(token===mark)message(tr().playing)},function(){if(token===mark){media=null;message(automatic?tr().blocked:tr().unavailable)}});
  else if(!automatic)message(tr().playing);
  return true;
 }catch(e){if(token===mark){media=null;message(automatic?tr().blocked:tr().unavailable)}return false}
}
function onLanguageChange(){
 var wasPlaying=media&&!media.paused;
 stop();render();
 if(wasPlaying)play(false);
}
function quickFeeling(id){
 var root=$('feelingCards'),buttons=root&&root.getElementsByTagName('button'),i,target=null;
 for(i=0;buttons&&i<buttons.length;i++)if(buttons[i].getAttribute('data-id')===id){target=buttons[i];break}
 if(target&&typeof target.click==='function'){target.click();return}
 var list=(w.APP360_CALM_CONTENT&&w.APP360_CALM_CONTENT.feelings)||[];
 for(i=0;i<list.length;i++)if(list[i].id===id){if(w.APP360CalmNarration)w.APP360CalmNarration.play(list[i],function(t){message(t)});return}
}
function init(){
 if(initDone)return;initDone=true;
 var button=$('calmPlayWelcomeBtn'),root=$('calmQuickFeelings'),buttons=root&&root.getElementsByTagName('button'),i;
 if(!button)return;
 render();
 button.onclick=function(){firstInteraction=true;play(false)};
 for(i=0;buttons&&i<buttons.length;i++){(function(el){el.onclick=function(){firstInteraction=true;quickFeeling(el.getAttribute('data-intro-feeling'))}})(buttons[i])}
 if(d.addEventListener){
  d.addEventListener('touchstart',function(){firstInteraction=true},true);
  d.addEventListener('click',function(){firstInteraction=true},true);
  d.addEventListener('visibilitychange',function(){if(d.hidden)stop()},false);
 }
 /* Auto-play is best effort: phones block audio until first user gesture.
    The large replay button and tactile face choices are the guaranteed fallback. */
 setTimeout(function(){if(!firstInteraction&&!d.hidden)play(true)},650);
}
w.APP360CalmIntro={play:function(){return play(false)},stop:stop,onLanguageChange:onLanguageChange};
if(d.readyState==='loading'&&d.addEventListener)d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
