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
function existsFromApp(rel){return fs.existsSync(path.resolve(root,rel))}
var sandbox={window:{}};vm.createContext(sandbox);
try{vm.runInContext(read('data/content.js'),sandbox,{filename:'content.js'})}catch(e){fail('content.js cannot load: '+e.message)}
var c=sandbox.window.APP360_CALM_CONTENT||{};
var groups=['signals','feelings','helps','transitions'];
var ids={};
groups.forEach(function(group){var list=c[group];if(!Array.isArray(list)||!list.length){fail('missing content group '+group);return}list.forEach(function(item,i){if(!item.id)fail(group+'['+i+'] missing id');if(!item.label_ar)fail(group+'['+i+'] missing label_ar');var key=group+'|'+item.id;if(ids[key])fail('duplicate id '+key);ids[key]=1;if(item.image&&!existsFromApp(item.image))fail('missing image '+group+' '+item.id+' -> '+item.image)})});
if(c.principles){if(!c.principles.no_inference)fail('no_inference principle must be true');if(!c.principles.skippable)fail('skippable principle must be true');if(!c.principles.no_forced_breathing)fail('no_forced_breathing principle must be true');if(!c.principles.no_scores)fail('no_scores principle must be true')}else fail('missing content principles');
var appJs=read('app.js');
var contentJs=read('data/content.js');
var legacySources=[['app.js',appJs],['data/content.js',contentJs]];
legacySources.forEach(function(pair){var name=pair[0],src=pair[1];if(/\bconst\b/.test(src)||/\blet\b/.test(src)||/=>/.test(src)||/`/.test(src))fail(name+' contains syntax outside the ES5 legacy path');try{new Function(src);ok(name+' syntax')}catch(e){fail(name+' syntax: '+e.message)}});
var css=read('styles.css');if(/display\s*:\s*grid/i.test(css))fail('core CSS must not require CSS Grid');else ok('Flexbox-only core layout');
if(/pointerdown|pointerup|pointermove|PointerEvent/.test(appJs))fail('Pointer Events must not be required for the core practice');else ok('Touch/click legacy activation path');
var html=read('index.html');['signalCards','helpCards','planPreview','nowPicker','thenPicker','plansList','libraryList','reviewOutcomeButtons','storageBanner','printArea'].forEach(function(id){if(html.indexOf('id="'+id+'"')<0)fail('missing required UI id '+id)});
['manifest.webmanifest','icon.svg','sw.js','package.json','app.json'].forEach(function(rel){if(!fs.existsSync(path.join(root,rel)))fail('missing '+rel)});
try{var manifest=JSON.parse(read('manifest.webmanifest'));if(manifest.start_url!=='./index.html')fail('manifest start_url is not canonical');else ok('manifest')}catch(e){fail('manifest JSON: '+e.message)}
try{var contract=JSON.parse(read('app.json'));if(contract.id!=='a1-calm'||contract.slug!=='calm-with-me'||contract.age_group!=='1-4')fail('app contract identity changed');else ok('stable app identity')}catch(e){fail('app.json: '+e.message)}
if(!fs.existsSync(path.join(repo,'resources/early-child-visuals/manifest.json')))fail('shared visual resource manifest missing');else ok('shared visual resource pack');
if(failed){console.error('\ncalm-with-me validation FAILED');process.exit(1)}
console.log('\ncalm-with-me validation PASSED');
