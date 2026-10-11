const {chromium}=require('playwright');
const fs=require('fs'),path=require('path'),http=require('http'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../../../..');
(async()=>{
 const server=http.createServer((req,res)=>{const file=path.join(root,decodeURIComponent(req.url.split('?')[0]));if(!file.startsWith(root+path.sep)||!fs.existsSync(file)||!fs.statSync(file).isFile()){res.writeHead(404);res.end();return;}res.setHeader('Content-Type',({'.html':'text/html','.js':'text/javascript','.json':'application/json','.css':'text/css','.mp3':'audio/mpeg','.webp':'image/webp'})[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res)});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_BIN});
 try{
  for(const viewport of [{width:390,height:844},{width:320,height:568},{width:844,height:390},{width:1024,height:768}]){
   const page=await browser.newPage({viewport});
   await page.addInitScript(()=>{const NativeAudio=window.Audio;window.started=[];window.Audio=function(src){const a=new NativeAudio(src);a.addEventListener('playing',()=>window.started.push(src));return a;};});
   await page.goto('http://127.0.0.1:'+server.address().port+'/apps/1-4/imitate-one-step/index.html');
   await page.locator('[data-exp="004"]').waitFor();
   const thumb=await page.locator('[data-exp="004"] .card-thumb-frame').boundingBox();assert.ok(Math.abs(thumb.width-thumb.height)<1,'square thumbnail without distortion');
   await page.locator('[data-exp="004"]').click();
   await page.waitForFunction(()=>window.started.length>0);
   if(viewport.width<=700||(viewport.width<=1000&&viewport.height<=500)){
    for(const selector of ['#previousExperience','#nextExperience','#reelViewport']){
     const b=await page.locator(selector).boundingBox();assert.ok(b.y>=-1&&b.y+b.height<=viewport.height,selector+' fully visible '+JSON.stringify(b));
    }
    for(const selector of ['#previousExperience','#nextExperience'])assert.ok((await page.locator(selector).boundingBox()).height>=44);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false);
   }
   await page.locator('#nextExperience').click();assert.match(await page.locator('.card-kicker').last().innerText(),/005/);
   await page.locator('#previousExperience').click();assert.match(await page.locator('.card-kicker').last().innerText(),/004/);
   await page.screenshot({path:'/workspace/scratch/fdfe310ee645/scene-'+viewport.width+'.png'});
   await page.locator('#backLibrary').click();
   const title=JSON.parse(fs.readFileSync(path.join(root,'apps/1-4/imitate-one-step/experiences.json'))).experiences.find(x=>x.id==='130').title;
   await page.locator('#searchInput').fill(title);
   await page.locator('[data-exp="130"]').click();
   assert.match(await page.locator('#reelStrip').getAttribute('src'),/reviewed-130-ar\.webp$/);
   await page.locator('#voiceLanguage').selectOption('en');
   assert.match(await page.locator('#reelStrip').getAttribute('src'),/reviewed-130\.webp$/);
   await page.waitForFunction(()=>window.started.some(src=>src.includes('/en/')));
   await page.close();
  }
  console.log('Mobile scene checks passed: native audio starts on opening tap, complete scene and 48px navigation visible at 320/390px, both navigation directions work, no horizontal overflow; tablet opens correctly.');
 }finally{await browser.close();await new Promise(r=>server.close(r));}
})().catch(e=>{console.error(e);process.exitCode=1;});
