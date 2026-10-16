"""Measure word cues for the original AR/EN recordings without changing audio."""
import argparse, hashlib, json, os, pathlib, re, unicodedata
import numpy as np
import soundfile as sf
import torch, torchaudio
from uroman import Uroman

p=argparse.ArgumentParser();p.add_argument('--model-dir',required=True);p.add_argument('--checkpoint',required=True);a=p.parse_args()
root=pathlib.Path(__file__).resolve().parents[1]
torch.set_num_threads(4)
original=torch.load
def mapped(path,*args,**kw):
    if str(path).endswith('/model.pt'):kw['mmap']=True
    return original(path,*args,**kw)
torch.load=mapped
bundle=torchaudio.pipelines.MMS_FA
model=bundle.get_model(dl_kwargs={'model_dir':a.model_dir,'file_name':'model.pt'}).eval()
torch.load=original
tokenizer=bundle.get_tokenizer();aligner=bundle.get_aligner();roman=Uroman()
cp=pathlib.Path(a.checkpoint);result=json.loads(cp.read_text()) if cp.exists() else {}
for name in ['narration-timings.js','narration-timings-en.js']:
    data=json.loads((root/'audio'/name).read_text().split('=',1)[1].strip().rstrip(';'))
    for id,entry in data['habits'].items():
        target=root/entry['path'];digest=hashlib.sha256(target.read_bytes()).hexdigest()
        if entry['path'] in result and result[entry['path']]['sha256']==digest:continue
        text=' '.join(s['text'] for s in entry['segments'])
        words=text.split();normalized=[];indices=[]
        for i,word in enumerate(words):
            simple=''.join(c for c in unicodedata.normalize('NFKD',word) if not unicodedata.combining(c))
            value=re.sub('[^a-z]','',roman.romanize_string(simple).lower())
            if value:indices.append(i);normalized.append(value)
        samples,sr=sf.read(target,dtype='float32')
        wave=torchaudio.functional.resample(torch.from_numpy(samples).unsqueeze(0),sr,bundle.sample_rate)
        with torch.inference_mode():emission,_=model(wave)
        spans=aligner(emission[0],tokenizer(normalized));ratio=wave.shape[1]/emission.shape[1]/bundle.sample_rate*1000
        cues=[]
        for index,group in zip(indices,spans):
            assert group,(id,index)
            cues.append([index,round(group[0].start*ratio),round(group[-1].end*ratio)])
        duration=round(len(samples)/sr*1000)
        assert len(cues)==len(indices) and all(0<=s<e<=duration for _,s,e in cues),id
        result[entry['path']]={'text':text,'sha256':digest,'duration_ms':duration,'cues':cues,'timing_source':'MMS_FA word alignment of the unchanged decoded MP3'}
        cp.write_text(json.dumps(result,ensure_ascii=False,separators=(',',':')))
        print('Aligned',len(result),name,id,len(cues),'words',flush=True)
assert len(result)==100,len(result)
(root/'audio/routine-word-cues-v1.js').write_text('window.APP360_ROUTINE_WORD_CUES = '+json.dumps(result,ensure_ascii=False,separators=(',',':'))+';\n')
print('PASS: measured word cues for 100 original Arabic/English routine files',flush=True)
