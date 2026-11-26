'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const http = require('node:http');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');

const root = path.resolve(__dirname, '../../../..');
const base = 'apps/4-8/draw-write-studio/';
const types = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.webp': 'image/webp', '.mp3': 'audio/mpeg'
};
const server = http.createServer((request, response) => {
  const file = path.resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
  if (!file.startsWith(root + path.sep)) return response.writeHead(403).end();
  fs.readFile(file, (error, data) => {
    if (error) return response.writeHead(404).end();
    response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
    response.end(data);
  });
});

const click = async (page, action, value) => {
  const button = page.locator(`[data-do="${action}"]${value === undefined ? '' : `[data-value="${value}"]`}`).first();
  if (await page.evaluate(() => navigator.maxTouchPoints > 0)) await button.tap();
  else await button.click();
};
const snapshot = page => page.evaluate(() => APP360_STUDIO.snapshot());
const ink = async page => {
  const state = await snapshot(page);
  return state.draft.pages[state.draft.page].commands;
};

async function open(browser, settings) {
  const page = await browser.newPage({ serviceWorkers: 'block', ...settings });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', route => route.request().url().startsWith(url) ? route.continue() : route.abort());
  await page.goto(url + base + 'index.html');
  await page.waitForFunction(() => !!window.APP360_STUDIO);
  assert.equal(await page.locator('#brandTitle').textContent(), 'مرسم العائلة');
  return { page, errors };
}

async function entranceAndGallery(browser) {
  const { page, errors } = await open(browser, { viewport: { width: 1280, height: 800 }, acceptDownloads: true });
  if (process.env.STUDIO_SCREENSHOTS) await page.screenshot({ path: path.join(process.env.STUDIO_SCREENSHOTS, 'studio-home.png') });
  await click(page, 'free');
  const board = await page.locator('#drawCanvas').boundingBox();
  assert.ok(board.width > 650 && board.height > 450);
  const x = board.x + board.width * .18, y = board.y + board.height * .26;
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + 160, y + 85, { steps: 12 });
  await page.mouse.up();
  assert.equal((await ink(page))[0].type, 'stroke');
  await click(page, 'undo');
  assert.deepEqual(await ink(page), []);
  await click(page, 'redo');
  assert.equal((await ink(page)).length, 1);

  await click(page, 'drawer', 'shapes');
  await click(page, 'shape', 'triangle');
  await click(page, 'shape-style', 'fill');
  await page.mouse.move(x + 180, y + 80);
  await page.mouse.down();
  await page.mouse.move(x + 270, y + 160, { steps: 5 });
  await page.mouse.up();
  assert.ok((await ink(page))[1].filled);
  await click(page, 'drawer', 'paper');
  await click(page, 'paper', 'mint');
  assert.equal((await ink(page))[2].kind, 'mint');
  await click(page, 'undo');
  await click(page, 'redo');
  assert.equal((await ink(page))[2].kind, 'mint');
  await click(page, 'drawer', 'photos');
  await page.locator('#photoGroup').selectOption('4');
  const tile = page.getByRole('button', { name: 'تفاح', exact: true });
  await tile.locator('img').evaluate(img => img.decode());
  await tile.click();
  await click(page, 'photo-center');
  assert.equal((await ink(page)).at(-1).type, 'photo');
  await click(page, 'photo-listen');
  assert.match(await page.evaluate(() => APP360_STUDIO.audio().path), /say-and-name\/audio\//);
  if (process.env.STUDIO_SCREENSHOTS) {
    await page.evaluate(() => scrollTo(0,0));
    await page.screenshot({ path: path.join(process.env.STUDIO_SCREENSHOTS, 'studio-draw.png') });
  }
  await click(page, 'stage', 'meaning');
  assert.equal(await page.locator('#drawCanvas').count(), 0);
  await page.locator('#caption').fill('تفاحة لعائلتي');
  await page.locator('#studioRecipient').fill('أمي');
  await click(page, 'stage', 'review');
  assert.match(await page.locator('.review-page .caption').textContent(), /تفاحة لعائلتي/);
  const [download] = await Promise.all([page.waitForEvent('download'), click(page, 'png')]);
  assert.match(download.suggestedFilename(), /\.png$/);
  const file = await download.path();
  assert.equal(fs.readFileSync(file).subarray(1,4).toString(), 'PNG');
  await click(page, 'save-project');
  assert.equal((await snapshot(page)).saved.length, 1);
  await page.reload();
  await page.locator('.gallery-card').waitFor();
  await click(page, 'edit-saved');
  await click(page, 'drawer', 'tools');
  await click(page, 'clear-board');
  await click(page, 'confirm-clear');
  assert.equal((await ink(page)).length, 0);
  assert.equal((await snapshot(page)).saved[0].pages[0].commands.length, 4);
  assert.deepEqual(errors, []);
  await page.close();
  console.log('PASS Arabic drawing, shapes, paper, photos and audio, words, PNG, gallery and recovery');
}

