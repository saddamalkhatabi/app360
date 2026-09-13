# إطار عمل مختبر التطبيق 360

## 1. المهمة

**مختبر التطبيق 360** هو طبقة التطبيق والممارسة في منظومة **الريلز الآمن 360**. الفيديو يشرح ويعرض نموذجًا؛ التطبيق يجعل المستخدم **يفعل ويتدرب ويكرر ويتلقى تغذية راجعة ويتقدم**.

الفئات العمرية الثماني ثابتة:

`1-4` · `4-8` · `8-12` · `12-16` · `16-24` · `24-45` · `45-60` · `60-80`

## 2. مصادر الحقيقة

لا نكرر نفس المعلومة يدويًا في صفحات متعددة.

- `data/goals.json` — أهداف المتعلم والمدرب ومفاتيحها الثابتة.
- `data/catalog.json` — فهرس التطبيقات والأفكار وحالتها وروابطها بالأهداف.
- `data/capabilities.json` — ما القدرات التقنية/الخدمية المتاحة أو المخطط لها.
- `bundles/*.json` — وصفات تجمع القدرات حسب الحاجة والعمق.
- `resources/registry.json` — الأصول المشتركة الفعلية أو المرشحة للمشاركة.
- `apps/<age>/<slug>/app.json` — العقد المحلي لتطبيق واحد.

الواجهة الرئيسية وبوابات الأعمار تقرأ الكتالوج؛ لا تكتب قوائم تطبيقات ثابتة داخلها.

## 3. الهيكل القياسي

```text
app360/
├─ index.html
├─ manifest.webmanifest
├─ sw.js
├─ ages/<age>/index.html
├─ apps/<age>/<slug>/              # التطبيق أو عقد خطته قبل التنفيذ
├─ packages/                       # كود مشترك reusable
├─ services/                       # Node/API/AI/media services
├─ resources/                      # shared media/data packs
├─ bundles/                        # capability compositions
├─ data/                           # catalog/goals/capabilities
├─ assets/                         # Platform shell + branding + shared client helpers
├─ tooling/                        # أدوات المستودع المشتركة
├─ docs/                           # العقود والخطط
├─ package.json
├─ pnpm-workspace.yaml
└─ pnpm-lock.yaml
```

**لا توجد مسارات قديمة موازية للتطبيقات.** المسار الرسمي الوحيد لأي تطبيق هو `apps/<age>/<slug>/`.

المعمارية التفصيلية في `docs/ARCHITECTURE_AR.md`، وسياسة المكتبات في `docs/DEPENDENCY_POLICY_AR.md`، وسياسة PWA في `docs/PWA_OFFLINE_POLICY_AR.md`.

## 4. التطبيق الأول في مكانه الرسمي

تطبيق الرسم ومسك القلم والكتابة المبكرة مصدره الرسمي الوحيد:

```text
apps/1-4/drawing-writing-foundations/
```

ويملك `app.json` و`package.json` وREADME وصوته وPWA والمزامنة داخله. لا ننشئ له Alias أو Compatibility Gateway جديدًا.

## 5. استقلال التطبيقات

كل تطبيق يجب أن يمكن تطويره في محادثة مستقلة:

1. لا يستورد ملفات من تطبيق آخر.
2. يملك `app.json`, `package.json`, `README.md` وهوية PWA عندما يكون تطبيقًا مستقلاً.
3. بياناته وموارده الخاصة تبقى داخله.
4. إذا احتاج تطبيق ثانٍ نفس الكود، نستخرج الجزء المشترك إلى `packages/`.
5. إذا احتاج تطبيق ثانٍ نفس الأصول، ننقلها إلى `resources/` عبر Migration واضحة.
6. إذا احتاج Secret/AI/Processing/Shared state، نستخدم `services/` بدل تكرار Backends.

## 6. قاعدة التجميع والتفريق

### يبقى داخل التطبيق عندما

- خاص بتجربة واحدة.
- له مستهلك واحد فقط.
- استخراج abstraction سيزيد التعقيد أكثر من إعادة الاستخدام.

