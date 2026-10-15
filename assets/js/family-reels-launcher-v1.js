(function(w,d){
'use strict';
var api=w.APP360_REELS,age=api.query(w.location.search,'age'),role=api.query(w.location.search,'role'),lang=api.query(w.location.search,'lang'),popup=null,poll=0,launching=false,embedded=false,valid=api.validAge(age)&&api.validRole(role);
var internalDefault=w.location.protocol==='https:'&&/^((?:[a-z0-9-]+\.)*yem1\.com|family-relay-production\.up\.railway\.app)$/.test(w.location.hostname);
function $(id){return d.getElementById(id)}
function status(s){$('reelsStatus').textContent=s}
function popupOpen(){try{return !!(popup&&!popup.closed)}catch(e){return false}}
function closePopup(){try{if(popupOpen())popup.close()}catch(e){}popup=null;if(poll){clearInterval(poll);poll=0}$('reelsCloseTab').hidden=true}
function filters(){return {goals:$('reelsGoal').value?[$('reelsGoal').value]:[],format:$('reelsFormat').value};}
var goalSeq=0;function loadGoals(){var n=++goalSeq,x=new XMLHttpRequest();$('reelsGoal').innerHTML='<option value="">كل أهداف الفئة</option>';x.open('GET',api.rootPath()+'api/reels/catalog?age='+age+'&role='+$('reelsRole').value+'&lang='+lang,true);x.timeout=10000;x.onload=function(){if(n!==goalSeq)return;try{var body=JSON.parse(x.responseText);if(x.status!==200)throw Error();for(var i=0;i<body.goals.length;i++){var o=d.createElement('option');o.value=body.goals[i].id;o.textContent=body.goals[i].title;$('reelsGoal').appendChild(o);}}catch(_){status('تعذر تحميل الأهداف؛ يمكنك فتح كل الأهداف أو إعادة المحاولة.');}};x.onerror=x.ontimeout=function(){};x.send();}
function update(){if(!valid)return;role=$('reelsRole').value;var url=api.buildUrl(age,role,lang,filters()),bs=d.querySelectorAll('[data-reels-lang]'),i;$('reelsOpen').href=url;$('reelsFallback').href=url;$('reelsTitle').textContent=role==='coach'?'ريلز مدرب الفئة':'ريلز محتوى الفئة';var artwork=$('reelsArtwork'),fallback='../assets/covers/family-reels-'+role+'-art-640.jpg';artwork.onerror=function(){this.onerror=null;this.src=fallback};artwork.src='../assets/covers/family-reels-'+role+'-art-640.webp';for(i=0;i<bs.length;i++){bs[i].className=bs[i].getAttribute('data-reels-lang')===lang?'on':'';bs[i].setAttribute('aria-pressed',bs[i].getAttribute('data-reels-lang')===lang?'true':'false')}if(embedded){try{var manager=(w.parent!==w&&w.parent.APP360_REELS_WORKSPACE)||w.APP360_REELS_WORKSPACE;if(manager)manager.apply({age:age,role:role,lang:lang,goals:filters().goals,format:filters().format});}catch(_){}}if(popupOpen())status('تغير اختيارك. اضغط «فتح الريلز» لتطبيقه في التبويب المستقل.');else if(w.navigator.onLine===false)status('أنت غير متصل الآن. سيحتاج الريلز اتصالًا بالإنترنت.');else status(internalDefault?'يفتح الريلز داخل المدرسة. يمكنك إغلاقه والعودة من الزر العلوي.':'يفتح في نافذة أو تبويب مستقل، وتبقى المدرسة محفوظة خلفه.')}
function session(){try{return w.APP360_SESSION||(w.parent!==w&&w.parent.APP360_SESSION)||null}catch(e){return null}}
function linked(){var s=session(),p=s&&s.getProfile?s.getProfile():null;return p&&p.external&&s.bridgeRequest?s:null}
function openExternal(e){
 if(!valid)return;if(e&&e.preventDefault)e.preventDefault();launching=true;
 try{if(popupOpen())popup.focus();else{popup=w.open('about:blank','family_school_reels');}}catch(err){popup=null;}
 if(!popup){launching=false;status('اسمح بفتح نافذة الريلز ثم حاول مجدداً.');return false;}
 function openUrl(url){if(!popupOpen())return;popup.location.replace(url);try{popup.opener=null;}catch(_){}popup.focus();launching=false;$('reelsCloseTab').hidden=false;status('الريلز مفتوح في تبويب مستقل؛ يبقى حساب الطفل نفسه عند الربط.');if(poll)clearInterval(poll);poll=setInterval(function(){if(!popupOpen()){closePopup();status('عدت من الريلز.');}},650);}
 var s=linked();if(s){openUrl(api.rootPath()+'reels-return.html?viewer=1&age='+age+'&role='+role+'&lang='+lang+api.filterQuery(filters()));return false;}openUrl(api.buildUrl(age,role,lang,filters()));return false;
}

function goHome(){closePopup();$('reelsFrame').src='about:blank';try{var sh=w.parent!==w&&w.parent.APP360_FAMILY_SHELL;if(sh&&sh.closeApp){sh.closeApp();return}}catch(e){}w.location.href='../index.html'}
function showSettings(){embedded=false;$('reelsFrame').src='about:blank';$('reelsViewer').hidden=true;$('reelsIntro').hidden=false;update()}
function showEmbedded(e){if(e&&e.preventDefault)e.preventDefault();if(!valid)return false;var manager=null;try{manager=(w.parent!==w&&w.parent.APP360_REELS_WORKSPACE)||w.APP360_REELS_WORKSPACE;}catch(_){}if(!manager){status('جارٍ تجهيز نافذة الريلز…');setTimeout(function(){showEmbedded(null);},300);return false;}embedded=true;var f=filters();f.age=age;f.role=role;f.lang=lang;manager.open(f);status('الريلز في نافذة مستقلة داخل المدرسة. يمكنك تحريكها وتغيير حجمها أو تصغيرها.');return false;}
if(!api.validLanguage(lang))lang=api.preferredLanguage();else api.setLanguage(lang);
$('reelsHome').onclick=goHome;$('reelsCloseTab').onclick=function(){closePopup();status('أُغلق تبويب الريلز. يمكنك العودة إلى الرئيسية.')};$('reelsSettings').onclick=showSettings;
if(!valid){$('reelsTitle').textContent='اختر الريلز من فئتك العمرية';status('هذا الرابط لا يحدد فئة ومحتوى صالحين. ارجع إلى المدرسة واختر بطاقة الريلز.');$('reelsOpen').removeAttribute('href');$('reelsOpen').removeAttribute('target');$('reelsOpen').setAttribute('aria-disabled','true');$('reelsEmbed').disabled=true;$('reelsRole').disabled=true;return}
$('reelsAge').innerHTML='الفئة <b dir="ltr">'+age.replace('-','–')+'</b>';$('reelsRole').value=role;$('reelsRole').onchange=function(){var next=this.value;if(!api.roleAllowed(age,next)){this.value=role;status('المرافق اختار محتوى آخر لهذه الجلسة.');return}loadGoals();update()};
$('reelsGoal').onchange=update;$('reelsFormat').onchange=update;
var buttons=d.querySelectorAll('[data-reels-lang]'),i;for(i=0;i<buttons.length;i++)buttons[i].onclick=function(){lang=this.getAttribute('data-reels-lang');api.setLanguage(lang);loadGoals();update()};
$('reelsOpen').onclick=internalDefault?showEmbedded:openExternal;$('reelsFallback').onclick=openExternal;$('reelsEmbed').onclick=internalDefault?openExternal:showEmbedded;
if(internalDefault){$('reelsOpen').removeAttribute('target');$('reelsEmbed').textContent='فتح مستقل'}
w.addEventListener('pagehide',function(){if(!launching)closePopup()});w.addEventListener('online',update);w.addEventListener('offline',update);w.addEventListener('keydown',function(e){if(e.key==='Escape'||e.keyCode===27)goHome()});
loadGoals();update();
})(window,document);
