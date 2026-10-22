/* Capture callback state before URL cleanup. Confirm identity with the School server. ES5. */
(function(){'use strict';
function query(k){var m=new RegExp('[?&]'+k+'=([^&]*)').exec(location.search);try{return m?decodeURIComponent(m[1]):''}catch(_){return ''}}
var request=query('request'),next=query('next'),popup=query('popup')==='1',expected='',token='',finished=false;
function status(text){document.getElementById('status').textContent=text}
try{expected=sessionStorage.getItem('app360:signin-request:v1')||'';token=JSON.parse(sessionStorage.getItem('app360:auth-token:v1')||'null')||''}catch(_){}
history.replaceState(null,'','auth-complete.html');
if(expected&&request!==expected){status('تعذر مطابقة طلب الدخول. افتح الدخول من المدرسة مجدداً.');return}
if(!/^[a-zA-Z0-9_-]{8,100}$/.test(request)||!token){status('تعذر حفظ جلسة الدخول. افتح رابطاً جديداً من المدرسة.');return}
function localPath(value){var decoded=value;try{for(var i=0;i<3;i++){if(!/^\/(?!\/)/.test(decoded)||/[\\\u0000-\u001f\u007f]/.test(decoded)||/^\/[^?#]*\s/.test(decoded)||/^\/(?:auth-complete|reels-login)\.html(?:[?#]|$)/.test(decoded))return '';var n=decodeURIComponent(decoded);if(n===decoded)break;decoded=n}}catch(_){return ''}return value}
var x=new XMLHttpRequest();x.open('GET','/api/app360/auth/session',true);x.timeout=15000;x.setRequestHeader('Authorization','Bearer '+token);
x.onload=function(){if(finished)return;finished=true;var data;try{data=JSON.parse(x.responseText)}catch(_){}if(x.status!==200||!data||!data.token||!data.profile||!data.profile.user_id){status(x.status===503?'خدمة الحسابات غير متاحة. تحقق من تهيئة الخادم ثم أعد المحاولة.':'تعذر تأكيد جلسة الدخول. افتح الدخول من المدرسة مجدداً.');return}
try{sessionStorage.setItem('app360:auth-token:v1',JSON.stringify(data.token));sessionStorage.setItem('app360:auth-profile:v1',JSON.stringify(data.profile));sessionStorage.removeItem('app360:signin-request:v1');localStorage.setItem('app360:auth-signal:v1',Date.now()+':'+Math.random())}catch(_){}
if(popup&&opener){opener.postMessage({type:'app360:auth-complete',version:1,request:request,session:data},location.protocol+'//'+location.host);try{window.close()}catch(_){}return}
if(popup){status('اكتمل تسجيل الدخول. يمكنك العودة إلى تطبيق المدرسة المفتوح؛ سيتحدث الحساب تلقائياً.');try{window.close()}catch(_){}return}
location.replace(localPath(next)||'/index.html')};
x.onerror=x.ontimeout=function(){if(finished)return;finished=true;status('تعذر تأكيد الجلسة بسبب الاتصال. أعد فتح الدخول عند عودة الشبكة.')};x.send();
})();
