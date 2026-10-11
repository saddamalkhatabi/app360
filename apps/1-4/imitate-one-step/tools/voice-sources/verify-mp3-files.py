"""Decode every runtime recording and reject missing, silent, or invalid audio."""
import json,pathlib,subprocess,numpy as np
from concurrent.futures import ThreadPoolExecutor
app=pathlib.Path(__file__).resolve().parents[2];manifest=json.loads((app/'audio/manifest.json').read_text())
paths=[v['path'] for clip in manifest['clips'].values() for v in clip.values()]
def check(relative):
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(app/relative),'-ac','1','-ar','16000','-f','f32le','-']);samples=np.frombuffer(raw,dtype=np.float32);assert len(samples)>2560,relative;assert np.isfinite(samples).all(),relative;rms=float(np.sqrt(np.mean(samples*samples)));assert rms>.001,('Silent audio',relative,rms)
 return {'path':relative,'decoded_seconds':round(len(samples)/16000,3),'rms':round(rms,5),'peak':round(float(np.max(np.abs(samples))),5)}
with ThreadPoolExecutor(max_workers=8) as pool:rows=list(pool.map(check,paths))
assert len(rows)==516
(pathlib.Path(__file__).parent/'mp3-decode-report.json').write_text(json.dumps({'files':len(rows),'all_decoded':True,'all_non_silent':True,'rows':rows},ensure_ascii=False,indent=2)+'\n')
print('Decoded and checked',len(rows),'non-silent MP3 recordings')
