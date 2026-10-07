/* Shared by portal and application workers. Install never downloads an application. */
(function(){
'use strict';
var root=new URL(self.APP360_OFFLINE_ROOT||'./',self.location.href).href;
var prefix='app360-offline-'+encodeURIComponent(new URL(root).pathname)+'-',used=prefix+'used-v1',meta=prefix+'meta-v1';
function key(u){var x=new URL(u,root);x.search='';x.hash='';if(x.pathname.slice(-1)==='/')x.pathname+='index.html';return x.href;}
function safe(req){var u=new URL(req.url);return req.method==='GET'&&u.origin===self.location.origin&&u.href.indexOf(root)===0&&!/\/(api|auth|session|health|family-health|family-ws)(\/|$)/.test(u.pathname)&&(req.mode==='navigate'||/\.(html|js|css|json|webmanifest|svg|png|jpe?g|webp|gif|avif|mp3|wav|ogg|m4a|mp4|webm|woff2?|ttf|bin)$/.test(u.pathname));}
function state(){return caches.open(meta).then(function(c){return c.match(root+'__offline_state__');}).then(function(r){return r?r.json():{};});}
function mediaRange(req,r){var range=req.headers.get('Range'),m=range&&/^bytes=(\d+)-(\d*)$/.exec(range);if(!m||!r)return Promise.resolve(r);return r.arrayBuffer().then(function(b){var start=Number(m[1]),end=m[2]?Math.min(Number(m[2]),b.byteLength-1):b.byteLength-1;if(start>end)return new Response('',{status:416,headers:{'Content-Range':'bytes */'+b.byteLength}});var h=new Headers(r.headers);h.set('Content-Range','bytes '+start+'-'+end+'/'+b.byteLength);h.set('Content-Length',String(end-start+1));h.set('Accept-Ranges','bytes');return new Response(b.slice(start,end+1),{status:206,headers:h});});}
function stored(req){return state().then(function(s){var names=[],u=key(req.url),scope=self.registration.scope;Object.keys(s).forEach(function(id){var row=s[id];if(u.indexOf(root+row.directory)===0||scope.indexOf(root+row.directory)===0)names.unshift(row.cache);});names.push(used);Object.keys(s).forEach(function(id){if(names.indexOf(s[id].cache)<0)names.push(s[id].cache);});function next(){var n=names.shift();if(!n)return Promise.resolve(null);return caches.open(n).then(function(c){return c.match(u);}).then(function(r){return r||next();});}return next();});}
self.addEventListener('install',function(e){e.waitUntil(self.skipWaiting());});
self.addEventListener('activate',function(e){e.waitUntil(self.clients.claim());});
self.addEventListener('message',function(e){if(!e.data)return;if(e.data.type==='SKIP_WAITING')self.skipWaiting();if(e.data.type==='CACHE_USED'){
 var urls=e.data.urls||[],i=0;function next(){if(i>=urls.length)return Promise.resolve();var req=new Request(urls[i++]);if(!safe(req))return next();return caches.open(used).then(function(c){return c.match(key(req.url)).then(function(hit){if(hit)return;return fetch(req).then(function(r){if(r.ok&&!r.headers.has('set-cookie'))return c.put(key(req.url),r);});});}).catch(function(){}).then(next);}e.waitUntil(next());
}});
self.addEventListener('fetch',function(e){var req=e.request;if(!safe(req)||req.headers.get('X-App360-Download')==='1'||/\/data\/offline(?:\/|-)/.test(new URL(req.url).pathname))return;
 // A downloaded app uses its complete, consistent version until explicit update.
 e.respondWith(state().then(function(s){var u=key(req.url),scope=self.registration.scope,active=null;Object.keys(s).some(function(id){var row=s[id];if(u.indexOf(root+row.directory)===0||scope.indexOf(root+row.directory)===0){active=row;return true;}return false;});
 function online(){return fetch(req).then(function(r){if(r.ok&&r.status!==206){var copy=r.clone();e.waitUntil(caches.open(used).then(function(c){return c.put(key(req.url),copy);}).catch(function(){}));}else if(r.status===206){var h=new Headers(req.headers);h.delete('Range');e.waitUntil(fetch(new Request(req,{headers:h})).then(function(full){if(full.status===200)return caches.open(used).then(function(c){return c.put(key(req.url),full);});}).catch(function(){}));}return r;}).catch(function(){return stored(req).then(function(r){return r?mediaRange(req,r):new Response(req.mode==='navigate'?'هذا الجزء لم يُفتح أو يُنزّل بعد. اتصل بالإنترنت ثم افتحه من الصفحة الرئيسية.':'',{status:503,headers:{'Content-Type':'text/plain; charset=utf-8'}});});});}
 return active?caches.open(active.cache).then(function(c){return c.match(u);}).then(function(hit){return hit?mediaRange(req,hit):online();}):online();
 }));
});
})();
