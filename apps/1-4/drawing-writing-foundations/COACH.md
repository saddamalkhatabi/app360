# Kindergarten drawing coach, build 26

The normal drawing board is preserved. The coach opens its own enlarged drawing
workspace and restores the previous board when closed. The child can use a
finger, stylus or mouse. No model weights, remote grading service or generated
images are loaded into the browser.

## Sessions

There are 55 authored centre-line lessons: six lines, six shapes, 28 Arabic
letters, eleven English-number drawings (0–10), and four simple pictures.
Arabic numbers remain available in the original manual drawing mode. Start with
lines and shapes; letters and numbers are optional for children who are ready.
These are introductory drawing paths, not a claim of a prescribed handwriting
method or a developmental assessment.

Each lesson introduces its name, demonstrates one stroke with a hand and pencil,
and waits for the child. The next stroke starts after a sufficiently close and
complete attempt. After guided practice, the child draws the whole model with
only a faint guide. Watching the demonstration never earns completion.

Assessment uses local vector proximity, coverage and path length after pen-up,
with a larger tolerance for the younger entry. Partial attempts can be combined.
A tap does not complete a long line, and a single dot cannot count as two letter
dots. Repeated large deviations show the demonstration again. Inactivity offers
help without completing or advancing a lesson. Help and retry remain available;
no numerical grade is shown to the child.

Automatic progression is optional, waits for the independent attempt, and can be paused. It is not a timer that completes activities.
Leaving or hiding the page pauses the session. A changed identity ends it.
Only completion summaries are saved locally under the official learner's ID;
raw drawings and movement traces are not persisted as training records. Guest
progress is separate. Restarting a group can select its first unfinished lesson.

The active coach owns speech exclusively. Older generic and named congratulations
are suppressed at both public celebration entry points, the ordinary audio engine,
and the desktop speech bridge. Pending older playback is cancelled at session start.
Official-session name encouragement remains available in ordinary drawing after
closing the coach; the editable local nickname is never used for official names.

The hand and pencil follow the narration's decoded `currentTime`, not wall time.
A loading or buffering clip holds the hand at its current position. Only a real
`ended` event completes narration; child input opens after the separate turn prompt
also ends. Feedback temporarily locks input, preventing a new stroke from cutting
off its instruction. A media error, rejected playback or 30 seconds without media
progress locks the board and offers retry or explicit mute. Failure is never treated
as successful playback. Muted demonstrations use a local visual clock. Pause, hide,
identity changes and closing cancel playback and stale callbacks.

New instructions and labels use SILMA. The audio manifest has exact text, hashes,
model revision and generation settings. Read-along cues use attention alignment
against each exact decoded MP3; highlights read `audio.currentTime`. Independent
ASR results are review aids, not a substitute for listening. The 4–8 launch option
shows coaching text by default; the younger entry can enable it. This prepares
the same runtime for the older age group without adding a new catalog entry.

## Future planner contract

```js
APP360_DRAWING_TRAINER.start({
  ageGroup: '1-4',
  lessonIds: ['horizontal', 'vertical', 'circle'],
  autoAdvance: true,
  showTranscript: false,
  resume: true
});
```

`groupId` can select one curriculum group instead of `lessonIds`. The API exposes
`listLessons()`, `getState()`, `pause()`, `resume()`, `stop()` and `capabilities`.
Its versioned DOM events are `app360:drawing-trainer:state`, `:attempt`,
`:lessoncomplete` and `:sessioncomplete`. Completion means the independent
practice passed the approximate local check. Events contain lesson IDs and
summary metrics, not child names or raw traces. The planner should respect
pause and wait for completion events. Starting while drawing or while a peer
session is connected is rejected. No cross-origin message command channel is
introduced.

## Performance and verification

The dialog observer previously wrote the same `z-index` attribute it observed.
It now changes it only when necessary, avoiding a mutation feedback loop.
Resize events are coalesced and unchanged canvas sizes are skipped. Each canvas
layer is limited to 1.5 million physical pixels. A stroke retains at most 512
sampled points; the latest 128 strokes remain undoable. Older local ink is
flattened to one bounded raster rather than growing vector history indefinitely.
The peer welcome/snapshot protocol and gallery carry the flattened base beside
the recent vectors, so old ink remains visible for participants. The base is
encoded only when changed. A closed gallery does not redraw participant cards.
Rasterisation is not performed on every move.
Audio registry actions coalesce behind one bounded request; cancelled decoder
callbacks cannot restart sound, and callback-plus-Promise decoding starts one
source. Coach animation and highlight timers stop on pause/close; an idle session has no
animation loop. The original free drawing remains incremental per movement.

Tests cover all authored paths and rejection cases, actual mouse/touch gestures,
partial strokes, repeated help, guided versus independent completion, names,
transitions, pause, captions, identity changes and dialog responsiveness.
Chromium stress simulated 300 strokes and 510,000 movement events: vector
history remained within its limits, flattened ink stayed visible, and the next
100 ms timer remained responsive. A full-page check with platform modules also
checked idle main-thread activity. A legacy Android user agent exercises the
compatibility branch; it is not a test on physical Android 4.4 hardware.

```sh
node --test test/geometry.test.cjs test/audio-runtime.test.cjs test/coach-speech.test.cjs
node test/trainer-browser.cjs
node test/native-audio.cjs
node test/coach-sync.cjs
node ../../../tooling/test-teacher-encouragement.cjs
```

The browser test accepts `APP360_TEST_CHROMIUM`. It resolves Playwright from
`CODEX_PRIMARY_RUNTIME_NODE_MODULES` when supplied, or a regular installation.
The generator and aligner under `tools/` take local public-model directories;
only their final audio, cues and manifest are shipped in the offline bundle.
