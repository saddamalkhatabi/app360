#!/usr/bin/env python3
import asyncio
import importlib.util
import sys
import time
from pathlib import Path

from deep_translator.exceptions import TooManyRequests

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "generate_english_content.py"
spec = importlib.util.spec_from_file_location("english_base", SOURCE)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)


def translate_slow(texts, translator, batch_size=1):
    result = {}
    pending = list(dict.fromkeys(texts))
    total = len(pending)
    for i, text in enumerate(pending, 1):
        value = None
        for attempt in range(10):
            try:
                value = translator.translate(text)
                break
            except TooManyRequests:
                wait = min(60, 12 + attempt * 8)
                print(f"rate limited at {i}/{total}; waiting {wait}s", flush=True)
                time.sleep(wait)
            except Exception as exc:
                if attempt == 9:
                    raise RuntimeError(f"translation failed for {text!r}: {exc}")
                time.sleep(min(20, 2 ** attempt))
        result[text] = mod.normalize_en(value)
        if i % 20 == 0 or i == total:
            print(f"translated {i}/{total}", flush=True)
        # Keep below Google's documented 5 requests/second ceiling.
        time.sleep(0.45)
    return result


mod.translate_batch_safe = translate_slow

if __name__ == "__main__":
    asyncio.run(mod.main_async(mod.parse_args()))
