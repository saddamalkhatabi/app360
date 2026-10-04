# مختبر لماذا: أتوقع وأجرّب

نسخة معاينة تقنية للفئة 4–8، في المسار الرسمي `apps/4-8/wonder-experiment-lab/`. التجربة الأسرية واختبار Big TAB الفعلي لم ينجزا بعد؛ `live` في الكتالوج يعني رابط المعاينة العامل مع `release_channel: preview`، ولا يعني قبول الإنتاج أو إثبات أثر تربوي.

## الاستخدام

افتح `index.html` واختر إحدى التجارب العشرين في المستوى الأول. شاهد أربعة مشاهد مع الصوت، ثم اسمع اسم الحالة وسؤالها واختر ما لاحظته. يبقى اختيارك ثابتاً حتى تضغط زر الانتقال إلى الحالة التالية؛ راجع الاختيارين معاً ثم احفظ اكتشافك. التجربة الواقعية والقياس والتوقع التفصيلي متاحة في دفتر المربي. المستويان الثاني والثالث غير مفعّلين حتى اختبار المستخدم والموافقة. يوجد «لا أعرف بعد»، وطلب المساعدة، والتوقف والعودة. تختلف نسخة النموذج وترتيب الحالات بين مرات الفتح؛ التكرار داخل النسخة يبقي القاعدة نفسها.

النموذج له قاعدة معلنة وأعداد توضيحية؛ لا يقيس المواد الحقيقية ولا يقرر صحة ملاحظة الطفل. النتائج الواقعية تدخل يدويًا وتبقى منفصلة عن النموذج. النبات الواقعي يحتاج ملاحظة في يوم لاحق، مع حفظ المسودة؛ لا يتحول زر إلى مرور أيام أو إثبات أن الضوء سبب التغير. لا درجات أو ترتيب أطفال.

## المساندة والصوت

- أربعة مستويات استعداد مرنة: اختيار صورة، تثبيت المتغيرات، قياس وتكرار، تفسير محتمل وسؤال تالٍ. الأعمار اقتراحات، ومستويات الدعم مستقلة عن مستويات المحتوى؛ المستوى الأول وحده متاح حالياً.
- مكتب المربي يحفظ مقدار المساعدة وسؤالًا خاصًا عبر نسخ قوالب آمنة؛ عشرون قالبًا مستقلًا، مع استيراد وتصدير. قاعدة النموذج والشروط الأساسية تبقى معلنة؛ تغيير السؤال لا ينشئ محاكاة فيزيائية جديدة.
- 760 ملف MP3 عربيًا وإنجليزيًا للتعليمات والأسئلة والتجهيز والشروط والحالات والخيارات. توقيت كل كلمة من حدود التسجيل الفعلي. «أسمع الخيارات» يقرأها دون تغيير توقع الطفل.
- تتبع الكلمات خيار للمرافق بجانب مزامنة العائلة، مع وراثة إعداد الجلسة والاستثناء الفردي وصلاحيات المسؤول والمساعد. إيقاف التتبع يبقي الصوت.
- الأرقام العربية تعرض وتقرأ بالعربية، والإنجليزية بالإنجليزية. أصوات الأرقام والأسماء والصور مراجع إلى موارد المشروع السابقة، دون نسخها.
- الكتابة الخاصة تستخدم صوت جهاز `localService === true` فقط، إن توفر، مع نطق كل لغة بلغتها والأرقام بالكلمات. البديل هو القراءة أو الإملاء للمربي. لا ميكروفون مطلوب ولا تسجيل أو رفع تلقائي لنص المتعلم. اختبار هذا المسار بمحاكاة ردود الصوت المحلي؛ توفر الصوت وجودته على الجهاز غير مضمونين.

## الحفظ والخصوصية

مفتاح مستقل لكل ملف: `app360:a4-wonder-lab:schema-1:<profile>`. المسودة تحفظ المرحلة والتوقع والشروط والمدخلات والملاحظات والتواريخ. أربعون بطاقة محفوظة، وعشرون محاولة سابقة متجددة؛ امتلاء الدفتر لا يمنع ممارسة جديدة. فتح بطاقة يفتح نسخة ولا يغير الأصل. المحاولات تحفظ المتغير والثوابت والمصدر وتأكيد تجهيز التجربة الواقعية كلًا على حدة.

رفض التخزين يبقي العمل في الذاكرة مع تنبيه وخيار تصدير. ملف تالف لا يكتب فوقه تلقائيًا؛ يصدر الأصل أو يؤكد المربي بدء حفظ جديد. الملف المستورد يتحقق من المخطط والحجم والحدود ويضاف كنسخ مستقلة؛ القراءة غير المتزامنة تتحقق من هوية الملف وصلاحية المربي قبل الإضافة. ملاحظته الخاصة لا تدخل صادرات بطاقات الطفل. الطباعة والواجهة والتصدير من النموذج نفسه.

## السلامة

