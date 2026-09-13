#!/usr/bin/env python3
import argparse
import asyncio
import hashlib
import json
import os
import re
import sys
import tempfile
import urllib.request
from pathlib import Path

import edge_tts
import argostranslate.package
import argostranslate.translate

APP_DIR = Path(__file__).resolve().parents[1]
LEVELS_FILE = APP_DIR / "data" / "levels-inline-v8.js"
TRANSLATIONS_JS = APP_DIR / "data" / "translations-en.js"
TRANSLATIONS_JSON = APP_DIR / "data" / "translations-en.json"
AUDIO_MAP_JS = APP_DIR / "data" / "audio-map-en.js"
AUDIO_DIR = APP_DIR / "audio" / "edge-en"
MANIFEST = APP_DIR / "audio" / "edge-en-manifest.json"
SEP = "\u0001"
MODEL_URL = "https://cdn.argosopentech.io/translate-ar_en-1_0.argosmodel"

CATEGORY_OVERRIDES = {
    "الأسرة":"Family","الأسرة والأشخاص":"Family & People","العائلة والعلاقات":"Family & Relationships",
    "الجسم":"Body","أجزاء الجسم":"Body Parts","جسم الإنسان":"Human Body","الحواس":"Senses","الصحة":"Health",
    "النظافة الشخصية":"Personal Hygiene","الملابس":"Clothes","الملابس والإكسسوارات":"Clothes & Accessories",
    "غرفة الطفل":"Child's Room","غرفة النوم":"Bedroom","الصالة":"Living Room","المنزل":"Home","الأثاث":"Furniture",
    "أدوات المنزل":"Household Tools","الكهرباء والأجهزة":"Electrical Appliances","المطبخ":"Kitchen","أدوات المطبخ":"Kitchen Tools",
    "الحمام":"Bathroom","الطعام":"Food","الطعام والحبوب":"Food & Grains","منتجات الألبان":"Dairy Products",
    "اللحوم والبروتين":"Meat & Protein","الحلويات":"Sweets","التوابل":"Spices","الفواكه":"Fruits","فواكه إضافية":"More Fruits",
    "الخضروات":"Vegetables","الخضروات والأعشاب":"Vegetables & Herbs","خضروات إضافية":"More Vegetables","المكسرات والبذور":"Nuts & Seeds",
    "الحيوانات":"Animals","الحيوانات الأليفة والمزرعة":"Pets & Farm Animals","الحيوانات البرية":"Wild Animals",
    "حيوانات المناطق الباردة":"Cold-Region Animals","حيوانات الصحراء":"Desert Animals","حيوانات الغابة":"Jungle Animals",
    "الحيوانات البحرية":"Sea Animals","الكائنات البحرية":"Marine Life","الطيور":"Birds","الحشرات":"Insects",
    "الحشرات والكائنات الصغيرة":"Insects & Small Creatures","الزواحف":"Reptiles","البرمائيات":"Amphibians","أجزاء الحيوان":"Animal Parts",
    "دورة حياة الحيوان":"Animal Life Cycle","النباتات":"Plants","أجزاء النبات":"Plant Parts","الزراعة":"Farming","الحديقة":"Garden",
    "الحديقة واللعب":"Garden & Play","الطبيعة":"Nature","البيئة":"Environment","الأرض":"Earth Materials","الماء":"Water",
    "السماء والفضاء":"Sky & Space","الفضاء":"Space","الطقس":"Weather","وسائل النقل":"Transportation","وسائل النقل البرية":"Land Transportation",
    "وسائل النقل الجوية":"Air Transportation","وسائل النقل البحرية":"Water Transportation","أجزاء السيارة":"Car Parts","أجزاء الدراجة":"Bicycle Parts",
    "أجزاء الطائرة":"Airplane Parts","الطريق":"Road","إشارات المرور":"Traffic Signs","المدينة":"City","الأماكن":"Places","الأماكن العامة":"Public Places",
    "الألوان":"Colors","الأشكال":"Shapes","الرياضيات والأشكال":"Math & Shapes","الأعداد والكميات":"Numbers & Quantities","القياس":"Measurement",
    "الألعاب":"Toys","أشياء يومية":"Everyday Things","المدرسة":"School","أدوات الرسم":"Drawing Tools","الموسيقى":"Music",
    "الآلات الموسيقية":"Musical Instruments","الأشخاص والمهن":"People & Jobs","المهن":"Jobs","الأدوات":"Tools","أدوات":"Tools",
    "التكنولوجيا":"Technology","التصوير":"Photography","الفن":"Art","الرياضة":"Sports","المناسبات":"Celebrations","السفر":"Travel",
    "البحر والشاطئ":"Sea & Beach","التخييم":"Camping","الأمان":"Safety","البناء":"Construction","العلوم":"Science",
    "الوقت":"Time","أيام الأسبوع":"Days of the Week","الفصول":"Seasons","المشاعر":"Feelings","الأشياء المتقابلة":"Opposites",
    "الاتجاهات والمكان":"Directions & Position","الحجم والكمية":"Size & Quantity","الملمس والحالة":"Texture & Condition","صفات الأشياء":"Object Qualities",
    "المواضع":"Positions","التسلسل":"Sequence","الأصوات":"Sounds"
}

