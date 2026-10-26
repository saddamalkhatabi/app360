# حديقة البالونات

أول تطبيقات تبويب التسلية في مدرسة العائلة 360. افتح index.html عبر خادم محلي أو HTTPS. يعمل اللعب دون حساب؛ يتيح المرافق اختيار المستوى واللاعبين واللغة والحركة، والمؤثرات والموسيقى اختياريتان.

- إطلاق 1–4: index.html?launch_age=1-4&launch_level=2
- إطلاق 4–8: index.html?launch_age=4-8&launch_level=3
- الاختبار: node --test apps/1-4/balloon-garden/tests/*.test.cjs من جذر المستودع.
- تحديث الحزمة: node tooling/build-balloon-garden-offline.cjs؛ يستخدم تجزئات الملفات المشتركة المعدلة ويحتفظ بسجلات الأصول غير المتاحة في checkout جزئي.

راجع QA_AR.md لنتائج الفحص وحدوده وPREBUILD_REQUIREMENTS_AR.md لعقد التصميم. هذه مساحة لعب؛ اكتمال الحديقة لا يثبت تعلمًا أو إتقانًا معرفيًا.
