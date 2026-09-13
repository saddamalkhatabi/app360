#!/usr/bin/env python3
import argparse
import asyncio
import hashlib
import json
import os
import re
import sys
from pathlib import Path

import edge_tts

APP_DIR = Path(__file__).resolve().parents[1]
LEVELS_FILE = APP_DIR / "data" / "levels-inline-v8.js"
AUDIO_DIR = APP_DIR / "audio" / "edge"
MAP_FILE = APP_DIR / "data" / "audio-map.js"
MANIFEST_FILE = APP_DIR / "audio" / "edge-manifest.json"

# Overrides are used only to improve ambiguous isolated-word pronunciation.
# Display text in the app remains unchanged.
PRONUNCIATION_OVERRIDES = {
    "جزر": "جَزَر",
    "ذرة": "ذُرَة",
    "تمر": "تَمْر",
    "لبن": "لَبَن",
    "ملح": "مِلْح",
    "عود": "عُود",
    "سلم": "سُلَّم",
    "رف": "رَفّ",
    "قفل": "قُفْل",
    "برد": "بَرَد",
    "طرق": "طَرْق",
    "جرس": "جَرَس",
    "صفارة": "صَفَّارَة",
    "مواء": "مُوَاء",
    "خرير": "خَرِير",
    "صفر": "صِفْر",
    "برغي": "بُرْغِيّ",
    "مخرج": "مَخْرَج",
    "مجهر": "مِجْهَر",
    "مقص": "مِقَصّ",
    "مبرد": "مِبْرَد",
    "مقبس": "مَقْبَس",
    "مقلمة": "مِقْلَمَة",
    "مغرفة": "مِغْرَفَة",
    "ملقط": "مِلْقَط",
    "مصفاة": "مِصْفَاة",
    "مقشرة": "مِقْشَرَة",
    "مبشرة": "مِبْشَرَة",
    "منشار": "مِنْشَار",
    "مثقاب": "مِثْقَاب",
    "ميزان": "مِيزَان",
    "مسمار": "مِسْمَار",
    "مطرقة": "مِطْرَقَة",
    "مفتاح": "مِفْتَاح",
    "مروحة": "مِرْوَحَة",
    "مظلة": "مِظَلَّة",
    "مزرعة": "مَزْرَعَة",
    "مكتبة": "مَكْتَبَة",
    "مدرسة": "مَدْرَسَة",
    "مستشفى": "مُسْتَشْفَى",
    "محطة": "مَحَطَّة",
    "مطار": "مَطَار",
    "ميناء": "مِينَاء",
    "منارة": "مَنَارَة",
    "منطاد": "مِنْطَاد",
    "محيط": "مُحِيط",
    "معين": "مُعَيَّن",
    "فطر": "فِطْر",
    "تين": "تِين",
    "فيل": "فِيل",
    "ثعلب": "ثَعْلَب",
    "ذئب": "ذِئْب",
    "ضبع": "ضَبُع",
    "قرد": "قِرْد",
    "خلد": "خُلْد",
    "نسر": "نَسْر",
    "صقر": "صَقْر",
    "بومة": "بُومَة",
    "نورس": "نَوْرَس",
    "فقمة": "فُقْمَة",
    "فهد": "فَهْد",
    "رنة": "رَنَّة",
    "ظبي": "ظَبْي",
    "جرادة": "جَرَادَة",
    "دعسوقة": "دَعْسُوقَة",
    "قرادة": "قُرَادَة",
    "برغوث": "بُرْغُوث",
    "يرقة": "يَرَقَة",
    "شرنقة": "شَرْنَقَة",
}


def load_levels():
    text = LEVELS_FILE.read_text(encoding="utf-8")
    marker = "window.APP360_LEVELS="
    start = text.find(marker)
    if start < 0:
        raise RuntimeError("APP360_LEVELS marker not found")
    payload = text[start + len(marker):].strip()
    if payload.endswith(";"):
        payload = payload[:-1]
    return json.loads(payload)


