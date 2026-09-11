# الموارد المشتركة — resources/

هذا المجلد للأصول التي أصبحت **مشتركة فعليًا** بين أكثر من تطبيق: أصوات، صور، بيانات تعليمية، قوالب، أيقونات أو Packs أخرى.

## قاعدة الملكية

- مورد يستخدمه تطبيق واحد فقط: يبقى داخل التطبيق.
- مورد يستخدمه تطبيقان أو أكثر: يمكن ترقيته إلى `resources/`.
- الكود الذي يشغل المورد يوضع في `packages/` إذا كان reusable.

بهذا نفصل بين **Runtime code** و**Media/Data assets**.

## شكل Pack مشترك

```text
resources/audio/<pack-id>/
├─ resource.json
├─ files/...
└─ README.md
```

`resource.json` يجب أن يحدد على الأقل:

- `id`
- `version`
- `type`
- `languages`
- `license`
- `source`
- `consumers`
- `files`

## ملاحظة عن حزم صوت تطبيق الرسم الحالية

حزم الأسماء والألوان موجودة الآن داخل:

`apps/1-4/drawing-writing-foundations/audio/`

ولم ننقلها هنا بعد، لأن النقل إلى Shared Resource يجب أن يتم عندما يظهر تطبيق ثانٍ يحتاجها. عندها ننفذ Migration واحدة، ونبقي Adapter/Redirect للتوافق إذا احتاج التطبيق القديم.

الفهرس الحالي للموارد المشتركة في `resources/registry.json`.
