'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const contracts = require(path.join(root, 'packages/contracts/src/index.cjs'));

function readJson(rel) { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); }
function exists(rel) { return fs.existsSync(path.join(root, rel)); }
function listDirs(rel) { const p=path.join(root,rel); return fs.existsSync(p)?fs.readdirSync(p,{withFileTypes:true}).filter(x=>x.isDirectory()).map(x=>x.name):[]; }
let failed = false;
function fail(msg) { failed = true; console.error('FAIL:', msg); }
function ok(msg) { console.log('OK:', msg); }

const { AGE_GROUPS, APP_STATUSES, APP_KINDS, DEPTH_LEVELS, RUNTIME_PROFILES } = contracts;
const catalog = readJson('data/catalog.json');
const goals = readJson('data/goals.json');
const capRegistry = readJson('data/capabilities.json');
const resourceRegistry = readJson('resources/registry.json');

const catalogAges = (catalog.age_groups || []).map(x => x.id);
if (JSON.stringify(catalogAges) !== JSON.stringify(AGE_GROUPS)) fail('catalog age groups must exactly match contracts: ' + AGE_GROUPS.join(', '));
else ok('canonical age groups');
for (const age of AGE_GROUPS) {
  if (!exists(`ages/${age}/index.html`)) fail(`missing age page ${age}`);
  if (!goals.age_groups || !Array.isArray(goals.age_groups[age]) || !goals.age_groups[age].length) fail(`missing goals for ${age}`);
  if (exists(age)) fail(`obsolete top-level age/app route must not exist: ${age}/`);
}

const allGoals = new Map();
for (const age of AGE_GROUPS) {
  for (const goal of goals.age_groups[age] || []) {
    if (!goal.key) fail(`goal without key in ${age}`);
    if (allGoals.has(goal.key)) fail(`duplicate goal key ${goal.key}`);
    allGoals.set(goal.key, { age, role: goal.role, title: goal.title_ar });
  }
}
ok(`${allGoals.size} reference goals`);

const capabilities = new Map();
for (const c of capRegistry.capabilities || []) {
  if (!c.id) fail('capability without id');
  if (capabilities.has(c.id)) fail(`duplicate capability ${c.id}`);
  capabilities.set(c.id, c);
}
ok(`${capabilities.size} registered capabilities`);

const bundles = new Map();
const bundleDir = path.join(root, 'bundles');
if (fs.existsSync(bundleDir)) {
  for (const name of fs.readdirSync(bundleDir)) {
    if (!name.endsWith('.json')) continue;
    const rel = `bundles/${name}`;
    const b = readJson(rel);
    if (!b.id) fail(`bundle without id: ${rel}`);
    if (bundles.has(b.id)) fail(`duplicate bundle id ${b.id}`);
    if (!DEPTH_LEVELS.includes(b.depth)) fail(`invalid bundle depth ${b.id}: ${b.depth}`);
    for (const id of b.capabilities || []) if (!capabilities.has(id)) fail(`bundle ${b.id} references unknown capability ${id}`);
    bundles.set(b.id, b);
  }
}
ok(`${bundles.size} capability bundles`);

const resourceIds = new Set();
for (const r of resourceRegistry.resources || []) {
  if (!r.id || resourceIds.has(r.id)) fail(`missing/duplicate shared resource id ${r.id}`);
  else resourceIds.add(r.id);
}
for (const c of resourceRegistry.candidates || []) {
  if (!c.id) fail('resource candidate without id');
  if (c.current_owner && !exists(c.current_owner)) fail(`resource candidate owner missing: ${c.id} -> ${c.current_owner}`);
}
ok(`${resourceIds.size} promoted shared resources, ${(resourceRegistry.candidates || []).length} candidates`);

const ids = new Set();
const slugsByAge = new Set();
const coverage = new Map();
const apps = catalog.apps || [];
for (const app of apps) {
  if (!app.id || ids.has(app.id)) fail(`missing/duplicate app id ${app.id}`); else ids.add(app.id);
  const slugKey = `${app.age_group}|${app.slug}`;
  if (!app.slug || slugsByAge.has(slugKey)) fail(`missing/duplicate app slug ${slugKey}`); else slugsByAge.add(slugKey);
  if (!AGE_GROUPS.includes(app.age_group)) fail(`invalid age on ${app.id}: ${app.age_group}`);
  if (!APP_STATUSES.includes(app.status)) fail(`invalid status on ${app.id}: ${app.status}`);
  if (!APP_KINDS.includes(app.kind)) fail(`invalid kind on ${app.id}: ${app.kind}`);
  if (app.depth && !DEPTH_LEVELS.includes(app.depth)) fail(`invalid app depth ${app.id}: ${app.depth}`);
  if (app.runtime_profile && !RUNTIME_PROFILES.includes(app.runtime_profile)) fail(`invalid runtime profile ${app.id}: ${app.runtime_profile}`);
  if (!app.title_ar || !app.description_ar || !app.practice_model) fail(`incomplete practical metadata on ${app.id}`);
  const goalKeys = app.goal_keys || [];
  if (app.kind !== 'modern_extension' && !goalKeys.length) fail(`non-extension app has no goals: ${app.id}`);
  for (const key of goalKeys) {
    const goal = allGoals.get(key);
    if (!goal) { fail(`unknown goal ${key} on ${app.id}`); continue; }
    if (goal.age !== app.age_group) fail(`cross-age goal mapping ${app.id} -> ${key}`);
    coverage.set(key, (coverage.get(key) || 0) + 1);
  }
  for (const cap of app.capabilities || []) if (!capabilities.has(cap)) fail(`app ${app.id} references unknown capability ${cap}`);
  for (const b of app.bundles || []) if (!bundles.has(b)) fail(`app ${app.id} references unknown bundle ${b}`);
  if (app.status === 'live') {
    const expectedPrefix = `apps/${app.age_group}/${app.slug}/`;
    if (!app.href) fail(`live app without href: ${app.id}`);
    else {
      const clean = app.href.split('?')[0].split('#')[0];
      if (!clean.startsWith(expectedPrefix)) fail(`live app must use canonical apps/<age>/<slug>/ route: ${app.id} -> ${clean}`);
      if (!exists(clean)) fail(`live href missing: ${app.id} -> ${clean}`);
    }
    if (app.manifest && !exists(app.manifest)) fail(`app manifest missing: ${app.id} -> ${app.manifest}`);
  }
}
ok(`${ids.size} unique catalog apps/ideas`);

