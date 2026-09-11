# قالب مواصفات تطبيق جديد — مختبر التطبيق 360

هذا القالب هو عقد بدء أي محادثة مستقلة لبناء تطبيق واحد. الهدف: **ممارسة قوية + حدود واضحة + إعادة استخدام محسوبة + عدم تلويث بقية المستودع.**

## 1. ما الذي يجب قراءته أولًا؟

- `docs/FRAMEWORK_AR.md`
- `docs/ARCHITECTURE_AR.md`
- `docs/DEPENDENCY_POLICY_AR.md`
- `data/catalog.json`
- `data/goals.json`
- `data/capabilities.json`
- `bundles/README.md`
- `apps/<AGE>/<SLUG>/README.md` و`app.json` إن كان التطبيق موجودًا

إذا كان التطبيق يحتاج Node/Backend اقرأ أيضًا `services/README.md`.

## 2. حدود المهمة

- اعمل داخل `apps/<AGE>/<SLUG>/` فقط، إلا إذا كان المطلوب Extraction واضحًا إلى `packages/`, `resources/`, أو `services/`.
- لا تستورد كودًا من تطبيق آخر.
- لا تنسخ مكتبة موجودة في Package مشتركة.
- لا تضف Backend فقط لأن ذلك ممكن؛ أضفه عند وجود سبب تقني حقيقي.
- المسار `/1-4/` Legacy redirect فقط؛ تطبيق الرسم الرسمي في `apps/1-4/drawing-writing-foundations/`.

## 3. بطاقة التطبيق قبل التنفيذ

```yaml
id: <stable-unique-id>
slug: <english-kebab-case>
age_group: <1-4|4-8|8-12|12-16|16-24|24-45|45-60|60-80>
title_ar: <عنوان واضح>
status: planned
kind: <goal_aligned|modern_extension|hybrid>
priority: <1|2|3>
depth: <lite|standard|advanced|expert>
runtime_profile: <static-web|legacy-web|pwa|hybrid-web-service>
goal_keys:
  - <goal-key>
capabilities:
  - <capability-id>
bundles:
  - <bundle-id>
entry_path: apps/<age>/<slug>/index.html
```

## 4. النتيجة العملية

أجب قبل كتابة الكود:

- ماذا سيصبح المستخدم قادرًا على **فعله**؟
- ما Artifact أو سلوك يمكن ملاحظته؟
- كيف نعرف أنه تحسن؟
- لماذا هذا تطبيق، وليس فيديو إضافيًا فقط؟

## 5. حلقة الممارسة

صغ دورة قصيرة، مثال:

`مهمة → محاولة → تغذية راجعة → تصحيح → تكرار أصعب قليلًا → تطبيق واقعي`

يمكن أن يكون الناتج: رسم، نطق، قرار، تلخيص، نموذج، كود، تسجيل، ترتيب، ميزانية افتراضية، عرض، مشروع أو نشاط خارج الشاشة.

## 6. العمق والتدرج

### Depth تقني

- `lite`: لا Backend، أقل Dependencies، ممارسة واحدة مركزة.
- `standard`: PWA/صوت/حفظ/عدة مستويات.
- `advanced`: مزامنة/تسجيل/تقييم/قدرات متعددة.
- `expert`: خدمات Node/AI/Processing/Accounts أو State مشترك.

### Difficulty تربوي

يمكن أن يحتوي التطبيق على درجات ممارسة مستقلة عن Depth التقني:

```text
1. نموذج وإرشاد قوي
2. مساعدة جزئية
3. محاولة مستقلة
4. تحد جديد/تطبيق واقعي
```

لا تخلط بين «تطبيق تقني عميق» و«ممارسة صعبة»؛ هما محوران مختلفان.

## 7. اختيار القدرات قبل المكتبات

ابدأ من `data/capabilities.json` و`bundles/`.

إذا احتجت شيئًا غير موجود:

1. هل هو خاص بهذا التطبيق؟ أبقه محليًا.
2. هل يوجد مستهلك ثانٍ حقيقي؟ استخرجه Package.
3. هل يحتاج Secret/Server/Processing/Shared state؟ Service.
4. هل هو أصل مشترك؟ Resource pack.

لا تبنِ «مكتبة مشتركة» من أجل احتمال مستقبلي فقط.

## 8. Node.js والDependencies

إذا احتاج التطبيق Build أو Node tooling:

- أضف `package.json` داخل التطبيق.
- Dependency الخاصة بالتطبيق تسجل هناك.
- نفذ `pnpm install` من **جذر المستودع**.
- استخدم `workspace:*` لأي Package داخلية.
- لا تنشئ lockfile خاصًا بالتطبيق.

