(function(w,d){
'use strict';
if(w.APP360_PEER_BOOTSTRAP&&w.APP360_PEER_BOOTSTRAP.__ready)return;
var VERSION='1.0.0-media-only',ready=false,loading=false,failed=false,waiters=[],state='idle',attempt=0;
var CDN=['https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js','https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.5/peerjs.min.js','https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js'];
function emit(s,detail){state=s;try{d.documentElement.setAttribute('data-a360-peer-state',s)}catch(e){}try{var ev=d.createEvent('CustomEvent');ev.initCustomEvent('app360:peer-state',true,false,{state:s,detail:detail||'',attempt:attempt});d.dispatchEvent(ev)}catch(e2){}}
function hybrid(){return w.APP360_FAMILY_HYBRID_TRANSPORT||null}
function addPreconnect(h){try{var l=d.createElement('link');l.rel='preconnect';l.href=h;l.crossOrigin='anonymous';(d.head||d.getElementsByTagName('head')[0]||d.body).appendChild(l)}catch(e){}}
function currentMedia(){var h=hybrid();if(h&&h.isInstalled&&h.isInstalled()&&h.getMediaPeer)return h.getMediaPeer();if(w.Peer&&!w.Peer.__a360Hybrid)return w.Peer;return null}
function finish(ok,ctor){var h=hybrid(),a=waiters.slice(0),i;waiters=[];ready=!!ok;failed=!ok;loading=false;if(ok&&ctor){if(h&&h.isInstalled&&h.isInstalled()&&h.setMediaPeer)h.setMediaPeer(ctor);else w.Peer=ctor}emit(ok?'library-ready':'library-failed');for(i=0;i<a.length;i++)try{a[i](ok)}catch(e){}}
function loadAt(i){var existing=currentMedia();if(existing){finish(true,existing);return}if(i>=CDN.length){finish(false,null);return}attempt=i+1;emit('library-loading',String(i+1));var before=w.Peer,s=d.createElement('script'),done=false,t;s.type='text/javascript';s.async=true;s.src=CDN[i];function end(ok){var candidate;if(done)return;done=true;clearTimeout(t);s.onload=s.onerror=null;candidate=w.Peer;if(ok&&candidate&&candidate!==before&&!candidate.__a360Hybrid){finish(true,candidate);return}if(ok&&candidate&&!candidate.__a360Hybrid){finish(true,candidate);return}if(before&&before.__a360Hybrid)w.Peer=before;loadAt(i+1)}s.onload=function(){end(true)};s.onerror=function(){if(before&&before.__a360Hybrid)w.Peer=before;end(false)};t=setTimeout(function(){if(before&&before.__a360Hybrid)w.Peer=before;end(false)},3500);(d.head||d.getElementsByTagName('head')[0]||d.body).appendChild(s)}
function start(){if(ready||loading)return;if(w.navigator&&w.navigator.onLine===false){finish(false,null);return;}loading=true;failed=false;addPreconnect('https://0.peerjs.com');addPreconnect('https://cdn.jsdelivr.net');emit('library-start');var p=currentMedia();if(p){finish(true,p);return}loadAt(0)}
function whenReady(cb){if(ready&&currentMedia()){cb(true);return}waiters.push(cb);if(!loading)start()}
w.APP360_PEER_BOOTSTRAP={__ready:true,version:VERSION,ready:whenReady,start:start,getState:function(){return state},isLoaded:function(){return ready&&!!currentMedia()},getMediaPeer:currentMedia};
/* Load PeerJS when voice/video calls ready() or start(), rather than on every application visit. */
})(window,document);
