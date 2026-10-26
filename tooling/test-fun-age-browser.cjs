'use strict';
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path'),http=require('http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),catalog=require('../data/catalog.json'),output=process.env.APP360_AGE_SCREENSHOTS||'/tmp/fun-age-screenshots';
const acorn=require('acorn');for(const file of ['assets/js/fun-age-experience-v1.js','assets/js/home-showcase-v31.js','assets/js/family-reels-v1.js'])acorn.parse(fs.readFileSync(path.join(root,file),'utf8'),{ecmaVersion:5});
const names={'balloon-garden':'BalloonGarden','tic-tac-toe':'TicTacToe','lines-and-houses':'LinesHouses','wonder-machine':'WonderMachine','fun-bowling':'FunBowling','mini-golf':'MiniGolf','little-car-race':'LittleRace','toy-city-crane':'ToyCrane'};
const types={'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'};
fs.mkdirSync(output,{recursive:true});
const server=http.createServer((req,res)=>{const url=new URL(req.url,'http://localhost');if(url.pathname.startsWith('/api/')||url.pathname.startsWith('/auth/')){res.writeHead(200,{'Content-Type':'application/json'});return res.end('{"authenticated":false,"ok":true,"session":null}');}const rel=decodeURIComponent(url.pathname).replace(/^\//,'')||'index.html',file=path.resolve(root,rel.endsWith('/')?rel+'index.html':rel);if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);return res.end();}res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'});fs.createReadStream(file).pipe(res);});
async function ready(page,key){await page.waitForFunction(k=>window[k]&&window.APP360_FUN_AGE,key);}
async function noOverflow(page,label){assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),label+' overflows');}
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,browser=await chromium.launch({executablePath:process.env.APP360_TEST_CHROMIUM||undefined,headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});const results=[];try{
for(const app of catalog.apps.filter(a=>a.category==='fun')){
 const name=app.href.split('/')[2],api=names[name],context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true}),page=await context.newPage(),errors=[];
 await context.route('**/*',route=>new URL(route.request().url()).hostname==='127.0.0.1'?route.continue():route.abort());page.on('pageerror',e=>errors.push(e.message));
 const settings=[];
 for(const age of ['1-4','4-8']){
  const href=app.href+(app.href.includes('?')?'&':'?')+'launch_age='+age+'&launch_level='+app.age_entry_levels[age];
  await page.goto(base+'/'+href);await ready(page,api);
  assert.equal(await page.locator('body').getAttribute('data-fun-age'),age);assert.equal(await page.locator('#funAgeBadge').count(),1);
  const before=await page.evaluate(k=>window[k].getState().settings,api);settings.push(before);
  if(before.level)assert.equal(before.level,app.age_entry_levels[age]);
  if(name==='tic-tac-toe')assert.equal(before.mode,age==='1-4'?'coop':'ai');
  if(name==='lines-and-houses')assert.equal(before.size,age==='1-4'?1:2);
  await page.locator('#settingsBtn').click();assert(await page.locator('#funAgeNote').isVisible());
  const level=page.locator('#levelSelect');if(await level.count()){assert.equal(await level.locator('optgroup').count(),2);assert.equal(await level.inputValue(),String(before.level));}
  await page.locator('#languageSelect').selectOption('en');await page.locator('#applySettings').click();await page.waitForFunction(()=>document.documentElement.lang==='en');
  assert((await page.locator('#funAgeBadge').textContent()).includes(age==='4-8'?'Explorer':'Little'));
  for(const [width,height] of [[320,740],[390,844],[844,390],[1440,1000]]){await page.setViewportSize({width,height});await noOverflow(page,name+' '+age+' '+width);if(await page.locator('body[data-fun-home="header"]').count()){const home=await page.locator('#app360HomeBtn').boundingBox();for(const selector of ['#settingsBtn','#soundBtn']){const b=await page.locator(selector).boundingBox();assert(home.x+home.width<=b.x+1||home.x>=b.x+b.width-1||home.y+home.height<=b.y+1||home.y>=b.y+b.height-1,'Home overlaps '+selector+' in '+name+' '+width);}}await page.screenshot({path:path.join(output,name+'-'+age+'-'+width+'.png'),fullPage:true});}
  await page.reload();await ready(page,api);assert.equal(await page.locator('html').getAttribute('lang'),'en');
  if(before.level)assert.equal(await page.evaluate(k=>window[k].getState().settings.level,api),before.level);
 }
 assert.notEqual(settings[0].theme||settings[0].world,settings[1].theme||settings[1].world,name+' needs distinct starting worlds');
 assert.deepEqual(errors,[],name+' browser errors');results.push({app:app.id,ages:2,viewports:4,restore:true});await context.close();
}
const context=await browser.newContext({viewport:{width:390,height:844}}),page=await context.newPage();await context.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
for(const age of ['1-4','4-8']){
 await page.goto(base+'/index.html?age='+age+'&category=fun');await page.waitForFunction(()=>document.getElementById('funCategoryTitle')&&document.getElementById('funCategoryTitle').textContent);
 assert.equal(await page.locator('#showcaseTrack .showcase-card').count(),8);assert((await page.locator('#funCategoryImage').getAttribute('src')).includes('fun-entry-'+age));await page.waitForFunction(()=>document.getElementById('funCategoryImage').naturalWidth>0);await noOverflow(page,'home '+age);
 await page.locator('#funCategoryHeader').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(output,'home-fun-'+age+'.png')});
 const href=await page.locator('#showcaseTrack .showcase-cover-link').first().getAttribute('href');assert(href.includes('launch_age='+age));
}
for(const age of catalog.age_groups.map(a=>a.id)){
 await page.goto(base+'/index.html?age='+age);const card=page.locator('[data-app="reels-learner-'+age+'"]');await card.waitFor();
 await card.locator('img.showcase-cover-img').evaluate(n=>n.loading='eager');await page.waitForFunction(age=>{const n=document.querySelector('[data-app="reels-learner-'+age+'"] img.showcase-cover-img');return n&&n.naturalWidth>0;},age);
 assert((await card.locator('img.showcase-cover-img').getAttribute('src')).includes('reels-age-'+age));
 const coach=page.locator('[data-app="reels-coach-'+age+'"]');assert((await coach.textContent()).includes('للمدرب أو ولي الأمر فقط'));assert(!(await coach.textContent()).includes('للبالغين فقط'));
}
await context.close();fs.writeFileSync(path.join(output,'results.json'),JSON.stringify({games:results,learnerCovers:8,coachRoleLabels:8},null,2));console.log(JSON.stringify({games:results.length,ageLaunches:16,gameLayouts:64,learnerCovers:8,coachRoleLabels:8,restoredAfterReload:true}));
}finally{await browser.close();await new Promise(r=>server.close(r));}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
