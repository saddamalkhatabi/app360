'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const M = require('../src/journey-model');
const Coach = require('../src/journey-coach');

test('every mission can be solved in order using only its own cards', () => {
  const progress = M.empty();
  assert.deepEqual(M.cards.map(card => card.id).filter((id, i, all) => all.indexOf(id) !== i), []);
  assert.deepEqual(M.worlds.map((_, i) => M.cards.filter(card => card.world === i).length), [5, 5, 5]);
  M.cards.forEach((card, i) => {
    assert.equal(M.unlocked(progress), i);
    assert.ok(card.answer.every(op => card.keys.includes(op)), card.id);
    assert.ok(card.answer.length <= M.limit(card), card.id);
    const draft = M.restoreDraft({
      ...M.fresh(card), tape: card.answer,
      guess: card.mode === 'predict' ? card.goal.join(':') : ''
    }, card);
    assert.deepEqual(draft.tape, card.answer);
    const result = M.route(card, draft.tape, draft.guess);
    assert.equal(result.status, 'arrived', card.id);
    progress.current = card.id;
    assert.equal(M.mark(progress, card, draft, result), true);
    assert.deepEqual(M.restore(JSON.parse(JSON.stringify(progress))), progress);
  });
  assert.equal(M.unlocked(progress), 15);
});

test('order, one-card repairs, facing, predictions and repeats are evaluated independently', () => {
  const byId = id => M.cards[M.indexOf(id)];
  const order = byId('first-then');
  assert.equal(M.route(order, ['n', 'e']).status, 'missing-light');
  const repair = byId('one-card-fix');
  assert.equal(M.route(repair, repair.starter).status, 'blocked');
  assert.equal(M.route(repair, repair.starter).bad, 1);
  assert.deepEqual(M.restoreDraft({ tape: ['n', 'n', 'e'] }, repair).tape, repair.starter);
  const swap = byId('swap-order');
  assert.equal(M.route(swap, swap.starter).status, 'missing-light');
  assert.equal(M.route(swap, swap.answer).status, 'arrived');
  const turn = byId('point-ahead');
  assert.deepEqual(M.route(turn, ['r']).position, { x: 0, y: 1, dir: 1 });
  assert.equal(M.route(turn, ['f', 'r']).status, 'away');
  const guess = byId('predict-landing');
  assert.equal(M.route(guess, guess.answer, '2:2').status, 'prediction');
  assert.equal(M.route(guess, guess.answer, '2:1').status, 'arrived');
  const repeat = byId('echo');
  const expanded = M.route(repeat, ['twice']);
  assert.equal(expanded.status, 'arrived');
  assert.deepEqual(expanded.trace.map(step => step.index), [0, 0]);
  assert.deepEqual(expanded.trace.map(step => step.iteration), [0, 1]);
  assert.equal(M.route(repeat, ['f', 'f']).status, 'missing-repeat');
  assert.equal(M.route(M.studio, ['f', 'l', 'f']).status, 'studio');
});

test('hints, replay and invalid save data do not grant locked progress', () => {
  const start = M.empty();
  const card = M.cards[0];
  const draft = { ...M.fresh(card), helped: true, tape: card.answer };
  const result = M.route(card, draft.tape);
  assert.equal(M.mark(start, M.cards[4], draft, result), false);
  M.mark(start, card, draft, result);
  assert.equal(start.wins[card.id], 'guided');
  M.mark(start, card, { ...draft, helped: false }, result);
  M.mark(start, card, draft, result);
  assert.equal(start.wins[card.id], 'solo');
  const invalid = { ...start, current: M.cards[14].id, wins: { ...start.wins, [M.cards[14].id]: 'solo' } };
  const restored = M.restore(invalid);
  assert.equal(M.unlocked(restored), 1);
  assert.equal(restored.current, M.cards[1].id);
  assert.equal(restored.finished, '');
  assert.deepEqual(M.restoreDraft({ tape: ['oops'] }, card), M.fresh(card));
});

test('the coach targets the next useful action without modifying the program', () => {
  const repair = M.cards[M.indexOf('one-card-fix')];
  const draft = M.fresh(repair);
  assert.deepEqual(Coach.choose(repair, draft, null, -1), { id: 'watch', action: 'play' });
  const collision = M.route(repair, draft.tape);
  draft.tried = true;
  assert.deepEqual(Coach.choose(repair, draft, collision, -1), { id: 'repair', action: 'select:1' });
  assert.deepEqual(Coach.choose(repair, draft, collision, 1), { id: 'replace', action: 'add:n' });
  assert.deepEqual(draft.tape, repair.starter);

  const prediction = M.cards[M.indexOf('predict-landing')];
  const guess = M.fresh(prediction);
  assert.equal(Coach.choose(prediction, guess, null, -1).action, 'board');
  guess.guess = '2:2';
  const observed = M.route(prediction, guess.tape, guess.guess);
  assert.equal(Coach.choose(prediction, guess, observed, -1).action, 'guess:2:1');

  const echo = M.cards[M.indexOf('echo')];
  assert.deepEqual(Coach.choose(echo, M.fresh(echo), null, -1), { id: 'repeat', action: 'add:twice' });
});

test('each planner track starts at its own first mission with independent sequential progress', () => {
  for (const world of M.worlds) {
    const track = M.track(world.id);
    const cards = M.missions(track), progress = M.empty(track);
    assert.equal(cards.length, 5);
    assert.equal(progress.current, cards[0].id);
    const unrelated = M.cards.find(card => !cards.includes(card));
    assert.equal(M.mark(progress, unrelated, M.fresh(unrelated), { status: 'arrived' }, track), false);
    for (const [i, card] of cards.entries()) {
      const draft = { ...M.fresh(card), tape: card.answer, guess: card.mode === 'predict' ? card.goal.join(':') : '' };
      assert.equal(M.unlocked(progress, track), i);
      assert.equal(M.mark(progress, card, draft, M.route(card, draft.tape, draft.guess), track), true);
    }
    assert.equal(M.unlocked(M.restore(progress, track), track), 5);
  }
  assert.equal(M.track('unknown'), null);
});

test('every spoken prompt, workshop line and coach response is covered by the SILMA recording inventory', () => {
  const voices = require('../data/silma-recordings.json');
  const workshop = require('../data/content.json').phrases;
  const timing = require('../data/read-along.json').items;
  assert.equal(voices.engine, 'SILMA TTS');
  const expected = [];
  for (const language of ['ar', 'en']) {
    for (const card of [...M.cards, M.studio]) expected.push('assets/journey-audio/' + language + '-' + card.id + '.mp3');
    for (const cue of Object.keys(Coach.phrases)) expected.push('assets/journey-audio/' + language + '-coach-' + cue + '.mp3');
    for (const cue of Object.keys(workshop)) expected.push('audio/' + language + '-' + cue + '.mp3');
  }
  assert.deepEqual(voices.items.map(item => item.path).sort(), expected.sort());
  for (const item of voices.items) {
    const bytes = fs.readFileSync(path.resolve(__dirname, '..', item.path));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), item.sha256, item.path);
    assert.ok(item.duration_ms >= 200, item.path);
    if (item.path.startsWith('audio/')) {
      assert.equal(timing[item.path].audio_sha256, item.sha256, item.path);
      assert.ok(timing[item.path].cues.length > 0, item.path);
    }
  }
});
