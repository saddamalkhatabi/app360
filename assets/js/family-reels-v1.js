(function(w,d){
'use strict';
var AGES=['1-4','4-8','8-12','12-16','16-24','24-45','45-60','60-80'],rows=[],memory={};
function validAge(age){return AGES.indexOf(age)>=0}
function validRole(role){return role==='learner'||role==='coach'}
function validLanguage(lang){return lang==='ar'||lang==='en'}
function esc(v){return String(v==null?'':v).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function query(search,key){var m=String(search||'').match(new RegExp('[?&]'+key+'=([^&]*)'));try{return m?decodeURIComponent(m[1]):''}catch(e){return''}}
function api(){try{return w.APP360_FAMILY_SYNC||(w.parent!==w&&w.parent.APP360_FAMILY_SYNC)||null}catch(e){return null}}
function profileKey(){var a=api(),p,id,n;try{if(a&&a.getProfileKey)return a.getProfileKey();p=JSON.parse(w.sessionStorage.getItem('app360:auth-profile:v1')||'null');id=p&&(p.id||p.user_id);if(id)return'user:'+String(id);n=w.localStorage.getItem('app360:profile:name')||'';return'name:'+n}catch(e){return'visitor'}}
function languageKey(){return'app360:family-reels:language:v1:'+profileKey()}
function preferredLanguage(){var key=languageKey(),lang=memory[key];try{lang=w.localStorage.getItem(key)||lang}catch(e){}return validLanguage(lang)?lang:'ar'}
function setLanguage(lang){if(!validLanguage(lang))return false;var key=languageKey();memory[key]=lang;try{w.localStorage.setItem(key,lang)}catch(e){}return true}
function buildUrl(age,role,lang){if(!validAge(age)||!validRole(role)||!validLanguage(lang))return'';return'https://yem1.com/watch?age='+age+'&role='+role+'&lang='+lang}
function register(entries){rows=[];var i,a;for(i=0;i<(entries||[]).length;i++){a=entries[i];if(a&&a.integration==='family-reels'&&validAge(a.age_group)&&validRole(a.reels_role))rows.push(a)}return rows}
function mergeCatalog(c){c=c||{apps:[]};if(c._reelsMerged)return c;register(c.external_apps||[]);c.apps=(c.apps||[]).concat(rows);c._reelsMerged=true;return c}
function find(id){var i;for(i=0;i<rows.length;i++)if(rows[i].id===id)return rows[i];return null}
function rootPath(){var p=w.location.pathname||'/',i=p.indexOf('/ages/');if(i>=0)return p.substring(0,i+1);i=p.indexOf('/reels/');if(i>=0)return p.substring(0,i+1);i=p.indexOf('/apps/');if(i>=0)return p.substring(0,i+1);return p.substring(0,p.lastIndexOf('/')+1)}
function appFromHref(h){try{var a=d.createElement('a');a.href=h;if(a.protocol!==w.location.protocol||a.host!==w.location.host||a.pathname!==rootPath()+'reels/index.html')return null;var age=query(a.search,'age'),role=query(a.search,'role');return validAge(age)&&validRole(role)?find('reels-'+role+'-'+age):null}catch(e){return null}}
function roleAllowed(age,role){var a=api(),s=a&&a.getSession?a.getSession():null,p=a&&a.getPolicy?a.getPolicy():null,id='reels-'+role+'-'+age;if(!s||s.role!=='guest'||s.adminRole==='assistant'||!p)return true;if(p.mode==='locked'&&p.selected)return p.selected===id;if(p.mode==='guided'&&p.allowed&&p.allowed.length)return p.allowed.indexOf(id)>=0;return true}
function coverHtml(a,img){if(!a||a.integration!=='family-reels')return img;var base=rootPath();return'<span class="reels-cover reels-cover-'+esc(a.reels_role)+'">'+img+'<img class="reels-cover-logo" src="'+base+'assets/brand/family-reels-360-logo.png" alt="شعار ريلز مدرسة العائلة 360"><span class="reels-cover-title">ريلز مدرسة العائلة<small>'+esc(a.reels_role==='coach'?'مدرب الفئة':'محتوى الفئة')+'</small></span><span class="reels-cover-age">الفئة <b dir="ltr">'+esc(a.age_group.replace('-', '–'))+'</b><small>العربية · English</small></span></span>'}
function openClick(e){var t=e.target||e.srcElement,n=t,h,a,s=api(),sh=w.APP360_FAMILY_SHELL,i;for(i=0;i<8&&n&&n!==d;i++,n=n.parentNode){if(n.getAttribute&&(h=n.getAttribute('href')))break}if(!h||!sh||!sh.openApp)return;a=appFromHref(h);if(!a)return;if(e.preventDefault)e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();if(s&&s.openApp)s.openApp(a.id);else sh.openApp(a.id);return false}
w.APP360_REELS={ages:AGES,validAge:validAge,validRole:validRole,validLanguage:validLanguage,buildUrl:buildUrl,query:query,preferredLanguage:preferredLanguage,setLanguage:setLanguage,profileKey:profileKey,rootPath:rootPath,roleAllowed:roleAllowed,register:register,mergeCatalog:mergeCatalog,find:find,appFromHref:appFromHref,coverHtml:coverHtml};
if(d.addEventListener)d.addEventListener('click',openClick,true);
})(window,document);
