from pathlib import Path
import json, re, shutil

ROOT = Path('.')
SRC = ROOT / '1-4'
DST = ROOT / 'apps' / '1-4' / 'drawing-writing-foundations'

if not SRC.exists():
    raise SystemExit('source 1-4 directory not found')
if DST.exists():
    raise SystemExit('destination already exists; refusing unsafe repeat migration')

DST.parent.mkdir(parents=True, exist_ok=True)
shutil.move(str(SRC), str(DST))

# Remove historical runtime snapshots that are not referenced by the current V21 page.
index_path = DST / 'index.html'
html = index_path.read_text(encoding='utf-8')
if 'audio-v21.js?v=21' not in html:
    raise RuntimeError('current app does not reference audio-v21; stop migration')
for old in ['audio-v13.js','audio-v14.js','audio-v15.js','audio-v17.js','audio-v18.js','audio-v20.js']:
    p = DST / old
    if p.exists():
        p.unlink()

# Migration is a new app build because path/scope/cache change, even though learning behavior is preserved.
html = html.replace('لوحة الطفل - امسك القلم وارسم v21', 'لوحة الطفل - امسك القلم وارسم v22')
html = html.replace('var LOCAL=21', 'var LOCAL=22')
index_path.write_text(html, encoding='utf-8')

# Update collaboration share fallback to canonical app path.
sync = DST / 'sync-v10-extra.js'
s = sync.read_text(encoding='utf-8')
s = s.replace(
    'https://raw.githack.com/saddamalkhatabi/app360/main/1-4/index.html',
    'https://raw.githack.com/saddamalkhatabi/app360/main/apps/1-4/drawing-writing-foundations/index.html'
)
sync.write_text(s, encoding='utf-8')

# New service worker scope/cache for canonical app path.
(DST / 'sw.js').write_text("""var CACHE='app360-drawing-writing-v22';
var SHELL=['./manifest.json','./sync-v10-extra.js','./ui-v11.js?v=19','./audio-pcm-v18.js?v=18','./audio-v21.js?v=21','./version.json','./app.json'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return Promise.all(SHELL.map(function(u){return c.add(u).catch(function(){return null})}))}));self.skipWaiting&&self.skipWaiting()});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.map(function(k){if(k!==CACHE&&(k.indexOf('app360-drawing-writing-')===0||k.indexOf('app360-1-4-')===0))return caches.delete(k)}))}).then(function(){return self.clients&&self.clients.claim?self.clients.claim():null}))});
self.addEventListener('message',function(e){if(e.data&&e.data.type==='SKIP_WAITING'&&self.skipWaiting)self.skipWaiting()});
function net(req){try{return fetch(req,{cache:'no-store'})}catch(e){return fetch(req)}}
self.addEventListener('fetch',function(e){if(!e.request||e.request.method!=='GET')return;var u=e.request.url||'';var base='/apps/1-4/drawing-writing-foundations/';var important=e.request.mode==='navigate'||u.indexOf(base+'index.html')>=0||u.indexOf(base+'version.json')>=0||u.indexOf(base+'audio-v21.js')>=0||u.indexOf(base+'audio-pcm-v18.js')>=0||u.indexOf(base+'ui-v11.js')>=0||u.indexOf(base+'sync-v10-extra.js')>=0;if(important){e.respondWith(net(e.request).then(function(resp){if(resp&&resp.ok){var copy=resp.clone();caches.open(CACHE).then(function(c){c.put(e.request,copy)})}return resp}).catch(function(){return caches.match(e.request).then(function(r){return r||caches.match('./index.html')})}));return}e.respondWith(net(e.request).then(function(resp){if(resp&&resp.ok){var copy=resp.clone();caches.open(CACHE).then(function(c){c.put(e.request,copy)})}return resp}).catch(function(){return caches.match(e.request)}))});
""", encoding='utf-8')

# Version metadata.
vp = DST / 'version.json'
v = json.loads(vp.read_text(encoding='utf-8'))
v['build'] = 22
v['updated'] = '2026-09-12'
v['appId'] = 'a1-drawing-writing'
v['canonicalPath'] = 'apps/1-4/drawing-writing-foundations/'
v['migration'] = 'V22 monorepo canonical path migration; learning behavior preserved'
vp.write_text(json.dumps(v, ensure_ascii=False, indent=2), encoding='utf-8')

