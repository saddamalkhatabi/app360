'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert'),vm=require('vm');
const base=path.resolve(__dirname,'../apps/1-4/calm-with-me');
const read=p=>fs.readFileSync(path.join(base,p),'utf8');
const w={};vm.runInNewContext(read('data/content.js'),{window:w},{timeout:1000});vm.runInNewContext(read('child-illustrations-v1.js'),{window:w},{timeout:2000});
const c=w.APP360_CALM_CONTENT;
const expected={signals:19,feelings:14,helps:28,transitions:13};
Object.keys(expected).forEach(function(kind){
 assert.equal(c[kind].length,expected[kind],kind+' original source count must survive');
 c[kind].forEach(function(item){
  assert(item.image&&(item.image.indexOf('data:image/svg+xml')===0||/\.svg$/.test(item.image)),kind+':'+item.id+' is missing an illustrated scene');
  if(item.image.indexOf('data:image/svg+xml')===0){const content=decodeURIComponent(item.image.slice(item.image.indexOf(',')+1));assert(content.startsWith('<svg')&&content.includes('</svg>'),kind+':'+item.id+' is not SVG')}
 });
 assert.equal(w.APP360_CALM_VISUALS.counts[kind],expected[kind],kind+' coverage');
});
const child=read('simple-mode-v12-original.js'),page=read('index.html'),css=read('simple-mode-v12.css');
assert(!child.includes('عرض خيارات أكثر'),'remove unnecessary expandable choices');
assert(!child.includes('لعبة قصيرة بعد المساعدة'),'no separate game panel in child mode');
assert(child.includes('function loadMode(){return true}'),'all new visits start in child mode');
for(const id of ['simpleFeelingCards','simpleSignalCards','simpleHelpCards','simpleNowCards','simpleThenCards','simpleStep1','simpleStep2','simpleStep3'])assert(child.includes(id),id);
for(const id of ['calmCoachBtn','calmChildBtn','calmCoachLinks'])assert(page.includes('id="'+id+'"'),id);
assert(page.includes('child-illustrations-v1.js?v='),'load drawn image catalog before app code');
assert(page.indexOf('child-illustrations-v1.js')<page.indexOf('app.js?'),'image data comes before app init');
assert(css.includes('.simple-step[hidden]{display:none!important}'),'only active child stage visible');
for(const token of ['calm-child-welcome-v1.js','calm-bilingual-voice-v1.js','calm-silma-controller-serial-v1.js'])assert(page.includes(token),'voice runtime missing '+token);
const share=fs.readFileSync(path.resolve(__dirname,'../assets/js/app360-access-v1.js'),'utf8');
assert(share.includes('||currentApp())return'),'no sharing footer on app detail pages');
for(const f of ['child-illustrations-v1.js','simple-mode-v12-original.js','app.js','calm-child-welcome-v1.js'])new Function(read(f));
new Function(share);
const audio=JSON.parse(read('audio/bilingual/manifest.json'));
assert.equal(audio.choices.length,74);assert.equal(audio.phrases.length,109);
console.log('PASS all 74 original calm cards have pictures; toddler-only 3 stage UI and coach tools preserve original narration.');
