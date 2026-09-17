#!/usr/bin/env python3
import json
import shutil
from pathlib import Path
from PIL import Image, ImageDraw

APP = Path(__file__).resolve().parents[1]
DATA = APP / "data"
IMG = APP / "assets" / "word-images"
MAP = DATA / "word-images-map.js"
LEVELS = DATA / "levels-inline-v8.js"
CTX = DATA / "word-images-context-map.js"
REPORT = DATA / "final-animal-image-corrections.json"
SEP = "\u0001"

def parse_assignment(path, marker):
    text = path.read_text(encoding="utf-8").strip()
    pos = text.find(marker)
    if pos < 0:
        raise RuntimeError(marker + " not found in " + str(path))
    payload = text[pos + len(marker):].strip()
    if payload.endswith(";"):
        payload = payload[:-1]
    return json.loads(payload)

def save_map(mapping):
    MAP.write_text(
        "window.APP360_WORD_IMAGE_MAP=" +
        json.dumps(mapping, ensure_ascii=False, separators=(",", ":")) +
        ";\n",
        encoding="utf-8",
    )

def rebuild_context_map(mapping):
    levels = parse_assignment(LEVELS, "window.APP360_LEVELS=")
    out = {}
    for level in sorted(levels.keys(), key=lambda x: int(x)):
        for row in levels[level]:
            category = str(row[0]).strip()
            for raw in str(row[2] if len(row) > 2 else "").split("|"):
                word = raw.strip()
                if word and word in mapping:
                    out[category + SEP + word] = mapping[word]
    CTX.write_text(
        "window.APP360_WORD_IMAGE_CONTEXT_MAP=" +
        json.dumps(out, ensure_ascii=False, separators=(",", ":")) +
        ";\n",
        encoding="utf-8",
    )
    return len(out)

def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)

def draw_elephant(path):
    im = Image.new("RGB", (384, 384), "#eaf7fb")
    d = ImageDraw.Draw(im)
    d.ellipse((0, 300, 384, 430), fill="#d8e9cb")
    d.ellipse((115, 145, 318, 292), fill="#8f9da5", outline="#5e6c73", width=5)
    # legs
    rounded(d, (145, 242, 185, 334), 16, "#7f8d95", "#5e6c73", 4)
    rounded(d, (235, 244, 275, 334), 16, "#7f8d95", "#5e6c73", 4)
    # head and ears
    d.ellipse((60, 116, 190, 248), fill="#929fa7", outline="#5e6c73", width=5)
    d.ellipse((70, 126, 133, 215), fill="#aeb9bf", outline="#5e6c73", width=4)
    d.ellipse((112, 128, 183, 218), fill="#aeb9bf", outline="#5e6c73", width=4)
    # trunk
    pts=[(91,205),(86,235),(87,267),(105,294),(126,292)]
    d.line(pts, fill="#839199", width=26, joint="curve")
    d.ellipse((114,278,137,302), fill="#839199")
    # tusks
    d.polygon([(116,218),(137,229),(119,257),(126,229)], fill="#fff7df")
    d.polygon([(139,214),(157,225),(142,251),(148,224)], fill="#fff7df")
    # eye
    d.ellipse((136,158,147,169), fill="#1f2d35")
    d.ellipse((139,160,142,163), fill="#ffffff")
    # tail
    d.line([(309,196),(335,220)], fill="#5e6c73", width=6)
    d.ellipse((330,216,344,232), fill="#5e6c73")
    im.save(path, "JPEG", quality=92, optimize=True, subsampling=0)

def draw_walrus(path):
    im = Image.new("RGB", (384, 384), "#e8f7ff")
    d = ImageDraw.Draw(im)
    d.rectangle((0, 245, 384, 384), fill="#bfe7f4")
    d.polygon([(0,265),(72,238),(146,259),(220,232),(300,252),(384,229),(384,296),(0,296)], fill="#f6fbfd")
    # body
    d.ellipse((74, 154, 316, 323), fill="#8b624d", outline="#5d3c30", width=5)
    # flippers
    d.ellipse((63, 251, 149, 318), fill="#77513f", outline="#5d3c30", width=4)
    d.ellipse((247, 250, 332, 317), fill="#77513f", outline="#5d3c30", width=4)
    # head
    d.ellipse((116, 91, 274, 238), fill="#936b56", outline="#5d3c30", width=5)
    # muzzle pads
    d.ellipse((135, 164, 197, 220), fill="#b78d70")
    d.ellipse((193, 164, 255, 220), fill="#b78d70")
    # eyes
    d.ellipse((153, 137, 165, 149), fill="#1d2326")
    d.ellipse((224, 137, 236, 149), fill="#1d2326")
    # nose
    d.ellipse((187, 165, 207, 181), fill="#3a2923")
    # tusks
    d.polygon([(164,199),(181,200),(176,286),(157,286)], fill="#fff8df", outline="#d9cfb6")
    d.polygon([(210,200),(227,199),(234,286),(215,286)], fill="#fff8df", outline="#d9cfb6")
    # whiskers
    for y,dy in [(185,-12),(195,-5),(205,4)]:
        d.line([(160,y),(112,y+dy)], fill="#f4eadf", width=2)
        d.line([(230,y),(278,y+dy)], fill="#f4eadf", width=2)
    im.save(path, "JPEG", quality=92, optimize=True, subsampling=0)

def main():
    mapping = parse_assignment(MAP, "window.APP360_WORD_IMAGE_MAP=")

    fixes = [
        {"word":"أسد","mode":"copy","source":"w0983.jpg","target":"corrected-lion-v24.jpg","reason":"existing roar image is the strongest lion visual in the complete audit"},
        {"word":"سلحفاة","mode":"copy","source":"w0882.jpg","target":"corrected-turtle-v24.jpg","reason":"existing slow image is visually recognized as a turtle"},
        {"word":"قرش","mode":"copy","source":"w0745.jpg","target":"corrected-shark-v24.jpg","reason":"existing سمكة قرش image is the exact same concept"},
        {"word":"فيل","mode":"generated","target":"corrected-elephant-v24.jpg","reason":"no trustworthy existing elephant image remained"},
        {"word":"فظ","mode":"generated","target":"corrected-walrus-v24.jpg","reason":"no trustworthy existing walrus image remained"},
    ]

    for fix in fixes:
        dst = IMG / fix["target"]
        if fix["mode"] == "copy":
            src = IMG / fix["source"]
            if not src.exists():
                raise RuntimeError("missing source " + str(src))
            shutil.copyfile(src, dst)
        elif fix["word"] == "فيل":
            draw_elephant(dst)
        elif fix["word"] == "فظ":
            draw_walrus(dst)
        else:
            raise RuntimeError("unknown generated fix " + fix["word"])
        mapping[fix["word"]] = fix["target"]

    save_map(mapping)
    contexts = rebuild_context_map(mapping)
    payload = {
        "schema_version":"1.0",
        "build":"v24",
        "fixed_words":[x["word"] for x in fixes],
        "fixes":fixes,
        "map_entries":len(mapping),
        "context_entries":contexts,
        "note_ar":"تمت استعادة ثلاث صور صحيحة من مكتبة المشروع نفسها، وإنشاء رسمين محليين واضحين للفيل والفظ بعد أن أثبت التدقيق الشامل عدم وجود صورة صحيحة موثوقة لهما في المكتبة الحالية."
    }
    REPORT.write_text(json.dumps(payload, ensure_ascii=False, indent=2)+"\n", encoding="utf-8")
    print(json.dumps(payload, ensure_ascii=False, indent=2))

if __name__ == "__main__":
    main()
