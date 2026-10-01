(function(w,d){
'use strict';
if(w.APP360_FAMILY_HYBRID_TRANSPORT&&w.APP360_FAMILY_HYBRID_TRANSPORT.__ready)return;
var VERSION='2.0.1',MediaPeer=null,installed=false;
function now(){return +new Date()}
function trim(s){return String(s==null?'':s).replace(/^\s+|\s+$/g,'')}
function qv(k){var m=String(w.location.search||'').match(new RegExp('[?&]'+k+'=([^&]*)','i'));return m?decodeURIComponent(m[1]||''):''}
function get(k){try{return w.localStorage?w.localStorage.getItem(k)||'':''}catch(e){return''}}
function set(k,v){try{if(w.localStorage){if(v==null)w.localStorage.removeItem(k);else w.localStorage.setItem(k,String(v));return true}}catch(e){}return false}
function endpoint(){var x=trim(w.APP360_FAMILY_WS_URL||qv('family_ws')||get('app360:family:ws-endpoint'));if(x)return x;if(w.APP360_FAMILY_SERVER){return(w.location.protocol==='https:'?'wss://':'ws://')+w.location.host+'/family-ws'}return''}
function required(){return !!(w.APP360_FAMILY_WS_REQUIRED||qv('family_ws_required')==='1')}
function familyId(id){return id==null||id===''||/^app360fam-[a-z0-9_-]+$/i.test(String(id||''))}
function randomId(){return'a360ws-'+now().toString(36)+'-'+Math.random().toString(36).substr(2,8)}
function emitDoc(state,detail){try{d.documentElement.setAttribute('data-a360-family-transport',state)}catch(e){}try{var ev=d.createEvent('CustomEvent');ev.initCustomEvent('app360:family-transport',true,false,{state:state,detail:detail||'',version:VERSION});d.dispatchEvent(ev)}catch(e2){}}
function Emitter(){this._listeners={}}
Emitter.prototype.on=function(ev,fn){if(typeof fn!=='function')return this;if(!this._listeners[ev])this._listeners[ev]=[];this._listeners[ev].push(fn);return this};
Emitter.prototype._emit=function(ev,arg){var a=this._listeners[ev]||[],i;for(i=0;i<a.length;i++)try{a[i](arg)}catch(e){}};
function WsConnection(peer,id,opts,incoming){Emitter.call(this);this.peer=String(id||'');this.metadata=opts&&opts.metadata||{};this.serialization=opts&&opts.serialization||'json';this.reliable=true;this.open=false;this._peer=peer;this._incoming=!!incoming;this._id='fc-'+now().toString(36)+'-'+Math.random().toString(36).substr(2,8);this._closed=false;this._queue=[];this._suspended=false}
WsConnection.prototype=Object.create(Emitter.prototype);WsConnection.prototype.constructor=WsConnection;
WsConnection.prototype.on=function(ev,fn){Emitter.prototype.on.call(this,ev,fn);if(ev==='open'&&this.open&&typeof fn==='function')setTimeout(function(){try{fn()}catch(e){}},0);return this};
WsConnection.prototype._serverId=function(id){if(id)this._id=String(id);return this._id};
WsConnection.prototype._opened=function(){if(this._closed)return;var first=!this.open;this.open=true;this._suspended=false;if(first)this._emit('open');this._flush()};
WsConnection.prototype._resumed=function(){if(this._closed)return;this.open=true;this._suspended=false;this._flush()};
WsConnection.prototype._suspend=function(){if(this._closed)return;this._suspended=true;this.open=true};
WsConnection.prototype._data=function(m){if(!this._closed)this._emit('data',m)};
WsConnection.prototype._flush=function(){var q=this._queue.slice(0),i;this._queue=[];for(i=0;i<q.length;i++)this.send(q[i])};
WsConnection.prototype.send=function(m){if(this._closed)return;var p=this._peer;if(p&&p._wsReady&&this.open&&!this._suspended){p._send({type:'data',connectionId:this._id,payload:m});return}this._queue.push(m);if(this._queue.length>32)this._queue.shift()};
WsConnection.prototype.close=function(){if(this._closed)return;this._closed=true;this.open=false;if(this._peer){this._peer._send({type:'conn-close',connectionId:this._id});delete this._peer._conns[this._id]}this._emit('close')};
WsConnection.prototype._serverClose=function(reason){if(this._closed)return;this._closed=true;this.open=false;if(this._peer)delete this._peer._conns[this._id];if(reason&&reason!=='peer-close')this._emit('error',{type:reason,message:reason});this._emit('close')};
function WsPeer(id,opts){Emitter.call(this);this._idArg=id;this._opts=opts||{};this.id=id||randomId();this.destroyed=false;this.disconnected=true;this._closed=false;this._ws=null;this._wsReady=false;this._sendQueue=[];this._conns={};this._retry=0;this._retryTimer=0;this._openEmitted=false;this._openSocket()}
WsPeer.prototype=Object.create(Emitter.prototype);WsPeer.prototype.constructor=WsPeer;
WsPeer.prototype.on=function(ev,fn){Emitter.prototype.on.call(this,ev,fn);var self=this;if(ev==='open'&&this._openEmitted&&typeof fn==='function')setTimeout(function(){try{fn(self.id)}catch(e){}},0);return this};
WsPeer.prototype._url=function(){return endpoint()};
WsPeer.prototype._schedule=function(){var self=this;if(self._closed)return;if(self._retryTimer)clearTimeout(self._retryTimer);self._retry++;var delay=Math.min(220+self._retry*180,1800);self._retryTimer=setTimeout(function(){self._retryTimer=0;self._openSocket()},delay)};
WsPeer.prototype._openSocket=function(){var self=this,url=self._url(),ws;if(self._closed)return;if(!url){self._emit('error',{type:'family-ws-unconfigured',message:'Family WebSocket endpoint is not configured'});return}emitDoc('ws-connecting',url);try{ws=new w.WebSocket(url)}catch(e){self._schedule();return}self._ws=ws;self.disconnected=true;ws.onopen=function(){if(self._closed||self._ws!==ws)return;self._wsReady=true;self.disconnected=false;self._retry=0;self._send({type:'peer-register',peerId:self.id});self._flushRaw()};ws.onmessage=function(e){if(self._closed||self._ws!==ws)return;var m;try{m=JSON.parse(String(e.data||''))}catch(x){return}self._handle(m)};ws.onerror=function(){};ws.onclose=function(){if(self._closed||self._ws!==ws)return;self._wsReady=false;self.disconnected=true;for(var k in self._conns)if(self._conns.hasOwnProperty(k)&&self._conns[k]&&!self._conns[k]._closed)self._conns[k]._suspend();emitDoc('ws-reconnecting');self._schedule()}};
WsPeer.prototype._send=function(m){var s;try{s=JSON.stringify(m)}catch(e){return false}if(this._wsReady&&this._ws&&this._ws.readyState===1){try{this._ws.send(s);return true}catch(x){}}this._sendQueue.push(s);if(this._sendQueue.length>64)this._sendQueue.shift();return false};
WsPeer.prototype._flushRaw=function(){var q=this._sendQueue.slice(0),i;this._sendQueue=[];for(i=0;i<q.length;i++){if(!this._wsReady||!this._ws||this._ws.readyState!==1){this._sendQueue=q.slice(i).concat(this._sendQueue);break}try{this._ws.send(q[i])}catch(e){this._sendQueue=q.slice(i).concat(this._sendQueue);break}}};
WsPeer.prototype._handle=function(m){var c;if(!m||!m.type)return;if(m.type==='peer-open'){if(m.peerId)this.id=String(m.peerId);this.destroyed=false;this.disconnected=false;emitDoc('ws-open',this.id);if(!this._openEmitted){this._openEmitted=true;this._emit('open',this.id)}for(var k in this._conns)if(this._conns.hasOwnProperty(k)){c=this._conns[k];if(!c._incoming&&!c._closed)this._send({type:'connect',hostId:c.peer,connectionId:c._id,metadata:c.metadata||{}})}return}if(m.type==='incoming'){var id=String(m.connectionId||'');if(!id)return;c=this._conns[id];if(!c){c=new WsConnection(this,m.peerId||'',{metadata:m.metadata||{}},true);c._serverId(id);this._conns[id]=c;this._emit('connection',c)}return}if(m.type==='conn-open'){c=this._conns[String(m.connectionId||'')];if(c)c._opened();return}if(m.type==='conn-resumed'){c=this._conns[String(m.connectionId||'')];if(c)c._resumed();return}if(m.type==='conn-suspended'){c=this._conns[String(m.connectionId||'')];if(c)c._suspend();return}if(m.type==='data'){c=this._conns[String(m.connectionId||'')];if(c)c._data(m.payload);return}if(m.type==='conn-close'){c=this._conns[String(m.connectionId||'')];if(c)c._serverClose(m.reason||'peer-close');return}if(m.type==='peer-replaced'){this._emit('error',{type:'unavailable-id',message:'Family host replaced by a newer page'});return}};
WsPeer.prototype.connect=function(id,opts){var c=new WsConnection(this,String(id||''),opts||{},false);this._conns[c._id]=c;this._send({type:'connect',hostId:c.peer,connectionId:c._id,metadata:c.metadata||{}});return c};
WsPeer.prototype.call=function(){var err=new Error('Family control relay does not carry media');err.type='media-not-supported';throw err};
WsPeer.prototype.reconnect=function(){if(this._closed)return this;try{if(this._ws)this._ws.close()}catch(e){}this._wsReady=false;this._schedule();return this};
WsPeer.prototype.disconnect=function(){if(this._closed)return this;try{if(this._ws)this._ws.close(1000,'disconnect')}catch(e){}this._wsReady=false;this.disconnected=true;return this};
WsPeer.prototype.destroy=function(){var k;if(this._closed)return;this._closed=true;this.destroyed=true;this.disconnected=true;if(this._retryTimer){clearTimeout(this._retryTimer);this._retryTimer=0}for(k in this._conns)if(this._conns.hasOwnProperty(k))try{this._conns[k].close()}catch(e){}this._conns={};try{if(this._ws)this._ws.close(1000,'destroy')}catch(e2){}this._ws=null;this._wsReady=false};
function HybridPeer(id,opts){if(familyId(id))return new WsPeer(id,opts);if(MediaPeer)return new MediaPeer(id,opts);throw new Error('App360 media PeerJS is still loading')}
HybridPeer.__a360Hybrid=true;
function install(){if(installed)return true;if(!endpoint()){emitDoc('peerjs-fallback','no-ws-endpoint');return false}if(!w.WebSocket){emitDoc('peerjs-fallback','no-websocket');return false}if(w.Peer&&!w.Peer.__a360Hybrid)MediaPeer=w.Peer;w.Peer=HybridPeer;installed=true;emitDoc('ws-primary',endpoint());return true}
function setMediaPeer(ctor){if(ctor&&ctor!==HybridPeer&&!ctor.__a360Hybrid)MediaPeer=ctor;if(installed)w.Peer=HybridPeer;return !!MediaPeer}
w.APP360_FAMILY_HYBRID_TRANSPORT={__ready:true,version:VERSION,install:install,isInstalled:function(){return installed},endpoint:endpoint,setEndpoint:function(url){url=trim(url);if(url)set('app360:family:ws-endpoint',url);else set('app360:family:ws-endpoint',null);return url},required:required,setMediaPeer:setMediaPeer,getMediaPeer:function(){return MediaPeer},getHybridPeer:function(){return HybridPeer}};
install();
})(window,document);
