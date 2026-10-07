"""Public authored curriculum only; private child text never enters this build."""
import pathlib, subprocess, sys
ROOT=pathlib.Path(__file__).resolve().parents[1]
subprocess.run([sys.executable,str(ROOT.parents[2]/'tooling/build-authored-audio.py'),str(ROOT),sys.argv[1]],check=True)
