#!/usr/bin/env python3
import asyncio
import importlib.util
import json
import re
import sys
import time
from pathlib import Path

from deep_translator.exceptions import TooManyRequests

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "generate_english_content.py"
spec = importlib.util.spec_from_file_location("english_base", SOURCE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

MARKER = "ZXQAPP360SPLITQZX"


def clean_label(value):
    value = mod.normalize_en(value)
    value = re.sub(r"^(?:A|An|The)\s+", "", value, flags=re.I)
    value = value.strip()
    if value:
        value = value[0].upper() + value[1:]
    return value


def request_translate(payload, translator, retries=8):
    for attempt in range(retries):
        try:
            result = translator.translate(payload)
            time.sleep(0.75)
            return result
        except TooManyRequests:
            wait = min(60, 10 + attempt * 8)
            print(f"Google rate limit; waiting {wait}s", flush=True)
            time.sleep(wait)
        except Exception as exc:
            if attempt == retries - 1:
                raise
            wait = min(20, 2 ** attempt)
            print(f"Translation request retry after {wait}s: {exc}", flush=True)
            time.sleep(wait)
    raise RuntimeError("translation retries exhausted")


def translate_group(batch, translator, depth=0):
    if not batch:
        return []
    if len(batch) == 1:
        return [clean_label(request_translate(batch[0], translator))]

    payload = ("\n" + MARKER + "\n").join(batch)
    try:
        translated = request_translate(payload, translator)
        parts = re.split(r"\s*" + re.escape(MARKER) + r"\s*", translated, flags=re.I)
        parts = [clean_label(x) for x in parts]
        if len(parts) == len(batch) and all(parts):
            return parts
    except Exception as exc:
        print(f"Grouped translation failed at size {len(batch)}: {exc}", flush=True)

    # If the marker was altered by the service, recursively split the batch.
    middle = len(batch) // 2
    if middle <= 0:
        return [clean_label(request_translate(batch[0], translator))]
    return translate_group(batch[:middle], translator, depth + 1) + translate_group(batch[middle:], translator, depth + 1)


def translate_batched(texts, translator, batch_size=45, max_chars=2600):
    pending = list(dict.fromkeys(texts))
    result = {}
    groups = []
    current = []
    current_chars = 0
    for text in pending:
        addition = len(text) + len(MARKER) + 4
        if current and (len(current) >= batch_size or current_chars + addition > max_chars):
            groups.append(current)
            current = []
            current_chars = 0
        current.append(text)
        current_chars += addition
    if current:
        groups.append(current)

    done = 0
    for group in groups:
        translated = translate_group(group, translator)
        if len(translated) != len(group):
            raise RuntimeError(f"translation group mismatch: {len(group)} -> {len(translated)}")
        for src, dst in zip(group, translated):
            if not dst or mod.ARABIC_RE.search(dst):
                raise RuntimeError(f"invalid English translation for {src!r}: {dst!r}")
            result[src] = dst
        done += len(group)
        print(f"translated {done}/{len(pending)}", flush=True)
    return result


def cleanup_unreferenced_audio():
    path = mod.AUDIO_MAP_JS
    if not path.exists() or not mod.AUDIO_DIR.exists():
        return
    text = path.read_text(encoding="utf-8").strip()
    marker = "window.APP360_AUDIO_MAP_EN="
    if not text.startswith(marker) or not text.endswith(";"):
        return
    mapping = json.loads(text[len(marker):-1])
    keep = {Path(rel).name for rel in mapping.values()}
    removed = 0
    for mp3 in mod.AUDIO_DIR.glob("*.mp3"):
        if mp3.name not in keep:
            mp3.unlink()
            removed += 1
    print(f"removed stale English audio files: {removed}", flush=True)


mod.translate_batch_safe = translate_batched

if __name__ == "__main__":
    asyncio.run(mod.main_async(mod.parse_args()))
    cleanup_unreferenced_audio()
