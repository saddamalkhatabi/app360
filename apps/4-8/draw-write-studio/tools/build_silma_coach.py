"""Render authored prompts with local bilingual SILMA weights and the public demo reference."""
import argparse
import hashlib
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import types
from importlib.resources import files

parser = argparse.ArgumentParser(description=__doc__)
parser.add_argument('--plan', type=Path, required=True)
parser.add_argument('--model-dir', type=Path, required=True)
parser.add_argument('--scratch', type=Path, required=True)
parser.add_argument('--only', action='append', default=[])
parser.add_argument('--device', choices=['cpu', 'cuda'])
parser.add_argument('--language', choices=['ar', 'en'])
parser.add_argument('--seed', type=int, default=360)
parser.add_argument('--reference-id')
parser.add_argument('--seconds', type=float, help='Target length for a short utterance')
args = parser.parse_args()
app = Path(__file__).resolve().parents[1]
model = args.model_dir.resolve()
scratch = args.scratch.resolve()
scratch.mkdir(parents=True, exist_ok=True)
os.environ.update(HF_HUB_OFFLINE='1', TRANSFORMERS_OFFLINE='1', MPLCONFIGDIR=str(scratch / 'matplotlib'), ORT_DISABLE_TELEMETRY='1')

native_connect = socket.socket.connect
def local_connect(sock, address):
    if sock.family in (socket.AF_INET, socket.AF_INET6):
        raise RuntimeError('SILMA builds use local public weights')
    return native_connect(sock, address)
socket.socket.connect = local_connect

for name in ['nemo_text_processing', 'nemo_text_processing.text_normalization',
             'nemo_text_processing.text_normalization.normalize', 'catt_tashkeel']:
    sys.modules[name] = types.ModuleType(name)
class AuthoredOnly:
    def __init__(self, *unused, **options):
        raise RuntimeError('Use authored Arabic text')
sys.modules['nemo_text_processing.text_normalization.normalize'].Normalizer = AuthoredOnly
sys.modules['catt_tashkeel'].CATTEncoderOnly = AuthoredOnly

import numpy as np
import soundfile as sf
import torch
import torchaudio
import silma_tts.api as api

torch.set_num_threads(6)
device = args.device or ('cuda' if torch.cuda.is_available() else 'cpu')
revision = (model / 'revision.txt').read_text().strip()
def load_audio(path, *unused, **options):
    data, rate = sf.read(path, dtype='float32', always_2d=True)
    return torch.from_numpy(data.T.copy()), rate
torchaudio.load = load_audio

def local_weights(url, **options):
    if url.endswith('/model.pt'):
        return str(model / 'inference.safetensors')
    if url.endswith('/vocab.txt'):
        return str(model / 'vocab.txt')
    raise RuntimeError('Unknown SILMA asset ' + url)
api.cached_path = local_weights

def sha(data):
    return hashlib.sha256(data).hexdigest()

plan = json.loads(args.plan.read_text(encoding='utf-8'))
rows = [row for row in plan if (not args.language or row['language'] == args.language) and (not args.only or row['id'] in args.only)]
assert rows and (not args.seconds or .2 <= args.seconds <= 2)
voice = None
reference = str(files('silma_tts').joinpath('infer/ref_audio_samples/ar.ref.24k.wav'))
reference_text = 'ويدقق النظر في القرآن الكريم وسائر الكتب السماوية ويتبع مسالك الرسل العظام عليهم الصلاة والسلام.'
reference_label = 'SILMA public Arabic demonstration voice'
reference_key = ''
if args.reference_id:
    source = next(row for row in plan if row['id'] == args.reference_id)
    source_meta = json.loads((scratch / (args.reference_id + '.json')).read_text(encoding='utf-8'))
    reference = str(app / source['path'])
    reference_key = sha(Path(reference).read_bytes())
    assert source_meta['engine'] == 'silma-tts-1.0.5' and source_meta['sha256'] == reference_key
    reference_text = source['text']
    reference_label = 'SILMA clip ' + args.reference_id + ' from the public demonstration voice'
for i, row in enumerate(rows):
    text = row['text']
    text_hash = sha(text.encode('utf-8'))
    cache_settings = f'|{args.seconds}|{reference_key}' if args.seconds or args.reference_id else ''
    key = sha((revision + f'|{args.seed}|16|.97|' + text + cache_settings).encode('utf-8'))
    wav, mp3 = scratch / (key + '.wav'), scratch / (key + '.mp3')
    if not mp3.exists():
        if voice is None:
            voice = api.SilmaTTS(device=device, use_ema=False, enable_normalizer=False,
                                 force_tashkeel=False, vocoder_local_path=str(model / 'vocoder'))
        fixed = None
        if args.seconds:
            prepared, _ = api.preprocess_ref_audio_text(reference, reference_text)
            fixed = sf.info(prepared).duration + args.seconds
        with torch.inference_mode():
            samples, rate, _ = voice.infer(ref_file=reference, ref_text=reference_text, gen_text=text,
                                           seed=args.seed, speed=.97, fix_duration=fixed, nfe_step=16, force_tashkeel=False,
                                           normalize_numbers=False, show_info=lambda _: None)
            if len(samples)/rate < .15 or not len(samples) or np.max(np.abs(samples)) <= .005:
                prepared, _ = api.preprocess_ref_audio_text(reference, reference_text)
                # Isolated short words can get too few output frames with the default length heuristic.
                samples, rate, _ = voice.infer(ref_file=reference, ref_text=reference_text, gen_text=text,
                                               seed=args.seed, speed=.97, fix_duration=sf.info(prepared).duration + .62,
                                               nfe_step=16, force_tashkeel=False, normalize_numbers=False, show_info=lambda _: None)
        pcm = np.asarray(samples)
        assert rate == 24000 and np.isfinite(pcm).all() and .15 <= len(pcm)/rate < 25, row['id']
        assert np.max(np.abs(pcm)) > .005, row['id']
        sf.write(wav, np.pad(pcm, (0, 4800)), rate)
        temporary = scratch / (key + '.tmp.mp3')
        subprocess.run(['ffmpeg','-v','error','-y','-i',str(wav),'-af','loudnorm=I=-19:TP=-1.5:LRA=7',
                        '-ar','24000','-ac','1','-b:a','48k',str(temporary)], check=True)
        temporary.replace(mp3)
    audio = mp3.read_bytes()
    duration = round(float(subprocess.check_output(['ffprobe','-v','error','-show_entries','format=duration',
                     '-of','default=nw=1:nk=1',str(mp3)]).strip()) * 1000)
    target = app / row['path']
    assert target.is_relative_to(app / 'audio')
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(audio)
    item = dict(row, engine='silma-tts-1.0.5', model_revision=revision, reference=reference_label,
                text_sha256=text_hash, sha256=sha(audio), duration_ms=duration, seed=args.seed)
    if args.seconds:
        item['target_seconds'] = args.seconds
    (scratch / (row['id'] + '.json')).write_text(json.dumps(item,ensure_ascii=False)+'\n',encoding='utf-8')
    print(f'{i+1}/{len(rows)} {row["id"]} {duration} ms {device}', flush=True)
