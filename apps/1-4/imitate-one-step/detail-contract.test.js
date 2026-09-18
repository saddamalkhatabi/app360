'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const src=fs.readFileSync('app-v13.js','utf8');

test('detail page helper functions are all defined',()=>{
  [
    'renderReel','setupReel','clearReel','ideaText','notesHtml','formatDate',
    'nextExperienceId','goNextExperience','openDrawingLab','refreshLocal',
    'loadCommunity','preparePublicComment','openHelpers'
  ].forEach(name=>{
    assert.ok(new RegExp('function\\s+'+name+'\\s*\\(').test(src), 'missing function '+name);
  });
});

test('openExperience exists and calls only available detail helpers',()=>{
  assert.ok(/function\s+openExperience\s*\(/.test(src));
  assert.ok(src.includes('notesHtml(stat)'));
  assert.ok(src.includes('setupReel()'));
  assert.ok(src.includes('el(\'nextExperience\').onclick=goNextExperience'));
});

test('v13 runtime parses',()=>{
  assert.doesNotThrow(()=>new Function(src));
});
