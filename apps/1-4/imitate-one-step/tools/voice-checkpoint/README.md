# Recovered SILMA checkpoint

The original execution checkpoint preserved 440 confirmed SILMA blobs after a connection failure. All 440 were restored byte for byte and verified against their Git blob SHA. Completion added 76 recordings, resulting in 516 local MP3 files: 200 titles, 47 shared scene instructions and 11 child prompts in each of Arabic and English.

The completed runtime is in audio/, voice-map.js, recorded-voice.js and app-v16.js. Each of the 200 experiences has five mapped narration queues. The recovered source snippets here are historical material and are not loaded by the app. Extra files saved here during recovery are backups; audio/manifest.json is the current runtime source of truth.

Sources, synthesis provenance and validation reports are in ../voice-sources/. The original checkpoint.json files list is retained as evidence of the 440 restored recordings. The Arabic hand-motion recording was corrected to افتح يديك / أغلق يديك, with a 0.35-second gap; English uses Open your hands / Close your hands.

The completed preview remains on preview/imitate-silma-audio-20261011. This work did not update main or deploy to Railway.
