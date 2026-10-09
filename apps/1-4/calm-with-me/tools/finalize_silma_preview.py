#!/usr/bin/env python3
"""Build a *preview-only* SILMA audio map from real, decodable MP3 files.

Technical verification is not a listening review or user approval. The original
app and all production branches are intentionally left unchanged.
"""
import argparse
import hashlib
import json
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = ROOT / "audio/silma/manifest.json"
INDEX = ROOT / "calm-silma-index-serial-v1.js"
REPORT = ROOT / "audio/silma/preview-build-report.json"


def probe(path):
    proc = subprocess.run([
        "ffprobe", "-v", "error", "-select_streams", "a:0",
        "-show_entries", "stream=codec_name,sample_rate,channels:format=duration",
        "-of", "json", str(path)
    ], check=True, text=True, capture_output=True, timeout=30)
    info = json.loads(proc.stdout)
    stream = info["streams"][0]
    duration = float(info["format"]["duration"])
    assert stream["codec_name"] == "mp3", path
    assert int(stream["sample_rate"]) == 24000, path
    assert int(stream["channels"]) == 1, path
    assert 0.45 < duration < 45, path
    assert path.stat().st_size > 1500, path
    return round(duration, 2)


def main():
    p = argparse.ArgumentParser()
    p.add_argument("--allow-partial", action="store_true",
                   help="Create a preview map for available files only; never label complete")
    args = p.parse_args()
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    clips = {}
    ids = set()
    missing = []
    for item in manifest["items"]:
        event = item["event_id"]
        assert event not in ids, "Duplicate event " + event
        ids.add(event)
        assert event == "calm-with-me:" + item["kind"] + ":" + item["item_id"]
        rel = Path(item["path"])
        assert not rel.is_absolute() and ".." not in rel.parts
        path = ROOT / rel
        if not path.is_file():
            missing.append(str(rel))
            item["audio_generated"] = False
            continue
        duration = probe(path)
        item["audio_generated"] = True
        item["sha256"] = hashlib.sha256(path.read_bytes()).hexdigest()
        item["duration_seconds"] = duration
        clips[item["kind"] + ":" + item["item_id"]] = {
            "path": item["path"],
            "engine": "silma",
            "verified": True,
            "preview_only": True,
            "human_reviewed": False,
            "kind": item["kind"],
            "event_id": event
        }
    if missing and not args.allow_partial:
        raise SystemExit("Missing " + str(len(missing)) + " clips: " + ", ".join(missing[:8]))
    assert len(ids) == 74, "Source event manifest incomplete"
    if not args.allow_partial:
        assert len(clips) == 74, "Audio coverage incomplete"
    manifest["status"] = str(len(clips)) + "_OF_74_GENERATED_PREVIEW_ONLY_AWAITING_REVIEW"
    INDEX.write_text(
        "/* Preview-only: technically validated MP3; NOT listened/reviewed. */\n"
        "window.APP360_CALM_SILMA_INDEX = "
        + json.dumps(clips, ensure_ascii=False, indent=2) + ";\n",
        encoding="utf-8")
    MANIFEST.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    REPORT.write_text(json.dumps({
        "engine": "SILMA TTS 1.0.5",
        "clips": len(clips),
        "expected_clips": 74,
        "missing_clips": missing,
        "files_exist": not bool(missing),
        "mp3_technically_decodable": not bool(missing),
        "human_listening_review": False,
        "user_approved": False,
        "production_ready": False,
        "notes": "Preview branch only. No published production code updated."
    }, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("SILMA preview generated", len(clips), "of 74 technically checked clips.")


if __name__ == "__main__":
    main()