const uncovered = [];
for (const [key, goal] of allGoals) if (!coverage.get(key)) uncovered.push(`${goal.age} :: ${key}`);
if (uncovered.length) fail('reference goals without roadmap coverage:\n - ' + uncovered.join('\n - '));
else ok(`all ${allGoals.size} goals covered by roadmap`);

for (const rel of ['package.json','pnpm-workspace.yaml','pnpm-lock.yaml','packages/contracts/package.json']) if (!exists(rel)) fail(`missing workspace foundation: ${rel}`);
for (const rel of ['manifest.webmanifest','sw.js','assets/brand/app360-lab-icon.svg','assets/brand/app360-lab-logo.svg','assets/js/pwa-install.js']) if (!exists(rel)) fail(`missing portal PWA asset: ${rel}`);
ok('portal PWA foundation present');

// Workspace package identity and lockfile hygiene.
const workspacePkgs = [];
for (const age of listDirs('apps')) {
  if (age === '_template') continue;
  for (const slug of listDirs(`apps/${age}`)) {
    const rel = `apps/${age}/${slug}/package.json`;
    if (exists(rel)) workspacePkgs.push(rel);
  }
}
for (const name of listDirs('packages')) if (exists(`packages/${name}/package.json`)) workspacePkgs.push(`packages/${name}/package.json`);
for (const name of listDirs('services')) if (name !== '_template' && exists(`services/${name}/package.json`)) workspacePkgs.push(`services/${name}/package.json`);
const packageNames = new Set();
for (const rel of workspacePkgs) {
  const pkg = readJson(rel);
  if (!pkg.name) fail(`workspace package has no name: ${rel}`);
  else if (packageNames.has(pkg.name)) fail(`duplicate workspace package name: ${pkg.name}`);
  else packageNames.add(pkg.name);
  const dir = path.dirname(rel);
  for (const lock of ['pnpm-lock.yaml','package-lock.json','yarn.lock']) if (exists(`${dir}/${lock}`)) fail(`nested lockfile is not allowed: ${dir}/${lock}`);
  if (exists(`${dir}/node_modules`)) fail(`node_modules must not be committed inside workspace: ${dir}`);
}
ok(`${workspacePkgs.length} workspace package manifests, unique names and no nested lockfiles`);

for (const app of apps.filter(x => x.status === 'live' && x.href && x.href.indexOf('apps/') === 0)) {
  const appDir = path.dirname(app.href.split('?')[0].split('#')[0]);
  const manifestRel = `${appDir}/app.json`;
  const packageRel = `${appDir}/package.json`;
  if (!exists(manifestRel)) { fail(`workspace live app missing app.json: ${app.id}`); continue; }
  if (!exists(packageRel)) fail(`workspace live app missing package.json: ${app.id}`);
  const manifest = readJson(manifestRel);
  if (manifest.id !== app.id) fail(`catalog/app.json id mismatch for ${app.id}`);
  if (manifest.slug !== app.slug) fail(`catalog/app.json slug mismatch for ${app.id}`);
  if (manifest.age_group !== app.age_group) fail(`catalog/app.json age mismatch for ${app.id}`);
  if (!RUNTIME_PROFILES.includes(manifest.runtime_profile)) fail(`live app missing/invalid runtime_profile: ${app.id}`);
  if (!DEPTH_LEVELS.includes(manifest.depth)) fail(`live app missing/invalid depth: ${app.id}`);
  for (const cap of manifest.capabilities || []) if (!capabilities.has(cap)) fail(`app.json ${app.id} references unknown capability ${cap}`);
  for (const b of manifest.bundles || []) if (!bundles.has(b)) fail(`app.json ${app.id} references unknown bundle ${b}`);
  for (const rel of [manifest.manifest_path,manifest.icon_path,`${appDir}/sw.js`]) if (!rel || !exists(rel)) fail(`live app PWA asset missing for ${app.id}: ${rel||'(undefined)'}`);
  if ((manifest.capabilities||[]).includes('pwa.offline') && !manifest.offline_mode) fail(`live offline-capable app must declare offline_mode: ${app.id}`);
}
ok('live app manifests, icons, service workers and runtime contracts verified');

const counts = {};
for (const app of apps) counts[app.age_group] = (counts[app.age_group] || 0) + 1;
for (const age of AGE_GROUPS) console.log('AGE', age, 'apps:', counts[age] || 0, 'goals:', (goals.age_groups[age] || []).length);

if (failed) {
  console.error('\nApp 360 Lab validation FAILED');
  process.exit(1);
}
console.log('\nApp 360 Lab validation PASSED');
