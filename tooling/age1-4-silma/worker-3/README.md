# تشغيل SILMA — العامل 3

هذه ملفات نصية تجريبية وليست تسجيلات. لم تُولّد MP3 بعد.

قبل التوليد يجب توفير Python وsilma-tts 1.0.5 وأوزان النموذج المخزنة محلياً وffmpeg واعتمادات الأداة الأصلية.

من جذر المستودع في فرع العامل الثالث فقط:

```bash
python tooling/build-silma-audio.py --root . --manifest tooling/age1-4-silma/worker-3/silma-pilot-manifest.json --cache /tmp/silma-worker3-cache --model-cache /path/to/preloaded/hf-cache --generate-only --precision fp32
```

بعد التوليد افحص كل MP3 يدوياً وسمعياً، ثم اربط الصوت بالحدث الصحيح واختبره داخل التطبيق قبل أي رابط معاينة.

```bash
node tooling/age1-4-silma/worker-3/check-narration.js
```

التوليد يقتصر على المقاطع المشكّلة في manifest التجريبي. بقية المسودات ليست جاهزة للنطق ولا يجوز توليدها آلياً دون مراجعة. لا نشر ولا دمج في الإنتاج.
