(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./model'), require('./journey-missions'));
  else root.COMMAND_JOURNEY = factory(root.COMMAND_MODEL, root.COMMAND_JOURNEY_MISSIONS);
}(this, function (paths, content) {
  'use strict';

  var commands = {
    n: { icon: '↑', name: ['أعلى', 'Up'] }, e: { icon: '→', name: ['يمين', 'Right'] },
    s: { icon: '↓', name: ['أسفل', 'Down'] }, w: { icon: '←', name: ['يسار', 'Left'] },
    f: { icon: '⬆', name: ['تقدّم', 'Forward'] },
    l: { icon: '↶', name: ['دُر يسارًا', 'Turn left'] },
    r: { icon: '↷', name: ['دُر يمينًا', 'Turn right'] },
    twice: { icon: '⬆ ×٢', name: ['تقدّم مرتين', 'Forward twice'] }
  };
  var cards = content.cards;
  var studio = content.studio;
  var touchLimit = 12;

  function point(pair) { return { x: pair[0], y: pair[1] }; }
  function indexOf(id) { return cards.map(function (card) { return card.id; }).indexOf(id); }
  function isDirect(card) { return card.mode === 'touch' || card.mode === 'facing'; }
  function limit(card) {
    return isDirect(card) ? touchLimit : card.mode === 'studio' ? 8 : card.answer.length;
  }

  function route(card, tape, guess) {
    var plan = tape.map(function (op) {
      return op === 'twice' ? { op: 'repeat', count: 2, body: [{ op: 'f' }] } : { op: op };
    });
    var map = {
      id: card.id, title: { ar: card.title[0], en: card.title[1] },
      size: card.size, start: { x: card.start[0], y: card.start[1], dir: card.start[2] },
      goal: point(card.goal), walls: (card.walls || []).map(point),
      mode: card.keys.some(function (op) { return /^[nesw]$/.test(op); }) ? 'absolute' : 'relative',
      level: card.keys.indexOf('twice') >= 0 ? 3 : 1, goal_asset: 'book'
    };
    var result = paths.execute(map, plan);
    var firstArrival = -1;
    result.trace.some(function (step, i) {
      if (!paths.equal(step.to, map.goal)) return false;
      firstArrival = i;
      return true;
    });
    var beforeArrival = card.mode === 'studio' || firstArrival < 0 ? result.trace : result.trace.slice(0, firstArrival);
    var lights = (card.lights || []).map(function (pair) {
      return beforeArrival.some(function (step) { return paths.equal(step.to, point(pair)); });
    });
    var status = result.status;
    if (status === 'arrived' && lights.indexOf(false) >= 0) status = 'missing-light';
    if (status === 'arrived' && card.requiresRepeat && tape.indexOf('twice') < 0) status = 'missing-repeat';
    if (status === 'arrived' && card.mode === 'predict' && guess !== card.goal.join(':')) status = 'prediction';
    if (card.mode === 'studio' && tape.length && status !== 'blocked') status = 'studio';
    return { status: status, lights: lights, trace: result.trace, position: result.position, bad: result.debug_index };
  }

  function fresh(card) {
    return { tape: (card.starter || (card.mode === 'predict' ? card.answer : [])).slice(), tried: false, helped: false, guess: '' };
  }

  function restoreDraft(value, card) {
    var start = fresh(card);
    if (!value || !Array.isArray(value.tape) || value.tape.length > limit(card)) return start;
    if (value.tape.some(function (op) { return card.keys.indexOf(op) < 0; })) return start;
    if (card.mode === 'predict' || card.mode === 'repair' || card.mode === 'swap') {
      if (value.tape.length !== start.tape.length) return start;
      if (card.mode === 'repair' && value.tape.some(function (op, i) {
        return card.edit.indexOf(i) < 0 && op !== start.tape[i];
      })) return start;
      if (card.mode === 'swap' && value.tape.slice().sort().join() !== start.tape.slice().sort().join()) return start;
      if (card.mode === 'predict' && value.tape.join() !== start.tape.join()) return start;
    }
    return {
      tape: value.tape.slice(), tried: value.tried === true, helped: value.helped === true,
      guess: (card.guesses || []).some(function (p) { return p.join(':') === value.guess; }) ? value.guess : ''
    };
  }

  function empty() { return { version: 1, wins: {}, drafts: {}, current: cards[0].id, finished: '' }; }

  function unlocked(progress) {
    for (var i = 0; i < cards.length; i++) {
      if (!progress.wins[cards[i].id]) return i;
    }
    return cards.length;
  }

  function restore(value) {
    var progress = empty();
    if (!value || value.version !== 1) return progress;
    for (var i = 0; i < cards.length; i++) {
      var id = cards[i].id;
      var win = value.wins && value.wins[id];
      if (win !== 'solo' && win !== 'guided') break;
      progress.wins[id] = win;
    }
    var highest = unlocked(progress);
    cards.concat(highest >= 5 ? [studio] : []).forEach(function (card, i) {
      if (i <= highest || card === studio) {
        if (value.drafts && value.drafts[card.id]) progress.drafts[card.id] = restoreDraft(value.drafts[card.id], card);
      }
    });
    var current = indexOf(value.current);
    progress.current = current >= 0 && current <= highest ? value.current : cards[Math.min(highest, cards.length - 1)].id;
    if (value.current === studio.id && highest >= 5) progress.current = studio.id;
    if (value.finished === progress.current && progress.wins[value.finished] && progress.drafts[value.finished]) {
      var draft = progress.drafts[value.finished];
      if (route(cards[current], draft.tape, draft.guess).status === 'arrived') progress.finished = value.finished;
    }
    return progress;
  }

  function mark(progress, card, draft, result) {
    var index = indexOf(card.id);
    if (result.status !== 'arrived' || index < 0 || index > unlocked(progress)) return false;
    if (!progress.wins[card.id] || !draft.helped) progress.wins[card.id] = draft.helped ? 'guided' : 'solo';
    progress.finished = card.id;
    progress.drafts[card.id] = draft;
    return true;
  }

  return {
    cards: cards, worlds: content.worlds, studio: studio, commands: commands,
    point: point, indexOf: indexOf, direct: isDirect, route: route, limit: limit,
    fresh: fresh, empty: empty, restore: restore, restoreDraft: restoreDraft, unlocked: unlocked, mark: mark
  };
}));
