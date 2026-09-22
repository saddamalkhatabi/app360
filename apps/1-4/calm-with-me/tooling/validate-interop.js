'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
function fail(msg){console.error('link-plan validation failed:',msg);process.exit(1)}
const index=read('index.html');
const planner=read('link-plan.html');
const js=read('link-plan-v5.js');
const entry=read('link-entry-v5.js');
const css=read('link-plan-v5.css');
const sw=read('sw.js');
const content=read('data/content.js');
try{new Function(js)}catch(e){fail('link-plan-v5.js syntax: '+e.message)}
try{new Function(entry)}catch(e){fail('link-entry-v5.js syntax: '+e.message)}
if(index.indexOf('calm-with-me-v5-20260923')<0)fail('main build v5 marker missing');
if(index.indexOf('link-entry-v5.js?v=5')<0)fail('main page does not route to isolated planner');
if(index.indexOf('interop-ui.js')>=0||index.indexOf('interop-enhancements')>=0)fail('old interop runtime must not load on main page');
if(planner.indexOf('calm-link-plan-v5-20260923')<0||planner.indexOf('link-plan-v5.js?v=5')<0)fail('isolated planner v5 files missing');
if(planner.indexOf('lpFrame')<0||planner.indexOf('lpTimer')<0||planner.indexOf('ابدأ الخطة الآن')<0)fail('planner execution UI incomplete');
if(js.indexOf('apps/1-4/say-and-name/index.html')<0||js.indexOf('apps/1-4/imitate-one-step/index.html')<0||js.indexOf('apps/1-4/screen-to-move/index.html')<0||js.indexOf('apps/1-4/drawing-writing-foundations/index.html')<0)fail('default 1-4 app links missing');
if(js.indexOf('https://yem1.com')<0)fail('Safe Reels 360 default link missing');
if(js.indexOf('setInterval')<0||js.indexOf('deadline')<0||js.indexOf('time-finished')<0)fail('timed automatic transition logic missing');
if(js.indexOf('custom_links')<0||js.indexOf('addManual')<0)fail('manual link library missing');
if(js.indexOf('history')<0||js.indexOf('run_id')<0||js.indexOf('exportData')<0)fail('execution recording/export missing');
if(js.indexOf('touchend')>=0||js.indexOf('preventDefault')>=0)fail('planner must not depend on touchend interception');
if(/\bconst\b|\blet\b|=>/.test(js)||/\bconst\b|\blet\b|=>/.test(entry))fail('legacy runtime requires ES5 syntax');
if(css.indexOf('display:grid')>=0||css.indexOf('inset:')>=0)fail('planner CSS must remain legacy-safe');
if(content.indexOf('interop-ui.js')>=0)fail('content dictionary must not load old interop');
if(sw.indexOf('app360-app-calm-with-me-v5')<0||sw.indexOf('link-plan.html')<0||sw.indexOf('link-plan-v5.js?v=5')<0)fail('service worker cache not upgraded to v5 planner');
console.log('calm-with-me isolated timed link planner v5 validation OK');
