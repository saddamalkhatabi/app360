(function(w,d){
'use strict';
if(w.APP360_FAMILY_SYNC&&w.APP360_FAMILY_SYNC.__ready&&String(w.APP360_FAMILY_SYNC.version||'').indexOf('2.0.0')===0)return;
function qv(k){var m=String(w.location.search||'').match(new RegExp('[?&]'+k+'=([^&]*)','i'));return m?decodeURIComponent(m[1]||''):''}
function parentApi(){try{return w.parent&&w.parent!==w&&w.parent.APP360_FAMILY_SYNC||null}catch(e){return null}}
function installProxy(){var pa=parentApi();if(!pa||!pa.__ready)return false;w.APP360_FAMILY_SYNC={__ready:true,embedded:true,version:'2.0.0-iframe-proxy',apps:pa.apps||[],getName:function(){var a=parentApi();return a&&a.getName?a.getName():''},getAgeGroup:function(){var a=parentApi();return a&&a.getAgeGroup?a.getAgeGroup():''},getAgeGroups:function(){var a=parentApi();return a&&a.getAgeGroups?a.getAgeGroups():[]},getProfileKey:function(){var a=parentApi();return a&&a.getProfileKey?a.getProfileKey():''},setName:function(n){var a=parentApi();if(a&&a.setName)a.setName(n)},open:function(){var a=parentApi();if(a&&a.open)a.open()},openProfile:function(){var a=parentApi();if(a&&a.openProfile)a.openProfile()},getPolicy:function(){var a=parentApi();return a&&a.getPolicy?a.getPolicy():{}},getGlobalPolicy:function(){var a=parentApi();return a&&a.getGlobalPolicy?a.getGlobalPolicy():{}},getSession:function(){var a=parentApi();return a&&a.getSession?a.getSession():{role:'embedded',room:qv('family_room'),connected:true}},getParticipants:function(){var a=parentApi();return a&&a.getParticipants?a.getParticipants():{}},getDeviceId:function(){var a=parentApi();return a&&a.getDeviceId?a.getDeviceId():''},forceHeartbeat:function(){var a=parentApi();if(a&&a.forceHeartbeat)a.forceHeartbeat(true)}};return true}
if(w.parent!==w){if(installProxy())return;var n=0,pt=setInterval(function(){n++;if(installProxy()||n>160)clearInterval(pt)},50);return}
function root(){var p=(w.location&&w.location.pathname)||'/',i=p.indexOf('/apps/');if(i>=0)return p.substring(0,i+1);i=p.lastIndexOf('/');return i>=0?p.substring(0,i+1):'/'}
var base=w.location.protocol+'//'+w.location.host+root(),h=d.head||d.getElementsByTagName('head')[0]||d.body,started=false;
function core(){if(started)return;started=true;if(w.APP360_FAMILY_SYNC&&w.APP360_FAMILY_SYNC.__ready)return;var s=d.createElement('script');s.src=base+'assets/js/app360-family-core-v2.js?v=97&brand=97';s.async=false;h.appendChild(s)}
function wsPrimary(){var x=w.APP360_FAMILY_HYBRID_TRANSPORT;try{return !!(x&&x.isInstalled&&x.isInstalled())}catch(e){return false}}
function afterBootstrap(){if(wsPrimary()){core();return}var b=w.APP360_PEER_BOOTSTRAP;if(b&&b.ready){b.ready(function(ok){if(ok)core()});setTimeout(core,11500)}else core()}
if(wsPrimary()){core();return}
if(w.APP360_PEER_BOOTSTRAP){afterBootstrap();return}
var s=d.createElement('script'),done=false,t;s.src=base+'assets/js/app360-peer-media-bootstrap-v1.js?v=1';s.async=false;s.onload=function(){if(done)return;done=true;clearTimeout(t);afterBootstrap()};s.onerror=function(){if(done)return;done=true;clearTimeout(t);core()};t=setTimeout(function(){if(done)return;done=true;core()},3500);h.appendChild(s);
})(window,document);
