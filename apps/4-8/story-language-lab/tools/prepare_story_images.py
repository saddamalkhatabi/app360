"""Encode user-requested web derivatives; never alter or delete source artwork.

Usage: python tools/prepare_story_images.py /absolute/path/to/source-map.json
The source map contains {id, source_path}; built-in image_gen supplies the originals.
"""
import hashlib
import json
import pathlib
import sys
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[1]
sources = json.loads(pathlib.Path(sys.argv[1]).read_text())
prompts = json.loads((ROOT/'data/asset-prompts-v4.json').read_text())
assets = []
# The two generated sheets have shorter top rows. Preserve their actual panel
# boundaries through CSS crop metadata; encoding does not reshape the artwork.
row_boundaries = {'rain':547, 'picnic':568}
for item in sources:
    source = pathlib.Path(item['source_path'])
    with Image.open(source) as original:
        image = original.convert('RGB')
        assert image.width == image.height, item['id']
        files = []
        for size in (640,1024):
            derivative = image.resize((size,size), Image.Resampling.LANCZOS)
            for extension in ('webp','jpg'):
                path = ROOT/'assets'/('v4-'+item['id']+'-story-'+str(size)+'.'+extension)
                if extension == 'webp': derivative.save(path, 'WEBP', quality=72, method=6)
                else: derivative.save(path, 'JPEG', quality=76, optimize=True, progressive=True)
                files.append(dict(path=str(path.relative_to(ROOT)),width=size,height=size,
                    bytes=path.stat().st_size,sha256=hashlib.sha256(path.read_bytes()).hexdigest()))
    entry=dict(world=item['id'],source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
        source_bytes=source.stat().st_size,derivatives=files)
    if item['id'] in row_boundaries:
        assert image.size==(1254,1254), 'Review panel boundaries for changed source dimensions'
        split=row_boundaries[item['id']]/1254
        entry['frames']=[[0,0,.5,split],[.5,0,.5,split],[0,split,.5,1-split],[.5,split,.5,1-split]]
    assets.append(entry)
report=dict(tool='image_gen.imagegen (built-in)',date='2026-10-02',
    prompt_set=['data/asset-prompts-v4.json','data/asset-edit-prompts-v4.json'],
    optimization='Pillow resize and WebP/JPEG encoding, requested web optimization. No semantic edits or panel cropping.',
    assets=assets)
(ROOT/'data/asset-provenance-v4.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps(dict(worlds=len(assets),original_bytes=sum(x['source_bytes'] for x in assets),
    full_webp_bytes=sum(f['bytes'] for x in assets for f in x['derivatives'] if f['path'].endswith('1024.webp')),
    small_webp_bytes=sum(f['bytes'] for x in assets for f in x['derivatives'] if f['path'].endswith('640.webp')))))
