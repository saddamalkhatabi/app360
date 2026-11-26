const assert = require('node:assert/strict');
const test = require('node:test');
const G = require('../src/workshop-model.js');
const { levels, missions } = require('../src/workshop-content.js');

function byId(id) { return missions.find(mission => mission.id === id); }

function solved(mission, angle = mission.plannedAngle) {
  const draft = G.create(mission);
  if (mission.stock) G.makeCut(mission, draft, angle);
  for (const position of mission.solution) {
    Object.assign(draft.pieces.find(piece => piece.id === position.id), position, { placed: true });
  }
  return draft;
}

test('all workshop projects have complete, exact solutions and meaningful starting states', () => {
  assert.equal(levels.length, 4);
  assert.equal(missions.length, 16);
  assert.equal(new Set(missions.map(mission => mission.id)).size, missions.length);
  for (const mission of missions) {
    assert.equal(G.evaluate(mission, G.create(mission)).coverage, 0, mission.id);
    const result = G.evaluate(mission, solved(mission));
    assert.equal(result.ok, true, mission.id);
    assert.equal(result.coverage, 100, mission.id);
  }
});

test('coverage reports gaps, shared area and outside separately', () => {
  const mission = byId('courtyard');
  const draft = solved(mission);
  draft.pieces[1].x -= 40;
  let result = G.evaluate(mission, draft);
  assert.equal(result.ok, false);
  assert.ok(result.missing > 0);
  assert.ok(result.overlap.length > 0);
  assert.equal(result.outside, 0);

  draft.pieces[1].x = 360;
  result = G.evaluate(mission, draft);
  assert.ok(result.outside > 0);
  assert.equal(result.overlap.length, 0);

  // Coverage counts the union once even when a third tile crosses already covered ground.
  draft.pieces[0].placed = false;
  draft.pieces.forEach(piece => { if (piece.placed) Object.assign(piece, { x: 240, y: 100 }); });
  result = G.evaluate(mission, draft);
  assert.equal(result.missing, result.total - 120 * 60);
});

test('different piece orders can solve the angle by geometry', () => {
  const mission = byId('obtuse');
  const draft = solved(mission);
  draft.pieces[0].angle = 30;
  draft.pieces[1].angle = 0;
  assert.equal(G.evaluate(mission, draft).ok, true);
  draft.pieces[0].angle = 15;
  const result = G.evaluate(mission, draft);
  assert.equal(result.angleSum, 120);
  assert.equal(result.ok, false);
  assert.ok(result.overlap.length);
  assert.ok(result.missing > 0);
});

test('all three cuts conserve tile area, expose both pieces, and block repeated cuts', () => {
  for (const mission of missions.filter(item => item.stock)) {
    for (const angle of mission.stock.angles) {
      const draft = G.create(mission);
      assert.equal(G.evaluate(mission, draft).needsCut, true);
      assert.equal(G.makeCut(mission, draft, angle), true);
      assert.equal(G.makeCut(mission, draft, angle), false);
      const pieces = draft.pieces.filter(piece => piece.id.startsWith('cut-'));
      assert.equal(pieces.length, 2);
      assert.ok(Math.abs(pieces.reduce((sum, piece) => sum + G.area(piece.poly), 0) -
        G.area(mission.stock.poly)) < G.epsilon);
    }
  }
  const mission = byId('final');
  assert.equal(G.evaluate(mission, solved(mission, 45)).ok, false);
  const partial = solved(mission);
  partial.pieces.find(piece => piece.id === 'cut-2').placed = false;
  assert.equal(G.evaluate(mission, partial).ok, false);
});

test('profile drafts are restored using authored stock geometry', () => {
  const mission = byId('terrace');
  const draft = solved(mission);
  draft.hints = 2;
  const original = G.copy(draft);
  draft.pieces.at(-1).poly = [[0, 0], [249, 0], [0, 249]];
  assert.deepEqual(G.restore(mission, JSON.parse(JSON.stringify(draft))), original);

  draft.cut = 80;
  assert.equal(G.restore(mission, draft).pieces.length, mission.pieces.length);
});
