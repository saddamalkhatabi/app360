(function(w,d){
'use strict';
var x=new XMLHttpRequest();
x.open('GET','/api/identity/config',true);
x.onload=function(){
 var c;try{c=JSON.parse(x.responseText);}catch(e){return;}
 if(!c.enabled)return;
 w.YEM1_IDENTITY_ACTIVE=true;
 if(w.APP360_SESSION){w.APP360_SESSION.unifiedLogin=function(){location.assign('/sso/start?scope=viewer');return true;};w.APP360_SESSION.switchAccount=w.APP360_SESSION.unifiedLogin;}
 var admin=/^\/admin(?:\/|$)/.test(location.pathname),a=d.createElement('a'),timer=0,compact=false;
 a.id='app360UnifiedLogin';
 a.href='/sso/start?scope='+(admin?'admin':'viewer');
 a.innerHTML='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true" focusable="false"><path d="M14 3h6v18h-6M3 12h12m-5-5 5 5-5 5"/></svg><span data-login-label>الدخول الموحّد · YEM1</span>';
 a.setAttribute('aria-label','الدخول الموحّد · YEM1');
 a.title='الدخول الموحّد · YEM1';
 a.style.cssText='position:fixed;left:12px;bottom:74px;z-index:9999;background:#006e7a;color:#fff;border:1px solid #ffd35b;border-radius:24px;padding:9px 12px;box-sizing:border-box;min-width:48px;min-height:48px;max-width:calc(50vw - 18px);font:13px/1.5 Tahoma;text-align:center;text-decoration:none;display:flex;align-items:center;justify-content:center;gap:6px;flex-wrap:wrap';
 function display(small){compact=small;a.querySelector('[data-login-label]').style.display=small?'none':'inline';a.style.borderRadius=small?'50%':'24px';a.style.padding=small?'10px':'9px 12px';a.setAttribute('aria-expanded',String(!small));}
 function schedule(){w.clearTimeout(timer);timer=w.setTimeout(function(){display(true);},5000);}
 a.onclick=function(e){if(compact){e.preventDefault();display(false);schedule();}};
 d.body.appendChild(a);display(false);schedule();
 d.addEventListener('click',function(e){var el=e.target;while(el&&el!==d){if(el.id==='schoolAdminLoginButton'||el.id==='schoolAdminStandalone'||el.getAttribute&&el.getAttribute('data-a360-login')!==null){e.preventDefault();e.stopImmediatePropagation();location.assign(a.href);return;}el=el.parentNode;}},true);
 if(admin){var check=new XMLHttpRequest();check.open('GET','/api/app360/auth/session',true);check.setRequestHeader('X-App360-Session-Scope','admin');check.onload=function(){if(check.status===401&&!/[?&]guest=1(?:&|$)/.test(location.search))location.replace('/sso/start?scope=admin');};check.send();}
};
x.send();
})(window,document);
