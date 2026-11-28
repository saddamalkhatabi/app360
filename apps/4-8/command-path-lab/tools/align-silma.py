"""Measure legacy read-along cues using the actual SILMA MP3 and its authored text."""
import argparse
import json
from pathlib import Path
import re
import unicodedata

import numpy as np
from faster_whisper import WhisperModel
from faster_whisper.audio import decode_audio, pad_or_trim
from faster_whisper.tokenizer import Tokenizer

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--model', required=True)
parser.add_argument('--input', type=Path, required=True)
parser.add_argument('--staging', type=Path, required=True)
parser.add_argument('--limit', type=int)
args = parser.parse_args()
engine = WhisperModel(args.model, device='cpu', compute_type='int8', cpu_threads=5, local_files_only=True)
output = args.staging / 'read-along.json'
items = [item for item in json.loads(args.input.read_text(encoding='utf-8-sig')) if item['path'].startswith('audio/')]
if args.limit:
    items = items[:args.limit]
tracks = json.loads(output.read_text(encoding='utf-8'))['items'] if output.exists() else {}
report = json.loads((args.staging / 'recordings.json').read_text(encoding='utf-8'))

for item in items:
    path = item['path']
    current = report.get(path)
    if not current or tracks.get(path, {}).get('audio_sha256') == current['sha256']:
        continue
    language = item['language']
    tokenizer = Tokenizer(engine.hf_tokenizer, engine.model.is_multilingual, task='transcribe', language=language)
    samples = decode_audio(str(args.staging / path), sampling_rate=16000)
    duration = round(len(samples) / 16)
    tokens, words = [], []
    for i, word in enumerate(re.findall(r'\S+', item['text'])):
        normalized = ''.join(c for c in word if not unicodedata.combining(c))
        start = len(tokens)
        tokens.extend(tokenizer.encode((' ' if tokens else '') + normalized))
        if any(c.isalnum() for c in word) and len(tokens) > start:
            words.append((i, start, len(tokens)))
    features = engine.feature_extractor(samples)
    frames = min(len(samples) // engine.feature_extractor.hop_length, 3000)
    encoded = engine.encode(pad_or_trim(features))
    aligned = engine.model.align(encoded, tokenizer.sot_sequence, [tokens], frames, median_filter_width=7)[0]
    boundaries = {}
    for token, frame in aligned.alignments:
        boundaries.setdefault(token, round(1000 * frame / engine.tokens_per_second))
    cues = []
    for index, start, end in words:
        a = min(duration, boundaries.get(start, duration))
        b = min(duration, boundaries.get(end, duration))
        if b > a:
            cues.append([index, a, b])
    tracks[path] = {'text': item['text'], 'language': language, 'duration': duration, 'cues': cues,
                    'audio_sha256': current['sha256'],
                    'confidence': round(float(np.mean(aligned.text_token_probs)), 4)}
    output.write_text(json.dumps({'schema_version': 1,
        'timing_source': 'Whisper acoustic alignment of the actual SILMA recording against the authored text',
        'items': tracks}, ensure_ascii=False, separators=(',', ':')) + '\n', encoding='utf-8')
    print(f'{path}: {len(cues)}/{len(words)} cues', flush=True)
