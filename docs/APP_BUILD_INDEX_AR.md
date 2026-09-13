<!-- Generated from data/catalog.json by tooling/build-blueprints.js; edit the catalog, then regenerate. -->

# دليل بناء التطبيقات العملية

الكتالوج هو مصدر الأسماء والخطط والارتباطات. ملفات المواصفات والمطالبات مشتقة منه ويمكن تجديدها بأمر `node tooling/build-blueprints.js`.

التطبيق الحي الوحيد عند إعداد هذه الخطة هو الرسم ومسك القلم. بقية المجلدات خطط قابلة للبناء بالتتابع، وليست تطبيقات مكتملة. الربط يصف مساهمة محددة في الهدف ولا يعني تغطيته كاملًا أو إثبات أثر التطبيق.

لكل فئة ترتيب بناء مستقل حسب الأولوية ثم ترتيب الكتالوج. ابدأ تطبيقًا واحدًا، نفذ مهمة كاملة واختبرها مع مستخدم مناسب قبل الانتقال إلى التالي.

## الفئة 1-4

| التطبيق | الناتج العملي | الحالة | البدء |
|---|---|---|---|
| لوحة الطفل للرسم والكتابة المبكرة | رسم حر أو مسار يتتبعه الطفل مع ملاحظة المرافق مقدار المساعدة، بلا إلزام بإتقان الحروف. | يعمل الآن | [المواصفات](../apps/1-4/drawing-writing-foundations/BUILD_SPEC.md) · [المطالبة](../apps/1-4/drawing-writing-foundations/PROMPT_AR.md) |
| كلماتي مع أشيائي: اسمع وأشر وسمِّ | سجل مواقف تواصل يدوّنه المرافق، لا درجة آلية للنطق. | مخطط | [المواصفات](../apps/1-4/say-and-name/BUILD_SPEC.md) · [المطالبة](../apps/1-4/say-and-name/PROMPT_AR.md) |
| دوري ودورك: قلّد حركة واحدة | محاولة تبادل دور بين الطفل والمرافق باستخدام لعبة حقيقية. | مخطط | [المواصفات](../apps/1-4/imitate-one-step/BUILD_SPEC.md) · [المطالبة](../apps/1-4/imitate-one-step/PROMPT_AR.md) |
| لنلعب الآن: بديل الشاشة مع المرافق | بطاقة لعب خارج الشاشة مرتبطة بموقف شاهده الطفل. | مخطط | [المواصفات](../apps/1-4/screen-to-move/BUILD_SPEC.md) · [المطالبة](../apps/1-4/screen-to-move/PROMPT_AR.md) |
| مشاعري معك: أحتاج مساعدة | بطاقة انتقال: ما يشعر به الطفل، المساعدة التي اختارها، والخطوة التالية. | مخطط | [المواصفات](../apps/1-4/calm-with-me/BUILD_SPEC.md) · [المطالبة](../apps/1-4/calm-with-me/PROMPT_AR.md) |
| سلة الاكتشاف: فرز ولمس ونقل | ترتيب حقيقي لقطع كبيرة حسب خاصية واحدة. | مخطط | [المواصفات](../apps/1-4/sensory-motion-missions/BUILD_SPEC.md) · [المطالبة](../apps/1-4/sensory-motion-missions/PROMPT_AR.md) |
| أستطيع خطوة: روتيني المصور | روتين مصور شخصي مع ملاحظة مستوى المساعدة لكل خطوة. | مخطط | [المواصفات](../apps/1-4/my-little-routine/BUILD_SPEC.md) · [المطالبة](../apps/1-4/my-little-routine/PROMPT_AR.md) |
| رفيق المرافق: خطط جلسة لعب مستجيبة | خطة جلسة لعب وسجل ملاحظة واحد بعد تنفيذها. | مخطط | [المواصفات](../apps/1-4/responsive-play-coach/BUILD_SPEC.md) · [المطالبة](../apps/1-4/responsive-play-coach/PROMPT_AR.md) |

## الفئة 4-8

