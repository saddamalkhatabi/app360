/* Browser e2e smoke test. Assertions are functional, not an image-quality certificate. */
const {chromium}=require('playwright');
const fs=require('fs');
(async()=>{
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 const page=await browser.newPage({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});
 const errors=[],clips=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(/\.mp3(?:\?|$)/.test(r.url()))clips.push(r.url())});
 const base='http://127.0.0.1:8765/apps/1-4/calm-with-me/index.html';
 await page.goto(base,{waitUntil:'domcontentloaded',timeout:90000});
 await page.waitForSelector('#simpleCalmHome [data-calm-kind="feelings"]',{timeout:35000});
 await page.waitForTimeout(1100); // wait for late async family/profile initialization before touching UI
 const root=page.locator('#simpleCalmHome');
 const expectedPhotoIds=['happy','sad','afraid','angry'];
 await page.waitForFunction(()=>Array.from(document.querySelectorAll('#simpleCalmHome [data-calm-kind="feelings"] img')).length===4 && Array.from(document.querySelectorAll('#simpleCalmHome [data-calm-kind="feelings"] img')).every(x=>x.complete&&x.naturalWidth>0),{timeout:12000});
 for(const id of expectedPhotoIds){
   const img=page.locator('#simpleCalmHome [data-calm-kind="feelings"][data-calm-id="'+id+'"] img');
   const attrs=await img.evaluate(n=>({source:n.getAttribute('src'),actual:n.currentSrc,srcset:n.getAttribute('srcset'),width:n.naturalWidth}));
   if(!attrs.source.endsWith('/'+id+'-512.webp')||!attrs.srcset||attrs.actual.indexOf('.webp')<0||attrs.width<100)
     throw Error('photo not connected for '+id+': '+JSON.stringify(attrs));
 }
 await page.screenshot({path:'/tmp/calm-child-real-emotions-mobile.png',fullPage:true});

 const must=async(cond,msg)=>{if(!cond)throw Error(msg)};
 await must(!(await page.locator('body').evaluate(el=>el.classList.contains('calm-advanced'))),'must start in child mode');
 await must((await page.locator('#simpleCalmHome .calm-kid-card').count())===4,'default feelings must be four');
 await must((await page.locator('.simple-game-panel:visible').count())===0,'game panel leaked');
 await must(!(await page.locator('#app360SafetyShortcuts').isVisible()),'adult fear content leaked into child mode');
 console.log('header children',await page.locator('.head-main').evaluate(n=>Array.from(n.querySelectorAll('button,span')).map(b=>({id:b.id,cl:b.className,txt:b.textContent.slice(0,38)})).filter(x=>x.txt.indexOf('مدرب')>=0||x.txt.indexOf('المدرب')>=0)));
 console.log('visible fixed controls',await page.evaluate(()=>Array.from(document.querySelectorAll('button')).filter(b=>{const css=getComputedStyle(b),box=b.getBoundingClientRect();return box.width>0&&box.height>0&&css.position==='fixed'}).map(b=>({id:b.id,cl:b.className,text:b.textContent.slice(0,50)}))));
 // All three critical need pictures must be images of the actual requested action.
 await page.locator('#simpleCalmHome [data-calm-tab="signals"]').click();
 const needCards=await page.locator('#simpleCalmHome [data-calm-kind="signals"] img').evaluateAll(images=>images.map(img=>({id:img.getAttribute('data-calm-photo'),src:img.getAttribute('src'),srcset:img.getAttribute('srcset')})));
 console.log('need card IDs',needCards.map(x=>x.id));
 for (const id of ['need-help','water-now','quiet']) {
   const card=needCards.find(x=>x.id===id);
   await must(card&&card.src.endsWith('/'+id+'-512.webp')&&card.srcset&&card.srcset.includes('-320.webp'),
     'Critical need card is missing/photo unmapped '+id+': '+JSON.stringify(needCards));
   const result=await page.evaluate(async data=>{
     const image=new Image();
     image.src=data.src;
     try{await image.decode();return {width:image.naturalWidth,src:image.src}}
     catch(e){return {width:0,error:String(e),src:image.src}}
   },card);
   await must(result.width>=320 && result.src.includes('/what-to-try/'),
     'Critical need WebP failed to decode: '+id+': '+JSON.stringify(result));
 }
 await page.screenshot({path:'/tmp/calm-child-needs-new-photos-mobile.png',fullPage:true});
 await page.locator('#simpleCalmHome [data-calm-tab="feelings"]').click();

 // Wording-only change: retain the recorded happy-voice file and avoid engine branding.
 await must((await page.locator('#simpleCalmHome [data-calm-kind="feelings"][data-calm-id="happy"] b').textContent()).trim()==='سعيد',
   'Child happy card must display سعيد');
 await must((await page.locator('#calmBilingualAudioButton').textContent()).includes('الصوت المسجل'),
   'Recorded-audio toggle must use neutral user-facing wording');
 await must(!(await page.locator('body').innerText()).includes('SILMA'),
   'Audio engine name must not appear anywhere in the visible interface');
 const first=page.locator('[data-calm-kind="feelings"][data-calm-id="happy"]');
 await first.click(); await page.waitForTimeout(350);
 if(await page.locator('#simpleCalmHome .chosen').count()!==1){console.log('Rechecking early boot selection',await page.locator('#simpleCalmHome').getAttribute('data-child-step'));await first.click();await page.waitForTimeout(300)}
 await must(await page.locator('#simpleCalmHome .chosen').count()===1,'feeling selection');
 await must(clips.some(x=>/\/audio\/silma\/feelings\/happy\.mp3(?:\?|$)/.test(x)),
   'The previously recorded Arabic happy MP3 must remain unchanged and be requested');

 await page.locator('[data-calm-action="next"]').click();
 await must(await root.getAttribute('data-child-step')==='2','step 2 does not open');
 await must((await page.locator('#simpleCalmHome [data-calm-kind="helps"]').count())<=4,'too many help cards');
 const helpCards=await page.locator('#simpleCalmHome [data-calm-kind="helps"] img').evaluateAll(nodes=>nodes.map(n=>({id:n.getAttribute('data-calm-photo'),src:n.getAttribute('src'),srcset:n.getAttribute('srcset')})));
 console.log('Verified focused help image count',helpCards.length);
 await must(helpCards.length>=3&&helpCards.length<=4,'expected three to four focused help options: '+JSON.stringify(helpCards));
 await must(helpCards.every(x=>x.src.indexOf('/what-to-try/')>0&&x.srcset&&x.srcset.indexOf('-320.webp')>0),'Help cards not connected to uploaded WebP images: '+JSON.stringify(helpCards));
 for(let i=0;i<helpCards.length;i++){
  let img=page.locator('#simpleCalmHome [data-calm-kind="helps"] img').nth(i);
  await img.scrollIntoViewIfNeeded();
  await img.evaluate(el=>el.decode?el.decode().catch(()=>{}):Promise.resolve());
  const info=await img.evaluate(el=>({src:el.currentSrc,width:el.naturalWidth}));
  await must(info.width>=120&&info.src.includes('/what-to-try/'),'Actual help image failed to render: '+JSON.stringify(info));
 }
 
 await page.screenshot({path:'/tmp/calm-child-help-mobile.png',fullPage:true});
 await page.locator('#simpleCalmHome [data-calm-kind="helps"]').first().click();
 await page.locator('#simpleCalmHome [data-calm-action="next"]').click();
 await must(await root.getAttribute('data-child-step')==='3','step 3 does not open');
 await must((await page.locator('.calm-sequence-cell img').count())===2,'now-then pictures must both be present');
 const nextBook=page.locator('#simpleCalmHome [data-calm-kind="transitions"][data-calm-id="book"] img');
 await must((await nextBook.getAttribute('src')).includes('read_story_with_mom-512.webp'),'Reading transition photo missing');
 const nextWater=page.locator('#simpleCalmHome [data-calm-kind="transitions"][data-calm-id="water"] img');
 await must((await nextWater.getAttribute('src')).includes('drink_water_child-512.webp'),'Water transition photo missing');
 
 const transitionCards=await page.locator('#simpleCalmHome [data-calm-kind="transitions"] img')
   .evaluateAll(images=>images.map(img=>({id:img.getAttribute('data-calm-photo'),src:img.getAttribute('src'),srcset:img.getAttribute('srcset')})));
 for (const id of ['ball','wait']) {
   const card=transitionCards.find(x=>x.id===id);
   await must(card&&card.src.endsWith('/'+id+'-512.webp')&&card.srcset&&card.srcset.includes('-320.webp'),
     'Missing true-action now-then picture '+id+': '+JSON.stringify(transitionCards));
   const info=await page.evaluate(async item=>{
     const image=new Image();image.src=item.src;
     try{await image.decode();return {width:image.naturalWidth,src:image.src}}
     catch(e){return {width:0,error:String(e)}}
   },card);
   await must(info.width>=320,'Now-then photo did not decode '+id+': '+JSON.stringify(info));
 }
 await page.screenshot({path:'/tmp/calm-child-now-then-mobile.png',fullPage:true});
 await page.locator('#calmCoachBtn').click();
 await must(await page.locator('body').evaluate(el=>el.classList.contains('calm-advanced')),'coach mode did not activate');
 await must((await page.locator('#calmCoachLinks').count())===1,'coach links missing');
 await page.locator('#calmChildBtn').click();
 await must(!(await page.locator('body').evaluate(el=>el.classList.contains('calm-advanced'))),'failed return to child mode');
 await must(await root.getAttribute('data-child-step')==='1','child mode did not reset');
 await must(clips.some(x=>x.indexOf('coach-ar.mp3')>=0),'coach prerecorded mp3 not requested');
 await page.locator('#calmBilingualAudioButton').click();
 await page.waitForFunction(()=>document.querySelector('#simpleCalmHome h2')&&document.querySelector('#simpleCalmHome h2').textContent==='How do I feel?',{timeout:5000}).catch(()=>{});
 await must(await page.locator('#simpleCalmHome h2').first().textContent()==='How do I feel?','English child interface not translated: '+await page.evaluate(()=>({lang:window.APP360CalmVoice&&APP360CalmVoice.getLanguage(),heading:document.querySelector('#simpleCalmHome h2')&&document.querySelector('#simpleCalmHome h2').textContent})));
 await page.locator('#calmCoachBtn').click();
 await page.waitForTimeout(550);
 await must(clips.some(x=>x.indexOf('coach-en.mp3')>=0),'English coach prerecorded MP3 not requested');
 await page.locator('#calmChildBtn').click();
 await page.locator('#calmBilingualAudioButton').click();
 await must(await page.locator('#simpleCalmHome h2').first().textContent()==='كيف أشعر؟','Arabic child text did not refresh synchronously');
 const broken=await page.locator('#simpleCalmHome img').evaluateAll(img=>img.filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src));
 await must(broken.length===0,'missing visible images: '+broken.join(','));
 await page.screenshot({path:'/tmp/calm-child-home-mobile.png',fullPage:true});
 const tablet=await browser.newPage({viewport:{width:1024,height:768},hasTouch:true});
 await tablet.goto(base,{waitUntil:'domcontentloaded',timeout:90000});await tablet.waitForSelector('#simpleCalmHome .calm-kid-card');
 await tablet.screenshot({path:'/tmp/calm-child-home-tablet.png',fullPage:true});
 await browser.close();
 await must(errors.length===0,'uncaught runtime errors: '+errors.join('; '));
 console.log('PASS browser: child stages, touch selection, prerecorded coach audio, trainer isolation, return, images');
})().catch(err=>{console.error(err.stack||err);process.exit(1)});
