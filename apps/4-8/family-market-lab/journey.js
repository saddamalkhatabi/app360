(function (w, d) {
  'use strict';

  var M = w.MarketJourneyModel;
  var objects = {};
  w.APP360_MARKET_OBJECTS.items.forEach(function (item) { objects[item.id] = item; });
  var levels = M.levels;
  var orderTotal = levels.reduce(function (total, level) { return total + level.rounds.length; }, 0);
  var storageBase = 'app360:a4-family-market:journey-1:';
  var memory = {};
  var player = new Audio();
  var audioQueue = [];
  var audioPlaying = false;
  var audioEnd = null;
  var hint = null;
  var drag = null;
  var ignoreClickUntil = 0;
  var profile, state, task;
  var embed = /(?:^|[?&])(?:embed|embedded)=1(?:&|$)/.test(w.location.search);

  function el(id) { return d.getElementById(id); }
  function tr(ar, en) { return state.language === 'ar' ? ar : en; }
  function n(value) {
    return tr(String(value).replace(/[0-9]/g, function (digit) { return '٠١٢٣٤٥٦٧٨٩'[Number(digit)]; }), String(value));
  }
  function portion(value, total) { return n(value) + tr(' من ', ' / ') + n(total); }
  function picture(id, classes) {
    return '<img class="' + (classes || 'product-img') + '" src="../../../' + objects[id].image + '" alt="" draggable="false">';
  }
  function asset(kind) {
    return task.order.products[task.mode === 'add' ? 0 : kind];
  }
  function productName(id) { return objects[id][state.language]; }
  function label(kind) {
    return task.mode === 'pay' ? tr('قطعة نقد', 'Coin') : productName(asset(kind));
  }
  function numberButton(value, cls) {
    return '<button type="button" class="number-button ' + (cls || '') + '" data-action="number" data-value="' +
      value + '" aria-label="' + tr('اسمع الرقم ', 'Hear the number ') + n(value) + '">' + n(value) + '</button>';
  }
  function slotArt(kind) {
    if (task.mode === 'pay') return '<span class="coin" aria-hidden="true">' + n(1) + '</span>';
    return picture(asset(kind));
  }
  function text(id, ar, en) { el(id).textContent = tr(ar, en); }

  function identify() {
    try {
      var parent = w.parent;
      var family = parent.APP360_FAMILY_SYNC || w.APP360_FAMILY_SYNC;
      var key = family && family.getProfileKey && family.getProfileKey();
      if (key && key !== 'name:') return String(key);
    } catch (error) { /* Cross-origin embeds use the local account. */ }
    var api = w.APP360_SESSION;
    var account = api && api.getProfile && api.getProfile();
    return account && (account.id || account.child_id || account.user_id) ?
      'account:' + String(account.id || account.child_id || account.user_id) : 'local-guest';
  }

  function save() {
    memory[profile] = JSON.stringify(state);
    try { w.localStorage.setItem(storageBase + profile, memory[profile]); } catch (error) { /* Session memory stays available. */ }
  }

  function loadProfile(key) {
    profile = key;
    var raw = memory[key];
    try { raw = w.localStorage.getItem(storageBase + key) || raw; } catch (error) { /* Fall back to session memory. */ }
    try { state = M.load(JSON.parse(raw || 'null')); } catch (error) { state = M.load(null); }
    rehydrate();
  }

  function rehydrate() {
    task = M.start(state.level, state.round);
    if (state.basket === null) state.basket = task.initial.slice();
    render();
  }

  var schoolFeedback = w.APP360_SCHOOL_VOICE_FEEDBACK && w.APP360_SCHOOL_VOICE_FEEDBACK.create();
  function stopAudio() {
    if (schoolFeedback) schoolFeedback.stop();
    audioQueue = [];
    audioPlaying = false;
    audioEnd = null;
    player.pause();
    el('listen-button').removeAttribute('data-playing');
  }

  function audioNext() {
    var id = audioQueue.shift();
    if (!id) {
      stopAudio();
      return;
    }
    if ((id === 'success' || id === 'finish') && schoolFeedback &&
        schoolFeedback.play({ language: state.language, enabled: state.sound }, stopAudio)) return;
    var source = 'audio/journey/' + state.language + '-' + id + '.mp3';
    audioPlaying = true;
    player.src = source;
    var callback = function () { if (audioEnd === callback) audioNext(); };
    audioEnd = callback;
    var pending = player.play();
    if (pending && pending.catch) pending.catch(function () {
      if (audioEnd === callback) stopAudio();
    });
  }

  player.addEventListener('ended', function () { if (audioEnd) audioEnd(); });
  player.addEventListener('error', stopAudio);

  function speak(clips, order) {
    stopAudio();
    if (!state.sound) return;
    audioQueue = clips.slice();
    if (order) el('listen-button').setAttribute('data-playing', 'true');
    audioNext();
  }

  function speakOrder() {
    if (task.mode === 'recognize') speak(['recognize', 'number-' + task.goal], true);
    else speak([task.mode], true);
  }

  var modeCopy = {
    recognize: ['طابق الرقم على البسطة مع رقم الطلب.', 'Match the order number on the stall.'],
    count: ['عدّ كل قطعة ثم ضعها في سلّتك.', 'Count the items into your basket.'],
    mixed: ['جهّز النوعين كما في قائمة الزبون.', 'Fill the basket with both kinds on the list.'],
    add: ['انقل المجموعتين إلى سلّة واحدة.', 'Put both groups into one basket.'],
    subtract: ['أعِد القطع الزائدة حتى يبقى العدد المطلوب.', 'Return the extras until the basket matches.'],
    pay: ['ضع قطعة نقد واحدة في كل دائرة.', 'Place one coin in each circle.']
  };

  function setChrome() {
    var ar = state.language === 'ar';
    d.documentElement.lang = state.language;
    d.documentElement.dir = ar ? 'rtl' : 'ltr';
    d.title = tr('سوق العائلة | مدرسة العائلة 360', 'Family Market | Family School 360');
    text('brand-title', 'سوق العائلة', 'Family Market');
    text('brand-caption', 'مدرسة العائلة 360', 'Family School 360');
    text('sound-label', state.sound ? 'الصوت' : 'صامت', state.sound ? 'Sound' : 'Muted');
    el('sound-toggle').setAttribute('aria-pressed', String(state.sound));
    el('language-toggle').lang = ar ? 'en' : 'ar';
    text('language-toggle', 'English', 'العربية');
    text('progress-label', 'رحلتي', 'My journey');
    text('page-title', 'يومٌ في السوق', 'A day at the market');
    text('page-intro', 'جهّز طلبات الزبائن، وتعلّم الأرقام وأنت تلعب.', 'Fill shopping orders and learn numbers as you play.');
    text('overall-label', 'الطلبات المكتملة', 'Orders complete');
    el('overall-number').textContent = portion(state.completed.length, orderTotal);
    el('level-path').setAttribute('aria-label', tr('المستويات', 'Levels'));
    el('scene').setAttribute('aria-label', tr('بسطة السوق والسلة', 'Market stall and basket'));
    text('voice-credit', 'الإرشاد الصوتي بصوت SILMA', 'Narration by SILMA');
    text('progress-title', 'رحلتي في السوق', 'My market journey');
    text('close-progress', 'إغلاق', 'Close');
    text('classic-link', 'الطلبات السابقة وأدوات المرافق', 'Previous orders and grown-up tools');
    text('installAppBtn', 'تثبيت', 'Install');
    text('updateAppBtn', 'تحديث', 'Update');
    el('listen-button').setAttribute('aria-label', tr('اسمع الطلب', 'Hear the order'));
    text('help-label', 'ساعدني', 'Help me');
    text('reset-button', '↶  أعد الطلب', '↶  Reset order');
    if (embed) {
      el('app360HomeBtn').removeAttribute('href');
      el('classic-link').target = '_blank';
      el('classic-link').rel = 'noopener';
    }
  }

  function levelButtons() {
    var symbols = ['١٢', '▦', '☷', '+', '−', '◉'];
    el('level-path').innerHTML = levels.map(function (level, i) {
      var done = completedAt(i) === level.rounds.length;
      return '<button class="level" type="button" data-action="level" data-value="' + i + '"' +
        (i === state.level ? ' aria-current="step"' : '') + '><span class="level-symbol" aria-hidden="true">' +
        (done ? '✓' : i === 0 ? tr('١٢', '12') : symbols[i]) + '</span><span class="level-copy"><small>' +
        tr('المستوى ', 'Level ') + n(i + 1) + '</small><strong>' + level[state.language] + '</strong></span></button>';
    }).join('');
  }

  function completedAt(index) {
    return levels[index].rounds.reduce(function (total, _, round) {
      return total + (state.completed.indexOf(index + ':' + round) >= 0 ? 1 : 0);
    }, 0);
  }

  function renderProgress() {
    el('progress-levels').innerHTML = levels.map(function (level, index) {
      var done = completedAt(index);
      return '<button type="button" class="progress-level" data-action="level" data-value="' + index + '"><strong>' +
        level[state.language] + '</strong><span>' + portion(done, level.rounds.length) + '</span></button>';
    }).join('');
  }

  function renderOrder() {
    el('order-index').textContent = tr('الطلب ', 'Order ') + n(state.round + 1) + tr(' من ', ' of ') +
      n(levels[state.level].rounds.length);
    text('order-title', 'طلب الزبون', 'Customer order');
    el('order-instruction').textContent = modeCopy[task.mode][state.language === 'ar' ? 0 : 1];

    var order = task.order, html = '';
    if (task.mode === 'recognize') {
      html = '<div class="recognize-order"><span>' + tr('الرقم المطلوب', 'Find this number') + '</span>' +
        numberButton(task.goal, 'number-large') + '</div>';
    } else if (order.targets || task.mode === 'subtract') {
      var amounts = order.targets || [task.goal];
      if (task.mode === 'subtract') {
        html += '<div class="equation"><bdi dir="ltr">' + n(order.parts[0]) + ' − ' + n(order.parts[1]) +
          ' = <strong>' + n(task.goal) + '</strong></bdi></div>';
      }
      html += amounts.map(function (amount, kind) {
        if (!amount) return '';
        var id = order.products[kind];
        var current = M.count(state.basket, kind);
        return '<div class="order-row' + (current === amount ? ' order-row-ready' : '') + '">' +
          picture(id) + '<span><strong>' + productName(id) + '</strong><small>' + tr('في السلة ', 'In basket ') +
          n(current) + '</small></span>' + numberButton(amount) + '</div>';
      }).join('');
    } else if (task.mode === 'add') {
      html = '<div class="equation color-equation"><bdi dir="ltr"><span>' + n(order.parts[0]) + '</span> + <span>' +
        n(order.parts[1]) + '</span> = <strong>' + (state.delivered ? n(task.goal) : tr('؟', '?')) + '</strong></bdi></div>' +
        '<div class="order-row">' + picture(order.products[0]) + '<strong>' +
        productName(order.products[0]) + '</strong></div>';
    } else {
      html = '<div class="equation"><bdi dir="ltr">' + n(order.parts[0]) + ' + ' + n(order.parts[1]) +
        ' = <strong>' + n(task.goal) + '</strong></bdi></div><div class="order-row">' + picture(order.products[0]) +
        '<span><strong>' + productName(order.products[0]) + '</strong><small>' + tr('الثمن بالنقود', 'Price in coins') +
        '</small></span>' + numberButton(task.goal) + '</div>';
    }
    el('order-details').innerHTML = html;
    var deliver = el('deliver-button');
    deliver.hidden = task.mode === 'recognize' || state.delivered;
    deliver.classList.toggle('ready', M.check(task, state.basket));
    text('deliver-button', 'سلّم الطلب', 'Deliver order');
    el('help-button').hidden = state.delivered;
  }

  function renderScene() {
    var mode = task.mode;
    var recognition = mode === 'recognize';
    var payment = mode === 'pay';
    el('scene').classList.toggle('recognition', recognition);
    el('scene').classList.toggle('payment', payment);
    el('reset-button').hidden = state.delivered || recognition;
    el('reset-button').disabled = state.basket.join(',') === task.initial.join(',');

    text('market-title', payment ? 'صندوق السوق' : 'ساحة السوق', payment ? 'Market checkout' : 'Market square');
    text('stall-title', recognition ? 'بسطة الأرقام' : payment ? 'المحفظة' : 'البسطة',
      recognition ? 'Number stall' : payment ? 'Wallet' : 'Market stall');
    text('basket-title', recognition ? 'سلة الزبون' : payment ? 'صحن الدفع' : 'سلّتي',
      recognition ? 'Customer basket' : payment ? 'Payment tray' : 'My basket');
    text('basket-caption', recognition ? (state.delivered ? 'الرقم والكمية متطابقان' : 'عدّ الصور ثم اختر الرقم') :
      payment ? 'كل دائرة تسع قطعة واحدة' : mode === 'subtract' ? 'اضغط على قطعة لإعادتها' : 'اضغط لإعادة أي قطعة',
    recognition ? (state.delivered ? 'The number and quantity match' : 'Count the pictures, then pick a number') :
      payment ? 'One coin fits each circle' : mode === 'subtract' ? 'Tap an item to return it' : 'Tap an item to return it');
    text('play-tip', recognition ? 'اضغط على الرقم المطابق.' : payment ? 'اضغط على قطعة نقد أو اسحبها إلى الصحن.' :
      'اضغط على الصورة أو اسحبها بين البسطة والسلّة.',
    recognition ? 'Tap the matching number.' : payment ? 'Tap a coin or drag it to the tray.' :
      'Tap a picture or drag it between the stall and basket.');
    el('basket-counter').textContent = recognition ? (state.delivered ? n(task.goal) : tr('؟', '?')) :
      mode === 'mixed' || mode === 'add' ? n(state.basket.length) : portion(state.basket.length, task.goal);

    renderStock();
    renderBasket();
    var done = el('order-done');
    done.hidden = !state.delivered;
    var last = state.level === levels.length - 1 && state.round === levels[state.level].rounds.length - 1;
    text('done-title', 'اكتمل الطلب!', 'Order ready!');
    text('done-text', state.completed.length === orderTotal ? 'أنهيت كل طلبات السوق.' : 'أُضيف الطلب إلى رحلتك.',
      state.completed.length === orderTotal ? 'You filled all the market orders.' : 'The order is saved in your journey.');
    var next = el('next-button');
    next.setAttribute('data-action', last ? 'progress' : 'next');
    if (last) text('next-button', 'اعرض رحلتي', 'See my journey');
    else if (state.round === levels[state.level].rounds.length - 1) text('next-button', 'المستوى التالي', 'Next level');
    else text('next-button', 'الطلب التالي', 'Next order');
  }

  function renderStock() {
    var html;
    if (task.mode === 'recognize') {
      html = task.order.choices.map(function (value) {
        return '<button type="button" class="number-tile' + (state.delivered && value === task.goal ? ' chosen' : '') +
          '" data-action="choose" data-value="' + value + '"' + (state.delivered ? ' disabled' : '') + '>' + n(value) + '</button>';
      }).join('');
    } else {
      html = M.stock(task).map(function (capacity, kind) {
        var available = capacity - M.count(state.basket, kind);
        var group = task.mode === 'add' ? ' group-' + kind : '';
        var returned = task.mode === 'subtract';
        var attr = ' data-action="take" data-value="' + kind + '"';
        var maxIcons = returned || task.mode === 'add' || task.mode === 'pay' ? Math.max(available, 1) : 1;
        var art = '';
        for (var i = 0; i < maxIcons; i++) art += slotArt(kind);
        return '<button type="button" class="crate' + group + (!available ? ' empty-crate' : '') + '"' + attr +
          ' aria-label="' + tr('خذ ', 'Take ') + label(kind) + ' · ' + n(available) + '" ' +
          (!available || state.delivered ? 'disabled' : '') + '><span class="crate-pictures">' + art +
          '</span><span class="crate-label">' + (returned ? tr('صندوق المرتجعات', 'Returns crate') :
            task.mode === 'add' ? tr('مجموعة ', 'Group ') + n(kind + 1) : label(kind)) +
          '</span>' + (task.order.targets ? '' : '<span class="crate-count">' + n(available) + '</span>') + '</button>';
      }).join('');
    }
    el('stock').innerHTML = html;
  }

  function renderBasket() {
    var mode = task.mode;
    var limit = Math.max(state.basket.length, task.goal);
    var out = '';
    for (var i = 0; i < limit; i++) {
      if (mode === 'recognize') {
        out += '<span class="slot sample">' + picture(task.order.products[0]) + '</span>';
      } else if (i < state.basket.length) {
        var kind = state.basket[i];
        out += '<button type="button" class="slot item-slot' + (mode === 'add' ? ' group-' + kind : '') +
          '" data-action="return" data-value="' + i + '" aria-label="' + tr('أعِد ', 'Return ') + label(kind) + ' ' +
          n(i + 1) + '"' + (state.delivered ? ' disabled' : '') + '>' + slotArt(kind) + '</button>';
      } else {
        out += '<span class="slot vacant" aria-hidden="true">' + n(i + 1) + '</span>';
      }
    }
    el('basket-slots').innerHTML = out;
  }

  function render() {
    setChrome();
    levelButtons();
    renderOrder();
    renderScene();
    renderProgress();
  }

  function mark(message, kind) {
    var node = el('feedback');
    node.textContent = message;
    node.className = 'feedback' + (kind ? ' ' + kind : '');
  }

  function focus(node) {
    if (node) node.focus({ preventScroll: true });
  }

  function newOrder(level, round) {
    stopAudio();
    clearHint();
    endDrag();
    state.level = level;
    state.round = round;
    state.basket = null;
    state.delivered = false;
    el('progress-panel').hidden = true;
    mark('');
    rehydrate();
    save();
  }

  function chooseLevel(index) {
    if (!levels[index]) return;
    if (index === state.level && !state.delivered) {
      el('progress-panel').hidden = true;
    } else {
      var round = 0;
      while (round < levels[index].rounds.length && state.completed.indexOf(index + ':' + round) !== -1) round++;
      newOrder(index, round === levels[index].rounds.length ? 0 : round);
    }
    focus(el('order-title'));
    if (el('order-title').scrollIntoView) el('order-title').scrollIntoView({ block: 'nearest' });
    speakOrder();
  }

  function move(action, value, keyboard) {
    if (state.delivered || task.mode === 'recognize') return;
    var updated = M.change(task, state.basket, action, value);
    if (!updated) return;
    clearHint();
    if (audioPlaying) stopAudio();
    state.basket = updated;
    save();
    renderOrder();
    renderScene();
    var ready = M.check(task, state.basket);
    mark(ready ? tr('الطلب مطابق. سلّمه للزبون!', 'The order matches. Ready to deliver!') :
      task.mode === 'pay' ? tr('النقود في الصحن ', 'Coins in the tray ') + n(state.basket.length) :
      tr('في السلّة الآن ', 'In the basket now ') + n(state.basket.length), ready ? 'good' : '');
    if (state.basket.length <= 10) speak(['number-' + state.basket.length]);
    if (keyboard) focus(d.querySelector('[data-action="' + action + '"][data-value="' +
      value + '"]:not(:disabled)') || el('deliver-button'));
  }

  function deliver(choice) {
    if (state.delivered) return;
    clearHint();
    if (!M.check(task, state.basket, choice)) {
      mark(task.mode === 'recognize' ? tr('انظر إلى رقم الطلب وجرّب مرة أخرى.', 'Look at the order number and try again.') :
        tr('انظر إلى الطلب، ثم قارن ما فيه بما جمعت.', 'Look at the order and compare it with what you collected.'), 'try');
      speak(['retry']);
      return;
    }
    state.delivered = true;
    var key = state.level + ':' + state.round;
    if (state.completed.indexOf(key) < 0) state.completed.push(key);
    save();
    mark('');
    render();
    var title = el('done-title');
    focus(title);
    if (title.scrollIntoView) title.scrollIntoView({ block: 'nearest' });
    var reward = state.completed.length === orderTotal ? 'finish' : 'success';
    speak(task.mode === 'recognize' ? ['number-' + task.goal, reward] : [reward]);
    var event = d.createEvent('CustomEvent');
    event.initCustomEvent('app360:market:saved', true, false, { level: state.level + 1, round: state.round + 1, mode: task.mode });
    d.dispatchEvent(event);
  }

  function clearHint() {
    if (!hint) return;
    w.clearTimeout(hint.timer);
    if (hint.animation) hint.animation.cancel();
    if (hint.ghost && hint.ghost.parentNode) hint.ghost.parentNode.removeChild(hint.ghost);
    hint.nodes.forEach(function (node) { node.classList.remove('hint-target'); });
    hint = null;
  }

  function findAction(action, value) {
    return d.querySelector('button[data-action="' + action + '"][data-value="' + value + '"]');
  }

  function demonstrate() {
    if (state.delivered) return;
    clearHint();
    endDrag();
    var next = M.suggestion(task, state.basket);
    var source = next.action === 'deliver' ? el('deliver-button') : findAction(next.action, next.value);
    if (!source) return;
    var destination = null;
    var returning = next.action === 'return';
    if (returning) destination = findAction('take', state.basket[next.value]) || el('stall');
    else if (next.action === 'take') destination = el('basket-slots').querySelector('.vacant') || el('basket-body');

    var line = next.action === 'choose' ? 'hint-recognize' : !destination ? 'hint-check' : returning ?
      'hint-return' : task.mode === 'pay' ? 'hint-pay' : 'hint-add';
    source.classList.add('hint-target');
    if (destination) destination.classList.add('hint-target');
    mark(line === 'hint-recognize' ? tr('ابحث عن الرقم المضيء على البسطة.', 'Look for the glowing number on the stall.') :
      line === 'hint-check' ? tr('الطلب جاهز. اضغط «سلّم الطلب».', 'Ready! Tap Deliver order.') :
      line === 'hint-return' ? tr('أعِد القطعة المضيئة إلى البسطة.', 'Return the glowing item to the stall.') :
      task.mode === 'pay' ? tr('ضع قطعة نقد في الدائرة المضيئة.', 'Put a coin on the glowing circle.') :
      tr('انقل قطعة من الصندوق المضيء إلى السلّة.', 'Move one item from the glowing crate into the basket.'), 'guide');
    speak([line]);

    if (destination && el('scene').getBoundingClientRect().bottom > w.innerHeight) {
      el('scene').scrollIntoView({ block: 'nearest' });
    } else if (!destination && source.scrollIntoView) source.scrollIntoView({ block: 'nearest' });

    hint = { nodes: destination ? [source, destination] : [source], x: w.pageXOffset, y: w.pageYOffset };
    if (destination && !reducedMotion()) {
      var visual = source.querySelector('.product-img, .coin');
      if (visual && visual.animate) {
        var origin = visual.getBoundingClientRect();
        var target = destination.getBoundingClientRect();
        var dx = target.left + target.width / 2 - origin.left - origin.width / 2;
        var dy = target.top + target.height / 2 - origin.top - origin.height / 2;
        var ghost = floating(visual, origin);
        hint.ghost = ghost;
        hint.animation = ghost.animate([
          { transform: 'translate(0,0)', opacity: 1 },
          { transform: 'translate(' + dx / 2 + 'px,' + (dy / 2 - 27) + 'px)', opacity: 1, offset: 0.5 },
          { transform: 'translate(' + dx + 'px,' + dy + 'px)', opacity: 1, offset: 0.86 },
          { transform: 'translate(' + dx + 'px,' + dy + 'px)', opacity: 0 }
        ], { duration: 880, easing: 'ease-in-out', fill: 'forwards' });
      }
    }
    hint.timer = w.setTimeout(clearHint, 4200);
  }

  function reducedMotion() {
    return !!(w.matchMedia && w.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }

  function floating(visual, bounds) {
    var ghost = visual.cloneNode(true);
    ghost.classList.add('flying-item');
    ghost.setAttribute('aria-hidden', 'true');
    ghost.style.left = bounds.left + 'px';
    ghost.style.top = bounds.top + 'px';
    ghost.style.width = bounds.width + 'px';
    ghost.style.height = bounds.height + 'px';
    d.body.appendChild(ghost);
    return ghost;
  }

  function buttonAt(node) {
    while (node && node !== d) {
      if (node.tagName === 'BUTTON' && node.hasAttribute('data-action')) return node;
      node = node.parentNode;
    }
    return null;
  }

  function endDrag() {
    if (!drag) return;
    if (drag.ghost && drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost);
    drag.source.classList.remove('dragging');
    drag.target.classList.remove('drop-target');
    drag = null;
  }

  d.addEventListener('pointerdown', function (e) {
    ignoreClickUntil = 0;
    if (drag || state.delivered || e.button !== 0) return;
    var source = buttonAt(e.target);
    var action = source && source.getAttribute('data-action');
    if (!source || source.disabled || (action !== 'take' && action !== 'return')) return;
    drag = { id: e.pointerId, source: source, action: action, value: Number(source.getAttribute('data-value')),
      x: e.clientX, y: e.clientY, target: el(action === 'take' ? 'basket-body' : 'stall'), ghost: null };
  });

  d.addEventListener('pointermove', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var x = e.clientX - drag.x, y = e.clientY - drag.y;
    if (!drag.ghost && x * x + y * y < 100) return;
    if (!drag.ghost) {
      clearHint();
      var visual = drag.source.querySelector('.product-img, .coin');
      drag.ghost = floating(visual, visual.getBoundingClientRect());
      drag.source.classList.add('dragging');
      drag.target.classList.add('drop-target');
    }
    drag.ghost.style.transform = 'translate(' + x + 'px,' + y + 'px)';
  });

  d.addEventListener('pointerup', function (e) {
    if (!drag || e.pointerId !== drag.id) return;
    var held = drag;
    var to = d.elementFromPoint(e.clientX, e.clientY);
    if (held.ghost) {
      var target = held.action === 'take' ? el('basket-area') : held.target;
      ignoreClickUntil = Date.now() + 500;
      if (to && target.contains(to)) move(held.action, held.value);
    } else if (e.pointerType !== 'mouse' && to && held.source.contains(to)) {
      ignoreClickUntil = Date.now() + 500;
      move(held.action, held.value);
    }
    endDrag();
  });
  d.addEventListener('pointercancel', endDrag);

  d.addEventListener('click', function (e) {
    var target = buttonAt(e.target);
    if (e.detail && ignoreClickUntil >= Date.now()) {
      ignoreClickUntil = 0;
      return;
    }
    if (!target || target.disabled) return;
    var action = target.getAttribute('data-action'), value = Number(target.getAttribute('data-value'));
    var keyboard = e.detail === 0;
    if (action === 'level') chooseLevel(value);
    if (action === 'choose') deliver(value);
    if (action === 'take' || action === 'return') move(action, value, keyboard);
    if (action === 'deliver' && task.mode !== 'recognize') deliver();
    if (action === 'help') demonstrate();
    if (action === 'number') speak(['number-' + value]);
    if (action === 'listen') {
      if (!state.sound) { state.sound = true; save(); setChrome(); }
      if (target.hasAttribute('data-playing')) stopAudio();
      else speakOrder();
    }
    if (action === 'sound') {
      state.sound = !state.sound;
      save();
      setChrome();
      if (state.sound) speak(['welcome']);
      else stopAudio();
    }
    if (action === 'language') {
      stopAudio();
      clearHint();
      state.language = tr('en', 'ar');
      mark('');
      save();
      render();
    }
    if (action === 'reset') {
      newOrder(state.level, state.round);
      focus(el('order-title'));
      speakOrder();
    }
    if (action === 'next') {
      var nextLevel = state.level;
      var nextRound = state.round + 1;
      if (nextRound >= levels[nextLevel].rounds.length) { nextLevel++; nextRound = 0; }
      if (!levels[nextLevel]) return;
      newOrder(nextLevel, nextRound);
      focus(el('order-title'));
      el('order-title').scrollIntoView({ block: 'nearest' });
      speakOrder();
    }
    if (action === 'progress') {
      el('progress-panel').hidden = false;
      focus(el('progress-title'));
      el('progress-panel').scrollIntoView({ block: 'nearest' });
    }
    if (action === 'close-progress') {
      el('progress-panel').hidden = true;
      focus(d.querySelector('.header-progress'));
      d.querySelector('.header-progress').scrollIntoView({ block: 'nearest' });
    }
  });

  function refreshProfile() {
    var key = identify();
    if (profile === key) return;
    stopAudio();
    clearHint();
    endDrag();
    mark('');
    el('progress-panel').hidden = true;
    loadProfile(key);
  }

  function pause() { stopAudio(); clearHint(); endDrag(); }
  w.addEventListener('pagehide', pause);
  w.addEventListener('resize', function () {
    clearHint();
    endDrag();
  });
  w.addEventListener('scroll', function () {
    if (hint && hint.ghost && (hint.x !== w.pageXOffset || hint.y !== w.pageYOffset)) clearHint();
  }, { passive: true });
  d.addEventListener('visibilitychange', function () { if (d.hidden) pause(); });
  d.addEventListener('app360:authchange', refreshProfile);
  w.setInterval(refreshProfile, 1600);
  loadProfile(identify());

  w.APP360_PWA_BEFORE_RELOAD = function (done) { save(); pause(); done(); };
  w.APP360_PWA_APPLY_PENDING = function () { return false; };
  w.APP360_MARKET = {
    version: 'market-journey-3',
    snapshot: function () { return JSON.parse(JSON.stringify(state)); },
    profile: function () { return profile; },
    stop: pause
  };
})(window, document);
