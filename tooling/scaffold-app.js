'use strict';

const fs = require('fs');
const path = require('path');
const { AGE_GROUPS } = require('../packages/contracts/src/index.cjs');
const { writeIconPngs } = require('./icon-generator.js');

const [age, slug, ...titleParts] = process.argv.slice(2);
const title = titleParts.join(' ').trim();
if (!age || !slug || !title) {
  console.error('Usage: node tooling/scaffold-app.js <age> <slug> <Arabic title>');
  process.exit(1);
}
if (!AGE_GROUPS.includes(age)) {
  console.error('Invalid age group:', age);
  process.exit(1);
}
if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
  console.error('Slug must be lowercase kebab-case.');
  process.exit(1);
}

const palette = {
  '1-4':'#0f8f8a','4-8':'#2f8f5b','8-12':'#3569b8','12-16':'#6850b8',
  '16-24':'#37617a','24-45':'#315d64','45-60':'#4f7654','60-80':'#826b32'
};
const accent = '#ffd54f';
const primary = palette[age] || '#0f8f8a';
const root = path.resolve(__dirname, '..');
const template = path.join(root, 'apps', '_template');
const target = path.join(root, 'apps', age, slug);
let blueprint = null;
if (fs.existsSync(target)) {
  const manifestFile = path.join(target, 'app.json');
  const allowed = ['app.json', 'README.md', 'BUILD_SPEC.md', 'PROMPT_AR.md', 'PREBUILD_REQUIREMENTS_AR.md'];
  if (fs.existsSync(manifestFile)) blueprint = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  if (!blueprint || blueprint.scaffold_state !== 'blueprint-only' || blueprint.age_group !== age || blueprint.slug !== slug || fs.readdirSync(target).some(name => !allowed.includes(name))) {
    console.error('Target already contains implementation; refusing to overwrite:', path.relative(root, target));
    process.exit(1);
  }
}
fs.mkdirSync(path.dirname(target), {recursive:true});
fs.cpSync(template, target, {recursive:true, force:false, errorOnExist:false});

const relBase = `apps/${age}/${slug}`;
const appPath = path.join(target, 'app.json');
const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));
app.id = `app-${age}-${slug}`;
if (blueprint) app.id = blueprint.id;
app.slug = slug;
app.title_ar = title;
app.age_group = age;
if (blueprint) {
  app.scaffold_state = 'implementation-started';
  app.title_ar = blueprint.title_ar;
}
app.entry_path = `${relBase}/index.html`;
app.manifest_path = `${relBase}/manifest.webmanifest`;
app.icon_path = `${relBase}/icon.svg`;
app.capabilities = Array.isArray(app.capabilities) ? app.capabilities : [];
if (!app.capabilities.includes('ai.content-import')) app.capabilities.push('ai.content-import');
app.branding = app.branding || {};
app.branding.theme_color = primary;
app.branding.accent_color = accent;
app.branding.raster_icons = [`${relBase}/icon-192.png`, `${relBase}/icon-512.png`];
fs.writeFileSync(appPath, JSON.stringify(app, null, 2) + '\n');

