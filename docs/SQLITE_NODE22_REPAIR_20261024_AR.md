# إصلاح SQLite الأصلي — 24 أكتوبر 2026

المدرسة المنشورة أعادت `data_core_native_dependency_unavailable` في مرحلة dependencies: تحميل مكتبة better-sqlite3 الأصلية فشل على الاستضافة، قبل التحقق من مفتاح الربط. إنشاء مجلد var لا يعالج هذا النوع من الفشل.

## الاستراتيجية الجديدة

نفس قاعدة SQLite ونفس جداولها وترحيلاتها وseeds وجلساتها باقية. تغير برنامج تشغيلها فقط: على Node22 الحديث يستخدم النظام `node:sqlite` المدمج في Node مباشرة من خلال طبقة توافق صغيرة مع Knex. لا يحتاج ملف better_sqlite3.node من Windows أو أداة تجميع إضافية على Linux. ينفذ build التثبيت بـomit=optional عندما يتوفر المحرك المدمج. على Node20، أو عند اختيار المحرك الأصلي صراحة، يبقى better-sqlite3 مثبتاً كاعتماد اختياري ويفحص تحميله؛ إذا تعذر المحركان لا ينتقل النظام إلى قاعدة فارغة أو هوية تجريبية.

المطلوب Node22 LTS حديث (22.16 أو أحدث للمحرك المدمج). يختبر النظام وجود APIs اللازمة قبل اختياره. يظهر في doctor وحالة الحسابات `sqlite_driver: node:sqlite` لتأكيد وصول الإصلاح إلى الاستضافة. رسالة ExperimentalWarning الخاصة بـnode:sqlite من Node22 ليست فشل تشغيل.

لا تغير APP360_DB_FILE أو APP360_UPLOAD_ROOT أو مفتاح الربط. يمكن ضبط APP360_SQLITE_DRIVER=auto، وهو الافتراضي؛ إذا كنت قد ضبطته على native فاحذف هذا التجاوز أو اختر auto لاستخدام المحرك المدمج.

## SmarterASP

حدّث **مشروع المدرسة** من main كاملاً، واحتفظ بقاعدة البيانات والمرفقات والمتغيرات الحالية:

```text
Git Branch: main
Build Command: npm run build
Start Command: npm start
Node.js: 22 LTS حديث
```

بعد البناء الناجح، شغّل `npm run doctor:data-core` إن توفر Terminal، ثم أعد التشغيل. المتوقع في https://school.yem1.com/api/app360/health رد200 وok=true وsqlite_driver=node:sqlite وreels_bridge_configured=true. العلم الأخير يؤكد وجود الإعدادات؛ افتح رابط دخول جديداً لتأكيد الاتصال الحقيقي. لا ترسل مفاتيح أو PIN في السجلات أو الدعم.

اختبارات التوافق تشمل الترحيلات وseeds والهوية والمعاملات والملفات والقيم الفارغة وupsert وreturning، كما تختبر تعمد منع تحميل better-sqlite3 مع بقاء SQLite المدمج عاملاً. لم ننفذ نشراً يدوياً على SmarterASP ولم نغير قاعدة الإنتاج.
