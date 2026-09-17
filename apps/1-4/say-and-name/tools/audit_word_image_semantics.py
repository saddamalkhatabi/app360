#!/usr/bin/env python3
import json
import re
from collections import defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
APP = Path(__file__).resolve().parents[1]
LEVELS = APP / 'data' / 'levels-inline-v8.js'
MAP = APP / 'data' / 'word-images-map.js'
MANIFEST = APP / 'data' / 'word-images-manifest.json'
IMG_DIR = APP / 'assets' / 'word-images'
REPORT_JSON = APP / 'data' / 'image-semantic-audit.json'
REPORT_MD = APP / 'IMAGE_SEMANTIC_AUDIT_AR.md'
CONTEXT_MAP = APP / 'data' / 'word-images-context-map.js'
SEP = '\u0001'

ANIMAL_LABELS = {
    'قطة':'cat','كلب':'dog','طائر':'bird','سمكة':'fish','أرنب':'rabbit','دجاجة':'hen chicken','بقرة':'cow',
    'حصان':'horse','خروف':'sheep','ماعز':'goat','أسد':'lion','فيل':'elephant','قرد':'monkey','نملة':'ant','نحلة':'bee','فراشة':'butterfly',
    'حمار':'donkey','جمل':'camel','بطة':'duck','ديك':'rooster','كتكوت':'chick','أوزة':'goose','عجل':'calf','مهر':'foal young horse',
    'زرافة':'giraffe','نمر':'tiger','دب':'bear','ذئب':'wolf','ثعلب':'fox','حمار وحشي':'zebra','غزال':'gazelle deer','تمساح':'crocodile','فرس النهر':'hippopotamus',
    'دلفين':'dolphin','حوت':'whale','سلحفاة':'turtle','أخطبوط':'octopus','سلطعون':'crab','قرش':'shark','نجم البحر':'starfish',
    'حمامة':'pigeon dove','عصفور':'sparrow','ببغاء':'parrot','بومة':'owl','نسر':'eagle','بطريق':'penguin',
    'ذبابة':'fly insect','بعوضة':'mosquito','خنفساء':'beetle','عنكبوت':'spider','دودة':'worm','حلزون':'snail',
    'وحيد القرن':'rhinoceros','كنغر':'kangaroo','باندا':'panda','كوالا':'koala','جاموس':'buffalo','ضبع':'hyena','خنزير بري':'wild boar','راكون':'raccoon',
    'ثعبان':'snake','سحلية':'lizard','حرباء':'chameleon','ضفدع':'frog','فرس البحر':'seahorse','قنديل البحر':'jellyfish','حبار':'squid','محار':'seashell oyster','روبيان':'shrimp','فقمة':'seal',
    'طاووس':'peacock','ديك رومي':'turkey bird','بجعة':'swan','لقلق':'stork','صقر':'falcon','غراب':'crow raven','نورس':'seagull',
    'جرادة':'grasshopper','يعسوب':'dragonfly','صرصور':'cockroach','يرقة':'caterpillar larva','دعسوقة':'ladybug',
    'فهد':'cheetah','وشق':'lynx','غوريلا':'gorilla','شمبانزي':'chimpanzee','ظبي':'antelope','لاما':'llama','ألبكة':'alpaca','قندس':'beaver','سنجاب':'squirrel','قنفذ':'hedgehog','خلد':'mole animal',
    'دب قطبي':'polar bear','ثعلب قطبي':'arctic fox','رنة':'reindeer','فظ':'walrus','عقرب':'scorpion','أفعى':'viper snake','كسلان':'sloth',
    'حوت قاتل':'orca killer whale','سمكة مهرج':'clownfish','سمكة قرش':'shark','سمكة منتفخة':'pufferfish','مرجان':'coral','إسفنج بحري':'sea sponge','جراد بحر':'lobster',
    'نقار الخشب':'woodpecker','هدهد':'hoopoe bird','كناري':'canary bird','نعامة':'ostrich','فلامنغو':'flamingo','عقعق':'magpie bird',
    'قرادة':'tick insect','برغوث':'flea insect','حشرة العصا':'stick insect','فرس النبي':'praying mantis',
}

ANIMAL_CATEGORIES = {
    'الحيوانات','الحشرات','الحيوانات الأليفة والمزرعة','الحيوانات البرية','الحيوانات البحرية','الطيور',
    'الحشرات والكائنات الصغيرة','الزواحف','البرمائيات','الكائنات البحرية','حيوانات المناطق الباردة',
    'حيوانات الصحراء','حيوانات الغابة'
}


def parse_assignment(path: Path, marker: str):
    text = path.read_text(encoding='utf-8').strip()
    pos = text.find(marker)
    if pos < 0:
        raise RuntimeError(f'{marker} not found in {path}')
    payload = text[pos + len(marker):].strip()
    if payload.endswith(';'):
        payload = payload[:-1]
    return json.loads(payload)


