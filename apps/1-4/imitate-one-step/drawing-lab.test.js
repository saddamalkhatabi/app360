'use strict';const test=require('node:test');const assert=require('node:assert/strict');const d=require('./drawing-lab.js');
test('drawing lab keeps repair and palm protection enabled by default',()=>{const c=d.config();assert.equal(c.repair,true);assert.equal(c.palm,true);assert.equal(c.power,3)});
test('short stylus interruption can be repaired',()=>{const c=d.config(),a={x:10,y:10},b={x:35,y:25};assert.equal(d.shouldRepair(a,b,120,c),true)});
test('large jump is rejected',()=>{const c=d.config();assert.equal(d.shouldRejectJump({x:0,y:0},{x:900,y:900},c),true)});
test('experience-aware template suggestions exist',()=>{assert.ok(d.suggest({title:'ارسم طريق السيارة',family:'art'}).length>=3);assert.ok(d.templates.length>=10)});