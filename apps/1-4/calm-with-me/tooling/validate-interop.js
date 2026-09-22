const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
function fail(msg){console.error('interop validation failed:',msg);process.exit(1)}
const ui=read('interop-ui.js');
const content=read('data/content.js');
const sw=read('sw.js');
try{new Function(ui)}catch(e){fail('interop-ui.js syntax: '+e.message)}
if(content.indexOf("interop-ui.js?v=2")<0)fail('content.js does not load interop-ui.js');
if(ui.indexOf("data/app-links-registry.json")<0)fail('registry path missing');
if(ui.indexOf("app360:interop:v1:events")<0)fail('shared event store missing');
if(ui.indexOf("launch_id")<0||ui.indexOf("return_to")<0)fail('launch context missing');
if(ui.indexOf("external_service")<0)fail('external service metadata missing');
if(ui.indexOf("app360_result")<0)fail('completion return handler missing');
if(/https?:\/\//i.test(ui))fail('hard-coded domain detected in interop-ui.js');
if(/\bconst\b|\blet\b|=>/.test(ui))fail('legacy runtime requires ES5 syntax');
if(sw.indexOf("app360-app-calm-with-me-v2")<0||sw.indexOf("interop-ui.js?v=2")<0)fail('service worker cache not upgraded');
console.log('calm-with-me interop validation OK');