CONTEXT_OVERRIDES = {
    ("الجسم","ظهر"):"Back",("الوقت","ظهر"):"Noon",("الجسم","ساق"):"Leg",("النباتات","ساق"):"Stem",
    ("الحديقة","ورقة"):"Leaf",("النباتات","ورقة"):"Leaf",("أجزاء النبات","ورقة"):"Leaf",("أشياء يومية","ورقة"):"Paper",
    ("المنزل","أرض"):"Floor",("السماء والفضاء","أرض"):"Earth",("الفضاء","الأرض"):"Earth",
    ("المنزل","درج"):"Stairs",("غرفة النوم","درج"):"Drawer",("غرفة الطفل","صندوق"):"Box",
    ("المدرسة","فصل"):"Classroom",("الفصول","ربيع"):"Spring",("الفصول","صيف"):"Summer",("الفصول","خريف"):"Autumn",("الفصول","شتاء"):"Winter",
    ("الألعاب","كرة"):"Ball",("الرياضة","كرة قدم"):"Soccer Ball",("الرياضة","كرة سلة"):"Basketball",("الرياضة","كرة تنس"):"Tennis Ball",("الرياضة","كرة طائرة"):"Volleyball",
    ("الرياضيات والأشكال","كرة"):"Sphere",("الأشكال","معين"):"Rhombus",("الرياضيات والأشكال","متوازي مستطيلات"):"Rectangular Prism",
    ("التكنولوجيا","فأرة"):"Mouse",("التكنولوجيا","لوحة مفاتيح"):"Keyboard",("التكنولوجيا","سماعة"):"Headphones",
    ("المدرسة","كرة أرضية"):"Globe",("المدرسة","لوحة"):"Board",("التصوير","حامل"):"Tripod",
    ("وسائل النقل","رافعة"):"Crane",("البناء","رافعة"):"Crane",("أدوات","سلم"):"Ladder",("العلوم","ميزان"):"Scale",("أدوات","ميزان"):"Scale",
    ("الرياضة","هدف"):"Goal",("الرياضة","شبكة"):"Net",("الرياضة","مضرب"):"Racket",("الرياضة","سباحة"):"Swimming",
    ("الطبيعة","موج"):"Wave",("الماء","موج"):"Wave",("الطبيعة","عين"):"Spring",
    ("الصحة","إسعاف"):"First Aid",("وسائل النقل","سيارة إسعاف"):"Ambulance",
    ("الوقت","عصر"):"Afternoon",("الوقت","مساء"):"Evening",("الوقت","ليل"):"Night",
    ("أجزاء الجسم","كف"):"Palm",("أجزاء الجسم","فك"):"Jaw",("أجزاء الجسم","باطن القدم"):"Sole",
    ("المطبخ","حوض"):"Sink",("الحمام","حوض"):"Sink",("المطبخ","قدر"):"Cooking Pot",("المطبخ","إبريق"):"Jug",
    ("الأرض","طين"):"Clay",("الفن","طين"):"Clay",("البناء","طوب"):"Bricks",("البناء","حديد"):"Iron",
    ("الأصوات","طرق"):"Knocking",("الأصوات","خرير"):"Babbling Water",("الأصوات","مواء"):"Meowing",("الأصوات","نباح"):"Barking",("الأصوات","زئير"):"Roaring",("الأصوات","تغريد"):"Chirping"
}

