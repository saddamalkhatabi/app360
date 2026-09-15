#!/usr/bin/env python3
"""Fully offline reviewed English vocabulary + Edge TTS build.

Adds the final uncovered vocabulary to v4. Translation coverage must be 100% before
we enter the audio build, so Google Translate is never called.
"""
import importlib.util
from pathlib import Path

HERE=Path(__file__).resolve().parent
V4=HERE/'generate_english_content_v4.py'
spec=importlib.util.spec_from_file_location('english_v4',V4)
v4=importlib.util.module_from_spec(spec)
spec.loader.exec_module(v4)
mod=v4.mod

mod.CATEGORY_OVERRIDES.update({"الأدوات":"Tools"})

mod.WORD_OVERRIDES.update({
    "رأس":"Head","شعر":"Hair","وجه":"Face","عين":"Eye","أنف":"Nose","فم":"Mouth","أذن":"Ear","أسنان":"Teeth",
    "لسان":"Tongue","يد":"Hand","إصبع":"Finger","قدم":"Foot","بطن":"Belly","ظهر":"Back",
    "قميص":"Shirt","بنطال":"Pants","فستان":"Dress","حذاء":"Shoe","جورب":"Sock","قبعة":"Hat","جاكيت":"Jacket",
    "سرير":"Bed","وسادة":"Pillow","بطانية":"Blanket","لعبة":"Toy","دمية":"Doll","كرة":"Ball","كتاب":"Book",
    "كرسي":"Chair","طاولة":"Table","صندوق":"Box","باب":"Door","نافذة":"Window","مصباح":"Lamp",
    "بيت":"House","غرفة":"Room","مطبخ":"Kitchen","حمام":"Bathroom","صالة":"Living Room","درج":"Stairs",
    "مفتاح":"Key","جدار":"Wall","أرض":"Ground","سقف":"Ceiling",
    "كوب":"Cup","كأس":"Glass","طبق":"Plate","ملعقة":"Spoon","شوكة":"Fork","سكين":"Knife","قدر":"Cooking Pot",
    "إبريق":"Jug","زجاجة":"Bottle","ثلاجة":"Refrigerator","ماء":"Water","صابون":"Soap","منشفة":"Towel",
    "فرشاة":"Brush","معجون":"Toothpaste","مرآة":"Mirror",
    "خبز":"Bread","أرز":"Rice","بيض":"Eggs","جبن":"Cheese","حليب":"Milk","عصير":"Juice","كعك":"Cake",
    "بسكويت":"Biscuit","شوربة":"Soup","تفاح":"Apple","موز":"Banana","برتقال":"Orange","عنب":"Grapes",
    "فراولة":"Strawberry","بطيخ":"Watermelon","مانجو":"Mango","تمر":"Dates","طماطم":"Tomato","بطاطس":"Potatoes",
    "جزر":"Carrot","خيار":"Cucumber","بصل":"Onion","خس":"Lettuce","فلفل":"Pepper",
    "قطة":"Cat","كلب":"Dog","طائر":"Bird","سمكة":"Fish","أرنب":"Rabbit","دجاجة":"Hen","بقرة":"Cow",
    "حصان":"Horse","خروف":"Sheep","ماعز":"Goat","أسد":"Lion","فيل":"Elephant","قرد":"Monkey",
    "نملة":"Ant","نحلة":"Bee","فراشة":"Butterfly",
    "سيارة":"Car","حافلة":"Bus","شاحنة":"Truck","دراجة":"Bicycle","قطار":"Train","طائرة":"Airplane",
    "سفينة":"Ship","قارب":"Boat","شمس":"Sun","قمر":"Moon","نجم":"Star","سماء":"Sky","سحابة":"Cloud",
    "مطر":"Rain","شجرة":"Tree","زهرة":"Flower","عشب":"Grass","حجر":"Stone","بحر":"Sea",
    "أحمر":"Red","أزرق":"Blue","أصفر":"Yellow","أخضر":"Green","أبيض":"White","أسود":"Black",
    "دائرة":"Circle","مربع":"Square","مثلث":"Triangle","نجمة":"Star","بالون":"Balloon","أحجية":"Puzzle","طبلة":"Drum",
    "هاتف":"Phone","ساعة":"Clock","حقيبة":"Bag","ورقة":"Paper","صورة":"Picture","مظلة":"Umbrella","نظارة":"Glasses",
    "ساق":"Leg","لوحة":"Board","برتقالي":"Orange","بنفسجي":"Purple","وردي":"Pink","بني":"Brown","رمادي":"Gray",
    "مستطيل":"Rectangle","بيضاوي":"Oval","هلال":"Crescent","معين":"Diamond","مدرسة":"School","فصل":"Classroom",
    "طالب":"Student","مجرفة":"Shovel","خنزير بري":"Wild Boar","عبّارة":"Ferry","كاميرا":"Camera","شاحن":"Charger",
    "ابن عم":"Cousin","بنت عم":"Cousin","ابن خال":"Cousin","بنت خال":"Cousin","فرشاة شعر":"Hairbrush",
    "هدهد":"Hoopoe","كناري":"Canary","الأرض":"Earth","شاحنة نقل":"Cargo Truck","يخت":"Yacht",
    "متوازي مستطيلات":"Rectangular Prism","نصف دائرة":"Semicircle",
    "واحد":"One","اثنان":"Two","ثلاثة":"Three","أربعة":"Four","خمسة":"Five","ستة":"Six","سبعة":"Seven",
    "ثمانية":"Eight","تسعة":"Nine","عشرة":"Ten","صفر":"Zero",
    "طابعة":"Printer","ميكروفون":"Microphone","ذاكرة":"Memory","روبوت":"Robot","حامل":"Tripod"
})

# A few generic terms must still be overridden by context for the intended picture.
mod.CONTEXT_OVERRIDES.update({
    ("المنزل","أرض"):"Floor",
    ("السماء والفضاء","أرض"):"Earth",
    ("الفضاء","الأرض"):"Earth",
    ("غرفة النوم","درج"):"Drawer",
    ("المنزل","درج"):"Stairs",
    ("النباتات","ساق"):"Stem",
    ("أجزاء النبات","ساق"):"Stem",
    ("الجسم","ساق"):"Leg",
    ("الصالة","لوحة"):"Painting",
    ("الفن","لوحة"):"Painting",
    ("المدرسة","لوحة"):"Board",
    ("الرياضة","كأس"):"Trophy",
    ("المطبخ","كأس"):"Glass"
})


def require_full_reviewed_coverage():
    levels=mod.load_levels()
    categories,words,_=mod.collect(levels)
    missing_c=[c for c in categories if c not in mod.CATEGORY_OVERRIDES]
    missing_w=[w for w in words if w not in mod.WORD_OVERRIDES]
    if missing_c or missing_w:
        raise RuntimeError('Reviewed dictionary incomplete: categories=%r words=%r' % (missing_c,missing_w))
    print('Reviewed English coverage: %d/%d categories, %d/%d words' % (len(categories),len(categories),len(words),len(words)),flush=True)


if __name__=='__main__':
    require_full_reviewed_coverage()
    v4.main()
