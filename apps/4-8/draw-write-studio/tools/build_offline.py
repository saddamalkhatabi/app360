import json,pathlib
ROOT=pathlib.Path(__file__).resolve().parents[1]
repo=ROOT.parents[2]
core=['./','index.html','styles.css?v=1','app.js?v=1','src/model.js?v=1','data/content.js?v=1','data/content.json','data/read-along.json?v=1','manifest.webmanifest','icon.svg','icon-192.png','icon-512.png','assets/studio.svg','../../../packages/pencil-core/browser.js?v=1','../../../assets/css/app360-read-along-v1.css?v=1','../../../assets/js/app360-read-along-v1.js?v=2','../../../assets/js/app-pwa.js?v=3','../../../assets/js/app360-ai-shell.js?v=106&brand=98','../../../assets/css/app360-responsive-policy-v1.css?v=1','../../../assets/js/app360-family-sync-v1.js?v=106','../../../assets/js/app360-family-core-v2.js?v=106&brand=98','../../../assets/js/app360-family-catalog-v1.js?v=103&brand=98','../../../assets/js/app360-peer-media-bootstrap-v1.js?v=1','../../../assets/js/app360-session-v1.js?v=98&brand=98','../../../assets/js/app360-account-access-v1.js?v=2&brand=98','../../../assets/js/app360-login-entry-v2.js?v=2','../../../assets/js/app360-usage-daily-v1.js?v=1','../../../assets/js/early-child-safety-v1.js?v=1','../../../assets/js/ai-account-bridge-v1.js?v=1','../../../data/catalog.json','../../../data/live-overrides.json']
shared=[]
for file in (repo/'assets/js').glob('app360-family-*.js'):shared.append('../../../assets/js/'+file.name)
shared+=['../../../assets/js/family-reels-v1.js','../../../assets/js/app360-app-audience-v1.js']
core += shared
core += [x['path'] for x in json.loads((ROOT/'data/audio-manifest.json').read_text())['items']]
for f in core:
    assert (ROOT/f.split('?')[0]).resolve().exists(),f
header='var CACHE="a4-draw-write-preview-1";\nvar CORE='+json.dumps(core,separators=(',',':'))+';\n'
body='''function addBatch(c,i){if(i>=CORE.length)return Promise.resolve();return c.addAll(CORE.slice(i,i+3)).then(function(){return addBatch(c,i+3)})}
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return addBatch(c,0).then(function(){return c.put('./offline-ready.json',new Response('{"ready":true}',{headers:{'Content-Type':'application/json'}}))})}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.filter(function(k){return k.indexOf('a4-draw-write-')===0&&k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener('fetch',function(e){var u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin)return;if(e.request.mode==='navigate'&&u.pathname.indexOf('/draw-write-studio/')<0)return;e.respondWith(caches.open(CACHE).then(function(c){if(e.request.mode==='navigate')return fetch(e.request).then(function(r){if(r.ok)c.put(e.request,r.clone());return r}).catch(function(){return c.match(e.request,{ignoreSearch:true}).then(function(hit){return hit||c.match('index.html')})});return c.match(e.request).then(function(hit){return hit||fetch(e.request).then(function(r){if(r.ok)c.put(e.request,r.clone());return r}).catch(function(){return c.match(e.request,{ignoreSearch:true}).then(function(r){return r||new Response('',{status:503})})})})}))});
self.addEventListener('message',function(e){if(e.data&&e.data.type==='SKIP_WAITING')self.skipWaiting()});
'''
(ROOT/'sw.js').write_text(header+body)
print('Offline core:',len(core),'files')