### ينتقل إلى Package عندما

- له مستهلكان حقيقيان أو أكثر.
- أو هو عقد ثابت للمنصة.
- ويمكنه العمل محليًا بلا Secret/Server state.

### ينتقل إلى Service عندما

- يحتاج Secret أو API key.
- يحتاج معالجة ثقيلة أو Queue.
- يحتاج مزامنة حالة عبر الأجهزة.
- يجب مشاركة مزود واحد بين تطبيقات عديدة.

### ينتقل إلى Resources عندما

- الأصل الصوتي/المرئي/البياني أصبح مشتركًا فعليًا.
- وله Source/License/Version واضح.

## 7. مستويات العمق

كل تطبيق يحدد Depth مناسبًا، وليس مطلوبًا استخدام أقصى Stack دائمًا:

- `lite`: ممارسة خفيفة محلية.
- `standard`: حفظ/PWA/صوت أو تدرج أوسع.
- `advanced`: مزامنة/تقييم/وسائط/قدرات متعددة.
- `expert`: Backend/AI/حسابات/Processing مركزي.

التطبيق البسيط الجيد أفضل من تطبيق Expert لا يحتاجه الهدف.

## 8. Runtime Profiles

- `static-web`
- `legacy-web`
- `pwa`
- `node-service`
- `hybrid-web-service`

دعم الأجهزة القديمة يُعزل في تطبيقات وحزم تحتاجه؛ لا نجبر كل المنصة الحديثة على ES5. تطبيق الرسم الحالي يعلن `legacy-web` لأنه يدعم Big TAB HD وأجهزة مشابهة.

## 9. PWA وOffline والتحديث

البوابة الرئيسية نفسها PWA قابلة للتثبيت. وكل تطبيق مستقل جديد يبدأ من قالب يحتوي Manifest وIcon وService Worker.

المستويات الرسمية:

- `offline-first`: الحلقة الأساسية تعمل كاملة محليًا بعد أول فتح.
- `offline-partial`: الممارسة الأساسية محلية وبعض الخدمات تحتاج إنترنت.
- `online-required`: يستخدم فقط عندما تكون الوظيفة الأساسية نفسها مرتبطة بخدمة بعيدة.

ملفات HTML/JSON الحرجة تستخدم Network-first أو تحققًا دوريًا، بينما الأصول الثابتة يمكن Cacheها. تحديث Service Worker لا يسمح بحلقة Refresh؛ التفعيل يتم مرة واحدة ثم إعادة تحميل مضبوطة.

التفاصيل الإلزامية في `docs/PWA_OFFLINE_POLICY_AR.md`.

## 10. Capabilities وBundles

التطبيق يعلن قدراته:

```json
{
  "capabilities": ["storage.local", "audio.recorded", "pwa.offline"],
  "bundles": ["legacy-child"]
}
```

أمثلة الحزم:

- `static-core`
- `legacy-child`
- `collaborative`
- `ai-assisted`
- `full-learning`

الحزم عقود معمارية؛ ومع توسع المشروع نستطيع جعل Tooling يحلها تلقائيًا إلى Packages/Services/Assets المطلوبة.

## 11. Node.js وMonorepo

أي مشروع Node داخل App أو Service يدخل Workspace الجذر:

```bash
corepack enable
pnpm install
pnpm --filter <workspace-name> dev
```

لا نبني `node_modules` منفصل يدويًا لكل إضافة. لدينا إدارة مركزية وLockfile واحد، مع dedupe ومخزن pnpm المشترك. ومع ذلك نسمح بإصدار Dependency مختلف إذا كان التوافق يفرضه؛ لا نكسر تطبيق Legacy فقط لتحقيق توحيد شكلي.

## 12. دورة بناء التطبيق

```text
هدف/حاجة
→ سلوك قابل للملاحظة
→ Practice loop
→ Feedback
→ تدرج صعوبة
→ Offline/Install/Update profile
→ حفظ/مزامنة عند الحاجة
→ اختبار الأجهزة
→ تحديث catalog
→ Validator
```

