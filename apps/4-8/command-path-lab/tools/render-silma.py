"""Render authored game strings locally with SILMA TTS 1.0.5.

Requires the official silma-tts Python package, PyTorch, soundfile with MP3 support,
and a directory with SILMA inference.safetensors, vocab.txt and vocoder/.
The input is a JSON array of path/text/language records. The output directory
stages verified files before they replace the game's recordings.
"""
import argparse
import hashlib
from importlib.resources import files
import json
import os
from pathlib import Path
import sys
import types

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--model-directory', type=Path, required=True)
parser.add_argument('--input', type=Path, required=True)
parser.add_argument('--output', type=Path, required=True)
args = parser.parse_args()
model_dir = args.model_directory.resolve()
output = args.output.resolve()
output.mkdir(parents=True, exist_ok=True)
os.environ.update(HF_HUB_OFFLINE='1', TRANSFORMERS_OFFLINE='1', HF_HUB_DISABLE_TELEMETRY='1',
                  ORT_DISABLE_TELEMETRY='1', MPLCONFIGDIR=str(output / 'matplotlib'))

# The script contains the teaching vowels. The local inference build neither
# normalizes the text nor needs the optional diacritization service.
class AuthoredText:
    def __init__(self, *_args, **_kwargs):
        raise RuntimeError('Supply authored game text.')

for name in ('nemo_text_processing', 'nemo_text_processing.text_normalization',
             'nemo_text_processing.text_normalization.normalize', 'catt_tashkeel'):
    sys.modules[name] = types.ModuleType(name)
sys.modules['nemo_text_processing.text_normalization.normalize'].Normalizer = AuthoredText
sys.modules['catt_tashkeel'].CATTEncoderOnly = AuthoredText

import numpy as np
import soundfile as sf
import torch
import torchaudio
import silma_tts.api as api
from silma_tts.infer import utils_infer

torch.set_num_threads(5)
utils_infer.text_has_tashkeel = lambda _text: False


def read_audio(filename, *_args, **_kwargs):
    data, rate = sf.read(filename, dtype='float32', always_2d=True)
    return torch.from_numpy(data.T.copy()), rate


def checkpoint(url, **_kwargs):
    if url.endswith('/model.pt'):
        return str(model_dir / 'inference.safetensors')
    if url.endswith('/vocab.txt'):
        return str(model_dir / 'vocab.txt')
    raise ValueError('Unknown checkpoint: ' + url)


def sha(data):
    return hashlib.sha256(data).hexdigest()


source = json.loads(args.input.read_text(encoding='utf-8-sig'))
items = source['items'] if isinstance(source, dict) else source
reference = str(files('silma_tts').joinpath('infer/ref_audio_samples/ar.ref.24k.wav'))
reference_text = 'ويدقق النظر في القرآن الكريم وسائر الكتب السماوية ويتبع مسالك الرسل العظام عليهم الصلاة والسلام.'
device = 'cuda' if torch.cuda.is_available() else 'cpu'
model_revision = (model_dir / 'revision.txt').read_text().strip()
print('SILMA model', model_revision, 'device', device, 'clips', len(items), flush=True)
api.cached_path = checkpoint
torchaudio.load = read_audio
engine = api.SilmaTTS(device=device, use_ema=False, enable_normalizer=False, force_tashkeel=False,
                     vocoder_local_path=str(model_dir / 'vocoder'))
cache = output / 'takes'
cache.mkdir(exist_ok=True)
report_file = output / 'recordings.json'
report = json.loads(report_file.read_text()) if report_file.exists() else {}
for index, item in enumerate(items, 1):
    relative = Path(item['path'])
    if relative.is_absolute() or '..' in relative.parts or relative.suffix != '.mp3':
        raise ValueError('Invalid clip path')
    target = output / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    script = item['text']
    key = sha((model_revision + '|360|16|.97|' + item['language'] + '|' + script).encode())
    mp3 = cache / (key + '.mp3')
    spoken = cache / (key + '.wav')
    if not mp3.exists():
        if spoken.exists():
            pcm, rate = sf.read(spoken, dtype='float32')
        else:
            with torch.inference_mode():
                pcm, rate, _ = engine.infer(ref_file=reference, ref_text=reference_text, gen_text=script,
                    seed=360, speed=.97, nfe_step=16, force_tashkeel=False, normalize_numbers=False,
                    show_info=lambda _value: None)
            pcm = np.asarray(pcm, dtype=np.float32)
        if rate != 24000 or not np.isfinite(pcm).all() or not (.22 < len(pcm) / rate < 35):
            raise ValueError('Invalid audio for ' + str(relative))
        sf.write(spoken, pcm, rate)
        converted = cache / (key + '.partial.mp3')
        active = pcm[np.abs(pcm) > .009]
        if not len(active):
            raise ValueError('Silent audio for ' + str(relative))
        gain = min(.11 / np.sqrt(np.mean(active ** 2)), .82 / np.max(np.abs(pcm)))
        sf.write(converted, pcm * gain, rate, format='MP3', compression_level=.35)
        converted.replace(mp3)
    enc = mp3.read_bytes()
    target.write_bytes(enc)
    report[item['path']] = dict(language=item['language'], text_sha256=sha(script.encode()), sha256=sha(enc),
                                take=key, duration_ms=round(sf.info(spoken).duration * 1000))
    next_report = report_file.with_suffix('.tmp')
    next_report.write_text(json.dumps(report), encoding='utf-8')
    next_report.replace(report_file)
    print(f'{index}/{len(items)} {relative}', flush=True)