إذا احتجت Backend، أنشئ `services/<service>/` كWorkspace مستقل بدل وضع Secrets في Frontend.

## 9. تجربة المستخدم

حدد:

- أول شاشة.
- أقل عدد خطوات لبدء الممارسة.
- العودة/الإغلاق.
- التقدم والحفظ.
- Offline إن كان مطلوبًا.
- الصوت وFallback.
- RTL/LTR.
- Keyboard/Touch/Mouse حسب الفئة.
- Accessibility والأحجام المناسبة للعمر.
- سلوك Portrait/Landscape إذا كان مهمًا.

## 10. Compatibility Matrix

```yaml
mobile: true
tablet: true
desktop: true
legacy_android_required: false
minimum_test_targets:
  - modern Chrome
  - modern Android tablet
```

إذا كان `legacy_android_required: true` يجب تحديد الجهاز/الفئة المتوقعة ومسارات Fallback. لا نحمل Polyfills Legacy على كل تطبيقات المنصة.

## 11. الصوت والوسائط

- TTS لا يكون نقطة فشل وحيدة إذا كان الصوت أساسيًا.
- Recorded audio وPCM fallback يضافان فقط عند الحاجة.
- لا تنسخ حزم صوت تطبيق الرسم مباشرة إلى تطبيق آخر؛ إذا ظهر مستهلك ثانٍ، نفذ Resource/Package extraction رسميًا.
- الوسائط الكبيرة تُحمّل عند الطلب قدر الإمكان.

## 12. الخصوصية والأمان

- Local-first افتراضيًا.
- لا ترسل اسم الطفل/صوته/رسمه لخدمة خارجية لمجرد تحسين UX.
- AI الخارجي يمر عبر Service عندما يحتاج API key.
- استخدم بيانات وهمية في محاكاة المال/الحسابات/الاحتيال.
- لا تخزن Secrets في GitHub أو Frontend.

## 13. الملفات الأساسية

```text
apps/<age>/<slug>/
├─ index.html
├─ app.json
├─ package.json
└─ README.md
```

اختياري حسب الحاجة:

```text
src/
assets/
audio/
data/
tooling/
test/
manifest.json
sw.js
```

## 14. app.json المقترح

```json
{
  "schema_version": "1.0",
  "id": "...",
  "slug": "...",
  "title_ar": "...",
  "age_group": "8-12",
  "version": 1,
  "status": "planned",
  "kind": "goal_aligned",
  "goal_keys": [],
  "entry_path": "apps/8-12/.../index.html",
  "runtime_profile": "static-web",
  "depth": "lite",
  "capabilities": ["storage.local"],
  "bundles": ["static-core"],
  "practice_model_ar": "مهمة ← محاولة ← تغذية راجعة ← تكرار",
  "compatibility": {
    "mobile": true,
    "tablet": true,
    "desktop": true,
    "legacy_android_required": false
  }
}
```

## 15. Definition of Done

قبل `live`:

- [ ] المسار المباشر يعمل.
- [ ] حلقة الممارسة مكتملة من البداية للنهاية.
- [ ] `app.json` مطابق لما تم بناؤه فعليًا.
- [ ] لا اعتماد على ملفات تطبيق آخر.
- [ ] Dependencies مسجلة في Workspace الصحيح.
- [ ] القدرات/Bundles المعلنة حقيقية وليست مجرد قائمة تجميلية.
- [ ] الأجهزة المطلوبة مختبرة.
- [ ] fallbacks الحرجة تعمل.
- [ ] الخصوصية والأمان موثقان.
- [ ] `data/catalog.json` محدث.
- [ ] `node tooling/validate-platform.js` ينجح.

## 16. Prompt جاهز لمحادثة جديدة

> اعمل داخل مستودع `saddamalkhatabi/app360` على تطبيق `<TITLE>` للفئة `<AGE>` ومساره `apps/<AGE>/<SLUG>/`. اقرأ أولًا `docs/FRAMEWORK_AR.md` و`docs/ARCHITECTURE_AR.md` و`docs/DEPENDENCY_POLICY_AR.md` و`docs/APP_SPEC_TEMPLATE_AR.md` و`data/catalog.json` و`data/goals.json` و`data/capabilities.json`. طوّر هذا التطبيق فقط. الهدف العملي هو `<PRACTICE OUTCOME>`. اربطه بالـgoal keys `<GOALS>` وحدد Depth وRuntime profile والCapabilities قبل اختيار المكتبات. لا تنسخ كودًا أو أصولًا من تطبيق آخر؛ إذا ظهر احتياج مشترك حقيقي استخرج Package/Resource/Service وفق إطار المنصة. بعد التنفيذ حدّث الكتالوج وشغّل `node tooling/validate-platform.js`.
