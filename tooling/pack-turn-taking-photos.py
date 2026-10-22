"""Pack reviewed generated scenes without stretching or cropping people.

Usage: python tooling/pack-turn-taking-photos.py /absolute/path/to/input.json
Input rows: id, source, source_panel_count, selected_panels, prompt, edit_prompt.
Only blank outer bands/separators are removed. Every source scene is contained
in a 900px square; the player always receives exactly five equal square cells.
"""
import hashlib
from io import BytesIO
import json
from pathlib import Path
import sys

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
APP = ROOT / 'apps/1-4/imitate-one-step'
rows = json.loads(Path(sys.argv[1]).read_text())
assert sorted(r['id'] for r in rows) == [str(n) for n in range(201, 221)]
experiences = {x['id']: x for x in json.loads((APP/'experiences.json').read_text())['experiences']}
manifest = json.loads((APP/'storyboards/manifest.json').read_text())
manifest.setdefault('previews', {})
report = {'schema': 1, 'generator': 'built-in image_gen', 'width': 4500, 'height': 900,
          'frames': 5, 'frame_width': 900, 'frame_height': 900,
          'packing': 'contain each complete source scene; never stretch people', 'assets': []}
specs = []
for row in rows:
    source = Image.open(row['source']).convert('RGB')
    rgb = np.asarray(source)
    white = (rgb.min(axis=2) >= 248)
    occupied = np.flatnonzero((~white).mean(axis=1) > .03)
    assert occupied.size, row['id']
    top, bottom = int(occupied[0]), int(occupied[-1]) + 1
    source = source.crop((0, top, source.width, bottom))
    pixels = np.asarray(source)
    pure = ((pixels.min(axis=2) >= 235).mean(axis=0) >= .94) & (pixels.mean(axis=(0, 2)) >= 248)
    runs, start = [], None
    for i, blank in enumerate(list(pure) + [False]):
        if blank and start is None:
            start = i
        if not blank and start is not None:
            runs.append((start, i))
            start = None
    count, width = row['source_panel_count'], source.width
    seams = []
    for i in range(1, count):
        expected = width * i/count
        candidates = [r for r in runs if abs((r[0]+r[1])/2-expected) < width*.04]
        assert candidates, f"No reviewed panel separator: {row['id']} / {i}"
        seams.append(min(candidates, key=lambda r: abs((r[0]+r[1])/2-expected)))
    bounds = [(0 if i == 0 else seams[i-1][1], width if i == count-1 else seams[i][0]) for i in range(count)]
    assert len(row['selected_panels']) == 5
    atlas = Image.new('RGB', (4500, 900), '#f4f1ec')
    placements = []
    for target, original in enumerate(row['selected_panels']):
        left, right = bounds[original]
        panel = source.crop((left, 0, right, source.height))
        fitted = ImageOps.contain(panel, (900, 900), Image.Resampling.LANCZOS)
        x, y = (900-fitted.width)//2, (900-fitted.height)//2
        atlas.paste(fitted, (900*target+x, y))
        placements.append({'source_panel': original+1, 'source_rect': [left, top, right, bottom],
                           'destination_rect': [900*target+x, y, fitted.width, fitted.height]})
    asset = f"storyboards/advanced-{row['id']}-photo-v1.webp"
    preview = f"storyboards/advanced-{row['id']}-preview-v1.webp"
    encoded = BytesIO()
    atlas.save(encoded, 'WEBP', quality=86, method=6)
    (APP/asset).write_bytes(encoded.getvalue())
    assert Image.open(APP/asset).size == (4500, 900)
    atlas.crop((0, 0, 900, 900)).resize((320, 320), Image.Resampling.LANCZOS).save(APP/preview, 'WEBP', quality=83, method=6)
    manifest['assets'][row['id']] = asset
    manifest['previews'][row['id']] = preview
    record = {'id': row['id'], 'path': asset, 'preview': preview, 'width': 4500, 'height': 900,
              'source_sha256': hashlib.sha256(Path(row['source']).read_bytes()).hexdigest(),
              'bytes': (APP/asset).stat().st_size, 'sha256': hashlib.sha256((APP/asset).read_bytes()).hexdigest(),
              'source_size': Image.open(row['source']).size, 'placements': placements}
    report['assets'].append(record)
    specs.append({'id': row['id'], 'title': experiences[row['id']]['title'],
                  'generation_prompt': row.get('prompt') or 'Five realistic family photographs in one horizontal strip: friendly Arab parent and child, clear smiling faces, large safe tools; follow the five narration beats below, no written text.',
                  'edit_prompt': row.get('edit_prompt', ''),
                  'narration_order': [s['text'] for s in experiences[row['id']]['steps']]})
manifest.update({'schema_version': '1.3', 'updated': '2026-10-22', 'asset_format': 'webp',
                 'expected_dimensions': '4500x900 (5 equal 900x900 panels)',
                 'note_ar': '220 تجربة مرتبطة بلوحات مصورة؛ التجارب المتقدمة 201–220 لها صور بشرية مخصصة بخمس لقطات، وصور مصغرة مربعة دون تمديد.'})
(APP/'storyboards/manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2)+'\n')
(APP/'storyboards/photo-build-report.json').write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n')
(APP/'storyboards/photo-production-spec.json').write_text(json.dumps({'generator': 'built-in image_gen', 'experiences': specs}, ensure_ascii=False, indent=2)+'\n')
print('Packed 20 photographic atlases and 20 square previews:', sum(r['bytes'] for r in report['assets']), 'bytes')
