(function (root, create) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = create();
  else root.MarketJourneyModel = create();
})(typeof window === 'object' ? window : globalThis, function () {
  'use strict';

  var levels = [
    { id: 'recognize', ar: 'أتعرف على الأرقام', en: 'Meet the numbers', rounds: [
      { products: ['banana'], goal: 1, choices: [2, 1, 3] },
      { products: ['apple'], goal: 2, choices: [1, 2, 3] },
      { products: ['grapes'], goal: 3, choices: [3, 1, 2] },
      { products: ['orange'], goal: 4, choices: [4, 5, 3] },
      { products: ['strawberry'], goal: 5, choices: [3, 6, 5] }
    ] },
    { id: 'count', ar: 'أعدّ في السلة', en: 'Count into the basket', rounds: [
      { products: ['apple', 'banana', 'orange'], targets: [3, 0, 0] },
      { products: ['carrot', 'tomato', 'cucumber'], targets: [4, 0, 0] },
      { products: ['banana', 'grapes', 'strawberry'], targets: [6, 0, 0] }
    ] },
    { id: 'mixed', ar: 'أجهّز القائمة', en: 'Fill the shopping list', rounds: [
      { products: ['apple', 'orange', 'banana'], targets: [2, 1, 0] },
      { products: ['tomato', 'cucumber', 'carrot'], targets: [2, 3, 0] },
      { products: ['strawberry', 'grapes', 'apple'], targets: [4, 3, 0] }
    ] },
    { id: 'add', ar: 'أجمع مجموعتين', en: 'Join two groups', rounds: [
      { products: ['orange'], parts: [1, 2] },
      { products: ['tomato'], parts: [2, 3] },
      { products: ['apple'], parts: [4, 5] }
    ] },
    { id: 'subtract', ar: 'أعيد الزائد', en: 'Return the extras', rounds: [
      { products: ['banana'], parts: [4, 1] },
      { products: ['carrot'], parts: [6, 2] },
      { products: ['strawberry'], parts: [9, 3] }
    ] },
    { id: 'pay', ar: 'أدفع بالنقود', en: 'Pay with coins', rounds: [
      { products: ['apple'], goal: 3, parts: [2, 1] },
      { products: ['tomato'], goal: 6, parts: [4, 2] },
      { products: ['orange'], goal: 9, parts: [4, 5] }
    ] }
  ];

  function start(level, round) {
    var mode = levels[level].id;
    var order = levels[level].rounds[round];
    var goal = order.goal;
    if (mode === 'count' || mode === 'mixed') goal = order.targets.reduce(function (a, b) { return a + b; }, 0);
    if (mode === 'add') goal = order.parts[0] + order.parts[1];
    if (mode === 'subtract') goal = order.parts[0] - order.parts[1];
    var initial = [];
    if (mode === 'subtract') {
      for (var i = 0; i < order.parts[0]; i++) initial.push(0);
    }
    return { level: level, round: round, mode: mode, order: order, goal: goal, initial: initial };
  }

  function stock(task) {
    if (task.mode === 'add') return task.order.parts.map(function (size) { return size; });
    if (task.mode === 'subtract') return [task.initial.length];
    if (task.mode === 'pay') return [task.goal + 1];
    if (!task.order.targets) return [];
    var max = task.goal + 2;
    return task.order.targets.map(function (size) { return size ? Math.min(max, size + 2) : 2; });
  }

  function count(items, kind) {
    return items.filter(function (item) { return item === kind; }).length;
  }

  function change(task, items, action, value) {
    if (typeof value !== 'number' || Math.floor(value) !== value) return null;
    if (action === 'take' && stock(task)[value] > count(items, value) && items.length < 12) {
      return items.concat(value);
    }
    if (action === 'return' && value >= 0 && value < items.length) {
      return items.slice(0, value).concat(items.slice(value + 1));
    }
    return null;
  }

  function check(task, items, choice) {
    if (task.mode === 'recognize') return choice === task.goal;
    if (task.order.targets) {
      return task.order.targets.every(function (size, kind) { return count(items, kind) === size; });
    }
    return items.length === task.goal;
  }

  function suggestion(task, items) {
    if (task.mode === 'recognize') return { action: 'choose', value: task.goal };
    if (check(task, items)) return { action: 'deliver' };
    var targets = task.order.targets;
    if (targets) {
      for (var i = 0; i < targets.length; i++) {
        if (count(items, i) > targets[i]) return { action: 'return', value: items.lastIndexOf(i) };
      }
      for (var j = 0; j < targets.length; j++) {
        if (count(items, j) < targets[j]) return { action: 'take', value: j };
      }
    }
    if (items.length > task.goal) return { action: 'return', value: items.length - 1 };
    var supplies = stock(task);
    for (var k = 0; k < supplies.length; k++) {
      if (count(items, k) < supplies[k]) return { action: 'take', value: k };
    }
    return { action: 'deliver' };
  }

  function fresh() {
    return { level: 0, round: 0, basket: null, delivered: false, completed: [], language: 'ar', sound: true };
  }

  function load(raw) {
    var state = fresh();
    if (!raw || typeof raw !== 'object') return state;
    if (raw.language === 'en') state.language = 'en';
    state.sound = raw.sound !== false;
    if (typeof raw.level !== 'number' || typeof raw.round !== 'number' ||
        !levels[raw.level] || !levels[raw.level].rounds[raw.round]) return state;
    state.level = raw.level;
    state.round = raw.round;
    var task = start(state.level, state.round);
    var supplies = stock(task);
    if (Array.isArray(raw.basket) && raw.basket.length <= 12 && raw.basket.every(function (item) {
      return typeof item === 'number' && Math.floor(item) === item && supplies[item] > 0 &&
        count(raw.basket, item) <= supplies[item];
    })) state.basket = raw.basket.slice();
    var validKeys = [];
    levels.forEach(function (level, i) {
      level.rounds.forEach(function (_, j) { validKeys.push(i + ':' + j); });
    });
    if (Array.isArray(raw.completed)) {
      state.completed = validKeys.filter(function (key) { return raw.completed.indexOf(key) !== -1; });
    }
    state.delivered = raw.delivered === true && state.completed.indexOf(state.level + ':' + state.round) !== -1 &&
      (task.mode === 'recognize' || (state.basket !== null && check(task, state.basket)));
    return state;
  }

  return { levels: levels, start: start, stock: stock, count: count, change: change, check: check, suggestion: suggestion, load: load };
});
