# Unfinished SILMA preview checkpoint

The execution connection failed before final validation and preview publication. This branch preserves 440 confirmed SILMA MP3 blobs: 395 experience title files, 25 shared scene instruction files, and 20 child play prompt files. The target is 516 files covering all 200 experiences in Arabic and English.

The recordings are kept under tools/voice-checkpoint and do not replace the production runtime or its audio. checkpoint.json records each intended destination and Git blob SHA. Source snippets are recovery material; they are not loaded by the app.

Main remains at 4d737838537463f9308412350e631e08a9c069eb. No new Railway deployment was performed or authorized.

Local work awaiting recovery:
- Repo: /workspace/scratch/684423dfae13/app360
- Branch: preview/imitate-silma-audio-20261011
- Plan and authored text: apps/1-4/imitate-one-step/data/silma-recording-plan.json and voice-{titles,steps}.tsv
- Generator: tooling/build-imitate-silma-audio.py
- Finalizer: tooling/finalize-imitate-silma-audio.py
- Four partition logs: /workspace/scratch/684423dfae13/silma-part-{0,1,2,3}.log
- Model and WAV cache: /workspace/scratch/684423dfae13/silma-model and silma-recording-cache
- Corrected 002: /workspace/scratch/684423dfae13/silma-corrections-final/audio/{ar,en}/experiences/002.mp3 and data/silma-build-report.json in that root. Restore after the original workers finish; they loaded the prior wording.
- Confirmed upload list: /workspace/scratch/684423dfae13/preview-uploaded.json. The GitHub checkpoint includes further confirmed blobs up to 440.

Actual app DOM checks passed narration completion timing, scene advance, pause/resume, language changes, child cues, overlays and library navigation. The corrected hand-motion recording uses the separately checked commands افتح يديك / أغلق يديك and Open your hands / Close your hands, with a 0.35-second gap. Those two final composed files remain local and are not in this remote checkpoint.

After recovery, verify or resume cached generation, restore corrected 002 and its provenance, move source texts/reports under tools/voice-sources, compile audio/manifest.json and voice-map.js, run npm run validate, rebuild and test the offline catalog, then publish and verify an isolated test preview. Do not update main or deploy to Railway.

This is a recovery branch, not a completed test preview.
