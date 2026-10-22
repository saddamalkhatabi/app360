# عقد دخول الريلز ومدرسة العائلة — 2026-10-23

المرجع الرسمي للحساب: https://yem1.com. المدرسة: https://school.yem1.com على SmarterASP Linux. هذا توثيق تنفيذ المصدر واختبارات محلية، ولا يؤكد إعدادات الاستضافة الفعلية.

## تدفق المتصفح

School `APP360_SESSION.unifiedLogin()` → `https://yem1.com/school-signin.html?return=<callback>` → جلسة الطفل الرسمية القائمة أو دخول الطفل/PIN أو دخول الوالد الرسمي → POST launch/admin-launch → School `/reels-login.html#code=...&return=...` → POST School `/api/app360/auth/reels/exchange` → تأكيد GET `/api/app360/auth/session` في `auth-complete.html` → الصفحة الأصلية مع query وhash.

callback المعتمد للتفويض هو `https://school.yem1.com/auth-complete.html?request=...&next=...`؛ يضاف `popup=1` في PWA فقط. عند حظر النافذة يحذف هذا العلم قبل الانتقال في التبويب نفسه. School landing يقبل أيضاً index/dashboard وindex/launch داخل apps/ages للاستدعاءات القائمة. لا يقبل Railway أو wildcard subdomains أو userinfo أو عنواناً خارجياً. next مسار محلي فقط مع رفض التحويلات الملتوية. لم نحذف السماح الأوسع في CSP الخاص بعرض الصفحات العامة؛ ذلك منفصل عن صلاحية تبادل الهوية.

الرمز code عشوائي 32 bytes/64 lowercase hex، عمره 60 ثانية، لا يخزن خاماً في قاعدة الريلز (hash فقط)، مرتبط بالمنحة واتجاه school/reels والتطبيق إن اختير، ويستهلك داخل transaction بحذف ذري مرة واحدة. لا PIN ولا bearer دائم في URL. grant عمره الأقصى 12 ساعة ويتطلب بقاء الجلسة الأصلية نشطة.

جلسة School المستقلة: bearer في sessionStorage فقط، وكوكي `__Host-app360_session; Secure; HttpOnly; SameSite=Lax; Path=/` دون Domain. GET session يعطي الأولوية لكوكي المدرسة على bearer قديم من تبويب آخر، لكنه لا يكتب أو يمسح كوكي، لمنع رد GET قديم من محو حساب أحدث. الدخول/التبادل يكتبان الكوكي، والخروج يلغي جلسة المدرسة والمنحة المرتبطة ويمسح الكوكي. sessionStorage الخام لا يثبت تسجيل الدخول حتى التأكيد من الخادم.

داخل Shell، يمنح المالك الموثوق في parent من الأصل نفسه جلسة المدرسة إلى ابنه المباشر عبر shareSession والتحقق من parent/origin. يتابع الطفل حدث app360:authchange عند المالك؛ لا يحتاج كوكي طرف ثالث أو دخولاً جديداً. لا ينقل أي bearer إلى الريلز عبر postMessage. localStorage يحمل إشارة غير حساسة فقط لتحديث التبويبات وإعادة التحقق، وبيانات الاستخدام المحلية المعتادة؛ لا يحمل token.

## خادم المدرسة ←→ خادم الريلز

كل المسارات التالية POST JSON، تحت `/api/addons/school/bridge/` في الريلز، وتتطلب `X-School-Bridge-Secret`. سر المدرسة `APP360_REELS_BRIDGE_SECRET` يطابق سر الريلز `SCHOOL_BRIDGE_SECRET` أو المصدر الخاص القائم. لا ينشأ أو يدور سر جديد في هذا الإصلاح.

| العملية | الطلب | النتيجة والصلاحية |
|---|---|---|
| exchange | `{code}` | `{ok,identity,grant_token,expires_at,reels_origin}`؛ استهلاك code مرة واحدة |
| login | `{query,pin,client_ip}` | نفس الهوية والمنحة؛ المسار القائم فقط مع حد محاولات PIN، دون حساب بديل |
| check | `{grant_token}` | `{ok,identity,allowed_app_ids,daily_limit_minutes,used_seconds}`؛ يتحقق من المصدر والعائلة والإضافة |
| return | `{grant_token}` | `{ok,url,expires_in:60}`؛ URL HTTPS آمن للريلز يحمل code مؤقتاً |
| usage | `{grant_token,batch}` | `{ok,accepted}`؛ receipt مستقل لكل طفل/batch/app/day، وطلبات الإعادة لا تضاعف الوقت |
| logout | `{grant_token}` | `{ok:true}`؛ إبطال المنحة المرتبطة فقط |

