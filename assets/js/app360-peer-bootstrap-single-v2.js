(function(w,d){
'use strict';
if(w.APP360_PEER_BOOTSTRAP&&w.APP360_PEER_BOOTSTRAP.__ready)return;
var VERSION='2.0.0-single-peer',ready=false,loading=false,failed=false,waiters=[],state='idle',attempt=0,activePeers=[],unloading=false;
var CDN=[
 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.5/peerjs.min.js',
 'https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js'
];
function now(){return +new Date()}
function emit(s,detail){state=s;try{d.documentElement.setAttribute('data-a360-peer-state',s)}catch(e){}try{var ev=d.createEvent('CustomEvent');ev.initCustomEvent('app360:peer-state',true,false,{state:s,detail:detail||'',attempt:attempt});d.dispatchEvent(ev)}catch(e2){}}
function addPreconnect(h){try{var l=d.createElement('link');l.rel='preconnect';l.href=h;l.crossOrigin='anonymous';(d.head||d.getElementsByTagName('head')[0]||d.body).appendChild(l)}catch(e){}}
function finish(ok){var a=waiters.slice(0),i;waiters=[];ready=!!ok;failed=!ok;loading=false;emit(ok?'library-ready':'library-failed');for(i=0;i<a.length;i++)try{a[i](ok)}catch(e){}}
function isFamilyHost(id){return typeof id==='string'&&/^app360fam-[a-z0-9_-]+$/i.test(id)}
function addActive(p){activePeers.push(p)}
function removeActive(p){var i;for(i=activePeers.length-1;i>=0;i--)if(activePeers[i]===p)activePeers.splice(i,1)}
function cleanOnUnload(e){var a,i;if(e&&e.persisted)return;if(unloading)return;unloading=true;a=activePeers.slice(0);for(i=0;i<a.length;i++)try{a[i].destroy()}catch(x){}}
function bindUnload(){if(w.addEventListener){w.addEventListener('pagehide',cleanOnUnload,false);w.addEventListener('beforeunload',cleanOnUnload,false)}else if(w.attachEvent)w.attachEvent('onbeforeunload',cleanOnUnload)}
function wrapPeer(){var Real=w.Peer;if(!Real||Real.__a360Robust)return !!Real;
 function RobustPeer(id,opts){var self=this;self._idArg=id;self._opts=opts||{};self._listeners={};self._inner=null;self._closed=false;self._opening=false;self._openTimer=0;self._retryTimer=0;self._tries=0;self._familyRetries=0;self._familyRetryGraceUntil=0;self.id=undefined;self.destroyed=false;self.disconnected=false;addActive(self);self._start()}
 RobustPeer.prototype.on=function(ev,fn){if(!this._listeners[ev])this._listeners[ev]=[];this._listeners[ev].push(fn);return this};
 RobustPeer.prototype._emit=function(ev,arg){var a=this._listeners[ev]||[],i;for(i=0;i<a.length;i++)try{a[i](arg)}catch(e){}};
 RobustPeer.prototype._clearTimers=function(){if(this._openTimer){clearTimeout(this._openTimer);this._openTimer=0}if(this._retryTimer){clearTimeout(this._retryTimer);this._retryTimer=0}};
 RobustPeer.prototype._transient=function(err){var t=err&&err.type||'';return t==='network'||t==='server-error'||t==='socket-error'||t==='socket-closed'||t==='disconnected'||t==='connection-timeout'||!t};
 RobustPeer.prototype._schedule=function(reason,delay){var self=this;if(self._closed)return;self._clearTimers();self._tries++;attempt=self._tries;emit('signal-retry',reason||'');delay=typeof delay==='number'?delay:Math.min(500+self._tries*220,1800);self._retryTimer=setTimeout(function(){self._start()},delay)};
 RobustPeer.prototype._start=function(){var self=this,p;if(self._closed||self._opening)return;self._opening=true;self._clearTimers();emit(self._tries?'signal-retrying':'signal-connecting');try{p=(self._idArg!==undefined&&self._idArg!==null)?new Real(self._idArg,self._opts):new Real(undefined,self._opts)}catch(e){self._opening=false;self._schedule('constructor',260);return}self._inner=p;
  p.on('open',function(id){if(self._closed)return;self._opening=false;self._clearTimers();self._tries=0;attempt=0;self.id=id;self.destroyed=false;self.disconnected=false;emit('signal-open');self._emit('open',id)});
  p.on('connection',function(c){self._emit('connection',c)});
  p.on('call',function(c){self._emit('call',c)});
  p.on('disconnected',function(){if(self._closed)return;self.disconnected=true;emit('signal-disconnected');try{if(p.reconnect)p.reconnect()}catch(e){}self._emit('disconnected')});
  p.on('close',function(){if(self._closed)return;self.destroyed=true;if(self._opening){self._opening=false;self._schedule('closed-before-open',260);return}self._emit('close')});
  p.on('error',function(err){if(self._closed)return;var type=err&&err.type||'';if(type==='peer-unavailable'&&(self._familyRetries>0||now()<self._familyRetryGraceUntil)){emit('data-wait','host-refresh');return}if(self._opening&&type==='unavailable-id'&&self._idArg!==undefined&&self._idArg!==null&&self._tries<14){self._opening=false;try{p.destroy()}catch(e0){}self._schedule('id-release-wait',Math.min(140+self._tries*70,620));return}if(self._opening&&self._transient(err)&&self._tries<5){self._opening=false;try{p.destroy()}catch(e1){}self._schedule(type||'network');return}self._opening=false;self._clearTimers();emit('signal-error',type);self._emit('error',err)});
  self._openTimer=setTimeout(function(){if(self._closed||!self._opening)return;self._opening=false;try{p.destroy()}catch(e){}if(self._tries<6)self._schedule('timeout',450);else{emit('signal-timeout');self._emit('error',{type:'connection-timeout',message:'PeerServer open timeout'})}},6000)};
 function DirectConnection(owner,id,opts){var c=owner._inner&&owner._inner.connect?owner._inner.connect(id,opts):null,t;if(!c)return c;t=setTimeout(function(){if(!c.open){try{c.close()}catch(e){}try{if(c.emit)c.emit('error',{type:'connection-timeout',message:'Data channel open timeout'})}catch(e2){}}},8000);try{c.on('open',function(){clearTimeout(t);emit('data-open')});c.on('close',function(){clearTimeout(t)})}catch(e3){}return c}
 function FamilyConnection(owner,id,opts){var self=this;self.open=false;self.peer=id;self.metadata=opts&&opts.metadata||{};self._owner=owner;self._id=id;self._opts=opts||{};self._listeners={};self._inner=null;self._closed=false;self._timer=0;self._attemptTimer=0;self._outageAt=now();self._attempt=0;self._queue=[];self._connecting=false;self._connect()}
 FamilyConnection.prototype.on=function(ev,fn){if(!this._listeners[ev])this._listeners[ev]=[];this._listeners[ev].push(fn);if(ev==='open'&&this.open)setTimeout(fn,0);return this};
 FamilyConnection.prototype._emit=function(ev,arg){var a=this._listeners[ev]||[],i;for(i=0;i<a.length;i++)try{a[i](arg)}catch(e){}};
 FamilyConnection.prototype._markRetry=function(on){var o=this._owner;if(!o)return;if(on){o._familyRetries++;o._familyRetryGraceUntil=now()+9500}else if(o._familyRetries>0)o._familyRetries--};
 FamilyConnection.prototype._clearAttempt=function(){if(this._attemptTimer){clearTimeout(this._attemptTimer);this._attemptTimer=0}};
 FamilyConnection.prototype._schedule=function(){var self=this;if(self._closed)return;if(now()-self._outageAt>9000){self._closed=true;self.open=false;self._clearAttempt();self._markRetry(false);emit('data-reconnect-failed');self._emit('error',{type:'peer-unavailable',message:'Family host unavailable after refresh'});self._emit('close');return}if(self._timer)clearTimeout(self._timer);self._timer=setTimeout(function(){self._timer=0;self._connect()},Math.min(140+self._attempt*60,460))};
 FamilyConnection.prototype._connect=function(){var self=this,c;if(self._closed||self._connecting)return;self._connecting=true;self._attempt++;self._markRetry(true);emit(self._attempt===1?'data-connecting':'data-reconnecting',self._id);try{c=self._owner._inner&&self._owner._inner.connect?self._owner._inner.connect(self._id,self._opts):null}catch(e){c=null}if(!c){self._connecting=false;self._markRetry(false);self._schedule();return}self._inner=c;function current(){return !self._closed&&self._inner===c}self._clearAttempt();self._attemptTimer=setTimeout(function(){if(!current()||c.open)return;self._clearAttempt();self._markRetry(false);self._connecting=false;self.open=false;try{c.close()}catch(e){}self._inner=null;if(!self._outageAt)self._outageAt=now();self._schedule()},1600);try{
   c.on('open',function(){var q,i;if(!current())return;self._clearAttempt();self._connecting=false;self.open=true;self._attempt=0;self._outageAt=0;self._markRetry(false);emit('data-open',self._id);q=self._queue.slice(0);self._queue=[];for(i=0;i<q.length;i++)try{c.send(q[i])}catch(e){}self._emit('open')});
   c.on('data',function(m){if(current())self._emit('data',m)});
   c.on('close',function(){if(!current())return;self._clearAttempt();self._markRetry(false);self._connecting=false;self.open=false;self._inner=null;if(!self._outageAt)self._outageAt=now();emit('data-reconnecting','close');self._schedule()});
   c.on('error',function(){if(!current())return;self._clearAttempt();self._markRetry(false);self._connecting=false;self.open=false;try{c.close()}catch(e){}self._inner=null;if(!self._outageAt)self._outageAt=now();emit('data-reconnecting','error');self._schedule()})
  }catch(e2){self._clearAttempt();self._markRetry(false);self._connecting=false;self._inner=null;self._schedule()}}
 FamilyConnection.prototype.send=function(m){try{if(this._inner&&this._inner.open){this._inner.send(m);return}this._queue.push(m);if(this._queue.length>20)this._queue.shift()}catch(e){}};
 FamilyConnection.prototype.close=function(){if(this._closed)return;this._closed=true;this.open=false;if(this._timer){clearTimeout(this._timer);this._timer=0}this._clearAttempt();this._markRetry(false);try{if(this._inner)this._inner.close()}catch(e){}this._inner=null;this._queue=[]};
 RobustPeer.prototype.connect=function(id,opts){if(isFamilyHost(id))return new FamilyConnection(this,String(id),opts);return DirectConnection(this,id,opts)};
 RobustPeer.prototype.call=function(id,stream,opts){return this._inner&&this._inner.call?this._inner.call(id,stream,opts):null};
 RobustPeer.prototype.reconnect=function(){try{if(this._inner&&this._inner.reconnect)this._inner.reconnect()}catch(e){this._schedule('manual-reconnect',260)}return this};
 RobustPeer.prototype.disconnect=function(){try{if(this._inner&&this._inner.disconnect)this._inner.disconnect()}catch(e){}this.disconnected=true;return this};
 RobustPeer.prototype.destroy=function(){if(this._closed)return;this._closed=true;this._opening=false;this._clearTimers();try{if(this._inner)this._inner.destroy()}catch(e){}this._inner=null;this.destroyed=true;removeActive(this);emit('destroyed')};
 RobustPeer.__a360Robust=true;RobustPeer._real=Real;try{RobustPeer.util=Real.util}catch(e4){}w.Peer=RobustPeer;return true}
function loadAt(i){if(w.Peer){wrapPeer();finish(true);return}if(i>=CDN.length){finish(false);return}attempt=i+1;emit('library-loading',String(i+1));var s=d.createElement('script'),done=false,t;s.type='text/javascript';s.async=true;s.src=CDN[i];function end(ok){if(done)return;done=true;clearTimeout(t);s.onload=s.onerror=null;if(ok&&w.Peer){wrapPeer();finish(true)}else loadAt(i+1)}s.onload=function(){end(!!w.Peer)};s.onerror=function(){end(false)};t=setTimeout(function(){end(false)},3500);(d.head||d.getElementsByTagName('head')[0]||d.body).appendChild(s)}
function start(){if(ready||loading)return;loading=true;failed=false;addPreconnect('https://0.peerjs.com');addPreconnect('https://cdn.jsdelivr.net');emit('library-start');if(w.Peer){wrapPeer();finish(true);return}loadAt(0)}
function whenReady(cb){if(ready&&w.Peer){cb(true);return}waiters.push(cb);if(!loading)start()}
w.APP360_PEER_BOOTSTRAP={__ready:true,version:VERSION,ready:whenReady,start:start,getState:function(){return state},isLoaded:function(){return ready&&!!w.Peer},hostCandidates:function(code){return['app360fam-'+String(code||'').toLowerCase()]}};
bindUnload();start();
})(window,document);
