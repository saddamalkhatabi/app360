#!/usr/bin/env python3
import argparse
import asyncio
import hashlib
import json
import re
import sys
import time
from pathlib import Path

import edge_tts
from deep_translator import GoogleTranslator

APP_DIR = Path(__file__).resolve().parents[1]
LEVELS_FILE = APP_DIR / "data" / "levels-inline-v8.js"
TRANSLATIONS_JSON = APP_DIR / "data" / "translations-en.json"
TRANSLATIONS_JS = APP_DIR / "data" / "translations-en.js"
AUDIO_MAP_JS = APP_DIR / "data" / "audio-map-en.js"
AUDIO_DIR = APP_DIR / "audio" / "edge-en"
MANIFEST_FILE = APP_DIR / "audio" / "edge-en-manifest.json"
SEP = "\u0001"

CATEGORY_OVERRIDES = {
    "الأسرة":"Family","الجسم":"Body","الملابس":"Clothes","غرفة الطفل":"Child's Room","المنزل":"Home",
    "المطبخ":"Kitchen","الحمام":"Bathroom","الطعام":"Food","الفواكه":"Fruits","الخضروات":"Vegetables",
    "الحيوانات":"Animals","الحشرات":"Insects","وسائل النقل":"Transportation","الطبيعة":"Nature","الألوان":"Colors",
    "الأشكال":"Shapes","الألعاب":"Toys","أشياء يومية":"Everyday Items","الأسرة والأشخاص":"Family & People",
    "غرفة النوم":"Bedroom","الصالة":"Living Room","الحيوانات الأليفة والمزرعة":"Pets & Farm Animals",
    "الحيوانات البرية":"Wild Animals","الحيوانات البحرية":"Sea Animals","الطيور":"Birds",
    "الحشرات والكائنات الصغيرة":"Insects & Small Creatures","أجزاء السيارة":"Car Parts","الحديقة":"Garden",
    "الطقس":"Weather","المدرسة":"School","الحديقة واللعب":"Playground & Outdoor Play","أدوات الرسم":"Drawing Tools",
    "الموسيقى":"Music","الأشياء المتقابلة":"Opposites","الأشخاص والمهن":"People & Professions",
    "أجزاء الجسم":"Body Parts","الحواس":"Senses","الملابس والإكسسوارات":"Clothes & Accessories","الأثاث":"Furniture",
    "أدوات المنزل":"Household Tools","أدوات المطبخ":"Kitchen Tools","الخضروات والأعشاب":"Vegetables & Herbs",
    "المكسرات والبذور":"Nuts & Seeds","الزواحف":"Reptiles","البرمائيات":"Amphibians","أجزاء الحيوان":"Animal Parts",
    "النباتات":"Plants","السماء والفضاء":"Sky & Space","أجزاء الدراجة":"Bicycle Parts","أجزاء الطائرة":"Airplane Parts",
    "الأماكن":"Places","التكنولوجيا":"Technology","أدوات":"Tools","الرياضة":"Sports","الآلات الموسيقية":"Musical Instruments",
    "المناسبات":"Celebrations","الوقت":"Time","الاتجاهات والمكان":"Directions & Position","الحجم والكمية":"Size & Quantity",
    "الملمس والحالة":"Texture & Condition","المشاعر":"Feelings","العائلة والعلاقات":"Family & Relationships",
    "المهن":"Professions","جسم الإنسان":"Human Body","الصحة":"Health","النظافة الشخصية":"Personal Hygiene",
    "الكهرباء والأجهزة":"Electricity & Appliances","الطعام والحبوب":"Food & Grains","منتجات الألبان":"Dairy Products",
    "اللحوم والبروتين":"Meat & Protein","الحلويات":"Sweets & Desserts","التوابل":"Spices","فواكه إضافية":"More Fruits",
    "خضروات إضافية":"More Vegetables","حيوانات المناطق الباردة":"Cold-Region Animals","حيوانات الصحراء":"Desert Animals",
    "حيوانات الغابة":"Jungle Animals","الكائنات البحرية":"Marine Life","دورة حياة الحيوان":"Animal Life Cycle",
    "أجزاء النبات":"Plant Parts","الزراعة":"Farming","البيئة":"Environment","الأرض":"Earth Materials","الماء":"Water",
    "الفضاء":"Space","وسائل النقل البرية":"Land Transportation","وسائل النقل الجوية":"Air Transportation",
    "وسائل النقل البحرية":"Water Transportation","الطريق":"Road","إشارات المرور":"Traffic Signs","المدينة":"City",
    "الأماكن العامة":"Public Places","العلوم":"Science","الرياضيات والأشكال":"Math & Shapes","الأعداد والكميات":"Numbers & Quantities",
    "القياس":"Measurement","البناء":"Construction","التصوير":"Photography","الفن":"Art","السفر":"Travel",
    "البحر والشاطئ":"Sea & Beach","التخييم":"Camping","الأمان":"Safety","أيام الأسبوع":"Days of the Week",
    "الفصول":"Seasons","صفات الأشياء":"Object Properties","المواضع":"Positions","التسلسل":"Sequence","الأصوات":"Sounds",
}

