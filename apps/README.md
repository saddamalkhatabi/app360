# التطبيقات الفردية في مختبر التطبيق 360

`apps/` هو المكان الرسمي الوحيد لكل تطبيق عملي مستقل.

```text
apps/<age-group>/<app-slug>/
```

مثال التطبيق العامل الحالي:

```text
apps/1-4/drawing-writing-foundations/
```

لا ننشئ مسارات موازية أو مجلدات توافق قديمة للتطبيق نفسه. أي رابط منشور أو سجل في `data/catalog.json` يجب أن يشير إلى هذا المسار القياسي.

## الحد الأدنى لأي تطبيق

```text
index.html
app.json
package.json
README.md
manifest.webmanifest أو manifest.json
icon.svg
sw.js
```

التطبيقات الجديدة الناتجة من `apps/_template/` تكون جاهزة من البداية لـPWA والتثبيت وOffline shell والتحديث التلقائي.

## الاستقلال والمشاركة

الكود الخاص بالتطبيق يبقى داخله. لا ننقل كودًا إلى `packages/` أو أصلًا إلى `resources/` لمجرد توقع إعادة استخدامه؛ تتم الترقية إلى مورد مشترك عند وجود مستهلك ثانٍ حقيقي، مع API واضح واختبارات مستقلة.

لا يوجد App-to-App dependency. إذا احتاج تطبيق وظيفة من تطبيق آخر، استخرج الجزء القابل لإعادة الاستخدام إلى `packages/` عندما تصبح المشاركة حقيقية.

## بدء تطبيق جديد

```bash
pnpm new:app -- <age> <slug> "<العنوان العربي>"
```

ثم اقرأ `docs/FRAMEWORK_AR.md` و`docs/APP_SPEC_TEMPLATE_AR.md` و`docs/PWA_OFFLINE_POLICY_AR.md` قبل توسيع التطبيق.