const pkgPath = path.join(target, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.name = `@app360/app-${slug}`;
pkg.description = `${title} - App 360 Lab`;
pkg.app360.appId = app.id;
pkg.app360.ageGroup = age;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const manifestPath = path.join(target, 'manifest.webmanifest');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
manifest.name = `${title} - مختبر التطبيق 360`;
manifest.short_name = title.length > 22 ? title.slice(0, 22) : title;
manifest.description = `${title}: تطبيق عملي من مختبر التطبيق 360 لنظام الريلز الآمن 360.`;
manifest.theme_color = primary;
manifest.icons = [
  {src:'icon-192.png',sizes:'192x192',type:'image/png',purpose:'any maskable'},
  {src:'icon-512.png',sizes:'512x512',type:'image/png',purpose:'any maskable'},
  {src:'icon.svg',sizes:'any',type:'image/svg+xml',purpose:'any maskable'}
];
fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');

const indexPath = path.join(target, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/<title>[^<]*<\/title>/, `<title>${title} | مختبر التطبيق 360</title>`);
html = html.replace(/<h1>اسم التطبيق<\/h1>/, `<h1>${title}</h1>`);
html = html.replace('مختبر التطبيق 360 · الفئة العمرية', `مختبر التطبيق 360 · ${age}`);
html = html.replace(/<meta name="theme-color" content="[^"]+">/, `<meta name="theme-color" content="${primary}">`);
html = html.replace(/\.head\{background:#0f8f8a/, `.head{background:${primary}`);
if (!html.includes('app360-ai-shell.js')) html = html.replace('</body>', '<script src="../../../assets/js/app360-ai-shell.js?v=2"></script>\n</body>');
fs.writeFileSync(indexPath, html);

const iconPath = path.join(target, 'icon.svg');
let icon = fs.readFileSync(iconPath, 'utf8');
const mark = (title.replace(/\s+/g,'').charAt(0) || slug.charAt(0).toUpperCase());
const xmlTitle = title.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
icon = icon.replace('<title id="title">اسم التطبيق</title>', `<title id="title">${xmlTitle}</title>`)
  .replace('fill="#0f8f8a"','fill="'+primary+'"')
  .replace('>A</text>','>'+mark+'</text>');
fs.writeFileSync(iconPath, icon);
writeIconPngs(target,{primary,accent,seed:`${age}:${slug}:${title}`});

const swPath = path.join(target, 'sw.js');
let sw = fs.readFileSync(swPath, 'utf8');
sw = sw.replace("var CACHE='app360-template-v2';", `var CACHE='app360-app-${slug}-v2';`)
  .replace("var CACHE='app360-template-v1';", `var CACHE='app360-app-${slug}-v2';`)
  .replace("'./icon.svg'", "'./icon.svg','./icon-192.png','./icon-512.png'");
fs.writeFileSync(swPath, sw);

const aiRegistryPath = path.join(root, 'data', 'ai-content-contracts.json');
if (fs.existsSync(aiRegistryPath)) {
  const aiRegistry = JSON.parse(fs.readFileSync(aiRegistryPath, 'utf8'));
  aiRegistry.apps = Array.isArray(aiRegistry.apps) ? aiRegistry.apps : [];
  if (!aiRegistry.apps.some(x => x.app_id === app.id)) {
    aiRegistry.apps.push({
      app_id: app.id,
      slug,
      title_ar: app.title_ar,
      age_group: age,
      content_types: [{
        id: 'generic_card',
        label_ar: 'بطاقة محتوى جديدة',
        supports_images: true,
        supports_audio_script: true,
        fields: ['id','title_ar','body_ar','speech_ar','image_prompt','asset_ref'],
        required_item_fields: ['id','title_ar','body_ar'],
        example: {id:'ai-card-001',title_ar:'عنوان البطاقة',body_ar:'محتوى قصير مناسب للفئة',speech_ar:'نص صوتي اختياري',image_prompt:'وصف صورة مناسبة',asset_ref:'card.png'}
      }],
      helpers: ['العمر أو الاستعداد','الهدف','عدد البطاقات','اللغة','أسلوب العرض','دعم صورة واضحة','نص صوتي قصير','مراجعة بشرية قبل الاعتماد']
    });
    aiRegistry.updated = new Date().toISOString().slice(0,10);
    fs.writeFileSync(aiRegistryPath, JSON.stringify(aiRegistry, null, 2) + '\n');
  }
}

const prebuildPath = path.join(target, 'PREBUILD_REQUIREMENTS_AR.md');
console.log('Created:', path.relative(root, target));
console.log('PWA ready: unique SVG + 192/512 PNG icons, manifest, offline shell and update helper.');
console.log('Navigation ready: every scaffolded app includes the shared 🏠 home button shell.');
console.log('AI ready: ai.content-import capability + initial content contract registered. Refine the generic AI schema for the app domain before activation.');
if (fs.existsSync(prebuildPath)) console.log('Maturity requirements preserved:', path.relative(root, prebuildPath), '— read and implement them before coding beyond the scaffold.');
else console.log('Maturity baseline: read docs/IMPLEMENTATION_MATURITY_BASELINE_AR.md and create app-specific prebuild requirements before live status.');
console.log('Next: fill goal_keys/capabilities/bundles, define practice loop + deep links, refine AI content types, then add/update its catalog record.');