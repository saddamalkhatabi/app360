'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const js=fs.readFileSync('app-v14.js','utf8');const html=fs.readFileSync('index.html','utf8');const manifest=JSON.parse(fs.readFileSync('storyboards/manifest.json','utf8'));
test('previous and next experience navigation are both wired',()=>{assert.ok(js.includes('function previousExperienceId'));assert.ok(js.includes('goPreviousExperience'));assert.ok(js.includes('previousExperienceBottom'));assert.ok(js.includes('goNextExperience'))});
test('cards use storyboard first-frame thumbnails when available',()=>{assert.ok(js.includes('function cardVisual(x)'));assert.ok(js.includes('card-thumb-frame'));assert.equal(manifest.assets['001'],'storyboards/001-human-hq.svg')});
test('index points to v14 runtime and style',()=>{assert.ok(html.includes('app-v14.js?v=1'));assert.ok(html.includes('styles-v13.css?v=1'))});