(function(w,d){
'use strict';
if(w.APP360_LOGIN_ENTRY&&w.APP360_LOGIN_ENTRY.__ready)return;
var VERSION='2.0',tries=0,timer=null;
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]})}
function session(){return w.APP360_SESSION||null}
function profile(){var s=session();return s&&s.getProfile?s.getProfile():null}
function openAccount(){var s=session();if(!s||!s.open)return;s.open();setTimeout(function(){var p=profile(),box=d.querySelector?d.querySelector('#app360SessionPanel [data-a360-login-box]'):null;if(!p&&box)box.hidden=false;var q=d.querySelector?d.querySelector('#app360SessionPanel [data-a360-query]'):null;if(!p&&q)try{q.focus()}catch(e){}},40)}
function label(){var p=profile();return p?('👤 '+(p.display_name||'حسابي')):'👤 تسجيل الدخول'}
function bindOne(b,hideOnPortal){if(!b)return;if(hideOnPortal){b.style.display='none';return}b.innerHTML=esc(label());b.setAttribute('aria-label',profile()?'فتح الحساب والنشاط':'تسجيل الدخول إلى App360');if(!b.__app360LoginEntry){b.__app360LoginEntry=true;b.onclick=openAccount}}
function refresh(){var portal=d.getElementById('portalAccountBtn'),activity=d.getElementById('app360ActivityBtn');if(portal){portal.innerHTML=esc(label());portal.setAttribute('aria-label',profile()?'فتح الحساب':'تسجيل الدخول إلى App360');if(!portal.__app360LoginEntry){portal.__app360LoginEntry=true;portal.onclick=openAccount}}bindOne(activity,!!portal)}
function start(){if(session()){refresh();timer=setInterval(refresh,900);return true}return false}
function init(){if(start())return;var t=setInterval(function(){tries++;if(start()||tries>150)clearInterval(t)},80)}
w.APP360_LOGIN_ENTRY={__ready:true,version:VERSION,refresh:refresh,open:openAccount};
if(d.readyState==='loading'){if(d.addEventListener)d.addEventListener('DOMContentLoaded',init,false);else if(w.attachEvent)w.attachEvent('onload',init)}else init();
})(window,document);
