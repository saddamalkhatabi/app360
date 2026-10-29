'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'../../../..'),out=process.env.APP360_BALLOON_SCREENSHOTS||path.join(require('os').tmpdir(),'balloon-coach-results');
fs.mkdirSync(out,{recursive:true});let slow=false;
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.json':'application/json','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{const u=new URL(req.url,'http://localhost');if(/^\/(api|auth)\//.test(u.pathname)){res.setHeader('Content-Type','application/json');return res.end('{"authenticated":false,"ok":true}');}const p=path.resolve(root,'.'+u.pathname);if(!p.startsWith(root+path.sep)||!fs.existsSync(p)||!fs.statSync(p).isFile()){res.writeHead(404);return res.end();}function send(){if(res.destroyed)return;res.setHeader('Content-Type',types[path.extname(p)]||'application/octet-stream');fs.createReadStream(p).pipe(res);}if(slow&&p.endsWith('.jpg'))setTimeout(send,2300);else send();});
const state=p=>p.evaluate(()=>BalloonGarden.getState());
(async()=>{await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port,url=base+'/apps/1-4/balloon-garden/index.html',browser=await chromium.launch({headless:true,executablePath:process.env.APP360_TEST_CHROMIUM||undefined}),results=[];
try{
 for(const age of ['1-4','4-8'])for(const width of [390,1024]){
  const c=await browser.newContext({viewport:{width,height:844},serviceWorkers:'block'}),p=await c.newPage(),errors=[],requests=[];
  p.on('pageerror',e=>errors.push(e.message));p.on('request',r=>requests.push(r.url()));
  await c.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());
  await p.addInitScript(()=>{Math.random=()=>.000001;window.__long=[];new PerformanceObserver(l=>__long.push(...l.getEntries().map(x=>x.duration))).observe({type:'longtask',buffered:true});});
  await p.goto(url+'?launch_age='+age);await p.waitForFunction(()=>window.BalloonGarden);await p.waitForTimeout(1100);
  assert(!requests.some(x=>/\/learning(?:\/|\.js)|peerjs|\.mp3(?:\?|$)/i.test(x)),'startup loads neither vocabulary recordings, sentence library nor PeerJS');
  const startup=await p.evaluate(()=>({bytes:performance.getEntriesByType('resource').reduce((n,x)=>n+x.decodedBodySize,0),longTasks:__long}));
  await p.locator('#soundBtn').click();await p.locator('#topicSelect').selectOption('words');slow=true;
  await p.locator('.balloon').first().click();await p.waitForTimeout(1500);assert.equal(await p.locator('.discovery-burst').count(),1,'slow images outlive the old 1.2 second cutoff');
  await p.waitForFunction(()=>{const n=document.querySelector('.discovery-burst.is-ready img');return n&&n.complete&&n.naturalWidth>0;});
  assert.equal(await p.locator('.discovery-burst img').getAttribute('src'),await p.locator('#discoveryArt img').getAttribute('src'));
  assert(await p.locator('.discovery-burst img').isVisible());slow=false;
  if(age==='4-8')assert(requests.some(x=>/\/learning\/[0-9a-f]\.js/.test(x)),'only the selected word bucket is fetched');
  await p.screenshot({path:path.join(out,'slow-reveal-'+age+'-'+width+'.png'),fullPage:true});
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
  // Keep real DOM, cancellation and timers; shorten only the quiet coach interval.
  await p.evaluate(()=>{const native=window.setTimeout;window.setTimeout=function(fn,ms){return native(fn,ms===2400?30:ms);};});
  await p.locator('#coachBtn').click();assert.equal((await state(p)).round.pops,0);
  for(let i=0;i<(age==='1-4'?12:18);i++){
   await p.locator('.balloon:not([disabled])').first().click();await p.waitForFunction(()=>!BalloonGarden.getState().coachBusy);
  }
  assert.equal((await state(p)).settings.stage,1);assert.equal((await state(p)).round.pops,0);
  await p.reload();await p.waitForFunction(()=>window.BalloonGarden);assert((await state(p)).settings.coach);assert.equal((await state(p)).settings.stage,1);
  await p.locator('#coachBtn').click();await p.locator('[data-stage="0"]').click();assert.equal((await state(p)).round.pops,1,'free play stays independent');
  assert.deepEqual(errors,[]);results.push({age,width,startup,slowImage:true,automaticRoute:true});await c.close();
 }
 fs.writeFileSync(path.join(out,'coach-browser-results.json'),JSON.stringify(results,null,2));console.log(JSON.stringify({layouts:results.length,slowImages:true,lazySentences:true,noStartupPeerJS:true,automaticRoutes:true}));
}finally{await browser.close();server.close();}})().catch(e=>{console.error(e);server.close();process.exitCode=1;});
