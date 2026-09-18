'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const css=fs.readFileSync('styles-v16.css','utf8');const html=fs.readFileSync('index.html','utf8');
test('storyboard is capped on landscape tablets and desktops',()=>{assert.ok(css.includes('(orientation:landscape)'));assert.ok(css.includes('max-width:620px'));assert.ok(css.includes('68vh'));assert.ok(css.includes('max-width:640px'))});
test('phone layout remains full width',()=>{assert.ok(css.includes('@media(max-width:700px){.reel{width:100%'))});
test('index loads v15 styles',()=>{assert.ok(html.includes('styles-v16.css?v=2'))});