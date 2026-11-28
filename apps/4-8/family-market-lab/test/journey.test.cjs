'use strict';

const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const market = require('../src/journey-model.js');
const objects = require('../../../../resources/early-child-market-objects/manifest.json');

test('each order can be completed by showing one legal step at a time', () => {
  const products = new Set(objects.items.map(item => item.id));
  assert.deepEqual(market.levels.map(level => level.id), ['recognize', 'count', 'mixed', 'add', 'subtract', 'pay']);
  assert.deepEqual(market.levels[0].rounds.map(order => order.goal), [1, 2, 3, 4, 5]);
  for (const [level, stage] of market.levels.entries()) {
    for (const round of stage.rounds.keys()) {
      const task = market.start(level, round);
      assert(task.order.products.every(id => products.has(id)));
      let items = task.initial.slice();
      if (task.mode === 'recognize') {
        const hint = market.suggestion(task, items);
        assert(task.order.choices.includes(hint.value));
        assert(market.check(task, items, hint.value));
        continue;
      }
      for (let step = 0; step < 15 && !market.check(task, items); step++) {
        const hint = market.suggestion(task, items);
        assert.equal(hint.action, task.mode === 'subtract' ? 'return' : 'take');
        const before = items.slice();
        const changed = market.change(task, items, hint.action, hint.value);
        assert(changed);
        assert.deepEqual(items, before);
        assert.equal(Math.abs(changed.length - before.length), 1);
        items = changed;
      }
      assert(market.check(task, items));
      assert.deepEqual(market.suggestion(task, items), { action: 'deliver' });
    }
  }
});

test('exact product quantities matter even when the basket total matches', () => {
  const task = market.start(2, 0);
  let items = [0, 0, 2];
  assert.equal(items.length, task.goal);
  assert.equal(market.check(task, items), false);
  const correction = market.suggestion(task, items);
  assert.deepEqual(correction, { action: 'return', value: 2 });
  items = market.change(task, items, correction.action, correction.value);
  assert.deepEqual(market.suggestion(task, items), { action: 'take', value: 1 });
  assert.deepEqual(market.change(task, items, 'take', 1), [0, 0, 1]);
  assert.equal(market.change(task, items, 'take', 99), null);
});

test('validates stored baskets and resumes completed or in-progress orders', () => {
  const inProgress = {
    level: 4, round: 0, basket: [0, 0], delivered: false, completed: ['0:0'], language: 'en', sound: false
  };
  assert.deepEqual(market.load(inProgress), inProgress);
  const invalid = { ...inProgress, delivered: true, basket: [0, 1], completed: ['4:0', '4:0', '9:9'] };
  assert.deepEqual(market.load(invalid), { ...inProgress, basket: null, completed: ['4:0'] });
  const complete = { ...inProgress, basket: [0, 0, 0], delivered: true, completed: ['4:0'] };
  assert.deepEqual(market.load(complete), complete);
});

test('each bilingual SILMA prompt and number has a local MP3 matching its provenance', () => {
  const plan = require('../data/journey-voice-plan.json');
  const recordings = require('../data/journey-recordings.json');
  const digest = bytes => createHash('sha256').update(bytes).digest('hex');
  assert.equal(recordings.engine, 'SILMA TTS 1.0.5');
  assert.match(recordings.model_revision, /^[a-f0-9]{40}$/);
  assert.equal(recordings.items.length, plan.length);
  for (const [index, clip] of recordings.items.entries()) {
    const source = plan[index];
    assert.equal(clip.id, source.id);
    assert.equal(clip.path, source.path);
    assert.equal(clip.text_sha256, digest(source.text));
    assert.equal(clip.engine, 'silma-tts-1.0.5');
    const mp3 = fs.readFileSync(path.resolve(__dirname, '..', clip.path));
    assert(clip.duration_ms > 150 && clip.duration_ms < 10000, clip.id);
    assert.equal(digest(mp3), clip.sha256, clip.id);
  }
});
