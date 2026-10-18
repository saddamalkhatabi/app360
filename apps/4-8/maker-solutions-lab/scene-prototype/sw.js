var CACHE='a4-maker-scene-prototype-v1';var FILES=['index.html','style.css','app.js','manifest.webmanifest','assets/bridge-scenes-v1.webp'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(FILES);}));});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.filter(function(k){return k.indexOf('a4-maker-scene-prototype-')===0&&k!==CACHE;}).map(function(k){return caches.delete(k);}));}));});
self.addEventListener('fetch',function(e){if(e.request.method!=='GET'||e.request.url.indexOf(self.registration.scope)!==0)return;e.respondWith(caches.match(e.request).then(function(hit){return hit||fetch(e.request);}));});
