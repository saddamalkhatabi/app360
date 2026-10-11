"""Independent recognition spot-check; transcripts are evidence, not a pronunciation guarantee."""
import pathlib,json,re,sys,subprocess
import numpy as np
from faster_whisper import WhisperModel
root=pathlib.Path(__file__).resolve().parents[1]
manifest=json.loads((root/'audio/manifest.json').read_text())
keys=list(dict.fromkeys([manifest['shared'][k] for k in ['welcome','choice','path','dots','draw','correct','wrong']]+[g['prompt'] for g in list(manifest['games'].values())[:4]]+[manifest['lookup'][k] for k in ['مثلث صغير','دائرة حمراء صغيرة','قرد','أسفل اليمين','متوازي أضلاع','كرسي متحرك']]+[k for k,v in manifest['clips'].items() if re.search(r'[0-9]',v['ar']['text'])]))
model=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=2,download_root=sys.argv[1] if len(sys.argv)>1 else None)
results=[]
for k in keys:
    clip=manifest['clips'][k]['ar']
    samples=np.frombuffer(subprocess.check_output(['ffmpeg','-v','error','-i',str(root/clip['path']),'-ar','16000','-ac','1','-f','f32le','-']),dtype=np.float32)
    segments,info=model.transcribe(samples,language='ar',beam_size=5,vad_filter=False)
    text=' '.join(s.text.strip() for s in segments)
    row={'key':k,'text':clip['text'],'spoken_text':clip.get('spoken_text',clip['text']),'transcript':text,'language_probability':round(info.language_probability,4)}
    results.append(row);print(json.dumps(row,ensure_ascii=False),flush=True)
(root/'audio/validation-samples.json').write_text(json.dumps({'method':'faster-whisper small CPU int8, independent Arabic transcription spot-check; manual review required','clips':results},ensure_ascii=False,indent=2)+'\n')