def load_levels():
    return parse_assignment(LEVELS, 'window.APP360_LEVELS=')


def load_map():
    return parse_assignment(MAP, 'window.APP360_WORD_IMAGE_MAP=')


def collect_contexts(levels):
    contexts = []
    seen = set()
    for level in sorted(levels.keys(), key=lambda x: int(x)):
        for row in levels[level]:
            category = str(row[0]).strip()
            for raw in str(row[2] if len(row) > 2 else '').split('|'):
                word = raw.strip()
                if not word:
                    continue
                key = category + SEP + word
                if key not in seen:
                    seen.add(key)
                    contexts.append((int(level), category, word, key))
    return contexts


def structural_audit(levels, mapping, manifest):
    items = manifest.get('items', [])
    by_word = {x['word']: x for x in items}
    errors = []
    if manifest.get('count') != len(items):
        errors.append(f"manifest count {manifest.get('count')} != item count {len(items)}")
    if len(mapping) != len(items):
        errors.append(f'map count {len(mapping)} != manifest item count {len(items)}')
    for item in items:
        word = item['word']
        mapped = mapping.get(word)
        expected = Path(item['file']).with_suffix('.jpg').name
        if mapped != expected:
            errors.append(f'{word}: map={mapped!r}, expected={expected!r}')
        if mapped and not (IMG_DIR / mapped).exists():
            errors.append(f'{word}: missing image file {mapped}')
    contexts = collect_contexts(levels)
    missing_words = sorted({word for _, _, word, _ in contexts if word not in mapping})
    if missing_words:
        errors.append('words missing from image map: ' + ', '.join(missing_words[:30]))
    context_map = {}
    word_contexts = defaultdict(list)
    for level, category, word, key in contexts:
        if word in mapping:
            context_map[key] = mapping[word]
            word_contexts[word].append(category)
    collisions = {w: sorted(set(cats)) for w, cats in word_contexts.items() if len(set(cats)) > 1}
    return errors, contexts, context_map, collisions, by_word


def semantic_animal_audit(mapping, manifest_by_word):
    try:
        import torch
        from PIL import Image
        from scipy.optimize import linear_sum_assignment
        from transformers import CLIPModel, CLIPProcessor
    except Exception as exc:
        raise RuntimeError('Semantic audit dependencies are missing') from exc

    words = [w for w in ANIMAL_LABELS if w in mapping and (IMG_DIR / mapping[w]).exists()]
    if len(words) < 50:
        raise RuntimeError(f'Only {len(words)} animal images found; expected a broad animal library')

    model_id = 'openai/clip-vit-base-patch32'
    model = CLIPModel.from_pretrained(model_id)
    processor = CLIPProcessor.from_pretrained(model_id)
    model.eval()

    prompts = [f'a clear educational picture of a {ANIMAL_LABELS[w]}, centered, no text' for w in words]
    with torch.no_grad():
        text_inputs = processor(text=prompts, return_tensors='pt', padding=True)
        text_features = model.get_text_features(**text_inputs)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)

    image_features = []
    batch_size = 12
    for start in range(0, len(words), batch_size):
        batch_words = words[start:start+batch_size]
        images = [Image.open(IMG_DIR / mapping[w]).convert('RGB') for w in batch_words]
        with torch.no_grad():
            image_inputs = processor(images=images, return_tensors='pt')
            feats = model.get_image_features(**image_inputs)
            feats = feats / feats.norm(dim=-1, keepdim=True)
        image_features.append(feats.cpu())
        for im in images:
            im.close()
    image_features = torch.cat(image_features, dim=0)
    sims = (image_features @ text_features.cpu().T).numpy()

    row_ind, col_ind = linear_sum_assignment(-sims)
    assigned_label_for_row = {int(r): int(c) for r, c in zip(row_ind, col_ind)}

    rows = []
    suggestions = {}
    for i, word in enumerate(words):
        current_score = float(sims[i, i])
        order = sims[i].argsort()[::-1]
        best_j = int(order[0])
        second_j = int(order[1]) if len(order) > 1 else best_j
        assigned_j = assigned_label_for_row.get(i, i)
        best_word = words[best_j]
        assigned_word = words[assigned_j]
        best_score = float(sims[i, best_j])
        assigned_score = float(sims[i, assigned_j])
        margin = best_score - current_score
        source = manifest_by_word.get(word, {})
        suspect = best_word != word and margin >= 0.015
        strong = best_word != word and margin >= 0.030
        rows.append({
            'word': word,
            'english_label': ANIMAL_LABELS[word],
            'file': mapping[word],
            'source_original': source.get('original', ''),
            'current_score': round(current_score, 5),
            'best_word_for_this_image': best_word,
            'best_score': round(best_score, 5),
            'second_best_word': words[second_j],
            'margin_over_current': round(margin, 5),
            'global_assignment_word': assigned_word,
            'global_assignment_score': round(assigned_score, 5),
            'suspect': suspect,
            'strong_suspect': strong,
        })
        # Global assignment describes which word this current file most coherently belongs to.
        # Only expose high-confidence suggestions; do not mutate production mappings in this audit.
        if assigned_word != word and assigned_score - current_score >= 0.025:
            suggestions[assigned_word] = mapping[word]

    return {
        'model': model_id,
        'animal_count': len(words),
        'rows': rows,
        'strong_suspects': [r for r in rows if r['strong_suspect']],
        'suspects': [r for r in rows if r['suspect']],
        'suggested_high_confidence_map': suggestions,
    }


