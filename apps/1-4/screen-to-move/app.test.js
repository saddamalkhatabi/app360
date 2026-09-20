'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const games=require('./games-data.js');
const dir=__dirname;
function read(name){return fs.readFileSync(path.join(dir,name),'utf8')}

test('library has exactly 20 original experiments',()=>{
  assert.equal(games.length,20);
  assert.equal(new Set(games.map(g=>g.id)).size,20);
});

test('four levels have five experiments each',()=>{
  for(let level=1;level<=4;level++) assert.equal(games.filter(g=>g.level===level).length,5);
});

test('every experiment has five visual steps and paper materials',()=>{
  for(const g of games){
    assert.match(g.id,/^G\d{2}$/);
    assert.ok(g.title&&g.topic&&g.icon&&g.type);
    assert.equal(g.frames.length,5);
    assert.ok(Array.isArray(g.materials)&&g.materials.length>=1);
    assert.ok(Array.isArray(g.symbols)&&g.symbols.length>=1);
  }
});

test('screen challenge types are covered by the direct-play engine',()=>{
  const supported=new Set(['choice','match','sort','dots','path','pattern','memory','draw','order','puzzle','create']);
  for(const g of games) assert.ok(supported.has(g.type),g.id+' unsupported type');
});

test('visual player no longer relies on the fragile 500 percent reel transform',()=>{
  const js=read('app.js'),css=read('styles.css');
  assert.match(js,/reelSingle/);
  assert.match(js,/reelPrev/);
  assert.match(js,/reelNext/);
  assert.match(js,/reelOverview/);
  assert.doesNotMatch(css,/width\s*:\s*500%/);
  assert.doesNotMatch(js,/translate3d\(/);
});

test('round result and shared name audio integration are present',()=>{
  const js=read('app.js'),html=read('index.html'),contract=JSON.parse(read('app.json'));
  assert.match(js,/resultText/);
  assert.match(js,/scoreAttempt/);
  assert.match(js,/pk_user_name/);
  assert.match(html,/Audio360Base/);
  assert.match(html,/drawing-writing-foundations\/audio-v21\.js/);
  assert.equal(contract.status,'live');
  assert.ok(contract.capabilities.includes('audio.recorded'));
  assert.ok(contract.capabilities.includes('evaluation.heuristic'));
});

test('title and progression communicate screen or paper play',()=>{
  const html=read('index.html');
  assert.match(html,/ألعاب إبداعية عبر الشاشة/);
  assert.match(html,/سنة حتى 7/);
});
