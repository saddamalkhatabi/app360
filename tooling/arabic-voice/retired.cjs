'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const { build } = require('./plan.cjs');

const root = path.resolve(__dirname, '../..');
const registry = require('../../data/arabic-voice-releases.json');
const active = new Set(build().clips.map(row => row.path));
const assets = Object.values(registry.apps).flatMap(app => app.retired);
const candidates = [...new Set(assets)].filter(file => !active.has(file) &&
  /^apps\/[\w-]+\/[\w-]+\/audio\/[\w./-]+\.mp3$/.test(file) && !file.includes('..'));
const records = require('../../data/offline-catalog.json').apps.flatMap(app =>
  JSON.parse(fs.readFileSync(path.join(root, app.manifest), 'utf8')).files.map(row => row.path));
const offline = new Set(records);

function referenced(filename) {
  try {
    return !!execFileSync('git', ['grep', '-l', '-F', '-e', path.basename(filename), '--',
      'apps', 'assets', 'resources', 'packages', 'data', 'services', 'tooling',
      ':(exclude)data/arabic-voice-releases.json'], { cwd: root, stdio: ['ignore', 'pipe', 'pipe'] }).length;
  } catch (error) {
    if (error.status === 1) return false;
    throw error;
  }
}

const report = candidates.map(file => ({ file, offline: offline.has(file), literalReference: referenced(file) }));
console.log(JSON.stringify(report, null, 2));
