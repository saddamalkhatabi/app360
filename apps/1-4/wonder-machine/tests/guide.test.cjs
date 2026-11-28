'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const core = require('../device-core.js');
const guide = require('../device-guide.js');

test('the suggested controls complete every older mission in stage order', () => {
  let level = 1;
  let device = core.list('4-8', level)[0];
  let mission = core.task(device, 'free');
  const visited = new Set();

  for (let target; (target = guide.next(device, mission, level));) {
    level = target.level;
    device = core.find(target.device, '4-8');
    mission = core.task(device, target.task);
    const id = core.key(device, mission.id);
    assert(!visited.has(id), id);
    visited.add(id);

    const round = core.fresh(device, mission.id);
    const steps = guide.plan(device, mission, round.machine);
    assert(steps.length > 0, id);
    for (const {tool, value} of steps) {
      for (const language of ['ar', 'en']) {
        const cue = guide.instruction(device, mission, round.machine, language, true);
        const index = device.tools.findIndex(candidate => candidate.key === tool);
        assert.equal(cue.tool, tool, id);
        assert.equal(cue.clip, 'tool-' + (index + 1));
        assert(cue.text.includes(device.tools[index].states[value][language]));
      }
      assert(core.act(round, device, tool, value, 1).changed, id);
    }
    assert(core.progress(round.machine, mission).done, id);
    assert.equal(guide.instruction(device, mission, round.machine, 'ar', true).clip, 'done');
  }
  assert.equal(visited.size, 54);
  assert.equal(level, 4);
});

test('guidance follows teaching order and explains when an irreversible choice needs a reset', () => {
  const washing = core.find('wash', '4-8');
  const lather = core.task(washing, 'soap');
  assert.deepEqual(guide.plan(washing, lather, lather.initial).map(step => step.tool), ['soap', 'water']);

  const rinse = core.task(washing, 'rinse');
  assert.deepEqual(guide.plan(washing, rinse, rinse.initial).map(step => step.tool), ['water', 'soap', 'water']);
  assert.deepEqual(guide.instruction(washing, rinse, rinse.initial, 'en', false), {
    text: rinse.note.en,
    clip: 'mission-wash-rinse'
  });

  const crossing = core.find('crossing', '4-8');
  assert.equal(guide.instruction(crossing, crossing.tasks[0], {request: 1, walk: 1, check: 1}, 'ar', true).clip, 'reset');
});

test('old saves gain optional guidance defaults and voice files cover both languages', () => {
  assert.deepEqual(core.store({schema: 3}, '4-8').guide, {enabled: true, auto: false, voice: true});
  assert.deepEqual(core.store({schema: 3, guide: {enabled: false, auto: true, voice: false}}, '4-8').guide,
    {enabled: false, auto: true, voice: false});
  assert.equal(core.store({schema: 3, guide: {auto: true}}, '1-4').guide, undefined);

  const clips = ['start', 'done', 'reset', 'tool-1', 'tool-2', 'tool-3'];
  for (const level of [1, 2, 3, 4]) {
    for (const device of core.list('4-8', level)) {
      for (const mission of device.tasks) clips.push(guide.missionClip(device, mission));
    }
  }
  for (const language of ['ar', 'en']) {
    for (const clip of clips) {
      const file = path.join(__dirname, '../audio/guide', language + '-' + clip + '.mp3');
      const bytes = fs.readFileSync(file);
      assert(bytes.length > 4000 && bytes.subarray(0, 3).toString() === 'ID3', file);
    }
  }
});