# Context-sensitive vocabulary: same Arabic spelling can mean different things.
CONTEXT_OVERRIDES = {
    ("الجسم","ظهر"):"Back", ("الوقت","ظهر"):"Noon",
    ("الجسم","ساق"):"Leg", ("النباتات","ساق"):"Stem", ("أجزاء النبات","ساق"):"Stem",
    ("أشياء يومية","ورقة"):"Paper", ("أدوات الرسم","ورقة"):"Paper", ("الحديقة","ورقة"):"Leaf",
    ("النباتات","ورقة"):"Leaf", ("أجزاء النبات","ورقة"):"Leaf",
    ("المنزل","أرض"):"Floor", ("السماء والفضاء","أرض"):"Earth", ("الفضاء","الأرض"):"Earth",
    ("الألعاب","كرة"):"Ball", ("غرفة الطفل","كرة"):"Ball", ("الحديقة واللعب","كرة"):"Ball",
    ("الرياضيات والأشكال","كرة"):"Sphere",
    ("المدرسة","فصل"):"Classroom",
    ("الصالة","لوحة"):"Painting", ("المدرسة","لوحة"):"Board", ("الفن","لوحة"):"Painting",
    ("الحديقة","مقعد"):"Bench", ("أجزاء السيارة","مقعد"):"Seat", ("أجزاء الدراجة","مقعد"):"Saddle",
    ("أجزاء الطائرة","مقعد"):"Seat", ("الأثاث","مقعد"):"Seat",
    ("الحواس","نظر"):"Sight", ("الحواس","سمع"):"Hearing", ("الحواس","شم"):"Smell",
    ("الحواس","تذوق"):"Taste", ("الحواس","لمس"):"Touch",
    ("الأشكال","معين"):"Diamond", ("أجزاء الحيوان","قرن"):"Horn",
    ("الوقت","عصر"):"Afternoon", ("الطريق","دوار"):"Roundabout", ("إشارات المرور","ممنوع"):"No Entry",
    ("الأصوات","طرق"):"Knocking", ("الأصوات","مواء"):"Meowing", ("الأصوات","نباح"):"Barking",
    ("الأصوات","زئير"):"Roaring", ("الأصوات","تغريد"):"Chirping", ("الأصوات","خرير"):"Babbling Water",
    ("الأصوات","رعد"):"Thunder", ("المهن","عالم"):"Scientist", ("التكنولوجيا","ذاكرة"):"Memory",
    ("المطبخ","ميزان"):"Kitchen Scale", ("العلوم","ميزان"):"Balance Scale", ("أدوات","ميزان"):"Scale",
    ("المنزل","درج"):"Stairs", ("غرفة النوم","درج"):"Drawer",
    ("الطبيعة","مزرعة"):"Farm", ("الأماكن","مزرعة"):"Farm",
}

