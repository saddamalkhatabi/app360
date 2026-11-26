/* Convex geometry for the workshop. Coordinates are in board units; SVG and scoring share these polygons. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SHAPE_WORKSHOP_MODEL = factory();
})(this, function () {
  'use strict';

  var EPSILON = 1e-7;
  var STEP = 10;

  function copy(value) { return JSON.parse(JSON.stringify(value)); }
  function normalize(angle) { return ((angle % 360) + 360) % 360; }

  function rect(x, y, width, height) {
    return [[x, y], [x + width, y], [x + width, y + height], [x, y + height]];
  }

  function cross(a, b, point) {
    return (b[0] - a[0]) * (point[1] - a[1]) - (b[1] - a[1]) * (point[0] - a[0]);
  }

  function samePoint(a, b) {
    return Math.abs(a[0] - b[0]) < EPSILON && Math.abs(a[1] - b[1]) < EPSILON;
  }

  function area(poly) {
    return Math.abs(poly.reduce(function (sum, point, i) {
      var next = poly[(i + 1) % poly.length];
      return sum + point[0] * next[1] - point[1] * next[0];
    }, 0) / 2);
  }

  // All input polygons are convex with clockwise winding in screen coordinates.
  function clip(poly, a, b, side) {
    var output = [];
    function add(point) {
      if (!output.length || !samePoint(output[output.length - 1], point)) output.push(point);
    }
    poly.forEach(function (current, i) {
      var previous = poly[(i + poly.length - 1) % poly.length];
      var from = side * cross(a, b, previous), to = side * cross(a, b, current);
      if ((from >= -EPSILON) !== (to >= -EPSILON) && Math.abs(from - to) > EPSILON) {
        var ratio = from / (from - to);
        add([
          previous[0] + ratio * (current[0] - previous[0]),
          previous[1] + ratio * (current[1] - previous[1])
        ]);
      }
      if (to >= -EPSILON) add(current);
    });
    if (output.length > 1 && samePoint(output[0], output[output.length - 1])) output.pop();
    return output;
  }

  function intersection(subject, boundary) {
    return boundary.reduce(function (poly, point, i) {
      return clip(poly, point, boundary[(i + 1) % boundary.length], 1);
    }, subject);
  }

  // Partition the uncovered region into non-overlapping fragments as each piece is applied.
  function difference(subject, boundary) {
    var remaining = subject, result = [];
    boundary.forEach(function (point, i) {
      if (!remaining.length) return;
      var next = boundary[(i + 1) % boundary.length];
      var fragment = clip(remaining, point, next, -1);
      if (area(fragment) > EPSILON) result.push(fragment);
      remaining = clip(remaining, point, next, 1);
      if (area(remaining) <= EPSILON) remaining = [];
    });
    return result;
  }

  function ray(length, degrees) {
    var angle = degrees * Math.PI / 180;
    return [Math.cos(angle) * length, Math.sin(angle) * length];
  }

  function sector(degrees, length) {
    var points = [[0, 0]];
    for (var i = 0; i < degrees; i += 5) points.push(ray(length, i));
    points.push(ray(length, degrees));
    return points;
  }

  function piece(id, polygon, color) {
    return { id: id, poly: polygon, color: color, x: 0, y: 0, angle: 0, placed: false };
  }

  function world(piece) {
    var axes = ray(1, piece.angle), c = axes[0], s = axes[1];
    return piece.poly.map(function (point) {
      return [point[0] * c - point[1] * s + piece.x, point[0] * s + point[1] * c + piece.y];
    });
  }

  function contains(poly, point) {
    return poly.length >= 3 && poly.every(function (a, i) {
      return cross(a, poly[(i + 1) % poly.length], point) >= -EPSILON;
    });
  }

  function translate(poly, x, y) {
    return poly.map(function (p) { return [p[0] + x, p[1] + y]; });
  }

  function split(stock, angle) {
    var a = stock.anchor, delta = ray(300, angle), b = [a[0] + delta[0], a[1] + delta[1]];
    var halves = [clip(stock.poly, a, b, 1), clip(stock.poly, a, b, -1)];
    return {
      line: [a, b],
      halves: halves.every(function (poly) { return area(poly) > 1; }) ? halves : []
    };
  }

  function makeCut(mission, draft, angle) {
    if (!mission.stock || draft.cut !== null || mission.stock.angles.indexOf(angle) < 0) return false;
    var halves = split(mission.stock, angle).halves;
    if (!halves.length) return false;
    halves.forEach(function (poly, i) {
      draft.pieces.push(piece('cut-' + (i + 1), poly, mission.stock.color));
    });
    draft.cut = angle;
    return true;
  }

  function create(mission) { return { pieces: copy(mission.pieces), cut: null, hints: 0 }; }

  function evaluate(mission, draft) {
    var placed = draft.pieces.filter(function (item) { return item.placed; });
    var remaining = mission.target.slice(), overlap = [], total = 0, outside = 0, coveredAngles = 0;
    mission.target.forEach(function (poly) { total += area(poly); });
    placed.forEach(function (item, i) {
      var poly = world(item), inside = 0;
      mission.target.forEach(function (target) { inside += area(intersection(poly, target)); });
      outside += Math.max(0, area(poly) - inside);
      for (var j = 0; j < i; j++) {
        var shared = intersection(poly, world(placed[j]));
        if (area(shared) > EPSILON) overlap.push(shared);
      }
      var next = [];
      remaining.forEach(function (region) { next = next.concat(difference(region, poly)); });
      remaining = next;
      coveredAngles += item.degrees || 0;
    });
    var missing = remaining.reduce(function (sum, poly) { return sum + area(poly); }, 0);
    var needsCut = !!mission.stock && draft.cut === null;
    return {
      ok: placed.length > 0 && !needsCut && !overlap.length && missing < EPSILON && outside < EPSILON,
      missing: missing, outside: outside, overlap: overlap, remaining: remaining, total: total,
      coverage: missing < EPSILON ? 100 : Math.min(99, Math.round((total - missing) * 100 / total)),
      count: placed.length, angleSum: coveredAngles, needsCut: needsCut
    };
  }

  function restore(mission, saved) {
    var draft = create(mission);
    if (!saved || !Array.isArray(saved.pieces)) return draft;
    if (saved.cut !== null) makeCut(mission, draft, saved.cut);
    draft.hints = [0, 1, 2].indexOf(saved.hints) >= 0 ? saved.hints : 0;
    draft.pieces.forEach(function (p) {
      var prior = saved.pieces.filter(function (item) { return item && item.id === p.id; })[0];
      if (!prior || prior.placed !== true || typeof prior.x !== 'number' || typeof prior.y !== 'number' ||
          !isFinite(prior.x) || !isFinite(prior.y) || Math.abs(prior.x) > 600 || Math.abs(prior.y) > 600 ||
          typeof prior.angle !== 'number' || !isFinite(prior.angle)) return;
      p.x = prior.x;
      p.y = prior.y;
      p.angle = normalize(prior.angle);
      p.placed = true;
    });
    return draft;
  }

  function snap(mission, x, y) {
    if (mission.vertex) return { x: mission.vertex[0], y: mission.vertex[1] };
    return { x: Math.round(x / STEP) * STEP, y: Math.round(y / STEP) * STEP };
  }

  return {
    epsilon: EPSILON, step: STEP, rect: rect, area: area, sector: sector, ray: ray, piece: piece,
    world: world, contains: contains, translate: translate, makeCut: makeCut, split: split,
    create: create, copy: copy, evaluate: evaluate, snap: snap, restore: restore, normalize: normalize
  };
});
