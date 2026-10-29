# عقد مدربة البالونات — الإصدار 1

الواجهة العامة `window.APP360_BALLOON_TRAINER` تمهيد لاستدعاء الجلسات من مخطط التطبيقات لاحقًا. لم تتغير واجهة المخطط في هذا التحديث. القيم المسموح بها موجودة في `data/coach-routes.json`، وروابط الاستدعاء في `links.json`؛ ينتج الملفان من `coach-session.js` بواسطة `node tooling/build-balloon-coach-catalog.cjs`، ويتحقق الأمر مع `--check` دون كتابة.

لكل فئة سبعة اختيارات: الرحلة الكاملة، الألوان والأشكال، الأعداد، الحروف، الحيوانات، الفواكه، وكلمات البيت للصغار أو المدرسة للأكبر. يمكن جمع أكثر من اختيار؛ تحفظ الوحدات ترتيب الاختيار وتزال التكرارات. كل فئة لها اثنتا عشرة وحدة. أعداد 1–4 محصورة في 1–10، وأعداد 4–8 في 1–20. لا يقبل إطلاق الفئة مسار الفئة الأخرى.

مثال رابط للفئة 4–8:

`launch.html?action=session&launch_age=4-8&route_ids=balloon-4-8-numbers,balloon-4-8-animals&autoplay=1&duration_seconds=300&response_seconds=0&caller=planner&launch_id=example-1`

دون `autoplay=1` يفتح الرابط لوحة الاختيار فقط. لا يقبل `launch.html` وجهة تحويل خارجية. `duration_seconds=0` يعني إكمال المسارات المختارة؛ الحد الأعلى 1800 ثانية. `response_seconds` مهلة اختيارية 0–15 ثانية بعد اكتمال التجربة. عند كتم الصوت تبقى مهلة مشاهدة للصورة، ولا توجد حلقة انتقال غير محدودة.

مثال استدعاء:

```js
APP360_BALLOON_TRAINER.start({
  ageGroup: '4-8',
  routeIds: ['balloon-4-8-numbers', 'balloon-4-8-animals'],
  autoplay: true,
  duration_seconds: 300,
  response_seconds: 0,
  caller: 'planner',
  launch_id: 'example-1'
});
```

الأوامر الأخرى: `pause`, `resume`, `stop`, `next`, `previous`, `replay`, `setAuto`, `open`, `getState`, `isActive`, و`listPaths`. يتوقف الوقت والتنقل عند الإيقاف وإخفاء الصفحة وفتح لوحة المسارات. الاستئناف المحفوظ يحتاج طلبًا صريحًا، ويعيد قراءة التجربة إذا قوطع صوتها. لا تعاد جلسة تلقائيًا لمجرد إعادة فتح الصفحة. الحفظ مستقل بحسب الطفل والفئة؛ الانتهاء أو الخروج يعيد مزرعة اللعب السابقة دون نسخ نمو العرض إليها.

الأحداث على `document`: `app360:balloon-trainer:sessionstarted`, `sessionpaused`, `sessionresumed`, `sessionstopped`, `sessioncomplete`, `unitchanged`, `experienceviewed`, و`optionschanged`، مع البادئة نفسها لكل اسم. تتضمن الحالة `schema_version`, `appId`, `ageGroup`, `routeIds`, `unitIds`, `unitIndex`, `unitId`, `experienceIndex`, `viewedCount`, `autoplay`, `remaining_seconds`, `caller`, و`launch_id`. يبقى `practice_confirmed=false`؛ العرض والتشجيع لا يصدران إيصال تنفيذ أو درجة إتقان. لا يبدأ المخطط خطوة أخرى اعتمادًا على المشاهدة باعتبارها تنفيذًا من الطفل.

يملك مسار التسجيل الصوتي الحالي الكلام والجمل وتظليل الكلمات، ثم تشجيع نمو المزرعة واسم المشترك المستحق أو تسجيل ولي الأمر أو التشجيع العام. لا يتجاوز الانتقال نهاية الصوت أو التشجيع أو الصورة البطيئة. فشل الصوت يوقف المدرّبة مع خيار إعادة المحاولة. الأيقونة `assets/ui-icons/family-teacher.svg` وأيقونات السابق والتالي والتكرار والمسارات والإنهاء هي الأصول المشتركة الأصلية.
