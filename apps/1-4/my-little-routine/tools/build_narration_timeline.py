#!/usr/bin/env python3
"""Compile *measured* SILMA MP3 word alignment into reliable routine scene timing.
No estimated per-scene timing is accepted or published.
"""
import hashlib
import json
import pathlib
import subprocess
import argparse

ROOT = pathlib.Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "audio/narration-scripts.json"
CUES = ROOT / "audio/silma-alignment.json"
OUT = ROOT / "audio/narration-timings.js"
parser = argparse.ArgumentParser()
parser.add_argument("--allow-partial", action="store_true")
args = parser.parse_args()
data = json.loads(SCRIPT.read_text(encoding="utf-8"))
aligned = json.loads(CUES.read_text(encoding="utf-8"))["items"]
result = {"schema_version": 1, "status": "recorded", "engine": "silma", "habits": {}}

assert len(data["items"]) == 50, "Expected 50 routine scripts"
for entry in data["items"]:
    if entry["path"] not in aligned:
        if args.allow_partial:
            continue
        raise AssertionError("Missing acoustic alignment: " + entry["path"])
    p = ROOT / entry["path"]
    assert p.exists() and p.stat().st_size > 2000, str(p)
    cues = aligned[entry["path"]]
    assert cues["text"] == entry["text"], entry["id"]
    audiohash = hashlib.sha256(p.read_bytes()).hexdigest()
    assert cues["audio_sha256"] == audiohash, entry["id"]
    probe = json.loads(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "stream=codec_name:format=duration",
         "-of", "json", str(p)], text=True))
    assert probe["streams"][0]["codec_name"] == "mp3"
    duration_ms = round(float(probe["format"]["duration"]) * 1000)
    assert 1500 < duration_ms < 45000, (entry["id"], duration_ms)
    cue_map = {int(n): int(start) for n, start, _ in cues["cues"]}
    segments, word_pos = [], 0
    for segment in entry["segments"]:
        word_count = len(segment["text"].split())
        found = [cue_map[i] for i in range(word_pos, word_pos + word_count) if i in cue_map]
        assert found, ("Unaligned segment", entry["id"], segment["text"])
        segments.append({
            "kind": segment["kind"], "step": segment["step"],
            "text": segment["text"], "start_ms": found[0],
        })
        word_pos += word_count
    assert word_pos == len(entry["text"].split()), entry["id"]
    for i, seg in enumerate(segments):
        end_ms = segments[i+1]["start_ms"] if i+1 < len(segments) else duration_ms
        assert end_ms > seg["start_ms"], (entry["id"], i, end_ms)
        seg["end_ms"] = end_ms
    result["habits"][entry["id"]] = {
        "path": entry["path"], "title": entry["title"],
        "steps": entry["steps"], "segments": segments,
        "duration_ms": duration_ms, "sha256": audiohash,
        "verified": True,
    }
if args.allow_partial:
    assert len(result["habits"]) >= 1
    result["status"] = "partial_recorded"
else:
    assert len(result["habits"]) == 50
result["clip_count"] = len(result["habits"])
OUT.write_text("window.APP360_ROUTINE_NARRATIONS = " +
               json.dumps(result, ensure_ascii=False, separators=(",", ":")) +
               ";\n", encoding="utf-8")
print("Generated verified SILMA routine MP3 timings:", len(result["habits"]), OUT)
