> Current Arabic name-praise design: see [complete phrase handoff](../../docs/FULL_NAME_PRAISE_20261026_AR.md). The new player uses one full recording per name/gender. The standalone/device-speech descriptions below are historical and are superseded for named playback. Actual generation progress is `names.json.full_praise_progress`; technical recording status is not human listening approval.

# Shared celebration audio

All age groups use this resource. Active clients: drawing-writing-foundations,
tangram-builder, picture-puzzles, screen-to-move, command-path-lab.

The public player always selects a generic phrase. `play({language, gender, kind}, done)`
finishes after the recording, so a learning card can read its sentences next.
`stop()` cancels both playback and stale completion callbacks. Legacy Android uses
one shared unsigned PCM pack; modern browsers use compact MP3 clips.

## Migration

- Generic phrases and optional name prefixes are separate recordings.
- `names.json` indexes 1041 canonical names and aliases. Actual recording and
  listening-review status are tracked separately for each name. Combined old praise/name clips are not
  reused as standalone names.
- Arabic hamza, tashkeel, tatweel, spacing and common letter variants normalize
  for lookup. Ambiguous matches return no match; aliases can be extended without
  changing audio files.
- The player does not enable personalized audio from caller options, local storage,
  login state, or a browser flag. `personalizationEnabled()` remains false.
- Subscriber personalization now has a disabled server foundation, documented below.
  The 1000 added Arabic/Yemeni candidates are being recorded in resumable shards. Existing app flows
  and learning cards remain generic; no personalized-name calls activate by default.
- Existing combined recordings remain in the repository for continuity. Migrated
  offline bundles exclude their duplicate per-name media and use this shared bank.

Generated metadata identifies SILMA revision, SHA-256 and duration. Technical media
validation does not claim a human listening review.

## Subscriber foundation (off by default)

`play()` remains generic in every existing app, including puzzle learning cards.
`playPersonalized({enabled:true,name,gender,language:'ar',kind,allowDeviceSpeech:true}, done)`
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
its hash or decoder passed. The 41 existing names are the first batch; the 1000 additional candidates have
authored reading forms and still require recording and listening review.

Unknown names use the phone/browser's `speechSynthesis` only after server entitlement
approval, with `allowDeviceSpeech:true` (the client default). The server returns the
validated name as a `device-speech` segment; it makes no speech-provider request.
There are no Google Cloud accounts, API keys, service credentials, provider quotas,
or provider subscriptions in this fallback. Existing unreviewed names and ambiguous
matches retain generic praise rather than bypassing the recording review.

Before any name prefix is played, the browser waits briefly for an Arabic voice to
become available. It prefers a voice marked `localService`, then another available
Arabic system voice. Missing/unsupported Arabic speech, playback errors or timeout
fall back to generic praise. Stop, page navigation and hiding the app cancel speech
and pending voice selection. Android 4/legacy clients retain the generic PCM path.
A voice provided by the operating system can itself require network access;
availability and pronunciation depend on the installed device voices. This does
not grant access to the application's subscriber-only personalized-praise feature.

Web Speech API: https://developer.mozilla.org/en-US/docs/Web/API/SpeechSynthesis

Listening review is recorded per exact audio digest with
`node tooling/review-celebration-name.cjs --id name-3 --sha256 <current-sha256> --status approved --reviewer <reviewer> --note <listening-observation>`.
Use `rejected` for a clip needing correction. This command is for a completed human
listening review, not automatic validation. The server requires the approved review
to match the current metadata digest. Regeneration resets that clip to pending.

The name recorder resumes valid existing clips and defaults to at most 50 new names
per shard (`APP360_NAME_BATCH_LIMIT`, 1–100). The workflow partitions work into
20 shards and skips model installation for shards with no pending names. This keeps future 1000-name expansion
in reviewable batches rather than one long job; `complete` remains false until all
catalog records have independent audio. Retrying a batch preserves valid recordings
and their reviews. Do not add invented spelling variants as new canonical people.

First batch completed: 41 standalone name recordings, with exact hashes and durations.
All 41 are pending human listening review; none have been automatically approved.

## Expanded catalog and resumable recording

The v2 catalog now contains **1041 canonical names**: the existing 41 recordings
plus 1000 new candidates with authored reading vowels. The added entries remain
`pending-standalone-recording` until actual media is published. Name provenance and
MIT notices for the consulted candidate lists are in `sources/`.

The recorder partitions stable canonical IDs across 20 independent SILMA jobs.
Each job checkpoints completed recordings after each name and uploads them even
when later inference fails. A final job reads the latest `main` catalog, verifies
incoming identity/text/path/digest/duration, preserves current valid reviewed
recordings, and publishes all completed media. Missing/failed names are retried on
the next run; unchanged valid clips are skipped before loading the model. A failed
shard never marks the whole catalog complete. New audio always awaits listening
review; no recording job can approve itself.

`recording_progress` reports actual verified recordings, pending names and received
shards. `complete` means all canonical names have media, not approved pronunciation.
The public child applications continue to use generic praise. Billing entitlements and listening-review approval remain independent requirements.
Device speech requires no provider configuration.

If the catalog is corrected while a recording job is active, the merge skips only
stale texts and retains other valid outputs. Bounded automatic resume attempts
read fresh `main` and synthesize only missing/current texts, never overwrite a
current valid approved clip, and never convert technical QA to listening approval.
