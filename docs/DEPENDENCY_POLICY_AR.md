# سياسة Dependencies والمكتبات المشتركة

## الهدف

تقليل هدر المساحة والصيانة والتحديثات الأمنية دون تحويل Monorepo إلى شبكة Dependencies يصعب فهمها.

## مدير الحزم

المعتمد للمشاريع الجديدة التي تحتاج Node.js هو **pnpm workspaces** من جذر المستودع.

```bash
corepack enable
pnpm install
```

لا تشغل `npm install` أو `pnpm install` داخل كل تطبيق مستقل كعادة يومية. التثبيت من الجذر هو الأصل.

## لماذا pnpm؟

- Workspace واحد وLockfile واحد.
- إعادة استخدام محتوى الحزم في مخزن content-addressed بدل نسخ متكررة.
- دعم `workspace:*` للحزم الداخلية.
- Filter لتشغيل تطبيق/خدمة واحدة دون فصلها عن المستودع.
- مناسب لمستودع يكبر إلى عدد كبير من التطبيقات والخدمات.

إعداد `node-linker=hoisted` اختير في هذه المرحلة لتقليل مفاجآت الأدوات القديمة التي تتوقع بنية `node_modules` تقليدية. إذا تغيرت الأدوات لاحقًا يمكن إعادة تقييمه مركزيًا.

## أين أضيف Dependency؟

### Root dev tool

إذا كانت الأداة تخدم المستودع كله مثل Linter/Formatter/Test runner مشترك، أضفها إلى Root devDependencies.

### App Dependency

إذا احتاجها تطبيق واحد فقط، أضفها إلى `apps/<age>/<slug>/package.json`، لكن ثبت من الجذر.

### Service Dependency

إذا احتاجتها خدمة واحدة، أضفها إلى `services/<service>/package.json`.

### Shared Package Dependency

إذا كانت Dependency جزءًا من implementation لحزمة مشتركة، تكون في `packages/<pkg>/package.json`.

## ممنوعات

- نسخ مكتبة JavaScript يدويًا داخل عدة Apps من دون سبب توافق.
- وضع API keys في Frontend.
- الاعتماد على ملفات App آخر بالمسار النسبي.
- إنشاء `vendor/` ضخم لكل تطبيق عندما يمكن Package Workspace واحدة.
- تحديث Major version مشترك بلا اختبار التطبيقات المستهلكة.

## متى نسمح بتكرار إصدار Dependency؟

التوحيد ليس هدفًا مقدسًا. قد نحتفظ بإصدارين إذا:

- تطبيق Legacy لا يعمل بالإصدار الحديث.
- Service يحتاج Major API مختلفًا.
- الترحيل الفوري أعلى مخاطرة من الفائدة.

نسجل السبب في README ونضع خطة إزالة عندما تصبح ممكنة.

## سياسة استخراج Package مشتركة

استخدم **Rule of Two**:

- المستهلك الأول: الكود يبقى داخل التطبيق.
- المستهلك الثاني الحقيقي: قارن الاحتياج، واستخرج الجزء المشترك فقط.
- المستهلك الثالث: ثبت API واختبارات Compatibility للحزمة.

استثناء Rule of Two: العقود المركزية مثل `@app360/contracts` يمكن أن تكون مشتركة من البداية لأنها تمنع اختلاف تعريفات النظام.

## Assets ليست npm packages بالضرورة

الصوت والصور والبيانات الكبيرة لا توضع تلقائيًا داخل Package JS. عندما تصبح مشتركة توضع في `resources/` بحزمة أصول لها Manifest، ويمكن Runtime Package أن يقرأها.

## Versioning داخلي

- App version مستقل عن Platform version.
- Package version مستقل عن App version.
- Service API version مستقل عن Runtime app.
- تغيير مسار/Scope/PWA للتطبيق يستحق Build version جديدًا حتى لو لم تتغير الممارسة.

## أوامر مفيدة

```bash
pnpm workspaces:list
pnpm --filter @app360/app-drawing-writing-foundations validate
pnpm --filter @app360/<service> dev
pnpm validate
```

## التحديثات الأمنية

عندما تدخل Dependencies خارجية فعلية:

1. lockfile يصبح إلزاميًا.
2. Dependabot/Renovate يمكن إضافته مركزيًا.
3. التحديثات تمر Validator واختبارات Workspaces المتأثرة.
4. لا نعمل Upgrade شاملًا لمجرد أن إصدارًا أحدث موجود؛ نقيّم القيمة والمخاطر والتوافق.
