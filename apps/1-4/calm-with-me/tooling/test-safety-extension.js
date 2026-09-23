'use strict';
var fs=require('fs'),path=require('path'),vm=require('vm'),root=path.resolve(__dirname,'..'),repo=path.resolve(root,'../../..');
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
function repoRead(p){return fs.readFileSync(path.join(repo,p),'utf8')}
function assert(ok,msg){if(!ok){console.error('FAIL:',msg);process.exit(1)}}
var fakeDocument={getElementById:function(id){return id==='app360SafetyShortcuts'?{}:null}};
var sandbox={window:{},document:fakeDocument,setTimeout:setTimeout,clearTimeout:clearTimeout};
sandbox.window.document=fakeDocument;
vm.createContext(sandbox);
vm.runInContext(read('data/content.js'),sandbox,{filename:'content.js'});
vm.runInContext(read('data/emotion-library.js'),sandbox,{filename:'emotion-library.js'});
var before=(sandbox.window.APP360_EMOTION_LIBRARY.situations||[]).length;
assert(before===43,'expected 43 base situations, got '+before);
vm.runInContext(repoRead('assets/js/early-child-safety-v1.js'),sandbox,{filename:'early-child-safety-v1.js'});
var lib=sandbox.window.APP360_EMOTION_LIBRARY,list=lib.situations||[],ids={},i;
assert(list.length===48,'expected 48 situations after safety extension, got '+list.length);
for(i=0;i<list.length;i++){assert(!ids[list[i].id],'duplicate situation id '+list[i].id);ids[list[i].id]=1}
['thief-fear','lost-caregiver','door-noise','thunder-storm','unfamiliar-person','injury-blood'].forEach(function(id){assert(ids[id],'missing '+id)});
var thief=list.filter(function(x){return x.id==='thief-fear'})[0];
assert(thief.title_ar.indexOf('الحرامي')>=0&&thief.title_ar.indexOf('شخص غريب')>=0,'thief scenario not matured');
assert(thief.specific_ar.indexOf('لا تبحثوا عن الحرامي في الغرف')>=0,'thief scenario missing repeated-check boundary');
var fear=(lib.categories||[]).filter(function(x){return x.id==='fear'})[0];
assert(fear&&fear.avoid_ar.join(' ').indexOf('طقسًا متكررًا')>=0,'fear category missing repeated reassurance boundary');
assert(lib.reviewed_on==='2026-09-24','safety extension review date missing');
console.log('Early-child safety extension simulation PASSED: 43 base + 5 safety scenarios = 48, unique IDs, thief/stranger guidance and reassurance boundary verified.');
