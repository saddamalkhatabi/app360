"""Import ten attributed Kevin MacLeod excerpts from Wikimedia Commons; rebuild local MP3 pack."""
import urllib.request,urllib.parse,json,pathlib,concurrent.futures,subprocess,hashlib,re
repo=pathlib.Path(__file__).resolve().parents[3];cache=pathlib.Path('/tmp/children-music-source');cache.mkdir(exist_ok=True)
tracks=[('carefree','Carefree','USUAN1400037','مرح ولعب'),('monkeys','Monkeys Spinning Monkeys','USUAN1400011','قفزات مرحة'),('fluffing','Fluffing a Duck','USUAN1100768','بطة مرحة'),('happy-bee','Happy Bee','USUAN1300014','النحلة النشيطة'),('riley','Life of Riley','USUAN1400054','يوم سعيد'),('pixelland','Pixelland','USUAN1500076','عالم الألعاب'),('fretless','Fretless','USUAN1500074','خطوات سعيدة'),('sneaky','Sneaky Snitch','USUAN1100772','مغامرة لطيفة'),('merry-go','Merry Go','USUAN1100731','جولة مرحة'),('wallpaper','Wallpaper','USUAN1100843','حركة ونشاط')]
def api(params):
 req=urllib.request.Request('https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(dict(action='query',format='json',**params)),headers={'User-Agent':'FamilySchool360Media/1.0'})
 with urllib.request.urlopen(req,timeout=40) as r:return json.load(r)
def get(row):
 key,title,isrc,label=row
 candidates=['File:'+title+' (ISRC '+isrc+').mp3','File:Kevin MacLeod - '+title+'.ogg','File:'+title+' by Kevin MacLeod.ogg']
 response=api({'titles':'|'.join(candidates),'prop':'imageinfo','iiprop':'url|extmetadata'})
 found=[p for p in response['query']['pages'].values() if 'imageinfo' in p]
 if not found:
  response=api({'generator':'search','gsrsearch':'intitle:"'+title+'"','gsrnamespace':6,'gsrlimit':5,'prop':'imageinfo','iiprop':'url|extmetadata'})
  found=[p for p in response.get('query',{}).get('pages',{}).values() if 'imageinfo' in p and title.lower() in p['title'].lower()]
 if not found:raise RuntimeError('No Commons source '+title)
 p=found[0];info=p['imageinfo'][0];meta=info.get('extmetadata',{});license=meta.get('LicenseShortName',{}).get('value','');license_url=meta.get('LicenseUrl',{}).get('value','')
 if not re.fullmatch(r'CC BY [34]\.0',license):raise RuntimeError(title+' unsupported license '+license)
 source=cache/(key+pathlib.Path(urllib.parse.urlparse(info['url']).path).suffix)
 if not source.exists():
  req=urllib.request.Request(info['url'],headers={'User-Agent':'FamilySchool360Media/1.0'})
  with urllib.request.urlopen(req,timeout=120) as r:source.write_bytes(r.read())
 target=repo/'resources/play-music/children-1-8/audio'/(key+'.mp3')
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(source),'-t','45','-af','loudnorm=I=-20:TP=-2:LRA=8,afade=t=in:st=0:d=0.12,afade=t=out:st=44.6:d=0.4','-ar','32000','-ac','1','-codec:a','libmp3lame','-b:a','64k',str(target)],check=True)
 record={'id':key,'title':title,'label_ar':label,'path':'audio/'+key+'.mp3','author':'Kevin MacLeod','author_url':'https://incompetech.com/','source_page':info['descriptionurl'],'source_download':info['url'],'original_url':'https://incompetech.com/music/royalty-free/mp3-royaltyfree/'+urllib.parse.quote(title)+'.mp3','isrc':isrc,'license':license,'license_url':license_url,'changes':'45-second excerpt, loudness normalized to -20 LUFS, short fades, mono 32kHz MP3 64kbps','source_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sha256':hashlib.sha256(target.read_bytes()).hexdigest(),'bytes':target.stat().st_size}
 (cache/(key+'.json')).write_text(json.dumps(record,ensure_ascii=False,indent=2));print('Ready',key,license,flush=True);return record
results=[]
with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
 futures={pool.submit(get,row):row for row in tracks}
 for f in concurrent.futures.as_completed(futures):
  try:results.append(f.result())
  except Exception as e:print('ERROR',futures[f][0],repr(e),flush=True)
if len(results)!=10:raise SystemExit('Need ten tracks; completed '+str(len(results)))
records=sorted(results,key=lambda r:[t[0] for t in tracks].index(r['id']))
manifest={'schema':1,'id':'children-1-8','audience':'children','age_groups':['1-4','4-8'],'instrumental':True,'default_volume':.18,'tracks':records}
out=repo/'resources/play-music/children-1-8';(out/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n');(out/'manifest.js').write_text('(function(w){w.APP360_MUSIC_PACKS=w.APP360_MUSIC_PACKS||{};w.APP360_MUSIC_PACKS["children-1-8"]='+json.dumps(manifest,ensure_ascii=False)+';})(window);\n')