# App workspace metadata.
app_manifest = {
  'schema_version': '1.0',
  'id': 'a1-drawing-writing',
  'slug': 'drawing-writing-foundations',
  'title_ar': 'لوحة الطفل للرسم والكتابة المبكرة',
  'age_group': '1-4',
  'version': 22,
  'status': 'live',
  'kind': 'hybrid',
  'goal_keys': [
    'learner-1-4-safe-sensory-motor-play',
    'learner-1-4-routines-independence-first-attempts',
    'learner-1-4-confidence-first-attempts-and-kind-persistence',
    'coach-1-4-safe-play-activity-design-and-independence'
  ],
  'entry_path': 'apps/1-4/drawing-writing-foundations/index.html',
  'runtime_profile': 'legacy-web',
  'depth': 'advanced',
  'bundles': ['legacy-child','collaborative'],
  'capabilities': [
    'storage.local','audio.tts','audio.recorded','audio.legacy-pcm','pwa.offline',
    'compat.legacy-web','sync.peer','evaluation.heuristic'
  ],
  'practice_model_ar': 'شاهد النموذج ← تتبع ← جرّب وحدك ← تشجيع ← كرر',
  'compatibility': {
    'mobile': True, 'tablet': True, 'desktop': True,
    'legacy_android_required': True,
    'known_legacy_target': 'Big TAB HD / Android 4.4.x class devices'
  },
  'ownership': {
    'app_specific_code_stays_here': True,
    'shared_extraction_policy': 'extract only when a second real consumer exists'
  }
}
(DST / 'app.json').write_text(json.dumps(app_manifest, ensure_ascii=False, indent=2), encoding='utf-8')

