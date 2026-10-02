'use strict';
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const brand = 'مدرسة العائلة 360';
const oldBrand = /مختبر التطبيق 360|مختبر 360|الريلز الآمن|Safe Reels/i;
const failures = [];
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
function check(ok, message) { if (!ok) failures.push(message); }
function htmlFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => {
    if (e.name.startsWith('.') || e.name === 'node_modules') return [];
    const p = path.join(dir, e.name);
    return e.isDirectory() ? htmlFiles(p) : e.name.endsWith('.html') ? [p] : [];
  });
}
const pages = htmlFiles(root);
for (const p of pages) {
  const html = fs.readFileSync(p, 'utf8'), rel = path.relative(root, p);
  check(!oldBrand.test(html), 'Old branding in ' + rel);
  check(/<title>[^<]*مدرسة العائلة 360[^<]*<\/title>/.test(html), 'School title missing: ' + rel);
  check(html.includes('property="og:site_name" content="' + brand + '"'), 'Share identity missing: ' + rel);
}
const portal = JSON.parse(read('manifest.webmanifest'));
check(portal.name === brand && portal.id === './' && portal.scope === './', 'Portal PWA identity/scope');
for (const icon of portal.icons) {
  const data = fs.readFileSync(path.join(root, icon.src.split('?')[0]));
  check(data.readUInt32BE(16) + 'x' + data.readUInt32BE(20) === icon.sizes, 'PNG size mismatch: ' + icon.src);
}
const catalog = JSON.parse(read('data/catalog.json'));
check(catalog.platform.name_ar === brand && catalog.platform.system_ar === brand, 'Catalog identity');
for (const p of ['apps/1-4/plan-runner-360/app.js', 'apps/1-4/calm-with-me/scenario-engine-v6.js', 'apps/1-4/calm-with-me/link-plan-v5.js', 'apps/1-4/calm-with-me/data/content.js']) {
  check(!/yem1\.com|safe-reels/.test(read(p)), 'Automatic external ecosystem entry: ' + p);
}
for (const p of ['sw.js', 'sw-v24.js']) {
  check(read(p).includes('family-school-v104') && read(p).includes('family-school-360-logo'), 'Portal cache identity: ' + p);
}
check(read('apps/1-4/drawing-writing-foundations/index.html').includes("document.title='لوحة '+userName+' - امسك القلم وارسم | " + brand + "'"), 'Personalized drawing title must retain school identity');
if (failures.length) { failures.forEach(x => console.error('FAIL:', x)); process.exit(1); }
console.log('Family School 360 branding passed: ' + pages.length + ' pages, PWA icons, catalog, cache refresh and independent activity defaults.');
