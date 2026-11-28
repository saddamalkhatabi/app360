'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { items } = require('../data/audio-manifest.json');
require('../data/coach.js');
const rows = items.filter(row => !row.path.startsWith('audio/coach/'));
for (const [id, script] of Object.entries(globalThis.STUDIO_COACH_DATA.steps)) {
  for (const language of ['ar','en']) rows.push({
    id:'coach-'+language+'-'+id, path:'audio/coach/'+language+'-'+id+'.mp3',
    language, text:script[language], kind:'synthetic-authored-coach'
  });
}
fs.writeFileSync(path.resolve(process.argv[2]), JSON.stringify(rows,null,2)+'\n');
