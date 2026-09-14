var CACHE='app360-portal-v18';
var CORE=[
  './','./index.html?v=13','./manifest.webmanifest?v=11',
  './assets/css/lab360.css?v=17',
  './assets/js/lab360.js?v=18','./assets/js/pwa-install.js?v=16',
  './assets/brand/app360-lab-logo.webp?v=11',
  './assets/brand/app360-lab-icon-32.png?v=11','./assets/brand/app360-lab-icon-180.png?v=11','./assets/brand/app360-lab-icon-192.png?v=11','./assets/brand/app360-lab-icon-512.png?v=11',
  './data/catalog.json','./data/goals.json','./data/live-overrides.json',
  './ages/1-4/index.html','./ages/4-8/index.html','./ages/8-12/index.html','./ages/12-16/index.html',
  './ages/16-24/index.html','./ages/24-45/index.html','./ages/45-60/index.html','./ages/60-80/index.html'
];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return Promise.all(CORE.map(function(u){return c.add(u).catch(function(){return null})}))}));if(self.skipWaiting)self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.map(function(k){if(k.indexOf('app360-portal-')===0&&k!==CACHE)return caches.delete(k)}))}).then(function(){return self.clients&&self.clients.claim?self.clients.claim():null}))});
self.addEventListener('message',function(e){if(e.data&&e.data.type==='SKIP_WAITING'&&self.skipWaiting)self.skipWaiting()});
function sameOrigin(req){try{return new URL(req.url).origin===self.location.origin}catch(e){return false}}
function networkFirst(req,fallback){return fetch(req,{cache:'no-store'}).then(function(resp){if(resp&&resp.ok&&sameOrigin(req)){var copy=resp.clone();caches.open(CACHE).then(function(c){c.put(req,copy)});}return resp}).catch(function(){return caches.match(req).then(function(hit){return hit||caches.match(fallback||'./index.html?v=13')})})}
function staleWhileRevalidate(req){return caches.match(req).then(function(hit){var update=fetch(req).then(function(resp){if(resp&&resp.ok&&sameOrigin(req)){var copy=resp.clone();caches.open(CACHE).then(function(c){c.put(req,copy)});}return resp}).catch(function(){return null});return hit||update})}
self.addEventListener('fetch',function(e){var req=e.request;if(!req||req.method!=='GET'||!sameOrigin(req))return;var url=req.url||'';var isData=url.indexOf('/data/catalog.json')>=0||url.indexOf('/data/goals.json')>=0||url.indexOf('/data/live-overrides.json')>=0;var isBrand=url.indexOf('/assets/brand/')>=0||url.indexOf('/manifest.webmanifest')>=0;var isPortalLogic=url.indexOf('/assets/js/lab360.js')>=0;if(req.mode==='navigate'){e.respondWith(networkFirst(req,'./index.html?v=13'));return}if(isData||isBrand||isPortalLogic){e.respondWith(networkFirst(req));return}e.respondWith(staleWhileRevalidate(req))});
