(function(w,d){
'use strict';
if(w.APP360_FAMILY_STABILITY&&w.APP360_FAMILY_STABILITY.__ready)return;
var VERSION='1.0.0',installed=false,BasePeer=null,peers=[],born=+new Date(),offlineSeen=false,lastRestartAt=0,restartTimer=0,conn=null,lastConnSig='';
function now(){return +new Date()}
function addCss(){if(d.getElementById('app360FamilyStabilityStyle'))return;var s=d.createElement('style');s.id='app360FamilyStabilityStyle';s.type='text/css';s.innerHTML='#app360FamilyPanel,#app360ProfilePanel{z-index:2147483550!important}.a360-family-toast{z-index:2147483640!important}';(d.head||d.getElementsByTagName('head')[0]||d.body).appendChild(s)}
function fire(name,detail){try{var ev=d.createEvent('CustomEvent');ev.initCustomEvent(name,true,false,detail||{});d.dispatchEvent(ev)}catch(e){}}
function removePeer(p){var i;for(i=peers.length-1;i>=0;i--)if(peers[i]===p)peers.splice(i,1)}
function installPeerWrapper(){if(installed||!w.Peer)return false;BasePeer=w.Peer;if(BasePeer.__a360NetResilient){installed=true;return true}
 function ResilientPeer(id,opts){this._idArg=id;this._opts=opts||{};this._listeners={};this._inner=null;this._closed=false;this._generation=0;this._restartTimer=0;this._networkRestarting=false;this.id=undefined;this.destroyed=false;this.disconnected=false;peers.push(this);this._make()}
 ResilientPeer.prototype.on=function(ev,fn){if(!this._listeners[ev])this._listeners[ev]=[];this._listeners[ev].push(fn);return this};
 ResilientPeer.prototype._emit=function(ev,arg){var a=this._listeners[ev]||[],i;for(i=0;i<a.length;i++)try{a[i](arg)}catch(e){}};
 ResilientPeer.prototype._make=function(){var self=this,gen,inner;if(self._closed)return;gen=++self._generation;self._networkRestarting=false;try{inner=(self._idArg!==undefined&&self._idArg!==null)?new BasePeer(self._idArg,self._opts):new BasePeer(undefined,self._opts)}catch(e){setTimeout(function(){if(!self._closed&&gen===self._generation)self._make()},700);return}self._inner=inner;self.destroyed=false;self.disconnected=false;
  function current(){return !self._closed&&gen===self._generation&&self._inner===inner}
  inner.on('open',function(id){if(!current())return;self.id=id;self.destroyed=false;self.disconnected=false;self._emit('open',id);fire('app360:family-network-ready',{id:id||'',reason:'peer-open'})});
  inner.on('connection',function(c){if(current())self._emit('connection',c)});
  inner.on('call',function(c){if(current())self._emit('call',c)});
  inner.on('disconnected',function(){if(!current())return;self.disconnected=true;self._emit('disconnected');if(self._restartTimer)clearTimeout(self._restartTimer);self._restartTimer=setTimeout(function(){if(!self._closed&&self.disconnected)self._networkRestart('peer-disconnected')},1400)});
  inner.on('close',function(){if(!current())return;self.destroyed=true;self._emit('close')});
  inner.on('error',function(err){if(!current())return;self._emit('error',err)});
 };
 ResilientPeer.prototype._networkRestart=function(reason){var self=this,old;if(self._closed||self._networkRestarting)return;self._networkRestarting=true;self.disconnected=true;self.id=undefined;if(self._restartTimer){clearTimeout(self._restartTimer);self._restartTimer=0}old=self._inner;self._inner=null;self._generation++;try{if(old)old.destroy()}catch(e){}fire('app360:family-network-restart',{reason:reason||'network-change'});self._restartTimer=setTimeout(function(){self._restartTimer=0;if(self._closed)return;self._networkRestarting=false;self._make()},320)};
 ResilientPeer.prototype.connect=function(id,opts){try{return this._inner&&this._inner.connect?this._inner.connect(id,opts):null}catch(e){return null}};
 ResilientPeer.prototype.call=function(id,stream,opts){try{return this._inner&&this._inner.call?this._inner.call(id,stream,opts):null}catch(e){return null}};
 ResilientPeer.prototype.reconnect=function(){try{if(this._inner&&this._inner.reconnect)this._inner.reconnect();else this._networkRestart('manual-reconnect')}catch(e){this._networkRestart('manual-reconnect')}return this};
 ResilientPeer.prototype.disconnect=function(){try{if(this._inner&&this._inner.disconnect)this._inner.disconnect()}catch(e){}this.disconnected=true;return this};
 ResilientPeer.prototype.destroy=function(){this._closed=true;this._networkRestarting=false;if(this._restartTimer){clearTimeout(this._restartTimer);this._restartTimer=0}try{if(this._inner)this._inner.destroy()}catch(e){}this._inner=null;this.destroyed=true;removePeer(this)};
 ResilientPeer.__a360NetResilient=true;ResilientPeer._base=BasePeer;try{ResilientPeer.util=BasePeer.util}catch(e2){}w.Peer=ResilientPeer;installed=true;fire('app360:family-stability-ready',{version:VERSION});return true
}
function restartAll(reason){var i,p,t=now();if(t-lastRestartAt<3500)return;lastRestartAt=t;for(i=0;i<peers.length;i++){p=peers[i];try{if(p&&!p._closed&&p._networkRestart)p._networkRestart(reason)}catch(e){}}}
function scheduleRestart(reason,delay){if(now()-born<2800)return;if(restartTimer)clearTimeout(restartTimer);restartTimer=setTimeout(function(){restartTimer=0;restartAll(reason)},typeof delay==='number'?delay:450)}
function connectionSignature(){var c=w.navigator&&(w.navigator.connection||w.navigator.mozConnection||w.navigator.webkitConnection);if(!c)return'';return String(c.type||'')+'|'+String(c.effectiveType||'')}
function bindNetwork(){if(w.addEventListener){w.addEventListener('offline',function(){offlineSeen=true;fire('app360:family-network-offline',{})},false);w.addEventListener('online',function(){if(offlineSeen){offlineSeen=false;scheduleRestart('online-after-offline',380)}},false);w.addEventListener('pageshow',function(e){if(e&&e.persisted)scheduleRestart('pageshow-restore',250)},false)}conn=w.navigator&&(w.navigator.connection||w.navigator.mozConnection||w.navigator.webkitConnection);lastConnSig=connectionSignature();if(conn&&conn.addEventListener)conn.addEventListener('change',function(){var sig=connectionSignature(),changed=sig&&sig!==lastConnSig;lastConnSig=sig;if(changed||now()-lastRestartAt>12000)scheduleRestart('connection-change',520)},false);if(d.addEventListener)d.addEventListener('visibilitychange',function(){var i,p;if(d.hidden)return;for(i=0;i<peers.length;i++){p=peers[i];if(p&&p.disconnected&&!p._closed){scheduleRestart('visible-disconnected',220);break}}},false)}
function boot(){addCss();bindNetwork();var b=w.APP360_PEER_BOOTSTRAP;if(b&&b.ready){b.ready(function(ok){if(ok)installPeerWrapper()})}else{var n=0,t=setInterval(function(){n++;if(installPeerWrapper()||n>200)clearInterval(t)},25)}}
w.APP360_FAMILY_STABILITY={__ready:true,version:VERSION,restart:function(){restartAll('manual')},getPeerCount:function(){return peers.length}};
boot();
})(window,document);
