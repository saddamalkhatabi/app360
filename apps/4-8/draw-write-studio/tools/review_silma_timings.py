"""Measure spoken word times for authored clips and flag uncertain matches for review."""
import argparse
import difflib
import hashlib
import json
import re
import time
import unicodedata
from pathlib import Path

from faster_whisper import WhisperModel

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--plan', type=Path, required=True)
parser.add_argument('--scratch', type=Path, required=True)
parser.add_argument('--model', type=Path, required=True)
parser.add_argument('--wait', action='store_true')
parser.add_argument('--language', choices=['ar','en'])
parser.add_argument('--only', action='append', default=[])
args = parser.parse_args()
app = Path(__file__).resolve().parents[1]
model = WhisperModel(str(args.model), device='cpu', compute_type='int8', cpu_threads=6, local_files_only=True)
rows = json.loads(args.plan.read_text(encoding='utf-8'))

def normal_word(text):
    text = ''.join(c for c in unicodedata.normalize('NFKD', text.lower()) if not unicodedata.combining(c))
    text = text.translate(str.maketrans('أإآٱىؤئةـ', 'اااايويه '))
    return re.sub(r'[^\w]', '', text)

def joined(parts):
    tokens, owners = [], []
    for i, word in enumerate(parts):
        word = normal_word(word)
        tokens.append(word)
        owners.extend([i] * len(word))
    return ''.join(tokens), owners

for row in (row for row in rows if (not args.language or row['language'] == args.language) and (not args.only or row['id'] in args.only)):
    audio = app / row['path']
    artifact = args.scratch / (row['id'] + '.json')
    timing = args.scratch / (row['id'] + '.timing.json')
    deadline = time.monotonic() + 180
    while args.wait and not artifact.exists() and time.monotonic() < deadline:
        time.sleep(2)
    entry = json.loads(artifact.read_text(encoding='utf-8'))
    assert hashlib.sha256(audio.read_bytes()).hexdigest() == entry['sha256'], row['id']
    if timing.exists() and json.loads(timing.read_text(encoding='utf-8')).get('audio_sha256') == entry['sha256']:
        continue
    segments, _ = model.transcribe(str(audio), language=row['language'], beam_size=4, condition_on_previous_text=False,
                                   word_timestamps=True, vad_filter=False, temperature=0)
    words = [word for segment in segments for word in (segment.words or []) if normal_word(word.word)]
    expected = row['text'].split()
    authored, positions = joined(expected)
    heard, boundaries = joined([word.word for word in words])
    match = difflib.SequenceMatcher(None, authored, heard, autojunk=False)
    recognized = {i: [] for i in range(len(expected))}
    for a, b, size in match.get_matching_blocks():
        for offset in range(size):
            recognized[positions[a+offset]].append(boundaries[b+offset])
    cues = []
    for i, chars in recognized.items():
        size = len(normal_word(expected[i]))
        if not size:
            continue
        if len(chars) < .8 * size:
            break
        first, last = words[min(chars)], words[max(chars)]
        if first.probability < .35 or last.probability < .35:
            break
        start = round(first.start * 1000)
        end = min(entry['duration_ms'], round(last.end * 1000))
        if end <= start or (cues and start < cues[-1][2]):
            break
        cues.append([i, start, end])
    if len(cues) != len(expected) or match.ratio() < .9:
        cues = []
    report = {'text': row['text'], 'language': row['language'], 'duration': entry['duration_ms'], 'cues': cues,
              'timing_source': 'measured-whisper-words' if cues else 'sentence', 'audio_sha256': entry['sha256'],
              'recognition': {'text': ' '.join(word.word.strip() for word in words), 'match': round(match.ratio(), 3)}}
    timing.write_text(json.dumps(report, ensure_ascii=False, separators=(',', ':'))+'\n', encoding='utf-8')
    print(row['id'], report['timing_source'], report['recognition']['match'], flush=True)
