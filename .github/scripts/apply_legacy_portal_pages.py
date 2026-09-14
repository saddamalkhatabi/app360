#!/usr/bin/env python3
from pathlib import Path
import re

ROOT = Path(__file__).resolve().parents[2]
AGES = ROOT / 'ages'


def patch(text):
    text = re.sub(r'../../assets/css/lab360\.css\?v=\d+', '../../assets/css/lab360.css?v=20', text)
    if '../../assets/css/legacy-compat.css' not in text:
        text = text.replace('</head>', '<link rel="stylesheet" href="../../assets/css/legacy-compat.css?v=20"></head>')
    text = re.sub(r'<script src="../../assets/js/lab360\.js\?v=\d+"></script>', '<script src="../../assets/js/legacy-compat.js?v=20"></script><script src="../../assets/js/lab360.js?v=20"></script>', text)
    if '../../assets/js/legacy-compat.js' not in text:
        text = text.replace('</body>', '<script src="../../assets/js/legacy-compat.js?v=20"></script></body>')
    return text


def main():
    changed = 0
    for path in sorted(AGES.glob('*/index.html')):
        before = path.read_text(encoding='utf-8')
        after = patch(before)
        if after != before:
            path.write_text(after, encoding='utf-8')
            changed += 1
            print('updated', path.relative_to(ROOT))
    print('age pages updated:', changed)


if __name__ == '__main__':
    main()
