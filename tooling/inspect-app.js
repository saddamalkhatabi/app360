'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const query = (process.argv[2] || '').trim();
if (!query) {
  console.error('Usage: node tooling/inspect-app.js <app-id-or-slug>');
  process.exit(1);
}
function json(rel) { return JSON.parse(fs.readFileSync(path.join(root, rel), 'utf8')); }
const catalog = json('data/catalog.json');
const goals = json('data/goals.json');
const caps = json('data/capabilities.json');
const app = (catalog.apps || []).find(a => a.id === query || a.slug === query);
if (!app) {
  console.error('App not found in catalog:', query);
  process.exit(1);
}
const goalMap = new Map();
for (const age of Object.keys(goals.age_groups || {})) for (const g of goals.age_groups[age] || []) goalMap.set(g.key, g);
const capMap = new Map((caps.capabilities || []).map(c => [c.id, c]));
const result = {
  app,
  goals: (app.goal_keys || []).map(k => ({key:k, ...(goalMap.get(k) || {missing:true})})),
  capabilities: (app.capabilities || []).map(k => ({id:k, ...(capMap.get(k) || {missing:true})})),
  bundles: [],
  local_manifest: null
};
for (const id of app.bundles || []) {
  const p = path.join(root, 'bundles', id + '.json');
  result.bundles.push(fs.existsSync(p) ? JSON.parse(fs.readFileSync(p,'utf8')) : {id, missing:true});
}
if (app.manifest) {
  const p = path.join(root, app.manifest);
  if (fs.existsSync(p)) result.local_manifest = JSON.parse(fs.readFileSync(p,'utf8'));
}
console.log(JSON.stringify(result, null, 2));
