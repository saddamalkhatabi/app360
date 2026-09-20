var CACHE='app360-drawing-writing-v24';
var SHELL=['./','./index.html','./manifest.json','./icon.svg','./icon-192.png','./icon-512.png','./sync-v10-extra.js','./ui-v11.js?v=19','./audio-pcm-v18.js?v=18','./audio-v21.js?v=22','./version.json','./app.json'];
self.addEventListener('install',function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){return Promise.all(SHELL.map(function(u){return c.add(u).catch(function(){return null})}))}));
  if(self.skipWaiting)self.skipWaiting();
});
self.addEventListener('activate',function(e){
  e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.map(function(k){if(k!==CACHE&&k.indexOf('app360-drawing-writing-')===0)return caches.delete(k)}))}).then(function(){return self.clients&&self.clients.claim?self.clients.claim():null}));
});
self.addEventListener('message',function(e){if(e.data&&e.data.type==='SKIP_WAITING'&&self.skipWaiting)self.skipWaiting()});
function same(req){try{return new URL(req.url).origin===self.location.origin}catch(e){return false}}
function fresh(req,fallback){return fetch(req,{cache:'no-store'}).then(function(resp){if(resp&&resp.ok&&same(req)){var copy=resp.clone();caches.open(CACHE).then(function(c){c.put(req,copy)})}return resp}).catch(function(){return caches.match(req).then(function(r){return r||caches.match(fallback||'./index.html')})})}
function cached(req){return caches.match(req).then(function(r){if(r)return r;return fetch(req).then(function(resp){if(resp&&resp.ok&&same(req)){var copy=resp.clone();caches.open(CACHE).then(function(c){c.put(req,copy)})}return resp})})}
self.addEventListener('fetch',function(e){
  if(!e.request||e.request.method!=='GET'||!same(e.request))return;
  var u=e.request.url||'';
  var audio=u.indexOf('/audio/')>=0||u.indexOf('audio-pcm-v18.js')>=0||u.indexOf('audio-v21.js')>=0;
  var critical=e.request.mode==='navigate'||u.indexOf('/index.html')>=0||u.indexOf('/version.json')>=0||u.indexOf('/app.json')>=0||u.indexOf('/ui-v11.js')>=0||u.indexOf('/sync-v10-extra.js')>=0;
  if(audio){e.respondWith(cached(e.request));return}
  if(critical){e.respondWith(fresh(e.request,'./index.html'));return}
  e.respondWith(cached(e.request));
});
