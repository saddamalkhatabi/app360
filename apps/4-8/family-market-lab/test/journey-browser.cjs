'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES ?
  path.join(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES, 'playwright') : 'playwright');
const market = require('../src/journey-model.js');
const root = path.resolve(__dirname, '../../../..');
const entry = '/apps/4-8/family-market-lab/';
const mime = {
  '.css': 'text/css', '.js': 'text/javascript', '.html': 'text/html; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg'
};

function localAssets(route, base) {
  const url = new URL(route.request().url());
  if (url.origin !== base) return route.abort();
  const requested = decodeURIComponent(url.pathname);
  const file = path.join(root, requested.endsWith('/') ? requested + 'index.html' : requested);
  if (!file.startsWith(root + path.sep) || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
    return route.fulfill({ status: 404, body: '' });
  }
  return route.fulfill({
    path: file,
    contentType: mime[path.extname(file)] || 'application/octet-stream'
  });
}

function control(page, action, value) {
  return page.locator('[data-action="' + action + '"]' +
    (value === undefined ? '' : '[data-value="' + value + '"]')).first();
}
function snapshot(page) { return page.evaluate(() => window.APP360_MARKET.snapshot()); }
function level(page, index) { return page.locator('#level-path').locator('[data-value="' + index + '"]').click(); }
function center(box) { return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; }

async function fullJourney(page) {
  for (const [i, stage] of market.levels.entries()) {
    for (const round of stage.rounds.keys()) {
      const task = market.start(i, round);
      const current = await snapshot(page);
      assert.equal(current.level, i);
      assert.equal(current.round, round);
      let basket = current.basket;
      if (task.mode === 'recognize') {
        await control(page, 'choose', task.goal).click();
      } else {
        for (let step = 0; step < 15 && !market.check(task, basket); step++) {
          const hint = market.suggestion(task, basket);
          await control(page, hint.action, hint.value).click();
          basket = market.change(task, basket, hint.action, hint.value);
        }
        await control(page, 'deliver').click();
      }
      assert(await page.locator('#order-done').isVisible());
      assert((await snapshot(page)).delivered);
      await page.locator('#next-button').click();
    }
  }
  assert.equal((await snapshot(page)).completed.length, 20);
  assert(await page.locator('#progress-panel').isVisible());
}

