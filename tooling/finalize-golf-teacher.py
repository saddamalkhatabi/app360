"""Compatibility entry point for the first already-running recording build."""
from pathlib import Path
import subprocess
subprocess.run(["node", str(Path(__file__).with_name("finalize-golf-guidance.cjs"))], check=True)
