'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const { build } = require('./plan.cjs');

const root = path.resolve(__dirname, '../..');
const input = path.resolve(process.argv[2] || '');
const target = process.argv[3] || 'all';
const commit = process.argv.includes('--apply');
const plan = build(target);
const report = JSON.parse(fs.readFileSync(path.join(input, 'voice-build.json'), 'utf8'));
const digest = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const fromRoot = file => path.join(root, file);
const read = file => JSON.parse(fs.readFileSync(fromRoot(file), 'utf8'));
const json = (value, pretty = false) => Buffer.from(JSON.stringify(value, null, pretty ? 2 : 0) + '\n');
const write = new Map();

assert.deepEqual(report.profile, plan.profile, 'Artifact was made with a different voice profile');
assert.equal(report.clips.length, plan.clips.length, 'Incomplete or unexpected audio artifact');
for (let i = 0; i < plan.clips.length; i++) {
  const clip = report.clips[i];
  const { sha256, duration_ms, ...source } = clip;
  assert.deepEqual(source, plan.clips[i], 'Artifact does not match the current public curriculum');
  const file = path.join(input, source.path);
  const bytes = fs.readFileSync(file);
  assert.equal(digest(bytes), sha256, source.path);
  assert.ok(bytes.length > 1000 && duration_ms >= 150 && duration_ms < 60000, source.path);
  execFileSync('ffmpeg', ['-v', 'error', '-xerror', '-i', file, '-f', 'null', '-'], { stdio: 'pipe' });
  write.set(source.path, bytes);
}

const registered = 'data/arabic-voice-releases.json';
const registry = fs.existsSync(fromRoot(registered)) ? read(registered) : { schema: 1, apps: {} };
const byApp = new Map();
for (const row of report.clips) {
  if (!byApp.has(row.app)) byApp.set(row.app, []);
  byApp.get(row.app).push(row);
}
for (const [app, rows] of byApp) {
  const before = registry.apps[app]?.clips || [];
  const current = new Set(rows.map(row => row.path));
  registry.apps[app] = { profile: report.profile, clips: rows, retired: [
    ...new Set([...(registry.apps[app]?.retired || []), ...before.map(row => row.path)].filter(file => !current.has(file))),
  ].sort() };
}
write.set(registered, json(registry, true));

const planner = byApp.get('a4-session-planner');
if (planner) {
  const prefix = 'apps/4-8/session-planner-4-8/';
  const map = Object.fromEntries(planner.map(row => [row.display_text, row.path.slice(prefix.length)]));
  write.set(prefix + 'data/silma-prompts.js', Buffer.from('window.APP360_SESSION_SILMA=' + JSON.stringify(map) + ';\n'));
}

const market = byApp.get('a4-family-market');
if (market) {
  const prefix = 'apps/4-8/family-market-lab/';
  const manifest = prefix + 'data/audio-manifest.json';
  const source = read(manifest);
  const records = new Map(market.map(row => [row.path, row]));
  source.items = source.items.map(item => {
    const row = records.get(prefix + item.path);
    return row ? { ...item, engine: report.profile.engine + '-' + report.profile.version, sha256: row.sha256 } : item;
  });
  write.set(manifest, json(source, true));
}

const catalog = read('data/offline-catalog.json');
for (const app of catalog.apps) {
  const manifest = read(app.manifest);
  const old = new Map(manifest.files.map(row => [row.path, row]));
  for (const row of byApp.get(app.id) || []) {
    if (!old.has(row.path)) old.set(row.path, { path: row.path });
  }
  const plannerMap = 'apps/4-8/session-planner-4-8/data/silma-prompts.js';
  if (planner && app.id === 'a4-session-planner' && !old.has(plannerMap)) old.set(plannerMap, { path: plannerMap });
  const current = [...old.values()].map(row => {
    const bytes = write.get(row.path);
    return bytes ? { path: row.path, bytes: bytes.length, sha256: digest(bytes) } : row;
  });
  if (JSON.stringify(current) === JSON.stringify(manifest.files)) continue;
  manifest.files = current.sort((a, b) => a.path.localeCompare(b.path, 'en'));
  manifest.version = digest(JSON.stringify(manifest.files)).slice(0, 16);
  Object.assign(app, { version: manifest.version, count: current.length, bytes: current.reduce((sum, row) => sum + row.bytes, 0) });
  write.set(app.manifest, json(manifest));
}
write.set('data/offline-catalog.json', json(catalog, true));

if (commit) for (const [name, bytes] of write) {
  const file = fromRoot(name);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file) && fs.readFileSync(file).equals(bytes)) continue;
  const temporary = file + '.voice-tmp';
  fs.writeFileSync(temporary, bytes);
  fs.renameSync(temporary, file);
}
console.log(`${commit ? 'Installed' : 'Verified'} ${report.clips.length} public SILMA clips for ${byApp.size} apps`);
