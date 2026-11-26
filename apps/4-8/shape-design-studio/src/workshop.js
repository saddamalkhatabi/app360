(function (root, doc, G, content) {
  'use strict';

  var WIDTH = 480, HEIGHT = 310;
  var palette = { mint: '#52c6a4', amber: '#ffc768', blue: '#73a9f2', rose: '#f48e96', violet: '#af9cf0' };

  function attr(value) {
    return String(value).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function polygon(points, style) {
    return '<polygon points="' + coordinates(points) + '" ' + style + '/>';
  }

  function coordinates(points) {
    return points.map(function (p) {
      return p[0].toFixed(4) + ',' + p[1].toFixed(4);
    }).join(' ');
  }

  function bounds(poly) {
    var xs = poly.map(function (p) { return p[0]; }), ys = poly.map(function (p) { return p[1]; });
    return [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)];
  }

  function mount(host, context) {
    var profile, state, mission, draft, selected, undo, message, check, blade, drag;
    var language, storageOK = true, localMemory = {};
    var byId = {};
    var paths = {
      build: 'M5 13h6v6H5z M13 13h6v6h-6z M5 11l7-7 7 7z',
      angle: 'M4 19h16M4 19l11-13M12 19a8 8 0 0 0-3-6',
      cut: 'M5 5h14v14H5z M5 19 19 5',
      floor: 'M4 4h16v16H4z M4 12h16M12 4v16',
      audio: 'M11 6 6 10H3v4h3l5 4z M15 9a4 4 0 0 1 0 6 M18 6a8 8 0 0 1 0 12',
      hand: 'M8 12V7a1 1 0 0 1 2 0v5-7a1 1 0 0 1 2 0v7-5a1 1 0 0 1 2 0v6-4a1 1 0 0 1 2 0v5l1-1a1 1 0 0 1 2 1l-2 5H9l-4-6a1 1 0 0 1 2-1l1 1',
      hint: 'M9 19h6m-5 2h4m-5-4c0-2-3-3-3-7a6 6 0 0 1 12 0c0 4-3 5-3 7z',
      undo: 'M9 6 4 11l5 5m-5-5h10a5 5 0 0 1 0 10',
      check: 'm5 12 4 4L19 6',
      turn: 'M19 11A7 7 0 1 0 17 17m2-11v5h-5',
      return: 'M5 12v7h14v-7M12 4v11m-4-4 4 4 4-4'
    };
    content.missions.forEach(function (item) { byId[item.id] = item; });

    function t(ar, en) { return language === 'en' ? en : ar; }
    function word(pair) { return pair[language === 'en' ? 1 : 0]; }
    function num(value) {
      return t(String(value).replace(/[0-9]/g, function (n) { return '٠١٢٣٤٥٦٧٨٩'[Number(n)]; }), String(value));
    }
    function degrees(value) { return num(value) + '°'; }
    function counter(current, total) {
      return '<span class="ws-counter" dir="ltr"><bdi>' + num(current) + '</bdi><span>/</span><bdi>' + num(total) + '</bdi></span>';
    }
    function icon(id) {
      return '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="' + paths[id] +
        '" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    }
    function button(cmd, label, options) {
      options = options || {};
      return '<button type="button" data-ws="' + cmd + '"' +
        (options.value !== undefined ? ' data-value="' + options.value + '"' : '') +
        (options.className ? ' class="' + options.className + '"' : '') +
        (options.pressed !== undefined ? ' aria-pressed="' + options.pressed + '"' : '') +
        (options.title ? ' aria-label="' + attr(options.title) + '" title="' + attr(options.title) + '"' : '') +
        (options.disabled ? ' disabled' : '') + '>' + (options.icon ? icon(options.icon) : '') +
        (label ? '<span>' + label + '</span>' : '') + '</button>';
    }
    function find(id) {
      return draft.pieces.filter(function (p) { return p.id === id; })[0];
    }
    function storageKey() { return 'app360:a4-shape-workshop:1:' + encodeURIComponent(profile); }
    function save() {
      state.current = mission.id;
      state.drafts[mission.id] = G.copy(draft);
      localMemory[profile] = G.copy(state);
      try { root.localStorage.setItem(storageKey(), JSON.stringify(state)); storageOK = true; }
      catch (error) { storageOK = false; }
    }
    function load(id) {
      mission = byId[id];
      draft = G.restore(mission, state.drafts[id]);
      selected = null;
      check = null;
      if (state.completed[id]) {
        var result = G.evaluate(mission, draft);
        if (result.ok) check = result;
      }
      undo = [];
      message = '';
      blade = mission.stock ? (draft.cut === null ? 45 : draft.cut) : null;
    }
    function refresh(owner, locale) {
      language = locale;
      if (owner !== profile) {
        profile = owner;
        var saved = localMemory[profile];
        storageOK = true;
        if (!saved) {
          try { saved = JSON.parse(root.localStorage.getItem(storageKey()) || 'null'); }
          catch (error) { storageOK = false; }
        }
        var object = saved && typeof saved === 'object' ? saved : {};
        state = { current: 'courtyard', completed: {}, drafts: {} };
        content.missions.forEach(function (item) {
          if (object.completed && object.completed[item.id] === true) state.completed[item.id] = true;
          if (object.drafts && object.drafts[item.id]) state.drafts[item.id] = object.drafts[item.id];
        });
        load(byId[object.current] ? object.current : state.current);
      }
      render();
    }
    function change(edit) {
      undo.push(G.copy(draft));
      if (undo.length > 30) undo.shift();
      edit();
      message = '';
      check = null;
      save();
    }
    function changeMission(id, reset) {
      if (!byId[id]) return;
      save();
      if (reset) delete state.drafts[id];
      load(id);
      save();
    }
    function placed(item, landing) {
      change(function () {
        item.x = landing.x;
        item.y = landing.y;
        item.placed = true;
      });
      selected = item.id;
    }

    function levelList() {
      return '<nav class="ws-levels" aria-label="' + t('مراحل الورشة', 'Workshop stages') + '">' +
        content.levels.map(function (level, index) {
          var group = content.missions.filter(function (m) { return m.level === index; });
          var next = group.filter(function (m) { return !state.completed[m.id]; })[0] || group[0];
          var active = mission.level === index;
          return button('mission', '<strong>' + word(level.title) + '</strong><small>' +
            counter(group.filter(function (m) { return state.completed[m.id]; }).length, group.length) +
            ' · <bdi dir="ltr">' + num(level.age) + '</bdi></small>',
          { value: next.id, icon: level.icon, pressed: active, className: 'ws-level' });
        }).join('') + '</nav>';
    }

    function header() {
      var completed = Object.keys(state.completed).length;
      var ar = '<span class="ws-eyebrow">ورشة الهندسة · <bdi dir="ltr">٤–٨</bdi> سنوات</span><h1>مهندسو الأشكال</h1>' +
        '<p>اسحب قطعة، جرّب زاوية، وبلّط أرضية.</p>';
      var en = '<span class="ws-eyebrow">Geometry workshop · Ages 4–8</span><h1>Shape Engineers</h1>' +
        '<p>Drag a tile, try an angle and lay a floor.</p>';
      return '<header class="ws-hero"><div>' + t(ar, en) + '</div>' +
        '<div class="ws-hero-art" aria-hidden="true"><svg viewBox="0 0 230 130" focusable="false">' +
        '<path d="M22 92 102 26l104 39-80 48Z M48 72l104 40m-77-62 104 40M70 109l79-64m-54 73 79-64" fill="none" stroke="#72e7da" stroke-opacity=".55"/>' +
        '<path d="M72 87 104 59l35 14-33 27Z" fill="#3dcfa8"/><path d="M109 54l34-26 34 13-34 27Z" fill="#79b3ff"/>' +
        '<path d="m121 104 34-28 36 15-34 28Z" fill="#f9b867"/><path d="m52 68 35-27 8 25Z" fill="#f88c98"/>' +
        '<path d="M104 59v-23l35 14v23z" fill="#b9a7ff"/><path d="M43 32v16m-8-8h16M201 23v22m-11-11h22" stroke="#9bedde" stroke-linecap="round"/>' +
        '</svg></div><div class="ws-progress"><strong>' + counter(completed, content.missions.length) +
        '</strong><span>' + t('مهام مكتملة', 'Projects finished') + '</span><progress max="' +
        content.missions.length + '" value="' + completed + '" aria-label="' + t('تقدّم الورشة', 'Workshop progress') +
        '"></progress></div></header>';
    }

    function brief() {
      var group = content.missions.filter(function (m) { return m.level === mission.level; });
      return '<div class="ws-brief"><div><div class="ws-kicker">' + word(content.levels[mission.level].skill) + '</div>' +
        '<h2>' + word(mission.title) + '</h2><p>' + word(mission.task) + '</p></div>' +
        button('listen', t('أسمع', 'Listen'), { icon: 'audio' }) + '</div>' +
        '<nav class="ws-missions" aria-label="' + t('مهام المرحلة', 'Stage projects') + '">' + group.map(function (m) {
          return button('mission', word(m.title), { value: m.id, pressed: m === mission,
            icon: state.completed[m.id] ? 'check' : null });
        }).join('') + '</nav>';
    }

    function pieceLabel(p, index) {
      if (p.degrees) return degrees(p.degrees);
      if (p.id.indexOf('cut-') === 0) return t('جزء ', 'Cut piece ') + num(p.id.slice(-1));
      return t('قطعة ', 'Tile ') + num(index + 1);
    }
    function pieceSVG(p) {
      var rotated = G.world({ poly: p.poly, angle: p.angle, x: 0, y: 0 }), b = bounds(rotated);
      var size = Math.max(b[2] - b[0], b[3] - b[1]) * 1.23;
      return '<svg aria-hidden="true" focusable="false" viewBox="' +
        [(b[0] + b[2] - size) / 2, (b[1] + b[3] - size) / 2, size, size].join(' ') + '">' +
        polygon(rotated, 'fill="' + palette[p.color] + '" stroke="#173a4d" stroke-opacity=".27" stroke-width="2"') + '</svg>';
    }
    function tray() {
      return '<section class="ws-tray"><h3>' + icon('hand') + t('درج القطع', 'Tile tray') + '</h3><div class="ws-pieces">' +
        draft.pieces.map(function (p, i) {
          var label = pieceLabel(p, i);
          return '<button type="button" data-ws="select" data-value="' + p.id + '" aria-pressed="' + (p.id === selected) +
            '" class="ws-piece' + (p.placed ? ' on-board' : '') + '" aria-label="' +
            attr(label + (p.placed ? t(' على اللوحة', ' on the board') : '')) + '">' + pieceSVG(p) +
            '<span>' + label + (p.placed ? ' ✓' : '') + '</span></button>';
        }).join('') + (!draft.pieces.length ? '<p>' + t('بعد القص ستظهر القطعتان هنا.', 'Both pieces will appear here after cutting.') + '</p>' : '') +
        '</div></section>';
    }

    function cutGuide() {
      if (!mission.stock) return '';
      var stock = mission.stock, result = G.split(stock, blade), size = Math.max(stock.width, stock.height);
      var illustration = '<svg viewBox="' + [-16, -15, size + 38, size + 32].join(' ') +
        '" class="ws-stock" role="img" aria-label="' + attr(t('دليل القص ', 'Cut guide ') + degrees(blade)) +
        '"><defs><clipPath id="ws-stock-clip">' + polygon(stock.poly, '') + '</clipPath></defs>' +
        polygon(stock.poly, 'fill="#f6b5b7" stroke="#a74f60" stroke-width="1.5"') +
        result.halves.map(function (poly, i) { return polygon(poly, 'fill="' + (i ? '#ec96a1' : '#f9c5bd') + '"'); }).join('') +
        '<g clip-path="url(#ws-stock-clip)"><path d="M0 0H' + stock.width + '" stroke="#6e5360" stroke-width="2"/>' +
        '<path d="M0 0L' + result.line[1].join(' ') + '" stroke="#6f2542" stroke-width="2.8" stroke-dasharray="7 4"/>' +
        '<path d="M23 0 A23 23 0 0 1 ' + G.ray(23, blade).join(' ') + '" fill="none" stroke="#6f2542" stroke-width="1.5"/></g>' +
        '<circle cx="0" cy="0" r="3" fill="#6f2542"/></svg>';
      var discarded = draft.pieces.filter(function (p) { return p.id.indexOf('cut-') === 0 && !p.placed; });
      return '<section class="ws-cut"><h3>' + icon('cut') + t('طاولة القص', 'Cutting bench') + '</h3>' +
        '<div class="ws-cut-content">' + illustration + '<div><p>' +
        (draft.cut === null ? t('اختر ميل الدليل من الحافة الأفقية.', 'Set the guide angle from the horizontal edge.') :
        t('قصّة ', 'Cut at ') + degrees(draft.cut) + ' · ' + t('قطع في الدرج: ', 'Cut pieces in tray: ') + num(discarded.length)) + '</p>' +
        (draft.cut === null ? '<div class="ws-cut-options">' + stock.angles.map(function (angle) {
          return button('blade', degrees(angle), { value: angle, pressed: blade === angle });
        }).join('') + '</div>' + button('cut', t('أقصّ البلاطة', 'Cut the tile'), { className: 'ws-action' }) :
        button('recut', t('أجرّب قصّة أخرى', 'Try another cut'))) + '</div></div></section>';
    }

    function toolBox() {
      var p = find(selected);
      var left = t('أدوّر عكس عقارب الساعة', 'Turn counterclockwise');
      var right = t('أدوّر مع عقارب الساعة', 'Turn clockwise');
      var shift = mission.vertex ? 15 : 90;
      return '<div class="ws-tools" aria-label="' + t('أدوات القطعة', 'Tile controls') + '">' +
        button('turn', '<bdi dir="ltr">−' + degrees(shift) + '</bdi>', { value: -shift, icon: 'turn', title: left, disabled: !p }) +
        button('turn', '<bdi dir="ltr">+' + degrees(shift) + '</bdi>', { value: shift, icon: 'turn', title: right, disabled: !p }) +
        button('return', t('إلى الدرج', 'Return'), { icon: 'return', disabled: !p || !p.placed }) +
        button('undo', t('تراجع', 'Undo'), { icon: 'undo', disabled: !undo.length }) + '</div>';
    }

    function board() {
      var out = '<svg id="ws-board-svg" viewBox="0 0 480 310" role="img" aria-label="' + attr(word(mission.title)) + '">' +
        '<defs><pattern id="ws-grid" width="20" height="20" patternUnits="userSpaceOnUse">' +
        '<path d="M20 0H0V20" fill="none" stroke="#d8e6ed" stroke-width="1"/></pattern>' +
        '<pattern id="ws-warning" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
        '<path d="M0 0V7" stroke="#a02844" stroke-width="2"/></pattern>' +
        '<pattern id="ws-column" width="9" height="9" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">' +
        '<path d="M0 0V9" stroke="#698296" stroke-width="2"/></pattern></defs>' +
        '<rect width="480" height="310" fill="#f5fafc"/><rect width="480" height="310" fill="url(#ws-grid)"/>';
      mission.target.forEach(function (part) {
        out += polygon(part, 'class="ws-outline"');
      });
      if (mission.obstacle) out += polygon(mission.obstacle, 'fill="url(#ws-column)" stroke="#5c788a" stroke-width="2"');
      if (mission.id === 'courtyard' || draft.hints === 2) mission.solution.forEach(function (hint) {
        var p = find(hint.id);
        if (!p || mission.stock && draft.cut !== mission.plannedAngle && hint.id.indexOf('cut-') === 0) return;
        out += polygon(G.world({ poly: p.poly, x: hint.x, y: hint.y, angle: hint.angle }), 'class="ws-guide"');
      });
      if (mission.vertex) {
        var x = mission.vertex[0], y = mission.vertex[1];
        var rayEnd = G.ray(191, mission.targetAngle);
        out += '<path d="M' + (x + 191) + ' ' + y + 'H' + x + 'L' + (x + rayEnd[0]) + ' ' + (y + rayEnd[1]) +
          '" fill="none" stroke="#637e9b" stroke-width="2"/>' +
          '<circle cx="' + x + '" cy="' + y + '" r="4" fill="#255075"/>' +
          '<text x="' + x + '" y="43" text-anchor="middle" fill="#254c63" font-weight="bold" font-size="22">' +
          degrees(mission.targetAngle) + '</text>';
      }
      draft.pieces.forEach(function (p) {
        if (p.placed) out += polygon(G.world(p), 'data-tile="' + p.id + '" fill="' + palette[p.color] +
          '" class="ws-board-piece' + (selected === p.id ? ' ws-selected' : '') + '"');
      });
      if (check && !check.ok) {
        check.remaining.forEach(function (poly) { out += polygon(poly, 'class="ws-gap"'); });
        check.overlap.forEach(function (poly) { out += polygon(poly, 'fill="url(#ws-warning)" stroke="#a02844" stroke-width="2"'); });
        if (check.outside > G.epsilon) draft.pieces.filter(function (p) { return p.placed; }).forEach(function (p) {
          var one = G.evaluate(mission, { pieces: [p], cut: draft.cut });
          if (one.outside > G.epsilon) out += polygon(G.world(p), 'fill="none" stroke="#a02844" stroke-dasharray="5 4" stroke-width="3"');
        });
      }
      return out + '<g id="ws-drag-preview"><polygon class="ws-air-piece"/><polygon class="ws-drop-guide"/></g></svg>';
    }

    function nextMission() {
      var index = content.missions.indexOf(mission);
      return content.missions[index + 1];
    }

    function outcome() {
      if (!check && !message && !draft.hints) return '<p class="ws-status" aria-live="polite"></p>';
      if (check && check.ok) {
        var next = nextMission();
        return '<section class="ws-success" role="status"><strong>' + icon('check') +
          t('أحسنت، اكتمل المشروع!', 'Well done, project complete!') + '</strong><p>' + word(mission.insight) + '</p>' +
          (next ? button('next', t('المهمة التالية', 'Next project'), { value: next.id, className: 'ws-action' }) :
          button('first', t('أراجع المشاريع', 'Review projects'), { value: 'courtyard' })) +
          button('reset', t('أعيد المحاولة', 'Play again')) + '</section>';
      }
      return '<div class="ws-status" role="status">' + (message ? '<p>' + message + '</p>' : '') +
        (draft.hints ? '<p>' + icon('hint') + word(mission.hint) +
        (draft.hints === 2 ? t(' تتبّع حدود القطع المتقطعة على اللوحة.', ' Follow the dashed tile outlines on the board.') : '') +
        '</p>' : '') + '</div>';
    }

    function render() {
      drag = null;
      var result = G.evaluate(mission, draft);
      var boardLabel = t('التغطية', 'Coverage') + ' <bdi dir="ltr">' + num(result.coverage) + '%</bdi>';
      if (mission.vertex) {
        var angles = draft.pieces.filter(function (p) { return p.placed; }).map(function (p) { return degrees(p.degrees); });
        boardLabel = t('مجموع القطع', 'Sum of pieces') + ' <bdi dir="ltr">' +
          (angles.length > 1 ? angles.join(' + ') + ' = ' : '') + degrees(result.angleSum) + ' / ' +
          degrees(mission.targetAngle) + '</bdi>';
      }
      host.innerHTML = '<div class="ws">' + header() + levelList() +
        '<article class="ws-project">' + brief() + '<div class="ws-work"><section class="ws-board-area">' +
        '<div class="ws-board-heading"><h3>' + t('لوحة العمل', 'Workboard') + '</h3><span>' + boardLabel + '</span></div>' +
        '<button id="ws-board" class="ws-board" type="button" data-ws="board" aria-label="' +
        t('لوحة العمل. اختر قطعة وضعها باللمس أو استخدم الأسهم لتحريكها.', 'Workboard. Select a tile, then tap to place it or use the arrow keys.') +
        '">' + board() + '</button><div class="ws-board-foot"><span>' + icon('hand') +
        t('اسحب القطعة أو اخترها واضغط مكانها', 'Drag a tile, or select it and tap its place') + '</span></div></section>' +
        '<div class="ws-work-tools">' + tray() + toolBox() + cutGuide() + '</div></div>' +
        '<div class="ws-actions">' + button('check', t('أتحقّق', 'Check my work'), { icon: 'check', className: 'ws-action' }) +
        button('hint', t('تلميح', 'Hint'), { icon: 'hint' }) +
        button('reset', t('أبدأ من جديد', 'Start again')) + '</div>' + outcome() +
        (!storageOK ? '<p class="ws-status">' + t('التقدّم محفوظ لهذه الجلسة فقط.', 'Progress is saved for this session only.') + '</p>' : '') +
        '</article></div>';
      layout();
    }

    function layout() {
      var boardArea = host.querySelector('.ws-board-area');
      var trayNode = host.querySelector('.ws-tray');
      var tools = host.querySelector('.ws-work-tools');
      if (!boardArea || !trayNode || !tools) return;
      if (root.innerWidth <= 700) {
        if (trayNode.parentNode !== boardArea.parentNode) boardArea.parentNode.insertBefore(trayNode, boardArea);
      } else if (trayNode.parentNode !== tools) {
        tools.insertBefore(trayNode, tools.firstChild);
      }
    }

    function logical(clientX, clientY) {
      var node = doc.getElementById('ws-board-svg');
      if (!node) return null;
      var rect = node.getBoundingClientRect();
      return [(clientX - rect.left) * WIDTH / rect.width, (clientY - rect.top) * HEIGHT / rect.height];
    }
    function onBoard(point) {
      return point && point[0] >= 0 && point[1] >= 0 && point[0] <= WIDTH && point[1] <= HEIGHT;
    }
    function grip(p) {
      if (mission.vertex) return [0, 0];
      var b = bounds(G.world({ poly: p.poly, angle: p.angle, x: 0, y: 0 }));
      return [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2];
    }
    function candidate(point, offset) {
      return G.snap(mission, point[0] - offset[0], point[1] - offset[1]);
    }
    function hit(point) {
      for (var i = draft.pieces.length - 1; i >= 0; i--) {
        var p = draft.pieces[i];
        if (p.placed && G.contains(G.world(p), point)) return p;
      }
      return null;
    }
    function actionNode(n) {
      while (n && n !== host) {
        if (n.getAttribute && n.getAttribute('data-ws')) return n;
        n = n.parentNode;
      }
      return null;
    }
    function prepare(ev) {
      var node = actionNode(ev.target);
      return node && !node.disabled && context.active() ? node : null;
    }
    function verify() {
      check = G.evaluate(mission, draft);
      if (check.ok) {
        state.completed[mission.id] = true;
        save();
        return;
      }
      var notes = [];
      if (check.needsCut) notes.push(t('جرّب طاولة القص لتصنع قطعة تناسب الحافة.', 'Try the cutting bench to make a piece that fits the edge.'));
      if (!check.count) notes.push(t('اسحب قطعة من الدرج إلى حدود الشكل.', 'Drag a tile from the tray into the outline.'));
      if (check.outside > G.epsilon) notes.push(t('جزء من البلاط تجاوز الحد. حرّك القطعة المحددة بخط أحمر.', 'A tile crosses the boundary. Move the piece marked with a red outline.'));
      if (check.overlap.length) notes.push(t('الخطوط الحمراء تبيّن أين تراكبت القطع.', 'Red stripes show where tiles overlap.'));
      if (check.count && check.missing > G.epsilon) notes.push(t('المناطق الزرقاء المتقطعة فراغات تحتاج إلى قطع.', 'The dashed blue areas still need tiles.'));
      message = notes.join(' ');
    }

    host.addEventListener('click', function (ev) {
      var node = prepare(ev);
      if (!node) return;
      var command = node.getAttribute('data-ws'), value = node.getAttribute('data-value'), p = find(selected);
      if (command === 'listen') { context.speak(mission.id, word(mission.task)); return; }
      if (command === 'mission' || command === 'next' || command === 'first') {
        context.stop();
        changeMission(value);
      }
      if (command === 'select') selected = value;
      if (command === 'board') {
        var point = ev.detail ? logical(ev.clientX, ev.clientY) : [WIDTH / 2, HEIGHT / 2];
        if (!point) return;
        var prior = ev.detail ? hit(point) : null;
        if (prior && (!p || p.placed)) selected = prior.id;
        else if (p) placed(p, candidate(point, grip(p)));
        else message = t('اختر قطعة من الدرج أولًا.', 'Choose a tile from the tray first.');
      }
      if (command === 'turn' && p) change(function () { p.angle = G.normalize(p.angle + Number(value)); });
      if (command === 'return' && p) change(function () { p.placed = false; });
      if (command === 'undo' && undo.length) {
        draft = undo.pop();
        if (draft.cut !== null) blade = draft.cut;
        if (!find(selected)) selected = null;
        check = null;
        message = '';
        save();
      }
      if (command === 'blade') blade = Number(value);
      if (command === 'cut' && draft.cut === null) change(function () { G.makeCut(mission, draft, blade); });
      if (command === 'recut' && draft.cut !== null) {
        change(function () {
          draft.cut = null;
          draft.pieces = draft.pieces.filter(function (item) { return item.id.indexOf('cut-') !== 0; });
          if (!find(selected)) selected = null;
        });
      }
      if (command === 'hint') {
        draft.hints = Math.min(2, draft.hints + 1);
        save();
      }
      if (command === 'check') verify();
      if (command === 'reset') {
        if (message === t('اضغط مرة أخرى لإعادة المحاولة.', 'Press again to restart this project.') || check && check.ok) {
          change(function () { draft = G.create(mission); });
          selected = null;
        } else message = t('اضغط مرة أخرى لإعادة المحاولة.', 'Press again to restart this project.');
      }
      render();
      if (!ev.detail) {
        var buttons = host.querySelectorAll('[data-ws="' + command + '"]');
        for (var i = 0; i < buttons.length; i++) {
          if (buttons[i].getAttribute('data-value') === value && !buttons[i].disabled) {
            buttons[i].focus();
            break;
          }
        }
      }
    }, false);

    host.addEventListener('keydown', function (ev) {
      var p = context.active() && find(selected);
      var offset = { 37: [-1, 0], 38: [0, -1], 39: [1, 0], 40: [0, 1] }[ev.keyCode];
      if (!p || !offset) return;
      ev.preventDefault();
      if (mission.vertex && p.placed && offset[0]) {
        change(function () { p.angle = G.normalize(p.angle + offset[0] * 15); });
      } else {
        var x = p.placed ? p.x : WIDTH / 2, y = p.placed ? p.y : HEIGHT / 2;
        placed(p, G.snap(mission, Math.max(0, Math.min(WIDTH, x + offset[0] * G.step)),
          Math.max(0, Math.min(HEIGHT, y + offset[1] * G.step))));
      }
      render();
      doc.getElementById('ws-board').focus();
    }, false);

    function pick(node, x, y) {
      if (!context.active()) return null;
      var action = actionNode(node);
      var type = action && action.getAttribute('data-ws');
      var start = logical(x, y);
      var p = type === 'select' ? find(action.getAttribute('data-value')) :
        type === 'board' && onBoard(start) ? hit(start) : null;
      if (!p) return null;
      return { id: p.id, offset: type === 'board' ? [start[0] - p.x, start[1] - p.y] : grip(p), fromBoard: type === 'board' };
    }
    function clear() {
      if (drag && drag.parentNode) drag.parentNode.removeChild(drag);
      drag = null;
      var layer = doc.getElementById('ws-drag-preview');
      if (layer) {
        layer.firstElementChild.removeAttribute('points');
        layer.lastElementChild.removeAttribute('points');
      }
      var marks = host.querySelectorAll('.ws-dragged');
      for (var i = 0; i < marks.length; i++) {
        marks[i].removeAttribute('opacity');
        marks[i].setAttribute('class', marks[i].getAttribute('class').replace(/ ws-dragged/g, ''));
      }
    }
    function preview(item, x, y) {
      var p = find(item.id), point = logical(x, y), layer = doc.getElementById('ws-drag-preview');
      if (!p || !point || !layer) return;
      if (!drag) {
        drag = doc.createElement('div');
        drag.className = 'ws-hand-piece';
        drag.setAttribute('aria-hidden', 'true');
        drag.innerHTML = pieceSVG(p);
        doc.body.appendChild(drag);
      }
      drag.style.left = x + 'px';
      drag.style.top = y + 'px';
      drag.style.visibility = onBoard(point) ? 'hidden' : 'visible';
      var original = host.querySelector('[data-tile="' + p.id + '"]');
      if (original) { original.setAttribute('class', original.getAttribute('class').replace(/ ws-dragged/g, '') + ' ws-dragged'); original.setAttribute('opacity', '.28'); }
      var air = layer.firstElementChild, guide = layer.lastElementChild;
      if (onBoard(point)) {
        var landing = candidate(point, item.offset);
        air.setAttribute('fill', palette[p.color]);
        air.setAttribute('points', coordinates(G.world({
          poly: p.poly, angle: p.angle, x: point[0] - item.offset[0], y: point[1] - item.offset[1]
        })));
        guide.setAttribute('fill', palette[p.color]);
        guide.setAttribute('points', coordinates(G.world({ poly: p.poly, angle: p.angle, x: landing.x, y: landing.y })));
      } else {
        air.removeAttribute('points');
        guide.removeAttribute('points');
      }
    }
    function drop(item, x, y) {
      var p = find(item.id), point = logical(x, y);
      if (!p || !context.active()) return;
      if (onBoard(point)) {
        placed(p, candidate(point, item.offset));
        render();
      } else if (item.fromBoard) {
        var dest = doc.elementFromPoint(x, y), trayNode = host.querySelector('.ws-tray');
        if (trayNode && trayNode.contains(dest)) {
          change(function () { p.placed = false; });
          selected = p.id;
          render();
        }
      }
    }
    return {
      refresh: refresh, layout: layout, pick: pick, preview: preview, drop: drop, clear: clear,
      open: function (id) {
        if (!byId[id] || !state) return false;
        changeMission(id);
        render();
        return true;
      },
      snapshot: function () {
        return { mission: mission.id, draft: G.copy(draft), completed: G.copy(state.completed),
          blade: blade, result: G.evaluate(mission, draft) };
      }
    };
  }

  root.SHAPE_WORKSHOP = { mount: mount };
})(window, document, window.SHAPE_WORKSHOP_MODEL, window.SHAPE_WORKSHOP_CONTENT);
