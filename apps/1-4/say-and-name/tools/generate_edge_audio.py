#!/usr/bin/env python3
import argparse
import asyncio
import hashlib
import json
import sys
from pathlib import Path

import edge_tts

APP_DIR = Path(__file__).resolve().parents[1]
LEVELS_FILE = APP_DIR / "data" / "levels-inline-v8.js"
AUDIO_DIR = APP_DIR / "audio" / "edge"
SENSE_AUDIO_DIR = APP_DIR / "audio" / "edge-sense"
MAP_FILE = APP_DIR / "data" / "audio-map.js"
SENSE_MAP_FILE = APP_DIR / "data" / "audio-sense-map.js"
MANIFEST_FILE = APP_DIR / "audio" / "edge-manifest.json"

# Overrides improve ambiguous isolated-word pronunciation while display text stays unchanged.
PRONUNCIATION_OVERRIDES = {
    "جزر": "جَزَر", "ذرة": "ذُرَة", "تمر": "تَمْر", "لبن": "لَبَن", "ملح": "مِلْح",
    "عود": "عُود", "سلم": "سُلَّم", "رف": "رَفّ", "قفل": "قُفْل", "برد": "بَرَد",
    "طرق": "طَرْق", "جرس": "جَرَس", "صفارة": "صَفَّارَة", "مواء": "مُوَاء", "خرير": "خَرِير",
    "صفر": "صِفْر", "برغي": "بُرْغِيّ", "مخرج": "مَخْرَج", "مجهر": "مِجْهَر", "مقص": "مِقَصّ",
    "مبرد": "مِبْرَد", "مقبس": "مَقْبَس", "مقلمة": "مِقْلَمَة", "مغرفة": "مِغْرَفَة", "ملقط": "مِلْقَط",
    "مصفاة": "مِصْفَاة", "مقشرة": "مِقْشَرَة", "مبشرة": "مِبْشَرَة", "منشار": "مِنْشَار",
    "مثقاب": "مِثْقَاب", "ميزان": "مِيزَان", "مسمار": "مِسْمَار", "مطرقة": "مِطْرَقَة",
    "مفتاح": "مِفْتَاح", "مروحة": "مِرْوَحَة", "مظلة": "مِظَلَّة", "مزرعة": "مَزْرَعَة",
    "مكتبة": "مَكْتَبَة", "مدرسة": "مَدْرَسَة", "مستشفى": "مُسْتَشْفَى", "محطة": "مَحَطَّة",
    "مطار": "مَطَار", "ميناء": "مِينَاء", "منارة": "مَنَارَة", "منطاد": "مِنْطَاد", "محيط": "مُحِيط",
    "معين": "مُعَيَّن", "فطر": "فِطْر", "تين": "تِين", "فيل": "فِيل", "ثعلب": "ثَعْلَب",
    "ذئب": "ذِئْب", "ضبع": "ضَبُع", "قرد": "قِرْد", "خلد": "خُلْد", "نسر": "نَسْر",
    "صقر": "صَقْر", "بومة": "بُومَة", "نورس": "نَوْرَس", "فقمة": "فُقْمَة", "فهد": "فَهْد",
    "رنة": "رَنَّة", "ظبي": "ظَبْي", "جرادة": "جَرَادَة", "دعسوقة": "دَعْسُوقَة",
    "قرادة": "قُرَادَة", "برغوث": "بُرْغُوث", "يرقة": "يَرَقَة", "شرنقة": "شَرْنَقَة",
}

