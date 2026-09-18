'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync('index.html','utf8');
const js=fs.readFileSync('app-v13.js','utf8');

test('required header controls exist in HTML',()=>{
  ['libraryBtn','helpersBtn','drawingBtn','historyBtn','settingsBtn','sheet','practiceRoot'].forEach(id=>{
    assert.ok(html.includes('id="'+id+'"'), 'missing DOM id '+id);
  });
});

test('header binding is defensive against missing optional controls',()=>{
  assert.ok(js.includes("b=el('drawingBtn');if(b)b.onclick=openDrawingLab"));
  assert.ok(js.includes("var sh=el('sheet');if(e.key==='Escape'&&sh&&!sh.hidden)"));
});

test('index points to v13 runtime',()=>{
  assert.ok(html.includes('app-v13.js?v=1'));
});