| التطبيق | الناتج العملي | الحالة | البدء |
|---|---|---|---|
| ورشة الكلمات: من الصوت إلى القراءة | كلمة مبنية وعبارة يقرؤها الطفل ويفسر معناها. | مخطط | [المواصفات](../apps/4-8/phonics-reading-play/BUILD_SPEC.md) · [المطالبة](../apps/4-8/phonics-reading-play/PROMPT_AR.md) |
| متجري المصور: عدّ وكوّن نمطًا | سلة تحقق طلبًا مصورًا ونمط يضيف إليه الطفل عنصرًا صحيحًا. | مخطط | [المواصفات](../apps/4-8/math-pattern-adventure/BUILD_SPEC.md) · [المطالبة](../apps/4-8/math-pattern-adventure/PROMPT_AR.md) |
| اصنع واختبر: جسري الورقي | نموذجان لجسر ورقي مع ملاحظة ما تغير. | مخطط | [المواصفات](../apps/4-8/first-maker-lab/BUILD_SPEC.md) · [المطالبة](../apps/4-8/first-maker-lab/PROMPT_AR.md) |
| مسار الحركة: تحرك ثم استعد | مسار لعب من محطات بسيطة ينفذه الطفل حسب قدرته. | مخطط | [المواصفات](../apps/4-8/active-body-control/BUILD_SPEC.md) · [المطالبة](../apps/4-8/active-body-control/PROMPT_AR.md) |
| نلعب معًا: أدوار ومشاركة وحل خلاف | اتفاق مشاركة ينفذ في لعبة واقعية. | مخطط | [المواصفات](../apps/4-8/feelings-friendship-lab/BUILD_SPEC.md) · [المطالبة](../apps/4-8/feelings-friendship-lab/PROMPT_AR.md) |
| قصتي المصورة: بداية ومشكلة وحل | قصة مصورة من 3 مشاهد قابلة للحفظ والطباعة. | مخطط | [المواصفات](../apps/4-8/story-art-studio/BUILD_SPEC.md) · [المطالبة](../apps/4-8/story-art-studio/PROMPT_AR.md) |
| برمج رحلة: أوامر وصحح الخطأ | برنامج أوامر قصير يصل إلى وجهة يختارها الطفل. | مخطط | [المواصفات](../apps/4-8/visual-logic-blocks/BUILD_SPEC.md) · [المطالبة](../apps/4-8/visual-logic-blocks/PROMPT_AR.md) |
| لوحة يومي: مهمة ومسؤولية واستراحة | خطة يوم قصيرة ومسؤولية نفذها الطفل. | مخطط | [المواصفات](../apps/4-8/focus-routine-board/BUILD_SPEC.md) · [المطالبة](../apps/4-8/focus-routine-board/PROMPT_AR.md) |

## الفئة 8-12

| التطبيق | الناتج العملي | الحالة | البدء |
|---|---|---|---|
| أقرأ وأثبت: ورشة الفهم والتلخيص | ملخص من كلمات المتعلم مرتبط بجمل الدليل. | مخطط | [المواصفات](../apps/8-12/comprehension-summary-lab/BUILD_SPEC.md) · [المطالبة](../apps/8-12/comprehension-summary-lab/PROMPT_AR.md) |
| خطط رحلتك: مسائل وقرارات حسابية | خطة رحلة وحسابات قابلة للتتبع. | مخطط | [المواصفات](../apps/8-12/multi-step-reasoning/BUILD_SPEC.md) · [المطالبة](../apps/8-12/multi-step-reasoning/PROMPT_AR.md) |
| صمّم لعبة: حدث وقاعدة واختبار | لعبة مصغرة وقائمة حالات اختبار. | مخطط | [المواصفات](../apps/8-12/stem-code-maker/BUILD_SPEC.md) · [المطالبة](../apps/8-12/stem-code-maker/PROMPT_AR.md) |
| قبل أن أضغط: مواقف رقمية آمنة | سجل قرارات مع سبب لكل مشاركة أو توقف. | مخطط | [المواصفات](../apps/8-12/digital-choice-simulator/BUILD_SPEC.md) · [المطالبة](../apps/8-12/digital-choice-simulator/PROMPT_AR.md) |
| محقق الإجابات: ابحث عن الدليل | بطاقة ادعاء ودليل وحكم قابل للمراجعة. | مخطط | [المواصفات](../apps/8-12/ai-fact-check-junior/BUILD_SPEC.md) · [المطالبة](../apps/8-12/ai-fact-check-junior/PROMPT_AR.md) |
| فريقنا يحل الخلاف: ورشة أدوار | اتفاق فريق صغير يحدد من يفعل ماذا. | مخطط | [المواصفات](../apps/8-12/empathy-responsibility-stories/BUILD_SPEC.md) · [المطالبة](../apps/8-12/empathy-responsibility-stories/PROMPT_AR.md) |
| أسبوع متوازن: جرّب عادة واحدة | خطة عادة وسجل تجربة أسبوعي وصفي. | مخطط | [المواصفات](../apps/8-12/healthy-routine-planner/BUILD_SPEC.md) · [المطالبة](../apps/8-12/healthy-routine-planner/PROMPT_AR.md) |
| دفتر مدرب المشروع: سؤال وتجربة وتحسين | ملف مشروع يضم محاولتين وتغذية راجعة قابلة للتنفيذ. | مخطط | [المواصفات](../apps/8-12/project-feedback-coach/BUILD_SPEC.md) · [المطالبة](../apps/8-12/project-feedback-coach/PROMPT_AR.md) |

