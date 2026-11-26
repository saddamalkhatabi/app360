(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./workshop-model.js'));
  else root.SHAPE_WORKSHOP_CONTENT = factory(root.SHAPE_WORKSHOP_MODEL);
})(this, function (G) {
  'use strict';
  var colors = ['mint', 'amber', 'blue', 'rose', 'violet'];
  var levels = [
    { title: ['أبني بالأشكال', 'Build with shapes'], skill: ['التركيب والتدوير', 'Fit and turn'], age: '4–5', icon: 'build' },
    { title: ['أكتشف الزوايا', 'Discover angles'], skill: ['أقيس وأجمع الزوايا', 'Measure and add angles'], age: '5–6', icon: 'angle' },
    { title: ['أقصّ البلاط', 'Cut a tile'], skill: ['أجرّب القص وأقارن القطع', 'Try cuts and compare pieces'], age: '6–7', icon: 'cut' },
    { title: ['أبلّط الأرضيات', 'Lay floors'], skill: ['أخطّط وأستفيد من البقايا', 'Plan and reuse offcuts'], age: '7–8', icon: 'floor' }
  ];
  var missions = [];

  function pair(ar, en) { return [ar, en]; }
  function mission(level, id, title, task, hint, insight, vertex) {
    var item = { level: level, id: id, title: title, task: task, hint: hint, insight: insight,
      vertex: vertex || null, pieces: [], solution: [], target: [], stock: null };
    missions.push(item);
    return item;
  }

  function add(m, poly, x, y, angle, degrees) {
    var i = m.pieces.length, p = G.piece('tile-' + (i + 1), poly, colors[i % colors.length]);
    if (degrees) p.degrees = degrees;
    m.pieces.push(p);
    m.solution.push({ id: p.id, x: x, y: y, angle: angle || 0 });
    return G.world({ poly: poly, x: x, y: y, angle: angle || 0 });
  }

  var triangle = [[0, 0], [100, 0], [0, 100]];
  var m = mission(0, 'courtyard', pair('بلاط الساحة', 'Courtyard tiles'),
    pair('اسحب البلاطات الثلاث إلى الظل حتى تمتلئ الساحة.', 'Drag the three tiles into the outline to fill the courtyard.'),
    pair('ضع المربع الكبير أولًا، ثم صفّ المستطيلين بجانبه.', 'Place the large square first, then line up the rectangles beside it.'),
    pair('جوانب القطع تلتقي حافةً بحافة. هكذا نغطي الساحة كلها.', 'The tiles meet edge to edge. That covers the whole courtyard.'));
  add(m, G.rect(0, 0, 120, 120), 120, 100);
  add(m, G.rect(0, 0, 120, 60), 240, 100);
  add(m, G.rect(0, 0, 120, 60), 240, 160);
  m.target = [G.rect(120, 100, 240, 120)];

  m = mission(0, 'window', pair('نافذة من مثلثين', 'A window from triangles'),
    pair('كوّن مربعًا من مثلثين. دوّر قطعة لتملأ النصف الآخر.', 'Make a square from two triangles. Turn a piece to fill the other half.'),
    pair('اجعل الضلعين الطويلين يتلامسان في منتصف النافذة.', 'Bring the long sides together across the middle of the window.'),
    pair('مثلثان متساويان يكوّنان مربعًا عندما يتقابل ضلعاهما الطويلان.', 'Two equal triangles make a square when their long sides meet.'));
  add(m, triangle, 190, 110);
  add(m, triangle, 290, 210, 180);
  m.target = [G.rect(190, 110, 100, 100)];

  m = mission(0, 'roof', pair('سقف الكوخ', 'The cabin roof'),
    pair('املأ شكل الكوخ بثلاث قطع. دوّر المثلثين ليكوّنا السقف.', 'Fill the cabin with three pieces. Turn the triangles to make the roof.'),
    pair('ضع زاوية كل مثلث القائمة عند منتصف قاعدة السقف.', 'Put each triangle’s right angle at the middle of the roof base.'),
    pair('يمكن جمع مثلثين حول ضلع مشترك لصنع سقف مائل.', 'Two triangles can share an edge to make a sloped roof.'));
  add(m, G.rect(0, 0, 200, 110), 140, 150);
  add(m, triangle, 240, 150, 180);
  add(m, triangle, 240, 150, 270);
  m.target = [[[240, 50], [340, 150], [140, 150]], G.rect(140, 150, 200, 110)];

  m = mission(0, 'stairs', pair('درج الحديقة', 'Garden steps'),
    pair('املأ شكل الدرج. جرّب تدوير المستطيلات حتى تختفي الفجوات.', 'Fill the step shape. Turn the rectangles until the gaps disappear.'),
    pair('ضع أطول قطعة أسفل الدرج. دوّر المستطيل الأقصر ليملأ الجانب الأيسر.', 'Put the longest piece at the base. Turn the shorter rectangle to fit the left edge.'),
    pair('تدوير المستطيل يغيّر اتجاهه، وتظل مساحته كما هي.', 'Turning a rectangle changes its direction while its area stays the same.'));
  add(m, G.rect(0, 0, 180, 60), 150, 190);
  add(m, G.rect(0, 0, 120, 60), 150, 70, 90);
  add(m, G.rect(0, 0, 60, 60), 150, 130);
  m.target = [G.rect(90, 70, 60, 120), G.rect(150, 130, 60, 60), G.rect(150, 190, 180, 60)];

  function angles(id, title, task, hint, insight, target, widths, distractors) {
    var vertex = [240, 66], radius = 180;
    var scene = mission(1, id, title, task, hint, insight, vertex);
    var turn = 0;
    scene.target = [G.translate(G.sector(target, radius), vertex[0], vertex[1])];
    scene.targetAngle = target;
    widths.concat(distractors || []).forEach(function (degrees, i) {
      add(scene, G.sector(degrees, radius), vertex[0], vertex[1], turn, degrees);
      if (i < widths.length) turn += degrees;
      else scene.solution.pop();
    });
  }

  angles('right', pair('ركن قائم', 'A right corner'),
    pair('اجمع قطعتين لتملأ فتحة زاوية قائمة قياسها ٩٠°.', 'Use two pieces to fill a 90° right angle.'),
    pair('ابدأ من الحافة الأفقية، ثم دوّر القطعة الثانية حتى تتلاقى الحافتان.', 'Start at the horizontal edge. Turn the second piece until its edge meets the first.'),
    pair('٤٥° + ٤٥° = ٩٠°. هذا هو ركن المربع.', '45° + 45° = 90°. That is the corner of a square.'), 90, [45, 45]);
  angles('acute', pair('زاوية السهم', 'The arrow angle'),
    pair('املأ فتحة ٦٠° بقطعتين من الدرج.', 'Fill the 60° opening with two pieces from the tray.'),
    pair('ابحث عن قطعتين قياس كل منهما ٣٠°.', 'Look for two pieces that each measure 30°.'),
    pair('٣٠° + ٣٠° = ٦٠°. هذه زاوية حادّة؛ فهي أصغر من ٩٠°.', '30° + 30° = 60°. An acute angle is smaller than 90°.'), 60, [30, 30], [45]);
  angles('obtuse', pair('زاوية شرفة واسعة', 'The wide balcony corner'),
    pair('املأ زاوية ١٢٠° بقطعتين متجاورتين.', 'Fill the 120° angle with two pieces side by side.'),
    pair('جرّب القطعة القائمة مع قطعة أصغر منها بمقدار ٦٠°.', 'Try the right angle and a second piece that is 60° smaller.'),
    pair('٩٠° + ٣٠° = ١٢٠°. الزاوية المنفرجة أكبر من القائمة وأصغر من المستقيمة.', '90° + 30° = 120°. An obtuse angle is larger than a right angle and smaller than a straight angle.'), 120, [90, 30], [45]);
  angles('straight', pair('بلاط نصف دائرة', 'A semicircle of tiles'),
    pair('ابنِ زاوية مستقيمة من ثلاث قطع. ما مجموع قياساتها؟', 'Build a straight angle with three pieces. What do they add up to?'),
    pair('اجمع القطع ٣٠° و٦٠° و٩٠° بلا تداخل.', 'Join 30°, 60° and 90° without overlapping.'),
    pair('٣٠° + ٦٠° + ٩٠° = ١٨٠°. شعاعا الزاوية المستقيمة يرسمان خطًا واحدًا.', '30° + 60° + 90° = 180°. The two rays of a straight angle form a line.'), 180, [30, 60, 90], [45]);

  function stock(scene, width, height, angle) {
    scene.stock = { poly: G.rect(0, 0, width, height), anchor: [0, 0], angles: [30, 45, 60],
      color: colors[3], width: width, height: height };
    scene.plannedAngle = angle;
    return G.split(scene.stock, angle).halves;
  }

  function install(m, halves, destinations) {
    destinations.forEach(function (pos, i) {
      if (!pos) return;
      m.solution.push({ id: 'cut-' + (i + 1), x: pos[0], y: pos[1], angle: pos[2] || 0 });
      m.target.push(G.world({ poly: halves[i], x: pos[0], y: pos[1], angle: pos[2] || 0 }));
    });
  }

  m = mission(2, 'diagonal', pair('قصّ من ركن إلى ركن', 'Corner-to-corner cut'),
    pair('حرّك دليل القص حتى يصل إلى الركن المقابل. قصّ البلاطة ثم املأ الفراغ.', 'Move the cut guide to the opposite corner. Cut the tile and fill the gap.'),
    pair('للمربع ضلعان متساويان عند الركن. جرّب دليل ٤٥°.', 'The square has two equal sides at its corner. Try the 45° guide.'),
    pair('القطر يقسم المربع إلى مثلثين لهما المساحة نفسها.', 'The diagonal splits the square into two triangles of equal area.'));
  install(m, stock(m, 140, 140, 45), [null, [170, 90]]);

  m = mission(2, 'shallow', pair('حافة قليلة الميل', 'A shallow edge'),
    pair('انظر إلى الحافة المائلة. اختر الدليل الذي يوازيها ثم قصّ القطعة.', 'Look at the sloped edge. Find the matching cut guide, then cut the tile.'),
    pair('الحافة أقرب للخط الأفقي منها إلى قطر المربع. جرّب ٣٠°.', 'The edge is closer to horizontal than the square diagonal. Try 30°.'),
    pair('إذا كان الميل أصغر، يقطع الدليل مسافة أفقية أطول قبل أن يبلغ الارتفاع نفسه.', 'A shallower cut travels farther horizontally to reach the same height.'));
  install(m, stock(m, 140, 100, 30), [null, [170, 110]]);

  m = mission(2, 'steep', pair('حافة شديدة الميل', 'A steep edge'),
    pair('قصّ بلاطة تناسب هذه الحافة ثم جرّب القطعة على اللوحة.', 'Cut a tile to fit this edge, then try it on the board.'),
    pair('من الأدلة الثلاثة، أيها أقرب إلى الاتجاه الرأسي؟ جرّب ٦٠°.', 'Which of the three guides is closest to vertical? Try 60°.'),
    pair('كلما زاد قياس الزاوية من الخط الأفقي، صار خط القص أشد ميلًا.', 'A larger angle from horizontal makes the cut steeper.'));
  install(m, stock(m, 120, 140, 60), [[180, 100], null]);

  m = mission(2, 'two-bays', pair('قطعة لكل ركن', 'One piece for each corner'),
    pair('قصّ بلاطة واحدة واستعمل جزأيها لسدّ الركنين المتباعدين.', 'Cut one tile and use both parts to fill the two separate corners.'),
    pair('ابدأ بدليل ٤٥°. اسحب كل نصف إلى الركن الذي يشبهه.', 'Start with 45°. Drag each half into the corner it matches.'),
    pair('يمكن استخدام الجزء المتبقي في مكان آخر. غطّينا ركنين ببلاطة واحدة.', 'An offcut can fit somewhere else. One tile filled both corners.'));
  install(m, stock(m, 120, 120, 45), [[80, 90], [280, 120]]);

  m = mission(3, 'entry', pair('مدخل بحافة مائلة', 'An entry with a sloped edge'),
    pair('رصّ البلاطات الكاملة في المدخل. ثم قصّ قطعة تملأ الحافة المائلة.', 'Lay the full tiles in the entry, then cut a piece to fill the sloped edge.'),
    pair('املأ الممر أولًا، ثم قارن قطر البلاطة بالحافة المتبقية.', 'Fill the walkway first, then compare the tile diagonal with the remaining edge.'),
    pair('عندما نبدأ بالبلاطات الكاملة، يظهر المكان الذي يحتاج إلى قصّ.', 'Laying full tiles first shows exactly where a cut is needed.'));
  add(m, G.rect(0, 0, 100, 100), 90, 110);
  add(m, G.rect(0, 0, 100, 100), 190, 110);
  m.target = [G.rect(90, 110, 200, 100)];
  install(m, stock(m, 100, 100, 45), [[290, 110], null]);

  m = mission(3, 'terrace', pair('شرفة بركنين', 'A terrace with two corners'),
    pair('أكمل الشرفة بالبلاطات الكاملة، ثم استعمل جزأَي بلاطة واحدة في الركنين.', 'Lay the full tiles, then use both halves of one tile for the terrace corners.'),
    pair('قارن خطّي الركنين. قصّة القطر تعطيك نصفين، وقد تحتاج إلى تدوير أحدهما.', 'Compare the edges at both corners. A diagonal cut gives two halves, and one may need a turn.'),
    pair('استخدام القطعتين المقطوعتين غطّى الطرفين دون هدر القصاصة.', 'Using both cut pieces fills the two ends without wasting the offcut.'));
  add(m, G.rect(0, 0, 100, 100), 140, 110);
  add(m, G.rect(0, 0, 100, 100), 240, 110);
  m.target = [G.rect(140, 110, 200, 100)];
  install(m, stock(m, 100, 100, 45), [[340, 110], [140, 210, 180]]);

  m = mission(3, 'column', pair('فسيفساء حول عمود', 'Tiles around a column'),
    pair('غطِّ الأرض حول العمود. اترك المربع المظلّل في الوسط فارغًا، واستعمل نصفي القص.', 'Tile around the column. Leave the marked square empty and reuse both cut pieces.'),
    pair('ضع المستطيلات بمحاذاة العمود. قصّ بزاوية ٤٥° للفراغين عند الجانبين.', 'Line the rectangles up around the column. Cut at 45° for the two side gaps.'),
    pair('المساحة حول العمود وحدها تحتاج بلاطًا. حدود العائق مهمة مثل حدود الغرفة.', 'Only the area around the column needs tiles. The obstacle matters as much as the room outline.'));
  add(m, G.rect(0, 0, 180, 50), 150, 70);
  add(m, G.rect(0, 0, 180, 50), 150, 200);
  add(m, G.rect(0, 0, 50, 80), 150, 120);
  add(m, G.rect(0, 0, 50, 80), 280, 120);
  m.target = [G.rect(150, 70, 180, 50), G.rect(150, 200, 180, 50),
    G.rect(150, 120, 50, 80), G.rect(280, 120, 50, 80)];
  m.obstacle = G.rect(200, 120, 80, 80);
  install(m, stock(m, 80, 80, 45), [[70, 120], [330, 120]]);

  m = mission(3, 'final', pair('مشروع أرضية المعرض', 'Gallery floor project'),
    pair('أكمل أرضية المعرض. قِس ميل الركن، قصّ بلاطة واحدة، واستخدم الجزأين بلا فراغ أو تداخل.', 'Finish the gallery floor. Match the slope, cut one tile, and reuse both parts without gaps or overlap.'),
    pair('ابدأ بالبلاطات الكاملة. قارن ميل الحافتين بزاوية ٤٥°: كلاهما أشد ميلًا.', 'Start with the full tiles. Both sloped edges are steeper than 45°.'),
    pair('خطّطت للأرضية، وقصصت على القياس، وأعدت استخدام الجزء المتبقي. هذه خطوات مشروع تبليط كامل.', 'You planned the floor, matched a cut to the edge and reused the offcut. Those are the steps of a tiling project.'));
  add(m, G.rect(0, 0, 120, 60), 110, 100);
  add(m, G.rect(0, 0, 60, 120), 230, 160, 90);
  add(m, G.rect(0, 0, 60, 120), 350, 100, 90);
  m.target = [G.rect(110, 100, 240, 60), G.rect(110, 160, 120, 60)];
  install(m, stock(m, 100, 120, 60), [[350, 100], [10, 100]]);

  return { levels: levels, missions: missions };
});
