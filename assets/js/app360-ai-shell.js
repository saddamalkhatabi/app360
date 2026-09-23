(function(w,d){
'use strict';
if(w.APP360_AI_SHELL&&w.APP360_AI_SHELL.__ready)return;
var VERSION='2.0';
function addClass(el,name){if(!el)return;var c=' '+(el.className||'')+' ';if(c.indexOf(' '+name+' ')<0)el.className=(el.className?el.className+' ':'')+name}
function oldAndroid(){var ua=(w.navigator&&w.navigator.userAgent)||'',m=/Android\s+([0-9]+)(?:\.([0-9]+))?/i.exec(ua);if(!m)return /BigTAB|DMTAB|Android 4\./i.test(ua);return (parseInt(m[1],10)||0)<=5}
function supportsGrid(){try{return !!(w.CSS&&w.CSS.supports&&w.CSS.supports('display','grid'))}catch(e){return false}}
function legacy(){return w.APP360_LEGACY===true||oldAndroid()||!supportsGrid()}
function repoHome(){var p=(w.location&&w.location.pathname)||'',i=p.indexOf('/apps/'),prefix=i>=0?p.substring(0,i):'';if(!prefix||prefix==='/')return '/index.html';return prefix+'/index.html'}
function injectStyle(){if(d.getElementById('app360ShellStyle'))return;var s=d.createElement('style');s.id='app360ShellStyle';s.type='text/css';s.innerHTML='#app360HomeBtn{position:fixed;right:12px;bottom:14px;z-index:9996;min-height:52px;padding:10px 15px;border:2px solid #17343a;border-radius:18px;background:#fff;color:#17343a;font:bold 15px Tahoma,Arial,sans-serif;box-shadow:0 5px 20px rgba(0,0,0,.16);cursor:pointer}html.app360-legacy #app360HomeBtn{position:absolute;right:8px;top:8px;bottom:auto} @media(max-width:620px){#app360HomeBtn{right:8px;bottom:8px;padding:9px 12px;min-height:48px}}';(d.head||d.getElementsByTagName('head')[0]||d.body).appendChild(s)}
function addHome(){if(d.getElementById('app360HomeBtn')||!d.body)return;injectStyle();var b=d.createElement('button');b.id='app360HomeBtn';b.type='button';b.innerHTML='🏠 الرئيسية';b.title='العودة إلى الشاشة الرئيسية لمختبر التطبيق 360';b.setAttribute('aria-label','العودة إلى الشاشة الرئيسية');b.onclick=function(){try{w.location.href=repoHome()}catch(e){w.location.assign(repoHome())}};d.body.appendChild(b)}
function loadAi(){if(w.APP360_AI_AUTOLOAD===false||w.APP360_AI_CONTENT||d.getElementById('app360AiRuntimeScript'))return;var p=(w.location&&w.location.pathname)||'';if(p.indexOf('/apps/')<0||/\/apps\/_template\//.test(p))return;var s=d.createElement('script');s.id='app360AiRuntimeScript';s.src='../../../assets/js/ai-content-studio.js?v=2';s.async=true;(d.head||d.getElementsByTagName('head')[0]||d.body).appendChild(s)}
function init(){var html=d.documentElement||d.getElementsByTagName('html')[0];if(legacy()){w.APP360_LEGACY=true;addClass(html,'app360-legacy')}addHome();loadAi()}
w.APP360_AI_SHELL={__ready:true,version:VERSION,home:repoHome,refresh:function(){addHome();loadAi()}};
if(d.readyState==='loading'){if(d.addEventListener)d.addEventListener('DOMContentLoaded',init,false);else if(w.attachEvent)w.attachEvent('onload',init)}else init();
})(window,document);