فشل التوثيق 401، إعداد ربط غائب 503، منع ولي الأمر/الإضافة/حد الوقت 403، رمز غير صالح/منتهي/مكرر 401، مدخلات usage غير صالحة 400. الطلبات لا تتبع redirect إلى خادم آخر. لا يعود grant_token للمتصفح؛ AES-256-GCM في reels_bridge_sessions داخل School بمفتاح مشتق من السر القائم.

| حقل الهوية | المصدر والمعنى |
|---|---|
| external_user_id | `child:<id>` أو `admin:<id>` ثابت من جلسة الريلز؛ المفتاح الفعلي للربط، وليس الاسم |
| display_name | الاسم الرسمي الكامل من الخادم؛ لا يستبدل باسم صوتي أول |
| role | child/trainee → learner؛ coach → trainer؛ admin → parent ضمن الصلاحية الموجودة |
| external_role | child/coach/family_parent من الهوية الرسمية |
| age_band | الفئة العمرية الفعلية في الريلز، مثل 1-4 |
| account_external_id | معرف العائلة النصي `<owner_id>` من الخادم، وليس child_id يرسله المتصفح |
| gender | male/female اختياري من المصدر الموثوق؛ يختار الصيغة الصوتية عند توفره |

## API المدرسة المحلي

| الطريقة والمسار تحت /api/app360 | الطلب/الاستجابة |
|---|---|
| GET health | حالة الخدمة وتهيئة الربط وعدد migrations دون أسرار؛ لا يعني نجاح تبادل حي |
| GET auth/session | كوكي المدرسة أو bearer؛ `{token,expires_at,profile}` مؤكد أو 401/403/503 |
| POST auth/reels/exchange | `{code}` → جلسة School فقط وهوية verified |
| POST auth/child-login | `{query,pin,device_id}` → نفس الطفل الرسمي؛ لا PIN محفوظ |
| POST auth/logout | bearer/كوكي المدرسة؛ يلغي الجلسة والمنحة المرتبطة |
| GET reels/policy | bearer → القيد الحالي؛ cache تحقق الخادم 30 ثانية |
| POST reels/launch | bearer → رابط الريلز المؤقت، مع صلاحية العائلة |
| POST usage/batch | `{batch_id,device_id,entries:[{app_id,occurred_day,active_seconds,opens}]}`؛ المستخدم من الجلسة لا من user_id المدخل |

auth/session وlogout يتحققان من الأصل وSec-Fetch-Site. في reverse proxy يمكن ضبط APP360_PUBLIC_ORIGIN بالأصل HTTPS الدقيق دون الثقة العامة بـX-Forwarded-Host. كل API ردوده no-store وخارج Service Worker. 503 `data_core_not_enabled` يختلف عن `data_core_dependencies_missing` و`data_core_database_unavailable`. فشل bridge يعيد reels_exchange_failed أو linked_identity_unavailable؛ لا اسم مسجل وهمي ولا fallback إلى demo.

usage يثبت محلياً ويرسل إلى outbox دائم، يعاد كل 30 ثانية، ويتابع الربط لنفس المستخدم فقط. سجل مستخدم A لا ينقل إلى B. check يحدث في الواجهة كل 60 ثانية مع cache خادم 30 ثانية؛ اكتشاف إبطال مركزي في واجهة نشطة حتى نحو 90 ثانية مع شبكة سليمة. الخروج/التبديل المحلي فوري؛ فشل شبكة مؤقت لا يختار هوية أخرى. عند انقطاع الشبكة بعد التحقق يبقى الحساب في الذاكرة حتى انتهاء الجلسة؛ فتح صفحة جديدة offline لا يثبت حساباً من الاسم المخزن. الخروج offline يمنع استعادة كوكي سابق تلقائياً في الواجهة حتى دخول صريح ناجح.

