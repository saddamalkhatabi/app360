#!/usr/bin/env python3
import importlib.util
from pathlib import Path

HERE=Path(__file__).resolve().parent
V3=HERE/'generate_english_content_v3.py'
spec=importlib.util.spec_from_file_location('english_v3_audit',V3)
v3=importlib.util.module_from_spec(spec)
spec.loader.exec_module(v3)
mod=v3.mod
levels=mod.load_levels()
categories,words,pairs=mod.collect(levels)
missing_c=[c for c in categories if c not in mod.CATEGORY_OVERRIDES]
missing_w=[w for w in words if w not in mod.WORD_OVERRIDES]
print('TOTAL_CATEGORIES',len(categories))
print('COVERED_CATEGORIES',len(categories)-len(missing_c))
print('MISSING_CATEGORIES_COUNT',len(missing_c))
for x in missing_c: print('MISSING_CATEGORY',x)
print('TOTAL_WORDS',len(words))
print('COVERED_WORDS',len(words)-len(missing_w))
print('MISSING_WORDS_COUNT',len(missing_w))
for x in missing_w: print('MISSING_WORD',x)
