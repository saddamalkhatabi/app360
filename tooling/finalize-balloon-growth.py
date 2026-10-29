"""Merge only the six new public farm clips; preserve all reviewed letter evidence."""
import array, hashlib, json, pathlib, subprocess
root = pathlib.Path('apps/1-4/balloon-garden')
manifest = root / 'guidance.js'
data = json.loads(manifest.read_text(encoding='utf-8').split('=', 1)[1].strip().removesuffix(';'))
seen = set()
for row in json.loads((root / 'data/growth-scripts.json').read_text(encoding='utf-8'))['items']:
    source = root / row['path']
    raw = subprocess.check_output(['ffmpeg', '-v', 'error', '-i', str(source), '-f', 'f32le', '-ac', '1', '-ar', '24000', '-'])
    samples = array.array('f', raw)
    duration = len(samples) / 24000
    voiced = sum(sum(x*x for x in samples[i:i+480]) / len(samples[i:i+480]) > .000009 for i in range(0, len(samples), 480)) * .02
    digest = hashlib.sha256(source.read_bytes()).hexdigest()
    assert .5 < duration < 20 and voiced > .4, row['path']
    assert digest not in seen, row['path']
    seen.add(digest)
    data['clips'][row['language'] + ':' + row['id']] = dict(row, duration_ms=round(duration*1000), voiced_ms=round(voiced*1000), sha256=digest, package_version='1.0.5', model_revision='226dd7a65cadf51f9a6dbe3953fc89003b3844d5', reference='publisher bundled ar.ref.24k.wav', auditory_review='pending')
manifest.write_text('window.BalloonGardenGuidance=' + json.dumps(data, ensure_ascii=False, separators=(',', ':')) + ';\n', encoding='utf-8')
print('Decoded six distinct farm encouragement clips; prior letter reviews preserved.')
