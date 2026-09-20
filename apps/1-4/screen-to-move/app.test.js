'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const games=require('./games-data.js');

test('library has exactly 20 original experiments',()=>{
  assert.equal(games.length,20);
  assert.equal(new Set(games.map(g=>g.id)).size,20);
});

test('four levels have five experiments each',()=>{
  for(let level=1;level<=4;level++){
    assert.equal(games.filter(g=>g.level===level).length,5);
  }
});

test('every experiment can render five visual steps and a worksheet',()=>{
  for(const g of games){
    assert.match(g.id,/^G\d{2}$/);
    assert.ok(g.title && g.topic && g.icon && g.type);
    assert.equal(g.frames.length,5);
    assert.ok(Array.isArray(g.materials) && g.materials.length>=1);
    assert.ok(Array.isArray(g.symbols) && g.symbols.length>=1);
  }
});

test('screen challenge types are from the supported engine set',()=>{
  const supported=new Set(['choice','match','sort','dots','path','pattern','memory','draw','order','puzzle','create']);
  for(const g of games) assert.ok(supported.has(g.type),g.id+' unsupported type');
});
