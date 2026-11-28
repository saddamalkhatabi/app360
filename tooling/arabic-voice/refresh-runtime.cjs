'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const vm = require('node:vm');

const root = path.resolve(__dirname, '../..');
const shared = ['assets/js/school-voice-feedback-v1.js', 'assets/js/teacher-encouragement-v1.js',
  'assets/js/parent-experiences-v1.js', 'resources/celebration-audio/player-v1.js',
  'resources/celebration-audio/manifest-v1.js', 'resources/celebration-audio/pcm-v1.js'];
const names = 'resources/celebration-audio/names.json';
const directory = {
  'fun-wonder-machine': ['device-app.js', 'offline-files.json'],
  'a4-command-path': ['src/journey.js', 'src/celebration.js'],
  'a4-draw-write': ['app.js'],
  'a4-family-market': ['journey.js', 'data/audio-manifest.json'],
  'a1-sensory': ['simulation.js'],
  'a4-session-planner': ['app.js', 'data/silma-prompts.js'],
};
const fromRoot = file => path.join(root, file);
const read = file => JSON.parse(fs.readFileSync(fromRoot(file), 'utf8'));
const save = (file, value, pretty) => fs.writeFileSync(fromRoot(file), JSON.stringify(value, null, pretty ? 2 : 0) + '\n');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');
const catalog = read('data/offline-catalog.json');
const records = new Map();
const checked = new Set();
function record(file) {
  if (!records.has(file)) {
    const bytes = fs.readFileSync(fromRoot(file));
    records.set(file, { path: file, bytes: bytes.length, sha256: hash(bytes) });
  }
  return records.get(file);
}

const wonder = catalog.apps.find(row => row.id === 'fun-wonder-machine');
const wonderList = wonder.directory + 'offline-files.json';
const preparation = read(wonderList);
preparation.files = preparation.files.filter(file => file !== path.posix.relative(wonder.directory, names));
for (const file of shared) {
  const reference = path.posix.relative(wonder.directory, file);
  if (!preparation.files.includes(reference)) preparation.files.push(reference);
}
save(wonderList, preparation);

const sensoryWords = 'apps/1-4/say-and-name/data/silma-map.js';
const sensoryApp = catalog.apps.find(row => row.id === 'a1-sensory');
const basketScripts = fs.readFileSync(fromRoot(sensoryApp.directory + 'simulation.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(fromRoot(sensoryWords), 'utf8'), sandbox, { timeout: 1000 });
const categories = vm.runInNewContext(basketScripts.match(/cats=(\[\[.*?\]\]),ci=/)[1], {}, { timeout: 1000 });
const vocabulary = new Map(read('data/offline/a1-first-words.json').files.map(row => [row.path, row]));
const borrowed = [...new Set(categories.flatMap(category => category[1]))].map(word => {
  const relative = sandbox.window.APP360_SILMA.words[word];
  const file = 'apps/1-4/say-and-name/' + relative;
  if (!relative || !vocabulary.has(file)) throw Error('No offline SILMA recording for ' + word);
  return vocabulary.get(file);
});
const earlyLearning = 'packages/early-learning-core/core.js';
checked.add(record(earlyLearning).path);
const oldMarket = 'apps/4-8/family-market-lab/';
const restoreFile = process.argv[2];
const history = restoreFile ? JSON.parse(fs.readFileSync(restoreFile, 'utf8')).files : [];
for (const row of catalog.apps.filter(app => directory[app.id])) {
  for (const relative of ['index.html', ...directory[row.id]]) {
    checked.add(record(row.directory + relative).path);
  }
}

for (const row of catalog.apps) {
  const manifest = read(row.manifest);
  const files = new Map(manifest.files.map(item => [item.path, item]));
  if (directory[row.id]) for (const item of shared) files.set(item, record(item));
  if (row.id === 'fun-wonder-machine') files.delete(names);
  if (row.id === 'a1-sensory') {
    files.set(sensoryWords, record(sensoryWords));
    for (const entry of borrowed) files.set(entry.path, entry);
  }
  if (row.id === 'a4-family-market') for (const entry of history) {
    if (entry.path.startsWith(oldMarket + 'audio/en-') && !files.has(entry.path)) files.set(entry.path, entry);
  }
  const next = [...files.values()].map(item => checked.has(item.path) ? record(item.path) : item)
    .sort((a, b) => a.path.localeCompare(b.path, 'en'));
  if (JSON.stringify(next) === JSON.stringify(manifest.files)) continue;
  manifest.files = next;
  manifest.version = hash(JSON.stringify(next)).slice(0, 16);
  Object.assign(row, { version: manifest.version, bytes: next.reduce((n, item) => n + item.bytes, 0), count: next.length });
  save(row.manifest, manifest);
}
save('data/offline-catalog.json', catalog, true);
