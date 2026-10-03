# Market objects index v2

This is an index of canonical files, not an asset copy. It references 43 existing JPEG pictures, 86 recorded object names, and 22 recorded numerals (0–10 in Arabic and English) from the active runtime maps in `apps/1-4/say-and-name`. The original application and its paths are unchanged. The 36 copies introduced by index v1 have been removed.

Seven bounded worlds serve Family Market: fruits, vegetables, toys, school, home, animals, and vehicles. Each manifest entry records its original path and SHA-256; the historic WebP manifest is not the active source. Family Market caches these exact source URLs for offline use. No runtime code from the source app is imported.

Regenerate with `python apps/4-8/family-market-lab/tools/build_resources.py` from the repository root. The builder selects existing source files and computes hashes; it never synthesizes or copies images or audio.
