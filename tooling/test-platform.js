'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const source = path.resolve(__dirname, '..');
let root;
before(() => {
  root = fs.mkdtempSync(path.join(os.tmpdir(), 'app360-contracts-'));
  fs.cpSync(source, root, { recursive: true, filter: p => !['.git','node_modules'].includes(path.basename(p)) });
});
after(() => fs.rmSync(root, { recursive: true, force: true }));
function run(script, args = []) { return spawnSync(process.execPath, [script, ...args], { cwd: root, encoding: 'utf8' }); }
function invalidCatalog(change, expected) {
  const p = path.join(root, 'data/catalog.json'), original = fs.readFileSync(p, 'utf8');
  try {
    const c = JSON.parse(original); change(c);
    fs.writeFileSync(p, JSON.stringify(c));
    const result = run('tooling/validate-platform.js');
    assert.notEqual(result.status, 0);
    assert.match(result.stderr, expected);
  } finally { fs.writeFileSync(p, original); }
}
test('every roadmap goal resolves and generated plans are current', () => {
  for (const [script, args] of [['tooling/validate-platform.js', []], ['tooling/build-blueprints.js', ['--check']]]) {
    const r = run(script, args); assert.equal(r.status, 0, r.stdout+r.stderr);
  }
});
test('rejects missing explanations and cross-age mappings', () => {
  invalidCatalog(c => c.apps[1].goal_links.pop(), /explanation count/);
  invalidCatalog(c => { c.apps[1].goal_keys[0] = c.apps[9].goal_keys[0]; c.apps[1].goal_links[0].goal_key = c.apps[9].goal_keys[0]; }, /cross-age goal mapping/);
});
test('rejects unsupported delivery and mismatched local identity', () => {
  invalidCatalog(c => { c.apps[1].goal_links[0].delivery = 'available_with_facilitator'; }, /unbuilt app claims delivered goal/);
  invalidCatalog(c => { c.apps[1].id = 'wrong-identity'; }, /contract id mismatch/);
});
test('scaffold continues a blueprint-only plan, preserves its contract/docs, and refuses a second run', () => {
  const catalog = JSON.parse(fs.readFileSync(path.join(root, 'data/catalog.json'), 'utf8'));
  const candidate = catalog.apps.find(a => {
    if (a.status === 'live') return false;
    const p = path.join(root, 'apps', a.age_group, a.slug, 'app.json');
    if (!fs.existsSync(p)) return false;
    try { return JSON.parse(fs.readFileSync(p, 'utf8')).scaffold_state === 'blueprint-only'; } catch (_) { return false; }
  });
  assert.ok(candidate, 'expected at least one blueprint-only planned app');
  const rel = `apps/${candidate.age_group}/${candidate.slug}`;
  const manifest = JSON.parse(fs.readFileSync(path.join(root, rel, 'app.json')));
  const spec = fs.readFileSync(path.join(root, rel, 'BUILD_SPEC.md'), 'utf8');
  const args = [candidate.age_group, candidate.slug, manifest.title_ar];
  const first = run('tooling/scaffold-app.js', args);
  assert.equal(first.status, 0, first.stdout+first.stderr);
  const next = JSON.parse(fs.readFileSync(path.join(root, rel, 'app.json')));
  assert.equal(next.id, manifest.id);
  assert.deepEqual(next.goal_keys, manifest.goal_keys);
  assert.equal(next.scaffold_state, 'implementation-started');
  assert.equal(fs.readFileSync(path.join(root, rel, 'BUILD_SPEC.md'), 'utf8'), spec);
  assert.ok(fs.existsSync(path.join(root, rel, 'index.html')));
  const second = run('tooling/scaffold-app.js', args);
  assert.notEqual(second.status, 0);
  assert.match(second.stderr, /refusing to overwrite/);
});
