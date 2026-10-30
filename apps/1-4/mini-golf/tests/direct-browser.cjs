'use strict';
const assert=require('node:assert/strict');
module.exports=async function directControls(page){
 await page.locator('#littleLevels').click();
 assert.equal(await page.locator('.level-card:visible').count(),6);
 await page.locator('#levelCard5').click();
 assert.equal(await page.evaluate(()=>MiniGolf.getState().settings.level),5);
 await page.locator('#courseArt').scrollIntoViewIfNeeded();
 // Map through the real SVG matrix: includes responsive letterboxing and page scroll.
 const points=await page.evaluate(()=>{const svg=document.getElementById('courseSvg'),p=MiniGolf.getState().state.position;function screen(x,y){const a=svg.createSVGPoint();a.x=x*3;a.y=y*3;const b=a.matrixTransform(svg.getScreenCTM());return{x:b.x,y:b.y};}return{start:screen(p.x,p.y-9),right:screen(p.x+14,p.y),left:screen(p.x-14,p.y)};});
 await page.mouse.move(points.start.x,points.start.y);await page.mouse.down();await page.mouse.move(points.right.x,points.right.y,{steps:12});await page.mouse.up();
 assert.equal(await page.evaluate(()=>MiniGolf.getState().game.aim),90);
 assert.equal(await page.evaluate(()=>MiniGolf.getState().state.shots),0,'aiming alone never shoots');
 await page.locator('#courseArt').focus();await page.keyboard.press('ArrowLeft');
 assert.equal(await page.evaluate(()=>MiniGolf.getState().game.aim),85);
 await page.reload();await page.waitForFunction(()=>window.MiniGolf);
 assert.equal(await page.evaluate(()=>MiniGolf.getState().game.aim),85,'direct aim survives reload');
 await page.locator('#previousLevel').click();assert.equal(await page.evaluate(()=>MiniGolf.getState().settings.level),2);
 await page.locator('#nextLevel').click();assert.equal(await page.evaluate(()=>MiniGolf.getState().settings.level),5);
 assert.equal(await page.evaluate(()=>MiniGolf.getState().game.aim),85,'level navigation keeps its aim');
 await page.locator('#explorerLevels').click();await page.locator('#levelCard12').click();
 assert.equal(await page.evaluate(()=>MiniGolf.getState().settings.level),12);
 assert(await page.locator('#nextLevel').isDisabled());
 assert.equal(await page.locator('html').getAttribute('dir'),'ltr');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
};
module.exports.touch=async function touchControls(page,context){
 await page.locator('#courseArt').scrollIntoViewIfNeeded();
 const points=await page.evaluate(()=>{const svg=document.getElementById('courseSvg'),p=MiniGolf.getState().state.position;return[[p.x,p.y-9],[p.x-14,p.y]].map(([x,y])=>{const a=svg.createSVGPoint();a.x=x*3;a.y=y*3;const b=a.matrixTransform(svg.getScreenCTM());return{x:b.x,y:b.y};});});
 const client=await context.newCDPSession(page);
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...points[0],id:1}]});
 await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...points[1],id:1}]});
 await client.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
 assert.equal(await page.evaluate(()=>MiniGolf.getState().game.aim),-90,'native touch rotates the club');
 assert.equal(await page.evaluate(()=>MiniGolf.getState().state.shots),0);
 // A cancelled gesture restores the previous aim and never writes a shot.
 await client.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{...points[0],id:1}]});
 await client.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{...points[1],x:points[1].x+30,id:1}]});
 await client.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});
 assert.equal(await page.evaluate(()=>MiniGolf.getState().game.aim),-90);
 await client.detach();
};