WORD_OVERRIDES = {
    "أم":"Mother","أب":"Father","أخ":"Brother","أخت":"Sister","جد":"Grandfather","جدة":"Grandmother","طفل":"Child","ولد":"Boy","بنت":"Girl","عائلة":"Family",
    "رأس":"Head","شعر":"Hair","وجه":"Face","عين":"Eye","أنف":"Nose","فم":"Mouth","أذن":"Ear","أسنان":"Teeth","لسان":"Tongue","يد":"Hand","إصبع":"Finger","قدم":"Foot","بطن":"Belly",
    "قميص":"Shirt","بنطال":"Pants","فستان":"Dress","حذاء":"Shoe","جورب":"Sock","قبعة":"Hat","جاكيت":"Jacket","سرير":"Bed","وسادة":"Pillow","بطانية":"Blanket","لعبة":"Toy","دمية":"Doll","كتاب":"Book","كرسي":"Chair","طاولة":"Table","باب":"Door","نافذة":"Window","مصباح":"Lamp",
    "بيت":"House","غرفة":"Room","مطبخ":"Kitchen","حمام":"Bathroom","صالة":"Living Room","مفتاح":"Key","جدار":"Wall","سقف":"Ceiling",
    "كوب":"Cup","كأس":"Glass","طبق":"Plate","ملعقة":"Spoon","شوكة":"Fork","سكين":"Knife","زجاجة":"Bottle","ثلاجة":"Refrigerator","ماء":"Water","صابون":"Soap","منشفة":"Towel","فرشاة":"Brush","معجون":"Toothpaste","مرآة":"Mirror",
    "خبز":"Bread","أرز":"Rice","بيض":"Eggs","جبن":"Cheese","حليب":"Milk","عصير":"Juice","بسكويت":"Biscuit","شوربة":"Soup","تفاح":"Apple","موز":"Banana","برتقال":"Orange","عنب":"Grapes","فراولة":"Strawberry","بطيخ":"Watermelon","مانجو":"Mango","تمر":"Dates",
    "طماطم":"Tomato","بطاطس":"Potatoes","جزر":"Carrot","خيار":"Cucumber","بصل":"Onion","خس":"Lettuce","فلفل":"Pepper",
    "قطة":"Cat","كلب":"Dog","طائر":"Bird","سمكة":"Fish","أرنب":"Rabbit","دجاجة":"Hen","بقرة":"Cow","حصان":"Horse","خروف":"Sheep","ماعز":"Goat","أسد":"Lion","فيل":"Elephant","قرد":"Monkey","نملة":"Ant","نحلة":"Bee","فراشة":"Butterfly",
    "سيارة":"Car","حافلة":"Bus","شاحنة":"Truck","دراجة":"Bicycle","قطار":"Train","طائرة":"Airplane","سفينة":"Ship","قارب":"Boat",
    "شمس":"Sun","قمر":"Moon","نجم":"Star","سماء":"Sky","سحابة":"Cloud","مطر":"Rain","شجرة":"Tree","زهرة":"Flower","عشب":"Grass","حجر":"Stone","بحر":"Sea",
    "أحمر":"Red","أزرق":"Blue","أصفر":"Yellow","أخضر":"Green","أبيض":"White","أسود":"Black","برتقالي":"Orange","بنفسجي":"Purple","وردي":"Pink","بني":"Brown","رمادي":"Gray",
    "دائرة":"Circle","مربع":"Square","مثلث":"Triangle","نجمة":"Star","قلب":"Heart","مستطيل":"Rectangle","بيضاوي":"Oval","هلال":"Crescent",
    "هاتف":"Phone","ساعة":"Clock","حقيبة":"Bag","قلم":"Pen","صورة":"Picture","مظلة":"Umbrella","نظارة":"Glasses",
    "طبيب":"Doctor","معلم":"Teacher","شرطي":"Police Officer","سائق":"Driver","رجل":"Man","امرأة":"Woman","صديق":"Friend","صديقة":"Friend",
    "حاسوب":"Computer","شاشة":"Screen","جهاز لوحي":"Tablet","كاميرا":"Camera","شاحن":"Charger","طابعة":"Printer","ميكروفون":"Microphone","مكبر صوت":"Speaker","روبوت":"Robot",
    "واحد":"One","اثنان":"Two","ثلاثة":"Three","أربعة":"Four","خمسة":"Five","ستة":"Six","سبعة":"Seven","ثمانية":"Eight","تسعة":"Nine","عشرة":"Ten","صفر":"Zero"
}


def load_levels():
    text = LEVELS_FILE.read_text(encoding="utf-8")
    marker = "window.APP360_LEVELS="
    pos = text.find(marker)
    if pos < 0:
        raise RuntimeError("APP360_LEVELS marker missing")
    payload = text[pos + len(marker):].strip()
    if payload.endswith(";"):
        payload = payload[:-1]
    return json.loads(payload)


def ensure_argos_model():
    installed = argostranslate.translate.get_installed_languages()
    if any(x.code == "ar" for x in installed) and any(x.code == "en" for x in installed):
        return
    with tempfile.TemporaryDirectory() as td:
        target = Path(td) / "translate-ar_en.argosmodel"
        print("Downloading Argos Arabic→English model…", flush=True)
        urllib.request.urlretrieve(MODEL_URL, target)
        argostranslate.package.install_from_path(target)


def normalize_en(value):
    value = re.sub(r"\s+", " ", str(value or "")).strip(" .،؛;:")
    value = value.replace("’", "'")
    if not value:
        return value
    return value[0].upper() + value[1:]