def unique_words(levels):
    seen = set()
    ordered = []
    for level in sorted(levels.keys(), key=lambda x: int(x)):
        for row in levels[level]:
            raw_words = row[2] if len(row) > 2 else ""
            for word in str(raw_words).split("|"):
                word = word.strip()
                if word and word not in seen:
                    seen.add(word)
                    ordered.append(word)
    return ordered


def filename_for(word):
    digest = hashlib.sha256(word.encode("utf-8")).hexdigest()[:20]
    return f"w_{digest}.mp3"


async def synthesize_one(word, voice, rate, semaphore, retries=4):
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    target = AUDIO_DIR / filename_for(word)
    if target.exists() and target.stat().st_size > 900:
        return word, target, "skipped"

    spoken = PRONUNCIATION_OVERRIDES.get(word, word)
    tmp = target.with_suffix(".tmp.mp3")
    async with semaphore:
        for attempt in range(retries):
            try:
                if tmp.exists():
                    tmp.unlink()
                communicate = edge_tts.Communicate(
                    text=spoken,
                    voice=voice,
                    rate=rate,
                    volume="+0%",
                    pitch="+0Hz",
                )
                await communicate.save(str(tmp))
                if not tmp.exists() or tmp.stat().st_size <= 900:
                    raise RuntimeError("generated audio is empty or too small")
                tmp.replace(target)
                return word, target, "generated"
            except Exception as exc:
                if tmp.exists():
                    tmp.unlink()
                if attempt == retries - 1:
                    return word, target, f"error: {exc}"
                await asyncio.sleep(2 ** attempt)
    return word, target, "error"


async def main_async(args):
    levels = load_levels()
    words = unique_words(levels)
    if args.limit:
        words = words[: args.limit]

    sem = asyncio.Semaphore(max(1, args.concurrency))
    tasks = [synthesize_one(w, args.voice, args.rate, sem) for w in words]
    results = []
    completed = 0
    for coro in asyncio.as_completed(tasks):
        result = await coro
        results.append(result)
        completed += 1
        if completed % 25 == 0 or completed == len(tasks):
            print(f"audio progress {completed}/{len(tasks)}", flush=True)

    errors = [(w, status) for w, _, status in results if status.startswith("error")]
    if errors:
        print("Failed words:", file=sys.stderr)
        for word, status in errors:
            print(f" - {word}: {status}", file=sys.stderr)
        raise SystemExit(2)

    mapping = {}
    for word in words:
        path = AUDIO_DIR / filename_for(word)
        if path.exists() and path.stat().st_size > 900:
            mapping[word] = f"audio/edge/{path.name}"

    MAP_FILE.parent.mkdir(parents=True, exist_ok=True)
    MAP_FILE.write_text(
        "window.APP360_AUDIO_MAP=" + json.dumps(mapping, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )

    generated = sum(1 for _, _, s in results if s == "generated")
    skipped = sum(1 for _, _, s in results if s == "skipped")
    manifest = {
        "schema_version": "1.0",
        "engine": "edge-tts",
        "edge_tts_version": getattr(edge_tts, "__version__", "unknown"),
        "voice": args.voice,
        "rate": args.rate,
        "unique_words": len(words),
        "mapped_files": len(mapping),
        "generated_this_run": generated,
        "skipped_existing": skipped,
        "dedupe_rule": "one MP3 per exact Arabic display word across all four levels",
        "fallback": "browser TTS only when a bundled file is unavailable",
    }
    MANIFEST_FILE.parent.mkdir(parents=True, exist_ok=True)
    MANIFEST_FILE.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(manifest, ensure_ascii=False, indent=2))


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--voice", default="ar-SA-ZariyahNeural")
    p.add_argument("--rate", default="-8%")
    p.add_argument("--concurrency", type=int, default=3)
    p.add_argument("--limit", type=int, default=0, help="Generate only the first N unique words for testing")
    return p.parse_args()


if __name__ == "__main__":
    asyncio.run(main_async(parse_args()))
