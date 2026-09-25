var CACHE='app360-portal-v32';
var CORE=[
  './','./index.html',
  './assets/css/lab360.css','./assets/css/legacy-compat.css','./assets/css/home-showcase-v31.css',
  './assets/js/lab360-v24.js','./assets/js/home-showcase-v31.js','./assets/js/home-cover-open-v32.js','./assets/js/swal-modern-loader-v24.js','./assets/js/pwa-install-v24.js',
  './assets/brand/app360-lab-logo.png','./assets/brand/app360-lab-icon-192.png',
  './assets/covers/app-coming-soon-v30.svg',
  './assets/covers/a1-drawing-writing.jpg','./assets/covers/a1-first-words.jpg','./assets/covers/a1-imitate.jpg','./assets/covers/a1-screen-move.jpg','./assets/covers/a1-calm.jpg','./assets/covers/a1-sensory.jpg',
  './data/catalog.json','./data/goals.json','./data/live-overrides.json',
  './ages/1-4/index.html','./ages/4-8/index.html','./ages/8-12/index.html','./ages/12-16/index.html',
  './ages/16-24/index.html','./ages/24-45/index.html','./ages/45-60/index.html','./ages/60-80/index.html'
];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return Promise.all(CORE.map(function(u){return c.add(u).catch(function(){return null})}))}));if(self.skipWaiting)self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.map(function(k){if(k.indexOf('app360-portal-')===0&&k!==CACHE)return caches.delete(k)}))}).then(function(){return self.clients&&self.clients.claim?self.clients.claim():null}))});
self.addEventListener('message',function(e){if(e.data&&e.data.type==='SKIP_WAITING'&&self.skipWaiting)self.skipWaiting()});
function sameOrigin(req){try{return new URL(req.url).origin===self.location.origin}catch(e){return false}}
function networkFirst(req,fallback){return fetch(req,{cache:'no-store'}).then(function(resp){if(resp&&resp.ok&&sameOrigin(req)){var copy=resp.clone();caches.open(CACHE).then(function(c){c.put(req,copy)});}return resp}).catch(function(){return caches.match(req).then(function(hit){return hit||caches.match(fallback||'./index.html')})})}
function staleWhileRevalidate(req){return caches.match(req).then(function(hit){var update=fetch(req).then(function(resp){if(resp&&resp.ok&&sameOrigin(req)){var copy=resp.clone();caches.open(CACHE).then(function(c){c.put(req,copy)});}return resp}).catch(function(){return null});return hit||update})}
self.addEventListener('fetch',function(e){var req=e.request;if(!req||req.method!=='GET'||!sameOrigin(req))return;var url=req.url||'';var isData=url.indexOf('/data/catalog.json')>=0||url.indexOf('/data/goals.json')>=0||url.indexOf('/data/live-overrides.json')>=0;var isPortalLogic=url.indexOf('/assets/js/lab360')>=0||url.indexOf('/assets/js/home-showcase')>=0||url.indexOf('/assets/js/home-cover-open')>=0||url.indexOf('/assets/js/swal-modern-loader')>=0||url.indexOf('/assets/js/pwa-install')>=0;var isBrand=url.indexOf('/assets/brand/')>=0||url.indexOf('/assets/covers/')>=0||url.indexOf('/manifest.webmanifest')>=0;var isPortalStyle=url.indexOf('/assets/css/home-showcase')>=0||url.indexOf('/assets/css/lab360')>=0;if(req.mode==='navigate'){e.respondWith(networkFirst(req,'./index.html'));return}if(isData||isPortalLogic||isBrand||isPortalStyle){e.respondWith(networkFirst(req));return}e.respondWith(staleWhileRevalidate(req))});