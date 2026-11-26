'use strict';

const assert = require('node:assert/strict');
const { test } = require('node:test');
const M = require('../src/journey-model');

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
