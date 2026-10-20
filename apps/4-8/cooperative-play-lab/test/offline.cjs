'use strict';
const a = require('node:assert/strict'), {setup} = require('./helpers.cjs');
(async () => {
  const env = await setup();
  try {
    const context = await env.browser.newContext({serviceWorkers: 'allow'}), page = await context.newPage(), errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(env.url);
    await page.waitForFunction(() => navigator.serviceWorker.controller, null, {timeout: 60000});
    await page.locator('#langBtn').click();
    const draft = !!process.env.COOPERATE_DRAFT;
    const tracks = draft ? ['entry'] : ['entry','practice','extend'];
    const languages = draft ? ['en'] : ['en','ar'];
    for (const language of languages) {
      if (await page.locator('html').getAttribute('lang') !== language) await page.locator('#langBtn').click();
      for (const track of tracks) {
        await page.locator('#navLibrary').click();
        await page.locator('[data-do="level"][data-value="' + track + '"]').click();
        await page.locator('#navCoach').click();
        await page.locator('[data-do="download"]').click();
        let readiness;
        for (let attempt = 0; attempt < 600; attempt++) {
          readiness = await page.evaluate(async ({track, language}) => {
            const ids = COOPERATE_CONTENT.cases.filter(c => c.track === track).map(c => c.id);
            const keys = await caches.keys();
            let ready = 0;
            for (const id of ids) {
              const name = keys.find(k => k.endsWith('-pack-' + language + '--' + id));
              if (name && await (await caches.open(name)).match('__ready__')) ready++;
            }
            return {expected: ids.length, ready, cacheCount: keys.length};
          }, {track, language});
          if (readiness.expected === 20 && readiness.ready === 20) break;
          await new Promise(resolve => setTimeout(resolve, 100));
        }
        console.log('Offline readiness:', track, language, JSON.stringify(readiness));
        a.equal(readiness.expected, 20);
        a.equal(readiness.ready, 20);
      }
    }
    await context.setOffline(true);
    await page.reload();
    await page.waitForFunction(() => window.APP360_COOPERATE);
    const decoded = await page.evaluate(async ({languages, draft}) => {
      const manifest = await (await fetch('data/audio-manifest.json')).json(), context = new AudioContext();
      const ids = COOPERATE_CONTENT.cases.filter(c => c.track === 'entry').map(c => c.id);
      const clips = manifest.items.filter(i => languages.includes(i.language) && (!draft || ids.some(id => i.path.includes(id)) || i.path.includes('common-')));
      let count = 0;
      for (const item of clips) {
        let response;try { response = await fetch(item.path); } catch (error) { throw Error('Offline fetch failed '+item.path+': '+error.message); } if (!response.ok) throw Error('Offline missing ' + item.path);
        const buffer = await context.decodeAudioData(await response.arrayBuffer());
        if (buffer.duration <= .4 || buffer.duration >= 60) throw Error('Invalid recording ' + item.path);
        count++;
      }
      await context.close(); return count;
    }, {languages, draft});
    if (!draft) a.equal(decoded, 860); else a(decoded >= 140);
    if (await page.locator('html').getAttribute('lang') !== 'en') await page.locator('#langBtn').click();
    await page.locator('#navLibrary').click();
    await page.locator('[data-do="level"][data-value="entry"]').click();
    await page.locator('.case-card').first().click();
    await page.waitForFunction(() => document.querySelector('.scene img').naturalWidth > 0);
    await page.locator('[data-do="listen"]').click();
    await page.waitForFunction(() => APP360_COOPERATE.audio().time > .2);
    await page.waitForFunction(() => document.querySelector('.ra-active'), null, {timeout: 15000});
    await page.locator('.narration [data-do="stop"]').click();
    a.equal(await page.evaluate(() => APP360_COOPERATE.audio().paused), true);
    a.deepEqual(errors, []);
    console.log('Offline PASS:', JSON.stringify({languages, tracks, decoded, realWordTracking: true, reload: true, errors}));
    await context.close();
  } finally { await env.close(); }
})().catch(error => { console.error(error); process.exit(1); });