async function legacyPen(browser) {
  const { page, errors } = await open(browser, {
    viewport: { width: 1280, height: 800 }, hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 4.4.2; DMTAB-NV20A) AppleWebKit/537.36 Chrome/30.0.0.0 Safari/537.36'
  });
  await click(page, 'free');
  await page.evaluate(() => {
    const canvas = document.getElementById('drawCanvas');
    const box = canvas.getBoundingClientRect();
    function touch(id, x, y) { return { identifier:id, clientX:box.left + x, clientY:box.top + y }; }
    function send(type, changed, touches) {
      const event = new Event(type, { bubbles:true, cancelable:true });
      Object.defineProperties(event, { touches:{ value:touches }, changedTouches:{ value:[changed] } });
      canvas.dispatchEvent(event);
      if (!event.defaultPrevented) throw Error('Legacy touch must suppress scrolling and synthetic mouse input');
    }
    window.testContact = function (id, x, y, cancelled) {
      const t = touch(id,x,y);
      send('touchstart',t,[t]);
      send(cancelled?'touchcancel':'touchend',t,[]);
    };
    for (let i = 0; i < 25; i++) window.testContact(i+1, 70+i*11, 90+i*2, i%2===0);
    const stylus = touch(90, 350, 142), palm = touch(91, 500, 400);
    send('touchstart',stylus,[stylus]);
    send('touchstart',palm,[stylus,palm]);
    send('touchmove',stylus,[touch(90,370,145),palm]);
    send('touchend',palm,[touch(90,370,145)]);
    send('touchend',touch(90,390,148),[]);
  });
  let commands = await ink(page);
  assert.equal(commands.length, 1);
  assert.ok(commands[0].points.length >= 26);
  assert.ok(Math.max(...commands[0].points.map(p => p.y)) < .4);
  const alpha = await page.locator('#drawCanvas').evaluate(canvas => canvas.getContext('2d').getImageData(75,91,1,1).data[3]);
  assert.ok(alpha > 0, 'ink is visible in the space between contacts');
  await page.evaluate(() => window.testContact(99, 550, 210, false));
  await page.waitForTimeout(250);
  await page.evaluate(() => window.testContact(100, 560, 220, false));
  assert.equal((await ink(page)).length, 3, 'distant contacts and delayed dots stay independent');
  await click(page, 'undo');
  await click(page, 'undo');
  assert.equal((await ink(page)).length, 1);
  await click(page, 'drawer', 'tools');
  await click(page, 'repair');
  await page.evaluate(() => { window.testContact(101, 435, 290, true); window.testContact(102, 445, 290, true); });
  assert.equal((await ink(page)).length, 3, 'repair can be disabled for intentional close marks');
  await page.setViewportSize({ width: 800, height: 1280 });
  await page.reload();
  assert.equal((await ink(page)).length, 3);
  assert.equal((await snapshot(page)).pen_repair, false);
  assert.deepEqual(errors, []);
  await page.close();
  console.log('PASS old tablet session, fragmented end/cancel, palm rejection, separate dots, undo and restart');
}

