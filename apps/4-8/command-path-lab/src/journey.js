(function (w, doc, M) {
  'use strict';
  var faces = ['↑', '→', '↓', '←'];
  var numbers = '٠١٢٣٤٥٦٧٨٩';
  var memory = {};
  var reactions = {
    blocked: ['هنا توقّف الروبوت. راقب البطاقة الملوّنة وجرّب تغيير الطريق.', 'The robot stopped here. Look at the highlighted card and try a different path.'],
    away: ['انتهت البطاقات هنا. غيّر الخطة أو أضف خطوة.', 'The cards end here. Change your plan or add a step.'],
    'missing-light': ['وصل الروبوت. بقيت يراعة تنتظر أن تمرّ عليها أولًا.', 'The robot got there. A firefly is still waiting for you to pass by first.'],
    'missing-repeat': ['وصلت! جرّب الوصول ببطاقة «تقدّم مرتين».', 'You got there! Try getting there with the Forward Twice card.'],
    prediction: ['وصل الروبوت إلى المربع المضيء. هل تغيّر توقّعك؟', 'The robot reached the glowing square. Want to change your guess?'],
    studio: ['هذا طريقك! جرّب ترتيبًا مختلفًا لترسم أثرًا جديدًا.', 'That’s your path! Try a different order to draw a new trail.']
  };

  function mount(host, options) {
    var language = options.language, sound = options.sound;
    var key = 'app360:a4-command-path:journey-1:' + encodeURIComponent(options.profile);
    var progress = memory[key], card, draft, result, timer, execution, selected = -1, chart = false;
    var won, message, hint, audio, voice, chimes, speech, soundToken = 0, playing = false, grownups = false;
    var reduced = w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!progress) {
      try { progress = M.restore(JSON.parse(w.localStorage.getItem(key))); } catch (e) { progress = M.empty(); }
    }

    function t(ar, en) { return language === 'ar' ? ar : en; }
    function pair(value) { return value[language === 'ar' ? 0 : 1]; }
    function num(value) {
      return t(String(value).replace(/[0-9]/g, function (digit) { return numbers[digit]; }), String(value));
    }
    function save() {
      memory[key] = progress;
      try { w.localStorage.setItem(key, JSON.stringify(progress)); } catch (e) { /* Keep this session playable. */ }
    }
    function storeDraft() { progress.drafts[card.id] = draft; save(); }
    function ready(id, replay) {
      stopAudio();
      clearTimeout(timer);
      var index = M.indexOf(id);
      var repeatCompleted = progress.current !== id && !!progress.wins[id];
      card = index < 0 ? M.studio : M.cards[index];
      progress.current = id;
      if (replay || repeatCompleted) {
        progress.finished = '';
        progress.drafts[id] = M.fresh(card);
      } else if (progress.finished !== id) progress.finished = '';
      draft = M.restoreDraft(progress.drafts[id], card);
      won = progress.finished === id;
      result = won || M.direct(card) ? M.route(card, draft.tape, draft.guess) : null;
      if (!won && result && M.mark(progress, card, draft, result)) won = true;
      playing = false; execution = null; selected = -1; hint = null; message = null; chart = false;
      save();
    }
    function tone(frequencies) {
      if (!sound) return;
      try {
        var Context = w.AudioContext || w.webkitAudioContext;
        if (!Context) return;
        chimes = chimes || new Context();
        if (chimes.state === 'suspended') chimes.resume().catch(function () {});
        frequencies.forEach(function (frequency, i) {
          var start = chimes.currentTime + i * .085, wave = chimes.createOscillator(), volume = chimes.createGain();
          wave.type = 'sine'; wave.frequency.value = frequency;
          volume.gain.setValueAtTime(.001, start);
          volume.gain.exponentialRampToValueAtTime(.095, start + .016);
          volume.gain.exponentialRampToValueAtTime(.001, start + .16);
          wave.connect(volume); volume.connect(chimes.destination); wave.start(start); wave.stop(start + .17);
        });
      } catch (e) { /* Motion and cues carry the same information. */ }
    }
    function stopAudio() {
      soundToken++;
      if (audio) { audio.pause(); audio.onerror = null; audio = null; }
      if (voice && speech) speech.cancel();
      voice = null;
    }
    function listen() {
      stopAudio();
      if (!sound) { message = ['فعّل الصوت للاستماع.', 'Turn sound on to listen.']; render(); return; }
      var token = soundToken;
      audio = new w.Audio('assets/journey-audio/' + language + '-' + card.id + '.mp3');
      function fallback() {
        if (token !== soundToken) return;
        stopAudio();
        speech = w.speechSynthesis;
        var voices = speech && speech.getVoices();
        var match = voices && voices.filter(function (voiceOption) {
          return voiceOption.lang.toLowerCase().indexOf(language) === 0;
        })[0];
        if (match && w.SpeechSynthesisUtterance) {
          voice = new w.SpeechSynthesisUtterance(pair(card.prompt));
          voice.voice = match; voice.lang = match.lang; voice.rate = .88; speech.speak(voice);
        } else {
          message = ['اقرأ المهمة أو اتبع الرسم المضيء.', 'Read the mission or follow the glowing cue.'];
          render();
        }
      }
      audio.onerror = fallback;
      try { var play = audio.play(); if (play && play.catch) play.catch(fallback); } catch (e) { fallback(); }
    }
    function button(action, text, klass, settings) {
      return '<button type="button"' + (action ? ' data-j="' + action + '"' : '') +
        (klass ? ' class="' + klass + '"' : '') + (settings || '') + '>' + text + '</button>';
    }
    function icon(value) { return '<span aria-hidden="true">' + value + '</span>'; }
    function command(op) {
      var symbol = op === 'twice' ? t('⬆ ×٢', '⬆ ×2') : M.commands[op].icon;
      return '<b class="jr-command-icon" dir="ltr" aria-hidden="true">' + symbol + '</b>';
    }
    function header() {
      return '<header class="jr-top"><div class="jr-brand"><span aria-hidden="true">✦</span>' +
        '<div><strong>' + t('مسار الأوامر', 'Command Paths') + '</strong><small>' +
        t('رحلة الروبوت فِتيل', 'Wick’s Light Quest') + '</small></div></div><div class="jr-top-actions">' +
        button(chart ? 'return' : 'chart', icon('☷') + ' <span>' + t(chart ? 'اللعب' : 'الخريطة', chart ? 'Play' : 'Map') + '</span>', 'jr-glass',
          ' aria-label="' + t(chart ? 'اللعب' : 'الخريطة', chart ? 'Play' : 'Map') + '"') +
        button(null, icon(sound ? '♪' : '×') + ' <span>' + t('الصوت', 'Sound') + '</span>', 'jr-glass',
          ' data-do="sound" aria-pressed="' + sound + '" aria-label="' + t('صوت اللعبة', 'Game sound') + '"') +
        button(null, t('EN', 'عربي'), 'jr-glass', ' data-do="language" aria-label="' + t('English', 'العربية') + '" lang="' + t('en', 'ar') + '"') +
        button(null, icon('⌂'), 'jr-glass jr-home', ' data-do="home" aria-label="' + t('الرئيسية', 'Home') + '"') + '</div></header>';
    }
    function locationId(x, y) { return x + ':' + y; }
    function tileType(key) {
      if ((card.walls || []).some(function (p) { return p.join(':') === key; })) return 'wall';
      if (card.goal.join(':') === key) return 'goal';
      if ((card.lights || []).some(function (p) { return p.join(':') === key; })) return 'light';
      return '';
    }
    function board() {
      var openGuess = card.mode === 'predict' && !execution && !won;
      var html = '<div class="jr-board jr-size-' + card.size + '" id="journeyBoard" dir="ltr" role="group" aria-label="' +
        t('لوحة الروبوت', 'Robot board') + '">';
      for (var y = 0; y < card.size; y++) for (var x = 0; x < card.size; x++) {
        var id = locationId(x, y), kind = tileType(id);
        if (kind === 'goal' && card.mode === 'predict' && !result) kind = '';
        var art = kind === 'wall' ? '<i class="jr-rock"></i>' :
          kind === 'goal' ? '<i class="jr-target jr-target-' + M.worlds[card.world].id + '">' + (card.world === 2 ? '✦' : '') + '</i>' :
            kind === 'light' ? '<i class="jr-firefly"><b></b></i>' : '';
        var canGuess = openGuess && card.guesses.some(function (p) { return p.join(':') === id; });
        var name = kind === 'goal' ? pair(M.worlds[card.world].goal) : kind === 'light' ? t('يراعة', 'Firefly') : '';
        var position = t('صف ', 'Row ') + num(y + 1) + t('، عمود ', ', column ') + num(x + 1);
        var tile = '<span class="jr-tile-art" aria-hidden="true">' + art + '</span>';
        var attrs = ' data-cell="' + id + '"';
        html += canGuess ? button('guess:' + id, tile + '<span class="jr-guess-mark" aria-hidden="true">?</span>', 'jr-cell jr-guess ' + kind,
          attrs + ' aria-pressed="' + (draft.guess === id) + '" aria-label="' + t('أتوقّع ', 'I predict ') + position + '"') :
          '<div class="jr-cell ' + kind + '"' + attrs + (name ? ' role="img" aria-label="' + name + '، ' + position + '"' : ' aria-hidden="true"') + '>' + tile + '</div>';
      }
      return html + '<div class="jr-robot" id="journeyRobot" role="img"><span class="jr-facing" aria-hidden="true"></span><span class="jr-rover" aria-hidden="true"><i class="jr-antenna"></i><i class="jr-face"><b></b><b></b></i><i class="jr-wheel"></i><i class="jr-wheel"></i></span></div></div>';
    }
    function deck() {
      var direct = M.direct(card), repair = card.mode === 'repair', swap = card.mode === 'swap', predict = card.mode === 'predict';
      var frozen = playing || !!execution, usable = !frozen && !won;
      var manageable = usable && (!repair || (draft.tried && selected >= 0)) && !swap && !predict;
      var canAdd = manageable && (repair || draft.tape.length < M.limit(card));
      var current = M.indexOf(card.id);
      var html = '<aside class="jr-console' + (direct ? ' jr-direct' : '') + '" aria-label="' + t('لوحة الأوامر', 'Command controls') + '">';
      if (!won || !direct) html += '<div class="jr-console-heading"><h2>' +
        t(direct ? 'حرّك فِتيل' : 'صندوق الأوامر', direct ? 'Move Wick' : 'Command Box') + '</h2>' +
        (won ? '' : button('hint', icon('✧') + ' ' + t('تلميح', 'Hint'), 'jr-quiet', usable ? '' : ' disabled')) + '</div>';
      if (direct && !won) {
        html += '<div class="jr-palette">' + card.keys.map(function (op) {
          var guide = guidedCommand() === op || (hint && hint.op === op);
          return button('add:' + op, command(op) + '<span>' + pair(M.commands[op].name) + '</span>',
            'jr-command jr-' + op + (guide && !won ? ' jr-guide' : ''), canAdd && (!result || result.status !== 'blocked') ? '' : ' disabled');
        }).join('') + '</div>';
        if (current > 0) {
          html += '<div class="jr-tools">' + button('undo', icon('↶') + ' ' + t('تراجع', 'Undo'), 'jr-quiet', usable && draft.tape.length ? '' : ' disabled') +
            button('reset', t('من البداية', 'Start over'), 'jr-quiet', usable && draft.tape.length ? '' : ' disabled') + '</div>';
        }
      } else if (!direct) {
        html += '<p class="jr-tape-label">' + t('ترتيب البطاقات', 'Card order') + '</p><ol class="jr-tape">';
        for (var i = 0; i < M.limit(card); i++) {
          var op = draft.tape[i], editable = usable && repair && draft.tried && card.edit.indexOf(i) >= 0;
          var label = t('البطاقة ', 'Card ') + num(i + 1) + (op ? '، ' + pair(M.commands[op].name) : t('، فارغة', ', empty'));
          var chip = '<span class="jr-slot-num">' + num(i + 1) + '</span>' + (op ? command(op) : icon('·'));
          var style = 'jr-slot ' + (op ? 'jr-' + op : 'jr-empty') +
            (i === selected ? ' jr-selected' : '') + (hint && hint.slot === i ? ' jr-guide' : '');
          html += '<li data-slot="' + i + '">' + (editable ? button('select:' + i, chip, style,
            ' aria-label="' + label + '" aria-pressed="' + (selected === i) + '"') :
            '<span class="' + style + '" aria-label="' + label + '">' + chip + '</span>') + '</li>';
        }
        html += '</ol>';
        if (!won && !swap && !predict) {
          html += '<div class="jr-palette">' + card.keys.map(function (op) {
            return button('add:' + op, command(op) + '<span>' + pair(M.commands[op].name) + '</span>',
              'jr-command jr-' + op + (hint && hint.op === op ? ' jr-guide' : ''), canAdd ? '' : ' disabled');
          }).join('') + '</div>';
        }
        if (!won && (swap || (!repair && !predict))) {
          html += '<div class="jr-tools">' + (swap ? button('swap', icon('⇄') + ' ' + t('بدّل البطاقتين', 'Swap cards'),
            'jr-quiet' + (hint ? ' jr-guide' : ''), usable && draft.tried ? '' : ' disabled') :
            button('undo', icon('↶') + ' ' + t('تراجع', 'Undo'), 'jr-quiet', usable && draft.tape.length ? '' : ' disabled') +
            button('reset', t('امسح', 'Clear'), 'jr-quiet', usable && draft.tape.length ? '' : ' disabled')) + '</div>';
        }
        var canPlay = !won && draft.tape.length && (!predict || draft.guess);
        if (!won) {
          html += '<div class="jr-play-row">' + button(playing ? 'pause' : 'play',
            icon(playing ? 'Ⅱ' : '▶') + ' ' + t(playing ? 'أوقف' : execution ? 'أكمِل' : 'شغّل', playing ? 'Pause' : execution ? 'Continue' : 'Play'),
            'jr-play', canPlay ? '' : ' disabled') + (current >= 4 || card === M.studio ?
              button('step', t('أمر واحد', 'One step'), 'jr-quiet', canPlay && !playing ? '' : ' disabled') : '') + '</div>';
        }
      }
      if (won) {
        var next = M.cards[current + 1];
        html += '<div class="jr-win-panel"><strong>' + pair(card.win) + '</strong>' +
          button(next ? 'open:' + next.id : 'open:' + M.studio.id,
            t(next ? 'المهمة التالية' : 'العب بحرّية', next ? 'Next mission' : 'Free play'), 'jr-next') +
          button('replay', t('ألعبها من جديد', 'Play it again'), 'jr-quiet') + '</div>';
      } else {
        var status = message || (result && reactions[result.status]);
        if (status) html += '<p class="jr-feedback">' + pair(status) + '</p>';
      }
      return html + '</aside>';
    }
    function mapScreen() {
      var count = M.unlocked(progress);
      return '<section class="jr-chart"><h1 tabindex="-1">' + t('خريطة الأضواء', 'Map of Lights') + '</h1><div class="jr-worlds">' +
        M.worlds.map(function (world, index) {
          return '<section class="jr-world jr-world-' + world.id + '"><h2>' + icon(world.icon) + ' ' + pair(world.name) + '</h2><ol>' +
            M.cards.map(function (mission, i) {
              if (mission.world !== index) return '';
              var mark = i < count ? '✓' : i === count ? '✦' : '·';
              var label = '<b aria-hidden="true">' + mark + '</b><span>' + num(i % 5 + 1) + '. ' + pair(mission.title) + '</span>' +
                (i > count ? '<span class="jr-sr">' + t('مقفلة', 'Locked') + '</span>' : '');
              return '<li>' + button('open:' + mission.id, label, 'jr-world-mission', i > count ? ' disabled' :
                (mission.id === card.id ? ' aria-current="step"' : '')) + '</li>';
            }).join('') + '</ol></section>';
        }).join('') + '</div><div class="jr-chart-actions">' +
        (count >= 5 ? button('open:' + M.studio.id, icon('✦') + ' ' + pair(M.studio.title), 'jr-next') : '') +
        button(null, t('الخرائط ومصمّم الألغاز', 'Classic maps & puzzle maker'), 'jr-glass', ' data-do="library"') +
        button('grownups', t('للمربي', 'For grown-ups'), 'jr-glass', ' aria-expanded="' + grownups + '" aria-controls="journeyCoach"') +
        '</div>' + coach() + '</section>';
    }
    function coach() {
      var checks = [
        ['يبني طريقًا من ثلاث بطاقات', 'Builds a route from three cards'],
        ['يتوقّع موضع التوقّف', 'Predicts where the robot will stop'],
        ['يستخدم التكرار داخل خطة', 'Uses repetition in a plan']
      ];
      return '<section class="jr-coach" id="journeyCoach"' + (grownups ? '' : ' hidden') + '><h2>' +
        t('كيف أتابع التعلّم؟', 'How can I follow their learning?') + '</h2><p>' +
        t('ابدأ من المهمة الأولى في أي عمر. عندما يتردّد الطفل، اسأله ماذا ستفعل هذه البطاقة ودعه يجرّب.', 'Start at the first mission at any age. If your child hesitates, ask what the card will do and let them try.') +
        '</p><ul>' + M.cards.filter(function (mission) { return mission.checkpoint; }).map(function (mission, i) {
          var result = progress.wins[mission.id];
          return '<li><strong>' + pair(checks[i]) + '</strong><span>' +
            (result === 'solo' ? t('أُنجزت دون تلميح داخل اللعبة', 'Completed without an in-game hint') :
              result === 'guided' ? t('أُنجزت بعد تلميح', 'Completed after a hint') : t('بانتظار التجربة', 'Ready to try later')) +
            '</span></li>';
        }).join('') + '</ul>' + button(null, t('أدوات المربي', 'Coach tools'), 'jr-glass', ' data-do="coach"') + '</section>';
    }
    function scene() {
      var world = M.worlds[card.world], i = M.indexOf(card.id), count = M.unlocked(progress);
      return '<section class="jr-mission"><div class="jr-intro"><div class="jr-mission-info"><div class="jr-location">' +
        icon(world.icon) + ' ' + pair(world.name) + (i < 0 ? '' : ' <span aria-hidden="true">·</span> ' + t('مهمة ', 'Mission ') + num(i % 5 + 1)) +
        '</div><h1 tabindex="-1">' + pair(card.title) + '</h1></div><div class="jr-score" aria-label="' +
        t('المهمات المكتملة ', 'Missions completed ') + num(count) + t(' من ', ' of ') + num(M.cards.length) +
        '">' + icon('✦') + '<b dir="ltr"><span>' + num(count) + '</span> / <span>' + num(M.cards.length) + '</span></b></div></div><div class="jr-game">' +
        '<section class="jr-stage jr-world-' + world.id + (won ? ' jr-lit' : '') + '"><div class="jr-prompt"><p>' + pair(card.prompt) + '</p>' +
        button('listen', icon('♫'), 'jr-glass jr-listen', ' aria-label="' + t('استمع إلى المهمة', 'Listen to the mission') + '"') +
        '</div><div class="jr-field">' + board() + '</div></section>' + deck() + '</div></section>';
    }
    function announcement() {
      return won ? pair(card.win) : message ? pair(message) : result && reactions[result.status] ? pair(reactions[result.status]) : '';
    }
    function render(focus) {
      var active = doc.activeElement, command = host.contains(active) && active.getAttribute('data-j');
      var external = host.contains(active) && active.getAttribute('data-do');
      host.innerHTML = header() + (chart ? mapScreen() : scene()) + '<div class="jr-sr" role="status" aria-live="polite"></div>';
      paint();
      var status = host.querySelector('[role="status"]'), copy = chart ? '' : announcement();
      if (copy) setTimeout(function () { if (host.contains(status)) status.textContent = copy; }, 25);
      var action = focus || (command && '[data-j="' + command + '"]') || (external && '[data-do="' + external + '"]');
      if (action) {
        var node = host.querySelector(action);
        if (!node || node.disabled) node = host.querySelector(won ? '.jr-next' : '.jr-play:not(:disabled), .jr-command:not(:disabled)');
        if (node && node !== active) { try { node.focus({ preventScroll: true }); } catch (e) { node.focus(); } }
      }
    }
    function paint() {
      var rover = host.querySelector('#journeyRobot');
      if (!rover) return;
      var trace = execution ? execution.result.trace.slice(0, execution.cursor) : result ? result.trace : [];
      var last = trace[trace.length - 1], pos = last ? last.to : { x: card.start[0], y: card.start[1], dir: card.start[2] };
      rover.style.left = ((pos.x + .5) * 100 / card.size) + '%';
      rover.style.top = ((pos.y + .5) * 100 / card.size) + '%';
      var face = rover.querySelector('.jr-facing');
      face.textContent = faces[pos.dir];
      face.className = 'jr-facing jr-face-' + pos.dir;
      rover.setAttribute('aria-label', t('فِتيل في صف ', 'Wick in row ') + num(pos.y + 1) + t('، عمود ', ', column ') + num(pos.x + 1) + ' ' + faces[pos.dir]);
      rover.className = 'jr-robot' + (last && last.blocked ? ' jr-bumped' : '') + (won ? ' jr-celebrate' : '');
      var seen = {};
      trace.forEach(function (step) { if (!step.blocked) seen[locationId(step.to.x, step.to.y)] = true; });
      var cells = host.querySelectorAll('[data-cell]');
      for (var i = 0; i < cells.length; i++) {
        var cell = cells[i], id = cell.getAttribute('data-cell'), lit = seen[id] && cell.classList.contains('light');
        cell.classList.toggle('jr-trail', !!seen[id]);
        cell.classList.toggle('jr-glowing', !!lit || (won && id === card.goal.join(':')));
        cell.classList.toggle('jr-target-guess', !!(hint && hint.guess === id));
        cell.classList.toggle('jr-chosen', draft.guess === id);
      }
      var slots = host.querySelectorAll('[data-slot]');
      for (var j = 0; j < slots.length; j++) {
        var bad = !execution && result && result.bad === j;
        slots[j].classList.toggle('jr-executing', !!(last && execution && last.index === j));
        slots[j].classList.toggle('jr-error', !!bad);
      }
    }

    function finish() {
      result = execution.result;
      execution = null; playing = false; draft.tried = true;
      if (M.mark(progress, card, draft, result)) {
        won = true; hint = null; message = null;
        tone([587, 740, 880, 1175]);
      } else if (M.direct(card) && result.status === 'away') {
        message = guidedCommand() ? (card.mode === 'facing' ?
          ['تغيّرت وجهته! تقدّم الآن.', 'Wick is facing a new way! Go forward now.'] :
          ['أضأت اليراعة! خطوة أخرى نحو الفانوس.', 'The firefly lit up! Take one more step to the lantern.']) :
          ['جرّب اتجاهًا آخر، أو تراجع وغيّر خطوتك.', 'Try another direction, or undo and change your move.'];
      }
      storeDraft();
      render(won ? '.jr-next' : card.mode === 'predict' ? '.jr-guess' :
        card.mode === 'repair' ? '.jr-error button, .jr-tape button' :
          card.mode === 'swap' ? '[data-j="swap"]' : null);
    }
    function advance(auto) {
      clearTimeout(timer);
      if (!execution) return;
      var next = execution.result.trace[execution.cursor++];
      if (!next) { finish(); return; }
      paint();
      var isLight = !next.blocked && tileType(locationId(next.to.x, next.to.y)) === 'light';
      tone(next.blocked ? [180] : isLight ? [740, 988] :
        next.op === 'l' || next.op === 'r' ? [392] : [523]);
      if (execution.cursor >= execution.result.trace.length) {
        timer = setTimeout(finish, reduced ? 120 : 380);
      } else if (auto) {
        timer = setTimeout(function () { advance(true); }, reduced ? 190 : 435);
      }
    }
    function play(single, offset) {
      if (!execution) {
        execution = { result: M.route(card, draft.tape, draft.guess), cursor: offset || 0 };
      }
      hint = null; message = null; playing = !single;
      render(single ? '[data-j="step"]' : '[data-j="pause"]');
      timer = setTimeout(function () { advance(!single); }, reduced ? 40 : 135);
    }
    function suspend() {
      stopAudio();
      if (!playing && !execution) return;
      clearTimeout(timer);
      playing = false;
      if (M.direct(card)) {
        execution = null;
        result = M.route(card, draft.tape, draft.guess);
        if (M.mark(progress, card, draft, result)) won = true;
        storeDraft();
      }
      render();
    }
    function guidedCommand() {
      if (card.id !== M.cards[0].id && !card.guide) return '';
      return card.answer.slice(0, draft.tape.length).join() === draft.tape.join() ? card.answer[draft.tape.length] : '';
    }
    function giveHint() {
      draft.helped = true;
      message = null;
      hint = {};
      if (card.mode === 'predict') {
        hint.guess = card.goal.join(':');
        message = ['تتبّع اتجاه السهم بعد كل بطاقة. جرّب المربع المحدّد.', 'Follow the arrow after each card. Try the outlined square.'];
      } else if ((card.mode === 'repair' || card.mode === 'swap') && !draft.tried) {
        message = ['شغّل البطاقات أولًا وراقب أين يتوقّف الروبوت.', 'Play the cards first and see where the robot stops.'];
      } else if (card.mode === 'repair') {
        hint.slot = card.edit.filter(function (i) { return draft.tape[i] !== card.answer[i]; })[0];
        if (M.route(card, draft.tape).status === 'arrived') {
          hint.slot = null;
          message = ['شغّل خطتك وشاهد ما يحدث.', 'Play your plan and see what happens.'];
        } else {
          hint.op = selected === hint.slot ? card.answer[hint.slot] : null;
          message = ['المس البطاقة المحدّدة لتبدّلها.', 'Tap the outlined card to change it.'];
        }
      } else if (card.mode === 'swap') {
        message = ['أي بطاقة توصل الروبوت إلى اليراعة أولًا؟', 'Which card will take Wick to the firefly first?'];
      } else if (card !== M.studio) {
        for (var i = 0; i < draft.tape.length && draft.tape[i] === card.answer[i]; i++) {}
        if (i < draft.tape.length) {
          hint.slot = i;
          message = ['تراجع حتى هذه البطاقة، ثم جرّب اتجاهًا آخر.', 'Undo back to this card, then try a different direction.'];
        } else {
          hint.op = card.answer[i];
          hint.slot = i;
          message = hint.op ? ['جرّب البطاقة المضيئة.', 'Try the glowing card.'] :
            ['شغّل خطتك وشاهد ما يحدث.', 'Play your plan and see what happens.'];
        }
      } else {
        message = ['جرّب دورانًا بين خطوتين وارسم منعطفًا.', 'Try putting a turn between two moves to draw a bend.'];
      }
      storeDraft();
      render();
    }
    function changeTape(action, value) {
      var direct = M.direct(card);
      var previous = direct && result ? result.trace.length : 0;
      var replace = card.mode === 'repair';
      var added = action === 'add';
      hint = null; message = null;
      if (added) {
        if (replace) { draft.tape[selected] = value; selected = -1; }
        else draft.tape.push(value);
      } else if (action === 'undo') draft.tape.pop();
      else if (action === 'swap') draft.tape.reverse();
      else draft.tape = [];
      storeDraft();
      if (direct && added) { play(false, previous); return; }
      result = direct ? M.route(card, draft.tape, draft.guess) : null;
      if (direct && draft.tape.length && result.status === 'away') {
        message = ['جرّب السهم التالي، أو تراجع لتغيّر الطريق.', 'Try another arrow, or undo to change direction.'];
      }
      render();
      if (added) tone([660]);
    }
    function click(event) {
      var target = event.target;
      while (target && target !== host && !(target.getAttribute && target.getAttribute('data-j'))) target = target.parentNode;
      if (!target || target === host || target.disabled) return;
      var parts = target.getAttribute('data-j').split(':'), action = parts.shift(), value = parts.join(':');
      if (action === 'listen') { listen(); return; }
      if (action === 'grownups') { grownups = !grownups; render(); return; }
      if (action === 'chart' || action === 'return') {
        if (action === 'chart') suspend();
        chart = action === 'chart';
        render('h1'); return;
      }
      if (action === 'replay' || action === 'open') {
        if (action === 'open' && value === card.id) { chart = false; render('h1'); return; }
        ready(action === 'replay' ? card.id : value, action === 'replay');
        render('h1'); return;
      }
      if (action === 'pause') { suspend(); return; }
      if (action === 'play' || action === 'step') { play(action === 'step'); return; }
      if (action === 'hint') { giveHint(); return; }
      if (action === 'select') {
        selected = Number(value);
        if (hint) hint.op = card.answer[selected];
        message = ['اختر أمرًا جديدًا لهذه البطاقة.', 'Choose a new command for this card.'];
        render(); return;
      }
      if (action === 'guess') { draft.guess = value; message = null; hint = null; result = null; storeDraft(); render('[data-j="play"]'); return; }
      changeTape(action, value);
    }

    ready(progress.current, false);
    host.addEventListener('click', click, false);
    render();
    return {
      configure: function (newLanguage, newSound) {
        if (newLanguage === language && newSound === sound) return;
        stopAudio();
        language = newLanguage; sound = newSound; render();
      },
      suspend: suspend,
      destroy: function () {
        stopAudio(); clearTimeout(timer); host.removeEventListener('click', click, false);
        if (chimes && chimes.close) chimes.close().catch(function () {});
      }
    };
  }
  w.APP360_COMMAND_JOURNEY = { mount: mount };
}(window, document, window.COMMAND_JOURNEY));
