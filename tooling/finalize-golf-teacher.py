"""Compatibility entry point for the first already-running recording build."""
from pathlib import Path
import subprocess
subprocess.run(["node", str(Path(__file__).with_name("finalize-golf-guidance.cjs"))], check=True)
# The original workflow stages only this app. Its offline builder also refreshes
# shared catalog records in other bundles; stage those generated records too.
subprocess.run(["node", str(Path(__file__).with_name("build-golf-offline.cjs"))], check=True)
subprocess.run(["git", "add", "data/offline", "data/offline-catalog.json"], check=True)
