'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ?
  path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright') : 'playwright');
const M = require('../src/journey-model');
const root = path.resolve(__dirname, '../../../..');
const entry = '/apps/4-8/command-path-lab/index.html';
const mime = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.webp': 'image/webp', '.mp3': 'audio/mpeg', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png'
};

async function main() {
  const server = http.createServer((request, response) => {
    const file = path.join(root, decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
    try {
      const bytes = fs.readFileSync(file);
      response.writeHead(200, { 'content-type': mime[path.extname(file)] || 'application/octet-stream' });
      response.end(bytes);
    } catch {
      response.writeHead(404);
      response.end();
    }
  });
  await new Promise((resolve, reject) => server.once('error', reject).listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + server.address().port + entry;
  let browser;
  try {
    browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH, headless: true, args: ['--no-proxy-server'] });
    const context = await browser.newContext({
      viewport: { width: 390, height: 840 }, hasTouch: true, isMobile: true,
      serviceWorkers: 'block', reducedMotion: 'reduce'
    });
    const page = await context.newPage(), pageErrors = [];
    page.on('pageerror', error => pageErrors.push(error.message));
    const photos = process.env.COMMAND_JOURNEY_SCREENSHOTS;
    const action = name => page.locator('[data-j="' + name + '"]');
    const tap = name => action(name).tap();
    const next = () => page.locator('.jr-next').waitFor();
    const status = () => page.locator('.jr-feedback').textContent();
    const named = (card, language = 0) => page.getByRole('heading', { name: card.title[language], exact: true }).waitFor();

    await page.goto(url);
    await named(M.cards[0]);
    assert.equal(await action('add:e').count(), 1);
    assert.equal(await action('play').count(), 0);
    assert.equal(await page.locator('.jr-robot').getAttribute('aria-label'), 'فِتيل في صف ٢، عمود ١ →');
    if (photos) await page.screenshot({ path: path.join(photos, 'journey-mobile.png'), fullPage: true });
    const audio = page.waitForResponse(r => r.url().endsWith('/journey-audio/ar-first-light.mp3'));
    await tap('listen');
    assert.equal((await audio).status(), 200);
    await page.locator('.jr-top-actions [data-do="sound"]').tap();
    await tap('add:e');
    await next();
    assert.equal(await page.locator('.goal.jr-glowing').count(), 1);
    await page.reload();
    await next();
    await tap('open:wake-the-firefly');
    await page.locator('.jr-top-actions [data-do="sound"]').tap();
    const coachAudio = page.waitForResponse(r => r.url().endsWith('/journey-audio/ar-coach-undo.mp3'));
    await tap('add:e');
    assert.match(await status(), /تراجع/);
    await action('undo').locator('.jr-coach-finger').waitFor();
    assert.equal((await coachAudio).status(), 200);
    await page.locator('.jr-top-actions [data-do="sound"]').tap();
    await tap('undo');
    await action('add:n').locator('.jr-coach-finger').waitFor();
    await tap('add:n');
    await page.locator('.light.jr-glowing').waitFor();
    await page.reload();
    assert.equal(await page.locator('.light.jr-glowing').count(), 1);
    await tap('add:n');
    await next();
    await tap('open:two-cards');
    await tap('add:w');
    await tap('add:w');
    assert.equal(await page.locator('.jr-robot').getAttribute('aria-label'), 'فِتيل في صف ٢، عمود ٣ ←');
    await tap('play');
    await next();
    await tap('open:first-then');
    await tap('add:n'); await tap('add:e'); await tap('play');
    assert.match(await status(), /يراعة/);
    await tap('reset');
    await tap('add:e'); await tap('add:n'); await tap('play'); await next();
    await tap('open:garden-trail');
    await tap('hint');
    for (const op of M.cards[4].answer) await tap('add:' + op);
    await tap('step');
    await page.locator('.jr-executing[data-slot="0"]').waitFor();
    assert.equal(await page.locator('.jr-next').count(), 0);
    await tap('play');
    await next();

    for (const [i, card] of M.cards.entries()) {
      if (i < 5) continue;
      await tap('open:' + card.id);
      await named(card);
      if (card.mode === 'swap' || card.mode === 'repair') {
        await tap('play');
        await page.locator('.jr-feedback').waitFor();
        if (card.mode === 'swap') await tap('swap');
        else {
          if (i === 5) {
            assert.equal(await page.locator('.jr-error[data-slot="1"]').count(), 1);
            await action('select:1').locator('.jr-coach-finger').waitFor();
            if (photos) await page.screenshot({ path: path.join(photos, 'journey-repair.png'), fullPage: true });
          }
          const slot = card.starter.findIndex((op, index) => op !== card.answer[index]);
          await tap('select:' + slot);
          await action('add:' + card.answer[slot]).locator('.jr-coach-finger').waitFor();
          await tap('add:' + card.answer[slot]);
        }
        await tap('play');
      } else if (card.mode === 'predict') {
        assert.equal(await action('play').isDisabled(), true);
        assert.equal(await page.locator('.jr-cell.goal').count(), 0);
        await tap('guess:2:2'); await tap('play');
        assert.match(await status(), /توقّعك/);
        assert.equal(await page.locator('.jr-cell.goal').count(), 1);
        await tap('guess:2:1'); await tap('play');
      } else {
        for (const op of card.answer) await tap('add:' + op);
        if (!M.direct(card)) await tap('play');
      }
      await next();
    }
    assert.equal(await page.locator('.jr-score b').textContent(), '١٥ / ١٥');
    if (photos) await page.screenshot({ path: path.join(photos, 'journey-finale.png'), fullPage: true });
    await tap('open:' + M.studio.id);
    await tap('add:f'); await tap('play');
    assert.match(await status(), /طريقك/);
    await tap('chart');
    await tap('grownups');
    assert.match(await page.locator('#journeyCoach').innerText(), /أُنجزت بعد تلميح/);
    assert.match(await page.locator('#journeyCoach').innerText(), /أُنجزت دون تلميح/);
    await page.locator('.jr-top-actions [data-do="language"]').tap();
    assert.equal(await page.locator('html').getAttribute('dir'), 'ltr');
    await page.getByRole('heading', { name: 'Map of Lights' }).waitFor();
    await tap('open:first-light');
    await named(M.cards[0], 1);
    await tap('add:e'); await next();
    await tap('chart');
    await page.locator('.jr-chart-actions [data-do="library"]').tap();
    assert.equal(await page.locator('.map-card').count(), 12);
    assert.equal(await page.evaluate(() => APP360_COMMAND.open('adventure-0-0')), true);
    await page.locator('button.cell').first().waitFor();
    await page.locator('#navJourney').tap();
    await named(M.cards[0], 1);
    await page.setViewportSize({ width: 320, height: 600 });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);
    await page.setViewportSize({ width: 1440, height: 950 });
    if (photos) await page.screenshot({ path: path.join(photos, 'journey-desktop.png'), fullPage: true });
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), true);

    await page.evaluate(() => {
      localStorage.setItem('app360:profile:name', 'طفل آخر');
      document.dispatchEvent(new Event('app360:namechange'));
    });
    await named(M.cards[0]);
    assert.equal(await page.locator('.jr-score b').textContent(), '٠ / ١٥');
    await tap('chart');
    assert.equal(await action('open:wake-the-firefly').isDisabled(), true);
    assert.deepEqual(pageErrors, []);
    console.log('PASS all 15 missions by touch, feedback, replay, step-through, bilingual navigation, profile isolation and classic links');

    const planner = await context.newPage();
    await planner.addInitScript(() => {
      if (window !== window.top || !location.pathname.includes('/session-planner-4-8/')) return;
      localStorage.setItem('app360:profile:name', 'المرافق التجريبي');
      localStorage.setItem('app360:profile:role', 'parent');
      localStorage.setItem('app360:profile:age', '4-8');
      localStorage.setItem('app360:profile:age-owner', 'name:المرافق التجريبي');
    });
    await planner.goto(new URL('/apps/4-8/session-planner-4-8/index.html', url).href);
    await planner.locator('#adultGateCheck').check();
    await planner.locator('#adultGateAccept').click();
    await planner.locator('[data-action="enter"]').click();
    await planner.locator('[data-action="template0"]').click();
    assert.equal(await planner.locator('#activity option').filter({ hasText: /مسار الأوامر ·/ }).count(), 3);
    const riverOption = planner.locator('#activity option').filter({ hasText: 'نهر البلّور' });
    await planner.locator('#activity').selectOption(await riverOption.getAttribute('value'));
    await planner.locator('[data-action="addDigital"]').click();
    for (let i = 0; i < 4; i++) await planner.locator('[data-action="remove0"]').click();
    await planner.locator('[data-action="start"]').click();
    await planner.locator('[data-action="launch"]').click();
    await planner.waitForURL(/launch\.html.*[?&]track=river/);
    assert.equal(await planner.getByRole('button', { name: /أنجزنا النشاط/ }).count(), 0);
    const river = planner.frameLocator('iframe.app360-link-frame');
    const riverAction = action => river.locator('[data-j="' + action + '"]');
    await river.getByRole('heading', { name: 'الجسر ينتظر' }).waitFor();
    assert.equal(await river.locator('.jr-score b').textContent(), '٠ / ٥');
    await riverAction('play').tap(); await riverAction('select:1').tap();
    await riverAction('add:n').tap(); await riverAction('play').tap();
    await riverAction('open:swap-order').tap();
    await riverAction('play').tap(); await riverAction('swap').tap(); await riverAction('play').tap();
    await riverAction('open:point-ahead').tap();
    await riverAction('add:r').tap(); await riverAction('add:f').tap();
    await riverAction('open:make-a-bend').tap();
    for (const op of ['f', 'l', 'f']) await riverAction('add:' + op).tap();
    await riverAction('play').tap();
    await riverAction('open:predict-landing').tap();
    await riverAction('guess:2:1').tap(); await riverAction('play').tap();
    await riverAction('chart').last().waitFor();
    await planner.getByRole('button', { name: 'العودة للخطة', exact: true }).click();
    await planner.waitForURL(/session-planner-4-8\/index\.html.*app360_result=completed/);
    const completion = await planner.evaluate(() => JSON.parse(localStorage.getItem('app360:interop:v1:events') || '[]')
      .find(event => event.type === 'completed' && event.target_ref === 'track:river'));
    assert.deepEqual(completion.payload, { action: 'track-completed', track: 'river', missions_completed: 5 });
    console.log('PASS selecting a track in the 4–8 planner, coached play and structured completion on return');

    const offline = await browser.newContext({ reducedMotion: 'reduce' });
    const local = await offline.newPage();
    await local.goto(url);
    await local.evaluate(() => navigator.serviceWorker.ready);
    await local.waitForFunction(() => !!navigator.serviceWorker.controller);
    await local.reload();
    await local.locator('[data-j="add:e"]').waitFor();
    await local.evaluate(async () => {
      const files = ['index.html', 'journey.css', 'src/journey-missions.js', 'src/journey-model.js', 'src/journey.js',
        'assets/journey-garden.webp', 'assets/journey-audio/ar-first-light.mp3'];
      await Promise.all(files.map(file => fetch(file).then(r => r.arrayBuffer())));
    });
    await local.waitForFunction(async () => Boolean(await caches.match(location.href)), null, { timeout: 10000 });
    await offline.setOffline(true);
    await local.reload();
    await local.locator('[data-j="add:e"]').click();
    await local.locator('.jr-next').waitFor();
    console.log('PASS offline reload and play through the real service worker');
    await offline.setOffline(false);
    await local.waitForFunction(() => navigator.onLine && window.APP360_OFFLINE);
    const downloaded = await local.evaluate(() => APP360_OFFLINE.downloadApp('a4-command-path'));
    assert.equal(downloaded, true);
    await offline.setOffline(true);
    const laterWorld = await local.evaluate(async () => {
      const river = await fetch('assets/journey-river.webp');
      const sky = new Audio('assets/journey-audio/en-big-light.mp3');
      await sky.play();
      const playable = !sky.paused && sky.duration > 2;
      sky.pause();
      return river.ok && (await river.arrayBuffer()).byteLength > 30000 && playable;
    });
    assert.equal(laterWorld, true);
    console.log('PASS full offline download with checksums, later worlds and bilingual audio');
  } finally {
    if (browser) await browser.close();
    server.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