عند دخول زائر في School المضمّنة من الريلز، يحفظ مسار الدخول أصل المضيف المحدد فقط، ثم يؤكد callback جلسة School ويطلب رمز عودة مؤقتاً ويرسله إلى parent المعتمد قبل العودة إلى الصفحة نفسها. لا يرسل School bearer ولا grant. هذا الإشعار خاص بمحاولة الدخول الصريحة، لتجنب حلقات تفويض بين الموقعين.

## الرسائل

| الاتجاه | الرسالة | التحقق |
|---|---|---|
| School→Reels | app360:identity-request `{version:1,nonce}` | أصل School الدقيق وsource iframe النشط وشكل nonce |
| Reels→School | reels:identity `{version:1,nonce,code,reels_origin}` | source parent وأصل yem1.com أو apps.yem1.com الدقيق وnonce؛ targetOrigin محدد |
| Reels→School | reels:identity-error `{version:1,nonce,message}` | نفس التحقق؛ لا يثبت هوية |
| School→Reels | app360:reels-session `{version:1,code}` | source iframe النشط وأصل School؛ code مؤقت جديد من API School/launch |
| Reels→School | reels:host-visibility `{version:1,visible}` | parent وأصل الريلز؛ إيقاف الوسائط والوقت عند الإخفاء |
| popup→School | app360:auth-complete `{version:1,request,session}` | نفس origin وsource popup والطلب المعلق قبل قبول School session |

لا يقبل رد قديم بعد تبديل الطفل أو إغلاق إطار المدرسة. PWA يجرب popup مسمى ويستطلع جلسة المدرسة كل ثانيتين بحد 180 ثانية. الإغلاق اليدوي يلغي المحاولة ويعيد فحص الجلسة. عند فقد opener يظل callback يشرح العودة؛ الكوكي من نفس المضيف يسمح للتطبيق الأصلي بالتأكيد عند الرجوع. Android قد يفتح نافذة نظام خارجية لا يمكن إغلاقها برمجياً؛ هذه حدود المنصة ولم يختبر جهاز حقيقي هنا.

## الاسم والتشجيع

الهوية الرسمية APP360_SESSION فقط. زر portalAccountBtn يتحدث عند authchange. الاسم المعروض كامل؛ الصوت يبحث أولاً عن الاسم الكامل ثم أول 1–3 كلمات لتسجيل اسم مركب مطابق وفريد في مكتبة SILMA الموجودة. يختار صوت الجنس الموثوق، وإلا جنس التسجيل، والتشجيع العام عند غياب التسجيل أو خطأ الصوت. لا توليد صوت مدفوع ولا تعديل التسجيلات. المشغل ينتظر ended مع watchdog 6.5 ثانية لكل مقطع و5 ثوان لتحميل فهرس الأسماء، ويوقف الاستجابات والأصوات عند التنقل/الإخفاء/الخروج/تبديل الطفل. صاحب تشجيع واحد لكل شجرة إطارات School من نفس الأصل؛ eventId يحد تكرار الحدث خلال 30 ثانية. المدربة لا تسمح بالتهنئة القديمة بالتوازي معها.

مسار playPersonalized الصريح المشروط باشتراك يبقى موجوداً بسياسة entitlement الخادم؛ لا يعني رفضه أن جلسة الطفل فاشلة. مسار التشجيع المسجل المشترك يعتمد الجلسة الموثوقة؛ لا ينطق اسم ملف تعلم محلي بديلاً عنها. الإنجليزية لها prefix مسجل مستقل، والاسم من تسجيلات SILMA المتاحة. لا تغيير لاختيار لغة المحتوى/الصوت المستقل.

التدقيق الفعلي: `docs/unified-login-app-audit-20261023.json` يسجل عشرة تطبيقات فيها مواضع تشجيع. slugs الحالية tangram-builder وmy-little-routine وstory-language-lab. imitate-one-step يستعمل مدرب التعليمات والمشهد ولا يتضمن استدعاء تهنئة مشتركة؛ لم نضف نجاحاً وهمياً له. School `app360-account-access-v1.js` موجود ويضيف أدوات إدارة المحتوى للوالد/المدرب وفق APP360_SESSION؛ لا يثبت الحساب اعتماداً على ملف التعلم المحلي.

