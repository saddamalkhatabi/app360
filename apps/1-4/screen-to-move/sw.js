'use strict';
var CACHE='app360-app-screen-to-move-v2';
var CORE=['./','./index.html','./styles.css','./games-data.js','./app.js','./offline-alternatives.js','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(CORE)}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.map(function(k){if(k.indexOf('app360-app-screen-to-move-')===0&&k!==CACHE)return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('message',function(e){if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});
self.addEventListener('fetch',function(e){
 if(e.request.method!=='GET')return;
 var u=new URL(e.request.url);
 if(u.origin!==location.origin)return;
 if(u.pathname.endsWith('/index.html')||u.pathname.endsWith('/manifest.webmanifest')||u.pathname.endsWith('/games-data.js')){
   e.respondWith(fetch(e.request).then(function(r){var copy=r.clone();caches.open(CACHE).then(function(c){c.put(e.request,copy)});return r}).catch(function(){return caches.match(e.request)}));return;
 }
 e.respondWith(caches.match(e.request).then(function(hit){return hit||fetch(e.request).then(function(r){if(r&&r.ok){var copy=r.clone();caches.open(CACHE).then(function(c){c.put(e.request,copy)})}return r})}));
});
