#!/usr/bin/env python3
import importlib.util
import json
import re
from pathlib import Path

HERE = Path(__file__).resolve().parent
BASE = HERE / 'audit_word_image_semantics.py'
spec = importlib.util.spec_from_file_location('semantic_audit_base', BASE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

CORRECTIONS = mod.APP / 'data' / 'animal-image-corrections.json'
_original_structural_audit = mod.structural_audit


def _allowed_corrections():
    if not CORRECTIONS.exists():
        return {}
    try:
        data = json.loads(CORRECTIONS.read_text(encoding='utf-8'))
    except Exception:
        return {}
    allowed = {}
    for row in data.get('corrections', []):
        a = row.get('word_a'); b = row.get('word_b')
        if a and row.get('after_a'):
            allowed[a] = row['after_a']
        if b and row.get('after_b'):
            allowed[b] = row['after_b']
    return allowed


def structural_audit_v2(levels, mapping, manifest):
    errors, contexts, context_map, collisions, by_word = _original_structural_audit(levels, mapping, manifest)
    allowed = _allowed_corrections()
    filtered = []
    mismatch_re = re.compile(r"^(.*?): map='([^']*)', expected='([^']*)'$", re.S)
    for error in errors:
        m = mismatch_re.match(error)
        if not m:
            filtered.append(error)
            continue
        word, mapped, _expected = m.groups()
        if allowed.get(word) == mapped:
            continue
        filtered.append(error)
    # The context map must always reflect the reviewed production mapping, including semantic corrections.
    context_map = {}
    for _level, category, word, key in contexts:
        if word in mapping:
            context_map[key] = mapping[word]
    return filtered, contexts, context_map, collisions, by_word


mod.structural_audit = structural_audit_v2

if __name__ == '__main__':
    mod.main()
