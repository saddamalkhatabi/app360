(function(w,d){
'use strict';
/* Bilingual PRE-RECORDED audio only. No browser speech synthesis or live inference. */
var STORAGE_KEY='app360:a1-calm:recording-language';
var lang='ar',current=null,token=0,captionNode=null,button=null;
try{lang=w.localStorage.getItem(STORAGE_KEY)==='en'?'en':'ar'}catch(e){}
function data(){return w.APP360_CALM_BILINGUAL_AUDIO||{choices:{},phrases:{}}}
function norm(s){
  s=String(s==null?'':s);
  if(s.normalize)try{s=s.normalize('NFKC')}catch(e){}
  return s.replace(/[\u064b-\u065f\u0670\u0640]/g,'').replace(/\s+/g,' ').trim()
    .replace(/[.،؟!?؛:«»"']/g,'').trim();
}
function setText(s){
 if(!captionNode)return;
 captionNode.textContent=s||'';
 captionNode.dir=lang==='en'?'ltr':'rtl';
 captionNode.hidden=!s;
}
function stop(){
 token++;
 if(current){try{current.onended=null;current.onerror=null;current.pause()}catch(e){}current=null}
 setText('');
}
function getLanguage(){return lang}
function status(fn,message){if(typeof fn==='function')try{fn(message)}catch(e){}}
function playPhrase(phrase,report){
 var enabled=d.getElementById('speechToggle');
 if(enabled && !enabled.checked){status(report,'الصوت متوقف من الإعدادات.');return false}
 phrase=String(phrase||'').trim();if(!phrase)return false;
 // Only authored, prebuilt prompt paths are valid. Family custom input stays text only.
 var row=(data().phrases||{})[norm(phrase)];
 if(w.APP360CalmNarration&&w.APP360CalmNarration.stop)w.APP360CalmNarration.stop();
 else stop();
 if(!row||!row[lang]){setText(phrase);status(report,lang==='en'?'No saved English recording for this text.':'لا يوجد تسجيل محفوظ لهذه العبارة.');return false}
 var item=row[lang],path=typeof item==='string'?item:item.path,
     message=lang==='en'?(row.text_en||phrase):(row.text_ar||phrase);
 if(!path){setText(phrase);status(report,'الملف الصوتي غير متوفر.');return false}
 var mark=++token;
 try{
  var a=new w.Audio(path);current=a;setText(message);
  a.onended=function(){if(mark===token){current=null;setText('')}};
  a.onerror=function(){if(mark===token){current=null;setText(message);status(report,'تعذر تشغيل ملف الصوت المحفوظ.')}};
  var result=a.play();
  if(result&&typeof result.then==='function')result.then(null,a.onerror);
  status(report,lang==='en'?'Playing the saved English recording.':'يتم تشغيل التسجيل العربي المحفوظ.');
  return true;
 }catch(e){status(report,'تعذر تشغيل ملف MP3.');return false}
}
function showChoiceCaption(kind,id){
 var row=(data().choices||{})[kind+':'+id];
 if(row)setText(lang==='en'?row.text_en:row.text_ar);
}
function change(){
 lang=lang==='ar'?'en':'ar';
 try{w.localStorage.setItem(STORAGE_KEY,lang)}catch(e){}
 if(w.APP360CalmNarration&&w.APP360CalmNarration.stop)w.APP360CalmNarration.stop();
 stop();
 render();
 if(w.APP360CalmIntro&&w.APP360CalmIntro.onLanguageChange)w.APP360CalmIntro.onLanguageChange();
}
function render(){
 if(button){
  button.textContent=lang==='ar'?'🔊 الصوت: العربية | English':'🔊 Audio: English | العربية';
  button.setAttribute('aria-label',lang==='ar'?'التبديل إلى التسجيلات الإنجليزية':'Switch to Arabic recordings');
  button.setAttribute('aria-pressed',String(lang==='en'));
 }
 d.documentElement.setAttribute('data-calm-voice-lang',lang);
}
function init(){
 if(d.getElementById('calmBilingualAudioButton'))return;
 var head=d.querySelector&&d.querySelector('.head-actions');
 if(!head)head=d.getElementById('mainNav');
 if(!head)return;
 button=d.createElement('button');button.type='button';button.id='calmBilingualAudioButton';
 button.className='secondary';button.onclick=change;
 head.appendChild(button);
 captionNode=d.createElement('div');captionNode.id='calmAudioLanguageCaption';
 captionNode.setAttribute('role','status');captionNode.setAttribute('aria-live','polite');
 captionNode.style.cssText='font-size:1.1rem;line-height:1.6;max-width:48rem;margin:0.4rem auto;padding:0.45rem 1rem;text-align:center;font-weight:600;display:block';
 captionNode.hidden=true;
 var root=d.getElementById('mainContent');if(root&&root.parentNode)root.parentNode.insertBefore(captionNode,root);
 else head.appendChild(captionNode);
 render();
}
w.APP360CalmVoice={getLanguage:getLanguage,setLanguage:function(next){if(next!==lang&&/^(ar|en)$/.test(next))change()},playPhrase:playPhrase,stop:stop,showChoiceCaption:showChoiceCaption,normalize:norm};
if(d.readyState==='loading'&&d.addEventListener)d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
