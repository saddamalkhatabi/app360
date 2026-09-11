'use strict';

const fs = require('fs');
const path = require('path');
const root = path.resolve(__dirname, '..');
const names = new Set(['dist','build','.cache','.tmp','coverage']);
let removed = 0;

function walk(dir, depth) {
  if (depth > 5) return;
  for (const entry of fs.readdirSync(dir, {withFileTypes:true})) {
    if (entry.name === '.git' || entry.name === 'node_modules') continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory() && names.has(entry.name)) {
      fs.rmSync(p, {recursive:true, force:true});
      console.log('removed', path.relative(root, p));
      removed++;
      continue;
    }
    if (entry.isDirectory()) walk(p, depth + 1);
  }
}

walk(root, 0);
console.log('cleaned generated directories:', removed);
