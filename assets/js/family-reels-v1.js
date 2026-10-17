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
function buildUrl(age,role,lang,filters){if(!validAge(age)||(!validRole(role)&&role!=='mixed')||!validLanguage(lang))return'';return'https://yem1.com/watch?age='+age+'&role='+role+'&lang='+lang+filterQuery(filters)}
function filterQuery(f){var s='',keys=['goals','sources','gender','format','order'],i,k,v;f=f||{};for(i=0;i<keys.length;i++){k=keys[i];v=f[k];if(Object.prototype.toString.call(v)==='[object Array]')v=v.length?v.join(','):'all';if(v!==undefined&&String(v).length<2000)s+='&'+k+'='+encodeURIComponent(v);}return s;}
function embeddedInReels(){return !!(w.APP360_INTEGRATION_CONTEXT&&w.APP360_INTEGRATION_CONTEXT.fromReels);}
function register(entries){rows=[];if(embeddedInReels())return rows;var i,a;for(i=0;i<(entries||[]).length;i++){a=entries[i];if(a&&a.integration==='family-reels'&&validAge(a.age_group)&&validRole(a.reels_role))rows.push(a)}return rows}
function mergeCatalog(c){c=c||{apps:[]};if(embeddedInReels()){c.apps=(c.apps||[]).filter(function(a){return a.integration!=='family-reels';});c.external_apps=(c.external_apps||[]).filter(function(a){return a.integration!=='family-reels';});return c;}if(c._reelsMerged)return c;register(c.external_apps||[]);c.apps=(c.apps||[]).concat(rows);c._reelsMerged=true;return c}
function find(id){var i;for(i=0;i<rows.length;i++)if(rows[i].id===id)return rows[i];return null}
function rootPath(){var p=w.location.pathname||'/',i=p.indexOf('/ages/');if(i>=0)return p.substring(0,i+1);i=p.indexOf('/reels/');if(i>=0)return p.substring(0,i+1);i=p.indexOf('/apps/');if(i>=0)return p.substring(0,i+1);return p.substring(0,p.lastIndexOf('/')+1)}
function appFromHref(h){try{var a=d.createElement('a');a.href=h;if(a.protocol!==w.location.protocol||a.host!==w.location.host||a.pathname!==rootPath()+'reels/index.html')return null;var age=query(a.search,'age'),role=query(a.search,'role');return validAge(age)&&validRole(role)?(find('reels-'+role+'-'+age)||{id:'reels-'+role+'-'+age,age_group:age,reels_role:role,integration:'family-reels'}):null}catch(e){return null}}
function roleAllowed(age,role){var a=api(),s=a&&a.getSession?a.getSession():null,p=a&&a.getPolicy?a.getPolicy():null,id='reels-'+role+'-'+age;if(!s||s.role!=='guest'||s.adminRole==='assistant'||!p)return true;if(p.mode==='locked'&&p.selected)return p.selected===id;if(p.mode==='guided'&&p.allowed&&p.allowed.length)return p.allowed.indexOf(id)>=0;return true}
function coverHtml(a,img){if(!a||a.integration!=='family-reels')return img;var base=rootPath();return'<span class="reels-cover reels-cover-'+esc(a.reels_role)+'">'+img+'<img class="reels-cover-logo" src="'+base+'assets/brand/family-reels-360-logo-160.png" alt="شعار ريلز مدرسة العائلة 360"><span class="reels-cover-title">ريلز مدرسة العائلة<small>'+esc(a.reels_role==='coach'?'مدرب الفئة':'محتوى الفئة')+'</small></span><span class="reels-cover-age">الفئة <b dir="ltr">'+esc(a.age_group.replace('-', '–'))+'</b><small>العربية · English</small></span></span>'}
function legacyDevice(){var m=/Android\s+([0-9]+)/i.exec((w.navigator&&w.navigator.userAgent)||'');return !!(m&&+m[1]<6)||w.APP360_LEGACY===true}
function linkApp(target){var n=target,h,i;for(i=0;i<12&&n&&n!==d;i++,n=n.parentNode)if(n.getAttribute&&(h=n.getAttribute('href')))return appFromHref(h);return null}
function launch(a,f){if(embeddedInReels())return false;if(!a)return false;if(!roleAllowed(a.age_group,a.reels_role))return false;f=f||{};f.age=a.age_group;f.role=a.reels_role;f.autoplay=true;var url=rootPath()+'reels/index.html?age='+f.age+'&role='+f.role+'&autoplay=1'+(legacyDevice()?'&legacy=1':'');if(validLanguage(f.lang))url+='&lang='+f.lang;url+=filterQuery(f);
 // A native same-tab destination works without catalog registration or popup permission.
 try{if(w.APP360_REELS_WORKSPACE&&w.APP360_REELS_WORKSPACE.open(f)!==false)return true}catch(e){}w.location.href=url;return true}
var lastTap=0,swipeUntil=0,touch=null;
function openClick(e){var a=linkApp(e.target||e.srcElement);if(!a)return;if(e.ctrlKey||e.metaKey||e.shiftKey||e.altKey)return;if(e.preventDefault)e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();if(+new Date()-lastTap<850||+new Date()<swipeUntil)return false;if(w.APP360_COVER_GESTURE&&w.APP360_COVER_GESTURE.shouldSuppress(e.target||e.srcElement))return false;launch(a,w.APP360_REELS_LAUNCH_FILTERS);w.APP360_REELS_LAUNCH_FILTERS=null;return false}
function touchStart(e){var a=linkApp(e.target||e.srcElement),t=e.touches&&e.touches[0];touch=a&&t?{app:a,x:t.clientX,y:t.clientY,time:+new Date(),moved:false}:null}
function touchMove(e){var t=e.touches&&e.touches[0];if(touch&&t&&(Math.abs(t.clientX-touch.x)>18||Math.abs(t.clientY-touch.y)>18))touch.moved=true}
function touchEnd(e){var st=touch;touch=null;if(!st)return;if(st.moved){swipeUntil=+new Date()+850;return}if(+new Date()-st.time>1200)return;var t=e.changedTouches&&e.changedTouches[0];if(t&&(Math.abs(t.clientX-st.x)>18||Math.abs(t.clientY-st.y)>18))return;if(e.preventDefault)e.preventDefault();lastTap=+new Date();launch(st.app,w.APP360_REELS_LAUNCH_FILTERS);w.APP360_REELS_LAUNCH_FILTERS=null}
w.APP360_REELS={isLegacy:legacyDevice,launch:launch,ages:AGES,validAge:validAge,validRole:validRole,validLanguage:validLanguage,buildUrl:buildUrl,filterQuery:filterQuery,query:query,preferredLanguage:preferredLanguage,setLanguage:setLanguage,profileKey:profileKey,rootPath:rootPath,roleAllowed:roleAllowed,register:register,mergeCatalog:mergeCatalog,find:find,appFromHref:appFromHref,coverHtml:coverHtml};
if(d.addEventListener){d.addEventListener('click',openClick,true);d.addEventListener('touchstart',touchStart,true);d.addEventListener('touchmove',touchMove,true);d.addEventListener('touchend',touchEnd,true);d.addEventListener('touchcancel',function(){touch=null},true);}
if(!w.APP360_REELS_WORKSPACE){var script=d.createElement('script');script.src=rootPath()+'assets/js/reels-workspace-v1.js?v=360';script.async=false;(d.head||d.body).appendChild(script);}
var familyScript=d.createElement('script');familyScript.src=rootPath()+'assets/js/reels-family-filters-v1.js?v=350';familyScript.async=false;(d.head||d.body).appendChild(familyScript);
})(window,document);
