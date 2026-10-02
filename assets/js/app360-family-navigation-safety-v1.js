(function(w,d){
'use strict';
if(w.APP360_FAMILY_NAV_SAFETY&&w.APP360_FAMILY_NAV_SAFETY.__ready)return;
var VERSION='1.0.2',timer=0,lastFixKey='',lastFixAt=0,fixCount=0;
function rootBase(){var p=w.location.pathname||'/',i=p.lastIndexOf('/');return w.location.protocol+'//'+w.location.host+(i>=0?p.substring(0,i+1):'/')}
function shell(){return w.APP360_FAMILY_SHELL||null}
function sync(){return w.APP360_FAMILY_SYNC||null}
function session(){var a=sync();try{return a&&a.getSession?a.getSession():null}catch(e){return null}}
function ensureDrawingVersion(a){var h;if(!a)return;h=String(a.href||'');if(h.indexOf('drawing-writing-foundations/')<0)return;if(/[?&]v=24(?:&|$)/.test(h))return;a.href=h+(h.indexOf('?')>=0?'&':'?')+'v=24'}
function normalizeApps(){var a=sync(),list=a&&a.apps||[],i;for(i=0;i<list.length;i++)ensureDrawingVersion(list[i])}
function buildUrl(a){var s=session(),h=String(a&&a.href||''),sep;if(!h)return'';ensureDrawingVersion(a);h=String(a.href||h);sep=h.indexOf('?')>=0?'&':'?';return rootBase()+h.replace(/^\//,'')+sep+'family_embedded=1&family_room='+encodeURIComponent(s&&s.room||'')+'&family_shell=1&_a360safe='+(+new Date())}
function installOpenGuard(){var sh=shell(),old;if(!sh||!sh.openApp||sh._a360NavSafeWrapped)return;old=sh.openApp;sh.openApp=function(id,approved){normalizeApps();return old.call(sh,id,approved)};sh._a360NavSafeWrapped=true}
function sameRootIndex(loc){var rb=rootBase(),a=d.createElement('a');try{a.href=rb+'index.html';return loc.protocol===a.protocol&&loc.host===a.host&&loc.pathname===a.pathname}catch(e){return false}}
function drawingNeedsV24(loc,a){if(!loc||!a)return false;var p=String(loc.pathname||''),q=String(loc.search||'');return (a.slug==='drawing-writing-foundations'||p.indexOf('/drawing-writing-foundations/')>=0)&&!/[?&]v=24(?:&|$)/.test(q)}
function shouldRestore(loc,a){if(!loc||!a)return false;var p=String(loc.pathname||''),q=String(loc.search||'');if(sameRootIndex(loc))return true;if(drawingNeedsV24(loc,a))return true;if(p.indexOf('/apps/')>=0&&q.indexOf('family_embedded=1')<0)return true;if(a.slug&&p.indexOf('/'+a.slug+'/')<0&&p.indexOf('/apps/')>=0)return false;return false}
function restore(frame,a){var u=buildUrl(a),key=String(a.id||'')+'|'+u.replace(/&_a360safe=\d+/,'');if(!u)return;var t=+new Date();if(key===lastFixKey&&t-lastFixAt<5000){fixCount++;if(fixCount>3)return}else{lastFixKey=key;lastFixAt=t;fixCount=1}try{frame.contentWindow.location.replace(u)}catch(e){try{frame.src=u}catch(x){}}}
function check(){installOpenGuard();normalizeApps();var sh=shell(),frame,a,loc;if(!sh||!sh.getActiveApp||!sh.getFrame)return;try{a=sh.getActiveApp();frame=sh.getFrame()}catch(e){return}if(!a||!frame)return;ensureDrawingVersion(a);try{loc=frame.contentWindow&&frame.contentWindow.location}catch(e2){return}if(!loc)return;if(String(loc.href||'')==='about:blank')return;if(shouldRestore(loc,a))restore(frame,a)}
function boot(){check();if(timer)clearInterval(timer);timer=setInterval(check,120)}
w.APP360_FAMILY_NAV_SAFETY={__ready:true,version:VERSION,refresh:check};
if(d.readyState==='loading'){if(d.addEventListener)d.addEventListener('DOMContentLoaded',boot,false);else if(w.attachEvent)w.attachEvent('onload',boot)}else boot();
})(window,document);
