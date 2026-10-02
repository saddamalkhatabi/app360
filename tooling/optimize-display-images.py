"""Build light display derivatives from original art; keep all originals.

Build tool only: python tooling/optimize-display-images.py --scope portal
Requires Pillow with WebP support. No drawing, cropping or background changes.
"""
import argparse
import json
from pathlib import Path
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parents[1]
parser = argparse.ArgumentParser()
parser.add_argument('--scope', choices=('app', 'portal', 'all'), default='all')
args = parser.parse_args()
jobs = []
if args.scope in ('app', 'all'):
    jobs.append(('assets/covers/a4-story-language-v1.png', 'assets/covers/a4-story-language-v2', (320, 640), False))
    for name in ('cup', 'ball', 'cat'):
        prefix = 'apps/4-8/story-language-lab/assets/' + name + '-story'
        jobs.append((prefix + '.png', prefix, (640, 1024), False))
if args.scope in ('portal', 'all'):
    for role in ('learner', 'coach'):
        prefix = 'assets/covers/family-reels-' + role + '-art'
        jobs.append((prefix + '.png', prefix, (640,), False))
    for name, width in (('family-school-360-logo', 640), ('family-reels-360-logo', 160)):
        prefix = 'assets/brand/' + name
        jobs.append((prefix + '.png', prefix, (width,), True))
rows = []
for source, prefix, widths, alpha in jobs:
    with Image.open(ROOT / source) as original:
        original = ImageOps.exif_transpose(original).convert('RGBA' if alpha else 'RGB')
        for width in widths:
            size = (width, round(original.height * width / original.width))
            image = original.resize(size, Image.Resampling.LANCZOS)
            for fmt in ('webp', 'png' if alpha else 'jpg'):
                target = prefix + '-' + str(width) + '.' + fmt
                options = {'quality': 88 if alpha else 82, 'method': 6} if fmt == 'webp' else {'optimize': True}
                if fmt == 'jpg':
                    options.update(quality=85, progressive=True)
                image.save(ROOT / target, **options)
                rows.append({'source': source, 'path': target, 'width': width, 'height': size[1],
                             'format': fmt, 'alpha_preserved': alpha, 'bytes': (ROOT / target).stat().st_size})
report = ROOT / 'data/display-image-report.json'
prior = json.loads(report.read_text())['items'] if report.exists() else []
paths = {row['path'] for row in rows}
report.write_text(json.dumps({'policy': 'Resize and re-encode original artwork; transparent logos retain alpha; originals retained.',
                              'items': [row for row in prior if row['path'] not in paths] + rows}, ensure_ascii=False, indent=2) + '\n')
print(json.dumps({'derivatives': len(rows), 'bytes': sum(row['bytes'] for row in rows)}))
