'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const app=fs.readFileSync('app-v16.js','utf8'),html=fs.readFileSync('index.html','utf8'),icons=JSON.parse(fs.readFileSync('icons/manifest.json','utf8')),sb=JSON.parse(fs.readFileSync('storyboards/manifest.json','utf8'));
test('001 has dedicated cover icon and human storyboard',()=>{assert.equal(icons.assets['001'],'icons/001.svg');assert.equal(sb.assets['001'],'storyboards/001-human-v2.svg');assert.ok(fs.existsSync('icons/001.svg'));assert.ok(fs.existsSync('storyboards/001-human-v2.svg'))});
test('runtime prefers cover icon and loads icon manifest',()=>{assert.ok(app.includes('var cover=covers[x.id]'));assert.ok(app.includes("fetch('icons/manifest.json?v=1'"))});
test('v16 shell is wired',()=>{assert.ok(html.includes('app-v16.js?v=1'));assert.ok(html.includes('styles-v16.css?v=1'))});