# Shared celebration audio

All age groups use this resource. Active clients: drawing-writing-foundations,
tangram-builder, picture-puzzles, screen-to-move, command-path-lab.

The public player always selects a generic phrase. `play({language, gender, kind}, done)`
finishes after the recording, so a learning card can read its sentences next.
`stop()` cancels both playback and stale completion callbacks. Legacy Android uses
one shared unsigned PCM pack; modern browsers use compact MP3 clips.

## Migration

- Generic phrases and optional name prefixes are separate recordings.
- `names.json` indexes the 41 existing canonical names and aliases, with standalone
  name audio explicitly marked pending. Combined old praise/name clips are not
  reused as standalone names.
- Arabic hamza, tashkeel, tatweel, spacing and common letter variants normalize
  for lookup. Ambiguous matches return no match; aliases can be extended without
  changing audio files.
- The player does not enable personalized audio from caller options, local storage,
  login state, or a browser flag. `personalizationEnabled()` remains false.
- Future subscriber personalization requires verified server entitlement, standalone
  name recordings (about 1000 additional common Arabic/Yemeni names are planned),
  gender-aware prefix selection, and an authorized Google TTS fallback for an
  unknown name. None of those future subscription or Google-name calls are active.
- Existing combined recordings remain in the repository for continuity. Migrated
  offline bundles exclude their duplicate per-name media and use this shared bank.

Generated metadata identifies SILMA revision, SHA-256 and duration. Technical media
validation does not claim a human listening review.
