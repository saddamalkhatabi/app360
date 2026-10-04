import hashlib
import pathlib
import subprocess
import tempfile
import zipfile

BRANCH = 'family-school-360-preview'
BASE = '8048a0b1c03140085be114c54b420d3f41381793'
PAYLOAD = '527878691cbe633b51f5e625161b0b0e70936376'
CHECKSUM = '186a23f8cfdddc6a654e4046c60cc6d9de2b2a16ddf3f17b8edbe0c8ba198c10'

def git(*args):
    return subprocess.check_output(['git', *args], text=True).strip()

assert git('branch', '--show-current') == BRANCH
parts = sorted(pathlib.Path('.app360-publish').glob('wonder-levels23.zip.part*'))
assert [p.name for p in parts] == ['wonder-levels23.zip.part%02d' % i for i in range(7)]
with tempfile.TemporaryDirectory() as directory:
    archive = pathlib.Path(directory) / 'wonder-levels23.zip'
    with archive.open('wb') as output:
        for part in parts:
            output.write(part.read_bytes())
    assert archive.stat().st_size == 25766087
    assert hashlib.sha256(archive.read_bytes()).hexdigest() == CHECKSUM
    with zipfile.ZipFile(archive) as zipped:
        assert zipped.namelist() == ['wonder-levels23.bundle']
        zipped.extract('wonder-levels23.bundle', directory)
    bundle = str(pathlib.Path(directory) / 'wonder-levels23.bundle')
    subprocess.run(['git', 'bundle', 'verify', bundle], check=True)
    subprocess.run(['git', 'fetch', bundle, 'HEAD'], check=True)
    assert git('rev-parse', 'FETCH_HEAD') == PAYLOAD
    paths = git('diff', '--name-only', BASE, PAYLOAD).splitlines()
    assert paths
    assert all(p in ['CONTINUE_HERE_AR.md', 'sw.js'] or p.startswith('apps/4-8/wonder-experiment-lab/') for p in paths)
    subprocess.run(['git', 'restore', '--source=' + PAYLOAD, '--staged', '--worktree', '--', *paths], check=True)
    subprocess.run(['node', '--test', 'apps/4-8/wonder-experiment-lab/test/model.test.cjs'], check=True)
    subprocess.run(['git', 'rm', '--', *[str(p) for p in parts], '.github/workflows/publish-wonder-levels23.yml', '.github/scripts/publish-wonder-levels23.py'], check=True)
    assert git('write-tree') == git('rev-parse', PAYLOAD + '^{tree}'), 'Final repository tree differs from verified source'
    print('Archive checksum, 22 model tests and complete repository tree verified.')
