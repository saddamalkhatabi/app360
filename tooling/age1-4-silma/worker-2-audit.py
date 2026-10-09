#!/usr/bin/env python3
"""Audit worker 2 SILMA draft manifests. No synthesis or network operations."""
import json
from pathlib import Path
repo=Path(__file__).resolve().parents[2]
apps=['screen-to-move','imitate-one-step','my-little-routine','tangram-builder','sensory-motion-missions']
for app in apps:
    root=repo/'apps'/'1-4'/app
    manifest=root/'audio'/'silma'/'worker-2-manifest.json'
    if not manifest.exists():
        print(app, 'manifest missing')
        continue
    data=json.loads(manifest.read_text(encoding='utf-8'))
    rows=data.get('items',[])
    present=sum((root/item['path']).is_file() for item in rows)
    print(app,'planned',len(rows),'audio files present',present,'missing',len(rows)-present)