async function mobile(browser) {
  const { page, errors } = await open(browser, { viewport: { width: 360, height: 804 }, hasTouch: true, isMobile: true });
  await click(page, 'language', 'en');
  await click(page, 'level', '4');
  const mission = page.locator('[data-do="open"]').first();
  await mission.click();
  assert.equal(await page.locator('html').getAttribute('dir'), 'ltr');
  assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  await click(page, 'drawer', 'tools');
  await click(page, 'tool', 'rainbow');
  await click(page, 'mirror');
  await click(page, 'board-top');
  const box = await page.locator('#drawCanvas').boundingBox();
  await page.touchscreen.tap(box.x+box.width*.3,box.y+box.height*.4);
  assert.equal((await ink(page))[0].brush,'rainbow');
  assert.ok((await ink(page))[0].mirror);
  await click(page, 'expand');
  assert.equal(await page.locator('#expandBoard').getAttribute('aria-pressed'), 'true');
  assert.equal((await ink(page)).length,1);
  if (process.env.STUDIO_SCREENSHOTS) await page.screenshot({ path: path.join(process.env.STUDIO_SCREENSHOTS, 'studio-phone.png'), fullPage: true });
  await click(page, 'stage', 'review');
  await page.goBack();
  await page.locator('#drawCanvas').waitFor();
  assert.equal((await ink(page)).length,1);
  await click(page, 'library');
  await click(page, 'colouring');
  await click(page, 'paper', 'fish');
  assert.deepEqual(await ink(page), [{ type:'paper', kind:'fish' }]);
  assert.equal((await snapshot(page)).saved[0].pages[0].commands[0].brush, 'rainbow');
  assert.deepEqual(errors, []);
  await page.close();
  console.log('PASS narrow English guided project, modern touch, mirror, resize, browser back and colouring entrance');
}

async function offline(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await page.goto(url + base + 'index.html');
  await page.waitForFunction(() => window.APP360_OFFLINE && navigator.serviceWorker.controller);
  const downloaded = await page.evaluate(async () => {
    let files = 0;
    const ok = await APP360_OFFLINE.downloadApp('a4-draw-write', { onProgress: event => { files = event.count; } });
    return { ok, files, status:APP360_OFFLINE.status('a4-draw-write') };
  });
  assert.ok(downloaded.ok && downloaded.files > 2800 && downloaded.status);
  await page.context().setOffline(true);
  await page.reload();
  await page.waitForFunction(() => APP360_STUDIO.isOfflineReady());
  await click(page, 'free');
  await click(page, 'drawer', 'photos');
  await page.locator('#photoGroup').selectOption('4');
  const tile = page.getByRole('button', { name:'تفاح', exact:true });
  await tile.locator('img').evaluate(img => img.decode());
  await tile.click();
  await click(page, 'photo-center');
  await page.waitForFunction(() => {
    const canvas = document.getElementById('drawCanvas');
    const pixel = canvas.getContext('2d').getImageData(canvas.width*.5, canvas.height*.51, 1, 1).data;
    return pixel[0] > pixel[1] + 25 && pixel[0] > pixel[2] + 25;
  });
  await click(page, 'stage', 'review');
  await click(page, 'save-project');
  assert.equal((await snapshot(page)).saved.length, 1);
  await page.close();
  console.log(`PASS downloaded ${downloaded.status.count} verified resources; reopened, placed a picture and saved offline`);
}

let url;
(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  url = `http://127.0.0.1:${server.address().port}/`;
  const browser = await chromium.launch({ headless:true, executablePath:process.env.APP360_TEST_CHROMIUM, args:['--no-sandbox'] });
  try {
    await entranceAndGallery(browser);
    await legacyPen(browser);
    await mobile(browser);
    if (process.argv.includes('--offline')) await offline(browser);
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode=1; }).finally(() => server.close());
