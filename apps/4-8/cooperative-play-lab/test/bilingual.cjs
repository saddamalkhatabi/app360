'use strict';
const a = require('node:assert/strict');
const {setup} = require('./helpers.cjs');
(async () => {
  const env = await setup();
  try {
    const context = await env.browser.newContext({viewport: {width: 390, height: 844}, serviceWorkers: 'block'});
    const page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(env.url);
    await page.waitForFunction(() => window.APP360_COOPERATE);
    for (const track of ['entry','practice','extend']) {
      await page.locator('[data-do="level"][data-value="' + track + '"]').click();
      a.equal(await page.locator('.case-card').count(), 20);
    }
    await page.locator('#langBtn').click();
    a.equal(await page.locator('html').getAttribute('lang'), 'en');
    a.equal(await page.locator('html').getAttribute('dir'), 'ltr');
    await page.locator('.case-card').last().click();
    await page.waitForFunction(() => APP360_COOPERATE.audio().time > .2);
    a.match((await page.evaluate(() => APP360_COOPERATE.audio().path)), /audio\/en\/agreement-review-0\.mp3/);
    await page.waitForFunction(() => document.querySelector('.ra-active'), null, {timeout: 15000});
    await page.locator('#textBtn').click();
    a.equal(await page.locator('.caption:visible').count(), 0);
    a.equal(await page.locator('#spokenPanel:visible').count(), 0);
    await page.locator('#textBtn').click();
    await page.locator('#navCoach').click();
    await page.locator('[data-do="words"]').click();
    a.equal(await page.evaluate(() => APP360_COOPERATE.snapshot().showWords), false);
    await page.reload();
    await page.waitForFunction(() => window.APP360_COOPERATE);
    a.equal(await page.evaluate(() => APP360_COOPERATE.snapshot().language), 'en');
    a.equal(await page.evaluate(() => APP360_COOPERATE.snapshot().showWords), false);
    await page.locator('#navLibrary').click();
    await page.locator('.case-card').first().click();
    const before = await page.evaluate(() => JSON.stringify(APP360_COOPERATE.snapshot().draft));
    await page.locator('#teacherBtn').click();
    await page.locator('[data-do="teacher-case"]').click();
    await page.waitForFunction(() => APP360_COOPERATE.teacher().running && APP360_COOPERATE.audio().time > .2);
    await page.locator('[data-do="teacher-pause"]').click();
    a.equal(await page.evaluate(() => APP360_COOPERATE.teacher().running), false);
    await page.waitForTimeout(1200);
    a.equal(await page.evaluate(() => JSON.stringify(APP360_COOPERATE.snapshot().draft)), before);
    a.equal(await page.evaluate(() => APP360_COOPERATE.snapshot().saved.length), 0);
    await page.locator('#langBtn').click();
    a.equal(await page.locator('html').getAttribute('dir'), 'rtl');
    a.equal(await page.evaluate(() => APP360_COOPERATE.teacher().running), false);
    a.equal(await page.locator('[data-do="teacher-level"]').count(), 1);
    a.deepEqual(errors, []);
    console.log('Bilingual PASS: 60 cases, real English playback and word timing, hidden text, settings restored, teacher pause and draft isolation');
    await context.close();
  } finally { await env.close(); }
})().catch(error => { console.error(error); process.exit(1); });
