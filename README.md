# مختبر التطبيق 360 — App 360 Lab

Monorepo للتطبيقات العملية لمنظومة **الريلز الآمن 360**، مصمم للانتقال من المشاهدة إلى **الممارسة ثم الإتقان**، وللنمو من تطبيقات HTML خفيفة إلى أدوات متقدمة وخدمات Node.js وAI من دون تكرار غير منضبط.

## الدخول الرسمي

- البوابة الرئيسية: `index.html`
- بوابات الفئات: `ages/<age-group>/index.html`
- تطبيق الرسم والكتابة: `apps/1-4/drawing-writing-foundations/index.html`

لا توجد مسارات تطبيقات قديمة أو بوابات توافق موازية؛ `apps/<age>/<slug>/` هو المسار الرسمي الوحيد لأي تطبيق.

الفئات:

`1-4` · `4-8` · `8-12` · `12-16` · `16-24` · `24-45` · `45-60` · `60-80`

## الخريطة المعمارية

```text
apps/       التطبيقات الفردية
packages/   كود مشترك reusable
services/   Node/API/AI/media backends
resources/  حزم أصول مشتركة
bundles/    وصفات قدرات قابلة للتركيب
data/       catalog + goals + capabilities
ages/       بوابات العرض حسب العمر
tooling/    أدوات Monorepo
```

## PWA وOffline-first

البوابة الرئيسية نفسها PWA قابلة للتثبيت، وتخزن Shell البوابة وبيانات الفهرس وصفحات الأعمار للعمل بعد أول فتح قدر الإمكان.

كل تطبيق مستقل جديد يُنشأ افتراضيًا مع:

- `manifest.webmanifest`
- `icon.svg` فريد للتطبيق
- `sw.js`
- زر تثبيت وتحديث
- Offline shell
- تحديث تلقائي للـService Worker مع Network-first للصفحات الحرجة

التطبيقات البسيطة يفضل أن تكون **Offline-first**. التطبيقات التي تعتمد على AI أو خدمات مركزية تعمل محليًا فيما يمكن عمله محليًا، وتعلن بوضوح أي جزء يحتاج اتصالًا.

المصدر الرسمي لتطبيق الرسم ومسك القلم:

```text
apps/1-4/drawing-writing-foundations/
```

وله `app.json` و`package.json` وREADME وصوت وPWA ومزامنة داخل Boundary واضح.

## مصادر الحقيقة

- `data/catalog.json` — فهرس التطبيقات وخارطة الطريق.
- `data/goals.json` — أهداف Safe Reels 360 المرجعية.
- `data/capabilities.json` — Registry للقدرات التقنية والخدمية.
- `bundles/*.json` — تجميع قدرات حسب نوع التطبيق وعمقه.
- `resources/registry.json` — الأصول المشتركة أو المرشحة للمشاركة.
- `apps/<age>/<slug>/app.json` — عقد التطبيق المحلي.

## Monorepo وNode.js

المعتمد للمشاريع التي تحتاج Node هو **pnpm workspaces**:

```bash
corepack enable
pnpm install
pnpm validate
pnpm workspaces:list
```

لا ننشئ `node_modules` وlockfile مستقلين لكل إضافة. Dependency الخاصة بتطبيق أو خدمة تسجل في `package.json` الخاص بها لكن التثبيت والإدارة مركزيان من جذر المستودع. pnpm يعيد استخدام محتوى الحزم ويقلل التكرار، مع السماح باختلاف إصدار مقصود عندما يفرض التوافق ذلك.

## بناء تطبيق جديد

المسار القياسي الوحيد:

```text
apps/<age-group>/<app-slug>/
```

يمكن إنشاء Workspace أولي جاهز للتثبيت وOffline:

```bash
pnpm new:app -- 8-12 stem-code-maker "مختبر STEM والبرمجة والصنع"
```

ثم اضبط goal keys وCapabilities وBundles وحلقة الممارسة قبل التنفيذ.

لفحص سياق تطبيق مسجل:

```bash
pnpm inspect:app -- drawing-writing-foundations
```

## وثائق إلزامية

- `docs/FRAMEWORK_AR.md` — قواعد العمل اليومية.
- `docs/ARCHITECTURE_AR.md` — الطبقات واتجاه Dependencies ومستويات العمق.
- `docs/DEPENDENCY_POLICY_AR.md` — سياسة pnpm والمكتبات المشتركة ومنع الهدر.
- `docs/PWA_OFFLINE_POLICY_AR.md` — التثبيت، Offline، التحديث، والشعارات.
- `docs/APP_SPEC_TEMPLATE_AR.md` — قالب محادثة/مواصفات تطبيق مستقل.
- `docs/ROADMAP_AR.md` — منطق الأولوية.

## التحقق

```bash
node tooling/validate-platform.js
```

GitHub Action باسم **Validate App 360 Lab** يفحص الفئات والأهداف والكتالوج والقدرات والـBundles وروابط التطبيقات الحية وحدود Workspaces.

## القاعدة التصميمية

الفيديو يشرح أو يلهم؛ التطبيق يجب أن يطلب **فعلًا وممارسة**: رسم، نطق، حل، بناء، ترتيب، محاكاة قرار، تسجيل، مشروع، مراجعة أداء أو نشاط واقعي خارج الشاشة. التقنية والعمق يخدمان الممارسة، لا العكس.
