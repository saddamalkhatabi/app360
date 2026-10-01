(function(w,d){
'use strict';
if(w.APP360_PEER_BOOTSTRAP&&w.APP360_PEER_BOOTSTRAP.__ready)return;
var VERSION='1.1.1',ready=false,loading=false,failed=false,waiters=[],state='idle',attempt=0;
var MAX_HOST_SLOTS=4;
var CDN=[
 'https://cdn.jsdelivr.net/npm/peerjs@1.5.5/dist/peerjs.min.js',
 'https://cdnjs.cloudflare.com/ajax/libs/peerjs/1.5.5/peerjs.min.js',
 'https://unpkg.com/peerjs@1.5.5/dist/peerjs.min.js'
];
function emit(s,detail){state=s;try{d.documentElement.setAttribute('data-a360-peer-state',s)}catch(e){}try{var ev=d.createEvent('CustomEvent');ev.initCustomEvent('app360:peer-state',true,false,{state:s,detail:detail||'',attempt:attempt});d.dispatchEvent(ev)}catch(e2){}}
function addPreconnect(h){try{var l=d.createElement('link');l.rel='preconnect';l.href=h;l.crossOrigin='anonymous';(d.head||d.getElementsByTagName('head')[0]||d.body).appendChild(l)}catch(e){}}
function finish(ok){var a=waiters.slice(0),i;waiters=[];ready=!!ok;failed=!ok;loading=false;emit(ok?'library-ready':'library-failed');for(i=0;i<a.length;i++)try{a[i](ok)}catch(e){}}
function isFamilyHostBase(id){return typeof id==='string'&&/^app360fam-[a-z0-9_-]+$/i.test(id)&&!/-s[2-4]$/i.test(id)}
function hostCandidate(base,slot){return slot>0?base+'-s'+(slot+1):base}
function wrapPeer(){var Real=w.Peer;if(!Real||Real.__a360Robust)return !!Real;
 function RobustPeer(id,opts){
  var self=this;self._idArg=id;self._opts=opts||{};self._listeners={};self._inner=null;self._closed=false;self._opening=false;self._openTimer=0;self._retryTimer=0;self._tries=0;self._familyHostBase=isFamilyHostBase(id)?String(id):'';self._hostSlot=0;self._familyScans=0;self._familyScanGraceUntil=0;self.id=undefined;self.destroyed=false;self.disconnected=false;
  self._start();
 }
 RobustPeer.prototype.on=function(ev,fn){if(!this._listeners[ev])this._listeners[ev]=[];this._listeners[ev].push(fn);return this};
 RobustPeer.prototype._emit=function(ev,arg){var a=this._listeners[ev]||[],i;for(i=0;i<a.length;i++)try{a[i](arg)}catch(e){}};
 RobustPeer.prototype._clearTimers=function(){if(this._openTimer){clearTimeout(this._openTimer);this._openTimer=0}if(this._retryTimer){clearTimeout(this._retryTimer);this._retryTimer=0}};
 RobustPeer.prototype._transient=function(err){var t=err&&err.type||'';return t==='network'||t==='server-error'||t==='socket-error'||t==='socket-closed'||t==='disconnected'||t==='connection-timeout'||!t};
 RobustPeer.prototype._currentId=function(){return this._familyHostBase?hostCandidate(this._familyHostBase,this._hostSlot):this._idArg};
 RobustPeer.prototype._schedule=function(reason,delay){var self=this;if(self._closed)return;self._clearTimers();self._tries++;attempt=self._tries;emit('signal-retry',reason||'');delay=typeof delay==='number'?delay:Math.min(900+self._tries*450,3200);self._retryTimer=setTimeout(function(){self._start()},delay)};
 RobustPeer.prototype._nextHostSlot=function(){var self=this;if(!self._familyHostBase||self._hostSlot>=MAX_HOST_SLOTS-1)return false;self._clearTimers();self._hostSlot++;self._tries++;attempt=self._tries;emit('signal-host-slot',String(self._hostSlot+1));self._retryTimer=setTimeout(function(){self._start()},140);return true};
 RobustPeer.prototype._start=function(){var self=this,p,pid;if(self._closed||self._opening)return;self._opening=true;self._clearTimers();pid=self._currentId();emit(self._tries?'signal-retrying':'signal-connecting',self._familyHostBase?('slot '+(self._hostSlot+1)):'');try{p=(pid!==undefined&&pid!==null)?new Real(pid,self._opts):new Real(undefined,self._opts)}catch(e){self._opening=false;self._schedule('constructor');return}self._inner=p;
  p.on('open',function(id){if(self._closed)return;self._opening=false;self._clearTimers();self._tries=0;attempt=0;self.id=id;self.destroyed=false;self.disconnected=false;emit('signal-open',self._familyHostBase?('slot '+(self._hostSlot+1)):'');self._emit('open',id)});
  p.on('connection',function(c){self._emit('connection',c)});
  p.on('call',function(c){self._emit('call',c)});
  p.on('disconnected',function(){self.disconnected=true;emit('signal-disconnected');try{if(p.reconnect)p.reconnect()}catch(e){}self._emit('disconnected')});
  p.on('close',function(){self.destroyed=true;if(!self._closed&&self._opening){self._opening=false;self._schedule('closed-before-open');return}self._emit('close')});
  p.on('error',function(err){if(self._closed)return;var type=err&&err.type||'';if(type==='peer-unavailable'&&(self._familyScans>0||(+new Date())<self._familyScanGraceUntil)){emit('signal-scan-miss');return}if(self._opening&&type==='unavailable-id'){self._opening=false;try{p.destroy()}catch(e0){}if(self._nextHostSlot())return}if(self._opening&&self._transient(err)&&self._tries<3){self._opening=false;try{p.destroy()}catch(e){}self._schedule(type||'network');return}self._opening=false;self._clearTimers();emit('signal-error',type);self._emit('error',err)});
  self._openTimer=setTimeout(function(){if(self._closed||!self._opening)return;self._opening=false;try{p.destroy()}catch(e){}if(self._familyHostBase&&self._nextHostSlot())return;if(self._tries<3)self._schedule('timeout');else{emit('signal-timeout');self._emit('error',{type:'connection-timeout',message:'PeerServer open timeout'})}},7000);
 };
 function DirectConnection(owner,id,opts){var c=owner._inner&&owner._inner.connect?owner._inner.connect(id,opts):null,t;if(!c)return c;t=setTimeout(function(){if(!c.open){try{c.close()}catch(e){}try{if(c.emit)c.emit('error',{type:'connection-timeout',message:'Data channel open timeout'})}catch(e2){}}},10000);try{c.on('open',function(){clearTimeout(t);emit('data-open')});c.on('close',function(){clearTimeout(t)})}catch(e3){}return c}
 function MultiConnection(owner,base,opts){var self=this;self.open=false;self.peer=base;self.metadata=opts&&opts.metadata||{};self._owner=owner;self._base=base;self._opts=opts||{};self._listeners={};self._all=[];self._chosen=null;self._closed=false;self._finished=0;self._timer=0;self._scanCounted=true;owner._familyScans++;owner._familyScanGraceUntil=(+new Date())+8500;emit('data-scanning',base);self._start()}
 MultiConnection.prototype.on=function(ev,fn){if(!this._listeners[ev])this._listeners[ev]=[];this._listeners[ev].push(fn);if(ev==='open'&&this.open)setTimeout(fn,0);return this};
 MultiConnection.prototype._emit=function(ev,arg){var a=this._listeners[ev]||[],i;for(i=0;i<a.length;i++)try{a[i](arg)}catch(e){}};
 MultiConnection.prototype._scanDone=function(){if(this._scanCounted){this._scanCounted=false;if(this._owner&&this._owner._familyScans>0)this._owner._familyScans--}};
 MultiConnection.prototype._finalFail=function(){if(this._closed||this._chosen)return;this._scanDone();this._closed=true;if(this._timer)clearTimeout(this._timer);emit('data-scan-failed');this._emit('error',{type:'peer-unavailable',message:'No family host slot is available'})};
 MultiConnection.prototype._failOne=function(){if(this._closed||this._chosen)return;this._finished++;if(this._finished>=MAX_HOST_SLOTS)this._finalFail()};
 MultiConnection.prototype._choose=function(c){var self=this,i;if(self._closed||self._chosen)return;self._chosen=c;self.open=true;self.peer=c.peer||self._base;if(self._timer)clearTimeout(self._timer);self._scanDone();for(i=0;i<self._all.length;i++)if(self._all[i]!==c)try{self._all[i].close()}catch(e){}emit('data-open',self.peer);self._emit('open')};
 MultiConnection.prototype._start=function(){var self=this,owner=self._owner,i;function one(slot){setTimeout(function(){if(self._closed||self._chosen)return;var c,id=hostCandidate(self._base,slot);try{c=owner._inner.connect(id,self._opts)}catch(e){self._failOne();return}if(!c){self._failOne();return}self._all.push(c);try{c.on('open',function(){self._choose(c)});c.on('data',function(m){if(self._chosen===c)self._emit('data',m)});c.on('close',function(){if(self._chosen===c){self.open=false;self._closed=true;self._emit('close')}else self._failOne()});c.on('error',function(err){if(self._chosen===c)self._emit('error',err);else self._failOne()})}catch(e2){self._failOne()}},slot*120)}for(i=0;i<MAX_HOST_SLOTS;i++)one(i);self._timer=setTimeout(function(){if(self._closed||self._chosen)return;for(var j=0;j<self._all.length;j++)try{self._all[j].close()}catch(e){}self._finalFail()},6500)};
 MultiConnection.prototype.send=function(m){try{if(this._chosen&&this._chosen.open)this._chosen.send(m)}catch(e){}};
 MultiConnection.prototype.close=function(){var i;if(this._closed)return;this._closed=true;if(this._timer)clearTimeout(this._timer);if(!this._chosen)this._scanDone();for(i=0;i<this._all.length;i++)try{this._all[i].close()}catch(e){}this.open=false};
 RobustPeer.prototype.connect=function(id,opts){if(isFamilyHostBase(id))return new MultiConnection(this,String(id),opts);return DirectConnection(this,id,opts)};
 RobustPeer.prototype.call=function(id,stream,opts){return this._inner&&this._inner.call?this._inner.call(id,stream,opts):null};
 RobustPeer.prototype.reconnect=function(){try{if(this._inner&&this._inner.reconnect)this._inner.reconnect()}catch(e){this._schedule('manual-reconnect')}return this};
 RobustPeer.prototype.disconnect=function(){try{if(this._inner&&this._inner.disconnect)this._inner.disconnect()}catch(e){}this.disconnected=true;return this};
 RobustPeer.prototype.destroy=function(){this._closed=true;this._opening=false;this._clearTimers();try{if(this._inner)this._inner.destroy()}catch(e){}this.destroyed=true;emit('destroyed')};
 RobustPeer.__a360Robust=true;RobustPeer._real=Real;try{RobustPeer.util=Real.util}catch(e4){}w.Peer=RobustPeer;return true;
}
function loadAt(i){if(w.Peer){wrapPeer();finish(true);return}if(i>=CDN.length){finish(false);return}attempt=i+1;emit('library-loading',String(i+1));var s=d.createElement('script'),done=false,t;s.type='text/javascript';s.async=true;s.src=CDN[i];function end(ok){if(done)return;done=true;clearTimeout(t);s.onload=s.onerror=null;if(ok&&w.Peer){wrapPeer();finish(true)}else loadAt(i+1)}s.onload=function(){end(!!w.Peer)};s.onerror=function(){end(false)};t=setTimeout(function(){end(false)},3500);(d.head||d.getElementsByTagName('head')[0]||d.body).appendChild(s)}
function start(){if(ready||loading)return;loading=true;failed=false;addPreconnect('https://0.peerjs.com');addPreconnect('https://cdn.jsdelivr.net');emit('library-start');if(w.Peer){wrapPeer();finish(true);return}loadAt(0)}
function whenReady(cb){if(ready&&w.Peer){cb(true);return}waiters.push(cb);if(!loading)start()}
w.APP360_PEER_BOOTSTRAP={__ready:true,version:VERSION,ready:whenReady,start:start,getState:function(){return state},isLoaded:function(){return ready&&!!w.Peer},hostCandidates:function(code){var base='app360fam-'+String(code||'').toLowerCase(),a=[],i;for(i=0;i<MAX_HOST_SLOTS;i++)a.push(hostCandidate(base,i));return a}};
start();
})(window,document);
