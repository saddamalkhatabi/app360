(function(w,d){
'use strict';
if(w.APP360_FAMILY_SYNC&&w.APP360_FAMILY_SYNC.__ready&&String(w.APP360_FAMILY_SYNC.version||'').indexOf('2.0.0')===0)return;
function root(){var p=(w.location&&w.location.pathname)||'/',i=p.indexOf('/apps/');if(i>=0)return p.substring(0,i+1);i=p.lastIndexOf('/');return i>=0?p.substring(0,i+1):'/'}
var base=w.location.protocol+'//'+w.location.host+root(),h=d.head||d.getElementsByTagName('head')[0]||d.body,started=false;
function core(){if(started)return;started=true;if(w.APP360_FAMILY_SYNC&&w.APP360_FAMILY_SYNC.__ready)return;var s=d.createElement('script');s.src=base+'assets/js/app360-family-core-v2.js?v=2';s.async=false;h.appendChild(s)}
function afterBootstrap(){var b=w.APP360_PEER_BOOTSTRAP;if(b&&b.ready){b.ready(function(){core()});setTimeout(core,11500)}else core()}
if(w.APP360_PEER_BOOTSTRAP){afterBootstrap();return}
var s=d.createElement('script'),done=false,t;s.src=base+'assets/js/app360-peer-bootstrap-v1.js?v=1';s.async=false;s.onload=function(){if(done)return;done=true;clearTimeout(t);afterBootstrap()};s.onerror=function(){if(done)return;done=true;clearTimeout(t);core()};t=setTimeout(function(){if(done)return;done=true;core()},3500);h.appendChild(s);
})(window,document);