التجربة الواقعية لا تبدأ قبل تأكيد المربي للمواد والمكان وحضوره. لا نار أو توصيل كهرباء أو تذوق أو قطع صغيرة أو أوزان ثقيلة. الماء قليل في حوض ثابت ضحل وتحت إشراف مباشر، مع تجفيف المكان. الضوء الآمن مغلق ويجهزه المربي دون أسلاك مكشوفة أو فتح بطارية، ولا يوجه للعين. العودة لتكرار بطاقة واقعية تحتاج تأكيد التجهيز من جديد. هذه آلية توجيه وليست تحققًا تقنيًا من حضور شخص بالغ.

## الأصول وOffline

الرسوم التوضيحية والأيقونة SVG أصلية لهذا التطبيق. سبع صور وأربعة عشر صوت اسم من `resources/early-child-market-objects`، وأربعة وثلاثون صوت رقم من `resources/shape-numeral-audio` تشير إلى الملفات الأصلية في تطبيق الأشياء وسوق العائلة. حقوق ومصادر الأصول السابقة تبقى في فهارسها؛ لا ادعاء بترخيص جديد لها.

الحلقة الأساسية Local-first، بلا اعتماد على API أو AI. Service Worker مستقل ببادئة `a4-wonder-lab-` وحزمة 892 مرجعًا؛ لا يظهر استعداد Offline إلا بعد اكتمال الحزمة. المزامنة الأسرية الاختيارية تحتاج اتصالًا؛ البطاقات لا ترفع تلقائيًا. التحديث يحفظ المسودة قبل إعادة التحميل، ويحذف كاش هذا التطبيق فقط. `launch.html` يقبل تجربة بالمرجع ويرسل اكتمالًا عند إنشاء بطاقة من محاولتين.

## البناء والتحقق

لا مكتبات إنتاج جديدة. إدارة Workspace وLockfile من الجذر. مولد الصوت المشترك `tooling/build-authored-audio.py` يخدم هذا التطبيق ومرسم الأشكال عبر محولين صغيرين؛ التسجيلات السابقة لم تتغير. يتطلب `edge-tts` و`ffmpeg` في بيئة البناء فقط، ويرفض بيانات توقيت تتجاوز التسجيل. يرسل نص المنهج المؤلف العام فقط عند البناء.

```sh
node --test apps/4-8/wonder-experiment-lab/test/*.test.cjs
node apps/4-8/wonder-experiment-lab/tools/audit-assets.cjs
python apps/4-8/wonder-experiment-lab/tools/build_audio.py /path/to/recording-cache
```

الفحوص الاختيارية للمتصفح: `tools/qa-browser.cjs` مع Playwright في بيئة الاختبار و`CHROMIUM_EXECUTABLE_PATH` و`WONDER_BROWSER_ARGS` عند الحاجة. تفاصيل النتائج والحدود في `QA_AR.md` و`data/technical-validation.json`. النشر إلى Railway مؤجل؛ هذه الإضافة على فرع المعاينة فقط.

## Historical releases

The following sections describe earlier releases; current counts and final checks are in `data/technical-validation.json` and `QA_AR.md`. Preview 5 provides twenty level-one activities, 80 level-one frames, 24 atlases / 96 frames including retained coach activities, and 760 authored recordings. No assets were regenerated during the final restoration.

## Photographic scenes — preview 2

The library opens a four-frame photo preview before creating a draft. Next/previous, direct thumbnails and all-scenes mode are available. Viewing does not archive or change a draft or advance a variant. Choose explicitly to start; return to the current draft from its preview. Six AI-generated illustrative JPEG atlases contain 24 frames and total 587,280 bytes. The 1024px atlases use 512px frames, without new audio duplication. Existing authored recordings and real word-boundary cues accompany each frame. Dynamic model results remain separate from the fixed reference photos. Every atlas is included in the offline bundle. `assets/scenes/wonder-scenes-v1.zip` contains the exact unpacked assets already committed alongside it, below 25MB. `tools/qa-scenes.cjs` verifies all scenes, real audio/cues, draft preservation and responsive selection.

## Scene workflow integration — preview 3

Photographic assets now appear directly in preparation, each prediction condition, active trials, review comparisons and notebook covers. Condition-to-frame mapping uses low/high and left/right setup frames where applicable. Fixed reference scenes are labelled in trials and review; changing model values and learner observations remain the recorded evidence, with the numeric model sketch available in details. Browser QA checks actual decoded image loading at every workflow stage for all six experiences, alongside all 16 regression groups. Asset URL versions and app/portal cache versions advance so existing installations receive the updated screens.

## Default child play — preview 4

Selecting an experience now opens a single-screen photographic story player directly. Play shows all four frames in sequence; the child or coach can pause, resume, select a frame or see the complete sheet. Short recorded condition labels accompany the scenes with real read-along cues; there are no required preparation, prediction or explanation pages. After viewing, the child describes both conditions with independent choices, saves a screen-observation discovery, and repeats. No choice is graded. Fixed photos are not treated as real experiment outcomes or numerical measurements. Story position, viewed frames and choices restore across reload; timers pause on navigation, profile change and backgrounding. The full real-experiment notebook, preparation checks, later-day plant rule and model measurements remain available to authorised coaches through the collapsed coach section. `tools/qa-simple.cjs` checks six experiences on phone/tablet, playback, pause/resume, overview, independent choices, duplicate-save prevention, restoration and actual MP3 word tracking. The retained 16-group notebook/browser suite and 18 model tests pass.
