#!/usr/bin/env python3
"""Final offline English build for Say & Name.

All 110 categories and all 985 Arabic source words are covered by the reviewed
local dictionaries in v5. Therefore no translation service is contacted; only
Edge TTS is used to synthesize missing/corrected English MP3 files.
"""
import importlib.util
from pathlib import Path

HERE=Path(__file__).resolve().parent
V5=HERE/'generate_english_content_v5.py'
spec=importlib.util.spec_from_file_location('english_v5',V5)
v5=importlib.util.module_from_spec(spec)
spec.loader.exec_module(v5)

# "Son" is correct for Arabic ابن. The old broken data used it for ابنة, but that
# specific context is now explicitly verified as Daughter, so Son must not be
# globally banned.
v5.v4.BANNED_EXACT.discard('Son')

if __name__=='__main__':
    v5.require_full_reviewed_coverage()
    v5.v4.main()
