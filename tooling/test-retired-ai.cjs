'use strict';
const fs=require('fs'),path=require('path'),assert=require('node:assert/strict'),vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const removed=['assets/js/ai-content-studio.js','assets/js/ai-account-bridge-v1.js','apps/1-4/say-and-name/ai-native-adapter.js','services/app360-data-core/scripts/import-bundle.js','services/app360-data-core/src/contracts.js','data/ai-content-contracts.json'];
for(const p of removed)assert(!fs.existsSync(path.join(root,p)),p+' must be removed');
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
for(const base of ['apps','assets/js'])for(const file of walk(path.join(root,base))){
 if(!/\.(js|html)$/.test(file))continue;
 const s=fs.readFileSync(file,'utf8');
 assert(!/ai-content-studio|ai-account-bridge|ai-native-adapter|APP360_AI_CONTENT|APP360_AI_WORD_IMAGES/.test(s),'retired runtime reference: '+file);
}
const code=fs.readFileSync(path.join(root,'assets/js/app360-ai-shell.js'),'utf8');
assert(!/\bconst\b|\blet\b|=>|`/.test(code),'shared shell retains ES5 syntax');
for(const pathname of ['/repo/apps/1-4/say-and-name/index.html','/repo/apps/4-8/wonder-experiment-lab/index.html']){
 const nodes={},pending=[],listeners={};
 const parent={appendChild(n){nodes[n.id]=n;n.parentNode=this;return n;}};
 const d={readyState:'complete',head:parent,body:parent,documentElement:{className:''},getElementById:id=>nodes[id]||null,getElementsByTagName:()=>[parent],createElement:tag=>({tagName:tag,style:{},setAttribute(k,v){this[k]=v;}}),addEventListener(n,f){listeners[n]=f;}};
 const w={navigator:{userAgent:'Android 4.4'},location:{pathname,search:'',href:''},CSS:{supports:()=>false}};w.parent=w;
 vm.runInNewContext(code,{window:w,document:d,Date,Math});
 w.APP360_AI_SHELL.refresh();
 assert(nodes.app360HomeBtn,'home button retained');nodes.app360HomeBtn.onclick();assert.equal(w.location.href,'/repo/index.html');
 for(const id of ['app360SessionRuntime','app360AccountAccess','app360LoginEntry','app360FamilySync','app360DailyUsage'])assert(nodes[id],id+' retained');
 assert(w.APP360_TOUCH_GUARD,'legacy touch guard retained');
 assert(!Object.values(nodes).some(n=>/ai-content-studio|ai-account-bridge/.test(n.src||'')),'no generator script injection on init or refresh');
 assert(!nodes.app360AiBtn,'no AI button');
}
const scaffold=fs.readFileSync(path.join(root,'tooling/scaffold-app.js'),'utf8');assert(!/ai.content-import|ai-content-contracts/.test(scaffold),'new apps cannot re-enable retired generator');
const repo=require('../services/app360-data-core/src/repository');assert.equal(repo.importAiBundle,undefined);assert.equal(repo.createGenerationRequest,undefined);assert.equal(typeof repo.startSession,'function');
assert(fs.existsSync(path.join(root,'services/app360-data-core/migrations/004_ai_imports.js')),'historical migration retained');
console.log('PASS: retired generator has no runtime/import/scaffold entry; home, accounts, legacy touch and session APIs retained.');
