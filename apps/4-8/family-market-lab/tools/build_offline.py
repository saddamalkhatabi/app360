"""Build the shared explicit-download catalog; installation only caches used files."""
import pathlib, subprocess
repo = pathlib.Path(__file__).resolve().parents[4]
subprocess.run(['node', str(repo / 'tooling/build-offline-catalog.js')], cwd=repo, check=True)
