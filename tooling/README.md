# Tooling

أدوات المستودع المشتركة التي تعمل من الجذر، وليست منطق تطبيق تعليمي.

- `validate-platform.js` — فحص العقود والأهداف والكتالوج والقدرات والحزم ومسارات التطبيقات.
- `clean-workspace.js` — حذف مخرجات Build/Cache المعروفة فقط؛ لا يحذف بيانات التطبيقات أو `node_modules`.

الأوامر من الجذر:

```bash
pnpm install
pnpm validate
pnpm workspaces:list
```

أي أداة Build مشتركة مستقبلية توضع هنا عندما تخدم عدة Workspaces. أداة خاصة بتطبيق واحد تبقى داخل `apps/<age>/<slug>/tooling/`.
