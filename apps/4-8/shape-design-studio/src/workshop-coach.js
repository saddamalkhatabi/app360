(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SHAPE_WORKSHOP_COACH = factory();
})(this, function () {
  'use strict';

  var plans = [
    plan('shapes-build', 'تركيب الأشكال وتدويرها', 'Fit and turn shapes', '4–5', 8,
      'يركّب القطع حافة بحافة ثم يدوّرها لتملأ أشكالًا مختلفة.',
      'Fit edges together, then turn tiles to fill different shapes.',
      ['courtyard', 'window', 'roof', 'stairs']),
    plan('shapes-angles', 'جمع الزوايا وقياسها', 'Measure and combine angles', '5–6', 9,
      'يجمع زوايا صغيرة لملء زاوية قائمة وحادّة ومنفرجة ومستقيمة.',
      'Join smaller angles to fill right, acute, obtuse and straight angles.',
      ['right', 'acute', 'obtuse', 'straight']),
    plan('shapes-cut', 'اختيار زاوية القص', 'Choose the cut angle', '6–7', 10,
      'يطابق خط القص مع الحافة المائلة ويستخدم القطعتين الناتجتين.',
      'Match a cut to a sloped edge and find uses for both pieces.',
      ['diagonal', 'shallow', 'steep', 'two-bays']),
    plan('shapes-floors', 'مشاريع تبليط الأرضيات', 'Floor tiling projects', '7–8', 12,
      'يخطّط للقطع الكاملة والقصاصات حول الحواف والعوائق.',
      'Plan where to use full tiles and offcuts around edges and obstacles.',
      ['entry', 'terrace', 'column', 'final']),
    plan('shapes-review', 'من أول قطعة إلى أرضية', 'From a first tile to a floor', '4–8', 10,
      'يراجع التركيب وجمع الزوايا والقص وإعادة استخدام القصاصات.',
      'Review fitting, combining angles, cutting and reusing offcuts.',
      ['courtyard', 'right', 'two-bays', 'final'])
  ];

  var feedback = {
    overlap: ['هناك قطعتان فوق بعضهما. أبعد إحداهما حتى تلتقي الحافتان.', 'Two pieces overlap. Move one until the edges meet.'],
    outside: ['تجاوزت قطعة حدود الشكل. حرّكها إلى الداخل أو جرّب تدويرها.', 'A piece crosses the outline. Move it inside or try turning it.'],
    gap: ['بقي فراغ. قارن حواف القطع بحدود المساحة الزرقاء.', 'A gap remains. Compare the tile edges with the blue outline.'],
    angle: ['قارن بين فتحة الزاوية وحواف القطع. دوّر قطعة وراقب مكان الحافة.', 'Compare the opening with the tile edges. Turn one tile and watch where its edge goes.'],
    cut: ['قارن ميل الحافة المتبقية بخط القص، ثم جرّب ميلًا آخر.', 'Compare the remaining edge with the cut line, then try a different angle.'],
    done: ['أحسنت! اكتمل البناء. عندما تكون جاهزًا، انتقل إلى المهمة التالية.', 'Well done! Your build is complete. Move to the next project when you are ready.']
  };

  function plan(id, labelAr, labelEn, age, minutes, goalAr, goalEn, units) {
    return {
      id: id, age_group: '4-8', age_hint: age, label_ar: labelAr, label_en: labelEn,
      goal_ar: goalAr, goal_en: goalEn, estimated_minutes: minutes, unit_ids: units
    };
  }

  function get(id) {
    return plans.filter(function (item) { return item.id === id; })[0] || null;
  }

  function assessment(mission, draft, score, manual) {
    if (score.ok) return 'done';
    // Some challenges provide an extra angle tile or a reusable offcut.
    if (!manual && (score.needsCut || score.count < mission.solution.length)) return '';
    if (score.needsCut) return 'cut-first';
    if (!score.count) return 'empty';
    if (mission.stock && draft.cut !== mission.plannedAngle) return 'cut';
    if (score.outside > 1e-7) return mission.vertex ? 'angle' : 'outside';
    if (score.overlap.length) return mission.vertex ? 'angle' : 'overlap';
    return mission.vertex ? 'angle' : 'gap';
  }

  function text(fact, language) {
    return feedback[fact] ? feedback[fact][language === 'en' ? 1 : 0] : '';
  }

  function session(routeId, saved, resume) {
    var route = get(routeId);
    if (!route) return null;
    if (resume && saved && saved.route === routeId &&
        ['active', 'paused', 'complete'].indexOf(saved.status) >= 0 &&
        typeof saved.index === 'number' && saved.index % 1 === 0 &&
        saved.index >= 0 && saved.index < route.unit_ids.length) {
      // Progress is sequential. Reconstruct evidence from verified steps only.
      var approved = Array.isArray(saved.verified) ? saved.verified : [];
      var verified = [];
      var limit = Math.min(approved.length, saved.index + 1);
      for (var i = 0; i < limit && approved[i] === route.unit_ids[i]; i++) verified.push(approved[i]);
      var index = Math.min(saved.index, verified.length);
      return { route: routeId, index: index, verified: verified,
        status: verified.length === route.unit_ids.length ? 'complete' : saved.status === 'paused' ? 'paused' : 'active',
        draft: index === saved.index ? saved.draft : null };
    }
    return { route: routeId, index: 0, verified: [], status: 'active', draft: null };
  }

  function completeStep(s, id) {
    var route = s && get(s.route);
    if (!route || s.status !== 'active' || id !== route.unit_ids[s.index] || s.verified.length !== s.index) return false;
    s.verified.push(id);
    if (s.verified.length === route.unit_ids.length) {
      s.status = 'complete';
      return true;
    }
    return false;
  }

  function advance(s) {
    var route = s && get(s.route);
    if (!route || s.status !== 'active' || s.verified.length <= s.index || s.index + 1 >= route.unit_ids.length) return false;
    s.index++;
    s.draft = null;
    return true;
  }

  function catalog(missions) {
    var rows = plans.map(function (item) { return JSON.parse(JSON.stringify(item)); });
    return {
      schema_version: 1, app_id: 'a4-shape-design', age_groups: ['4-8'], routes: rows,
      units: missions.map(function (m) {
        return { id: m.id, age_group: '4-8', stage: m.level + 1,
          title_ar: m.title[0], title_en: m.title[1], goal_ar: m.task[0], goal_en: m.task[1],
          evidence: 'verified-geometry' };
      }),
      launch: { path: 'launch.html', params: ['action', 'launch_age', 'route_ids', 'resume', 'caller', 'launch_id', 'return_to'] },
      events: { practiced: 'app360:shape-trainer:practice', complete: 'app360:shape-trainer:sessioncomplete' },
      completion: { demonstrations_are_practice: false, automatic_mastery: false }
    };
  }

  return { plans: plans, get: get, text: text, assessment: assessment, session: session,
    completeStep: completeStep, advance: advance, catalog: catalog };
});
