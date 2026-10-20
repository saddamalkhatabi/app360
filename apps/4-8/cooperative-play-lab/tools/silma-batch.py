"""Resume the authored Arabic recordings in independent, verifiable build shards."""
import argparse, hashlib, json, pathlib, shutil, subprocess

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = pathlib.Path('/tmp/cooperate-output')

def read(path):
    return json.loads(path.read_text())

def write(path, value):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')

parser = argparse.ArgumentParser()
parser.add_argument('action', choices=['prepare', 'pack', 'activate'])
parser.add_argument('--part', type=int, default=0)
parser.add_argument('--parts', type=int, default=40)
args = parser.parse_args()
items = read(ROOT/'data/arabic-audio-manifest.json')['items']
assert len(items) == 430 and all(i['language'] == 'ar' for i in items)

if args.action == 'prepare':
    assert 0 <= args.part < args.parts
    shard = items[args.part::args.parts]
    missing = [i for i in shard if not (ROOT/i['path']).exists()]
    write(ROOT/'data/silma-shard.json', {'items': shard})
    write(ROOT/'data/silma-pending.json', {'items': missing})
    print(f'Shard {args.part}: {len(shard)} total, {len(missing)} need synthesis')

elif args.action == 'pack':
    cues = read(ROOT/'data/silma-shard-cues.json')['items']
    shard = read(ROOT/'data/silma-shard.json')['items']
    assert set(cues) == {i['path'] for i in shard}
    for item in shard:
        path = ROOT/item['path']
        cue = cues[item['path']]
        assert cue['text'] == item['text']
        assert cue['audio_sha256'] == hashlib.sha256(path.read_bytes()).hexdigest()
        target = OUT/item['path']
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, target)
    write(OUT/f'cues/part-{args.part}.json', cues)
    report = ROOT/'data/silma-shard-report.json'
    if report.exists():
        write(OUT/f'reports/part-{args.part}.json', read(report))

else:
    cues = {}
    for path in sorted((OUT/'cues').glob('part-*.json')):
        rows = read(path)
        assert not set(rows).intersection(cues), 'Duplicate shard paths'
        cues.update(rows)
    assert set(cues) == {i['path'] for i in items}, (len(cues), len(items))
    for item in items:
        source = OUT/item['path']
        cue = cues[item['path']]
        assert cue['text'] == item['text']
        assert cue['audio_sha256'] == hashlib.sha256(source.read_bytes()).hexdigest()
        target = ROOT/item['path']
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(source, target)
    write(ROOT/'data/read-along-ar.json', {'schema_version': 1, 'timing_source': 'MMS_FA acoustic forced alignment of actual SILMA MP3', 'items': cues})
    reports = [read(p) for p in sorted((OUT/'reports').glob('*.json'))]
    write(ROOT/'data/silma-batch-reports.json', {'items': reports})
    subprocess.run(['python', str(ROOT/'tools/build-release.py')], check=True)
