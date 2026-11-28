'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const { build } = require('./plan.cjs');
const root = path.resolve(__dirname, '../..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const registry = read('data/arabic-voice-releases.json');
const offline = new Map(read('data/offline-catalog.json').apps.map(row => [row.id, row]));
const { profile, clips } = build();
const checked = new Map();

for (const [app, release] of Object.entries(registry.apps)) {
  assert.deepEqual(release.profile, profile, app);
  const source = clips.filter(row => row.app === app);
  assert.equal(release.clips.length, source.length, app);
  const row = offline.get(app);
  assert.ok(row, app);
  const bundle = read(row.manifest);
  assert.equal(row.version, bundle.version, app);
  const assets = new Map(bundle.files.map(file => [file.path, file]));
  release.clips.forEach(({ sha256, duration_ms, ...clip }, i) => {
    assert.deepEqual(clip, source[i]);
    const file = fs.readFileSync(path.join(root, clip.path));
    assert.equal(sha256, hash(file), clip.path);
    assert.deepEqual(assets.get(clip.path), { path: clip.path, bytes: file.length, sha256 }, clip.path);
    assert.ok(duration_ms >= 150 && duration_ms < 60000, clip.path);
    checked.set(clip.path, sha256);
  });
}

assert.equal(checked.size, clips.length, 'Managed source is missing a published clip');
console.log('Verified ' + checked.size + ' public SILMA recordings and the matching offline bundle records.');
