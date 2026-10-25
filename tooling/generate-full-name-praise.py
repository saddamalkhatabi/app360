"""Generate one complete phrase per name/gender, checkpointing after every clip."""
import argparse
import json
import os
import pathlib
import shutil
import subprocess
import sys
import tempfile
from full_praise_batches import tasks, metadata, valid, generic_catalog, REVISION
from celebration_name_batches import digest, write_json

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'resources/celebration-audio'


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--check-pending', action='store_true')
    args = parser.parse_args()
    index = int(os.environ.get('APP360_PRAISE_SHARD_INDEX', '0'))
    count = int(os.environ.get('APP360_PRAISE_SHARD_COUNT', '1'))
    catalog = json.loads((OUT / 'names.json').read_text())
    generic = generic_catalog(OUT)
    selected = tasks(catalog, index, count)
    pending = [t for t in selected if not valid(t, metadata(t, catalog, generic), OUT)]
    print('Pending full phrases:', len(pending), flush=True)
    if args.check_pending:
        with open(os.environ['GITHUB_OUTPUT'], 'a') as f:
            f.write('needed=' + str(bool(pending)).lower() + '\n')
        return
    export = pathlib.Path(os.environ.get('APP360_PRAISE_EXPORT_DIR', '/tmp/full-praise-export'))
    report = {'revision': REVISION, 'shard': index, 'records': [], 'failures': []}
    for task in selected:
        a = metadata(task, catalog, generic)
        if valid(task, a, OUT):
            report['records'].append({'id': task['id'], 'audio': a})

    def checkpoint():
        for record in report['records']:
            relative = record['audio']['path']
            target = export / relative
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(OUT / relative, target)
        write_json(export / 'reports' / ('shard-' + str(index) + '.json'), report)

    checkpoint()
    if not pending:
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
    reference = ROOT / 'apps/1-4/say-and-name/audio/meaning/ar/ar_be4705b0127e4d97794e.mp3'
    assert digest(reference) == '53b39d6e1dfffd259c0ab99c848e96670dee5ab803bf86d8682a587c1093ec12'
    ref_text = 'أَلْبَسُ جَوْرَبًا نَظِيفًا قَبْلَ الْحِذَاءِ.'
    try:
        for task in pending:
            try:
                print('Full phrase', task['id'], task['gender'], task['text'], flush=True)
                target = OUT / task['path']
                target.parent.mkdir(parents=True, exist_ok=True)
                with tempfile.TemporaryDirectory(prefix='full-praise-') as work:
                    wavfile = pathlib.Path(work) / 'phrase.wav'
                    name_id = 0 if task['id'] == 'generic' else int(task['id'][5:])
                    wav, sr, _ = engine.infer(ref_file=str(reference), ref_text=ref_text,
                        gen_text=task['text'], file_wave=str(wavfile), seed=6100 + name_id * 2 + (task['gender'] == 'f'),
                        speed=.95, nfe_step=32, force_tashkeel=False, normalize_numbers=False)
                    assert np.isfinite(wav).all() and .3 < len(wav) / sr < 15
                    assert np.max(np.abs(wav)) > .005
                    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wavfile),
                        '-ar', '24000', '-ac', '1', '-codec:a', 'libmp3lame', '-b:a', '64k', str(target)], check=True)
                    subprocess.run(['ffmpeg', '-v', 'error', '-i', str(target), '-f', 'null', '-'], check=True)
                a = {**task, 'revision': REVISION, 'sha256': digest(target),
                     'duration_ms': round(len(wav) / sr * 1000), 'engine': 'silma-tts-1.0.5',
                     'model_revision': '226dd7a65cadf51f9a6dbe3953fc89003b3844d5',
                     'auditory_review': 'pending', 'reference_sha256': digest(reference)}
                report['records'].append({'id': task['id'], 'audio': a})
            except Exception as error:
                report['failures'].append({'id': task['id'], 'gender': task['gender'], 'error': type(error).__name__})
                print('Needs retry:', task['id'], task['gender'], type(error).__name__, flush=True)
            checkpoint()
    finally:
        checkpoint()
    if report['failures']:
        raise RuntimeError('Partial results saved; retry failed complete phrases')


if __name__ == '__main__':
    main()
