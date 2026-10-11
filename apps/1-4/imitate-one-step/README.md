# دوري ودورك

النسخة الحالية تجمع 200 تجربة مع عرض بصري مبسط.

## العرض
- Storyboard من خمس لوحات؛ أثناء التشغيل تظهر لوحة واحدة كبيرة، ثم تظهر الصورة كاملة في النهاية.
- التجربة 001 أصبحت مرجعًا عالي الدقة SVG بخمس لوحات متساوية تمامًا.
- زر «التجربة التالية» متاح من أعلى وأسفل صفحة التجربة.

## التنفيذ والملاحظات
- زر «تم عمل التجربة» يزيد العداد المحلي.
- التعليقات والتحسينات داخل قسم قابل للفتح حتى تبقى الصفحة بسيطة.
- الملاحظات الخاصة محلية، والتعليقات العامة عبر GitHub Issue #8.

## الرسم الجماعي
أداة الرسم أصبحت مستهلكًا ثانيًا حقيقيًا لأفكار محرك الرسم في التطبيق الأول، مع تنفيذ خاص هنا بدل نسخ التطبيق كاملًا:
- لوحتان افتراضيًا وزر + مشارك حتى ست لوحات.
- نموذج مساعد مستقل لكل لوحة، مع قوالب حر/خط/موجة/دائرة/مربع/مثلث/نجمة/بيت/شمس/وجه/طريق/هدف.
- إصلاح تقطيع القلم، حماية اليد، رفض القفزات، Quadratic smoothing، قوة إصلاح وسماكة وألوان ووضوح النموذج.
- Touch + Mouse بدون اعتماد إلزامي على Pointer Events لدعم الأجهزة القديمة بصورة أفضل.

لا تزال الحالة Alpha حتى اختبار الأجهزة والممارسة الواقعية.

### Recorded play prompts (Arabic and English)

The original app includes 11 bilingual prompt pairs (22 local MP3 files, approximately 315 KB). The recordings reuse matching public curriculum lines from the existing calm app; `audio/manifest.json` records their provenance, exact text, measured duration and SHA-256 digest. No audio generation happens in the child's browser.

The library's **كيف نلعب؟** button plays the app introduction, watch-first prompt and try-yourself prompt. Opening any experience plays the watch prompt; marking it complete plays the all-done prompt. Child buttons provide watch, try, my turn, wait, help, pause and all done, with a visible caption and selection highlight. Audio language and mute preferences persist locally. Replay repeats the last prompt or introduction. Navigation, overlays, hiding the document and new prompts cancel prior playback. Blocked or failed playback displays a replay instruction.

Coverage is shared play guidance across the 200 experiences. Individual experience titles and scene instructions are not recorded in this release. The interface remains Arabic; the selector changes the recorded prompts and their captions/buttons. All recordings live under this app's own `audio/ar` and `audio/en` directories and are included in its offline download catalog.

Validation: `npm run validate` includes recording integrity, queue cancellation, language/mute persistence, and hidden-document/error tests. The recordings also pass FFmpeg decode verification. Live deployment and browser listening require separate verification.

## الصوت المسجل في نسخة المعاينة

تضم النسخة 516 ملف MP3 مولدًا باستخدام SILMA: عناوين 200 تجربة بالعربية والإنجليزية، و47 تعليمة مشهد مشتركة لكل لغة، و11 إشارة للعب لكل لغة. لكل تجربة خمس قوائم صوتية مرتبطة بمشاهدها. يبدأ الانتقال التلقائي بعد انتهاء الصوت، ويمكن إيقاف العرض أو إعادة الصوت أو تبديل اللغة. تُحفظ اللغة والكتم محليًا.

التسجيلات السابقة مستعادة من نقطة الحفظ الأصلية دون إعادة توليدها، ويُسجل مصدرها وبصمتها في audio/manifest.json. مصادر الاستكمال وتقارير التوليد في tools/voice-sources؛ لا تُحمّل هذه الأدوات ضمن التطبيق. لا يعتمد تشغيل الأصوات على خدمة نطق خارجية.