def translate_term(text):
    if text in WORD_OVERRIDES:
        return WORD_OVERRIDES[text]
    out = normalize_en(argostranslate.translate.translate(text, "ar", "en"))
    return out


def filename_for(text):
    digest = hashlib.sha256(text.casefold().encode("utf-8")).hexdigest()[:20]
    return f"e_{digest}.mp3"


async def synthesize_one(term, voice, rate, sem, retries=4):
    AUDIO_DIR.mkdir(parents=True, exist_ok=True)
    target = AUDIO_DIR / filename_for(term)
    if target.exists() and target.stat().st_size > 900:
        return term, target, "skipped"
    tmp = target.with_suffix(".tmp.mp3")
    async with sem:
        for attempt in range(retries):
            try:
                if tmp.exists(): tmp.unlink()
                c = edge_tts.Communicate(text=term, voice=voice, rate=rate, volume="+0%", pitch="+0Hz")
                await c.save(str(tmp))
                if not tmp.exists() or tmp.stat().st_size <= 900:
                    raise RuntimeError("generated English audio is empty")
                tmp.replace(target)
                return term, target, "generated"
            except Exception as exc:
                if tmp.exists(): tmp.unlink()
                if attempt == retries - 1:
                    return term, target, f"error: {exc}"
                await asyncio.sleep(2 ** attempt)
    return term, target, "error"


async def main_async(args):
    ensure_argos_model()
    levels = load_levels()
    categories = {}
    words = {}
    ordered_terms = []
    seen_terms = set()

    for level in sorted(levels.keys(), key=lambda x: int(x)):
        for row in levels[level]:
            category = str(row[0]).strip()
            categories[category] = CATEGORY_OVERRIDES.get(category) or translate_term(category)
            for raw in str(row[2] if len(row) > 2 else "").split("|"):
                word = raw.strip()
                if not word:
                    continue
                key = category + SEP + word
                translated = CONTEXT_OVERRIDES.get((category, word)) or translate_term(word)
                translated = normalize_en(translated)
                if not translated or re.search(r"[\u0600-\u06FF]", translated):
                    raise RuntimeError(f"invalid English translation for {key!r}: {translated!r}")
                words[key] = translated
                folded = translated.casefold()
                if folded not in seen_terms:
                    seen_terms.add(folded)
                    ordered_terms.append(translated)

    payload = {"schema_version":"1.1","source_language":"ar","target_language":"en","categories":categories,"words":words}
    TRANSLATIONS_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    TRANSLATIONS_JS.write_text("window.APP360_EN=" + json.dumps(payload, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")

    sem = asyncio.Semaphore(max(1, args.concurrency))
    tasks = [synthesize_one(t, args.voice, args.rate, sem) for t in ordered_terms]
    results = []
    done = 0
    for coro in asyncio.as_completed(tasks):
        result = await coro
        results.append(result)
        done += 1
        if done % 25 == 0 or done == len(tasks):
            print(f"English audio progress {done}/{len(tasks)}", flush=True)

    errors = [(t,s) for t,_,s in results if s.startswith("error")]
    if errors:
        for t,s in errors[:30]: print(f"ERROR {t}: {s}", file=sys.stderr)
        raise SystemExit(2)

    audio_map = {}
    for term in ordered_terms:
        p = AUDIO_DIR / filename_for(term)
        if p.exists() and p.stat().st_size > 900:
            audio_map[term] = f"audio/edge-en/{p.name}"
    AUDIO_MAP_JS.write_text("window.APP360_AUDIO_MAP_EN=" + json.dumps(audio_map, ensure_ascii=False, separators=(",", ":")) + ";\n", encoding="utf-8")

    manifest = {
        "schema_version":"1.0","translation_engine":"Argos Translate offline ar→en","translation_model":"translate-ar_en-1_0",
        "audio_engine":"edge-tts","edge_tts_version":getattr(edge_tts,"__version__","unknown"),"voice":args.voice,"rate":args.rate,
        "context_entries":len(words),"categories":len(categories),"unique_english_terms":len(ordered_terms),"mapped_files":len(audio_map),
        "dedupe_rule":"one English MP3 per unique final English display term across all four levels; context-specific meanings retain distinct English terms",
        "semantic_overrides":"enabled for Arabic homographs and category-sensitive meanings",
        "fallback":"browser English TTS only when bundled MP3 is unavailable"
    }
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps(manifest, ensure_ascii=False, indent=2))


def parse_args():
    p=argparse.ArgumentParser()
    p.add_argument("--voice", default="en-US-JennyNeural")
    p.add_argument("--rate", default="-8%")
    p.add_argument("--concurrency", type=int, default=4)
    return p.parse_args()

if __name__ == "__main__":
    asyncio.run(main_async(parse_args()))