# Homographs that must NOT share the same recording because pronunciation/meaning differs by category.
# key = (Arabic category, Arabic display word)
SENSE_PRONUNCIATION_OVERRIDES = {
    ("الجسم", "ظهر"): "ظَهْر",
    ("الوقت", "ظهر"): "ظُهْر",
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
    seen, ordered = set(), []
    for level in sorted(levels.keys(), key=lambda x: int(x)):
        for row in levels[level]:
            raw_words = row[2] if len(row) > 2 else ""
            for word in str(raw_words).split("|"):
                word = word.strip()
                if word and word not in seen:
                    seen.add(word)
                    ordered.append(word)
    return ordered


def available_pairs(levels):
    pairs = set()
    for level in sorted(levels.keys(), key=lambda x: int(x)):
        for row in levels[level]:
            category = str(row[0]).strip()
            raw_words = row[2] if len(row) > 2 else ""
            for word in str(raw_words).split("|"):
                word = word.strip()
                if category and word:
                    pairs.add((category, word))
    return pairs


def filename_for(word):
    digest = hashlib.sha256(word.encode("utf-8")).hexdigest()[:20]
    return f"w_{digest}.mp3"


def sense_filename_for(category, word, spoken):
    seed = f"{category}\0{word}\0{spoken}"
    digest = hashlib.sha256(seed.encode("utf-8")).hexdigest()[:20]
    return f"s_{digest}.mp3"


async def synthesize_to(target, spoken, voice, rate, semaphore, retries=4):
    target.parent.mkdir(parents=True, exist_ok=True)
    if target.exists() and target.stat().st_size > 900:
        return "skipped"
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
                return "generated"
            except Exception as exc:
                if tmp.exists():
                    tmp.unlink()
                if attempt == retries - 1:
                    return f"error: {exc}"
                await asyncio.sleep(2 ** attempt)
    return "error"


async def main_async(args):
    levels = load_levels()
    words = unique_words(levels)
    if args.limit:
        words = words[: args.limit]

    sem = asyncio.Semaphore(max(1, args.concurrency))
    tasks = []
    meta = []
    for word in words:
        target = AUDIO_DIR / filename_for(word)
        spoken = PRONUNCIATION_OVERRIDES.get(word, word)
        tasks.append(synthesize_to(target, spoken, args.voice, args.rate, sem))
        meta.append(("word", word, target))

    pairs = available_pairs(levels)
    for (category, word), spoken in SENSE_PRONUNCIATION_OVERRIDES.items():
        if (category, word) not in pairs:
            continue
        target = SENSE_AUDIO_DIR / sense_filename_for(category, word, spoken)
        tasks.append(synthesize_to(target, spoken, args.voice, args.rate, sem))
        meta.append(("sense", f"{category}\u0001{word}", target))

    statuses = await asyncio.gather(*tasks)
    errors = [(meta[i][1], statuses[i]) for i in range(len(statuses)) if statuses[i].startswith("error")]
    if errors:
        for key, status in errors:
            print(f" - {key}: {status}", file=sys.stderr)
        raise SystemExit(2)

    mapping = {}
    for word in words:
        path = AUDIO_DIR / filename_for(word)
        if path.exists() and path.stat().st_size > 900:
            mapping[word] = f"audio/edge/{path.name}"

    sense_mapping = {}
    for (category, word), spoken in SENSE_PRONUNCIATION_OVERRIDES.items():
        if (category, word) not in pairs:
            continue
        path = SENSE_AUDIO_DIR / sense_filename_for(category, word, spoken)
        if path.exists() and path.stat().st_size > 900:
            sense_mapping[f"{category}\u0001{word}"] = f"audio/edge-sense/{path.name}"

    MAP_FILE.write_text(
        "window.APP360_AUDIO_MAP=" + json.dumps(mapping, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )
    SENSE_MAP_FILE.write_text(
        "window.APP360_AUDIO_SENSE_MAP=" + json.dumps(sense_mapping, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )

    generated = sum(1 for s in statuses if s == "generated")
    skipped = sum(1 for s in statuses if s == "skipped")
    manifest = {
        "schema_version": "1.1",
        "engine": "edge-tts",
        "edge_tts_version": getattr(edge_tts, "__version__", "unknown"),
        "voice": args.voice,
        "rate": args.rate,
        "unique_words": len(words),
        "mapped_files": len(mapping),
        "sense_specific_files": len(sense_mapping),
        "generated_this_run": generated,
        "skipped_existing": skipped,
        "dedupe_rule": "one MP3 per exact Arabic display word, except true homographs with distinct semantic pronunciation",
        "fallback": "browser TTS only when a bundled file is unavailable",
    }
    MANIFEST_FILE.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


def parse_args():
    p = argparse.ArgumentParser()
    p.add_argument("--voice", default="ar-SA-ZariyahNeural")
    p.add_argument("--rate", default="-8%")
    p.add_argument("--concurrency", type=int, default=3)
    p.add_argument("--limit", type=int, default=0)
    return p.parse_args()


if __name__ == "__main__":
    asyncio.run(main_async(parse_args()))
