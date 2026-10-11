"""Fit generated five-panel strips into square WebP panels without distorting people.

Only trim plain outer letterboxing. Contain portrait panels instead of cropping
heads, hands, or action props. Final size matches the existing reel contract.
"""
import json
import sys
from pathlib import Path
from PIL import Image
import numpy as np

app = Path(__file__).resolve().parents[1]
inputs = json.loads(Path(sys.argv[1]).read_text())
report = []
for key, source in sorted(inputs.items()):
    image = Image.open(source).convert('RGB')
    width, height = image.size
    colored = np.array(image).min(axis=2) < 240
    active = np.flatnonzero(colored.mean(axis=1) > .03)
    if not len(active):
        raise ValueError('Empty image: ' + source)
    top, bottom = int(active[0]), int(active[-1]) + 1
    image = image.crop((0, top, width, bottom))
    columns = colored[top:bottom].mean(axis=0) > .03
    bounds, start = [], None
    for x, on in enumerate(columns):
        if on and start is None:
            start = x
        if not on and start is not None:
            if x - start > 50:
                bounds.append((start, x))
            start = None
    if start is not None and width - start > 50:
        bounds.append((start, width))
    if len(bounds) == 1:
        # Some generated atlases use black rules instead of white gutters.
        dark = (np.array(image).max(axis=2) < 80).mean(axis=0) > .93
        rules, start = [], None
        for x, on in enumerate(dark):
            if on and start is None:
                start = x
            if not on and start is not None:
                if width * .08 < start < width * .92 and x - start < width * .025:
                    rules.append((start, x))
                start = None
        if len(rules) == 4:
            bounds = []
            left = 0
            for start, end in rules:
                bounds.append((left, start))
                left = end
            bounds.append((left, width))
    if len(bounds) == 1 and key in {'108', '152', '163', '177', '199'}:
        # These five black-bordered atlases were individually inspected: five equal panels.
        bounds = [(round(width * i / 5), round(width * (i + 1) / 5)) for i in range(5)]
    if len(bounds) != 5:
        raise ValueError(f'{key}: expected 5 distinct panels, found {len(bounds)}')
    strip = Image.new('RGB', (4500, 900), '#f4f7f6')
    for frame in range(5):
        left, right = bounds[frame]
        panel = image.crop((left, 0, right, image.height))
        scale = min(900 / panel.width, 900 / panel.height)
        panel = panel.resize((round(panel.width * scale), round(panel.height * scale)), Image.Resampling.LANCZOS)
        strip.paste(panel, (frame * 900 + (900 - panel.width) // 2,
                           (900 - panel.height) // 2))
    dest = app / 'storyboards' / ('reviewed-' + key + '.webp')
    temp = dest.with_suffix('.tmp.webp')
    strip.save(temp, 'WEBP', quality=82, method=6)
    temp.replace(dest)
    assert Image.open(dest).size == (4500, 900)
    report.append({'id': key, 'path': str(dest.relative_to(app)),
                   'dimensions': [4500, 900], 'bytes': dest.stat().st_size,
                   'source_dimensions': [width, height],
                   'letterbox_trim': [top, bottom],
                   'panel_bounds': bounds,
                   'fit': 'contain; no stretching or cropping people'})
print(json.dumps(report, indent=2))
