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
test('old Android touch opens a complete persistent window inside school',async t=>{
 const {page,errors,vendor}=await setup(t,true);await touch(page,'touchstart',30,30);await touch(page,'touchend',35,32);
 await page.locator('#reelsWorkspaceFrame').waitFor({state:'visible'});assert.match(page.url(),/test.html$/);assert.equal(vendor(),0);
 const window=page.locator('.reels-workspace-main'),header=window.locator('.wb-header'),frame=page.locator('#reelsWorkspaceFrame');
 assert.equal(await header.locator('#reelsWorkspaceToolsToggle').count(),1,'tools live beside window controls');
 const bodyRect=await window.locator('.wb-body').boundingBox(),frameRect=await frame.boundingBox();assert(Math.abs(bodyRect.y-frameRect.y)<1);assert(Math.abs(bodyRect.height-frameRect.height)<2,'no second toolbar row');
 const source=await frame.getAttribute('src');await header.getByRole('button',{name:'تصغير',exact:true}).click();assert.equal(await window.isVisible(),false);await page.click('#reelsWorkspaceDock');assert.equal(await window.isVisible(),true);assert.equal(await frame.getAttribute('src'),source,'minimize retains the iframe');
 await header.getByRole('button',{name:'تكبير / استعادة',exact:true}).click();assert.equal((await window.boundingBox()).width,800);await header.getByRole('button',{name:'تكبير / استعادة',exact:true}).click();assert((await window.boundingBox()).width<800);
 const before=await window.boundingBox(),title=await header.locator('.wb-drag').boundingBox();await page.mouse.move(title.x+15,title.y+15);await page.mouse.down();await page.mouse.move(title.x-35,title.y+45);await page.mouse.up();const moved=await window.boundingBox();assert(moved.x<before.x);assert(moved.y>before.y);
 const grip=await window.locator('.reels-window-resize').boundingBox();await page.mouse.move(grip.x+10,grip.y+10);await page.mouse.down();await page.mouse.move(grip.x-40,grip.y-35);await page.mouse.up();assert((await window.boundingBox()).width<moved.width);
 await header.getByRole('button',{name:'ملء الشاشة',exact:true}).click();assert.equal((await window.boundingBox()).height,600);await header.getByRole('button',{name:'ملء الشاشة',exact:true}).click();
 await page.click('#reelsWorkspaceToolsToggle');await page.click('#reelsWorkspaceFilters');await page.waitForFunction(()=>!!document.querySelector('#rwGoal option[value="44"]'));await page.selectOption('#rwGoal','44');await page.click('#rwRestore');await page.waitForFunction(()=>document.getElementById('reelsWorkspaceFrame').src.includes('goals=44'));assert.equal(await frame.isVisible(),true);
 await page.evaluate(()=>{window.APP360_FAMILY_SYNC.canNavigate=()=>true});await header.getByRole('button',{name:'إغلاق',exact:true}).click();assert.equal(await frame.count(),0);assert.deepEqual(errors,[]);
});
test('swiping an old Android card does not launch',async t=>{const {page}=await setup(t,true);await touch(page,'touchstart',10,10);await touch(page,'touchmove',100,10);await touch(page,'touchend',100,10);await page.click('#card');assert.match(page.url(),/test.html$/)});
for(const fail of [false,true])test('modern workspace autoplays with controls collapsed '+(fail?'after vendor failure':''),async t=>{
 const {page,errors}=await setup(t,false,fail);await page.click('#card');await page.locator('#reelsWorkspaceFrame').waitFor({state:'visible'});assert.match(await page.locator('#reelsWorkspaceFrame').getAttribute('src'),/age=4-8/);assert.equal(await page.locator('#reelsWorkspaceTools').isVisible(),false);assert.equal(await page.locator('#rwAge').count(),0);assert.equal(await page.locator('.reels-workspace-main .wb-header #reelsWorkspaceToolsToggle').count(),1);const content=await page.locator('.reels-workspace-main .wb-body').boundingBox(),video=await page.locator('#reelsWorkspaceFrame').boundingBox();assert(Math.abs(content.y-video.y)<1);
 await page.click('#reelsWorkspaceToolsToggle');assert.equal(await page.locator('#reelsWorkspaceTools').isVisible(),true);await page.click('#reelsWorkspaceFilters');await page.waitForFunction(()=>!!document.querySelector('#rwGoal option[value="44"]'));assert.equal(await page.locator('#rwAge').isVisible(),true);assert.deepEqual(errors,[]);
});
