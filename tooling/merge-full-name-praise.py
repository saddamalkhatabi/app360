"""Merge only matching current texts/IDs; never convert technical QA to listening approval."""
import argparse
import json
import pathlib
import shutil
import subprocess
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
    merge(args.incoming)
