'use strict';

// Lightweight DOM contract tests, not browser/layout tests.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const catalog = require('../data/catalog.json');
const goals = require('../data/goals.json');
const liveOverrides = require('../data/live-overrides.json');

function portal({ age = '', missingGoals = false, catalogData = catalog, overrideData = liveOverrides } = {}) {
  const elements = {};
  const swalCalls = [];
  const element = (id, attrs = {}) => elements[id] = {
    innerHTML: '', value: '', style: {}, className: '', attrs, parentNode: null,
    getAttribute(name) { return this.attrs[name] || null; },
    setAttribute(name, value) { this.attrs[name] = value; },
    getElementsByTagName() { return []; },
    focus() {}
  };
  ['appGrid','resultCount','appSearch','goalList','goalCount','ageTitle','ageFocus','ageMeta','ageGrid','totalApps','liveApps','plannedApps'].forEach(id => element(id));
  const body = element('body', { 'data-page': age ? 'age' : 'home', 'data-age': age, 'data-root': age ? '../..' : '.' });
  const urls = [];

  class XHR {
    open(method, url) { this.url = url; urls.push(url); }
    send() {
      this.readyState = 4;
      const isGoals = this.url.endsWith('goals.json');
      const isOverrides = this.url.endsWith('live-overrides.json');
      this.status = isGoals && missingGoals ? 503 : 200;
      this.responseText = JSON.stringify(isOverrides ? overrideData : (isGoals ? goals : catalogData));
      this.onreadystatechange();
    }
    abort() {}
  }

  const document = {
    body,
    readyState: 'complete',
    head: { appendChild() {} },
    getElementById: id => elements[id] || null,
    querySelector: () => null,
    createElement: () => ({ setAttribute() {}, style: {} })
  };
  const window = {
    Swal: { fire(options) { swalCalls.push(options); return Promise.resolve({}); } },
    event: null
  };

  vm.runInNewContext(
    fs.readFileSync(path.join(root, 'assets/js/lab360.js'), 'utf8'),
    { document, XMLHttpRequest: XHR, window, setTimeout, clearTimeout, Promise }
  );
  return { elements, element, urls, swalCalls };
}

function clickDetail(p, type, appId) {
  const button = p.element('detail-' + type + '-' + appId, { 'data-detail': type, 'data-app': appId });
  button.parentNode = p.elements.appGrid;
  p.elements.appGrid.onclick({ target: button });
}

test('portal renders the full catalog, live links and modal detail contracts', () => {
  const p = portal();
  const html = p.elements.appGrid.innerHTML;
  assert.equal((html.match(/class="app-card"/g) || []).length, 64);
  assert.deepEqual(p.urls, ['./data/catalog.json', './data/goals.json', './data/live-overrides.json']);
  assert.equal((html.match(/>فتح التطبيق<\/a>/g) || []).length, 2);

  const firstWords = liveOverrides.apps.find(a => a.id === 'a1-first-words');
  assert.ok(firstWords && html.includes('./' + firstWords.href));

  const liveApp = catalog.apps.find(a => a.id === 'a1-first-words');
  clickDetail(p, 'goals', liveApp.id);
  assert.equal(p.swalCalls.length, 1);
  for (const key of liveApp.goal_keys) {
    const g = goals.age_groups[liveApp.age_group].find(x => x.key === key);
    assert.ok(g && p.swalCalls[0].html.includes(g.title_ar));
  }
  for (const link of liveApp.goal_links) assert.ok(p.swalCalls[0].html.includes(link.rationale_ar));

  const planned = catalog.apps.find(a => a.status !== 'live' && a.blueprint && a.blueprint_path && a.prompt_path);
  assert.ok(planned);
  clickDetail(p, 'plan', planned.id);
  assert.equal(p.swalCalls.length, 2);
  assert.ok(p.swalCalls[1].html.includes(planned.blueprint.output_ar));
  assert.ok(p.swalCalls[1].html.includes(planned.blueprint_path));
  assert.ok(p.swalCalls[1].html.includes(planned.prompt_path));
});

test('Arabic goal search and every age page filter the catalog', () => {
  const { elements } = portal();
  elements.appSearch.value = 'اللعب الحسي والحركي الآمن'; elements.appSearch.oninput();
  assert.equal((elements.appGrid.innerHTML.match(/class="app-card"/g) || []).length, 3);
  elements.appSearch.value = 'NO_SUCH_APP'; elements.appSearch.oninput();
  assert.ok(elements.appGrid.innerHTML.includes('لا توجد تطبيقات'));
  for (const group of catalog.age_groups) {
    const p = portal({ age: group.id });
    assert.equal((p.elements.appGrid.innerHTML.match(/class="app-card"/g) || []).length, 8);
    assert.ok(p.elements.appGrid.innerHTML.includes('../../apps/' + group.id + '/'));
  }
});

test('goal and plan detail buttons use the current modal interaction', () => {
  const p = portal();
  const app = catalog.apps.find(a => a.id === 'a1-first-words');
  clickDetail(p, 'goals', app.id);
  clickDetail(p, 'plan', app.id);
  assert.equal(p.swalCalls.length, 2);
  assert.ok(p.swalCalls[0].title.includes('الأهداف المرتبطة'));
  assert.ok(p.swalCalls[1].title.includes('خطة التطبيق'));
  assert.ok(p.swalCalls[1].html.includes(app.blueprint.output_ar));
});

test('failed goal loading keeps catalog usable; untrusted labels are escaped', () => {
  const p = portal({ missingGoals: true });
  assert.equal((p.elements.appGrid.innerHTML.match(/class="app-card"/g) || []).length, 64);
  const app = catalog.apps.find(a => a.id === 'a1-first-words');
  clickDetail(p, 'goals', app.id);
  assert.ok(p.swalCalls[0].html.includes(app.goal_keys[0]));

  const changed = JSON.parse(JSON.stringify(catalog));
  changed.apps[0].title_ar = '<img src=x onerror="bad()">';
  const html = portal({ catalogData: changed }).elements.appGrid.innerHTML;
  assert.ok(!html.includes('<img src=x'));
  assert.ok(html.includes('&lt;img src=x'));
});
