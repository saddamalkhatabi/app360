'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('app-v8.js','utf8');
test('reel cleanup helper exists when referenced',()=>{
  assert.ok(/clearReel\(\)/.test(src),'clearReel is referenced');
  assert.ok(/function\s+clearReel\s*\(/.test(src),'clearReel function must be defined');
});
test('v8 runtime parses',()=>{
  assert.doesNotThrow(()=>new Function(src));
});
