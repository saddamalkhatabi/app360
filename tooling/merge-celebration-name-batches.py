"""Merge verified shard audio into a fresh main checkout, preserving current reviews."""
import argparse
import json
import pathlib
import shutil
from celebration_name_batches import digest, recorded, shard_rows, write_json


def merge(root, incoming, expected):
    root, incoming = pathlib.Path(root), pathlib.Path(incoming)
    manifest = root / 'names.json'
    catalog = json.loads(manifest.read_text())
    by_id = {r['id']: r for r in catalog['records']}
    seen, seen_ids, updated = set(), set(), 0
    # Validate every incoming entry before mutating the catalog or copying any media.
    accepted = []
    for report_path in sorted((incoming / 'reports').glob('shard-*.json')):
        report = json.loads(report_path.read_text())
        index = report['shard_index']
        if report['shard_count'] != expected or index in seen:
            raise ValueError('Mismatched or duplicate shard report')
        allowed = {r['id'] for r in shard_rows(catalog['records'], index, expected)}
        seen.add(index)
        for row in report['records']:
            if row['id'] not in allowed or row['id'] in seen_ids:
                raise ValueError('Duplicate or misplaced name')
            seen_ids.add(row['id'])
            current = by_id[row['id']]
            if current['spoken_text'] != row['spoken_text']:
                raise ValueError('Name text changed while recording: ' + row['id'])
            if not recorded(row, incoming):
                raise ValueError('Missing or corrupt shard recording: ' + row['id'])
            if not .2 <= row['audio']['duration_ms'] / 1000 <= 8:
                raise ValueError('Invalid audio duration')
            accepted.append((current, row))
    for current, incoming_row in accepted:
        if recorded(current, root):
            # Keep the current reviewed bytes. Never replace them with an older job.
            continue
        audio = dict(incoming_row['audio'])
        audio.pop('review', None)
        audio.pop('review_history', None)
        audio['auditory_review'] = 'pending'
        destination = root / audio['path']
        destination.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(incoming / audio['path'], destination)
        current['audio'] = audio
        current['status'] = 'recorded-awaiting-listening-review'
        updated += 1
    valid = sum(recorded(r, root) for r in catalog['records'])
    catalog['complete'] = valid == len(catalog['records'])
    catalog['recording_progress'] = {'recorded': valid, 'total': len(catalog['records']),
        'pending': len(catalog['records']) - valid, 'received_shards': len(seen), 'expected_shards': expected}
    write_json(manifest, catalog)
    return {'updated': updated, **catalog['recording_progress']}


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--incoming', required=True)
    parser.add_argument('--expected-shards', type=int, default=20)
    args = parser.parse_args()
    print(json.dumps(merge(pathlib.Path(__file__).resolve().parents[1] / 'resources/celebration-audio', args.incoming, args.expected_shards)))
