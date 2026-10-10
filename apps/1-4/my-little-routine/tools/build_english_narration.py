#!/usr/bin/env python3
"""Build actual 24kHz English MP3 child narration, measuring every storyboard cut.
Each phrase is rendered separately, so scene cuts use real sample counts rather
than estimated word timings or browser TTS.
"""
import argparse
import hashlib
import json
import pathlib
import subprocess
import tempfile

def probe(path):
    d = json.loads(subprocess.check_output(
        ["ffprobe", "-v", "error", "-show_entries", "stream=codec_name:format=duration",
         "-of", "json", str(path)], text=True))
    assert d["streams"][0]["codec_name"] == "mp3", str(path)
    return round(float(d["format"]["duration"]) * 1000)

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--part", type=int, required=True)
    ap.add_argument("--parts", type=int, default=10)
    ap.add_argument("--model", required=True)
    ap.add_argument("--voices", required=True)
    args = ap.parse_args()
    assert 0 <= args.part < args.parts
    import numpy as np
    import soundfile as sf
    from kokoro_onnx import Kokoro
    root = pathlib.Path(__file__).resolve().parents[1]
    manifest = json.loads((root / "audio/narration-scripts-en.json").read_text(encoding="utf-8"))
    assert len(manifest["items"]) == 50
    model = Kokoro(args.model, args.voices)
    subset = [(i, h) for i, h in enumerate(manifest["items"]) if i % args.parts == args.part]
    verified = {}
    for i, habit in subset:
        assert len(habit["segments"]) == 7 and len(habit["steps"]) == 5
        frames, timing, at, rate = [], [], 0, None
        for ix, segment in enumerate(habit["segments"]):
            sentence = segment["text"]
            audio, sample_rate = model.create(sentence, voice="af_heart", speed=0.92, lang="en-us")
            wave = np.asarray(audio, dtype=np.float32).reshape(-1)
            assert wave.size > 2000 and np.isfinite(wave).all(), (habit["id"], ix)
            if rate is None: rate = sample_rate
            assert sample_rate == rate
            start = round(at * 1000 / rate)
            frames.append(wave)
            at += len(wave)
            pause = np.zeros(round(rate * (0.20 if ix != 6 else 0.12)), dtype=np.float32)
            frames.append(pause)
            at += len(pause)
            timing.append({"kind": segment["kind"], "step": segment["step"], "text": sentence, "start_ms": start})
        audio_all = np.concatenate(frames)
        out = root / habit["path"]
        out.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.TemporaryDirectory() as tmp:
            wav = pathlib.Path(tmp) / "tmp.wav"
            sf.write(str(wav), audio_all, rate, subtype="PCM_16")
            subprocess.run(["ffmpeg", "-hide_banner", "-loglevel", "error", "-nostdin",
                            "-y", "-i", str(wav), "-codec:a", "libmp3lame",
                            "-b:a", "64k", "-ar", str(rate), str(out)], check=True)
        duration = probe(out)
        assert 4500 < duration < 70000, (habit["id"], duration)
        for x, item in enumerate(timing):
            end = timing[x+1]["start_ms"] if x+1 < len(timing) else duration
            assert end > item["start_ms"], (habit["id"], x)
            item["end_ms"] = end
        hashval = hashlib.sha256(out.read_bytes()).hexdigest()
        verified[habit["id"]] = {
            "path": habit["path"], "language":"en", "title": habit["title"],
            "steps": habit["steps"], "segments": timing, "duration_ms": duration,
            "sha256": hashval, "verified": True,
        }
        print("English recorded", i + 1, "/", len(manifest["items"]), habit["id"], duration, flush=True)
    part = root / "audio/en/timings" / ("part-" + str(args.part) + ".json")
    part.parent.mkdir(parents=True, exist_ok=True)
    part.write_text(json.dumps({"part": args.part, "items": verified},
                               indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    assert len(verified) == len(subset)
    print("Produced actual Kokoro English audio", len(verified), "routines", flush=True)

if __name__ == "__main__":
    main()
