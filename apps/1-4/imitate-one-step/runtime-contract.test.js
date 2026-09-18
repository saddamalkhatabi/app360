'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('app-v14.js','utf8');
test('reel cleanup helper exists when referenced',()=>{
  assert.ok(/clearReel\(\)/.test(src),'clearReel is referenced');
  assert.ok(/function\s+clearReel\s*\(/.test(src),'clearReel function must be defined');
});
test('v14 runtime parses',()=>{
  assert.doesNotThrow(()=>new Function(src));
});

test('detail runtime exposes next experience and drawing lab hooks',()=>{assert.ok(src.includes('nextExperience'));assert.ok(src.includes('openDrawingLab'));assert.ok(src.includes('feedbackPanel'))});

test('reel renderer and controller are both defined',()=>{assert.ok(/function\s+renderReel\s*\(/.test(src));assert.ok(/function\s+setupReel\s*\(/.test(src))});
