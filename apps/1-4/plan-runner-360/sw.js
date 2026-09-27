var CACHE='app360-plan-runner-360-v2';
var SHELL=[
  './','./index.html?v=2','./styles.css?v=2','./responsive-session-v2.css?v=2','./app.js?v=2','./responsive-session-v2.js?v=2','./real-play.html?v=2','./data/presets.json','./manifest.webmanifest?v=2','./icon.svg?v=2','./app.json',
  '../../../assets/css/legacy-compat.css?v=24','../../../assets/js/legacy-compat.js?v=24','../../../assets/js/app-pwa.js?v=2','../../../assets/js/app360-ai-shell.js?v=2','../../../assets/js/app360-session-v1.js?v=1',
  '../../../data/app-links-registry.json',
  '../say-and-name/links.json','../imitate-one-step/links.json','../screen-to-move/links.json','../drawing-writing-foundations/links.json','../calm-with-me/links.json','../sensory-motion-missions/links.json','../my-little-routine/links.json'
];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return Promise.all(SHELL.map(function(u){return c.add(u).catch(function(){return null})}))}));if(self.skipWaiting)self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.map(function(k){if(k.indexOf('app360-plan-runner-360-')===0&&k!==CACHE)return caches.delete(k)}))}).then(function(){return self.clients&&self.clients.claim?self.clients.claim():null}))});
function same(req){try{return new URL(req.url).origin===self.location.origin}catch(e){return false}}
function cached(req){return caches.match(req).then(function(x){return x||fetch(req,{cache:'no-store'}).then(function(r){if(r&&r.ok&&same(req)){var y=r.clone();caches.open(CACHE).then(function(c){c.put(req,y)})}return r})})}
self.addEventListener('fetch',function(e){if(!e.request||e.request.method!=='GET'||!same(e.request))return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request,{cache:'no-store'}).then(function(r){if(r&&r.ok){var x=r.clone();caches.open(CACHE).then(function(c){c.put(e.request,x)})}return r}).catch(function(){return caches.match('./index.html?v=2').then(function(x){return x||caches.match('./')})}));return}e.respondWith(cached(e.request))});
