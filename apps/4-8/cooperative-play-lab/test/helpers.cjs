'use strict';
const fs = require('fs'), path = require('path'), http = require('http');
exports.setup = async function () {
  const {chromium} = require('playwright');
  const repo = path.resolve(__dirname, '../../../..');
  const server = http.createServer((req, res) => {
    const pathname = decodeURIComponent(new URL(req.url, 'http://local').pathname);
    const file = path.resolve(repo, '.' + pathname);
    if (!file.startsWith(repo + path.sep)) { res.writeHead(403); res.end(); return; }
    fs.readFile(file, (error, bytes) => {
      if (error) { res.writeHead(404); res.end(); return; }
      res.setHeader('Content-Type', ({'.js':'application/javascript','.html':'text/html','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.mp3':'audio/mpeg','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png'})[path.extname(file)] || 'application/octet-stream');
      res.end(bytes);
    });
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({headless: true, executablePath: process.env.APP360_CHROMIUM_PATH || undefined, args: ['--no-sandbox','--disable-dev-shm-usage','--autoplay-policy=no-user-gesture-required']});
  } catch (error) { server.close(); throw error; }
  return {browser, url: 'http://127.0.0.1:' + server.address().port + '/apps/4-8/cooperative-play-lab/index.html', async close() { await browser.close(); await new Promise(resolve => server.close(resolve)); }};
};
