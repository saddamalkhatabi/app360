#!/usr/bin/env python3
import json
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
MAP_FILE = APP / 'data' / 'word-images-map.js'
AUDIT_FILE = APP / 'data' / 'image-semantic-audit.json'
CORRECTIONS_FILE = APP / 'data' / 'animal-image-corrections.json'

MARKER = 'window.APP360_WORD_IMAGE_MAP='


def load_map():
    text = MAP_FILE.read_text(encoding='utf-8').strip()
    if not text.startswith(MARKER):
        raise RuntimeError('word image map marker missing')
    payload = text[len(MARKER):]
    if payload.endswith(';'):
        payload = payload[:-1]
    return json.loads(payload)


def save_map(mapping):
    MAP_FILE.write_text(MARKER + json.dumps(mapping, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')


def main():
    mapping = load_map()
    audit = json.loads(AUDIT_FILE.read_text(encoding='utf-8'))
    rows = audit['animals']['rows']
    by_word = {r['word']: r for r in rows}

    # Only fix reciprocal semantic swaps where BOTH files strongly prefer each other's label.
    # This avoids blindly changing near-neighbor concepts such as sparrow/canary.
    pairs = []
    used = set()
    min_margin = 0.03
    for row in rows:
        a = row['word']
        b = row['best_word_for_this_image']
        if a == b or a in used or b in used:
            continue
        other = by_word.get(b)
        if not other:
            continue
        if other.get('best_word_for_this_image') != a:
            continue
        if float(row.get('margin_over_current', 0)) < min_margin or float(other.get('margin_over_current', 0)) < min_margin:
            continue
        if a not in mapping or b not in mapping:
            continue
        pairs.append((a, b, row, other))
        used.add(a); used.add(b)

    if not pairs:
        raise RuntimeError('No reciprocal high-confidence animal swaps found')

    before = dict(mapping)
    corrections = []
    for a, b, ra, rb in pairs:
        fa, fb = before[a], before[b]
        mapping[a] = fb
        mapping[b] = fa
        corrections.append({
            'type': 'reciprocal_swap',
            'word_a': a,
            'word_b': b,
            'before_a': fa,
            'before_b': fb,
            'after_a': fb,
            'after_b': fa,
            'margin_a': ra['margin_over_current'],
            'margin_b': rb['margin_over_current'],
            'reason': f'{fa} visually matched {b}; {fb} visually matched {a}'
        })

    required = {'قرد':'نسر', 'جمل':'بطريق'}
    found = {c['word_a']: c['word_b'] for c in corrections}
    found.update({c['word_b']: c['word_a'] for c in corrections})
    for a, b in required.items():
        if found.get(a) != b:
            raise RuntimeError(f'Required confirmed swap not found: {a}<->{b}')

    save_map(mapping)
    payload = {
        'schema_version':'1.0',
        'method':'reciprocal CLIP best-match correction with both margins >= 0.03',
        'correction_count':len(corrections),
        'corrected_words':len(corrections)*2,
        'corrections':corrections,
        'note_ar':'تم تبديل الربط فقط عندما كانت صورتا الكلمتين تؤكدان بعضهما بشكل متبادل وبفارق ثقة واضح. لم تُبدّل الحالات المتقاربة دلالياً أحادياً.'
    }
    CORRECTIONS_FILE.write_text(json.dumps(payload, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps(payload, ensure_ascii=False, indent=2))


if __name__ == '__main__':
    main()
