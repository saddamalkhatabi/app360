 'use strict';
const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');
const games=require('./games-data.js');

test('library has exactly 70 creative games',()=>{
  assert.equal(games.length,70);
  assert.equal(new Set(games.map(g=>g.id)).size,70);
});

test('four readiness levels are balanced across all 70 games',()=>{
  const expected={1:18,2:18,3:17,4:17};
  for(let level=1;level<=4;level++) assert.equal(games.filter(g=>g.level===level).length,expected[level]);
});

test('the 50-game expansion is present from G21 through G70',()=>{
  for(let n=21;n<=70;n++){
    const id='G'+String(n).padStart(2,'0');
    assert.ok(games.some(g=>g.id===id),id+' missing');
  }
});

test('every game has five visual steps, paper materials and supported direct play data',()=>{
  const supported=new Set(['choice','match','sort','dots','path','pattern','memory','draw','order','puzzle','create']);
  for(const g of games){
    assert.match(g.id,/^G\d{2}$/);
    assert.ok(g.title && g.topic && g.icon && g.type);
    assert.ok(supported.has(g.type),g.id+' unsupported type');
    assert.equal(g.frames.length,5,g.id+' must have five frames');
    assert.ok(Array.isArray(g.materials) && g.materials.length>=1,g.id+' needs materials');
    assert.ok(Array.isArray(g.symbols) && g.symbols.length>=1,g.id+' needs symbols');
    if(g.type==='choice'||g.type==='pattern'){assert.ok(Array.isArray(g.options)&&g.options.length>=2);assert.ok(Number.isInteger(g.answer));}
    if(g.type==='match') assert.ok(Array.isArray(g.pairs)&&g.pairs.length>=2);
    if(g.type==='sort'){assert.ok(Array.isArray(g.bins)&&g.bins.length>=2);assert.ok(Array.isArray(g.items)&&g.items.length>=2);}
    if(g.type==='memory') assert.ok(Array.isArray(g.cards)&&g.cards.length>=2);
    if(g.type==='order') assert.ok(Array.isArray(g.order)&&g.order.length>=3);
    if(g.type==='dots') assert.ok(Array.isArray(g.points)&&g.points.length>=3);
    if(g.type==='path') assert.ok(Array.isArray(g.path)&&g.path.length>=4);
  }
});

test('wide screens default to all five steps and compact screens autoplay then overview',()=>{
  const js=fs.readFileSync('./app.js','utf8');
  const css=fs.readFileSync('./styles.css','utf8');
  assert.match(js,/function compactReel\(\)/);
  assert.match(js,/if\(compactReel\(\)\)\{show\(0\);play\(\)\}else showOverview\(\)/);
  assert.match(js,/function showOverview\(\)/);
  assert.match(js,/reelPrev/);
  assert.match(js,/reelNext/);
  assert.match(css,/v4: five-step default overview/);
  assert.match(css,/\.reel-stage \.reel-overview\{display:flex/);
});

test('round result and shared name audio integration remain present',()=>{
  const js=fs.readFileSync('./app.js','utf8');
  const html=fs.readFileSync('./index.html','utf8');
  assert.match(js,/function resultText\(\)/);
  assert.match(js,/function speakCheer\(\)/);
  assert.match(html,/Audio360Base/);
  assert.match(html,/drawing-writing-foundations\/audio-v21\.js/);
});

test('title and library counts communicate screen or paper play',()=>{
  const html=fs.readFileSync('./index.html','utf8');
  const js=fs.readFileSync('./app.js','utf8');
  assert.match(html,/ألعاب إبداعية عبر الشاشة — أو بدون الشاشة/);
  assert.match(js,/var list=currentGames\(\),total=GAMES\.length/);
  assert.match(js,/downloadPack/);
});
