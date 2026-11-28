"""Render public curriculum clips with the pinned Arabic voice profile."""
import argparse
import hashlib
from importlib.resources import files
import inspect
import json
import os
from pathlib import Path
import socket
import subprocess
import sys
import tempfile
import types


def sha(data):
    return hashlib.sha256(data).hexdigest()


def run(args):
    plan = json.loads(args.plan.read_text(encoding='utf-8'))
    profile = plan['profile']
    weights = args.weights.resolve()
    if (weights / 'revision.txt').read_text().strip() != profile['model_revision']:
        raise ValueError('The local weights do not match the voice profile')

    os.environ.update(HF_HUB_OFFLINE='1', TRANSFORMERS_OFFLINE='1',
                      HF_HUB_DISABLE_TELEMETRY='1', ORT_DISABLE_TELEMETRY='1')
    connect = socket.socket.connect

    def local_only(sock, address):
        if sock.family in (socket.AF_INET, socket.AF_INET6):
            raise RuntimeError('Public voice inference only uses local weights')
        return connect(sock, address)

    socket.socket.connect = local_only
    for name in ('nemo_text_processing', 'nemo_text_processing.text_normalization',
                 'nemo_text_processing.text_normalization.normalize', 'catt_tashkeel'):
        sys.modules[name] = types.ModuleType(name)

    class AuthoredTextOnly:
        def __init__(self, *_args, **_kwargs):
            raise RuntimeError('Record approved public text with authored Arabic diacritics')

    sys.modules['nemo_text_processing.text_normalization.normalize'].Normalizer = AuthoredTextOnly
    sys.modules['catt_tashkeel'].CATTEncoderOnly = AuthoredTextOnly

    import numpy as np
    import soundfile as sf
    import torch
    import torchaudio
    import silma_tts.api as api

    torch.set_num_threads(4)
    device = 'cuda' if args.device == 'auto' and torch.cuda.is_available() else args.device
    if device == 'auto':
        device = 'cpu'
    checkpoint = weights / 'inference.safetensors'
    if not checkpoint.is_file():
        checkpoint = weights / 'model.pt'

    def load_audio(path, *_args, **_kwargs):
        data, rate = sf.read(path, dtype='float32', always_2d=True)
        return torch.from_numpy(data.T.copy()), rate

    def local_weights(url, **_kwargs):
        if url.endswith('/model.pt'):
            return str(checkpoint)
        if url.endswith('/vocab.txt'):
            return str(weights / 'vocab.txt')
        raise ValueError(f'Unexpected weight request {url}')

    torchaudio.load = load_audio
    api.cached_path = local_weights
    if device == 'cuda':
        load = api.load_model

        def load_on_cuda(*arguments, **options):
            parameters = inspect.signature(load).bind(*arguments, **options)
            parameters.arguments['device'] = 'cpu'
            return load(*parameters.args, **parameters.kwargs).half().to(device)

        api.load_model = load_on_cuda

    reference = profile['reference']
    reference_path = (args.plan.parent / reference['file']).resolve() if 'file' in reference else Path(
        str(files('silma_tts').joinpath('infer/ref_audio_samples/ar.ref.24k.wav')))
    reference_hash = sha(reference_path.read_bytes())
    if reference_hash != reference['sha256']:
        raise ValueError('The audio reference does not match the voice profile')
    engine = api.SilmaTTS(device=device, use_ema=checkpoint.suffix == '.pt',
                          enable_normalizer=False, force_tashkeel=False,
                          vocoder_local_path=str(weights / 'vocoder'))
    prepared, _ = api.preprocess_ref_audio_text(str(reference_path), reference['text'])
    reference_duration = sf.info(prepared).duration
    args.output.mkdir(parents=True, exist_ok=True)
    args.cache.mkdir(parents=True, exist_ok=True)
    results = []

    with tempfile.TemporaryDirectory(dir=args.cache) as scratch:
        wav = Path(scratch) / 'render.wav'
        encoded = Path(scratch) / 'render.mp3'
        for clip in plan['clips']:
            kwargs = dict(ref_file=str(reference_path), ref_text=reference['text'], gen_text=clip['text'],
                          seed=profile['seed'], speed=profile['speed'], nfe_step=profile['steps'],
                          force_tashkeel=False, normalize_numbers=False, show_info=lambda _: None)
            key = sha(json.dumps([profile, clip['text'], clip.get('seconds')], ensure_ascii=False, sort_keys=True).encode())
            cached = args.cache / f'{key}.mp3'
            if not cached.exists():
                forced = clip.get('seconds')
                with torch.inference_mode():
                    samples, rate, _ = engine.infer(**kwargs, fix_duration=reference_duration + forced if forced else None)
                    if not len(samples) or len(samples) / rate < .15 or np.max(np.abs(samples)) <= .005:
                        samples, rate, _ = engine.infer(**kwargs, fix_duration=reference_duration + .65)
                if rate != 24000 or not .15 <= len(samples) / rate < 60 or not np.isfinite(samples).all() or np.max(np.abs(samples)) <= .005:
                    raise ValueError(f'Invalid audio for {clip["path"]}')
                sf.write(wav, np.pad(samples, (0, 2400)), rate)
                subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(wav),
                                '-af', 'loudnorm=I=-19:TP=-1.5:LRA=7', '-ar', '24000', '-ac', '1',
                                '-b:a', '48k', str(encoded)], check=True)
                encoded.replace(cached)
            duration = subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                                                '-of', 'default=nw=1:nk=1', str(cached)])
            data = cached.read_bytes()
            dest = (args.output / clip['path']).resolve()
            if not dest.is_relative_to(args.output.resolve()) or dest.suffix != '.mp3':
                raise ValueError('Invalid managed MP3 path')
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(data)
            results.append(dict(clip, sha256=sha(data), duration_ms=round(float(duration) * 1000)))
            print(f'{len(results)}/{len(plan["clips"])} {clip["path"]}', flush=True)
    (args.output / 'voice-build.json').write_text(json.dumps({'profile': profile, 'clips': results},
                                                            ensure_ascii=False, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--plan', type=Path, required=True)
    parser.add_argument('--weights', type=Path, required=True)
    parser.add_argument('--output', type=Path, required=True)
    parser.add_argument('--cache', type=Path, required=True)
    parser.add_argument('--device', choices=['auto', 'cpu', 'cuda'], default='auto')
    run(parser.parse_args())
