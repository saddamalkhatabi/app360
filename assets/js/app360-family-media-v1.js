(function(w,d){
'use strict';
if(w.parent!==w){w.APP360_FAMILY_MEDIA={__ready:true,embedded:true,version:'3.0.0-iframe-disabled'};return}
if(w.APP360_FAMILY_MEDIA&&w.APP360_FAMILY_MEDIA.__ready&&String(w.APP360_FAMILY_MEDIA.version||'').indexOf('3.0.0')===0)return;
function root(){var p=(w.location&&w.location.pathname)||'/',i=p.indexOf('/apps/');if(i>=0)return p.substring(0,i+1);i=p.lastIndexOf('/');return i>=0?p.substring(0,i+1):'/'}
var base=w.location.protocol+'//'+w.location.host+root(),h=d.head||d.getElementsByTagName('head')[0]||d.body,started=false;
function core(){if(started)return;started=true;if(w.APP360_FAMILY_MEDIA&&w.APP360_FAMILY_MEDIA.__ready&&String(w.APP360_FAMILY_MEDIA.version||'').indexOf('3.0.0')===0)return;var s=d.createElement('script');s.src=base+'assets/js/app360-family-media-core-v3.js?v=3&brand=98';s.async=false;h.appendChild(s)}
function go(){var b=w.APP360_PEER_BOOTSTRAP;if(b&&b.ready){b.ready(function(){core()});setTimeout(core,11500)}else core()}
if(w.APP360_PEER_BOOTSTRAP){go();return}
var s=d.createElement('script'),done=false,t;s.src=base+'assets/js/app360-peer-bootstrap-v1.js?v=3';s.async=false;s.onload=function(){if(done)return;done=true;clearTimeout(t);go()};s.onerror=function(){if(done)return;done=true;clearTimeout(t);core()};t=setTimeout(function(){if(done)return;done=true;core()},3500);h.appendChild(s);
})(window,document);
