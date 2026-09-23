# App360 Data Core

خدمة بيانات Node مستقلة عن تطبيقات PWA الستاتيكية. تبقى تطبيقات `apps/**` قابلة للعمل كضيف ومن دون هذه الخدمة، بينما تضيف Data Core عند نشرها خلف `/api/app360` هوية الطفل/المتدرب، مزامنة وقت الاستخدام، مكتبة المحتوى الشخصي، والخطط والبيانات المركزية التي تحتاج حسابًا.

## الحالة الفعلية

- SQLite + Knex ومخططات المحتوى والجلسات والخطط تعمل محليًا عبر الاختبارات.
- وضع الضيف لا يحتاج الخادم: الوقت والمسودات تبقى في المتصفح.
- API App360 موجود في `src/http-server.js`، لكنه لا يصبح خدمة إنتاجية إلا بعد تشغيله على الخادم.
- تسجيل Safe Reels 360 لا يُفترض أو يُحاكى: يصبح فعالًا فقط عند ضبط `APP360_SAFE_REELS_AUTH_URL` لواجهة الدخول الحقيقية في نظام الريلز الآمن.
- لا يحفظ App360 رمز PIN في SQLite أو localStorage. يمر إلى Safe Reels مرة واحدة، ثم يصدر App360 Session Token عشوائيًا ويخزن SHA-256 له فقط.

## لماذا منفصلة عن pnpm workspace؟

`better-sqlite3` إضافة Native. تبقى هذه الخدمة مستقلة في `pnpm-workspace.yaml` ويثبت اعتمادها داخل مجلدها، حتى لا يصبح تشغيل تطبيقات الويب مشروطًا ببناء Native module.

## الإصدارات المثبتة

- `knex: 3.3.0`
- `better-sqlite3: 11.10.0`
- Node: `>=20 <22`

## تشغيل محلي

```bash
cd services/app360-data-core
npm install
npm run reset
npm run smoke
npm run smoke:session
npm run serve
```

يمكن تغيير ملف القاعدة:

```bash
APP360_DB_FILE=/path/to/app360.sqlite3 npm run migrate
```

## ربط دخول الريلز الآمن 360

اضبط عنوان واجهة التحقق الفعلية التي تستخدم آلية البحث + PIN:

```bash
APP360_SAFE_REELS_AUTH_URL=https://your-safe-reels-host/internal/app360-login \
APP360_SAFE_REELS_AUTH_TOKEN=server-side-secret-if-required \
APP360_ALLOWED_ORIGINS=https://yem1.com \
npm run serve
```

`APP360_SAFE_REELS_AUTH_TOKEN` اختياري ويبقى على الخادم فقط. الـAdapter يرسل `query`, `pin`, و`audience=app360` ثم يطبع النتيجة إلى هوية App360 داخلية. إذا كان عقد Safe Reels الفعلي مختلفًا، عدّل `src/safe-reels-adapter.js` وفق العقد الحقيقي بدل اختراع حقول في الواجهة.

## API

- `GET /api/app360/health`
- `POST /api/app360/auth/child-login`
- `POST /api/app360/auth/logout`
- `POST /api/app360/usage/batch`
- `GET /api/app360/me/dashboard`
- `POST /api/app360/content/batch`
- `GET /api/app360/content?app_id=...`

كل المسارات بعد تسجيل الدخول تستخدم `Authorization: Bearer <App360 session token>`.

## نموذج الوقت

الواجهة تجمع وقت الاستخدام الفعلي فقط عندما تكون الصفحة ظاهرة، وتحتفظ بسجل مستقل للضيف ولكل مستخدم. الدفعات لها `batch_id` ويستخدم الخادم `usage_receipts` لمنع مضاعفة الوقت عند إعادة الإرسال بعد انقطاع الشبكة. `app_usage_daily` يعطي تقريرًا سريعًا لكل تطبيق ولكل يوم.

## المحتوى الشخصي

`content_items.owner_user_id` هو أساس الملكية. أضافت migration 007:

- `client_key` لربط نفس التصميم المحلي بنفس العنصر السحابي.
- `visibility=private` افتراضيًا.
- `moderation_status=not_submitted` افتراضيًا.
- `origin_device_id` لمعرفة مصدر المزامنة دون ربطه ببيانات شخصية إضافية.

في `screen-to-move` تبقى الألعاب والأوراق قابلة للحفظ محليًا للضيف، لكن «مكتبتي» السحابية والمزامنة بين الأجهزة تتطلب حسابًا.

## الخصوصية

تفاصيل مشاعر الطفل أو مراجعات المرافق لا ترفع تلقائيًا لمجرد تسجيل الدخول. السياسة الحالية تزامن وقت الاستخدام المركزي، وتبقي بيانات `calm-with-me` الحساسة محلية ما لم تُبنَ لاحقًا موافقة صريحة للمرافق. الملفات والصور الكبيرة تحفظ في `file-store` بدل Base64 داخل SQLite عند تفعيل رفعها خادميًا.

## المجلدات

- `migrations/`: بنية القاعدة.
- `seeds/`: هويات تجريبية وسجل التطبيقات وعقود المحتوى.
- `src/session-repository.js`: جلسات الهوية، الوقت، Dashboard، والمحتوى الشخصي.
- `src/safe-reels-adapter.js`: Adapter الربط مع دخول الريلز الآمن.
- `src/http-server.js`: API خفيف فوق Data Core.
- `src/repository.js`: حزم AI والجلسات/الأحداث العامة وoutbox.
- `src/file-store.js`: الملفات على القرص مع `sha256`.
- `var/`: قاعدة التطوير والملفات المحلية ولا ترفع للمستودع.

الحسابات الموجودة في seeds للتجربة والاختبار فقط، وليست حسابات إنتاج.
