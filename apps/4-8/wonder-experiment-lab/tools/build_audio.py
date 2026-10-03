"""Build public authored clips through the shared boundary-aware renderer."""
import pathlib, subprocess, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
subprocess.run([sys.executable,str(ROOT.parents[2]/"tooling/build-authored-audio.py"),str(ROOT),sys.argv[1]],check=True)