## الفئة 12-16

| التطبيق | الناتج العملي | الحالة | البدء |
|---|---|---|---|
| استرجع وطبّق: دفتر التعلم الذاتي | مجموعة أسئلة ومراجعة أخطاء مع مهمة تطبيق. | مخطط | [المواصفات](../apps/12-16/study-retrieval-lab/BUILD_SPEC.md) · [المطالبة](../apps/12-16/study-retrieval-lab/PROMPT_AR.md) |
| ملف التحقق: ادعاء ومصدر وسياق | تقرير تحقق قصير بدليل لكل حكم. | مخطط | [المواصفات](../apps/12-16/media-ai-verification/BUILD_SPEC.md) · [المطالبة](../apps/12-16/media-ai-verification/PROMPT_AR.md) |
| مشروعي الأول: مشكلة وتجربة صغيرة | نموذج صغير مع تقرير تجربة مستخدم. | مخطط | [المواصفات](../apps/12-16/teen-project-startup/BUILD_SPEC.md) · [المطالبة](../apps/12-16/teen-project-startup/PROMPT_AR.md) |
| ميزانية الاختيارات: خطط وعدّل | ميزانيتان قبل ظرف مفاجئ وبعده مع تفسير التنازل. | مخطط | [المواصفات](../apps/12-16/first-budget/BUILD_SPEC.md) · [المطالبة](../apps/12-16/first-budget/PROMPT_AR.md) |
| غرفة الأمان: رسالة وصلاحية وتحقق | خطة إعداد آمن وسجل فحص رسائل. | مخطط | [المواصفات](../apps/12-16/phishing-privacy-simulator/BUILD_SPEC.md) · [المطالبة](../apps/12-16/phishing-privacy-simulator/PROMPT_AR.md) |
| خطتي عند الضغط: توقف واختر خطوة | خطة تصرف خاصة لموقف يومي قابل للتعديل. | مخطط | [المواصفات](../apps/12-16/resilience-balance/BUILD_SPEC.md) · [المطالبة](../apps/12-16/resilience-balance/PROMPT_AR.md) |
| اتفاق الفريق: تحدث بوضوح وتفاوض | رسالة حازمة محترمة واتفاق مهمة. | مخطط | [المواصفات](../apps/12-16/assertive-teamwork-sim/BUILD_SPEC.md) · [المطالبة](../apps/12-16/assertive-teamwork-sim/PROMPT_AR.md) |
| جرّب دورًا: اكتشف مهارة بدليل | ملف تجارب يربط مهارة بعينة عمل. | مخطط | [المواصفات](../apps/12-16/strengths-career-evidence/BUILD_SPEC.md) · [المطالبة](../apps/12-16/strengths-career-evidence/PROMPT_AR.md) |

## الفئة 16-24

