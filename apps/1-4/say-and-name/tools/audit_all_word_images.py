#!/usr/bin/env python3
import json
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
MAP = APP / "data" / "word-images-map.js"
TRANS = APP / "data" / "translations-en.json"
LEVELS = APP / "data" / "levels-inline-v8.js"
IMG_DIR = APP / "assets" / "word-images"
OUT_JSON = APP / "data" / "all-image-semantic-audit.json"
OUT_MD = APP / "IMAGE_ALL_WORDS_AUDIT_AR.md"

def parse_assignment(path, marker):
    text = path.read_text(encoding="utf-8").strip()
    pos = text.find(marker)
    if pos < 0:
        raise RuntimeError(marker + " not found in " + str(path))
    payload = text[pos + len(marker):].strip()
    if payload.endswith(";"):
        payload = payload[:-1]
    return json.loads(payload)

def load_map():
    return parse_assignment(MAP, "window.APP360_WORD_IMAGE_MAP=")

def load_levels():
    return parse_assignment(LEVELS, "window.APP360_LEVELS=")

def word_categories(levels):
    out = {}
    for rows in levels.values():
        for row in rows:
            cat = str(row[0]).strip()
            for raw in str(row[2] if len(row) > 2 else "").split("|"):
                word = raw.strip()
                if word:
                    out.setdefault(word, [])
                    if cat not in out[word]:
                        out[word].append(cat)
    return out

