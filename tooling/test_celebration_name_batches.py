"""Exercise disjoint work and fresh-catalog merge, without loading SILMA."""
import importlib.util
import json
import pathlib
import tempfile
import unittest
from celebration_name_batches import digest, recorded, shard_rows, write_json

spec = importlib.util.spec_from_file_location('name_merge', pathlib.Path(__file__).with_name('merge-celebration-name-batches.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class NameBatchTests(unittest.TestCase):
    def test_stable_disjoint_partitions_cover_catalog_once(self):
        root = pathlib.Path(__file__).resolve().parents[1] / 'resources/celebration-audio'
        rows = json.loads((root / 'names.json').read_text())['records']
        shards = [shard_rows(rows, i, 20) for i in range(20)]
        ids = [r['id'] for group in shards for r in group]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertEqual(set(ids), {r['id'] for r in rows})
        for i in range(20):
            self.assertEqual([r['id'] for r in shard_rows(list(reversed(rows)), i, 20)],
                             list(reversed([r['id'] for r in shards[i]])))
        for index, count in [(-1, 20), (20, 20), (0, 0)]:
            with self.assertRaises(ValueError): shard_rows(rows, index, count)

    def test_partial_merge_preserves_current_approved_bytes_and_rejects_stale_input(self):
        with tempfile.TemporaryDirectory() as work:
            root = pathlib.Path(work) / 'catalog'
            incoming = pathlib.Path(work) / 'incoming'
            def clip(base, text, payload):
                path = base / 'audio/names/name-1.mp3'
                path.parent.mkdir(parents=True, exist_ok=True)
                path.write_bytes(payload)
                return {'id': 'name-1', 'name': 'نور', 'spoken_text': text, 'audio': {
                    'path': 'audio/names/name-1.mp3', 'text': text, 'sha256': digest(path),
                    'duration_ms': 800, 'auditory_review': 'approved', 'review': {'sha256': digest(path)}}}
            current = clip(root, 'نُور', b'current-reviewed-recording')
            old = clip(incoming, 'نُور', b'older-job-recording')
            write_json(root / 'names.json', {'records': [current, {'id': 'name-2', 'name': 'آدم', 'spoken_text': 'آدَم', 'audio': None}]})
            report = {'shard_index': 0, 'shard_count': 2, 'records': [old]}
            write_json(incoming / 'reports/shard-0.json', report)
            result = module.merge(root, incoming, 2)
            self.assertEqual(result['updated'], 0)
            self.assertEqual(result['pending'], 1)
            merged = json.loads((root / 'names.json').read_text())
            self.assertFalse(merged['complete'])
            self.assertEqual(merged['records'][0]['audio'], current['audio'])
            self.assertTrue(recorded(current, root))
            # Newly imported recordings never inherit approval from a worker.
            current['audio'] = None
            write_json(root / 'names.json', {'records': [current]})
            module.merge(root, incoming, 2)
            row = json.loads((root / 'names.json').read_text())['records'][0]
            self.assertEqual(row['audio']['auditory_review'], 'pending')
            self.assertNotIn('review', row['audio'])
            old['spoken_text'] = 'changed'
            write_json(incoming / 'reports/shard-0.json', report)
            with self.assertRaises(ValueError): module.merge(root, incoming, 2)
            old['spoken_text'] = 'نُور'
            (incoming / old['audio']['path']).write_bytes(b'corrupt')
            write_json(incoming / 'reports/shard-0.json', report)
            with self.assertRaises(ValueError): module.merge(root, incoming, 2)


if __name__ == '__main__': unittest.main()
