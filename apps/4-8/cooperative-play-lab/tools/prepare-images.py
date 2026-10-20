"""Convert generated atlases atomically and make small first-frame library covers."""
import hashlib,json,pathlib
from PIL import Image,ImageDraw,ImageFont
ROOT=pathlib.Path(__file__).resolve().parents[1];SRC=ROOT/'tools/curriculum'
records={}
p=SRC/'image-generation-log.json'
if p.exists():
 for r in json.loads(p.read_text()):records[r['id']]=r
for p in (SRC/'image-records').glob('*.json'):
 try:r=json.loads(p.read_text())
 except ValueError:continue
 records[r['id']]=r
old={}
p=ROOT/'data/image-assets.json'
if p.exists():old={r['id']:r for r in json.loads(p.read_text())['items']}
out=[];missing=[]
def save(im,path,quality):
 temporary=path.with_name(path.stem+'.building'+path.suffix);im.save(temporary,quality=quality);temporary.replace(path)
for c in json.loads((ROOT/'data/content.json').read_text())['cases']:
 key=c['id'];source=records.get(key);sheet=ROOT/c['sheet'];fallback=ROOT/c['fallback']
 if source:
  p=pathlib.Path(source['path']);source_sha=hashlib.sha256(p.read_bytes()).hexdigest()
  if old.get(key,{}).get('source_sha256')!=source_sha or not(sheet.exists() and fallback.exists()):
   im=Image.open(p).convert('RGB');assert abs(im.width/im.height-.75)<.04,(key,im.size);im=im.resize((1080,1440))
   save(im,sheet,83);save(im,fallback,82)
 elif sheet.exists():source_sha=hashlib.sha256(sheet.read_bytes()).hexdigest()
 else:missing.append(key);continue
 im=Image.open(sheet).convert('RGB');assert im.size==(1080,1440),(key,im.size)
 cover=im.crop((0,0,540,360)).resize((360,240))
 cover_paths=[ROOT/'assets'/(key+'-cover.webp'),ROOT/'assets'/(key+'-cover.jpg')]
 for p in cover_paths:
  if not p.exists() or old.get(key,{}).get('source_sha256')!=source_sha:save(cover,p,80)
 files={str(p.relative_to(ROOT)):{'bytes':p.stat().st_size,'sha256':hashlib.sha256(p.read_bytes()).hexdigest()} for p in [sheet,fallback]+cover_paths}
 out.append({'id':key,'source_sha256':source_sha,'frames':8,'atlas_size':[1080,1440],'files':files})
(ROOT/'data/image-assets.json').write_text(json.dumps({'schema':1,'items':out,'missing_ids':missing},ensure_ascii=False,indent=2)+'\n')
# A visual review aid only. These labelled contact sheets are never app assets.
folder=pathlib.Path('/tmp/cooperate-image-review');folder.mkdir(exist_ok=True)
font=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',18)
for i in range(0,len(out),4):
 canvas=Image.new('RGB',(1080,1500),'white');draw=ImageDraw.Draw(canvas)
 for j,r in enumerate(out[i:i+4]):
  x=(j%2)*540;y=(j//2)*750;draw.text((x+8,y+4),r['id'],font=font,fill='black');im=Image.open(ROOT/'assets'/(r['id']+'-atlas.webp')).resize((540,720));canvas.paste(im,(x,y+28))
 canvas.save(folder/('page-'+str(i//4+1)+'.jpg'),quality=88)
print(json.dumps({'atlases':len(out),'missing':missing,'review_pages':(len(out)+3)//4}))
