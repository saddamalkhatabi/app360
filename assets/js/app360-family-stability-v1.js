(function(w,d){
'use strict';
/* v1.1: Family session ownership is intentionally stable.
   Never restart/destroy Peer because effectiveType/type changed while apps load.
   PeerJS/Bootstrap owns transport recovery; this layer only restores UI/heartbeat. */
if(w.APP360_FAMILY_STABILITY&&w.APP360_FAMILY_STABILITY.__ready)return;
var VERSION='1.1.0',offlineSeen=false,onlineTimer=0,lastPulse=0;
function now(){return +new Date()}
function addCss(){if(d.getElementById('app360FamilyStabilityStyle'))return;var s=d.createElement('style');s.id='app360FamilyStabilityStyle';s.type='text/css';s.innerHTML='#app360FamilyPanel,#app360ProfilePanel{z-index:2147483550!important}.a360-family-toast{z-index:2147483640!important}';(d.head||d.getElementsByTagName('head')[0]||d.body).appendChild(s)}
function fire(name,detail){try{var ev=d.createEvent('CustomEvent');ev.initCustomEvent(name,true,false,detail||{});d.dispatchEvent(ev)}catch(e){}}
function pulse(reason){var t=now(),a;if(t-lastPulse<700)return;lastPulse=t;try{a=w.APP360_FAMILY_SYNC;if(a&&a.forceHeartbeat)a.forceHeartbeat(true)}catch(e){}fire('app360:family-network-pulse',{reason:reason||'pulse',at:t})}
function schedulePulse(reason,delay){if(onlineTimer)clearTimeout(onlineTimer);onlineTimer=setTimeout(function(){onlineTimer=0;pulse(reason)},typeof delay==='number'?delay:350)}
function bind(){if(!w.addEventListener)return;w.addEventListener('offline',function(){offlineSeen=true;fire('app360:family-network-offline',{at:now()})},false);w.addEventListener('online',function(){if(offlineSeen){offlineSeen=false;schedulePulse('online-after-offline',450)}else schedulePulse('online',450)},false);w.addEventListener('pageshow',function(e){if(e&&e.persisted)schedulePulse('pageshow-restore',250)},false);if(d.addEventListener)d.addEventListener('visibilitychange',function(){if(!d.hidden)schedulePulse('visible',220)},false)}
addCss();bind();
w.APP360_FAMILY_STABILITY={__ready:true,version:VERSION,pulse:function(){pulse('manual')},restart:function(){pulse('legacy-restart-request')},getPeerCount:function(){return 0}};
})(window,document);
