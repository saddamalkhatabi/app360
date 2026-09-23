'use strict';
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');function read(p){return fs.readFileSync(path.join(root,p),'utf8')}function fail(m){console.error('calm separation validation failed:',m);process.exit(1)}
const index=read('index.html'),sw=read('sw.js'),app=JSON.parse(read('app.json')),journey=read('journey-v9.js');
if(index.indexOf('calm-with-me-v9-20260923')<0)fail('v9 marker missing');
if(index.indexOf('../plan-runner-360/index.html?v=1')<0||index.indexOf('مخطط التشغيل 360')<0)fail('external planner link missing');
if(index.indexOf('scenario-engine-v6.js')>=0||index.indexOf('scenarioLab')>=0||index.indexOf('scenarioRunner')>=0)fail('cross-app scenario engine must remain separated from calm app');
if(index.indexOf('nowPicker')<0||index.indexOf('thenPicker')<0)fail('calm-specific visual now/then card must remain');
if(index.indexOf('schoolView')<0||index.indexOf('مدرسة المشاعر')<0||index.indexOf('guidedJourney')<0)fail('emotion school and connected journey must remain inside calm app');
if(journey.indexOf('toNowThen')<0||journey.indexOf('emotionExperimentList')<0)fail('emotion experiment to now/then bridge missing');
if(app.interoperability&&app.interoperability.embedded_planner!==false)fail('planner must not be embedded in calm app');
if(sw.indexOf('app360-app-calm-with-me-v9')<0||sw.indexOf('scenario-engine-v6')>=0||sw.indexOf('app-links-registry')>=0)fail('calm service worker must remain separated from cross-app planner assets');
console.log('calm-with-me v9 planner separation + connected emotion journey validation OK');