# Common isolated terms where a short child-friendly English label is preferred over literal machine translation.
WORD_OVERRIDES = {
    "أم":"Mother","أب":"Father","طفل":"Child","ولد":"Boy","بنت":"Girl","أخ":"Brother","أخت":"Sister",
    "جد":"Grandfather","جدة":"Grandmother","عائلة":"Family","عم":"Uncle","عمة":"Aunt","خال":"Uncle","خالة":"Aunt",
    "ابن":"Son","ابنة":"Daughter","صديق":"Friend","صديقة":"Friend","رجل":"Man","امرأة":"Woman",
    "طبيب":"Doctor","معلم":"Teacher","شرطي":"Police Officer","سائق":"Driver","رجل إطفاء":"Firefighter",
    "ساعي بريد":"Mail Carrier","قائد طائرة":"Pilot","أمين مكتبة":"Librarian","مسعف":"Paramedic",
    "قلم رصاص":"Pencil","قلم":"Pen","ممحاة":"Eraser","سبورة":"Board","مقلمة":"Pencil Case",
    "حاسوب":"Computer","حاسوب محمول":"Laptop","جهاز لوحي":"Tablet","فأرة":"Mouse","سماعة":"Headphones",
    "مكبر صوت":"Speaker","جهاز تحكم":"Remote Control","مصباح يدوي":"Flashlight","حزام أمان":"Seat Belt",
    "ممر مشاة":"Crosswalk","إشارة مرور":"Traffic Light","موقف سيارات":"Parking Lot","محطة وقود":"Gas Station",
    "كرة قدم":"Soccer Ball","كرة سلة":"Basketball","كرة طائرة":"Volleyball","كرة تنس":"Tennis Ball",
    "طائرة ورقية":"Kite","نجم البحر":"Starfish","فرس النهر":"Hippopotamus","حمار وحشي":"Zebra",
    "وحيد القرن":"Rhinoceros","فرس البحر":"Seahorse","قنديل البحر":"Jellyfish","ديك رومي":"Turkey",
    "نقار الخشب":"Woodpecker","فرس النبي":"Praying Mantis","دب قطبي":"Polar Bear","ثعلب قطبي":"Arctic Fox",
    "ثعلب صحراوي":"Fennec Fox","حوت قاتل":"Orca","سمكة مهرج":"Clownfish","سمكة قرش":"Shark",
    "سمكة منتفخة":"Pufferfish","إسفنج بحري":"Sea Sponge","جراد بحر":"Lobster","جريب فروت":"Grapefruit",
    "توت العليق":"Raspberry","فاكهة التنين":"Dragon Fruit","باشن فروت":"Passion Fruit","بطاطا حلوة":"Sweet Potato",
    "فول سوداني":"Peanut","جوز الهند":"Coconut","توت أزرق":"Blueberry","توت أسود":"Blackberry",
    "آيس كريم":"Ice Cream","لوح تقطيع":"Cutting Board","قفاز فرن":"Oven Mitt","ملعقة قياس":"Measuring Spoon",
    "كوب قياس":"Measuring Cup","مكنسة كهربائية":"Vacuum Cleaner","مفتاح كهرباء":"Light Switch","سلة مهملات":"Trash Can",
    "طاولة طعام":"Dining Table","كرسي هزاز":"Rocking Chair","خزانة أدراج":"Chest of Drawers",
    "سماعة طبيب":"Stethoscope","ميزان حرارة":"Thermometer","فرشاة أسنان":"Toothbrush","معجون أسنان":"Toothpaste",
    "خيط أسنان":"Dental Floss","قصافة أظافر":"Nail Clippers","طبيب أسنان":"Dentist",
    "قوس قزح":"Rainbow","رائد فضاء":"Astronaut","قمر صناعي":"Satellite","عاصفة رملية":"Sandstorm",
    "عاصفة ثلجية":"Blizzard","قطار سريع":"High-Speed Train","شاحنة قمامة":"Garbage Truck","سيارة إسعاف":"Ambulance",
    "سيارة شرطة":"Police Car","سيارة إطفاء":"Fire Truck","دراجة نارية":"Motorcycle","حافلة مدرسية":"School Bus",
    "سيارة أجرة":"Taxi","شاحنة صهريج":"Tanker Truck","سيارة سباق":"Race Car","سيارة كهربائية":"Electric Car",
    "طائرة ركاب":"Passenger Plane","طائرة شحن":"Cargo Plane","طائرة شراعية":"Glider","مركب شراعي":"Sailboat",
    "سفينة شحن":"Cargo Ship","سفينة ركاب":"Passenger Ship","زورق إنقاذ":"Rescue Boat","مخرج طوارئ":"Emergency Exit",
    "عوامة نجاة":"Life Ring","حقيبة سفر":"Suitcase","جواز سفر":"Passport","حقيبة نوم":"Sleeping Bag",
    "كرة أرضية":"Globe","لوحة مفاتيح":"Keyboard","مفتاح ربط":"Wrench","شريط قياس":"Measuring Tape",
    "فرشاة طلاء":"Paintbrush","بكرة طلاء":"Paint Roller","صندوق أدوات":"Toolbox","ألوان مائية":"Watercolors",
    "ألوان زيتية":"Oil Paints","عود":"Oud","إكسيليفون":"Xylophone",
}

