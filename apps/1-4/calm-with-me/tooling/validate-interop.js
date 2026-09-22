'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
function fail(msg){console.error('scenario validation failed:',msg);process.exit(1)}
const index=read('index.html');
const scenario=read('scenario-engine-v6.js');
const redirect=read('link-plan.html');
const sw=read('sw.js');
const content=read('data/content.js');
try{new Function(scenario)}catch(e){fail('scenario-engine-v6.js syntax: '+e.message)}
if(index.indexOf('calm-with-me-v6-20260923')<0)fail('main build v6 marker missing');
if(index.indexOf('scenario-engine-v6.js?v=6')<0||index.indexOf('scenarioLab')<0||index.indexOf('scenarioRunner')<0)fail('integrated scenario UI missing');
if(index.indexOf('link-entry-v5.js')>=0||index.indexOf('interop-ui.js')>=0||index.indexOf('interop-enhancements')>=0)fail('old separate interop runtime must not load');
if(index.indexOf('data-view="transition"')<0||index.indexOf('الخطط والتجارب')<0)fail('scenario planner must remain inside main application navigation');
if(redirect.indexOf('index.html?open=scenarios&v=6')<0)fail('old planner URL must redirect into integrated scenario view');
if(scenario.indexOf('case_id')<0||scenario.indexOf('scenario_id')<0||scenario.indexOf('template_id')<0||scenario.indexOf('run_id')<0)fail('case/scenario/template/run model missing');
if(scenario.indexOf('data/app-links-registry.json')<0||scenario.indexOf('routeItems')<0||scenario.indexOf('collection_kind')<0)fail('deep-link service catalog reader missing');
if(scenario.indexOf('https://yem1.com')<0)fail('Safe Reels 360 must be available in scenario services');
if(scenario.indexOf('embedded')<0||scenario.indexOf('launch_id')<0||scenario.indexOf('app360:interop:v1:events')<0)fail('embedded execution tracking missing');
if(scenario.indexOf('duration_sec')<0||scenario.indexOf('setInterval')<0||scenario.indexOf('auto_advance')<0)fail('timed scenario transitions missing');
if(scenario.indexOf('saveTemplate')<0||scenario.indexOf('useTemplate')<0||scenario.indexOf('duplicateScenario')<0)fail('repeatable scenario patterns missing');
if(scenario.indexOf('touchend')>=0||scenario.indexOf('preventDefault')>=0)fail('scenario planner must not intercept touchend');
if(/\bconst\b|\blet\b|=>/.test(scenario))fail('scenario runtime requires ES5 syntax');
if(content.indexOf('interop-ui.js')>=0)fail('content dictionary must not load old interop');
if(sw.indexOf('app360-app-calm-with-me-v6')<0||sw.indexOf('scenario-engine-v6.js?v=6')<0||sw.indexOf('../imitate-one-step/experiences.json')<0)fail('service worker cache not upgraded for scenario v6');
console.log('calm-with-me integrated case/scenario deep-link planner v6 validation OK');
