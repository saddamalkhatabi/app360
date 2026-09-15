#!/usr/bin/env python3
"""Clean English build for Say & Name.

This wrapper intentionally ignores the old machine-translation cache, extends the
reviewed child-friendly dictionary, runs the v3 batched Google + Edge-TTS build,
and rejects unsafe / obviously broken labels before the workflow can publish them.
"""
import asyncio
import importlib.util
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
V3 = HERE / "generate_english_content_v3.py"
spec = importlib.util.spec_from_file_location("english_v3", V3)
v3 = importlib.util.module_from_spec(spec)
spec.loader.exec_module(v3)
mod = v3.mod
SEP = "\u0001"

# Extra high-confidence labels. v3 already contains the large reviewed dictionary;
# this list closes remaining common gaps and makes the intended child label explicit.
mod.WORD_OVERRIDES.update({
    "ابنة":"Daughter","هدهد":"Hoopoe","كرة أرضية":"Globe","لوحة مفاتيح":"Keyboard","شاحن":"Charger",
    "إكسيليفون":"Xylophone","متوازي مستطيلات":"Rectangular Prism","نصف دائرة":"Semicircle",
    "شريط قياس":"Measuring Tape","فرشاة طلاء":"Paintbrush","بكرة طلاء":"Paint Roller","صندوق أدوات":"Toolbox",
    "طابعة":"Printer","ميكروفون":"Microphone","روبوت":"Robot","حامل":"Tripod","ألوان مائية":"Watercolors",
    "ألوان زيتية":"Oil Paints","حقيبة سفر":"Suitcase","جواز سفر":"Passport","حقيبة نوم":"Sleeping Bag",
    "مخرج طوارئ":"Emergency Exit","عوامة نجاة":"Life Buoy","مفتاح ربط":"Wrench","قلم رصاص":"Pencil",
    "مقلمة":"Pencil Case","ألوان شمعية":"Crayons","سماعة طبيب":"Stethoscope","فرشاة شعر":"Hairbrush",
    "مركب شراعي":"Sailboat","يخت":"Yacht","رنة":"Reindeer","هدهد":"Hoopoe","نقار الخشب":"Woodpecker",
    "فرس النبي":"Praying Mantis","شرنقة":"Cocoon","بالغ":"Adult","محمية":"Nature Reserve",
    "جدول":"Stream","عطارد":"Mercury","الزهرة":"Venus","المشتري":"Jupiter","مذنب":"Comet",
    "طائرة شراعية":"Glider","شاحنة نقل":"Cargo Truck","رصيف":"Sidewalk","حديقة حيوان":"Zoo",
    "مدير":"Principal","ساحة":"Schoolyard","مقصف":"Cafeteria","تجربة":"Experiment","سداسي":"Hexagon",
    "خماسي":"Pentagon","رفيع":"Thin","سميك":"Thick","ضحل":"Shallow","باهت":"Dull",
    "مقابل":"Opposite","ثالث":"Third","صفارة":"Whistle","دهشة":"Surprise","حماس":"Excitement",
    "هدوء":"Calm","ملل":"Boredom","قلق":"Worry","خجل":"Shyness","عوامة":"Float","منارة":"Lighthouse",
    "صدفة":"Seashell","مرمى":"Goal","كأس":"Trophy","قماش":"Canvas","علم":"Flag"
})

# Context labels that should differ from a generic dictionary term.
mod.CONTEXT_OVERRIDES.update({
    ("الرياضة","كأس"):"Trophy",
    ("المطبخ","كأس"):"Glass",
    ("الأرض","معدن"):"Mineral",
    ("العلوم","تجربة"):"Experiment",
    ("المدرسة","مدير"):"Principal",
    ("المدرسة","ساحة"):"Schoolyard",
    ("المدرسة","مقصف"):"Cafeteria",
    ("الطريق","رصيف"):"Sidewalk",
    ("البحر والشاطئ","صدفة"):"Seashell",
    ("البحر والشاطئ","عوامة"):"Float",
    ("الأمان","عوامة نجاة"):"Life Buoy",
    ("التصوير","حامل"):"Tripod",
    ("الفن","قماش"):"Canvas",
    ("المشاعر","دهشة"):"Surprise",
    ("المشاعر","خجل"):"Shyness",
    ("المشاعر","حماس"):"Excitement",
    ("المشاعر","هدوء"):"Calm",
    ("المشاعر","ملل"):"Boredom",
    ("المشاعر","قلق"):"Worry"
})

