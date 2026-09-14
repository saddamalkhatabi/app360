#!/usr/bin/env python3
import json
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[4]
APP = Path(__file__).resolve().parents[1]
MAP = APP / 'data' / 'word-images-map.js'
IMG_DIR = APP / 'assets' / 'word-images'
BRAND_WEBP = ROOT / 'assets' / 'brand' / 'app360-lab-logo.webp'
BRAND_PNG = ROOT / 'assets' / 'brand' / 'app360-lab-logo.png'
ROOT_INDEX = ROOT / 'index.html'


def parse_map():
    text = MAP.read_text(encoding='utf-8').strip()
    marker = 'window.APP360_WORD_IMAGE_MAP='
    if not text.startswith(marker):
        raise RuntimeError('word image map marker not found')
    payload = text[len(marker):]
    if payload.endswith(';'):
        payload = payload[:-1]
    return json.loads(payload)


def to_jpeg(src: Path, dst: Path):
    with Image.open(src) as im:
        rgba = im.convert('RGBA')
        bg = Image.new('RGB', rgba.size, 'white')
        bg.paste(rgba, mask=rgba.getchannel('A'))
        dst.parent.mkdir(parents=True, exist_ok=True)
        bg.save(dst, format='JPEG', quality=90, optimize=True, progressive=False, subsampling=0)


def convert_words():
    mapping = parse_map()
    converted = 0
    missing = []
    old_files = []
    for word, filename in list(mapping.items()):
        src = IMG_DIR / filename
        if src.suffix.lower() not in {'.webp', '.png'}:
            continue
        if not src.exists():
            missing.append(str(src.relative_to(ROOT)))
            continue
        dst = src.with_suffix('.jpg')
        to_jpeg(src, dst)
        mapping[word] = dst.name
        converted += 1
        if src.suffix.lower() == '.webp':
            old_files.append(src)
    if missing:
        raise RuntimeError('Missing source images: ' + ', '.join(missing[:20]))
    MAP.write_text('window.APP360_WORD_IMAGE_MAP=' + json.dumps(mapping, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
    for src in old_files:
        try:
            src.unlink()
        except FileNotFoundError:
            pass
    return converted, len(mapping)


def convert_brand():
    if not BRAND_WEBP.exists():
        return False
    with Image.open(BRAND_WEBP) as im:
        rgba = im.convert('RGBA')
        BRAND_PNG.parent.mkdir(parents=True, exist_ok=True)
        rgba.save(BRAND_PNG, format='PNG', optimize=True)
    text = ROOT_INDEX.read_text(encoding='utf-8')
    text = text.replace('assets/brand/app360-lab-logo.webp?v=20', 'assets/brand/app360-lab-logo.png?v=20')
    text = text.replace('data-legacy-src="assets/brand/app360-lab-icon-512.png?v=20"', 'data-legacy-src="assets/brand/app360-lab-logo.png?v=20"')
    ROOT_INDEX.write_text(text, encoding='utf-8')
    return True


def main():
    converted, total = convert_words()
    brand = convert_brand()
    print(f'Converted word images: {converted}/{total}')
    print(f'Converted App 360 brand logo: {brand}')


if __name__ == '__main__':
    main()
