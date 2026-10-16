'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const executablePath=process.env.CHROMIUM_PATH;
async function setup(t,legacy=false,failVendor=false){
 const browser=await chromium.launch({headless:true,...(executablePath?{executablePath}:{})});t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:800,height:600},userAgent:legacy?'Mozilla/5.0 (Linux; Android 4.4.2; DMTAB-NV20A) AppleWebKit/537.36 Chrome/30.0.0.0 Safari/537.36':undefined});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));let vendor=0,watches=0;
 await page.route('**/*',async route=>{
  const u=new URL(route.request().url());
  if(u.hostname==='yem1.com'){watches++;return route.fulfill({contentType:'text/html',body:'<h1>Test Reels</h1>'})}
  if(u.pathname.includes('/api/reels/catalog'))return route.fulfill({json:{goals:[{id:44,title:'هدف الاختبار'}],sources:[]}});
  if(u.pathname.includes('/winbox/')){vendor++;if(failVendor)return route.abort()}
  if(u.pathname==='/test.html')return route.fulfill({contentType:'text/html',body:'<!doctype html><html><body><script src="/assets/js/family-reels-v1.js"></script></body></html>'});
  const file=path.join(root,u.pathname);if(!fs.existsSync(file))return route.fulfill({status:404,body:''});
  return route.fulfill({contentType:file.endsWith('.js')?'text/javascript':'text/html',body:fs.readFileSync(file)});
 });
 await page.goto('http://school.test/test.html');await page.waitForFunction(()=>!!window.APP360_REELS_WORKSPACE);
 return {page,errors,vendor:()=>vendor,watches:()=>watches};
}
for(const legacy of [true,false])test(`launch, settings, playback and presets (${legacy?'KitKat adapter':'WinBox'})`,async t=>{
 const {page,errors,vendor,watches}=await setup(t,legacy);
 await page.evaluate(()=>window.APP360_REELS_WORKSPACE.open({age:'4-8',role:'learner'}));
 await page.locator('#reelsWorkspacePlay').waitFor({state:'visible'});
 assert.equal(await page.locator('#rwAge').count(),0,'settings must not open on launch');assert.equal(watches(),0,'video waits for direct-play button');if(legacy)assert.equal(vendor(),0);
 await page.click('#reelsWorkspacePreset');await page.selectOption('#rwLang','en');await page.waitForFunction(()=>document.querySelector('#rwGoal option[value="44"]'));await page.selectOption('#rwGoal','44');
 await page.click('#rwRestore');await page.waitForFunction(()=>document.getElementById('reelsWorkspaceFrame').src.includes('goals=44'));
 const url=await page.locator('#reelsWorkspaceFrame').getAttribute('src');assert.match(url,/lang=en/);assert.match(url,/age=4-8/);assert.equal(await page.locator('#rwAge').isVisible(),false);
 await page.evaluate(()=>{window.APP360_REELS_WORKSPACE.close();window.APP360_REELS_WORKSPACE.open({age:'4-8',role:'learner'})});await page.locator('#reelsWorkspacePlay').waitFor({state:'visible'});await page.click('#reelsWorkspacePlay');assert.match(await page.locator('#reelsWorkspaceFrame').getAttribute('src'),/goals=44/);
 await page.evaluate(()=>{window.APP360_REELS_WORKSPACE.close();window.APP360_REELS_WORKSPACE.open({age:'1-4',role:'learner'})});await page.locator('#reelsWorkspacePlay').waitFor({state:'visible'});await page.click('#reelsWorkspacePlay');assert.doesNotMatch(await page.locator('#reelsWorkspaceFrame').getAttribute('src'),/goals=44/);
 assert.deepEqual(errors,[]);
});
test('vendor network failure opens compatibility window instead of a dead click',async t=>{const {page,errors}=await setup(t,false,true);await page.evaluate(()=>window.APP360_REELS_WORKSPACE.open({age:'1-4',role:'learner'}));await page.locator('.reels-simple #reelsWorkspacePlay').waitFor({state:'visible'});await page.click('#reelsWorkspacePlay');assert.match(await page.locator('#reelsWorkspaceFrame').getAttribute('src'),/yem1.com\/watch/);assert.deepEqual(errors,[])});
test('family role restriction is checked before opening',async t=>{const {page}=await setup(t,true);const result=await page.evaluate(()=>{window.APP360_FAMILY_SYNC={getSession:()=>({role:'guest'}),getPolicy:()=>({mode:'locked',selected:'reels-learner-1-4'})};return window.APP360_REELS_WORKSPACE.open({age:'4-8',role:'coach'})});assert.equal(result,false);assert.equal(await page.locator('#reelsWorkspacePlay').count(),0)});
