'use strict';
var CACHE='app360-app-screen-to-move-v18';
var PREVIOUS='app360-app-screen-to-move-v17';
var CORE=[
 './','./index.html','./index.html?v=18','./styles.css?v=18','./v8.css?v=18','./v9.css?v=18','./v10.css?v=18','./v13.css?v=18','./v14.css?v=18','./v15.css?v=18','./v16.css?v=18','./v17.css?v=18','./v18.css?v=18',
 './games-data.js?v=18','./games-data-v12.js?v=18','./storage-v15.js?v=18','./legacy-v15.js?v=18','./app.js?v=18','./designer-assets-v9.js?v=18','./designer-assets-v12.js?v=18','./designer-v9.js?v=18','./designer-v10.js?v=18','./game-designer-v10.js?v=18','./designer-v15.js?v=18','./designer-v16.js?v=18','./game-designer-v17.js?v=18','./game-designer-v18.js?v=18','./legacy-v13.js?v=18',
 './manifest.webmanifest?v=18','./icon.svg','./icon-192.png','./icon-512.png','../drawing-writing-foundations/audio-v21.js?v=18','../drawing-writing-foundations/audio/registry.json',
 '../../../assets/ui-icons/games.svg','../../../assets/ui-icons/print.svg','../../../assets/ui-icons/draw.svg','../../../assets/ui-icons/prev.svg','../../../assets/ui-icons/next.svg','../../../assets/ui-icons/check.svg','../../../assets/ui-icons/restart.svg','../../../assets/ui-icons/hint.svg','../../../assets/ui-icons/select.svg',
 '../say-and-name/assets/objects/apple.svg','../say-and-name/assets/objects/ball.svg','../say-and-name/assets/objects/banana.svg','../say-and-name/assets/objects/book.svg','../say-and-name/assets/objects/car.svg','../say-and-name/assets/objects/cat.svg','../say-and-name/assets/objects/chair.svg','../say-and-name/assets/objects/cup.svg','../say-and-name/assets/objects/shoe.svg','../say-and-name/assets/objects/spoon.svg','../say-and-name/assets/objects/toothbrush.svg','../say-and-name/assets/objects/water.svg'
];
(function(){var i,n;for(i=1;i<=170;i++){n=String(i);while(n.length<2)n='0'+n;CORE.push('./assets/game-covers/G'+n+'.svg')}})();
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return Promise.all(CORE.map(function(u){return c.add(u).catch(function(){return null})}))}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.map(function(k){if(k.indexOf('app360-app-screen-to-move-')===0&&k!==CACHE&&k!==PREVIOUS)return caches.delete(k)}))}).then(function(){return self.clients&&self.clients.claim?self.clients.claim():null}))});
self.addEventListener('message',function(e){if(e.data&&e.data.type==='SKIP_WAITING'&&self.skipWaiting)self.skipWaiting()});
function same(req){try{return new URL(req.url).origin===self.location.origin}catch(e){return false}}
function noSearch(req){try{var u=new URL(req.url);u.search='';return u.toString()}catch(e){return''}}
function matchAny(req){return caches.match(req).then(function(x){if(x)return x;var clean=noSearch(req);return clean?caches.match(clean):null})}
function put(req,r){if(r&&r.ok&&same(req)){var copy=r.clone();caches.open(CACHE).then(function(c){c.put(req,copy)})}return r}
function fresh(req,fallback){return fetch(req,{cache:'no-store'}).then(function(r){return put(req,r)}).catch(function(){return matchAny(req).then(function(hit){return hit||caches.match(fallback||'./index.html')})})}
function cached(req){return matchAny(req).then(function(hit){if(hit)return hit;return fetch(req).then(function(r){return put(req,r)})})}
self.addEventListener('fetch',function(e){if(!e.request||e.request.method!=='GET'||!same(e.request))return;var u=e.request.url||'',critical=e.request.mode==='navigate'||u.indexOf('/index.html')>=0||u.indexOf('/app.js')>=0||u.indexOf('/game-designer-v18.js')>=0||u.indexOf('/v18.css')>=0||u.indexOf('/manifest.webmanifest')>=0;if(critical){e.respondWith(fresh(e.request,'./index.html'));return}e.respondWith(cached(e.request))});