def write_outputs(structural_errors, contexts, context_map, collisions, semantic):
    CONTEXT_MAP.write_text(
        'window.APP360_WORD_IMAGE_CONTEXT_MAP=' + json.dumps(context_map, ensure_ascii=False, separators=(',', ':')) + ';\n',
        encoding='utf-8'
    )
    payload = {
        'schema_version': '1.0',
        'structural': {
            'context_entries': len(contexts),
            'context_map_entries': len(context_map),
            'structural_errors': structural_errors,
            'same_spelling_multiple_categories': collisions,
        },
        'animals': semantic,
    }
    REPORT_JSON.write_text(json.dumps(payload, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')

    suspects = semantic['suspects']
    strong = semantic['strong_suspects']
    lines = [
        '# تدقيق مطابقة الكلمات بالصور — كلماتي مع أشيائي', '',
        f'- عدد سياقات الكلمات المفحوصة بنيويًا: **{len(contexts)}**',
        f'- أخطاء الربط البنيوي: **{len(structural_errors)}**',
        f'- الكلمات المتكررة كتابةً في أكثر من تصنيف: **{len(collisions)}**',
        f'- صور الحيوانات المفحوصة دلاليًا: **{semantic["animal_count"]}**',
        f'- حالات اشتباه دلالي: **{len(suspects)}**',
        f'- حالات اشتباه قوية: **{len(strong)}**', '',
        '## الكلمات التي أبلغ عنها المستخدم', '',
    ]
    by_word = {r['word']: r for r in semantic['rows']}
    for word in ['قرد', 'نسر', 'جمل']:
        r = by_word.get(word)
        if r:
            lines.append(f'- **{word}** → `{r["file"]}` | أفضل تطابق مرئي للنموذج: **{r["best_word_for_this_image"]}** | فرق الثقة: `{r["margin_over_current"]}`')
    lines.extend(['', '## حالات الاشتباه القوية', ''])
    if strong:
        for r in sorted(strong, key=lambda x: x['margin_over_current'], reverse=True):
            lines.append(f'- **{r["word"]}** (`{r["file"]}`) تبدو أقرب إلى **{r["best_word_for_this_image"]}**؛ الفرق `{r["margin_over_current"]}`؛ المصدر `{r["source_original"]}`')
    else:
        lines.append('- لم تظهر حالات قوية وفق العتبة الآلية.')
    lines.extend(['', '## ملاحظة هندسية', '',
                  'تم إنشاء خريطة سياقية مستقلة `data/word-images-context-map.js` بالمفتاح `التصنيف + الكلمة`، لأن الاعتماد على نص الكلمة وحده لا يكفي للكلمات متعددة المعنى.',
                  '', '> التدقيق الدلالي يستخدم CLIP كأداة كشف، ولا يبدّل الصور تلقائيًا. أي تبديل إنتاجي يجب أن يعتمد على حالات واضحة أو مراجعة مباشرة للصور.'])
    REPORT_MD.write_text('\n'.join(lines) + '\n', encoding='utf-8')


def main():
    levels = load_levels()
    mapping = load_map()
    manifest = json.loads(MANIFEST.read_text(encoding='utf-8'))
    structural_errors, contexts, context_map, collisions, by_word = structural_audit(levels, mapping, manifest)
    semantic = semantic_animal_audit(mapping, by_word)
    write_outputs(structural_errors, contexts, context_map, collisions, semantic)
    if structural_errors:
        print('STRUCTURAL ERRORS:')
        for x in structural_errors[:50]:
            print('-', x)
        raise SystemExit(2)
    print(f'Context entries: {len(contexts)}')
    print(f'Animal images audited: {semantic["animal_count"]}')
    print(f'Animal suspects: {len(semantic["suspects"])}; strong: {len(semantic["strong_suspects"])}')
    for word in ['قرد', 'نسر', 'جمل']:
        row = next((r for r in semantic['rows'] if r['word'] == word), None)
        print('USER_REPORTED', json.dumps(row, ensure_ascii=False))


if __name__ == '__main__':
    main()
