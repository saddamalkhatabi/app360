#!/usr/bin/env python3
import json
from pathlib import Path

APP = Path(__file__).resolve().parents[1]
FILES = [
    ('data/audio-map.js', 'window.APP360_AUDIO_MAP='),
    ('data/audio-sense-map.js', 'window.APP360_AUDIO_SENSE_MAP='),
]


def rewrite(rel, marker):
    path = APP / rel
    text = path.read_text(encoding='utf-8').strip()
    if not text.startswith(marker):
        raise RuntimeError(f'Unexpected marker in {rel}')
    payload = text[len(marker):]
    if payload.endswith(';'):
        payload = payload[:-1]
    data = json.loads(payload)
    # ensure_ascii=True keeps the JavaScript source ASCII-only while values
    # resolve to the exact same Arabic strings at runtime on old engines.
    safe = marker + json.dumps(data, ensure_ascii=True, separators=(',', ':')) + ';\n'
    path.write_text(safe, encoding='ascii')
    print(rel, 'entries=', len(data), 'ascii_only=', safe.isascii())


def main():
    for rel, marker in FILES:
        rewrite(rel, marker)


if __name__ == '__main__':
    main()
