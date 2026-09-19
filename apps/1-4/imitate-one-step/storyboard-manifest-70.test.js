'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const manifest=JSON.parse(fs.readFileSync(path.join(__dirname,'storyboards/manifest.json'),'utf8'));
const expected=Array.from({length:70},(_,i)=>String(i+1).padStart(3,'0'));
test('storyboard manifest maps exactly experiments 001-070',()=>{
  assert.deepEqual(Object.keys(manifest.assets),expected);
  assert.equal(Object.keys(manifest.assets).length,70);
});
test('all storyboard files 001-070 exist and are non-empty',()=>{
  for(const id of expected){
    const file=path.join(__dirname,manifest.assets[id]);
    assert.ok(fs.existsSync(file),'missing '+id);
    assert.ok(fs.statSync(file).size>10000,'empty or invalid '+id);
  }
});
test('runtime requests cache-busted storyboard manifest',()=>{
  const js=fs.readFileSync(path.join(__dirname,'app-v16.js'),'utf8');
  assert.ok(js.includes('storyboards/manifest.json?v=6'));
});