| التطبيق | الناتج العملي | الحالة | البدء |
|---|---|---|---|
| جلسة إنجاز: حدد ناتجًا وأغلق المشتتات | ناتج جلسة محدد مع سجل عائق وتعديل. | مخطط | [المواصفات](../apps/16-24/deep-work-sprints/BUILD_SPEC.md) · [المطالبة](../apps/16-24/deep-work-sprints/PROMPT_AR.md) |
| ابنِ سير عمل: أنشئ وتحقق وأتمت | وصفة سير عمل مع حالات اختبار وسجل أخطاء. | مخطط | [المواصفات](../apps/16-24/ai-creation-automation-lab/BUILD_SPEC.md) · [المطالبة](../apps/16-24/ai-creation-automation-lab/PROMPT_AR.md) |
| ملف إنجازي: دليل ومقابلة تجريبية | بطاقة مشروع وفقرة سيرة وإجابة مقابلة قابلة للمراجعة. | مخطط | [المواصفات](../apps/16-24/career-interview-portfolio/BUILD_SPEC.md) · [المطالبة](../apps/16-24/career-interview-portfolio/PROMPT_AR.md) |
| أول دخل: مصروف ثابت ودخل متغير | خطة تدفق نقدي تدريبية لعدة أشهر. | مخطط | [المواصفات](../apps/16-24/first-income-budget/BUILD_SPEC.md) · [المطالبة](../apps/16-24/first-income-budget/PROMPT_AR.md) |
| نموذج يخدم مستخدمًا: دورة اختبار مشروع | نموذج أولي وسجل اختبار وقرار مبرر. | مخطط | [المواصفات](../apps/16-24/prototype-sprint/BUILD_SPEC.md) · [المطالبة](../apps/16-24/prototype-sprint/PROMPT_AR.md) |
| عميل افتراضي: من الطلب إلى التسليم | نطاق عمل وعينة تسليم وسجل تغيير. | مخطط | [المواصفات](../apps/16-24/freelance-client-simulator/BUILD_SPEC.md) · [المطالبة](../apps/16-24/freelance-client-simulator/PROMPT_AR.md) |
| تحدث ثم حسّن: عرض وتعريف ومتابعة | نسختان من عرض قصير ومسودة متابعة. | مخطط | [المواصفات](../apps/16-24/speaking-networking-practice/BUILD_SPEC.md) · [المطالبة](../apps/16-24/speaking-networking-practice/PROMPT_AR.md) |
| حملي الأسبوعي: إنجاز يمكن الاستمرار فيه | خطة أسبوع قابلة للتنفيذ وتعديل للحمل. | مخطط | [المواصفات](../apps/16-24/sustainable-performance/BUILD_SPEC.md) · [المطالبة](../apps/16-24/sustainable-performance/PROMPT_AR.md) |

## الفئة 24-45

| التطبيق | الناتج العملي | الحالة | البدء |
|---|---|---|---|
| ورشة إتقان: مهارة ومحاولة وتغذية راجعة | عينتا أداء ومقارنة وفق معيار ثابت. | مخطط | [المواصفات](../apps/24-45/deliberate-practice-focus/BUILD_SPEC.md) · [المطالبة](../apps/24-45/deliberate-practice-focus/PROMPT_AR.md) |
| دفتر القرار: بدائل وافتراضات ومراجعة | مذكرة قرار ومعيار لإعادة النظر فيه. | مخطط | [المواصفات](../apps/24-45/decision-scenario-lab/BUILD_SPEC.md) · [المطالبة](../apps/24-45/decision-scenario-lab/PROMPT_AR.md) |
| فوّض بوضوح: تكليف ومتابعة وحوار | تكليف مكتوب واتفاق متابعة ورد على عائق. | مخطط | [المواصفات](../apps/24-45/leadership-delegation-sim/BUILD_SPEC.md) · [المطالبة](../apps/24-45/leadership-delegation-sim/PROMPT_AR.md) |
| أثر التدريب: قبل وبعد وتطبيق في العمل | خطة تقييم وتقرير أداء قابل للمراجعة. | مخطط | [المواصفات](../apps/24-45/training-impact-lab/BUILD_SPEC.md) · [المطالبة](../apps/24-45/training-impact-lab/PROMPT_AR.md) |
| سير عمل موثوق: مسودة ومراجعة واعتماد | إجراء عمل وقائمة تحقق وحالات اختبار. | مخطط | [المواصفات](../apps/24-45/ai-workflow-human-review/BUILD_SPEC.md) · [المطالبة](../apps/24-45/ai-workflow-human-review/PROMPT_AR.md) |
| جدوى صغيرة: ميزانية وتكلفة ونقطة تعادل | ورقة تكلفة وتدفق نقدي وسيناريو خسارة. | مخطط | [المواصفات](../apps/24-45/finance-side-business-sandbox/BUILD_SPEC.md) · [المطالبة](../apps/24-45/finance-side-business-sandbox/PROMPT_AR.md) |
| اتفاق أسرتنا: روتين وتعلم مشترك | اتفاق أسري وتجربة نشاط تعلم. | مخطط | [المواصفات](../apps/24-45/family-routine-planner/BUILD_SPEC.md) · [المطالبة](../apps/24-45/family-routine-planner/PROMPT_AR.md) |
| عادة قابلة للاستمرار: تجربة أسبوعية | تجربة عادة مع خطة بديلة للعائق. | مخطط | [المواصفات](../apps/24-45/sustainable-energy-routines/BUILD_SPEC.md) · [المطالبة](../apps/24-45/sustainable-energy-routines/PROMPT_AR.md) |

