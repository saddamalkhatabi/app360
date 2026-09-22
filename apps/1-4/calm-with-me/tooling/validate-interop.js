'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const repo=path.resolve(root,'../../..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
function readRepo(p){return fs.readFileSync(path.join(repo,p),'utf8')}
function fail(msg){console.error('interop validation failed:',msg);process.exit(1)}
const ui=read('interop-ui.js');
const v3=read('interop-enhancements-v3.js');
const index=read('index.html');
const sw=read('sw.js');
const host=readRepo('assets/js/app-link-host.js');
try{new Function(ui)}catch(e){fail('interop-ui.js syntax: '+e.message)}
try{new Function(v3)}catch(e){fail('interop-enhancements-v3.js syntax: '+e.message)}
try{new Function(host)}catch(e){fail('app-link-host.js syntax: '+e.message)}
if(index.indexOf('calm-with-me-v3-20260922')<0)fail('build v3 marker missing');
if(index.indexOf('interop-ui.js?v=3')<0||index.indexOf('interop-enhancements-v3.js?v=3')<0)fail('explicit interop v3 scripts missing');
if(ui.indexOf('data/app-links-registry.json')<0)fail('registry path missing');
if(ui.indexOf('app360:interop:v1:events')<0)fail('shared event store missing');
if(ui.indexOf('launch_id')<0||ui.indexOf('return_to')<0)fail('launch context missing');
if(ui.indexOf('external_service')<0)fail('external service metadata missing');
if(ui.indexOf('app360_result')<0)fail('completion return handler missing');
if(/https?:\/\//i.test(ui))fail('hard-coded domain detected in interop-ui.js');
if(/\bconst\b|\blet\b|=>/.test(ui)||/\bconst\b|\blet\b|=>/.test(v3)||/\bconst\b|\blet\b|=>/.test(host))fail('legacy runtime requires ES5 syntax');
if(v3.indexOf('execution_history')<0||v3.indexOf('interop_events')<0)fail('full execution backup fields missing');
if(v3.indexOf('new-execution-cycle')<0)fail('repeat execution archive missing');
if(v3.indexOf("app360_result!=='cancelled'")<0)fail('cancelled return handling missing');
if(host.indexOf('العودة دون إكمال')<0||host.indexOf("app360_result='+encodeURIComponent(result")<0)fail('launch host cancel/return controls missing');
if(host.indexOf('inset:0')>=0)fail('legacy launch host must not depend on CSS inset');
if(sw.indexOf('app360-app-calm-with-me-v3')<0||sw.indexOf('interop-enhancements-v3.js?v=3')<0)fail('service worker cache not upgraded to v3');
console.log('calm-with-me interop build v3 validation OK');
