'use strict';
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');let failed=false;
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
function exists(p){return fs.existsSync(path.join(root,p))}
function fail(m){failed=true;console.error('FAIL:',m)}function ok(m){console.log('OK:',m)}
const required=['assets/js/app360-usage-daily-v1.js','assets/js/app360-portal-usage-v1.js','assets/js/app360-ai-shell.js','index.html','ages/1-4/index.html'];required.forEach(p=>{if(!exists(p))fail('missing '+p)});
const daily=read('assets/js/app360-usage-daily-v1.js'),portal=read('assets/js/app360-portal-usage-v1.js'),shell=read('assets/js/app360-ai-shell.js'),home=read('index.html'),age=read('ages/1-4/index.html');
[['daily tracker',daily],['portal usage',portal]].forEach(p=>{if(/\bconst\b|\blet\b|=>|`/.test(p[1]))fail(p[0]+' must remain ES5');try{new Function(p[1]);ok(p[0]+' parses')}catch(e){fail(p[0]+' syntax '+e.message)}});
['app360:usage-daily:v1','visibilitychange','age_group','user:','active_seconds','opens'].forEach(x=>{if(daily.indexOf(x)<0)fail('daily tracker missing '+x)});
['اليوم','7 أيام','30 يومًا','هذا الشهر','كل الوقت','type="date"','a360-usage-track','a360-usage-fill','portalUsageBtn','app360PortalUsagePanel'].forEach(x=>{if(portal.indexOf(x)<0)fail('usage dashboard missing '+x)});
if(shell.indexOf('app360-usage-daily-v1.js?v=1')<0)fail('shared shell does not load daily tracker');
if(shell.indexOf('#app360ActivityBtn{left:10px!important;bottom:72px!important')<0)fail('account/activity button is not stacked above AI');
if(shell.indexOf('#app360AiBtn{left:10px!important;bottom:12px!important')<0)fail('AI button layout rule missing');
[home,age].forEach((html,i)=>{if(html.indexOf('portalUsageBtn')<0||html.indexOf('app360-portal-usage-v1.js?v=1')<0)fail((i?'age':'home')+' portal missing usage control')});
if(failed){console.error('\nUsage dashboard validation FAILED');process.exit(1)}console.log('\nUsage dashboard validation PASSED');
