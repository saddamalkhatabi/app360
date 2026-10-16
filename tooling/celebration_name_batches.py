"""Pure recording/catalog helpers; import without loading a speech model."""
import hashlib
import json
import pathlib
import re


def digest(path):
    return hashlib.sha256(pathlib.Path(path).read_bytes()).hexdigest()


def recorded(row, root):
    audio = row.get('audio') or {}
    relative = audio.get('path', '')
    if relative != 'audio/names/' + row['id'] + '.mp3':
        return False
    path = pathlib.Path(root) / relative
    return (path.is_file() and audio.get('text') == row['spoken_text']
            and digest(path) == audio.get('sha256'))


def shard_rows(rows, index, count):
    if not 1 <= count <= 40 or not 0 <= index < count:
        raise ValueError('Invalid recording shard')
    ids = [row['id'] for row in rows]
    if len(set(ids)) != len(ids) or any(not re.fullmatch(r'name-[1-9][0-9]*', v) for v in ids):
        raise ValueError('Invalid or duplicate canonical name IDs')
    # IDs remain stable when rows are re-ordered or new names are appended.
    return [row for row in rows if (int(row['id'][5:]) - 1) % count == index]


def write_json(path, value):
    path = pathlib.Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp = path.with_suffix(path.suffix + '.tmp')
    tmp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + '\n')
    tmp.replace(path)
