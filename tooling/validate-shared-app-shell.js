'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
let failed=false,checked=0;
function fail(m){failed=true;console.error('FAIL:',m)}
function ok(m){console.log('OK:',m)}
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8')}
function exists(rel){return fs.existsSync(path.join(root,rel))}
function dirs(rel){const p=path.join(root,rel);return fs.existsSync(p)?fs.readdirSync(p,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name):[]}

const shell=read('assets/js/app360-ai-shell.js');
try{new Function(shell);ok('shared App360 shell parses')}catch(e){fail('shared shell syntax: '+e.message)}
if(/\bconst\b|\blet\b|=>|`/.test(shell))fail('shared shell must remain ES5 for legacy devices');
['app360HomeBtn','🏠 الرئيسية','repoHome','APP360_TOUCH_GUARD','touchstart','touchmove','touchend','touchcancel','stopImmediatePropagation','TOUCH_THRESHOLD','CLICK_BLOCK_MS'].forEach(x=>{if(shell.indexOf(x)<0)fail('shared shell missing '+x)});
if(shell.indexOf("position:fixed")<0||shell.indexOf("app360-legacy #app360HomeBtn")<0)fail('home button must support modern and legacy positioning');
if(shell.indexOf("p.indexOf('/apps/')")<0)fail('home resolver must derive repository root from /apps/ path');

const compat=read('assets/js/legacy-compat.js');
const pwa=read('assets/js/app-pwa.js');
const sharedAudio=exists('apps/1-4/drawing-writing-foundations/audio-v21.js')?read('apps/1-4/drawing-writing-foundations/audio-v21.js'):'';
if(compat.indexOf('app360-ai-shell.js')<0)fail('legacy-compat does not load shared shell');
if(pwa.indexOf('app360-ai-shell.js')<0)fail('app-pwa does not load shared shell');
if(sharedAudio&&sharedAudio.indexOf('app360-ai-shell.js')<0)fail('shared drawing/screen audio bridge does not load shared shell');

function entryHasShellRoute(html){
 if(html.indexOf('app360-ai-shell.js')>=0)return true;
 if(html.indexOf('legacy-compat.js')>=0&&compat.indexOf('app360-ai-shell.js')>=0)return true;
 if(html.indexOf('app-pwa.js')>=0&&pwa.indexOf('app360-ai-shell.js')>=0)return true;
 if(html.indexOf('audio-v21.js')>=0&&sharedAudio.indexOf('app360-ai-shell.js')>=0)return true;
 return false;
}

for(const age of dirs('apps')){
 if(age.charAt(0)==='_')continue;
 for(const slug of dirs('apps/'+age)){
  const manifest='apps/'+age+'/'+slug+'/app.json';
  if(!exists(manifest))continue;
  let app;try{app=JSON.parse(read(manifest))}catch(e){fail('invalid app.json '+manifest);continue}
  if(app.scaffold_state==='blueprint-only'||app.status==='planned'&&!exists('apps/'+age+'/'+slug+'/index.html'))continue;
  const entry=app.entry_path||('apps/'+age+'/'+slug+'/index.html');
  if(!exists(entry))continue;
  const html=read(entry);checked++;
  if(!entryHasShellRoute(html))fail('implemented app has no shared shell/home route: '+entry);
  else ok('home + legacy touch shell route: '+app.id+' ('+entry+')');
 }
}
if(!checked)fail('no implemented apps were checked');

const calmIndex=read('apps/1-4/calm-with-me/index.html');
if(calmIndex.indexOf('legacy-compat.js')<0)fail('calm-with-me must load legacy compatibility before interaction scripts');
const calmSw=read('apps/1-4/calm-with-me/sw.js');
if(calmSw.indexOf('app360-app-calm-with-me-v10')<0)fail('calm-with-me cache version must invalidate pre-touch-guard cache');
if(calmSw.indexOf('app360-ai-shell.js?v=2')<0)fail('calm-with-me offline shell must cache shared App360 shell');

if(failed){console.error('\nShared App360 shell validation FAILED');process.exit(1)}
console.log('\nShared App360 shell validation PASSED for '+checked+' implemented app(s).');
