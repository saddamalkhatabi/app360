'use strict';
var fs=require('fs');
var path=require('path');
var vm=require('vm');
var root=path.resolve(__dirname,'..');
var repo=path.resolve(root,'../../..');
var failed=false;
function fail(msg){failed=true;console.error('FAIL:',msg)}
function ok(msg){console.log('OK:',msg)}
function read(rel){return fs.readFileSync(path.join(root,rel),'utf8')}
function repoRead(rel){return fs.readFileSync(path.join(repo,rel),'utf8')}
function existsFromApp(rel){return fs.existsSync(path.resolve(root,rel))}
var sandbox={window:{}};vm.createContext(sandbox);
try{vm.runInContext(read('data/content.js'),sandbox,{filename:'content.js'})}catch(e){fail('content.js cannot load: '+e.message)}
try{vm.runInContext(read('data/emotion-library.js'),sandbox,{filename:'emotion-library.js'})}catch(e){fail('emotion-library.js cannot load: '+e.message)}
var c=sandbox.window.APP360_CALM_CONTENT||{};
var lib=sandbox.window.APP360_EMOTION_LIBRARY||{};
var groups=['signals','feelings','helps','transitions'];
var ids={};
groups.forEach(function(group){var list=c[group];if(!Array.isArray(list)||!list.length){fail('missing content group '+group);return}list.forEach(function(item,i){if(!item.id)fail(group+'['+i+'] missing id');if(!item.label_ar)fail(group+'['+i+'] missing label_ar');var key=group+'|'+item.id;if(ids[key])fail('duplicate id '+key);ids[key]=1;if(item.image&&!existsFromApp(item.image))fail('missing image '+group+' '+item.id+' -> '+item.image)})});
if(!Array.isArray(c.age_bands)||c.age_bands.length!==4)fail('four age bands required in core content');else ok('four age bands in core content');
if(c.principles){if(!c.principles.no_inference)fail('no_inference principle must be true');if(!c.principles.skippable)fail('skippable principle must be true');if(!c.principles.no_forced_breathing)fail('no_forced_breathing principle must be true');if(!c.principles.no_scores)fail('no_scores principle must be true')}else fail('missing content principles');
if(!Array.isArray(lib.age_bands)||lib.age_bands.length!==4)fail('emotion school requires four age profiles');
if(!Array.isArray(lib.categories)||lib.categories.length<10)fail('emotion school requires at least ten categories');
if(!Array.isArray(lib.situations)||lib.situations.length<40)fail('emotion school requires at least forty base situations');else ok('base emotion school situations: '+lib.situations.length);
if(!Array.isArray(lib.behavior_clues)||lib.behavior_clues.length<16)fail('emotion school requires at least sixteen behavior clues');else ok('behavior clues: '+lib.behavior_clues.length);
if(!Array.isArray(lib.seek_help_ar)||lib.seek_help_ar.length<4)fail('professional escalation guide missing');
var seenSituations={};(lib.situations||[]).forEach(function(s,i){if(!s.id||!s.title_ar||!s.category||!Array.isArray(s.age_bands)||!s.age_bands.length)fail('invalid situation at '+i);if(seenSituations[s.id])fail('duplicate id '+s.id);seenSituations[s.id]=1;if(!s.say_ar||!Array.isArray(s.observe_ar)||!s.observe_ar.length)fail('situation missing observation/audio phrase '+s.id)});
var appJs=read('app.js');
var contentJs=read('data/content.js');
var libraryJs=read('data/emotion-library.js');
var ageJs=read('age-content-v8.js');
var schoolJs=read('emotion-school-v8.js');
var journeyJs=read('journey-v9.js');
var safetyJs=repoRead('assets/js/early-child-safety-v1.js');
var responsiveCss=repoRead('assets/css/app360-responsive-policy-v1.css');
var legacySources=[['app.js',appJs],['data/content.js',contentJs],['data/emotion-library.js',libraryJs],['age-content-v8.js',ageJs],['emotion-school-v8.js',schoolJs],['journey-v9.js',journeyJs],['early-child-safety-v1.js',safetyJs]];
legacySources.forEach(function(pair){var name=pair[0],src=pair[1];if(/\bconst\b/.test(src)||/\blet\b/.test(src)||/=>/.test(src)||/`/.test(src))fail(name+' contains syntax outside the ES5 legacy path');try{new Function(src);ok(name+' syntax')}catch(e){fail(name+' syntax: '+e.message)}});
var css=read('styles.css')+'\n'+read('emotion-school-v8.css')+'\n'+read('journey-v9.css')+'\n'+responsiveCss;if(/display\s*:\s*grid/i.test(css))fail('core CSS must not require CSS Grid');else ok('Flexbox-only core layout');
if(/\bclamp\s*\(|\binset\s*:|@container/i.test(responsiveCss))fail('responsive policy contains unsupported legacy CSS');else ok('responsive policy stays legacy-safe');
if(responsiveCss.indexOf('html.app360-legacy.app360-responsive body{font-size:16px!important')<0||responsiveCss.indexOf('min-height:48px')<0)fail('Big TAB typography/touch policy missing');else ok('Big TAB compact type + touch target policy');
['thief-fear','lost-caregiver','door-noise','thunder-storm','unfamiliar-person','injury-blood','app360SafetyShortcuts'].forEach(function(x){if(safetyJs.indexOf(x)<0)fail('early child safety layer missing '+x)});
if(safetyJs.indexOf('الشعور هو الخوف')<0||safetyJs.indexOf('لا تجعل فحص الأبواب أو الغرف')<0)fail('fear-vs-situation or reassurance boundary missing');else ok('fear/situation distinction + repeated-check boundary');
if(/pointerdown|pointerup|pointermove|PointerEvent/.test(appJs+schoolJs+journeyJs+safetyJs))fail('Pointer Events must not be required for the core practice');else ok('legacy click/touch-compatible path');
var html=read('index.html');['signalCards','helpCards','planPreview','nowPicker','thenPicker','plansList','libraryList','reviewOutcomeButtons','storageBanner','printArea','ageBandPicker','schoolView','schoolAgePicker','emotionScenarioList','behaviorClueList','seekHelpGuide','guidedJourney','journeyClues','journeyScenarioSuggestions','journeyHelpSuggestions','journeyNextOptions','journeyBuilder','journeyRunPanel','emotionExperimentList'].forEach(function(id){if(html.indexOf('id="'+id+'"')<0)fail('missing required UI id '+id)});
if(html.indexOf('calm-with-me-v9-20260923')<0)fail('connected journey base marker missing');
if(html.indexOf('data/emotion-library.js?v=9')<0||html.indexOf('age-content-v8.js?v=9')<0||html.indexOf('emotion-school-v8.js?v=9')<0||html.indexOf('journey-v9.js?v=9')<0)fail('connected emotion runtime files not loaded');
if(journeyJs.indexOf('sourceMap')<0||journeyJs.indexOf('clueMap')<0||journeyJs.indexOf('helpMap')<0||journeyJs.indexOf('experiments')<0||journeyJs.indexOf('toNowThen')<0)fail('connected knowledge-to-experiment journey missing');
if(journeyJs.indexOf('app360:a1-calm:journey-v1')<0)fail('journey local storage key missing');
['manifest.webmanifest','icon.svg','sw.js','package.json','app.json','emotion-school-v8.css','journey-v9.css','journey-v9.js'].forEach(function(rel){if(!fs.existsSync(path.join(root,rel)))fail('missing '+rel)});
try{var manifest=JSON.parse(read('manifest.webmanifest'));if(manifest.start_url!=='./index.html')fail('manifest start_url is not canonical');else ok('manifest')}catch(e){fail('manifest JSON: '+e.message)}
try{var contract=JSON.parse(read('app.json'));if(contract.id!=='a1-calm'||contract.slug!=='calm-with-me'||contract.age_group!=='1-4'||contract.version!==10)fail('app contract identity/version changed unexpectedly');else ok('stable app identity + maturity v10')}catch(e){fail('app.json: '+e.message)}
var sw=read('sw.js');if(sw.indexOf('app360-app-calm-with-me-v11')<0||sw.indexOf('emotion-school-v8.js?v=9')<0||sw.indexOf('data/emotion-library.js?v=9')<0||sw.indexOf('journey-v9.js?v=9')<0||sw.indexOf('app360-ai-shell.js?v=2')<0||sw.indexOf('app360-responsive-policy-v1.css?v=1')<0||sw.indexOf('early-child-safety-v1.js?v=1')<0)fail('service worker does not cache responsive/safety maturity layer');else ok('v9 journey base + v10 maturity + v11 offline cache');
if(!fs.existsSync(path.join(repo,'resources/early-child-visuals/manifest.json')))fail('shared visual resource manifest missing');else ok('shared visual resource pack');
if(failed){console.error('\ncalm-with-me validation FAILED');process.exit(1)}
console.log('\ncalm-with-me responsive safety maturity validation PASSED');
