"""Remove outer silence only; retain pauses within speech and phonetic attacks."""
import pathlib, subprocess, array, math, json, hashlib, tempfile
ROOT=pathlib.Path(__file__).resolve().parents[1]
report=ROOT/'data/audio-processing-report.json'
previous=json.loads(report.read_text()) if report.exists() else {'items':[]}
hashes={x['path']:x for x in previous['items']};rows=[]
manifest=json.loads((ROOT/'data/audio-manifest.json').read_text());units={x['path'] for x in manifest['items'] if x['kind']=='sound-example'}
for f in sorted((ROOT/'audio').glob('*.mp3')):
 rel=str(f.relative_to(ROOT));sha=hashlib.sha256(f.read_bytes()).hexdigest()
 if rel in hashes and hashes[rel]['sha256']==sha:rows.append(hashes[rel]);continue
 raw=subprocess.check_output(['ffmpeg','-v','error','-i',str(f),'-ac','1','-ar','16000','-f','s16le','-'])
 a=array.array('h',raw);rms=[math.sqrt(sum(v*v for v in a[i:i+160])/len(a[i:i+160]))/32768 for i in range(0,len(a),160) if a[i:i+160]]
 peak=max(abs(v) for v in a);gain=max(.5,min(30,10000/peak)) if rel in units and peak else 1
 active=[i for i,v in enumerate(rms) if v*gain>10**(-48/20)]
 if not active:raise RuntimeError('Silent audio: '+rel)
 start=max(0,active[0]/100-.04);end=min(len(a)/16000,(active[-1]+1)/100+.08);before=f.stat().st_size
 with tempfile.TemporaryDirectory() as tmp:
  dest=pathlib.Path(tmp)/'clip.mp3'
  subprocess.run(['ffmpeg','-v','error','-y','-i',str(f),'-af',f'atrim=start={start}:end={end},asetpts=PTS-STARTPTS,volume={gain}','-ac','1','-ar','24000','-codec:a','libmp3lame','-b:a','40k','-write_xing','0','-id3v2_version','0',str(dest)],check=True)
  f.write_bytes(dest.read_bytes())
 rows.append({'path':rel,'before_bytes':before,'bytes':f.stat().st_size,'original_leading_ms':round(active[0]*10),'trimmed_start_ms':round(start*1000),'sha256':hashlib.sha256(f.read_bytes()).hexdigest()})
report.write_text(json.dumps({'codec':'MP3 mono 24 kHz 40 kbps','policy':'Outer silence only, preserve 40ms onset and 80ms tail; internal pauses unchanged. Phoneme examples use bounded gain toward peak 10000, maximum 30x.','items':rows},ensure_ascii=False,indent=2)+'\n')
print(json.dumps({'clips':len(rows),'before_bytes':sum(x['before_bytes'] for x in rows),'bytes':sum(x['bytes'] for x in rows)}))
