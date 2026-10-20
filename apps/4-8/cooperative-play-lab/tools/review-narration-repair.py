"""Compare five candidate clips, keeping unchanged audio unless its replacement improves."""
import json,pathlib,re,shutil,unicodedata
from faster_whisper import WhisperModel
ROOT=pathlib.Path(__file__).resolve().parents[1]
def normal(text):
 s=''.join(c for c in unicodedata.normalize('NFKD',text) if not unicodedata.combining(c))
 return re.sub('[^ء-ي ]','',s).replace('ى','ي').replace('أ','ا').replace('إ','ا').replace('آ','ا')
model=WhisperModel('small',device='cpu',compute_type='int8',cpu_threads=2)
def transcribe(path):
 segments,_=model.transcribe(str(path),language='ar',beam_size=5,condition_on_previous_text=False)
 return ' '.join(s.text for s in segments).strip()
old_reports={}
for report in json.loads((ROOT/'data/silma-batch-reports.json').read_text())['items']:
 for i in report.get('clips',[]):old_reports[i['path']]=i['mean_alignment_score']
new_reports={i['path']:i['mean_alignment_score'] for i in json.loads((ROOT/'data/narration-repair-report.json').read_text())['clips']}
base=json.loads((ROOT/'data/read-along-ar.json').read_text());new=json.loads((ROOT/'data/narration-repair-cues.json').read_text())['items'];reviews=[]
for item in json.loads((ROOT/'data/narration-repair.json').read_text())['items']:
 path=item['path'];old=pathlib.Path('/tmp/old-cooperate-audio')/pathlib.Path(path).name
 old_text=transcribe(old);new_text=transcribe(ROOT/path)
 expected=set(normal(item['text']).split());old_coverage=len(expected & set(normal(old_text).split()))/len(expected);new_coverage=len(expected & set(normal(new_text).split()))/len(expected)
 names=[n for n in ['سامي','عمر'] if n in normal(item['text']).split()];names_ok=all(n in normal(new_text).split() for n in names)
 required=path=='audio/ar/clay-tool-0.mp3'
 improved=names_ok and (required or new_coverage>old_coverage or (new_coverage>=old_coverage and new_reports[path]>old_reports.get(path,0)))
 if required:assert names_ok,('Sami must be audible in repaired clay introduction',new_text)
 if improved:base['items'][path]=new[path]
 else:shutil.copyfile(old,ROOT/path)
 review={'path':path,'old_asr':old_text,'new_asr':new_text,'old_word_overlap':old_coverage,'new_word_overlap':new_coverage,'old_alignment_score':old_reports.get(path),'new_alignment_score':new_reports[path],'names_recognised':names_ok,'replaced':improved}
 reviews.append(review);print(json.dumps(review,ensure_ascii=False),flush=True)
(ROOT/'data/read-along-ar.json').write_text(json.dumps(base,ensure_ascii=False,separators=(',',':'))+'\n')
(ROOT/'data/narration-repair-review.json').write_text(json.dumps({'method':'Targeted comparative Whisper-small Arabic recognition plus acoustic alignment. ASR is a heuristic, not a full human listening review.','items':reviews},ensure_ascii=False,indent=2)+'\n')