## SmarterASP: إجراءات يدوية وليست نشرًا منفذًا

| الإعداد | مكانه/المطلوب |
|---|---|
| APP360_DATA_CORE_ENABLED | متغير خدمة School: 1 |
| APP360_ENABLE_SEED_LOGIN | متغير خدمة School: 0 |
| NODE_ENV | production |
| APP360_REELS_BASE_URL | الأصل HTTPS الرسمي yem1.com |
| APP360_REELS_BRIDGE_SECRET | السر القائم المطابق للريلز، خادمي فقط |
| APP360_PUBLIC_ORIGIN | الأصل HTTPS الدقيق school.yem1.com للـreverse proxy |
| APP360_DB_FILE | مسار SQLite مطلق دائم قابل للكتابة خارج مجلد الإصدار المستبدل |
| APP360_UPLOAD_ROOT | مجلد رفع دائم خارج مجلد الإصدار، عند استعمال المرفقات |
| PORT | المنفذ الذي تعينه منصة Node للاستضافة |
| SCHOOL_BRIDGE_SECRET / SCHOOL_REELS_ORIGIN / PUBLIC_BASE_URL | في خادم الريلز؛ لا تنسخ .env المحلي على إعدادات السيرفر |

School: Node 20.x وفق engines الخاص بـbetter-sqlite3، ثم من جذر المستودع `npm run build` (يثبت اعتماديات services/app360-data-core، Native better-sqlite3 11.10.0 وKnex 3.3.0) و`npm start` (family-relay، نفس منفذ static وAPI). عند غياب binary جاهز يلزم toolchain Linux/build-essential/Python أو دعم المضيف. لم يفحص توفر ذلك على حساب SmarterASP. متغيرات لوحة الاستضافة تسبق .env؛ الملف المحمل هو .env في جذر المدرسة، ويقرأ قبل بدء الخدمة. لا تضع أسراراً في public أو Git.

المدرسة SQLite، والريلز يعمل بمحركه المحدد في إعداداته؛ لا ربط جداول مباشر ولا نقل PostgreSQL للمدرسة. لا migration جديدة لهذا الإصلاح؛ startup ينتظر migrate.latest الموجود ثم seeds. seed 001 لا ينشئ/يعيد كتابة demo users في production؛ بقية seeds فهارس تطبيقات وأنواع محتوى، دون حذف حسابات أو أعمال الأطفال. سجل content_types metadata يعاد بناؤه وفق العقد القائم. لا تشغّل reset على الإنتاج. احتفظ بسر الربط نفسه لأن تدويره سيمنع فك منح المدرسة المحفوظة.

PWA: worker لا يخزن APIs أو صفحات/سكربتات callback. runtime الهوية والتشجيع network-first، وإصدارات imports تغيرت إلى 20261023-unified. تم تحديث digests في 18 offline manifests مع الإبقاء على سجلات الوسائط. التطبيقات المنزلة كاملة تتحدث من زر تحديث التطبيقات في الرئيسية؛ لا localStorage.clear ولا حذف قاعدة الاستخدام ولا إزالة التثبيت. تحديث offline Worker محلياً اختبر كعقد ومحاكاة، وليس كتثبيت Android حي.

## الملفات الأساسية

Reels: public/school-signin.js، school-identity.js، school-portal.js، index.html، legacy-viewer.js، sw.js، addons/school/routes.js وservice.js. سر الريلز يقرأه services/schoolBridgeConfig.js: SCHOOL_BRIDGE_SECRET أولاً، ثم config/integrations/school-bridge.private.json؛ لا قيمة سرية في الحزمة.

School: assets/js/app360-session-v1.js، unified-login-v1.js، auth-complete-v1.js، reels-login-v1.js، reels-bridge-v1.js، integration-context-v1.js، teacher-encouragement-v1.js، المشغل resources/celebration-audio/player-v1.js، تعديلات الرسم والألغاز والتانغرام، خدمات family-relay وapp360-data-core، اختبارات tooling/test-unified-*، ومعرّفات/blueprints الكتالوج الموصوفة في تقرير التسليم.
