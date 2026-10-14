(function(w,d){
'use strict';
var api=w.APP360_REELS,age=api.query(w.location.search,'age'),role=api.query(w.location.search,'role'),lang=api.query(w.location.search,'lang'),popup=null,poll=0,launching=false,embedded=false,valid=api.validAge(age)&&api.validRole(role);
var internalDefault=w.location.protocol==='https:'&&/^(family-relay-production\.up\.railway\.app|app\.yem1\.com|apps\.yem1\.com|yem1\.com)$/.test(w.location.hostname);
function $(id){return d.getElementById(id)}
function status(s){$('reelsStatus').textContent=s}
function popupOpen(){try{return !!(popup&&!popup.closed)}catch(e){return false}}
function closePopup(){try{if(popupOpen())popup.close()}catch(e){}popup=null;if(poll){clearInterval(poll);poll=0}$('reelsCloseTab').hidden=true}
function update(){if(!valid)return;role=$('reelsRole').value;var url=api.buildUrl(age,role,lang),bs=d.querySelectorAll('[data-reels-lang]'),i;$('reelsOpen').href=url;$('reelsFallback').href=url;$('reelsTitle').textContent=role==='coach'?'ريلز مدرب الفئة':'ريلز محتوى الفئة';var artwork=$('reelsArtwork'),fallback='../assets/covers/family-reels-'+role+'-art-640.jpg';artwork.onerror=function(){this.onerror=null;this.src=fallback};artwork.src='../assets/covers/family-reels-'+role+'-art-640.webp';for(i=0;i<bs.length;i++){bs[i].className=bs[i].getAttribute('data-reels-lang')===lang?'on':'';bs[i].setAttribute('aria-pressed',bs[i].getAttribute('data-reels-lang')===lang?'true':'false')}if(embedded)$('reelsFrame').src=url;if(popupOpen())status('تغير اختيارك. اضغط «فتح الريلز» لتطبيقه في التبويب المستقل.');else if(w.navigator.onLine===false)status('أنت غير متصل الآن. سيحتاج الريلز اتصالًا بالإنترنت.');else status(internalDefault?'يفتح الريلز داخل المدرسة. يمكنك إغلاقه والعودة من الزر العلوي.':'يفتح في نافذة أو تبويب مستقل، وتبقى المدرسة محفوظة خلفه.')}
function session(){try{return w.APP360_SESSION||(w.parent!==w&&w.parent.APP360_SESSION)||null}catch(e){return null}}
function linked(){var s=session(),p=s&&s.getProfile?s.getProfile():null;return p&&p.external&&s.bridgeRequest?s:null}
function openExternal(e){
 if(!valid)return;if(e&&e.preventDefault)e.preventDefault();launching=true;
 try{if(popupOpen())popup.focus();else{popup=w.open('about:blank','family_school_reels');}}catch(err){popup=null;}
 if(!popup){launching=false;status('اسمح بفتح نافذة الريلز ثم حاول مجدداً.');return false;}
 function openUrl(url){if(!popupOpen())return;popup.location.replace(url);try{popup.opener=null;}catch(_){}popup.focus();launching=false;$('reelsCloseTab').hidden=false;status('الريلز مفتوح في تبويب مستقل؛ يبقى حساب الطفل نفسه عند الربط.');if(poll)clearInterval(poll);poll=setInterval(function(){if(!popupOpen()){closePopup();status('عدت من الريلز.');}},650);}
 var s=linked();if(s){openUrl(api.rootPath()+'reels-return.html?lang='+lang);return false;}openUrl(api.buildUrl(age,role,lang));return false;
}

function goHome(){closePopup();$('reelsFrame').src='about:blank';try{var sh=w.parent!==w&&w.parent.APP360_FAMILY_SHELL;if(sh&&sh.closeApp){sh.closeApp();return}}catch(e){}w.location.href='../index.html'}
function showSettings(){embedded=false;$('reelsFrame').src='about:blank';$('reelsViewer').hidden=true;$('reelsIntro').hidden=false;update()}
function showEmbedded(e){if(linked())return openExternal(e);if(e&&e.preventDefault)e.preventDefault();if(!valid)return;closePopup();embedded=true;$('reelsIntro').hidden=true;$('reelsViewer').hidden=false;$('reelsFrame').src=api.buildUrl(age,role,lang);return false}
if(!api.validLanguage(lang))lang=api.preferredLanguage();else api.setLanguage(lang);
$('reelsHome').onclick=goHome;$('reelsCloseTab').onclick=function(){closePopup();status('أُغلق تبويب الريلز. يمكنك العودة إلى الرئيسية.')};$('reelsSettings').onclick=showSettings;
if(!valid){$('reelsTitle').textContent='اختر الريلز من فئتك العمرية';status('هذا الرابط لا يحدد فئة ومحتوى صالحين. ارجع إلى المدرسة واختر بطاقة الريلز.');$('reelsOpen').removeAttribute('href');$('reelsOpen').removeAttribute('target');$('reelsOpen').setAttribute('aria-disabled','true');$('reelsEmbed').disabled=true;$('reelsRole').disabled=true;return}
$('reelsAge').innerHTML='الفئة <b dir="ltr">'+age.replace('-','–')+'</b>';$('reelsRole').value=role;$('reelsRole').onchange=function(){var next=this.value;if(!api.roleAllowed(age,next)){this.value=role;status('المرافق اختار محتوى آخر لهذه الجلسة.');return}update()};
var buttons=d.querySelectorAll('[data-reels-lang]'),i;for(i=0;i<buttons.length;i++)buttons[i].onclick=function(){lang=this.getAttribute('data-reels-lang');api.setLanguage(lang);update()};
$('reelsOpen').onclick=internalDefault?showEmbedded:openExternal;$('reelsFallback').onclick=openExternal;$('reelsEmbed').onclick=internalDefault?openExternal:showEmbedded;
if(internalDefault){$('reelsOpen').removeAttribute('target');$('reelsEmbed').textContent='فتح مستقل'}
w.addEventListener('pagehide',function(){if(!launching)closePopup()});w.addEventListener('online',update);w.addEventListener('offline',update);w.addEventListener('keydown',function(e){if(e.key==='Escape'||e.keyCode===27)goHome()});
update();
})(window,document);
