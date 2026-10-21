# Picture puzzle coaching and audio

The age 1–4 entry starts with hints enabled. The age 4–8 entry keeps its existing
advanced defaults and optional sentence lesson. Hints toggle only the selected
piece's white target circle; the translucent source picture stays visible in
both modes. The same persistent preference is available on the victory card and
the sentence lesson, before replaying or continuing.

A moved piece released outside its target stays at the release location. It can
be dragged again, or the child can tap its target after selecting it. A simple
tap still selects a tray piece without enlarging or parking it. Touch cancel,
blur and resizing preserve parked pieces; replay creates a fresh puzzle.

`play-support-v1.js` provides the kindergarten demonstration. A canvas hand moves
the remaining pieces while SILMA speaks. Demonstration pieces are an overlay;
the child's placements and progress are never changed. Touching the board stops
the demonstration and gives control back to the child. Own image-specific
recordings live in `audio/teacher/`; common corrected instructions reuse the
tangram recordings. The manifest records text, generation settings and hashes.
`tools/generate-teacher.py` regenerates the two image-specific SILMA clips.
`tools/coach-asr.json` records independent Arabic transcription, including the
last words. Native browser playback was checked through the `ended` event.

The ten instrumental tracks come from `resources/play-music/children-1-8`.
The app stores its own music preference, track and volume; it does not duplicate
the shared assets. Credits are linked in settings. Audio focus pauses music
during instructions, demonstrations, picture names, celebration, sentence
reading, sound effects, loading and open settings/lesson/victory screens.
Existing puzzle celebrations remain generic before sentence playback.

All runtime audio and shared dependencies are included in the picture puzzle
offline manifest. Generator scripts, tests and this document are not downloaded
as runtime dependencies.

## Verification

- `node tooling/test-picture-puzzle-learning.cjs`
- `node --test resources/play-music/test/player.test.cjs`
- `node apps/1-4/picture-puzzles/test/child-play.test.cjs`
- `node tooling/test-picture-puzzles-browser.cjs`

Browser tests require Playwright. Set `APP360_TEST_CHROMIUM` for a local Chromium
executable. The child-flow test resolves Playwright through
`CODEX_PRIMARY_RUNTIME_NODE_MODULES`; the existing browser regression test also
supports an ordinary installation or `NODE_PATH`. Both cover phone, tablet and
the older-age entry. The child-flow test mocks audio to check focus, cancellation
and persistence; the existing browser test uses native audio for praise and
Arabic/English sentence highlights in fullscreen. A legacy Android user agent
checks the app's compatibility path, not an actual Android 4.4 device.
