"""Resumable, name-bound complete SILMA phrases. No inference on import."""
import json
import pathlib
from celebration_name_batches import digest, shard_rows, write_json

REVISION = 'full-dear-praise-v1'
PREFIX = {'f': 'أَحْسَنْتِ يَا عَزِيزَتِي', 'm': 'أَحْسَنْتَ يَا عَزِيزِي'}


def tasks(catalog, index=0, count=1):
    result = []
    for row in shard_rows(catalog['records'], index, count):
        for gender in ('f', 'm'):
            result.append({'id': row['id'], 'gender': gender,
                           'path': 'audio/praise/' + row['id'] + '-' + gender + '.mp3',
                           'text': PREFIX[gender] + ' ' + row['spoken_text'],
                           'kind': 'full-praise'})
    if index == 0:
        for gender in ('f', 'm'):
            result.append({'id': 'generic', 'gender': gender,
                           'path': 'audio/ar/well-done-dear-' + gender + '.mp3',
                           'text': PREFIX[gender], 'kind': 'generic'})
    return result


def metadata(task, catalog, generic):
    if task['id'] == 'generic':
        return generic.get(task['gender'])
    row = next((r for r in catalog['records'] if r['id'] == task['id']), None)
    return row and row.get('praise_audio', {}).get(task['gender'])


def valid(task, audio, root):
    if not isinstance(audio, dict):
        return False
    return (all(audio.get(k) == task[k] for k in ('path', 'text', 'kind', 'gender'))
            and audio.get('revision') == REVISION
            and 200 <= audio.get('duration_ms', 0) <= 15000
            and (pathlib.Path(root) / task['path']).is_file()
            and digest(pathlib.Path(root) / task['path']) == audio.get('sha256'))


def generic_catalog(root):
    p = pathlib.Path(root) / 'full-praise-generics.json'
    return json.loads(p.read_text()) if p.exists() else {}


def progress(catalog, generic, root):
    all_tasks = tasks(catalog)
    count = sum(valid(t, metadata(t, catalog, generic), root) for t in all_tasks)
    return {'revision': REVISION, 'names': len(catalog['records']),
            'required_clips': len(all_tasks), 'recorded': count,
            'pending': len(all_tasks) - count, 'complete': count == len(all_tasks)}