# Values that must never ship in a preschool vocabulary library. Some came from
# an earlier experimental translator; others catch obvious separator/transliteration failures.
BANNED_EXACT = {
    "Clear","Here","Deaf","Like a","A needle","Kneel","Son","Ass","Dick","Cock","Bullshit",
    "Asshole","Bitch","Crap","Nigger","Faggot","Faggoti","Shit","Grenade","Buddha","Hamas",
    "Hello?","Hurry!","Fire!","Taser!","Knock yourself out","Prophet Knight","The flower","Buyer",
    "A stalker","A bomber","Romie Dick","Champagne!","And Dan","Gary","Nasty","Mecca","Adapted"
}
BANNED_PARTS = ("nigger","faggot","asshole","bullshit","bitch","shit!")


def force_clean_start():
    # The old JSON is deliberately removed before main_async reads it. This ensures
    # any non-curated word is freshly translated instead of preserving a historical bad value.
    try:
        if mod.TRANSLATIONS_JSON.exists():
            mod.TRANSLATIONS_JSON.unlink()
            print("Removed stale English translation cache", flush=True)
    except Exception as exc:
        print("Could not remove old translation cache:", exc, file=sys.stderr)
        raise


def validate_generated():
    text = mod.TRANSLATIONS_JS.read_text(encoding="utf-8").strip()
    marker = "window.APP360_EN="
    if not (text.startswith(marker) and text.endswith(";")):
        raise RuntimeError("invalid translations-en.js wrapper")
    data = json.loads(text[len(marker):-1])
    words = data.get("words", {})
    cats = data.get("categories", {})
    if len(words) < 1190 or len(cats) < 100:
        raise RuntimeError("English vocabulary output is incomplete")

    required = {
        "الأسرة والأشخاص"+SEP+"خال":"Uncle",
        "الأسرة والأشخاص"+SEP+"ابنة":"Daughter",
        "الجسم"+SEP+"حاجب":"Eyebrow",
        "الجسم"+SEP+"خد":"Cheek",
        "الجسم"+SEP+"كوع":"Elbow",
        "الجسم"+SEP+"معصم":"Wrist",
        "الجسم"+SEP+"ظهر":"Back",
        "الوقت"+SEP+"ظهر":"Noon",
        "النباتات"+SEP+"ساق":"Stem",
        "الجسم"+SEP+"ساق":"Leg",
        "المنزل"+SEP+"أرض":"Floor",
        "السماء والفضاء"+SEP+"أرض":"Earth",
        "الرياضيات والأشكال"+SEP+"كرة":"Sphere",
        "الألعاب"+SEP+"كرة":"Ball",
        "الطيور"+SEP+"هدهد":"Hoopoe",
        "الحشرات والكائنات الصغيرة"+SEP+"فرس النبي":"Praying Mantis",
        "الفضاء"+SEP+"عطارد":"Mercury",
        "الفضاء"+SEP+"الزهرة":"Venus",
        "الفضاء"+SEP+"المشتري":"Jupiter",
        "وسائل النقل الجوية"+SEP+"طائرة شراعية":"Glider",
        "المدرسة"+SEP+"مدير":"Principal",
        "العلوم"+SEP+"تجربة":"Experiment",
        "الفن"+SEP+"قماش":"Canvas",
        "الرياضة"+SEP+"كأس":"Trophy",
        "البحر والشاطئ"+SEP+"صدفة":"Seashell"
    }
    for key, expected in required.items():
        if words.get(key) != expected:
            raise RuntimeError("required English label mismatch %r: %r != %r" % (key, words.get(key), expected))

    suspicious = []
    for key, value in words.items():
        val = str(value or "").strip()
        low = val.casefold()
        if not val or re.search(r"[\u0600-\u06FF]", val):
            suspicious.append((key, val, "empty-or-Arabic"))
        if val in BANNED_EXACT or any(part in low for part in BANNED_PARTS):
            suspicious.append((key, val, "banned"))
        if len(val) > 55:
            suspicious.append((key, val, "too-long"))
        # Isolated labels ending with strong punctuation are almost always a broken translation.
        if re.search(r"[!?]$", val):
            suspicious.append((key, val, "punctuation"))
    if suspicious:
        raise RuntimeError("Unsafe/suspicious English labels: %r" % suspicious[:40])
    print("Validated clean English vocabulary:", len(words), "entries", flush=True)


def main():
    force_clean_start()
    asyncio.run(mod.main_async(mod.parse_args()))
    validate_generated()
    v3.cleanup_unreferenced_audio()


if __name__ == "__main__":
    main()
