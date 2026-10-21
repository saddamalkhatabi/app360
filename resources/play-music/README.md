# Shared play music

`children-1-8/` contains ten short instrumental Kevin MacLeod excerpts for the 1–4 and 4–8 experiences. `manifest.json` records each source recording, creator, license, changes, SHA-256 and file size. Preserve the visible `credits.html` link in every consuming app. No subscription, remote stream, advertisements, vocals or external media request is used during playback. A future adult pack should have its own ID and audience; do not add it to the children's manifest.

Load the chosen pack's `manifest.js`, then `player-v1.js`. Call:

```js
APP360_PLAY_MUSIC.configure({pack:'children-1-8',storageKey:'your-app:music',defaultEnabled:true,volume:.18});
// On the child's first gesture; never force browser autoplay.
APP360_PLAY_MUSIC.unlock();
// Every voice, effect, trainer, or other exclusive audio owner gets a lock.
APP360_PLAY_MUSIC.block('narration');
// Release only after it has stopped, ended, failed, or been cancelled.
APP360_PLAY_MUSIC.release('narration');
```

Locks are independent: releasing narration cannot resume music while a trainer, victory or another voice still holds a lock. Music is paused, then resumes after 650ms of quiet. A mute button must call `setMasterEnabled`, the music toggle `setEnabled`. The per-app music choice and volume are local; maximum volume is 30%. Hide/blur/pagehide suspend playback. Failures do not block the game. `next`, `select`, `state`, `onChange`, `setVolume` are available. Only consuming apps load this engine; no other application is enabled implicitly.

Tangram wires narration, the teacher demonstration, success/name encouragement, synthesized tones, success cards, settings panels and the sound toggle. Its own `play-music-v1.js` contains these application-specific connections. The rotating track changes with the stage; the settings selector can pin one track.

Rebuild the MP3 pack with `tools/import-children-pack.py` (Python and FFmpeg). Originals are cached in scratch, while the reusable optimized files and source/license metadata live in this repository. The importer downloads the exact Wikimedia Commons files whose attached licenses are CC BY 3.0 or 4.0; the current ten are CC BY 3.0.