ARABIC_RE = re.compile(r"[\u0600-\u06FF]")


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


def collect(levels):
    categories, words, pairs = [], [], []
    seen_c, seen_w, seen_p = set(), set(), set()
    for level in sorted(levels.keys(), key=lambda x: int(x)):
        for row in levels[level]:
            category = str(row[0]).strip()
            if category and category not in seen_c:
                seen_c.add(category); categories.append(category)
            for raw in str(row[2] if len(row) > 2 else "").split("|"):
                word = raw.strip()
                if not word: continue
                if word not in seen_w:
                    seen_w.add(word); words.append(word)
                pair = (category, word)
                if pair not in seen_p:
                    seen_p.add(pair); pairs.append(pair)
    return categories, words, pairs


def normalize_en(text):
    text = re.sub(r"\s+", " ", str(text or "")).strip().strip('"“”')
    text = re.sub(r"[.!]+$", "", text).strip()
    if text:
        text = text[0].upper() + text[1:]
    return text


def load_existing():
    if not TRANSLATIONS_JSON.exists():
        return {"categories": {}, "base_words": {}, "context_words": {}}
    try:
        data = json.loads(TRANSLATIONS_JSON.read_text(encoding="utf-8"))
        return {
            "categories": data.get("categories", {}),
            "base_words": data.get("base_words", {}),
            "context_words": data.get("context_words", {}),
        }
    except Exception:
        return {"categories": {}, "base_words": {}, "context_words": {}}


def translate_batch_safe(texts, translator, batch_size=30):
    result = {}
    pending = list(dict.fromkeys(texts))
    for start in range(0, len(pending), batch_size):
        batch = pending[start:start+batch_size]
        translated = None
        for attempt in range(4):
            try:
                translated = translator.translate_batch(batch)
                if len(translated) != len(batch):
                    raise RuntimeError("translation batch length mismatch")
                break
            except Exception as exc:
                if attempt == 3:
                    print(f"batch translation failed, switching to individual: {exc}", file=sys.stderr)
                time.sleep(2 ** attempt)
        if translated is None:
            translated = []
            for text in batch:
                value = None
                for attempt in range(4):
                    try:
                        value = translator.translate(text)
                        break
                    except Exception as exc:
                        if attempt == 3:
                            raise RuntimeError(f"translation failed for {text!r}: {exc}")
                        time.sleep(2 ** attempt)
                translated.append(value)
        for src, dst in zip(batch, translated):
            result[src] = normalize_en(dst)
        print(f"translated {min(start+len(batch), len(pending))}/{len(pending)}", flush=True)
        time.sleep(0.35)
    return result


def filename_for(text):
    digest = hashlib.sha256(text.casefold().encode("utf-8")).hexdigest()[:20]
    return f"e_{digest}.mp3"


async def synthesize_one(text, voice, rate, sem, retries=4):
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    target = AUDIO_DIR / filename_for(text)
    if target.exists() and target.stat().st_size > 900:
        return text, target, "skipped"
    tmp = target.with_suffix(".tmp.mp3")
    async with sem:
        for attempt in range(retries):
            try:
                if tmp.exists(): tmp.unlink()
                comm = edge_tts.Communicate(text=text, voice=voice, rate=rate, volume="+0%", pitch="+0Hz")
                await comm.save(str(tmp))
                if not tmp.exists() or tmp.stat().st_size <= 900:
                    raise RuntimeError("generated audio is empty or too small")
                tmp.replace(target)
                return text, target, "generated"
            except Exception as exc:
                if tmp.exists(): tmp.unlink()
                if attempt == retries - 1:
                    return text, target, f"error: {exc}"
                await asyncio.sleep(2 ** attempt)
    return text, target, "error"


