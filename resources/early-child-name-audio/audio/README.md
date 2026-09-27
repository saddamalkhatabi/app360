# Arabic audio packs

- `نور/`: user-specific encouragement and test clips.
- `colors/`: shared Arabic color pronunciations used for every user.
- `registry.json`: maps names, phrases and aliases to files.

To add another child, create `audio/<name>/`, add MP3 clips, then add that child under `users` in `registry.json`. The app uses device TTS first in Auto mode and falls back to these files when TTS is unavailable or fails.
