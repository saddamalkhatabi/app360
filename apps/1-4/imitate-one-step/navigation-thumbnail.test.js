'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const js=fs.readFileSync('app-v16.js','utf8');const html=fs.readFileSync('index.html','utf8');const manifest=JSON.parse(fs.readFileSync('storyboards/manifest.json','utf8'));
test('previous and next experience navigation are both wired',()=>{assert.ok(js.includes('function previousExperienceId'));assert.ok(js.includes('goPreviousExperience'));assert.ok(js.includes('previousExperienceBottom'));assert.ok(js.includes('goNextExperience'))});
test('cards use storyboard first-frame thumbnails when available',()=>{assert.ok(js.includes('function cardVisual(x)'));assert.ok(js.includes('card-thumb-frame'));assert.equal(manifest.assets['001'],'storyboards/001.webp')});
test('index points to v16 runtime and style',()=>{assert.ok(html.includes('app-v16.js?v=6'));assert.ok(html.includes('styles-v16.css?v=4'))});
