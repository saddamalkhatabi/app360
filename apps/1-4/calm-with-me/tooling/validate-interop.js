'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const repo=path.resolve(root,'../../..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
function readRepo(p){return fs.readFileSync(path.join(repo,p),'utf8')}
function fail(msg){console.error('interop validation failed:',msg);process.exit(1)}
const ui=read('interop-ui.js');
const simple=read('interop-enhancements-v3.js');
const content=read('data/content.js');
const sw=read('sw.js');
const host=readRepo('assets/js/app-link-host.js');
try{new Function(ui)}catch(e){fail('interop-ui.js syntax: '+e.message)}
try{new Function(simple)}catch(e){fail('guided flow syntax: '+e.message)}
try{new Function(host)}catch(e){fail('app-link-host.js syntax: '+e.message)}
if(ui.indexOf('app360_result')<0||ui.indexOf('app360_launch_id')<0)fail('simple return recorder missing');
if(ui.indexOf('event_verified')<0||ui.indexOf('interop_pending')<0)fail('execution verification missing');
if(simple.indexOf('simple-v4')<0)fail('guided simple flow marker missing');
if(simple.indexOf('خطة بسيطة من 3 خطوات')<0)fail('three-step guidance missing');
if(simple.indexOf('data-v4-activity')<0||simple.indexOf('data-v4-run')<0)fail('direct activity/run controls missing');
if(simple.indexOf('say-and-name/launch.html')<0||simple.indexOf('imitate-one-step/launch.html')<0||simple.indexOf('screen-to-move/launch.html')<0||simple.indexOf('drawing-writing-foundations/launch.html')<0)fail('quick activities must cover all four linked apps');
if(simple.indexOf('launch_id')<0||simple.indexOf('return_to')<0)fail('launch context missing from simple flow');
if(/https?:\/\//i.test(simple)||/https?:\/\//i.test(ui))fail('hard-coded domain detected');
if(/\bconst\b|\blet\b|=>/.test(simple)||/\bconst\b|\blet\b|=>/.test(ui)||/\bconst\b|\blet\b|=>/.test(host))fail('legacy runtime requires ES5 syntax');
if(content.indexOf('interop-ui.js')>=0)fail('content dictionary must not dynamically load interop scripts');
if(host.indexOf('أنجزنا النشاط')<0||host.indexOf('العودة دون إكمال')<0)fail('clear finish/cancel controls missing');
if(host.indexOf('inset:0')>=0)fail('legacy launch host must not depend on CSS inset');
if(sw.indexOf('app360-app-calm-with-me-v4')<0||sw.indexOf('interop-enhancements-v3.js?v=3')<0)fail('service worker cache not refreshed for simple flow v4');
console.log('calm-with-me guided interop v4 validation OK');
