'use strict';

const fs = require('fs');
const path = require('path');
const { AGE_GROUPS } = require('../packages/contracts/src/index.cjs');

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
const root = path.resolve(__dirname, '..');
const template = path.join(root, 'apps', '_template');
const target = path.join(root, 'apps', age, slug);
if (fs.existsSync(target)) {
  console.error('Target already exists:', path.relative(root, target));
  process.exit(1);
}
fs.mkdirSync(path.dirname(target), {recursive:true});
fs.cpSync(template, target, {recursive:true});

const appPath = path.join(target, 'app.json');
const app = JSON.parse(fs.readFileSync(appPath, 'utf8'));
app.id = `app-${age}-${slug}`;
app.slug = slug;
app.title_ar = title;
app.age_group = age;
app.entry_path = `apps/${age}/${slug}/index.html`;
fs.writeFileSync(appPath, JSON.stringify(app, null, 2) + '\n');

const pkgPath = path.join(target, 'package.json');
const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
pkg.name = `@app360/app-${slug}`;
pkg.description = `${title} - App 360 Lab`;
pkg.app360.appId = app.id;
pkg.app360.ageGroup = age;
fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');

const indexPath = path.join(target, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
html = html.replace(/<title>[^<]*<\/title>/, `<title>${title} | مختبر التطبيق 360</title>`);
html = html.replace(/<h1>اسم التطبيق<\/h1>/, `<h1>${title}</h1>`);
html = html.replace('مختبر التطبيق 360 · الفئة العمرية', `مختبر التطبيق 360 · ${age}`);
fs.writeFileSync(indexPath, html);

console.log('Created:', path.relative(root, target));
console.log('Next: fill goal_keys/capabilities/bundles, define the practice loop, then add/update its catalog record.');
