/* Scoped YEM1 window navigation; UI messages never carry credentials. */
(function(w,d){'use strict';if(w.YEM1HostBridge)return;
function param(name){var m=new RegExp('[?&]'+name+'=([^&]*)').exec(location.search);try{return m?decodeURIComponent(m[1]):'';}catch(e){return '';}}
function origin(value){var a=d.createElement('a');a.href=value;return a.protocol+'//'+a.host;}
var parentOrigin=param('parent_origin'),ticket=param('yem1_window'),hosted=w.parent!==w&&param('host_app')==='yem1'&&parentOrigin==='https://yem1.com'&&origin(d.referrer)===parentOrigin&&/^[a-f0-9]{32}$/.test(ticket),app='school';
function post(type,data){if(!hosted)return false;data.type=type;data.version=1;data.request_id=ticket;w.parent.postMessage(data,parentOrigin);return true;}
function auth(scope,action){return post('yem1:auth-request',{scope:scope==='admin'?'admin':'viewer',action:action==='register'?'register':'login'});}
w.YEM1HostBridge={embedded:hosted,requestAuth:auth,requestProduct:function(key){return post('yem1:open-product',{product:key});}};if(!hosted)return;
d.addEventListener('click',function(e){var n=e.target;while(n&&n!==d){var id=n.id||'';if(id==='schoolAppsBtn'||id==='app360ReelsReturn'||n.getAttribute&&(n.getAttribute('data-school-age')!==null||n.getAttribute('data-reels-entry')!==null)){e.preventDefault();e.stopImmediatePropagation();w.YEM1HostBridge.requestProduct(app==='reels'?'school':'reels');return;}
if(id==='app360UnifiedLogin'&&n.getAttribute('aria-expanded')==='false')return;
if(n.tagName==='A'&&n.href){var a=d.createElement('a');a.href=n.href;var own=origin(a.href)===location.origin,hub=origin(a.href)===parentOrigin,register=/^\/(?:register(?:\.html)?|signup)$/.test(a.pathname)||hub&&a.pathname==='/login'&&/[?&]enroll=1/.test(a.search),login=own&&a.pathname==='/sso/start'||hub&&/^\/(?:login(?:\/basic)?|authorize)$/.test(a.pathname);if(register||login){e.preventDefault();e.stopImmediatePropagation();auth(/[?&]scope=admin(?:&|$)/.test(a.search)?'admin':'viewer',register?'register':'login');return;}}n=n.parentNode;}},true);
w.addEventListener('message',function(e){var m=e.data;if(e.source!==w.parent||e.origin!==parentOrigin||!m||m.type!=='yem1:visibility'||m.version!==1||m.request_id!==ticket)return;var visible=m.visible===true;if(w.APP360_INTEGRATION_CONTEXT&&w.APP360_INTEGRATION_CONTEXT.visibility){w.APP360_INTEGRATION_CONTEXT.visibility(visible);return;}if(!visible){var media=d.querySelectorAll('audio,video'),frames=d.getElementsByTagName('iframe');for(var i=0;i<media.length;i++)try{media[i].pause();}catch(_){}for(i=0;i<frames.length;i++){var a=d.createElement('a');a.href=frames[i].src;if(a.protocol==='https:'&&/^(?:www\.)?(?:youtube\.com|youtube-nocookie\.com)$/.test(a.hostname))try{frames[i].contentWindow.postMessage(JSON.stringify({event:'command',func:'pauseVideo',args:[]}),a.protocol+'//'+a.host);}catch(_){}}}});
})(window,document);

(function(w,d){
'use strict';
var x=new XMLHttpRequest();
x.open('GET','/api/identity/config',true);
x.onload=function(){
 var c;try{c=JSON.parse(x.responseText);}catch(e){return;}
 if(!c.enabled)return;
 w.YEM1_IDENTITY_ACTIVE=true;
 if(w.APP360_SESSION){w.APP360_SESSION.unifiedLogin=function(){if(!w.YEM1HostBridge.requestAuth('viewer'))location.assign('/sso/start?scope=viewer');return true;};w.APP360_SESSION.switchAccount=w.APP360_SESSION.unifiedLogin;}
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
 d.addEventListener('click',function(e){var el=e.target;while(el&&el!==d){if(el.id==='schoolAdminLoginButton'||el.id==='schoolAdminStandalone'||el.getAttribute&&el.getAttribute('data-a360-login')!==null){e.preventDefault();e.stopImmediatePropagation();if(!w.YEM1HostBridge.requestAuth(admin?'admin':'viewer'))location.assign(a.href);return;}el=el.parentNode;}},true);
 if(admin&&w.top===w){var check=new XMLHttpRequest();check.open('GET','/api/app360/auth/session',true);check.setRequestHeader('X-App360-Session-Scope','admin');check.onload=function(){if(check.status===401&&!/[?&]guest=1(?:&|$)/.test(location.search))location.replace('/sso/start?scope=admin');};check.send();}
};
x.send();
})(window,document);