## الفئة 45-60

| التطبيق | الناتج العملي | الحالة | البدء |
|---|---|---|---|
| حركتي اليومية: خطة مناسبة ومراجعة | خطة حركة وسجل تجربة يختاره المستخدم. | مخطط | [المواصفات](../apps/45-60/mobility-balance-habits/BUILD_SPEC.md) · [المطالبة](../apps/45-60/mobility-balance-habits/PROMPT_AR.md) |
| أنجزها رقميًا: ملفات وبحث ومساعد ذكي | ملف منظم ومعلومة موثقة ومسودة راجعها المستخدم. | مخطط | [المواصفات](../apps/45-60/digital-ai-confidence/BUILD_SPEC.md) · [المطالبة](../apps/45-60/digital-ai-confidence/PROMPT_AR.md) |
| خبرة قابلة للنقل: دليل مهمة من تجربتك | دليل إجراء اختبره متعلم آخر. | مخطط | [المواصفات](../apps/45-60/knowledge-transfer-map/BUILD_SPEC.md) · [المطالبة](../apps/45-60/knowledge-transfer-map/PROMPT_AR.md) |
| توقف وتحقق: احتيال الرسائل وانتحال الهوية | خطة تحقق وسجل قرارات في مواقف متنوعة. | مخطط | [المواصفات](../apps/45-60/scam-ai-safety-practice/BUILD_SPEC.md) · [المطالبة](../apps/45-60/scam-ai-safety-practice/PROMPT_AR.md) |
| مشروع المرحلة التالية: جرّب قبل التوسع | تجربة خدمة صغيرة وقرار متابعة. | مخطط | [المواصفات](../apps/45-60/second-act-projects/BUILD_SPEC.md) · [المطالبة](../apps/45-60/second-act-projects/PROMPT_AR.md) |
| مستقبل بفرضيات واضحة: محاكي التدفق والمخاطر | جدول تدفق افتراضي مع افتراضات وسيناريوهات. | مخطط | [المواصفات](../apps/45-60/retirement-risk-learning/BUILD_SPEC.md) · [المطالبة](../apps/45-60/retirement-risk-learning/PROMPT_AR.md) |
| مشروع ذو معنى: علاقة ومساهمة وخطوة | خطة مساهمة ومراجعة لقاء أو عمل نفذ. | مخطط | [المواصفات](../apps/45-60/meaning-relationships-journal/BUILD_SPEC.md) · [المطالبة](../apps/45-60/meaning-relationships-journal/PROMPT_AR.md) |
| جلسة إرشاد: سؤال وتجربة ومراجعة | خطة جلسة وإجراء متفق عليه وتأمل المرشد. | مخطط | [المواصفات](../apps/45-60/mentor-reflective-practice/BUILD_SPEC.md) · [المطالبة](../apps/45-60/mentor-reflective-practice/PROMPT_AR.md) |

## الفئة 60-80

