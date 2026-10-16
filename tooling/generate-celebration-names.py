"""Resumable SILMA name-only recordings, partitioned by stable canonical ID."""
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile
from celebration_name_batches import digest, recorded, shard_rows, write_json

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'resources/celebration-audio'


def main():
    catalog = json.loads((OUT / 'names.json').read_text())
    index = int(os.environ.get('APP360_NAME_SHARD_INDEX', '0'))
    count = int(os.environ.get('APP360_NAME_SHARD_COUNT', '1'))
    limit = int(os.environ.get('APP360_NAME_BATCH_LIMIT', '50'))
    if not 1 <= limit <= 100:
        raise ValueError('Batch limit must be between 1 and 100')
    selected = shard_rows(catalog['records'], index, count)
    pending = [r for r in selected if not recorded(r, OUT)]
    export = pathlib.Path(os.environ.get('APP360_NAME_EXPORT_DIR', '/tmp/name-recording-export'))
    report = {'schema': 1, 'shard_index': index, 'shard_count': count,
              'selected': len(selected), 'records': [], 'failures': [], 'limited': len(pending) > limit}
    output = export / 'reports' / ('shard-' + str(index) + '.json')

    def checkpoint():
        report['records'] = [r for r in selected if recorded(r, OUT)]
        for row in report['records']:
            target = export / row['audio']['path']
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(OUT / row['audio']['path'], target)
        write_json(output, report)
        catalog['complete'] = all(recorded(r, OUT) for r in catalog['records'])
        write_json(OUT / 'names.json', catalog)

    checkpoint()
    if not pending:
        print('No pending names in shard', index, flush=True)
        return
    os.environ['HF_HUB_OFFLINE'] = '1'
    os.environ['TRANSFORMERS_OFFLINE'] = '1'
    sys.path.insert(0, str(ROOT / 'apps/1-4/screen-to-move/tools'))
    from silma_phonics_engine import load_engine
    import numpy as np
    hub = pathlib.Path(os.environ['HF_HOME']) / 'hub'
    model = next((hub / 'models--silma-ai--silma-tts/snapshots').rglob('model.pt'))
    vocoder = next((hub / 'models--charactr--vocos-mel-24khz/snapshots').glob('*'))
    engine = load_engine(model, next(model.parent.rglob('vocab.txt')), vocoder, threads=2, precision='fp32')
    clips = json.loads((ROOT / 'apps/1-4/say-and-name/data/meaning-audio-v1.js').read_text().split('=', 1)[1].strip().rstrip(';'))['clips']
    candidates = [c for c in clips.values() if c['language'] == 'ar'
                  and 3000 <= c.get('duration_ms', 0) <= 5000
                  and c.get('speech_qa', {}).get('passed')
                  and (ROOT / 'apps/1-4/say-and-name' / c['path']).is_file()]
    reference = min(candidates, key=lambda c: c['duration_ms'])
    source = ROOT / 'apps/1-4/say-and-name' / reference['path']
    assert digest(source) == reference['sha256'], 'Reference digest mismatch'
    try:
        for row in pending[:limit]:
            print('Standalone name', row['id'], row['name'], flush=True)
            target = OUT / 'audio/names' / (row['id'] + '.mp3')
            target.parent.mkdir(parents=True, exist_ok=True)
            try:
                with tempfile.TemporaryDirectory(prefix='silma-name-') as work:
                    wavfile = pathlib.Path(work) / 'name.wav'
                    mp3file = pathlib.Path(work) / 'name.mp3'
                    wav, sr, _ = engine.infer(ref_file=str(source), ref_text=reference['text'],
                        gen_text=row['spoken_text'] + '.', file_wave=str(wavfile),
                        seed=4100 + int(row['id'][5:]) - 1, speed=.90, nfe_step=24,
                        force_tashkeel=False, normalize_numbers=False)
                    assert np.isfinite(wav).all() and .2 < len(wav) / sr < 8
                    assert np.max(np.abs(wav)) > .005, 'Empty waveform'
                    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wavfile),
                        '-ar', '24000', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '64k', str(mp3file)], check=True)
                    subprocess.run(['ffmpeg', '-v', 'error', '-i', str(mp3file), '-f', 'null', '-'], check=True)
                    shutil.copy2(mp3file, target)
                    row['audio'] = {'path': str(target.relative_to(OUT)), 'sha256': digest(target),
                        'duration_ms': round(len(wav) / sr * 1000), 'text': row['spoken_text'],
                        'engine': 'silma-tts-1.0.5', 'model_revision': '226dd7a65cadf51f9a6dbe3953fc89003b3844d5',
                        'auditory_review': 'pending'}
                    row['status'] = 'recorded-awaiting-listening-review'
            except Exception as error:
                report['failures'].append({'id': row['id'], 'error': type(error).__name__})
                print('Needs retry:', row['id'], type(error).__name__, flush=True)
            checkpoint()
    finally:
        checkpoint()
    print('Shard', index, 'recorded', len(report['records']), '/', len(selected), flush=True)
    if report['failures']:
        raise RuntimeError('Some names need a resumable retry; completed clips were preserved')


if __name__ == '__main__':
    main()
