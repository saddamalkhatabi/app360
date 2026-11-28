'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const profile = require('./profile.json');
const marketPhrasing = require('./market-phrasing.json');
const market = 'apps/4-8/family-market-lab/';
const numbers = ['صِفْر', 'وَاحِد', 'اِثْنَان', 'ثَلَاثَة', 'أَرْبَعَة', 'خَمْسَة', 'سِتَّة', 'سَبْعَة', 'ثَمَانِيَة', 'تِسْعَة', 'عَشَرَة',
  'أَحَدَ عَشَر', 'اِثْنَا عَشَر', 'ثَلَاثَةَ عَشَر', 'أَرْبَعَةَ عَشَر', 'خَمْسَةَ عَشَر', 'سِتَّةَ عَشَر',
  'سَبْعَةَ عَشَر', 'ثَمَانِيَةَ عَشَر', 'تِسْعَةَ عَشَر', 'عِشْرُون'];

function spellNumber(raw) {
  const value = Number(raw.replace(/[٠-٩]/g, digit => digit.charCodeAt(0) - 0x660));
  if (value <= 20) return numbers[value];
  if (value < 30) return `${numbers[value - 20]} وَعِشْرُون`;
  throw Error('Author the reading for the number ' + raw);
}

function authored(app, audioDirectory, values) {
  return Object.entries(values).map(([id, text]) => ({
    app, path: `${audioDirectory}/${id}.mp3`, text, ...(text.trim().split(/\s+/).length === 1 ? { seconds: .85 } : {}),
  }));
}

function planner() {
  const app = 'a4-session-planner';
  const directory = 'apps/4-8/session-planner-4-8/';
  const sandbox = {};
  sandbox.window = sandbox;
  for (const source of ['apps/4-8/command-path-lab/src/journey-missions.js', directory + 'content.js']) {
    vm.runInNewContext(fs.readFileSync(path.join(root, source), 'utf8'), sandbox, { timeout: 1000 });
  }
  const fixed = require('./planner.json');
  const items = Object.entries(fixed).concat(
    sandbox.window.SessionActivities.map((row, i) => [
      `activity-${i + 1}`, row.track ? row.title.split(' · ')[1].split(' — ')[0] + '.' : row.title, row.title,
    ]),
    sandbox.window.SessionTemplates.map((row, i) => [`template-${i + 1}`, row.real]));
  return items.map(([id, value, original]) => ({
    app, path: `${directory}audio/silma-ar/${id}.mp3`, text: value,
    display_text: original || value,
  }));
}

const sources = {
  'toy-city-crane': () => authored('toy-city-crane', 'apps/1-4/toy-city-crane/audio/coach/ar', require('./crane.json')),
  'a1-sensory': () => authored('a1-sensory', 'apps/1-4/sensory-motion-missions/audio/silma-ar', require('./basket.json')),
  'a4-session-planner': planner,
  'a4-family-market': () => require(path.join(root, market, 'data/audio-manifest.json')).items
    .filter(clip => clip.language === 'ar').map(clip => ({
      app: 'a4-family-market', path: market + clip.path, text: marketPhrasing[clip.path] || clip.text.replace(/[0-9٠-٩]+/g, spellNumber),
      ...(clip.text.trim().split(/\s+/).length === 1 ? { seconds: .85 } : {}),
    })),
};

function build(target = 'all') {
  if (target !== 'all' && !Object.hasOwn(sources, target)) throw Error('Unknown Arabic voice target ' + target);
  const clips = (target === 'all' ? Object.values(sources) : [sources[target]]).flatMap(read => read());
  const paths = new Set();
  for (const clip of clips) {
    if (!/^apps\/[\w-]+\/[\w-]+\/audio\/[\w./-]+\.mp3$/.test(clip.path) || clip.path.includes('..') ||
        typeof clip.text !== 'string' || !/[\u0621-\u064a]/.test(clip.text) || paths.has(clip.path)) {
      throw Error('Invalid or duplicate authored row at ' + clip.path);
    }
    paths.add(clip.path);
  }
  return { profile, clips };
}

if (require.main === module) {
  const [, , out, target] = process.argv;
  if (!out) throw Error('Usage: node plan.cjs <output.json> [app-id|all]');
  fs.writeFileSync(out, JSON.stringify(build(target), null, 2) + '\n');
}
module.exports = { build, sources };