def main():
    mapping = load_map()
    translations = json.loads(TRANS.read_text(encoding="utf-8"))
    base_words = translations.get("base_words", {})
    cats = word_categories(load_levels())

    words = [w for w in mapping if w in base_words and (IMG_DIR / mapping[w]).exists()]
    missing_translation = sorted([w for w in mapping if w not in base_words])
    missing_image = sorted([w for w, f in mapping.items() if not (IMG_DIR / f).exists()])

    rev = {}
    duplicate_files = {}
    for w, f in mapping.items():
        if f in rev:
            duplicate_files.setdefault(f, [rev[f]]).append(w)
        else:
            rev[f] = w

    if len(words) < 950:
        raise RuntimeError("Only %d auditable words" % len(words))
    if missing_image:
        raise RuntimeError("Missing image files: " + ", ".join(missing_image[:20]))

    import torch
    from PIL import Image
    from transformers import CLIPModel, CLIPProcessor

    model_id = "openai/clip-vit-base-patch32"
    model = CLIPModel.from_pretrained(model_id)
    processor = CLIPProcessor.from_pretrained(model_id)
    model.eval()

    prompts = [
        "a clear educational picture of %s, centered, simple background, no text" % str(base_words[w]).strip()
        for w in words
    ]
    with torch.no_grad():
        text_inputs = processor(text=prompts, return_tensors="pt", padding=True, truncation=True)
        text_features = model.get_text_features(**text_inputs)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)

    image_features = []
    batch_size = 24
    for start in range(0, len(words), batch_size):
        batch_words = words[start:start + batch_size]
        images = [Image.open(IMG_DIR / mapping[w]).convert("RGB") for w in batch_words]
        with torch.no_grad():
            image_inputs = processor(images=images, return_tensors="pt")
            feats = model.get_image_features(**image_inputs)
            feats = feats / feats.norm(dim=-1, keepdim=True)
        image_features.append(feats.cpu())
        for im in images:
            im.close()
        print("Encoded images %d/%d" % (min(start + batch_size, len(words)), len(words)), flush=True)

    image_features = torch.cat(image_features, dim=0)
    sims = image_features @ text_features.cpu().T

    rows = []
    best_idx = []
    for i, word in enumerate(words):
        vals = sims[i]
        order = torch.argsort(vals, descending=True)
        b = int(order[0])
        s = int(order[1]) if len(order) > 1 else b
        cur = float(vals[i])
        best = float(vals[b])
        margin = best - cur
        best_idx.append(b)
        rows.append({
            "word": word,
            "english": base_words[word],
            "file": mapping[word],
            "categories": cats.get(word, []),
            "current_score": round(cur, 5),
            "best_word_for_image": words[b],
            "best_english_for_image": base_words[words[b]],
            "best_score": round(best, 5),
            "second_word_for_image": words[s],
            "margin": round(margin, 5),
        })

    reciprocal = []
    seen_pairs = set()
    for i, j in enumerate(best_idx):
        if j == i or best_idx[j] != i:
            continue
        a, b = sorted((i, j))
        if (a, b) in seen_pairs:
            continue
        seen_pairs.add((a, b))
        ra, rb = rows[a], rows[b]
        if ra["margin"] >= 0.055 and rb["margin"] >= 0.055 and ra["best_score"] >= 0.22 and rb["best_score"] >= 0.22:
            reciprocal.append({
                "word_a": ra["word"], "file_a": ra["file"], "current_a": ra["current_score"],
                "best_a": ra["best_word_for_image"], "score_a": ra["best_score"], "margin_a": ra["margin"],
                "word_b": rb["word"], "file_b": rb["file"], "current_b": rb["current_score"],
                "best_b": rb["best_word_for_image"], "score_b": rb["best_score"], "margin_b": rb["margin"],
                "min_margin": round(min(ra["margin"], rb["margin"]), 5),
            })

    strong = [r for r in rows if r["best_word_for_image"] != r["word"] and r["margin"] >= 0.10 and r["best_score"] >= 0.22]
    medium = [r for r in rows if r["best_word_for_image"] != r["word"] and r["margin"] >= 0.06 and r["best_score"] >= 0.22]

    # For each strong suspect label, rank every existing image against that intended label.
    # This lets us recover a correct image that may be sitting under a different word,
    # without guessing from only the image's own top prediction.
    label_top_images = {}
    word_to_index = {w: i for i, w in enumerate(words)}
    for suspect in strong:
        target_word = suspect["word"]
        target_i = word_to_index[target_word]
        vals = sims[:, target_i]
        order = torch.argsort(vals, descending=True)[:12]
        label_top_images[target_word] = [
            {
                "image_owner_word": words[int(idx)],
                "file": mapping[words[int(idx)]],
                "score_for_target": round(float(vals[int(idx)]), 5),
                "image_best_word": rows[int(idx)]["best_word_for_image"],
                "image_current_score": rows[int(idx)]["current_score"],
            }
            for idx in order
        ]

    payload = {
        "schema_version": "1.0",
        "model": model_id,
        "audited_word_count": len(words),
        "map_count": len(mapping),
        "translation_count": len(base_words),
        "missing_translation": missing_translation,
        "missing_image": missing_image,
        "duplicate_mapped_files": duplicate_files,
        "reciprocal_candidates": sorted(reciprocal, key=lambda x: x["min_margin"], reverse=True),
        "strong_suspects": sorted(strong, key=lambda x: x["margin"], reverse=True),
        "medium_suspects": sorted(medium, key=lambda x: x["margin"], reverse=True),
        "label_top_images": label_top_images,
        "rows": rows,
    }
    OUT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    lines = [
        "# التدقيق الدلالي الشامل لجميع صور الكلمات",
        "",
        "- الكلمات في خريطة الصور: **%d**" % len(mapping),
        "- الكلمات المفحوصة دلاليًا: **%d**" % len(words),
        "- كلمات بلا ترجمة إنجليزية: **%d**" % len(missing_translation),
        "- ملفات صور مفقودة: **%d**" % len(missing_image),
        "- ملفات مستخدمة لأكثر من كلمة: **%d**" % len(duplicate_files),
        "- أزواج تبادل متبادل عالية الثقة: **%d**" % len(reciprocal),
        "- حالات اشتباه قوية مفردة: **%d**" % len(strong),
        "",
        "## أزواج التبادل المتبادل",
        "",
    ]
    if reciprocal:
        for x in sorted(reciprocal, key=lambda x: x["min_margin"], reverse=True):
            lines.append("- **%s** (%s) ↔ **%s** (%s) | الفارقان %s و%s" % (
                x["word_a"], x["file_a"], x["word_b"], x["file_b"], x["margin_a"], x["margin_b"]
            ))
    else:
        lines.append("- لا توجد أزواج تتجاوز العتبة المحددة.")

    lines += ["", "## أعلى حالات الاشتباه الفردية", ""]
    for r in sorted(strong, key=lambda x: x["margin"], reverse=True)[:80]:
        cats_text = "، ".join(r["categories"]) or "غير محدد"
        lines.append("- **%s** (%s) تبدو أقرب إلى **%s** | الفرق %s | التصنيفات: %s" % (
            r["word"], r["file"], r["best_word_for_image"], r["margin"], cats_text
        ))
    lines += ["", "## أفضل الصور الموجودة لكل كلمة مشتبه بها", ""]
    for target_word in [r["word"] for r in sorted(strong, key=lambda x: x["margin"], reverse=True)]:
        lines.append("### " + target_word)
        for cand in label_top_images.get(target_word, [])[:8]:
            lines.append("- %s (%s) | score %s | الصورة نفسها أقرب إلى %s" % (
                cand["image_owner_word"], cand["file"], cand["score_for_target"], cand["image_best_word"]
            ))
        lines.append("")
    lines += [
        "> هذا فحص بصري آلي للكشف عن الخلط، وليس مبررًا لتبديل كل حالة منفردة. التبديل التلقائي الآمن يقتصر على الأزواج المتبادلة الواضحة، وتراجع الحالات المفردة منفصلة.",
        "",
    ]
    OUT_MD.write_text("\n".join(lines), encoding="utf-8")
    print(json.dumps({
        "audited": len(words),
        "reciprocal_candidates": len(reciprocal),
        "strong_suspects": len(strong),
        "medium_suspects": len(medium),
    }, ensure_ascii=False))

if __name__ == "__main__":
    main()
