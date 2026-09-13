#!/usr/bin/env python3
import asyncio
import importlib.util
import json
import re
import sys
import time
from pathlib import Path

from deep_translator.exceptions import TooManyRequests

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "generate_english_content.py"
spec = importlib.util.spec_from_file_location("english_base", SOURCE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

MARKER = "ZXQAPP360SPLITQZX"

# High-confidence child-friendly labels for short isolated words that are easy for
# machine translation to misread without context. These extend the curated map in
# generate_english_content.py and take precedence over machine translation.
mod.WORD_OVERRIDES.update({
    "حاجب":"Eyebrow","خد":"Cheek","ذقن":"Chin","رقبة":"Neck","كتف":"Shoulder","ذراع":"Arm",
    "كوع":"Elbow","معصم":"Wrist","صدر":"Chest","ركبة":"Knee","كعب":"Heel","أصابع":"Fingers","أظافر":"Nails",
    "جبهة":"Forehead","جفن":"Eyelid","رموش":"Eyelashes","شفة":"Lip","لثة":"Gums","فك":"Jaw","كف":"Palm",
    "إبهام":"Thumb","مفصل":"Joint","كاحل":"Ankle","باطن القدم":"Sole","جمجمة":"Skull","عظم":"Bone",
    "عضلة":"Muscle","قلب":"Heart","رئة":"Lung","معدة":"Stomach","دماغ":"Brain","جلد":"Skin","دم":"Blood",
    "نظر":"Sight","سمع":"Hearing","شم":"Smell","تذوق":"Taste","لمس":"Touch",
    "سروال":"Trousers","تنورة":"Skirt","كنزة":"Sweater","حزام":"Belt","وشاح":"Scarf","قفاز":"Glove",
    "صندل":"Sandal","شبشب":"Slipper","معطف":"Coat","بدلة":"Suit","ربطة عنق":"Tie","سترة":"Jacket",
    "بيجاما":"Pajamas","زي":"Uniform","خوذة":"Helmet","حقيبة ظهر":"Backpack","محفظة":"Wallet","سوار":"Bracelet",
    "خاتم":"Ring","قلادة":"Necklace","خزانة":"Wardrobe","رف":"Shelf","ستارة":"Curtain","سجادة":"Rug",
    "شماعة":"Hanger","مروحة":"Fan","مكيف":"Air Conditioner","منبه":"Alarm Clock","ملاءة":"Bed Sheet",
    "أريكة":"Sofa","تلفاز":"Television","مزهرية":"Vase","موقد":"Stove","فرن":"Oven","صينية":"Tray",
    "مقلاة":"Frying Pan","غلاية":"Kettle","خلاط":"Blender","مصفاة":"Strainer","مغرفة":"Ladle","علبة":"Container",
    "صحن":"Dish","فنجان":"Cup","سلة":"Basket","حوض":"Sink","دش":"Shower","حنفية":"Faucet","مرحاض":"Toilet",
    "إسفنجة":"Sponge","مشط":"Comb","شامبو":"Shampoo","مناديل":"Tissues",
    "معكرونة":"Pasta","دجاج":"Chicken","لحم":"Meat","سمك":"Fish","زبادي":"Yogurt","زبدة":"Butter","عسل":"Honey",
    "مربى":"Jam","فاصوليا":"Beans","عدس":"Lentils","ذرة":"Corn","فطيرة":"Pie","ساندويتش":"Sandwich",
    "كمثرى":"Pear","خوخ":"Peach","مشمش":"Apricot","رمان":"Pomegranate","كرز":"Cherry","أناناس":"Pineapple",
    "شمام":"Melon","جوافة":"Guava","تين":"Fig","ليمون":"Lemon","باذنجان":"Eggplant","كوسا":"Zucchini",
    "ملفوف":"Cabbage","قرنبيط":"Cauliflower","بروكلي":"Broccoli","بازلاء":"Peas","سبانخ":"Spinach","فجل":"Radish",
    "ثوم":"Garlic","بطاطا":"Sweet Potato","حمار":"Donkey","جمل":"Camel","بطة":"Duck","ديك":"Rooster",
    "كتكوت":"Chick","أوزة":"Goose","عجل":"Calf","مهر":"Foal","زرافة":"Giraffe","نمر":"Tiger","دب":"Bear",
    "ذئب":"Wolf","ثعلب":"Fox","غزال":"Gazelle","تمساح":"Crocodile","دلفين":"Dolphin","حوت":"Whale",
    "سلحفاة":"Turtle","أخطبوط":"Octopus","سلطعون":"Crab","قرش":"Shark","حمامة":"Pigeon","عصفور":"Sparrow",
    "ببغاء":"Parrot","بومة":"Owl","نسر":"Eagle","بطريق":"Penguin","ذبابة":"Fly","بعوضة":"Mosquito",
    "خنفساء":"Beetle","عنكبوت":"Spider","دودة":"Worm","حلزون":"Snail","جرار":"Tractor","مترو":"Metro",
    "مروحية":"Helicopter","صاروخ":"Rocket","عجلة":"Wheel","مقود":"Steering Wheel","مقعد":"Seat","غصن":"Branch",
    "بذرة":"Seed","تربة":"Soil","أرجوحة":"Swing","زحليقة":"Slide","جبل":"Mountain","نهر":"River","بحيرة":"Lake",
    "صحراء":"Desert","جزيرة":"Island","رمل":"Sand","موج":"Wave","غابة":"Forest","مزرعة":"Farm","طريق":"Road",
    "مشمس":"Sunny","ممطر":"Rainy","غائم":"Cloudy","حار":"Hot","بارد":"Cold","رياح":"Windy","طبشور":"Chalk",
    "ألوان":"Colors","دفتر":"Notebook","مسطرة":"Ruler","جرس":"Bell","بيانو":"Piano","جيتار":"Guitar","ناي":"Flute",
    "كبير":"Big","صغير":"Small","طويل":"Long","قصير":"Short","فوق":"Above","تحت":"Below","داخل":"Inside",
    "خارج":"Outside","مفتوح":"Open","مغلق":"Closed","ممتلئ":"Full","فارغ":"Empty",
    "ممرض":"Nurse","مهندس":"Engineer","نجار":"Carpenter","خباز":"Baker","طباخ":"Cook","مزارع":"Farmer",
    "بائع":"Seller","حلاق":"Barber","خياط":"Tailor","عامل":"Worker","صياد":"Fisherman","رسام":"Artist","مصور":"Photographer",
    "مدخل":"Entrance","ممر":"Hallway","شرفة":"Balcony","حديقة":"Garden","سطح":"Roof","بوابة":"Gate","سياج":"Fence",
    "مقبس":"Socket","مصعد":"Elevator","مكتب":"Desk","مكتبة":"Library","منضدة":"Table","مكنسة":"Broom","ممسحة":"Mop",
    "دلو":"Bucket","غسالة":"Washing Machine","مكواة":"Iron","مجفف":"Dryer","مبشرة":"Grater","فتاحة":"Opener",
    "ملقط":"Tongs","مضرب":"Whisk","ميزان":"Scale","وعاء":"Bowl","برطمان":"Jar","حاوية":"Container","ترمس":"Thermos",
    "بيتزا":"Pizza","سلطة":"Salad","شطيرة":"Sandwich","حساء":"Soup","حبوب":"Cereal","شوفان":"Oats","زيت":"Oil",
    "سكر":"Sugar","ملح":"Salt","دقيق":"Flour","مكسرات":"Nuts","زبيب":"Raisins","كيوي":"Kiwi","برقوق":"Plum",
    "توت":"Berries","أفوكادو":"Avocado","بابايا":"Papaya","كرفس":"Celery","بقدونس":"Parsley","نعناع":"Mint",
    "كزبرة":"Coriander","يقطين":"Pumpkin","فطر":"Mushroom","زيتون":"Olives","فلفل حار":"Chili Pepper",
    "لوز":"Almond","جوز":"Walnut","فستق":"Pistachio","سمسم":"Sesame","بذور":"Seeds","كنغر":"Kangaroo","باندا":"Panda",
    "كوالا":"Koala","جاموس":"Buffalo","ضبع":"Hyena","راكون":"Raccoon","ثعبان":"Snake","سحلية":"Lizard","حرباء":"Chameleon",
    "ضفدع":"Frog","حبار":"Squid","محار":"Shellfish","روبيان":"Shrimp","فقمة":"Seal","طاووس":"Peacock","بجعة":"Swan",
    "لقلق":"Stork","صقر":"Falcon","غراب":"Crow","نورس":"Seagull","جرادة":"Grasshopper","يعسوب":"Dragonfly",
    "صرصور":"Cockroach","يرقة":"Larva","دعسوقة":"Ladybug","ذيل":"Tail","جناح":"Wing","منقار":"Beak","ريش":"Feathers",
    "قرن":"Horn","حافر":"Hoof","مخلب":"Claw","فراء":"Fur","قوقعة":"Shell","جذر":"Root","ثمرة":"Fruit","جذع":"Trunk",
    "وادي":"Valley","تل":"Hill","شلال":"Waterfall","كهف":"Cave","بركة":"Pond","ساحل":"Coast","شاطئ":"Beach","محيط":"Ocean",
    "بركان":"Volcano","كوكب":"Planet","فضاء":"Space","ضباب":"Fog","عاصفة":"Storm","برق":"Lightning","رعد":"Thunder","ثلج":"Snow",
    "ترام":"Tram","قاطرة":"Locomotive","جرافة":"Bulldozer","حفارة":"Excavator","زورق":"Boat","عبارة":"Ferry","غواصة":"Submarine",
    "دواسة":"Pedal","سلسلة":"Chain","محرك":"Engine","مستشفى":"Hospital","متجر":"Store","سوق":"Market","مخبز":"Bakery",
    "مطعم":"Restaurant","مسجد":"Mosque","محطة":"Station","مطار":"Airport","ميناء":"Port","مقص":"Scissors","غراء":"Glue",
    "ألوان شمعية":"Crayons","خريطة":"Map","شاشة":"Screen","مطرقة":"Hammer","مفك":"Screwdriver","مسمار":"Nail","برغي":"Screw",
    "كماشة":"Pliers","منشار":"Saw","سلم":"Ladder","شبكة":"Net","هدف":"Goal","سباحة":"Swimming","كمان":"Violin",
    "ساكسفون":"Saxophone","بوق":"Trumpet","دف":"Tambourine","هدية":"Gift","كعكة":"Cake","شمعة":"Candle","بطاقة":"Card","زينة":"Decorations",
    "صباح":"Morning","مساء":"Evening","ليل":"Night","يوم":"Day","أسبوع":"Week","أمس":"Yesterday","اليوم":"Today","غد":"Tomorrow",
    "يمين":"Right","يسار":"Left","أمام":"Front","خلف":"Behind","بين":"Between","بجانب":"Beside","قريب":"Near","بعيد":"Far",
    "أعلى":"Above","أسفل":"Below","ضخم":"Huge","كثير":"Many","قليل":"Few","كامل":"Whole","نصف":"Half","ثقيل":"Heavy","خفيف":"Light",
    "ناعم":"Smooth","خشن":"Rough","صلب":"Hard","لين":"Soft","جاف":"Dry","مبلل":"Wet","نظيف":"Clean","متسخ":"Dirty",
    "سعيد":"Happy","حزين":"Sad","غاضب":"Angry","خائف":"Scared","متفاجئ":"Surprised","متعب":"Tired","جائع":"Hungry","عطشان":"Thirsty",
    "والدان":"Parents","حفيد":"Grandson","حفيدة":"Granddaughter","جار":"Neighbor","زميل":"Classmate","ضيف":"Guest","صيدلي":"Pharmacist",
    "عالم":"Scientist","مبرمج":"Programmer","بحار":"Sailor","ميكانيكي":"Mechanic","كهربائي":"Electrician","سباك":"Plumber","بستاني":"Gardener",
    "دواء":"Medicine","ضمادة":"Bandage","حقنة":"Syringe","كمامة":"Mask","إسعاف":"First Aid","بلسم":"Conditioner",
    "مخزن":"Storage Room","مرآب":"Garage","فناء":"Yard","إطار":"Frame","مقبض":"Handle","قفل":"Lock","مصراع":"Shutter","مدخنة":"Chimney","عمود":"Pillar",
    "مجمد":"Freezer","ميكروويف":"Microwave","سخان":"Heater","قمع":"Funnel","هاون":"Mortar","مدقة":"Pestle","قالب":"Mold","عصارة":"Juicer","مقشرة":"Peeler",
    "قمح":"Wheat","شعير":"Barley","حمص":"Chickpeas","لبن":"Buttermilk","قشطة":"Cream","تونة":"Tuna","شوكولاتة":"Chocolate","حلوى":"Candy",
    "دونات":"Donut","مهلبية":"Pudding","قرفة":"Cinnamon","كمون":"Cumin","زنجبيل":"Ginger","كركم":"Turmeric","يوسفي":"Mandarin",
    "شمندر":"Beetroot","لفت":"Turnip","كراث":"Leek","خرشوف":"Artichoke","هليون":"Asparagus","بامية":"Okra","فهد":"Cheetah","وشق":"Lynx",
    "غوريلا":"Gorilla","شمبانزي":"Chimpanzee","ظبي":"Antelope","لاما":"Llama","ألبكة":"Alpaca","قندس":"Beaver","سنجاب":"Squirrel","قنفذ":"Hedgehog","خلد":"Mole",
    "رنة":"Reindeer","فظ":"Walrus","عقرب":"Scorpion","أفعى":"Viper","كسلان":"Sloth","مرجان":"Coral","نعامة":"Ostrich","فلامنغو":"Flamingo","عقعق":"Magpie",
    "قرادة":"Tick","برغوث":"Flea","حشرة العصا":"Stick Insect","بيضة":"Egg","شرنقة":"Cocoon","فرخ":"Young Bird","بالغ":"Adult",
    "برعم":"Bud","بتلة":"Petal","لحاء":"Bark","محراث":"Plow","مرش":"Sprinkler","خرطوم":"Hose","سماد":"Fertilizer","دفيئة":"Greenhouse","حصاد":"Harvest",
    "محمية":"Nature Reserve","مستنقع":"Swamp","قارة":"Continent","صخرة":"Rock","حصى":"Gravel","طين":"Clay","معدن":"Mineral","بلورة":"Crystal",
    "قطرة":"Drop","جدول":"Stream","عطارد":"Mercury","الزهرة":"Venus","المريخ":"Mars","المشتري":"Jupiter","زحل":"Saturn","أورانوس":"Uranus","نبتون":"Neptune",
    "نيزك":"Meteor","مذنب":"Comet","مجرة":"Galaxy","تلسكوب":"Telescope","نسيم":"Breeze","إعصار":"Hurricane","صقيع":"Frost","برد":"Hail",
    "منطاد":"Hot Air Balloon","عربة":"Cart","رصيف":"Sidewalk","جسر":"Bridge","نفق":"Tunnel","دوار":"Roundabout","توقف":"Stop","عبور":"Crossing","ممنوع":"Prohibited","اتجاه":"Direction","مخرج":"Exit",
    "شارع":"Street","حي":"Neighborhood","مبنى":"Building","برج":"Tower","فندق":"Hotel","بنك":"Bank","مكتب بريد":"Post Office","محطة إطفاء":"Fire Station","مركز شرطة":"Police Station",
    "متحف":"Museum","حديقة حيوان":"Zoo","مسرح":"Theater","سينما":"Cinema","ملعب":"Stadium","مسبح":"Swimming Pool","معرض":"Gallery","عيادة":"Clinic","مدير":"Principal","مختبر":"Laboratory","ساحة":"Schoolyard","مقصف":"Cafeteria",
    "مغناطيس":"Magnet","عدسة":"Lens","مجهر":"Microscope","ترمومتر":"Thermometer","بطارية":"Battery","تجربة":"Experiment","مكعب":"Cube","أسطوانة":"Cylinder","مخروط":"Cone","هرم":"Pyramid","خماسي":"Pentagon","سداسي":"Hexagon",
    "أكثر":"More","أقل":"Less","متساو":"Equal","عريض":"Wide","ضيق":"Narrow","سريع":"Fast","بطيء":"Slow","مثقاب":"Drill","صامولة":"Nut","طوب":"Brick","إسمنت":"Cement","خشب":"Wood","زجاج":"Glass","حديد":"Iron","رافعة":"Crane",
    "فيديو":"Video","قماش":"Canvas","تمثال":"Statue","تشيلو":"Cello","مرمى":"Goal","صافرة":"Whistle","ميدالية":"Medal","تذكرة":"Ticket","صدفة":"Seashell","عوامة":"Float","منارة":"Lighthouse","خيمة":"Tent","موقد":"Stove","حبل":"Rope","طفاية حريق":"Fire Extinguisher","جرس إنذار":"Alarm Bell",
    "ثانية":"Second","دقيقة":"Minute","شهر":"Month","سنة":"Year","عصر":"Afternoon","السبت":"Saturday","الأحد":"Sunday","الاثنين":"Monday","الثلاثاء":"Tuesday","الأربعاء":"Wednesday","الخميس":"Thursday","الجمعة":"Friday","ربيع":"Spring","صيف":"Summer","خريف":"Autumn","شتاء":"Winter",
    "فرح":"Joy","حزن":"Sadness","غضب":"Anger","خوف":"Fear","دهشة":"Surprise","خجل":"Shyness","حماس":"Excitement","هدوء":"Calm","ملل":"Boredom","قلق":"Worry","فخر":"Pride","حب":"Love",
    "شفاف":"Transparent","لامع":"Shiny","باهت":"Dull","مستقيم":"Straight","منحني":"Curved","دائري":"Round","مسطح":"Flat","عميق":"Deep","ضحل":"Shallow","سميك":"Thick","رفيع":"Thin","حول":"Around","وسط":"Middle","مقابل":"Opposite","وراء":"Behind","بالقرب":"Nearby","أول":"First","ثاني":"Second","ثالث":"Third","قبل":"Before","بعد":"After","بداية":"Beginning","نهاية":"End","صفارة":"Whistle","تصفيق":"Clapping","طرق":"Knocking","مواء":"Meowing","نباح":"Barking","زئير":"Roaring","تغريد":"Chirping","خرير":"Babbling Water"
})

# Additional context distinctions that must not be collapsed by the generic word map.
mod.CONTEXT_OVERRIDES.update({
    ("غرفة الطفل","كرة"):"Ball",("الحديقة واللعب","كرة"):"Ball",
    ("أدوات الرسم","ورقة"):"Paper",("أجزاء النبات","ساق"):"Stem",
    ("الصالة","لوحة"):"Painting",("الفن","لوحة"):"Painting",("المدرسة","لوحة"):"Board",
    ("الحديقة","مقعد"):"Bench",("أجزاء السيارة","مقعد"):"Seat",("أجزاء الدراجة","مقعد"):"Saddle",
    ("أجزاء الطائرة","مقعد"):"Seat",("الأثاث","مقعد"):"Seat",
    ("الأشكال","معين"):"Diamond",("المهن","عالم"):"Scientist",("التكنولوجيا","ذاكرة"):"Memory",
    ("المطبخ","ميزان"):"Kitchen Scale",("العلوم","ميزان"):"Balance Scale",("أدوات","ميزان"):"Scale"
})


def clean_label(value):
    value = mod.normalize_en(value)
    value = re.sub(r"^(?:A|An|The)\s+", "", value, flags=re.I)
    value = value.strip()
    if value:
        value = value[0].upper() + value[1:]
    return value


def request_translate(payload, translator, retries=8):
    for attempt in range(retries):
        try:
            result = translator.translate(payload)
            time.sleep(0.75)
            return result
        except TooManyRequests:
            wait = min(60, 10 + attempt * 8)
            print(f"Google rate limit; waiting {wait}s", flush=True)
            time.sleep(wait)
        except Exception as exc:
            if attempt == retries - 1:
                raise
            wait = min(20, 2 ** attempt)
            print(f"Translation request retry after {wait}s: {exc}", flush=True)
            time.sleep(wait)
    raise RuntimeError("translation retries exhausted")


def translate_group(batch, translator, depth=0):
    if not batch:
        return []
    if len(batch) == 1:
        return [clean_label(request_translate(batch[0], translator))]

    payload = ("\n" + MARKER + "\n").join(batch)
    try:
        translated = request_translate(payload, translator)
        parts = re.split(r"\s*" + re.escape(MARKER) + r"\s*", translated, flags=re.I)
        parts = [clean_label(x) for x in parts]
        if len(parts) == len(batch) and all(parts):
            return parts
    except Exception as exc:
        print(f"Grouped translation failed at size {len(batch)}: {exc}", flush=True)

    middle = len(batch) // 2
    if middle <= 0:
        return [clean_label(request_translate(batch[0], translator))]
    return translate_group(batch[:middle], translator, depth + 1) + translate_group(batch[middle:], translator, depth + 1)


def translate_batched(texts, translator, batch_size=45, max_chars=2600):
    pending = list(dict.fromkeys(texts))
    result = {}
    groups = []
    current = []
    current_chars = 0
    for text in pending:
        addition = len(text) + len(MARKER) + 4
        if current and (len(current) >= batch_size or current_chars + addition > max_chars):
            groups.append(current)
            current = []
            current_chars = 0
        current.append(text)
        current_chars += addition
    if current:
        groups.append(current)

    done = 0
    for group in groups:
        translated = translate_group(group, translator)
        if len(translated) != len(group):
            raise RuntimeError(f"translation group mismatch: {len(group)} -> {len(translated)}")
        for src, dst in zip(group, translated):
            if not dst or mod.ARABIC_RE.search(dst):
                raise RuntimeError(f"invalid English translation for {src!r}: {dst!r}")
            result[src] = dst
        done += len(group)
        print(f"translated {done}/{len(pending)}", flush=True)
    return result


def cleanup_unreferenced_audio():
    path = mod.AUDIO_MAP_JS
    if not path.exists() or not mod.AUDIO_DIR.exists():
        return
    text = path.read_text(encoding="utf-8").strip()
    marker = "window.APP360_AUDIO_MAP_EN="
    if not text.startswith(marker) or not text.endswith(";"):
        return
    mapping = json.loads(text[len(marker):-1])
    keep = {Path(rel).name for rel in mapping.values()}
    removed = 0
    for mp3 in mod.AUDIO_DIR.glob("*.mp3"):
        if mp3.name not in keep:
            mp3.unlink()
            removed += 1
    print(f"removed stale English audio files: {removed}", flush=True)


mod.translate_batch_safe = translate_batched

if __name__ == "__main__":
    asyncio.run(mod.main_async(mod.parse_args()))
    cleanup_unreferenced_audio()
