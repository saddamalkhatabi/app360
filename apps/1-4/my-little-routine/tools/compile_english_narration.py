#!/usr/bin/env python3
"""Fail closed unless all 50 authentic English MP3 and 350 timed passages exist."""
import hashlib
import json
import pathlib
import subprocess

root = pathlib.Path(__file__).resolve().parents[1]
manifest = json.loads((root/"audio/narration-scripts-en.json").read_text(encoding="utf-8"))
merged = {}
for part in range(10):
    f = root/"audio/en/timings"/("part-"+str(part)+".json")
    d = json.loads(f.read_text(encoding="utf-8"))
    assert d["part"] == part
    for ident, clip in d["items"].items():
        assert ident not in merged, ident
        merged[ident] = clip
assert len(merged) == len(manifest["items"]) == 50
for item in manifest["items"]:
    clip = merged[item["id"]]
    mp3 = root/clip["path"]
    assert clip["path"] == item["path"] and mp3.exists() and mp3.stat().st_size > 4000
    assert hashlib.sha256(mp3.read_bytes()).hexdigest() == clip["sha256"], item["id"]
    probe=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_entries",
       "stream=codec_name:format=duration","-of","json",str(mp3)],text=True))
    assert probe["streams"][0]["codec_name"] == "mp3"
    actual=round(float(probe["format"]["duration"])*1000)
    assert actual == clip["duration_ms"], item["id"]
    assert clip["title"] == item["title"] and clip["steps"] == item["steps"]
    assert len(clip["segments"]) == 7
    for n,segment in enumerate(clip["segments"]):
        expected=item["segments"][n]
        assert (segment["kind"],segment["step"],segment["text"]) == (
            expected["kind"],expected["step"],expected["text"]), (item["id"],n)
        assert 0 <= segment["start_ms"] < segment["end_ms"] <= actual
        if n<6: assert segment["end_ms"] == clip["segments"][n+1]["start_ms"]
output={"schema_version":1,"status":"recorded","language":"en","engine":"kokoro-onnx",
  "voice":"af_heart","clip_count":50,"habits":merged}
dst=root/"audio/narration-timings-en.js"
dst.write_text("window.APP360_ROUTINE_NARRATIONS_EN = "+
   json.dumps(output,ensure_ascii=False,separators=(",",":"))+";\n",encoding="utf-8")
print("Verified 50 English MP3, 250 picture cues and 350 phrase cues:",dst)
