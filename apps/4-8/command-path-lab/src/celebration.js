(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.COMMAND_CELEBRATION = factory();
}(this, function () {
  'use strict';

  function create(options) {
    var w = options.window, doc = w.document, box, hideTimer, audio, timer;
    var source = '', state = 'idle';
    var schoolFeedback = w.APP360_SCHOOL_VOICE_FEEDBACK && w.APP360_SCHOOL_VOICE_FEEDBACK.create();

    function stopAudio() {
      w.clearTimeout(timer);
      if (schoolFeedback) schoolFeedback.stop();
      if (source === 'shared-recorded') w.App360Celebration.stop();
      if (audio) {
        audio.onended = audio.onerror = null;
        audio.pause();
        audio = null;
      }
      source = '';
      state = 'idle';
      if (options.onAudioEnd) options.onAudioEnd();
    }

    function hide() {
      w.clearTimeout(hideTimer);
      if (box) { box.hidden = true; box.innerHTML = ''; }
    }

    function show() {
      hide();
      var text = options.getLanguage() === 'en' ? 'You reached the goal!' : 'وصلت إلى المقصد!';
      if (!box) {
        box = doc.createElement('div');
        box.id = 'commandCelebration'; box.className = 'celebration';
        box.setAttribute('role', 'status');
        box.setAttribute('aria-live', 'polite');
        doc.body.appendChild(box);
      }
      box.hidden = false;
      var badge = doc.createElement('p');
      badge.className = 'celebration-badge';
      badge.textContent = text;
      box.appendChild(badge);
      var reduced = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
      var colors = ['#287f91', '#edb83d', '#de7972', '#8974b1'];
      if (!reduced) for (var i = 0; i < 32; i++) {
        var piece = doc.createElement('i');
        piece.className = 'confetti-piece'; piece.setAttribute('aria-hidden', 'true');
        piece.style.left = (i * 31 % 100) + '%';
        piece.style.backgroundColor = colors[i % colors.length];
        piece.style.animationDelay = (i % 7 * .07) + 's';
        box.appendChild(piece);
      }
      hideTimer = w.setTimeout(hide, 4500);
    }

    function play(done) {
      stopAudio();
      if (!options.getSound()) { if (done) done(); return; }
      if (schoolFeedback && schoolFeedback.play({ language: options.getLanguage() }, function () {
        stopAudio();
        if (done) done();
      })) {
        source = 'school-personalized';
        state = 'playing';
        if (options.onAudioStart) options.onAudioStart();
        return;
      }
      if (w.App360Celebration) {
        source = 'shared-recorded';
        state = 'playing';
        if (options.onAudioStart) options.onAudioStart();
        w.App360Celebration.play({ language: options.getLanguage(), signedInName: false }, function () {
          stopAudio();
          if (done) done();
        });
        return;
      }
      source = 'assets/journey-audio/' + options.getLanguage() + '-coach-cheer.mp3';
      var active = new w.Audio(source);
      audio = active;
      state = 'loading';

      function finish() {
        if (audio !== active) return;
        stopAudio();
        if (done) done();
      }
      function started() {
        if (audio !== active) return;
        state = 'playing';
        if (options.onAudioStart) options.onAudioStart();
      }
      active.onended = active.onerror = finish;
      timer = w.setTimeout(finish, 10000);
      try {
        var pending = active.play();
        if (pending && pending.then) pending.then(started, finish);
        else started();
      } catch (e) { finish(); }
    }

    return { show: show, play: play, stopAudio: stopAudio, hide: hide,
      debug: function () { return { source: source, state: state, visible: !!(box && !box.hidden) }; } };
  }

  return { create: create };
}));