(DST / 'package.json').write_text(json.dumps({
  'name':'@app360/app-drawing-writing-foundations',
  'version':'0.22.0',
  'private': True,
  'description':'Early drawing, pencil grip and handwriting practice app for App 360 Lab ages 1-4',
  'app360': {'appId':'a1-drawing-writing','ageGroup':'1-4','runtimeProfile':'legacy-web'},
  'scripts': {'validate':'node -e "JSON.parse(require(\'fs\').readFileSync(\'app.json\',\'utf8\')); console.log(\'app.json OK\')"'}
}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

(DST / 'README.md').write_text("""# لوحة الطفل للرسم والكتابة المبكرة

التطبيق العملي العامل للفئة **1–4** في مختبر التطبيق 360.

## المسار الرسمي

`apps/1-4/drawing-writing-foundations/`

المسار التاريخي `/1-4/` أصبح بوابة توافق فقط تعيد التوجيه إلى هذا المسار. لا تضف كودًا جديدًا في المسار التاريخي.

## ماذا يملك هذا التطبيق؟

- محرك الرسم وإصلاح تقطيع القلم.
- حماية لمس اليد وتوافق Touch قديم.
- الخطوط والأشكال والحروف والأرقام والرسم الحر.
- الصوت الآلي + التسجيلات + PCM fallback للأجهزة القديمة.
- حزم أسماء الأطفال والألوان.
- PWA/Offline خاص بهذا التطبيق.
- الجلسات الجماعية Peer/WebRTC والتقييم التعليمي التقريبي.

## لماذا لم نستخرج الصوت والمزامنة إلى packages الآن؟

لأنهما حتى هذه اللحظة مستخدمان فعليًا هنا فقط. عند بناء تطبيق ثانٍ يحتاج نفس Runtime، نستخرج الجزء المشترك إلى `packages/` مع اختبارات توافق، بدل نسخ الكود أو بناء abstraction غير مستخدم.

## ملفات مهمة

- `index.html` — التطبيق الحالي.
- `app.json` — عقد التطبيق داخل المنصة.
- `version.json` — إصدار Runtime الحالي.
- `audio-v21.js` — Runtime الصوت الحالي.
- `audio-pcm-v18.js` — PCM fallback المستخدم حاليًا.
- `audio/` — التسجيلات والسجل وPCM packs.
- `sync-v10-extra.js` — المزامنة الجماعية الحالية.
- `ui-v11.js` — طبقة UI الحالية (تراكم إصدارات تاريخي، لا يعاد تسميتها أثناء هذا النقل فقط).

## التطوير اللاحق

أي محادثة تعمل على هذا التطبيق فقط يجب أن تقرأ `app.json` وهذا README و`docs/FRAMEWORK_AR.md`، وألا تعدل تطبيقات أخرى. إذا ظهر مكون قابل لإعادة الاستخدام في تطبيق ثانٍ، اتبع سياسة الاستخراج في `packages/README.md`.
""", encoding='utf-8')

# Legacy compatibility gateway. Keeps old bookmarks/PWA start_url alive without duplicating the app.
legacy = ROOT / '1-4'
legacy.mkdir(parents=True, exist_ok=True)
legacy_target = '../apps/1-4/drawing-writing-foundations/index.html'
(legacy / 'index.html').write_text("""<!doctype html>
<html lang="ar" dir="rtl"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Cache-Control" content="no-cache, no-store, must-revalidate"><meta http-equiv="refresh" content="0;url=../apps/1-4/drawing-writing-foundations/index.html?v=22"><title>تم نقل لوحة الطفل</title></head><body><p>تم نقل التطبيق إلى مكانه الرسمي داخل مختبر التطبيق 360. <a id="go" href="../apps/1-4/drawing-writing-foundations/index.html?v=22">فتح التطبيق</a></p><script>(function(){var t='../apps/1-4/drawing-writing-foundations/index.html';var q=location.search||'';q=q.replace(/([?&])v=\\d+(&?)/,'$1').replace(/[?&]$/,'');if(q){t+=q+'&v=22'}else{t+='?v=22'}location.replace(t)})();</script></body></html>
""", encoding='utf-8')
(legacy / 'manifest.json').write_text(json.dumps({
  'name':'لوحة الطفل - مسار توافق', 'short_name':'لوحة الطفل',
  'start_url':'./index.html', 'scope':'./', 'display':'standalone',
  'background_color':'#ffffff','theme_color':'#0f8f8a','orientation':'any','lang':'ar','dir':'rtl'
}, ensure_ascii=False, indent=2), encoding='utf-8')
(legacy / 'version.json').write_text(json.dumps({'build':22,'redirect':legacy_target,'legacy':True}, ensure_ascii=False, indent=2), encoding='utf-8')
(legacy / 'sw.js').write_text("""var CACHE='app360-legacy-1-4-v22';var TARGET='../apps/1-4/drawing-writing-foundations/index.html?v=22';self.addEventListener('install',function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.add('./index.html').catch(function(){})}));self.skipWaiting&&self.skipWaiting()});self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(keys){return Promise.all(keys.map(function(k){if(k!==CACHE&&k.indexOf('app360-1-4-')===0)return caches.delete(k)}))}).then(function(){return self.clients&&self.clients.claim?self.clients.claim():null}))});self.addEventListener('fetch',function(e){if(!e.request||e.request.method!=='GET')return;if(e.request.mode==='navigate'){e.respondWith(fetch(e.request,{cache:'no-store'}).catch(function(){return caches.match('./index.html')}))}});
""", encoding='utf-8')
(legacy / 'README.md').write_text("""# Legacy redirect for /1-4/

هذا المسار محفوظ فقط للتوافق مع الروابط القديمة وPWA المثبت سابقًا. المصدر الرسمي للتطبيق:

`apps/1-4/drawing-writing-foundations/`

لا تضف Features أو Assets هنا.
""", encoding='utf-8')

# Update catalog live route and capability metadata.
cp = ROOT / 'data' / 'catalog.json'
cat = json.loads(cp.read_text(encoding='utf-8'))
found = False
for app in cat.get('apps', []):
    if app.get('id') == 'a1-drawing-writing':
        found = True
        app['href'] = 'apps/1-4/drawing-writing-foundations/index.html?v=22'
        app['manifest'] = 'apps/1-4/drawing-writing-foundations/app.json'
        app['runtime_profile'] = 'legacy-web'
        app['depth'] = 'advanced'
        app['bundles'] = ['legacy-child','collaborative']
        app['capabilities'] = ['storage.local','audio.tts','audio.recorded','audio.legacy-pcm','pwa.offline','compat.legacy-web','sync.peer','evaluation.heuristic']
if not found:
    raise RuntimeError('a1-drawing-writing not found in catalog')
cat['updated'] = '2026-09-12'
cp.write_text(json.dumps(cat, ensure_ascii=False, indent=2), encoding='utf-8')

# Root README: canonical location wording.
rp = ROOT / 'README.md'
r = rp.read_text(encoding='utf-8')
r = r.replace('التطبيق العامل الحالي للرسم والكتابة للفئة 1–4: `1-4/index.html`', 'التطبيق العامل للرسم والكتابة للفئة 1–4: `apps/1-4/drawing-writing-foundations/index.html`')
r = r.replace('> ملاحظة: `/1-4/` تطبيق تاريخي عامل وله توافقات وصوت خاص؛ يبقى في مكانه حتى مهمة ترحيل مستقلة، ولا ينقل أثناء تطوير تطبيق آخر.', '> ملاحظة: `/1-4/` أصبح مسار توافق يعيد التوجيه فقط. المصدر الرسمي هو `apps/1-4/drawing-writing-foundations/`.')
rp.write_text(r, encoding='utf-8')

print('V22 monorepo migration prepared successfully')
