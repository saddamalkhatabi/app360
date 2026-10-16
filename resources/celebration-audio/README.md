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
- Subscriber personalization now has a disabled server foundation, documented below.
  About 1000 additional common Arabic/Yemeni names are planned. Existing app flows
  and learning cards remain generic; no paid-name or Google-name calls activate by default.
- Existing combined recordings remain in the repository for continuity. Migrated
  offline bundles exclude their duplicate per-name media and use this shared bank.

Generated metadata identifies SILMA revision, SHA-256 and duration. Technical media
validation does not claim a human listening review.

## Subscriber foundation (off by default)

`play()` remains generic in every existing app, including puzzle learning cards.
`playPersonalized({enabled:true,name,gender,language:'ar',kind,allowGoogle:false}, done)`
is a separate opt-in entry point. It requires a fresh authenticated server decision
before playing any prefix. Network errors, expiry, unreviewed or ambiguous names,
and invalid responses fall back to generic praise. Stop/navigation aborts requests
and both audio segments. Legacy tablets retain their proven generic PCM path.

Apply migration `010_personalized_praise` before enabling the server feature.
An active `feature_entitlements` record must name `personalized-praise`, identify
the verified user or their account, and have a current start and expiry. Populate
these rows from the authoritative billing integration; there is no browser grant
endpoint. Existing login, a local-storage switch or caller flags do not grant access.
`APP360_ENABLE_PERSONALIZED_PRAISE=0` keeps this foundation inactive.

Known names require `audio.auditory_review="approved"` after listening review.
`review-names.html` previews the independent names and prefix composition without
changing approval or paid-feature state. Do not mark a clip approved merely because
its hash or decoder passed. The 41 names are the first batch; the roughly 1000
additional Arabic/Yemeni names require a curated list and further recording/review.

Unknown names use Google only with the caller's explicit `allowGoogle:true`, an
active server entitlement, a daily server quota and
`APP360_ENABLE_GOOGLE_NAME_TTS=1`. Put service-account credentials only in the
server secret `APP360_GOOGLE_TTS_CREDENTIALS_JSON`. The fixed official Cloud TTS
endpoint receives the name only (plain text, not SSML); OAuth credentials and
provider errors never reach the browser. There is no public Google Translate URL
fallback, no arbitrary remote audio URL, and no automatic Google call for a known
name awaiting review. Provider failure returns generic praise. Default daily quota
is 10 per authenticated user; failed provider attempts count to limit retries.

Official protocol: https://docs.cloud.google.com/text-to-speech/docs/reference/rest/v1/text/synthesize

Listening review is recorded per exact audio digest with
`node tooling/review-celebration-name.cjs --id name-3 --sha256 <current-sha256> --status approved --reviewer <reviewer> --note <listening-observation>`.
Use `rejected` for a clip needing correction. This command is for a completed human
listening review, not automatic validation. The server requires the approved review
to match the current metadata digest. Regeneration resets that clip to pending.

The name recorder resumes valid existing clips and generates at most 50 new names
per run (`APP360_NAME_BATCH_LIMIT`, 1–100). This keeps future 1000-name expansion
in reviewable batches rather than one long job; `complete` remains false until all
catalog records have independent audio. Retrying a batch preserves valid recordings
and their reviews. Do not add invented spelling variants as new canonical people.
