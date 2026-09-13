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
  const element = (id, attrs = {}) => elements[id] = {
    innerHTML: '', value: '', style: {}, className: '', attrs,
    getAttribute(name) { return this.attrs[name] || null; },
    setAttribute(name, value) { this.attrs[name] = value; },
    getElementsByTagName() { return []; }, focus() {}
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
  }
  const document = { body, readyState: 'complete', getElementById: id => elements[id] || null, querySelector: () => null };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'assets/js/lab360.js'), 'utf8'), { document, XMLHttpRequest: XHR });
  return { elements, element, urls };
}
test('portal renders all goal names, explanations and canonical plan links', () => {
  const { elements, urls } = portal();
  const html = elements.appGrid.innerHTML;
  assert.equal((html.match(/class="app-card"/g) || []).length, 64);
  for (const a of catalog.apps) {
    for (const key of a.goal_keys) assert.ok(html.includes(goals.age_groups[a.age_group].find(g => g.key === key).title_ar));
    for (const l of a.goal_links) assert.ok(html.includes(l.rationale_ar));
    assert.ok(html.includes(a.blueprint_path));
    assert.ok(html.includes(a.prompt_path));
  }
  assert.deepEqual(urls, ['./data/catalog.json', './data/goals.json', './data/live-overrides.json']);
  assert.equal((html.match(/>فتح التطبيق<\/a>/g) || []).length, 2);
  assert.ok(html.includes('./apps/1-4/say-and-name/index.html?v=3'));
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
    assert.ok(p.elements.appGrid.innerHTML.includes('../../apps/'+group.id+'/'));
  }
});
test('disclosure toggles visible state and aria-expanded in either direction', () => {
  const { elements, element } = portal();
  const panel = element('goals-a1-first-words'); panel.style.display = 'none';
  const button = element('test-button', { 'data-detail': 'goals', 'aria-controls': 'goals-a1-first-words', 'aria-expanded': 'false' });
  button.parentNode = elements.appGrid;
  elements.appGrid.onclick({ target: button });
  assert.equal(panel.style.display, 'block'); assert.equal(button.attrs['aria-expanded'], 'true');
  elements.appGrid.onclick({ target: button });
  assert.equal(panel.style.display, 'none'); assert.equal(button.attrs['aria-expanded'], 'false');
});
test('failed goal loading keeps catalog usable; untrusted labels are escaped', () => {
  const p = portal({ missingGoals: true });
  assert.ok(p.elements.appGrid.innerHTML.includes('تعذر تحميل اسم الهدف'));
  assert.equal((p.elements.appGrid.innerHTML.match(/class="app-card"/g) || []).length, 64);
  const changed = JSON.parse(JSON.stringify(catalog));
  changed.apps[0].title_ar = '<img src=x onerror="bad()">';
  const html = portal({ catalogData: changed }).elements.appGrid.innerHTML;
  assert.ok(!html.includes('<img src=x')); assert.ok(html.includes('&lt;img src=x'));
});
