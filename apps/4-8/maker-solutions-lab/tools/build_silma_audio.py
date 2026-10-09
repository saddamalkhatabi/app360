"""Backward-compatible Maker CLI; shared SILMA synthesis + measured cues."""
import pathlib, subprocess, sys
root=pathlib.Path(__file__).resolve().parents[1]
raise SystemExit(subprocess.call([sys.executable,str(root.parents[2]/'tooling/build-silma-audio.py'),'--root',str(root)]+sys.argv[1:]))