async function main() {
  const base = 'https://school.test';
  const browser = await chromium.launch({
    executablePath: process.env.CHROMIUM_PATH,
    headless: true,
    args: ['--no-proxy-server', '--autoplay-policy=no-user-gesture-required']
  });
  const errors = [];
  async function setup(options) {
    const context = await browser.newContext({ serviceWorkers: 'block', ...options });
    await context.route('**/*', route => localAssets(route, base));
    const page = await context.newPage();
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base + entry + 'index.html', { waitUntil: 'domcontentloaded' });
    await page.locator('.number-tile').first().waitFor();
    return page;
  }

  try {
    const desktop = await setup({ viewport: { width: 1440, height: 900 } });
    assert.equal(await desktop.locator('.site-header .brand').evaluate(node => getComputedStyle(node).position), 'static');
    if (process.env.MARKET_QA_DIR) {
      await desktop.screenshot({ path: path.join(process.env.MARKET_QA_DIR, 'market-desktop.png'), fullPage: true });
    }
    await control(desktop, 'sound').click();
    await control(desktop, 'choose', 2).click();
    assert.match(await desktop.locator('#feedback').textContent(), /جرّب/);
    await control(desktop, 'help').click();
    assert(await control(desktop, 'choose', 1).evaluate(node => node.classList.contains('hint-target')));
    assert.equal((await snapshot(desktop)).delivered, false);
    await fullJourney(desktop);
    await desktop.reload({ waitUntil: 'domcontentloaded' });
    assert.equal((await snapshot(desktop)).completed.length, 20);
    assert(await desktop.locator('#order-done').isVisible());
    await control(desktop, 'language').click();
    assert.equal(await desktop.locator('html').getAttribute('dir'), 'ltr');
    await level(desktop, 1);
    const before = await snapshot(desktop);
    await control(desktop, 'help').click();
    const geometry = await desktop.evaluate(() => {
      const ghost = document.querySelector('.flying-item');
      const slot = document.querySelector('#basket-slots .hint-target');
      const center = element => {
        const r = element.getBoundingClientRect();
        return [r.left + r.width / 2, r.top + r.height / 2];
      };
      const frame = ghost.getAnimations()[0].effect.getKeyframes().at(-1);
      const shift = new DOMMatrix(frame.transform);
      return [parseFloat(ghost.style.left) + parseFloat(ghost.style.width) / 2 + shift.e,
        parseFloat(ghost.style.top) + parseFloat(ghost.style.height) / 2 + shift.f, ...center(slot)];
    });
    assert(Math.abs(geometry[0] - geometry[2]) < 2 && Math.abs(geometry[1] - geometry[3]) < 2);
    assert.deepEqual(await snapshot(desktop), before);

    const phone = await setup({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    await level(phone, 1);
    await control(phone, 'sound').tap();
    if (process.env.MARKET_QA_DIR) {
      await phone.screenshot({ path: path.join(process.env.MARKET_QA_DIR, 'market-mobile.png'), fullPage: true });
    }
    assert.equal(await phone.evaluate(() => document.documentElement.scrollWidth), 390);
    await control(phone, 'help').tap();
    await phone.locator('#basket-slots .hint-target').waitFor();
    assert.deepEqual((await snapshot(phone)).basket, []);
    const source = center(await control(phone, 'take', 0).boundingBox());
    const drop = center(await phone.locator('#basket-body').boundingBox());
    const touch = await phone.context().newCDPSession(phone);
    await touch.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [source] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [
      { x: (source.x + drop.x) / 2, y: (source.y + drop.y) / 2 }
    ] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [drop] });
    await touch.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    assert.deepEqual((await snapshot(phone)).basket, [0]);
    await control(phone, 'return', 0).tap();
    await phone.waitForFunction(() => window.APP360_MARKET.snapshot().basket.length === 0);
    assert.deepEqual((await snapshot(phone)).basket, []);
    await level(phone, 4);
    await control(phone, 'help').tap();
    await phone.locator('button.item-slot.hint-target').waitFor();
    assert.equal((await snapshot(phone)).basket.length, 4);

    const reduced = await setup({ viewport: { width: 320, height: 680 }, reducedMotion: 'reduce', hasTouch: true });
    await level(reduced, 1);
    await control(reduced, 'help').click();
    assert.equal(await reduced.locator('.flying-item').count(), 0);
    assert.equal(await reduced.locator('.hint-target').count(), 2);
    assert.equal(await reduced.evaluate(() => document.documentElement.scrollWidth), 320);

    const launch = await desktop.context().newPage();
    await launch.goto(base + entry + 'launch.html?embedded=1', { waitUntil: 'domcontentloaded' });
    const frame = launch.frameLocator('iframe');
    await frame.locator('#level-path [data-value="0"]').click();
    await frame.locator('[data-action="choose"][data-value="1"]').click();
    await launch.locator('.app360-link-title').getByText(/تم تسجيل تنفيذ النشاط/).waitFor();
    await launch.goto(base + entry + 'launch.html?item=ar-little-order', { waitUntil: 'domcontentloaded' });
    await launch.frameLocator('iframe').getByText('ساعدني', { exact: true }).waitFor();
    assert.match(await launch.locator('iframe').getAttribute('src'), /classic\.html/);

    if (process.env.MARKET_TEST_AUDIO === '1') {
      const audio = await setup({ viewport: { width: 920, height: 700 } });
      const paths = [];
      await audio.evaluate(() => {
        window.marketPlayed = [];
        const play = HTMLMediaElement.prototype.play;
        HTMLMediaElement.prototype.play = function () {
          const pending = play.call(this);
          if (this.src.includes('/audio/journey/')) pending.then(() => window.marketPlayed.push(this.src));
          return pending;
        };
      });
      audio.on('response', response => {
        if (response.url().includes('/audio/journey/') && response.ok()) paths.push(response.url());
      });
      await control(audio, 'listen').click();
      await audio.waitForFunction(() => window.marketPlayed.some(url => url.endsWith('ar-number-1.mp3')));
      await level(audio, 1);
      await control(audio, 'help').click();
      await audio.waitForFunction(() => window.marketPlayed.some(url => url.endsWith('ar-hint-add.mp3')));
      assert(paths.some(url => url.endsWith('ar-recognize.mp3')));
      assert(paths.some(url => url.endsWith('ar-hint-add.mp3')));
      await control(audio, 'language').click();
      await control(audio, 'listen').click();
      await audio.waitForFunction(() => window.marketPlayed.some(url => url.endsWith('en-count.mp3')));
    }
    assert.deepEqual(errors, []);
    console.log('Market browser checks passed on desktop, touch, reduced-motion and launch routes.');
  } finally {
    await browser.close();
  }
}

main().catch(error => { console.error(error); process.exitCode = 1; });
