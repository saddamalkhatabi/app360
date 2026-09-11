# التطبيقات الفردية في مختبر التطبيق 360

`apps/` هو المصدر الرسمي لكل تطبيق مستقل:

```text
apps/<age-group>/<app-slug>/
```

أول تطبيق عامل أصبح بالفعل في مكانه القياسي:

```text
apps/1-4/drawing-writing-foundations/
```

أما `/1-4/` في الجذر فهو Compatibility Gateway للروابط القديمة فقط، وليس مكان تطوير.

## الحد الأدنى لكل تطبيق

```text
index.html
app.json
package.json
README.md
```

وتضاف مجلدات `src/`, `assets/`, `audio/`, `data/`, `test/`, `tooling/` وPWA فقط حسب الحاجة.

## لا يوجد App-to-App dependency

إذا احتاج تطبيق كودًا من تطبيق آخر، لا تستورده مباشرة. قارن الاحتياج، واستخرج الجزء المشترك إلى `packages/` إذا أصبح له مستهلكان حقيقيان. الأصول المشتركة تذهب إلى `resources/`، والخدمات الخلفية المشتركة إلى `services/`.

## البدء

استخدم `_template/` أو الأمر:

```bash
pnpm new:app -- <age> <slug> "العنوان العربي"
```

ثم اقرأ `docs/APP_SPEC_TEMPLATE_AR.md` و`docs/FRAMEWORK_AR.md` قبل التنفيذ.
