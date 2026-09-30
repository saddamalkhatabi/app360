(function(w,d){
'use strict';
if(w.APP360_PEER_BOOTSTRAP&&w.APP360_PEER_BOOTSTRAP.__ready)return;
var VERSION='1.0.0',ready=false,loading=false,failed=false,waiters=[],state='idle',attempt=0;
var CDN=[
 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.5/peerjs.min.js',
 'https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js'
];
function emit(s,detail){state=s;try{d.documentElement.setAttribute('data-a360-peer-state',s)}catch(e){}try{var ev=d.createEvent('CustomEvent');ev.initCustomEvent('app360:peer-state',true,false,{state:s,detail:detail||'',attempt:attempt});d.dispatchEvent(ev)}catch(e2){}}
function addPreconnect(h){try{var l=d.createElement('link');l.rel='preconnect';l.href=h;l.crossOrigin='anonymous';(d.head||d.getElementsByTagName('head')[0]||d.body).appendChild(l)}catch(e){}}
function finish(ok){var a=waiters.slice(0),i;waiters=[];ready=!!ok;failed=!ok;loading=false;emit(ok?'library-ready':'library-failed');for(i=0;i<a.length;i++)try{a[i](ok)}catch(e){}}
function wrapPeer(){var Real=w.Peer;if(!Real||Real.__a360Robust)return !!Real;
 function RobustPeer(id,opts){
  var self=this;self._idArg=id;self._opts=opts||{};self._listeners={};self._inner=null;self._closed=false;self._opening=false;self._openTimer=0;self._retryTimer=0;self._tries=0;self.id=undefined;self.destroyed=false;self.disconnected=false;
  self._start();
 }
 RobustPeer.prototype.on=function(ev,fn){if(!this._listeners[ev])this._listeners[ev]=[];this._listeners[ev].push(fn);return this};
 RobustPeer.prototype._emit=function(ev,arg){var a=this._listeners[ev]||[],i;for(i=0;i<a.length;i++)try{a[i](arg)}catch(e){}};
 RobustPeer.prototype._clearTimers=function(){if(this._openTimer){clearTimeout(this._openTimer);this._openTimer=0}if(this._retryTimer){clearTimeout(this._retryTimer);this._retryTimer=0}};
 RobustPeer.prototype._transient=function(err){var t=err&&err.type||'';return t==='network'||t==='server-error'||t==='socket-error'||t==='socket-closed'||t==='disconnected'||t==='connection-timeout'||!t};
 RobustPeer.prototype._schedule=function(reason){var self=this;if(self._closed)return;self._clearTimers();self._tries++;attempt=self._tries;emit('signal-retry',reason||'');var delay=Math.min(900+self._tries*450,3200);self._retryTimer=setTimeout(function(){self._start()},delay)};
 RobustPeer.prototype._start=function(){var self=this,p;if(self._closed||self._opening)return;self._opening=true;self._clearTimers();emit(self._tries?'signal-retrying':'signal-connecting');try{p=(self._idArg!==undefined&&self._idArg!==null)?new Real(self._idArg,self._opts):new Real(undefined,self._opts)}catch(e){self._opening=false;self._schedule('constructor');return}self._inner=p;
  p.on('open',function(id){if(self._closed)return;self._opening=false;self._clearTimers();self._tries=0;attempt=0;self.id=id;self.destroyed=false;self.disconnected=false;emit('signal-open');self._emit('open',id)});
  p.on('connection',function(c){self._emit('connection',c)});
  p.on('call',function(c){self._emit('call',c)});
  p.on('disconnected',function(){self.disconnected=true;emit('signal-disconnected');try{if(p.reconnect)p.reconnect()}catch(e){}self._emit('disconnected')});
  p.on('close',function(){self.destroyed=true;if(!self._closed&&self._opening){self._opening=false;self._schedule('closed-before-open');return}self._emit('close')});
  p.on('error',function(err){if(self._closed)return;if(self._opening&&self._transient(err)&&self._tries<3){self._opening=false;try{p.destroy()}catch(e){}self._schedule(err&&err.type||'network');return}self._opening=false;self._clearTimers();emit('signal-error',err&&err.type||'');self._emit('error',err)});
  self._openTimer=setTimeout(function(){if(self._closed||!self._opening)return;self._opening=false;try{p.destroy()}catch(e){}if(self._tries<3)self._schedule('timeout');else{emit('signal-timeout');self._emit('error',{type:'connection-timeout',message:'PeerServer open timeout'})}},7000);
 };
 RobustPeer.prototype.connect=function(id,opts){var c=this._inner&&this._inner.connect?this._inner.connect(id,opts):null,t;if(!c)return c;t=setTimeout(function(){if(!c.open){try{c.close()}catch(e){}try{if(c.emit)c.emit('error',{type:'connection-timeout',message:'Data channel open timeout'})}catch(e2){}}},10000);try{c.on('open',function(){clearTimeout(t);emit('data-open')});c.on('close',function(){clearTimeout(t)})}catch(e3){}return c};
 RobustPeer.prototype.call=function(id,stream,opts){return this._inner&&this._inner.call?this._inner.call(id,stream,opts):null};
 RobustPeer.prototype.reconnect=function(){try{if(this._inner&&this._inner.reconnect)this._inner.reconnect()}catch(e){this._schedule('manual-reconnect')}return this};
 RobustPeer.prototype.disconnect=function(){try{if(this._inner&&this._inner.disconnect)this._inner.disconnect()}catch(e){}this.disconnected=true;return this};
 RobustPeer.prototype.destroy=function(){this._closed=true;this._opening=false;this._clearTimers();try{if(this._inner)this._inner.destroy()}catch(e){}this.destroyed=true;emit('destroyed')};
 RobustPeer.__a360Robust=true;RobustPeer._real=Real;try{RobustPeer.util=Real.util}catch(e4){}w.Peer=RobustPeer;return true;
}
function loadAt(i){if(w.Peer){wrapPeer();finish(true);return}if(i>=CDN.length){finish(false);return}attempt=i+1;emit('library-loading',String(i+1));var s=d.createElement('script'),done=false,t;s.type='text/javascript';s.async=true;s.src=CDN[i];function end(ok){if(done)return;done=true;clearTimeout(t);s.onload=s.onerror=null;if(ok&&w.Peer){wrapPeer();finish(true)}else loadAt(i+1)}s.onload=function(){end(!!w.Peer)};s.onerror=function(){end(false)};t=setTimeout(function(){end(false)},3500);(d.head||d.getElementsByTagName('head')[0]||d.body).appendChild(s)}
function start(){if(ready||loading)return;loading=true;failed=false;addPreconnect('https://0.peerjs.com');addPreconnect('https://cdn.jsdelivr.net');emit('library-start');if(w.Peer){wrapPeer();finish(true);return}loadAt(0)}
function whenReady(cb){if(ready&&w.Peer){cb(true);return}waiters.push(cb);if(!loading)start()}
w.APP360_PEER_BOOTSTRAP={__ready:true,version:VERSION,ready:whenReady,start:start,getState:function(){return state},isLoaded:function(){return ready&&!!w.Peer}};
start();
})(window,document);
