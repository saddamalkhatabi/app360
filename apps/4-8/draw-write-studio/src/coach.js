(function (w) {
  'use strict';
  var data = w.STUDIO_COACH_DATA;
  function route(id) {
    for (var i = 0; i < data.routes.length; i++) if (data.routes[i].id === id) return data.routes[i];
    return null;
  }
  function start(id, draftId) {
    return route(id) ? { route:id, draft:draftId, step:0, paused:false, complete:false } : null;
  }
  function restore(input, draftId) {
    if (!input || input.draft !== draftId) return null;
    var path = route(input.route), n = input.step;
    if (!path || typeof n !== 'number' || n !== Math.floor(n) || n < 0 || n >= path.steps.length) return null;
    var state = start(input.route, draftId);
    state.step = n;
    if (typeof input.photo === 'string' && /^[a-f0-9]{16}$/.test(input.photo)) state.photo = input.photo;
    if (typeof input.color === 'string' && /^#[a-f0-9]{6}$/i.test(input.color)) state.color = input.color;
    state.complete = input.complete === true && n === path.steps.length-1;
    state.paused = !state.complete;
    return state;
  }
  function current(state) {
    if (!state) return null;
    var path = route(state.route);
    if (!path) return null;
    var id = state.complete ? 'done' : path.steps[state.step];
    return { id:id, route:path, details:data.steps[id] };
  }
  function advance(state, event) {
    if (!state || state.paused || state.complete) return false;
    var step = current(state), expected = step.details.event;
    // The optional words step may be skipped by opening the review directly.
    if (step.id === 'words' && event === 'stage-review') { state.step += 2; return true; }
    if (step.id === 'words' && event === 'skip-words') { state.step++; return true; }
    if (event !== expected) return false;
    if (expected === 'saved') state.complete = true;
    else state.step++;
    return true;
  }
  function path(language, id) { return 'audio/coach/' + language + '-' + id + '.mp3'; }
  function audioItem(audioPath) {
    var match = /^audio\/coach\/(ar|en)-([a-z-]+)\.mp3$/.exec(audioPath || '');
    var step = match && data.steps[match[2]];
    return step ? { language:match[1], text:step[match[1]] } : null;
  }
  w.STUDIO_COACH = { routes:data.routes, route:route, start:start, restore:restore, current:current, advance:advance, path:path, audioItem:audioItem };
})(typeof window !== 'undefined' ? window : globalThis);