async def main_async(args):
    levels = load_levels()
    categories, words, pairs = collect(levels)
    existing = load_existing()
    cat_map = dict(existing["categories"])
    base_map = dict(existing["base_words"])

    translator = GoogleTranslator(source="ar", target="en")

    cat_missing = [c for c in categories if c not in CATEGORY_OVERRIDES and not cat_map.get(c)]
    if cat_missing:
        cat_map.update(translate_batch_safe(cat_missing, translator))
    cat_map.update({c: CATEGORY_OVERRIDES[c] for c in categories if c in CATEGORY_OVERRIDES})

    word_missing = [w for w in words if w not in WORD_OVERRIDES and not base_map.get(w)]
    if word_missing:
        base_map.update(translate_batch_safe(word_missing, translator))
    base_map.update({w: WORD_OVERRIDES[w] for w in words if w in WORD_OVERRIDES})

    context_map = {}
    bad = []
    for category, word in pairs:
        value = CONTEXT_OVERRIDES.get((category, word), base_map.get(word, ""))
        value = normalize_en(value)
        if not value or ARABIC_RE.search(value):
            bad.append((category, word, value))
        context_map[f"{category}{SEP}{word}"] = value
    if bad:
        raise RuntimeError(f"invalid English translations: {bad[:20]}")

    payload = {
        "schema_version": "1.0",
        "source_language": "ar",
        "target_language": "en-US",
        "categories": cat_map,
        "base_words": base_map,
        "context_words": context_map,
        "context_overrides": len(CONTEXT_OVERRIDES),
    }
    TRANSLATIONS_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    TRANSLATIONS_JS.write_text(
        "window.APP360_EN=" + json.dumps({"categories":cat_map,"words":context_map}, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )

    english_words = []
    seen_en = set()
    for key in context_map:
        term = context_map[key]
        norm = term.casefold()
        if norm not in seen_en:
            seen_en.add(norm); english_words.append(term)

    if args.limit:
        english_words = english_words[:args.limit]
    sem = asyncio.Semaphore(max(1, args.concurrency))
    tasks = [synthesize_one(term, args.voice, args.rate, sem) for term in english_words]
    results = []
    for i, coro in enumerate(asyncio.as_completed(tasks), 1):
        results.append(await coro)
        if i % 25 == 0 or i == len(tasks):
            print(f"English audio progress {i}/{len(tasks)}", flush=True)
    errors = [(t,s) for t,_,s in results if s.startswith("error")]
    if errors:
        raise RuntimeError(f"English audio failures: {errors[:20]}")

    audio_map = {}
    for term in english_words:
        path = AUDIO_DIR / filename_for(term)
        if path.exists() and path.stat().st_size > 900:
            audio_map[term] = f"audio/edge-en/{path.name}"
    AUDIO_MAP_JS.write_text(
        "window.APP360_AUDIO_MAP_EN=" + json.dumps(audio_map, ensure_ascii=False, separators=(",", ":")) + ";\n",
        encoding="utf-8",
    )

    manifest = {
        "schema_version":"1.0",
        "engine":"edge-tts",
        "edge_tts_version":getattr(edge_tts,"__version__","unknown"),
        "voice":args.voice,
        "rate":args.rate,
        "source_unique_arabic_words":len(words),
        "context_entries":len(context_map),
        "unique_english_terms":len(english_words),
        "mapped_files":len(audio_map),
        "generated_this_run":sum(1 for _,_,s in results if s=="generated"),
        "skipped_existing":sum(1 for _,_,s in results if s=="skipped"),
        "dedupe_rule":"one English MP3 per exact English display term; context-sensitive Arabic meanings may translate differently",
        "fallback":"English browser TTS only when bundled MP3 is unavailable",
    }
    MANIFEST_FILE.write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


def parse_args():
    p=argparse.ArgumentParser()
    p.add_argument("--voice",default="en-US-JennyNeural")
    p.add_argument("--rate",default="-8%")
    p.add_argument("--concurrency",type=int,default=4)
    p.add_argument("--limit",type=int,default=0)
    return p.parse_args()


if __name__=="__main__":
    asyncio.run(main_async(parse_args()))
