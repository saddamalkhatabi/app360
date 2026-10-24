# تشغيل مدرسة العائلة على PostgreSQL أو SQLite

اختيار المحرك من APP360_DB_CLIENT؛ القيمة الافتراضية sqlite، والقيمة الجديدة postgresql. يدير Knex الاستعلامات والترحيلات والبذور. pg مشغل PostgreSQL، بينما Node 22 يوفر SQLite المدمج دون الحاجة إلى better-sqlite3.

## إعداد PostgreSQL

أضف في Environment Variables أو .env الخاص بالمدرسة، مع وضع كلمة مرور القاعدة الفعلية بين علامتي اقتباس في .env:

```dotenv
APP360_DB_CLIENT=postgresql
APP360_PG_HOST=YOUR_POSTGRES_HOST
APP360_PG_PORT=6432
APP360_PG_DATABASE=YOUR_SCHOOL_DATABASE
APP360_PG_USER=YOUR_SCHOOL_DATABASE_USER
APP360_PG_PASSWORD="YOUR_DATABASE_PASSWORD"
APP360_PG_SSL_MODE=verify-full
APP360_PG_POOL_MAX=4
APP360_FILE_STORAGE=database
APP360_DATA_CORE_ENABLED=1
APP360_ENABLE_SEED_LOGIN=0
APP360_PUBLIC_ORIGIN=https://school.yem1.com
NODE_ENV=production
```

احتفظ بمتغيري APP360_REELS_BASE_URL وAPP360_REELS_BRIDGE_SECRET الموجودين؛ لا تغير المفتاح. بيانات قاعدة المدرسة مستقلة عن قاعدة الريلز؛ الربط بين الحسابات عبر API والهوية الرسمية، وليس بتشارك جداول المستخدمين أو كلمات المرور.

Build Command: `npm run build`

Start Command: `node services/family-relay/src/server.js`

التشغيل يطبق الترحيلات والبذور تلقائياً على المحرك المختار قبل إتاحة خدمة الحسابات. لا تنفذ reset للإنتاج. إعداد PostgreSQL غير المكتمل يسبب خطأ إعداد واضحاً ولا يعود إلى SQLite تلقائياً. لا يحتاج البناء الاتصال بالقاعدة؛ يلزم الاتصال والصلاحيات عند بدء التطبيق.

## تنظيم التوافق

- src/database-config.js يسجل المحركات ويختار مجلداتها.
- src/databases/sqlite.js وpostgresql.js يحتويان إعدادات الاتصال والتهيئة الخاصة بكل محرك.
- migrations وseeds في جذر خدمة app360-data-core مشتركان، مع الإبقاء على أسماء الملفات التاريخية لحماية سجل قواعد SQLite القائمة.
- database/sqlite/migrations وdatabase/postgresql/migrations يحتويان الترحيلات الخاصة بكل محرك.
- database/sqlite/seeds وdatabase/postgresql/seeds مجلدان جاهزان لإضافات البذور الخاصة بالمحرك. يبقى الكتالوج المشترك في seeds الأساسي بدلاً من نسخ المحتوى وتباعده.

## الملفات والاتصالات

APP360_FILE_STORAGE=database هو الافتراضي مع PostgreSQL؛ يحفظ المرفقات داخل file_contents، فلا يحتاج تسجيل الدخول أو تخزين ملفات المستخدم إلى صلاحية كتابة محلية. تبقى حدود الطلب والحماية الخاصة بالمحتوى كما هي. APP360_DB_FILE وAPP360_UPLOAD_ROOT لا يؤثران على هذا الوضع. يمكن اختيار filesystem صراحة عند توفير مسار دائم قابل للكتابة.

طلبات PostgreSQL تشترك في pool محدود؛ لا ينشئ كل طلب اتصالاً جديداً. لا يعتمد المحرك على SET search_path أو قفل advisory على مستوى الجلسة. تهيئة قاعدة PostgreSQL تستعمل قفلاً على مستوى المعاملة لتسلسل الترحيلات والبذور بين النسخ المتزامنة. TLS موثق افتراضياً؛ disable خيار صريح لبيئات اختبار أو شبكات موثوقة فقط، ولا يحدث تراجع إليه تلقائياً.

SQLite يبقى افتراضياً ويحافظ على مساراته وبياناته القديمة. تبديل المحرك لا ينقل بيانات SQLite القديمة تلقائياً؛ أخذ نسخة احتياطية وترحيل البيانات خطوة مستقلة عند وجود بيانات سابقة. البذور لا تنشئ مستخدمين تجريبيين في NODE_ENV=production، ولا تنسخ حسابات الريلز؛ يتعرف الربط على الحساب الحقيقي عند الدخول الأول.

## التحقق

بعد النشر، /api/app360/health يعرض database_engine=postgresql وfile_storage=database وعدد الترحيلات. عند الخطأ يسجل APP360_DATA_CORE رموزاً ثابتة دون كلمة المرور أو SQL. APP360_STORAGE_DIAGNOSTICS=1 اختياري؛ في وضع PostgreSQL يوضح أن قاعدة البيانات والتخزين لا يعتمدان على ملف SQLite.

اختبار PostgreSQL في tooling/test-postgres-hosting.cjs يستخدم قاعدة اختبار مستقلة ويفحص الترحيلات والبذور المتكررة والتزامن، تبادل رمز الريلز، تشفير منح الربط، استعادة الجلسة، تقارير ولي الأمر، منع الطفل من تقارير غيره، الاستخدام المتكرر دون ازدواج، المرفقات، وإبطال الهوية. فحوص GitHub تشمل PostgreSQL 18 وSQLite على Node 20 و22.
