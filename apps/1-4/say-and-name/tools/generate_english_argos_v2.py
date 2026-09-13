#!/usr/bin/env python3
import asyncio
import shutil
import tempfile
import urllib.request
from pathlib import Path

import argostranslate.package
import argostranslate.translate
import generate_english_argos as core

MODEL_URLS = [
    "https://data.argosopentech.com/argospm/v1/translate-ar_en-1_0.argosmodel",
    "https://argosopentech.nyc3.digitaloceanspaces.com/argospm/translate-ar_en-1_0.argosmodel",
    "https://cdn2.argosopentech.io/translate-ar_en-1_0.argosmodel",
    "https://cdn.argosopentech.io/translate-ar_en-1_0.argosmodel",
    "https://argos-net.com/v1/translate-ar_en-1_0.argosmodel",
]


def model_installed():
    installed = argostranslate.translate.get_installed_languages()
    codes = {x.code for x in installed}
    return "ar" in codes and "en" in codes


def download_with_timeout(url, target, timeout=45):
    req = urllib.request.Request(url, headers={"User-Agent": "App360-English-Builder/1.0"})
    with urllib.request.urlopen(req, timeout=timeout) as response, open(target, "wb") as out:
        shutil.copyfileobj(response, out, length=1024 * 1024)
    if target.stat().st_size < 10_000_000:
        raise RuntimeError(f"downloaded model is unexpectedly small: {target.stat().st_size}")


def resilient_ensure_argos_model():
    if model_installed():
        return
    errors = []
    with tempfile.TemporaryDirectory() as td:
        target = Path(td) / "translate-ar_en-1_0.argosmodel"
        for url in MODEL_URLS:
            try:
                print(f"Trying Argos model source: {url}", flush=True)
                download_with_timeout(url, target)
                print(f"Downloaded model bytes: {target.stat().st_size}", flush=True)
                argostranslate.package.install_from_path(target)
                if not model_installed():
                    raise RuntimeError("model installed but Arabic→English pair was not detected")
                print("Argos Arabic→English model installed successfully.", flush=True)
                return
            except Exception as exc:
                errors.append(f"{url}: {exc}")
                print(f"Model source failed: {exc}", flush=True)
                try:
                    if target.exists():
                        target.unlink()
                except Exception:
                    pass
    raise RuntimeError("All Argos model sources failed:\n" + "\n".join(errors))


core.ensure_argos_model = resilient_ensure_argos_model

if __name__ == "__main__":
    asyncio.run(core.main_async(core.parse_args()))