التطبيق ليس مقالة ولا Quiz معلومات فقط. الأفضل أن ينتج فعلًا أو Artifact: رسم، نطق، تلخيص، قرار، نموذج، مشروع، ميزانية افتراضية، تسجيل، ترتيب، تجربة خارج الشاشة، إلخ.

## 13. العلاقة مع الأهداف

`goal_keys` تستخدم مفاتيح موجودة في `data/goals.json` ومن نفس العمر.

كل مفتاح له سجل واحد في `goal_links` يوضح `rationale_ar` (النشاط ومساهمته المحددة)، و`evidence_ar` (ناتج أو سلوك نلاحظه)، و`delivery` (مخطط أو متاح بمشاركة المرافق). لا تربط هدف المدرب بمجرد وجود طفل يستخدم التطبيق؛ اشرح فعل المدرب نفسه. العنوان المرجعي والدور يقرآن من goals.json ولا يكرران داخل السجل.

`blueprint` في الكتالوج هو مصدر الناتج وخطوات MVP والقبول والملاءمة. يشغّل `node tooling/build-blueprints.js` لتوليد BUILD_SPEC.md وPROMPT_AR.md ودليل APP_BUILD_INDEX_AR.md. مجلد `blueprint-only` يحوي خطة وعقدًا فقط؛ لا رابط تشغيل ولا ادعاء PWA جاهزة. يبدأ التنفيذ بأداة scaffold-app التي تحفظ الهوية والخطة وتضيف الملفات التشغيلية مرة واحدة. لا تعدّل ملفات الخطط المشتقة يدويًا، ولا يُعاد توليد ملفات التطبيق الحي.

- `goal_aligned`: يخدم هدفًا مباشرة.
- `modern_extension`: مهارة عصرية مهمة لا تحتاج هدفًا مطابقًا حرفيًا.
- `hybrid`: يجمع الاثنين.

لا نعدل الهدف الأصلي فقط كي نجبر فكرة جديدة على المطابقة.

## 14. التطبيقات الحساسة

- الصحة: تعليم وممارسة عامة؛ لا تشخيص أو علاج.
- المال: محاكاة وتعليم؛ لا توصيات مالية شخصية.
- الأطفال: لا Dark Patterns، ولا جمع بيانات زائد، ولا زيادة وقت الشاشة عندما يمكن تحويل المهمة للواقع.
- AI: لا نضع Secrets في Frontend، والمخرجات المهمة لها تحقق بشري أو مصادر حسب السياق.

## 15. محادثة تطوير جديدة

لبناء تطبيق مستقل اقرأ بالترتيب:

1. `docs/FRAMEWORK_AR.md`
2. `docs/ARCHITECTURE_AR.md`
3. `docs/PWA_OFFLINE_POLICY_AR.md`
4. `docs/APP_SPEC_TEMPLATE_AR.md`
5. `data/catalog.json`
6. `data/goals.json`
7. `data/capabilities.json`
8. `apps/<age>/<slug>/app.json` وREADME إن كان موجودًا

ثم اعمل داخل Boundary التطبيق فقط. إذا اكتشفت كودًا مشتركًا، لا تنسخه؛ اقترح/نفذ Extraction واضحة بعد فحص المستهلك الآخر.

## 16. التحقق الآلي

الأمر الرسمي:

```bash
node tooling/validate-platform.js
```

ويفحص العقود الأساسية، الفئات، الأهداف، تغطية الأهداف، القدرات، Bundles، الروابط الحية، Workspaces، وملفات PWA للتطبيقات الحية.

يوجد GitHub Action باسم `Validate App 360 Lab` لتشغيله عند تغييرات المنصة.

## 17. مبدأ العمل طويل المدى

لا نعيد كتابة التطبيقات كلما ظهرت تقنية جديدة. نحافظ على **App identity + goal keys + contracts + canonical path**، ونبدل implementation أو نستخرج Packages/Services تدريجيًا. بذلك نستطيع بناء أدوات خفيفة جدًا وأخرى عميقة وقوية داخل إطار واحد، من دون تكرار أو تشابك غير منضبط.
