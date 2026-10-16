'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function setup(t,legacy=false,failVendor=false){
 const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:800,height:600},userAgent:legacy?'Mozilla/5.0 (Linux; Android 4.4.2; DMTAB-NV20A) AppleWebKit/537.36 Chrome/30.0.0.0 Safari/537.36':undefined});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));let vendor=0;
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='yem1.com')return route.fulfill({contentType:'text/html',body:'<!doctype html><h1>Test Reels</h1>'});
  if(u.pathname.includes('/api/reels/catalog'))return route.fulfill({json:{goals:[{id:44,title:'هدف الاختبار'}],sources:[]}});
  if(u.pathname.includes('/api/'))return route.fulfill({status:401,json:{ok:false}});
  if(u.pathname.includes('/winbox/')){vendor++;if(failVendor)return route.abort()}
  if(u.pathname==='/test.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><a id="card" href="/reels/index.html?age=4-8&role=learner">ريلز</a><script src="/assets/js/family-reels-v1.js"></script><script>window.APP360_FAMILY_SYNC={apps:[],openApp:function(){},canNavigate:function(){return false},getSession:function(){return {role:"none"}}};</script></body></html>'});
  const file=path.join(root,u.pathname);if(!fs.existsSync(file)||fs.statSync(file).isDirectory())return route.fulfill({status:404,body:''});
  return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':'text/html',body:fs.readFileSync(file)});
 });
 await page.goto('http://school.test/test.html');await page.waitForFunction(()=>!!window.APP360_REELS_WORKSPACE);
 return {page,errors,vendor:()=>vendor};
}
async function touch(page,type,x,y){await page.locator('#card').evaluate((target,args)=>{const point=new Touch({identifier:1,target,clientX:args.x,clientY:args.y});target.dispatchEvent(new TouchEvent(args.type,{bubbles:true,cancelable:true,touches:args.type==='touchend'?[]:[point],changedTouches:[point]}))},{type,x,y})}
test('old Android touchend opens native page with no registered family apps',async t=>{
 const {page,errors,vendor}=await setup(t,true);
 await touch(page,'touchstart',30,30);
 await touch(page,'touchend',35,32);
 await page.waitForURL(/reels\/index.html.*legacy=1/);await page.locator('#reelsFrame').waitFor();
 await page.waitForFunction(()=>document.getElementById('reelsFrame').src.includes('yem1.com/watch'));
 assert.equal(await page.locator('#reelsTopTools').isVisible(),false);assert.equal(await page.locator('#reelsIntro').isVisible(),false);assert.equal(vendor(),0);
 const before=await page.locator('#reelsFrame').getAttribute('src');await page.click('#reelsToolsToggle');await page.click('#reelsQuickSettings');assert.equal(await page.locator('#reelsIntro').isVisible(),true);assert.equal(await page.locator('#reelsFrame').getAttribute('src'),before);
 await page.selectOption('#reelsGoal','44');await page.click('#reelsOpen');assert.match(await page.locator('#reelsFrame').getAttribute('src'),/goals=44/);assert.equal(await page.locator('#reelsIntro').isVisible(),false);assert.deepEqual(errors,[]);
});
test('swiping an old Android card does not launch',async t=>{const {page}=await setup(t,true);await touch(page,'touchstart',10,10);await touch(page,'touchmove',100,10);await touch(page,'touchend',100,10);await page.click('#card');assert.match(page.url(),/test.html$/)});
for(const fail of [false,true])test('modern workspace autoplays with controls collapsed '+(fail?'after vendor failure':''),async t=>{
 const {page,errors}=await setup(t,false,fail);await page.click('#card');await page.locator('#reelsWorkspaceFrame').waitFor({state:'visible'});assert.match(await page.locator('#reelsWorkspaceFrame').getAttribute('src'),/age=4-8/);assert.equal(await page.locator('#reelsWorkspaceTools').isVisible(),false);assert.equal(await page.locator('#rwAge').count(),0);
 await page.click('#reelsWorkspaceToolsToggle');assert.equal(await page.locator('#reelsWorkspaceTools').isVisible(),true);await page.click('#reelsWorkspaceFilters');await page.waitForFunction(()=>!!document.querySelector('#rwGoal option[value="44"]'));assert.equal(await page.locator('#rwAge').isVisible(),true);assert.deepEqual(errors,[]);
});
