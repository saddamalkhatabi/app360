#!/usr/bin/env python3
from pathlib import Path
import json
import re

ROOT=Path(__file__).resolve().parents[2]

text_files=[
    ROOT/'index.html',
    ROOT/'apps/1-4/say-and-name/index.html',
    ROOT/'apps/1-4/say-and-name/sw.js',
    ROOT/'data/live-overrides.json',
    ROOT/'data/catalog.json',
    ROOT/'.github/scripts/apply_legacy_portal_pages.py',
    ROOT/'.github/workflows/apply-legacy-portal-pages.yml',
]
text_files += sorted((ROOT/'ages').glob('*/index.html'))
for p in text_files:
    if not p.exists():
        continue
    before=p.read_text(encoding='utf-8')
    after=before.replace('v=22','v=23').replace('-v22-20260915','-v23-20260915')
    after=after.replace("app360-app-say-and-name-v22","app360-app-say-and-name-v23")
    after=after.replace("VERSION = '22'","VERSION = '23'")
    # Exact live/catalog entry cache bust even if written without other surrounding fields.
    after=after.replace('apps/1-4/say-and-name/index.html?v=22','apps/1-4/say-and-name/index.html?v=23')
    if after!=before:
        p.write_text(after,encoding='utf-8')
        print('updated',p.relative_to(ROOT))

app=ROOT/'apps/1-4/say-and-name/app.json'
data=json.loads(app.read_text(encoding='utf-8'))
data['version']=23
app.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
print('updated',app.relative_to(ROOT))