| التطبيق | الناتج العملي | الحالة | البدء |
|---|---|---|---|
| خدماتي بثقة: تدريب خطوة بخطوة | موعد تدريبي مكتمل وملخص محفوظ. | مخطط | [المواصفات](../apps/60-80/digital-independence-services/BUILD_SPEC.md) · [المطالبة](../apps/60-80/digital-independence-services/PROMPT_AR.md) |
| مكان آمن وحركة مناسبة: خطة مع المرافق | قائمة تهيئة مكان وخطة نشاط مناسبة. | مخطط | [المواصفات](../apps/60-80/balance-mobility-awareness/BUILD_SPEC.md) · [المطالبة](../apps/60-80/balance-mobility-awareness/PROMPT_AR.md) |
| حكايتي بصوتي: أرشيف الأسرة الخاص | قصة موثقة بصوت أو نص وصورة اختيارية. | مخطط | [المواصفات](../apps/60-80/family-legacy-recorder/BUILD_SPEC.md) · [المطالبة](../apps/60-80/family-legacy-recorder/PROMPT_AR.md) |
| رمز التحقق ليس للمشاركة: محاكاة آمنة | قرار توقف وخطوات تحقق يمكن تكرارها. | مخطط | [المواصفات](../apps/60-80/qr-otp-scam-simulator/BUILD_SPEC.md) · [المطالبة](../apps/60-80/qr-otp-scam-simulator/PROMPT_AR.md) |
| أتعلم شيئًا وأستخدمه: مشروع فضول صغير | عمل صغير يطبق معرفة جديدة. | مخطط | [المواصفات](../apps/60-80/daily-curiosity/BUILD_SPEC.md) · [المطالبة](../apps/60-80/daily-curiosity/PROMPT_AR.md) |
| لقاء له غاية: تواصل وتبادل خبرة | خطة لقاء ونشاط مشترك. | مخطط | [المواصفات](../apps/60-80/connection-meaning-missions/BUILD_SPEC.md) · [المطالبة](../apps/60-80/connection-meaning-missions/PROMPT_AR.md) |
| خطوات يومي: أجهز وأراجع وأستقل | قائمة مهمة يومية أنجزها المستخدم. | مخطط | [المواصفات](../apps/60-80/daily-independence-checklist/BUILD_SPEC.md) · [المطالبة](../apps/60-80/daily-independence-checklist/PROMPT_AR.md) |
| رافق دون أن تنوب: ورشة تعليم خطوة | خطة تعليم مهمة مع تدرج المساعدة. | مخطط | [المواصفات](../apps/60-80/respectful-learning-coach/BUILD_SPEC.md) · [المطالبة](../apps/60-80/respectful-learning-coach/PROMPT_AR.md) |

## المراجع وحدود الاستدلال

هذه أمثلة للممارسات وأنماط منتجات قائمة، وليست إثباتًا لأثر تطبيقاتنا المقترحة أو ترخيصًا لنسخ أصولها. لا نفرض مطابقة كاملة لهدف مركب لمجرد إدراجه.

- [Harvard — Serve and Return](https://developingchild.harvard.edu/key-concept/serve-and-return/): مرجع للتفاعل المتبادل مع المرافق؛ يستأنس به تصميم اللعب اللغوي. راجعنا المرجع في 2026-09-13.
- [ScratchJr — About](https://www.scratchjr.org/about): مثال مطبق لبناء قصص وألعاب بلبنات بصرية، أساسًا للأعمار 5–7؛ لا يثبت ملاءمة كل امتداد عمري هنا. راجعنا المرجع في 2026-09-13.
- [University of Colorado — About PhET](https://phet.colorado.edu/en/about): مثال للمحاكاة التفاعلية والاستقصاء بتغيير متغير وملاحظة أثره؛ مشروعات المختبر تصميمات مستقلة. راجعنا المرجع في 2026-09-13.
- [CFPB — Financial education activities](https://www.consumerfinance.gov/consumer-tools/educator-tools/youth-financial-education/teach/activities/): أمثلة أنشطة مالية تعليمية للشباب؛ تكييفها للكبار هنا فكرة تصميم تحتاج اختبارًا، ولا يتبنى قوانين أو منتجات دولة. راجعنا المرجع في 2026-09-13.
- [FTC — Recognize and avoid phishing](https://consumer.ftc.gov/articles/how-recognize-avoid-phishing-scams): مرجع لقرائن التصيد والتحقق بقناة معروفة مستقلة؛ المحاكاة المحلية لا تستخدم بيانات حقيقية. راجعنا المرجع في 2026-09-13.
- [Pooja K. Agarwal — What is retrieval practice?](https://www.retrievalpractice.org/why-it-works): مرجع لممارسة استدعاء المعرفة قبل النظر إلى المادة. راجعنا المرجع في 2026-09-13.
- [StoryCorps DIY — Learning hub](https://diy.storycorps.org/): مثال لتيسير السرد والتواصل؛ أرشيف المختبر المقترح محلي وخاص افتراضيًا. راجعنا المرجع في 2026-09-13.
