/* Optional integration QA: real WebSocket sessions and real MP3 playback.
   Requires Playwright/Chromium, with no new production dependencies. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{createApp360Server}=require('../services/family-relay/src/server.js');
const root=path.resolve(__dirname,'..'),out=process.env.STORY_TEST_OUTPUT||path.join(os.tmpdir(),'app360-reading-focus-qa');
const checks=[],errors=[],contexts=[],appId='a4-story-language';let browser,server,base;
async function test(name,fn){await fn();checks.push(name);console.log('PASS '+name)}
async function rootPage(name){const c=await browser.newContext({serviceWorkers:'block',viewport:{width:412,height:915}});contexts.push(c);const p=await c.newPage();p.on('pageerror',e=>errors.push(name+': '+e.message));await p.goto(base);await p.waitForFunction(()=>window.APP360_FAMILY_SYNC&&APP360_FAMILY_SYNC.apps.some(a=>a.id==='a4-story-language'));await p.locator('#a360GlobalName').fill(name);await p.locator('#a360GlobalAge').selectOption('4-8');await p.locator('[data-prof-save]').click();return p}
async function panel(p){await p.evaluate(()=>APP360_FAMILY_SYNC.open())}
async function closePanel(p){await p.locator('[data-family-close]').click()}
async function join(p,room){await panel(p);await p.locator('#a360FamilyRoom').fill(room);await p.locator('[data-family-join]').click();await p.waitForFunction(()=>APP360_FAMILY_SYNC.getSession().connected);await closePanel(p)}
async function frame(p){await p.evaluate(id=>APP360_FAMILY_SYNC.openApp(id),appId);await p.frameLocator('#app360FamilyShellFrame').locator('#brandTitle').waitFor();const f=p.frames().find(f=>f.url().includes('/story-language-lab/'));assert.ok(f);await f.waitForFunction(()=>window.APP360_STORY&&parent.APP360_FAMILY_SYNC&&parent.APP360_FAMILY_SYNC.getReadingFocus);if(await f.evaluate(()=>APP360_STORY.snapshot().voice_guidance))await f.locator('#voiceBtn').click();return f}
async function focus(p,enabled,scope){await p.waitForFunction(([enabled,scope])=>APP360_FAMILY_SYNC.getReadingFocus()===enabled&&(!scope||APP360_FAMILY_SYNC.getReadingFocusState().scope===scope),[enabled,scope]);const f=p.frames().find(f=>f.url().includes('/story-language-lab/'));if(f)await f.waitForFunction(enabled=>APP360_STORY.reading().enabled===enabled,enabled)}
function card(p,did){return p.locator('[data-person="'+did+'"]')}
async function personal(p,did,value){await panel(p);await card(p,did).locator('[data-person-reading-focus]').selectOption(value)}
async function global(p,value){await panel(p);await p.locator('#a360ReadingFocusAll').setChecked(value)}
async function guide(f){await f.locator('[data-do="guide"][data-value="home"]').click();await f.waitForFunction(()=>APP360_STORY_AUDIO.clock().path==='audio/ar-guide-home.mp3'&&APP360_STORY_AUDIO.clock().state==='playing');return f.evaluate(()=>APP360_STORY_AUDIO.clock())}
(async()=>{
 fs.mkdirSync(out,{recursive:true});server=createApp360Server({root});const address=await server.listen(0,'127.0.0.1');base='http://127.0.0.1:'+address.port+'/';
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROMIUM_EXECUTABLE_PATH||undefined,args:[...JSON.parse(process.env.STORY_BROWSER_ARGS||'[]'),'--no-sandbox','--autoplay-policy=no-user-gesture-required']});
 const owner=await rootPage('المعلم'),one=await rootPage('المتعلم الأول'),two=await rootPage('المتعلم الثاني'),helper=await rootPage('المساعد');
 await panel(owner);await owner.locator('[data-family-create]').click();await owner.waitForFunction(()=>APP360_FAMILY_SYNC.getSession().connected);const room=await owner.evaluate(()=>APP360_FAMILY_SYNC.getSession().room);await closePanel(owner);
 await join(one,room);await join(two,room);await join(helper,room);const did1=await one.evaluate(()=>APP360_FAMILY_SYNC.getDeviceId()),did2=await two.evaluate(()=>APP360_FAMILY_SYNC.getDeviceId()),didHelper=await helper.evaluate(()=>APP360_FAMILY_SYNC.getDeviceId());
 await owner.waitForFunction(()=>Object.keys(APP360_FAMILY_SYNC.getParticipants()).length===3);let f1=await frame(one),f2=await frame(two);
 await test('A group change reaches embedded learners immediately while narration and instruction text continue',async()=>{
  await focus(one,true);await focus(two,true);const before=await guide(f1);await global(owner,false);await focus(one,false,'session');await focus(two,false,'session');
  const after=await f1.evaluate(()=>APP360_STORY_AUDIO.clock());assert.equal(after.path,before.path);assert.equal(after.state,'playing');assert.ok(after.time>=before.time);assert.equal(await f1.locator('.ra-active').count(),0);assert.equal(await f1.evaluate(()=>APP360_STORY.reading().timer),false);assert.ok(await f1.locator('#spokenTextPanel').isVisible());assert.match(await f1.locator('#spokenText').innerText(),/اِخْتَرْ/);
 });
 await test('Individual on/off overrides take priority and inheritance returns to the group setting',async()=>{
  await personal(owner,did1,'on');await focus(one,true,'individual');await focus(two,false);await global(owner,true);await personal(owner,did2,'off');await focus(one,true,'individual');await focus(two,false,'individual');await global(owner,false);await focus(one,true);await focus(two,false);await personal(owner,did1,'inherit');await focus(one,false,'session');
 });
 await test('Regular learners cannot change group or individual preferences or expose coach tools',async()=>{
  assert.equal(await one.evaluate(()=>APP360_FAMILY_SYNC.setReadingFocus(true)),false);assert.equal(await one.evaluate(did=>APP360_FAMILY_SYNC.setReadingFocus(true,did),did2),false);await panel(one);assert.equal(await one.locator('#a360ReadingFocusAll').count(),0);await closePanel(one);await f1.locator('[data-do="coach"]').click();assert.equal(await f1.locator('#coachReadingFocus').count(),0);await f1.locator('#navLibrary').click();await focus(one,false);
 });
 await test('Focus delivery is independent of a learner’s personal app navigation lock',async()=>{
  await panel(owner);await card(owner,did2).locator('[data-person-app]').selectOption(appId);await card(owner,did2).locator('[data-person-open]').click();await two.waitForFunction(()=>APP360_FAMILY_SYNC.getSession().personal);await personal(owner,did2,'inherit');await global(owner,true);await focus(two,true,'session');assert.equal(await two.evaluate(()=>APP360_FAMILY_SYNC.getSession().personalAppId),appId);
 });
 await test('An authorised assistant can manage group focus and learner overrides',async()=>{
  await personal(owner,didHelper,'off');await panel(owner);await card(owner,didHelper).locator('[data-person-admin="on"]').click();await helper.waitForFunction(()=>APP360_FAMILY_SYNC.getSession().adminRole==='assistant');await focus(helper,true,'session');
  await global(helper,false);await focus(owner,false);await focus(one,false);await personal(helper,did2,'on');await focus(two,true,'individual');await focus(one,false);
  assert.equal(await helper.evaluate(()=>APP360_FAMILY_SYNC.setReadingFocus('false')),false);assert.equal(await owner.evaluate(()=>APP360_FAMILY_SYNC.setReadingFocus(false,'__proto__')),false);
 });
 await test('An individual choice survives learner refresh and app close/reopen',async()=>{
  await two.reload();await two.waitForFunction(()=>window.APP360_FAMILY_SYNC&&APP360_FAMILY_SYNC.getSession().connected);await focus(two,true,'individual');f2=await frame(two);await f2.waitForFunction(()=>APP360_STORY.reading().enabled);
  await panel(owner);await card(owner,did2).locator('[data-person-clear]').click();await two.waitForFunction(()=>!APP360_FAMILY_SYNC.getSession().personal);await two.evaluate(()=>APP360_FAMILY_SHELL.closeApp());f2=await frame(two);await focus(two,true,'individual');await f2.evaluate(()=>APP360_STORY.open('ar-ball','listen'));assert.ok(await f2.locator('.reading-sentence').isVisible());
 });
 await test('Host refresh restores the session default, assistant role and each learner override',async()=>{
  await owner.reload();await owner.waitForFunction(()=>window.APP360_FAMILY_SYNC&&APP360_FAMILY_SYNC.getSession().connected);await owner.waitForFunction(()=>Object.keys(APP360_FAMILY_SYNC.getParticipants()).length===3);await focus(owner,false,'session');await focus(two,true,'individual');await focus(one,false,'session');await helper.waitForFunction(()=>APP360_FAMILY_SYNC.getSession().adminRole==='assistant');await personal(helper,did2,'inherit');await focus(two,false,'session');
 });
 await test('A revoked assistant cannot alter focus and session end restores each local profile choice',async()=>{
  await panel(owner);await card(owner,didHelper).locator('[data-person-admin="off"]').click();await helper.waitForFunction(()=>APP360_FAMILY_SYNC.getSession().adminRole==='member');assert.equal(await helper.evaluate(()=>APP360_FAMILY_SYNC.setReadingFocus(true)),false);await owner.locator('[data-family-end]').click();await one.waitForFunction(()=>APP360_FAMILY_SYNC.getSession().role==='none');await focus(one,true,'local');await focus(two,true,'local');
 });
 await test('The professional coach switch remembers its local value after app reopen',async()=>{
  await one.evaluate(()=>APP360_FAMILY_SHELL.closeApp());f1=await frame(one);await f1.locator('[data-do="coach"]').click();assert.ok(await f1.locator('#coachReadingFocus').isEnabled());await f1.locator('#coachReadingFocus').uncheck();assert.match(await f1.locator('#coachReadingFocusScope').innerText(),/هذا المستخدم/);await focus(one,false,'local');await one.screenshot({path:path.join(out,'coach-focus-mobile.png'),fullPage:true});
  await one.evaluate(()=>APP360_FAMILY_SHELL.closeApp());f1=await frame(one);await focus(one,false,'local');await f1.evaluate(()=>APP360_STORY.open('ar-ball','listen'));assert.ok(await f1.locator('.reading-sentence').isVisible());await f1.locator('[data-do="play-scene"][data-value="ball-0"]').click();await f1.waitForFunction(()=>APP360_STORY_AUDIO.clock().state==='playing');assert.equal(await f1.locator('.ra-active').count(),0);await f1.evaluate(()=>APP360_STORY_AUDIO.stop());await f1.locator('#navLibrary').click();await f1.locator('[data-do="coach"]').click();assert.equal(await f1.locator('#coachReadingFocus').isChecked(),false);await f1.locator('#coachReadingFocus').check();await focus(one,true,'local');
 });
 await test('Returning focus during current real MP3 playback highlights the current word without restarting sound',async()=>{
  await f1.locator('#navLibrary').click();await one.evaluate(()=>APP360_FAMILY_SYNC.setReadingFocus(false));await guide(f1);const before=await f1.evaluate(()=>APP360_STORY_AUDIO.clock());assert.equal(await one.evaluate(()=>APP360_FAMILY_SYNC.setReadingFocus(true)),true);await f1.waitForFunction(()=>document.querySelector('#spokenText .ra-active'));const after=await f1.evaluate(()=>APP360_STORY_AUDIO.clock());assert.equal(after.path,before.path);assert.ok(after.time>=before.time);assert.equal(after.state,'playing');await f1.evaluate(()=>APP360_STORY_AUDIO.stop());
 });
 assert.deepEqual(errors,[]);await panel(owner);await owner.locator('[data-family-create]').click();await owner.waitForFunction(()=>APP360_FAMILY_SYNC.getSession().connected);await owner.locator('.a360-teaching-tools').screenshot({path:path.join(out,'session-focus-mobile.png')});
 fs.writeFileSync(path.join(out,'family-reading-focus-results.json'),JSON.stringify({version:6,passed:checks.length,checks,pageErrors:errors,transport:'real WebSocket relay',audio:'real MP3 playback',productionChanged:false},null,2));console.log('TOTAL '+checks.length);
})().catch(e=>{fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'family-reading-focus-failure.json'),JSON.stringify({error:String(e),stack:e.stack,passed:checks.length,checks,pageErrors:errors},null,2));console.error(e);process.exitCode=1}).finally(async()=>{for(const c of contexts)await c.close();if(browser)await browser.close();if(server)await server.close()});
