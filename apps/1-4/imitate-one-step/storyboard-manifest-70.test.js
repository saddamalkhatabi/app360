'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'storyboards/manifest.json'),'utf8'));
const expected=Array.from({length:220},(_,i)=>String(i+1).padStart(3,'0'));
test('storyboard manifest maps exactly experiments 001-220',()=>{
  const actual=Object.keys(manifest.assets).sort((a,b)=>Number(a)-Number(b));
  assert.deepEqual(actual,expected);
  assert.equal(actual.length,220);
});
test('all mapped storyboard files 001-220 exist and are non-empty',()=>{
  for(const id of expected){
    const file=path.join(__dirname,manifest.assets[id]);
    assert.ok(fs.existsSync(file),'missing '+id+' -> '+manifest.assets[id]);
    if(file.endsWith('.svg'))assert.ok(fs.readFileSync(file,'utf8').includes('</svg>'),'invalid diagram '+id);else assert.ok(fs.statSync(file).size>10000,'empty image '+id);
  }
});
test('runtime requests cache-busted storyboard manifest',()=>{
  const js=fs.readFileSync(path.join(__dirname,'app-v16.js'),'utf8');
  assert.ok(js.includes('storyboards/manifest.json?v=20261022'));
});
