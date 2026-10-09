#!/usr/bin/env bash
set -euo pipefail
# Usage (dedicated Linux SILMA build host, predownloaded public weights):
# SILMA_MODEL_CACHE=/path/to/hf-cache SILMA_CACHE=/path/to/audio-cache ALLOW_DRAFT_PILOT=1 bash tooling/age1-4-silma/worker-4/build-pilot.sh
cd "$(dirname "$0")/../../.."
: "${SILMA_MODEL_CACHE:?Set model cache directory with predownloaded SILMA weights}"
: "${SILMA_CACHE:?Set a writable synthesis cache directory}"
: "${ALLOW_DRAFT_PILOT:?Explicitly allow synthesis of unreviewed draft narration for private listening only}"
for app in screen-to-move imitate-one-step my-little-routine plan-runner-360; do
 python tooling/build-silma-audio.py --root . --cache "$SILMA_CACHE" --model-cache "$SILMA_MODEL_CACHE" --manifest "tooling/age1-4-silma/worker-4/narration-$app.json" --generate-only --limit 1
done
# Do not publish or mark reviewed; human listening and tashkeel review required.
