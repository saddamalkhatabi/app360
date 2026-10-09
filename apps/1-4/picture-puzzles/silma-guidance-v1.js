/* SILMA picture-puzzle guidance pilot. OFF until all authored MP3s are verified. ES5 compatible. */
(function (w, d) {
  'use strict';
  var CONFIG = {
    ready: false, /* switch to true only after SILMA files exist and pass verification */
    engine: 'silma-tts',
    clips: {
      start: 'audio/silma/worker-1/picture-puzzles/start.mp3',
      hint: 'audio/silma/worker-1/picture-puzzles/hint.mp3',
      finish: 'audio/silma/worker-1/picture-puzzles/finish.mp3',
      reset: 'audio/silma/worker-1/picture-puzzles/reset.mp3',
      level: 'audio/silma/worker-1/picture-puzzles/level.mp3'
    }
  };
  var current = null, focusEl = null, timer = null;
  function byId(id) { return id ? d.getElementById(id) : null; }
  function removeFocus() {
    if (!focusEl) return;
    focusEl.className = String(focusEl.className || '').replace(/(?:^|\s)silma-cue-focus(?=\s|$)/g, ' ').replace(/^\s+|\s+$/g, '');
    focusEl = null;
  }
  function stop() {
    if (timer !== null) { clearTimeout(timer); timer = null; }
    if (current) {
      try { current.onended = null; current.onerror = null; current.onabort = null; current.pause(); current.currentTime = 0; } catch (e) {}
      current = null;
    }
    removeFocus();
  }
  function soundOn() {
    var b = byId('soundBtn');
    return !b || String(b.innerHTML || '').indexOf('🔇') === -1;
  }
  function ready() { return CONFIG.ready === true && !!w.Audio; }
  function play(cue, focusId, done) {
    if (!ready() || !soundOn() || !Object.prototype.hasOwnProperty.call(CONFIG.clips, cue)) return false;
    stop();
    var target = byId(focusId), a, finished = false;
    try { a = new w.Audio(CONFIG.clips[cue]); } catch (e) { return false; }
    current = a;
    if (target) {
      focusEl = target;
      if ((' ' + String(target.className || '') + ' ').indexOf(' silma-cue-focus ') < 0) target.className += ' silma-cue-focus';
    }
    function finish(ok) {
      if (finished || current !== a) return;
      finished = true;
      if (timer !== null) { clearTimeout(timer); timer = null; }
      current = null;
      removeFocus();
      if (typeof done === 'function') done(!!ok);
    }
    a.onended = function () { finish(true); };
    a.onerror = function () { finish(false); };
    a.onabort = function () { finish(false); };
    timer = setTimeout(function () { try { a.pause(); } catch (e) {} finish(false); }, 25000);
    try {
      var result = a.play();
      if (result && typeof result.catch === 'function') result.catch(function () { finish(false); });
    } catch (e) { finish(false); }
    return true;
  }
  w.APP360PictureSilmaGuide = { play: play, stop: stop, ready: ready };
})(window, document);
