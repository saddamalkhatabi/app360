const assert=require('node:assert/strict');
module.exports=async function(page,type,id){
const g=await page.evaluate(id=>CreativeGames.games().find(x=>x.id==='L-'+id),id);
if(type==='choice'||type==='pattern')await page.locator('[data-choice="'+g.answer+'"]').click();
if(type==='mark'){for(const b of await page.locator('.mark-option[data-correct="1"]').all())await b.click();await page.locator('#checkMarks').click()}
if(type==='match'){for(let i=0;i<g.pairs.length;i++){await page.locator('[data-side="a"][data-pair="'+i+'"]').click();await page.locator('[data-side="b"][data-pair="'+i+'"]').click()}}
if(type==='sort'){for(const b of await page.locator('.sort-item').all()){const target=await b.getAttribute('data-target');await b.click();await page.locator('[data-bin="'+target+'"]').click()}}
if(type==='order'){for(const value of g.order){const buttons=await page.locator('[data-order]').all();for(const b of buttons)if(await b.getAttribute('data-value')===value){await b.click();break}}}
if(type==='memory'){for(let i=0;i<g.cards.length;i++){const pair=page.locator('.memory-card[data-pair="'+i+'"]');await pair.nth(0).click();await pair.nth(1).click();await page.waitForTimeout(380)}}
if(type==='puzzle'){for(let i=0;i<g.symbols.length;i++){await page.locator('[data-piece="'+i+'"]').click();await page.locator('[data-slot="'+i+'"]').click()}}
if(type==='dots'||type==='path'){await page.locator('#playCanvas').scrollIntoViewIfNeeded();await page.waitForTimeout(100);const b=await page.locator('#playCanvas').boundingBox(),pts=type==='dots'?g.points:g.path,xy=p=>({x:b.x+b.width*(.08+p[0]*.0084),y:b.y+b.height*(.1+(100-p[1])*.008)});let p=xy(pts[0]);await page.mouse.move(p.x,p.y);await page.mouse.down();for(let i=1;i<pts.length;i++){p=xy(pts[i]);await page.mouse.move(p.x,p.y,{steps:20})}await page.mouse.up()}
if(type==='draw'){await page.locator('#playCanvas').scrollIntoViewIfNeeded();await page.waitForTimeout(100);const b=await page.locator('#playCanvas').boundingBox();await page.mouse.move(b.x+b.width*.3,b.y+b.height*.3);await page.mouse.down();await page.mouse.move(b.x+b.width*.7,b.y+b.height*.7,{steps:15});await page.mouse.up();await page.locator('#doneDraw').click()}
if(type==='create'){for(let i=0;i<3;i++)await page.locator('[data-symbol="'+i+'"]').click();await page.locator('#hideCreator').click();await page.locator('#solveCreator').click()}
const state=await page.locator('#roundState').innerText();if(!/اكتملت/.test(state)){await page.screenshot({path:'/tmp/trace-fail.png'});console.log({type,game:g,canvas:await page.locator('#playCanvas').boundingBox(),metrics:await page.evaluate(()=>({a:document.getElementById('scoreAttempts').textContent,p:document.getElementById('scoreProgress').textContent,c:document.getElementById('playCanvas')&&[playCanvas.width,playCanvas.height,devicePixelRatio],scrollY,innerHeight}))})};assert.match(state,/اكتملت/,type+' completes the actual round');
};
