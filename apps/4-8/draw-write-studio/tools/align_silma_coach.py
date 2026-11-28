"""Get word timings from rendered SILMA MP3s with a cached MMS_FA checkpoint."""
import argparse
import hashlib
import json
import re
import time
import unicodedata
from pathlib import Path

import soundfile as sf
import torch
import torchaudio
from uroman import Uroman

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--plan', type=Path, required=True)
parser.add_argument('--scratch', type=Path, required=True)
parser.add_argument('--language', choices=['ar','en'])
parser.add_argument('--wait', action='store_true')
args = parser.parse_args()
app = Path(__file__).resolve().parents[1]
cache = args.scratch.resolve()
assert (cache / 'checkpoints' / 'model.pt').stat().st_size > 1_000_000_000
torch.hub.set_dir(str(cache))
torch.set_num_threads(6)
bundle = torchaudio.pipelines.MMS_FA
network = bundle.get_model().eval()
romanizer, tokenizer, aligner = Uroman(), bundle.get_tokenizer(), bundle.get_aligner()

def roman(word):
    letters = ''.join(c for c in unicodedata.normalize('NFKD', word) if not unicodedata.combining(c))
    return re.sub('[^a-z]', '', romanizer.romanize_string(letters).lower())

rows = json.loads(args.plan.read_text(encoding='utf-8'))
for row in (row for row in rows if not args.language or row['language'] == args.language):
    audio = app / row['path']
    metadata = cache / (row['id'] + '.json')
    until = time.monotonic() + 180
    while True:
        if metadata.exists():
            try:
                entry = json.loads(metadata.read_text(encoding='utf-8'))
                if entry['engine'] == 'silma-tts-1.0.5':
                    break
            except (json.JSONDecodeError, KeyError):
                pass
        if not args.wait or time.monotonic() >= until:
            raise RuntimeError('SILMA output unavailable for ' + row['id'])
        time.sleep(2)
    target = cache / (row['id'] + '.mms.json')
    sha = hashlib.sha256(audio.read_bytes()).hexdigest()
    assert sha == entry['sha256'], row['id']
    if target.exists() and json.loads(target.read_text(encoding='utf-8')).get('audio_sha256') == sha:
        continue
    duration = entry['duration_ms']
    record = {'text':row['text'], 'language':row['language'], 'duration':duration, 'cues':[], 'timing_source':'sentence', 'audio_sha256':sha}
    labels = [roman(word) for word in row['text'].split()]
    try:
        if not all(labels):
            raise ValueError('Punctuation has no spoken label')
        samples, rate = sf.read(audio, dtype='float32')
        wave = torchaudio.functional.resample(torch.from_numpy(samples).unsqueeze(0), rate, bundle.sample_rate)
        with torch.inference_mode():
            emission, _ = network(wave)
        spans = aligner(emission[0], tokenizer(labels))
        frame_ms = wave.shape[-1] / emission.shape[1] / bundle.sample_rate * 1000
        scores = [float(token.score) for span in spans for token in span]
        confidence = sum(scores) / len(scores)
        cues = [[i, round(span[0].start*frame_ms), min(duration, round(span[-1].end*frame_ms))]
                for i, span in enumerate(spans)]
        if confidence >= .2 and len(cues) == len(labels) and all(0 <= a < b <= duration for _, a, b in cues):
            record.update(cues=cues, timing_source='MMS_FA')
        record['alignment_score'] = round(confidence, 3)
    except (RuntimeError, ValueError, IndexError, ZeroDivisionError) as failure:
        print(row['id'], 'sentence timing', str(failure), flush=True)
    target.write_text(json.dumps(record,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    print(row['id'], record['timing_source'], record.get('alignment_score'), flush=True)
