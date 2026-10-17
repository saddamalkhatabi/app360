'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
async function setup(t,legacy=false,failVendor=false,mobile=false){
 const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
 const page=await browser.newPage({viewport:mobile?{width:390,height:700}:{width:800,height:600},hasTouch:true,userAgent:legacy?'Mozilla/5.0 (Linux; Android 4.4.2; DMTAB-NV20A) AppleWebKit/537.36 Chrome/30.0.0.0 Safari/537.36':undefined});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));let vendor=0;
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='yem1.com')return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;min-height:100vh;background:#245;touch-action:none}</style><h1>Test Reels</h1><script>window.hits={click:0,move:0};addEventListener("click",()=>hits.click++);addEventListener("touchmove",e=>{hits.move++;e.preventDefault()},{passive:false})</script>'});
  if(u.pathname.includes('/api/reels/catalog'))return route.fulfill({json:{goals:[{id:44,title:'هدف الاختبار'}],sources:[]}});
  if(u.pathname.includes('/api/'))return route.fulfill({status:401,json:{ok:false}});
  if(u.pathname.includes('/winbox/')){vendor++;if(failVendor)return route.abort()}
  if(u.pathname==='/test.html')return route.fulfill({contentType:'text/html; charset=utf-8',body:'<!doctype html><html><head><meta charset="utf-8"></head><body><a id="card" href="/reels/index.html?age=4-8&role=learner">ريلز</a><script src="/assets/js/family-reels-v1.js"></script><script>window.APP360_FAMILY_SYNC={apps:[],openApp:function(){},canNavigate:function(){return false},getSession:function(){return {role:"none"}}};</script></body></html>'});
  const file=path.join(root,u.pathname);if(!fs.existsSync(file)||fs.statSync(file).isDirectory())return route.fulfill({status:404,body:''});
  return route.fulfill({contentType:file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':'text/html; charset=utf-8',body:fs.readFileSync(file)});
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

async function finger(page,from,to,cancel=false){
 const cdp=await page.context().newCDPSession(page);
 await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[from]});
 for(let i=1;i<=5;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:from.x+(to.x-from.x)*i/5,y:from.y+(to.y-from.y)*i/5}]});
 await cdp.send('Input.dispatchTouchEvent',{type:cancel?'touchCancel':'touchEnd',touchPoints:[]});await cdp.detach();
}
test('legacy small window keeps real iframe taps and swipes after touch resize, drag and cancellation',async t=>{
 const {page,errors}=await setup(t,true);await page.click('#card');const win=page.locator('.reels-workspace-main'),iframe=page.locator('#reelsWorkspaceFrame');await iframe.waitFor();
 const grip=await win.locator('.reels-window-resize').boundingBox();await finger(page,{x:grip.x+16,y:grip.y+16},{x:grip.x-135,y:grip.y-140});assert((await win.boundingBox()).width<500);
 const title=await win.locator('.wb-title').boundingBox();await finger(page,{x:title.x+20,y:title.y+15},{x:title.x-60,y:title.y+25},true);
 const child=iframe.contentFrame(),rect=await iframe.boundingBox();await page.touchscreen.tap(rect.x+rect.width/2,rect.y+rect.height/2);await page.waitForFunction(()=>true);
 assert.equal(await child.locator('body').evaluate(()=>window.hits.click),1,'tap reaches the embedded player');
 for(const delta of [{x:50,y:0},{x:-50,y:0},{x:0,y:50},{x:0,y:-50}]){const center={x:rect.x+rect.width/2,y:rect.y+rect.height/2};await finger(page,center,{x:center.x+delta.x,y:center.y+delta.y})}
 assert((await child.locator('body').evaluate(()=>window.hits.move))>=4,'all swipe directions reach the player');
 assert.equal(await win.locator('.wb-body').evaluate(el=>getComputedStyle(el).pointerEvents),'auto');
 for(const button of await win.locator('.wb-control button').all())assert.match(await button.evaluate(el=>el.style.backgroundImage),/svg/,'every header icon is drawn without a font');
 const left=await win.locator('.reels-window-sw').boundingBox(),before=await win.boundingBox();await finger(page,{x:left.x+16,y:left.y+16},{x:left.x-20,y:left.y-25});assert((await win.boundingBox()).width>before.width);
 assert.deepEqual(errors,[]);
});
for(const old of [true,false])test('phone restores a movable smaller window '+(old?'compatible':'modern'),async t=>{
 const {page}=await setup(t,old,false,true);await page.click('#card');const win=page.locator('.reels-workspace-main');await win.waitFor();assert.equal((await win.boundingBox()).width,390);
 await win.getByRole('button',{name:'تكبير / استعادة',exact:true}).click();assert((await win.boundingBox()).width<390);
 const rect=await win.boundingBox(),title=await win.locator('.wb-title').boundingBox();await finger(page,{x:title.x+15,y:title.y+15},{x:title.x-15,y:title.y+45});assert((await win.boundingBox()).y>rect.y);
});
