# Tooling

أدوات المستودع المشتركة التي تعمل من الجذر، وليست منطق تطبيق تعليمي.

- `validate-platform.js` — فحص العقود والأهداف والكتالوج والقدرات والحزم ومسارات التطبيقات.
- `build-blueprints.js` — يولّد مواصفات ومطالبات ومجلدات الخطط من الكتالوج؛ `--check` يفحص عدم تقادمها دون كتابة.
- `test-platform.js` — اختبارات رفض ارتباطات غير صالحة واستكمال خطة بأمان؛ يعمل عبر `pnpm test` داخل نسخة مؤقتة.
- `clean-workspace.js` — حذف مخرجات Build/Cache المعروفة فقط؛ لا يحذف بيانات التطبيقات أو `node_modules`.

الأوامر من الجذر:

```bash
pnpm install
pnpm validate
pnpm workspaces:list
```

أي أداة Build مشتركة مستقبلية توضع هنا عندما تخدم عدة Workspaces. أداة خاصة بتطبيق واحد تبقى داخل `apps/<age>/<slug>/tooling/`.
