/* Full shared chrome regression: no shell/style stubs. */
const {chromium}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../..'),dir='apps/1-4/my-little-routine/';
const server=http.createServer((q,r)=>{const f=path.resolve(root,'.'+q.url.split('?')[0]);if(!f.startsWith(root+'/'))return r.writeHead(403).end();fs.readFile(f,(e,b)=>{if(e)return r.writeHead(404).end();r.setHeader('Content-Type',({'.js':'text/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.mp3':'audio/mpeg'})[path.extname(f)]||'application/octet-stream');r.end(b)})});
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({headless:true,executablePath:process.env.APP360_TEST_CHROMIUM,args:['--no-sandbox']});try{
 for(const spec of [{width:390,height:844,age:'1-4'},{width:360,height:800,age:'4-8'},{width:800,height:1280,age:'1-4',legacy:true}]){
 const ctx=await browser.newContext({viewport:spec,hasTouch:true,serviceWorkers:'block',userAgent:spec.legacy?'Mozilla/5.0 (Linux; Android 4.4.2; DMTAB-NV20A) AppleWebKit/537.36 Chrome/30.0.0.0 Safari/537.36':undefined}),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.fulfill({status:404,body:''}));
 await p.goto('http://127.0.0.1:'+server.address().port+'/'+dir+'index.html?launch_age='+spec.age);await p.waitForSelector('#routineCoachLaunch');await p.waitForTimeout(1800);
 const layout=await p.evaluate(()=>{const top=document.querySelector('header.top'),home=document.querySelector('header.top .home'),tools=document.querySelector('.topTools'),brand=document.querySelector('.brand');return{header:top.getBoundingClientRect().toJSON(),tools:tools.getBoundingClientRect().toJSON(),brand:brand.getBoundingClientRect().toJSON(),home:getComputedStyle(home).display,overflow:document.documentElement.scrollWidth>innerWidth}});
 assert(!layout.overflow);if(spec.width<760){assert(layout.header.height<250,JSON.stringify(layout));assert(layout.tools.top>=layout.brand.bottom-1,'tools get their own row without squeezing the title')}
 // The common runtime can inject its home button after this app has loaded.
 await p.evaluate(()=>{if(!document.getElementById('app360HomeBtn')){const b=document.createElement('button');b.id='app360HomeBtn';b.textContent='الرئيسية';document.body.appendChild(b)}});
 assert(await p.locator('#app360HomeBtn').isHidden());assert(await p.locator('header.top .home').isVisible());await p.screenshot({path:'/tmp/routine-mobile-full-'+spec.width+'.png'});
 await p.locator('#routineCoachLaunch').tap();assert(await p.locator('#routineCoachAuto').isChecked());await p.locator('#routineCoachFresh').tap();await p.waitForTimeout(500);
 const opacity=await p.locator('#sceneStrip').evaluate(el=>{let product=1;for(let e=el;e;e=e.parentElement)product*=Number(getComputedStyle(e).opacity);return product});assert.equal(opacity,1,'full shared chrome never dims the picture');assert(!(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));assert(await p.locator('#app360HomeBtn').isHidden());await p.screenshot({path:'/tmp/routine-mobile-full-coach-'+spec.width+'.png'});
 assert.deepEqual(errors,[]);console.log('PASS full shared header',spec.width,spec.age,'header height',layout.header.height,'clear images, one home entry, default auto');await ctx.close();
 }
 }finally{await browser.close();server.close()}})().catch(e=>{console.error(e);server.close();process.exitCode=1});
