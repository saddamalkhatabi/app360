"""Merge only matching current texts/IDs; never convert technical QA to listening approval."""
import argparse
import json
import os
import pathlib
import shutil
import subprocess
import sys
from full_praise_batches import tasks, metadata, valid, generic_catalog, progress, REVISION
from celebration_name_batches import write_json

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / 'resources/celebration-audio'


def merge(incoming, out=OUT):
    catalog = json.loads((out / 'names.json').read_text())
    generic = generic_catalog(out)
    expected = {(t['id'], t['gender']): t for t in tasks(catalog)}
    rows = {r['id']: r for r in catalog['records']}
    accepted, skipped = 0, 0
    for report in sorted(pathlib.Path(incoming).glob('reports/shard-*.json')):
        data = json.loads(report.read_text())
        if data.get('revision') != REVISION:
            raise ValueError('Unexpected recording revision')
        for record in data['records']:
            audio = record['audio']
            task = expected.get((record['id'], audio.get('gender')))
            if not task or not valid(task, audio, incoming):
                skipped += 1
                continue
            if valid(task, metadata(task, catalog, generic), out):
                # Preserve existing bytes and exact listening review on retries.
                continue
            source = pathlib.Path(incoming) / task['path']
            subprocess.run(['ffmpeg', '-v', 'error', '-i', str(source), '-f', 'null', '-'], check=True)
            audio = dict(audio)
            audio['auditory_review'] = 'pending'
            audio.pop('review', None)
            audio.pop('review_history', None)
            target = out / task['path']
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(source, target)
            if task['id'] == 'generic':
                generic[task['gender']] = audio
            else:
                rows[task['id']].setdefault('praise_audio', {})[task['gender']] = audio
            accepted += 1
    catalog['full_praise_progress'] = progress(catalog, generic, out)
    write_json(out / 'names.json', catalog)
    write_json(out / 'full-praise-generics.json', generic)
    print(json.dumps({'accepted': accepted, 'skipped_stale': skipped, **catalog['full_praise_progress']}))
    return catalog['full_praise_progress']


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--incoming', required=True)
    args = parser.parse_args()
    state = merge(args.incoming)
    # The already-running workflow checks out the latest working branch in its
    # publish job. Stage the generated offline indexes together with the media.
    # Never stage files during local review/tests or an incomplete recording run.
    if state['complete'] and os.environ.get('GITHUB_ACTIONS') == 'true' and os.environ.get('GITHUB_JOB') == 'publish':
        for command in [
            [sys.executable, 'tooling/test_full_praise_batches.py'],
            ['node', 'tooling/refresh-full-praise-offline.cjs'],
            ['node', 'tooling/refresh-reels-offline.js'],
            ['node', 'tooling/refresh-reels-offline.js', '--check'],
            ['node', '--test', 'tooling/test-unified-offline.cjs', 'tooling/test-connected-praise.cjs',
             'tooling/test-personalized-celebration.cjs', 'tooling/test-teacher-encouragement.cjs'],
        ]:
            subprocess.run(command, cwd=ROOT, check=True)
        subprocess.run(['git', 'add', 'data/offline', 'data/offline-catalog.json',
                        'resources/celebration-audio/phrases.json',
                        'resources/celebration-audio/manifest-v1.js',
                        'resources/celebration-audio/pcm-v1.js'], cwd=ROOT, check=True)
