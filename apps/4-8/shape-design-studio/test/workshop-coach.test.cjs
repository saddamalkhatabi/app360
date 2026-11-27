const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const Model = require('../src/workshop-model.js');
const Content = require('../src/workshop-content.js');
const Coach = require('../src/workshop-coach.js');
const published = require('../data/coach-routes.json');
const links = require('../links.json');
const narration = require('../data/workshop-silma.json');

function project(id) { return Content.missions.find(mission => mission.id === id); }

function position(draft, p) {
  Object.assign(draft.pieces.find(piece => piece.id === p.id), p, { placed: true });
}

test('automatic feedback waits for the last required tile and detects overlapping tiles', () => {
  const mission = project('courtyard'), draft = Model.create(mission);
  position(draft, mission.solution[0]);
  const feedback = () => Coach.assessment(mission, draft, Model.evaluate(mission, draft), false);
  assert.equal(feedback(), '');
  position(draft, mission.solution[1]);
  const last = mission.solution[2];
  position(draft, { ...last, x: 140, y: 120 });
  assert.equal(feedback(), 'overlap');
  position(draft, last);
  assert.equal(feedback(), 'done');
});

test('angle distractors and optional offcuts do not block automatic completion', () => {
  for (const mission of ['acute', 'diagonal'].map(project)) {
    const draft = Model.create(mission);
    if (mission.stock) Model.makeCut(mission, draft, mission.plannedAngle);
    mission.solution.forEach(p => position(draft, p));
    assert.ok(draft.pieces.some(p => !p.placed));
    assert.equal(Coach.assessment(mission, draft, Model.evaluate(mission, draft)), 'done');
  }
});

test('plans contain known projects and expose launch and verified completion contracts', () => {
  assert.deepEqual(published, Coach.catalog(Content.missions));
  assert.equal(published.routes.length, 5);
  for (const route of published.routes) {
    assert.equal(new Set(route.unit_ids).size, 4);
    assert.ok(route.unit_ids.every(id => project(id)));
    const link = links.routes.find(item => item.id === route.id);
    assert.ok(link.href.endsWith('route_ids=' + route.id));
  }
});

test('practice advances only after each sequential project has been verified', () => {
  const route = Coach.get('shapes-review');
  const session = Coach.session(route.id);
  assert.equal(Coach.advance(session), false);
  assert.equal(Coach.completeStep(session, route.unit_ids[1]), false);
  assert.deepEqual(session.verified, []);
  assert.equal(Coach.completeStep(session, route.unit_ids[0]), false);
  assert.equal(Coach.completeStep(session, route.unit_ids[0]), false);
  assert.deepEqual(session.verified, [route.unit_ids[0]]);
  assert.ok(Coach.advance(session));
  session.status = 'paused';
  const resumed = Coach.session(route.id, session, true);
  assert.equal(resumed.index, 1);
  assert.equal(resumed.status, 'paused');
  assert.equal(Coach.advance(resumed), false);
  resumed.status = 'active';
  for (let index = 1; index < route.unit_ids.length; index++) {
    const last = index === route.unit_ids.length - 1;
    assert.equal(Coach.completeStep(resumed, route.unit_ids[index]), last);
    assert.equal(Coach.advance(resumed), !last);
  }
  assert.equal(resumed.status, 'complete');
  assert.deepEqual(resumed.verified, route.unit_ids);
  assert.equal(Coach.advance(resumed), false);
  assert.equal(Coach.completeStep(resumed, route.unit_ids.at(-1)), false);
  assert.deepEqual(Coach.session(route.id, resumed, false).verified, []);
});

test('Arabic task and coach audio matches the packaged SILMA recordings', () => {
  assert.equal(narration.model, 'silma-ai/silma-tts');
  assert.equal(narration.items.length, Content.missions.length + 6);
  const ids = new Set(narration.items.map(item => item.id));
  assert.ok(Content.missions.every(mission => ids.has(mission.id)));
  for (const item of narration.items) {
    assert.equal(item.engine, 'silma');
    assert.equal(item.language, 'ar');
    assert.equal(item.model_revision, narration.model_revision);
    assert.ok(item.duration_ms >= 800);
    const audio = fs.readFileSync(path.join(__dirname, '..', item.path));
    assert.equal(crypto.createHash('sha256').update(audio).digest('hex'), item.sha256, item.id);
  }
});
