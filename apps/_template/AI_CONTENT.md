# AI Content Contract — required before Live

كل تطبيق جديد في App360 يبدأ بقدرة `ai.content-import` وعقد أولي `generic_card` يضيفه `tooling/scaffold-app.js` إلى `data/ai-content-contracts.json`.

قبل تحويل التطبيق إلى `live` يجب استبدال/تطوير العقد العام بأنواع المحتوى الحقيقية للتطبيق.

لكل نوع محتوى حدّد:

- `id`: معرف ثابت لنوع المحتوى.
- `label_ar`: اسم واضح للمستخدم.
- `supports_images`: هل يقبل صورا خارجية؟
- `supports_audio_script`: هل يحتاج نصا صوتيا؟
- `fields`: كل الحقول المقبولة في العنصر.
- `required_item_fields`: الحد الأدنى اللازم لاعتبار العنصر صالحا.
- `example`: مثال واحد صحيح، وليس محتوى إلزاميا.
- `helpers`: اختيارات تساعد المستخدم قبل توليد الـPrompt.

قواعد عامة:

1. لا تجعل Prompt يرسل بيانات طفل أو أسرة أو مؤسسة.
2. JSON فقط؛ الصور ملفات منفصلة ويربطها `asset_ref` أو `assets`.
3. المحتوى المستورد يبدأ `draft` ويحتاج مراجعة بشرية قبل الاعتماد.
4. احتفظ بمعرف `id` ثابت حتى تعمل revisions بدلا من نسخ صامتة.
5. إذا كان للتطبيق محتوى يمكن فتحه مباشرة، حدّث `links.json` أيضا؛ AI contract لا يغني عن Deep Links.
6. عند الحاجة لدمج المحتوى المعتمد في المحرك الأصلي اقرأ `window.APP360_AI_CONTENT.getPublished(typeId)` أو استمع لحدث `app360:ai-content-status`.
