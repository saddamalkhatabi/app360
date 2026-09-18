'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const js=fs.readFileSync('app-v16.js','utf8');
const css=fs.readFileSync('styles-v16.css','utf8');
const html=fs.readFileSync('index.html','utf8');

test('runtime distinguishes compact single frame from wide overview',()=>{
  assert.ok(js.includes("reel.className='reel frame-active'"));
  assert.ok(js.includes("reel.className='reel overview-active'"));
});
test('landscape single frame is capped while overview expands',()=>{
  assert.ok(css.includes('.reel.frame-active'));
  assert.ok(css.includes('max-width:620px'));
  assert.ok(css.includes('.reel.overview-active'));
  assert.ok(css.includes('max-width:1160px'));
});
test('overview keeps five-to-one layout',()=>{
  assert.ok(css.includes('.reel.overview-active .reel-viewport.overview-mode'));
  assert.ok(css.includes('aspect-ratio:5/1'));
});
test('v16 assets are wired',()=>{
  assert.ok(html.includes('app-v16.js?v=5'));
  assert.ok(html.includes('styles-v16.css?v=4'));
});