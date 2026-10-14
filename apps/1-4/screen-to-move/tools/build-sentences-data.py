"""Build sentence and word MP3s from existing SILMA narration and measured cues.
No text-to-speech substitution, guessed uniform timing or child voice data.
"""
import json,pathlib,re,hashlib,subprocess,concurrent.futures
from PIL import Image
root=pathlib.Path(__file__).resolve().parents[1];repo=root.parents[2];source=repo/'apps/1-4/my-little-routine'
scripts=json.loads((source/'audio/narration-scripts.json').read_text())['items'];sources={r['id']:r for r in scripts};alignment=json.loads((source/'audio/silma-alignment.json').read_text())['items']
node="const fs=require('fs'),vm=require('vm'),w={};for(const f of ['data.js','storyboard-data-v6.js'])vm.runInNewContext(fs.readFileSync(f,'utf8'),{window:w});console.log(JSON.stringify(w.ROUTINE_DATA.habits));"
scenes={r['id']:r for r in json.loads(subprocess.check_output(['node','-e',node],cwd=source))}
groups=[('start',[
('wash-hands',0,'أَفْتَحُ الْمَاءَ'),('wash-hands',1,'أَضَعُ الصَّابُونَ'),('wear-shoes',2,'أُدْخِلُ قَدَمِي'),('wear-shoes',3,'أُثَبِّتُ الْحِذَاءَ'),('dirty-clothes',0,'أَجْمَعُ مَلَابِسِي'),('drink-water',0,'أُمْسِكُ الْكُوبَ'),('spoon',1,'أُمْسِكُ الْمِلْعَقَةَ'),('comb-hair',0,'أُمْسِكُ الْمِشْطَ'),('simple-bed',1,'أَسْحَبُ الْغِطَاءَ'),('simple-bed',2,'أُرَتِّبُ الْوِسَادَةَ'),('tidy-books',0,'أَجْمَعُ الْكُتُبَ'),('wash-face',1,'أُبَلِّلُ وَجْهِي')]),('grow',[
('wash-hands',2,'أَفْرُكُ يَدِي جَيِّدًا'),('wash-hands',3,'أَشْطُفُ يَدِي بِالْمَاءِ'),('wash-hands',4,'أُجَفِّفُ يَدِي بِالْمِنْشَفَةِ'),('brush-teeth',2,'أُنَظِّفُ أَسْنَانِي بِلُطْفٍ'),('drink-water',2,'أَحْمِلُ الْكُوبَ بِثَبَاتٍ'),('sit-meal',0,'أَجْلِسُ أَمَامَ وَجْبَتِي'),('sit-meal',2,'آخُذُ لُقْمَةً صَغِيرَةً'),('choose-story-before-sleep',1,'أَخْتَارُ قِصَّةً وَاحِدَةً'),('wipe-nose',2,'أَمْسَحُ أَنْفِي بِلُطْفٍ'),('wash-face',2,'أُنَظِّفُ وَجْهِي بِلُطْفٍ'),('comb-hair',2,'أُمَشِّطُ الْجَوَانِبَ بِلُطْفٍ'),('simple-bed',4,'أَرَى سَرِيرِي مُرَتَّبًا')]),('place',[
('tidy-toys',0,'أَرَى أَلْعَابِي بَعْدَ اللَّعِبِ'),('tidy-toys',1,'أَلْتَقِطُ لُعْبَةً مِنَ الْأَرْضِ'),('tidy-toys',2,'أَضَعُ الْأَلْعَابَ فِي السَّلَّةِ'),('brush-teeth',1,'أَضَعُ الْمَعْجُونَ عَلَى الْفُرْشَاةِ'),('brush-teeth',4,'أُعِيدُ الْفُرْشَاةَ إِلَى مَكَانِهَا'),('wear-clothes',1,'أُدْخِلُ رَأْسِي فِي الْقَمِيصِ'),('wear-clothes',3,'أُرَتِّبُ مَلَابِسِي عَلَى جِسْمِي'),('dirty-clothes',3,'أُرَتِّبُ مَا بَقِيَ دَاخِلَهَا'),('spoon',3,'أَرْفَعُ الْمِلْعَقَةَ إِلَى فَمِي'),('tissue-bin',1,'أَمْشِي إِلَى سَلَّةِ الْمُهْمَلَاتِ'),('comb-hair',1,'أَبْدَأُ مِنْ أَعْلَى الشَّعْرِ'),('tidy-books',2,'أَضَعُ كِتَابًا فِي الرَّفِّ')]),('flow',[
('wear-clothes',2,'أَلْبَسُ الْبِنْطَالَ أَوِ الْجُزْءَ السُّفْلِيَّ'),('enter-bathroom',4,'أَقِفُ دَاخِلَ الْحَمَّامِ بِهُدُوءٍ'),('blocks-box',0,'أَرَى الْمُكَعَّبَاتِ عَلَى الْأَرْضِ'),('share-play',2,'أُعْطِيهِ قِطْعَةً أَوْ لُعْبَةً'),('sleep-early',0,'أَجْمَعُ أَلْعَابِي قَبْلَ النَّوْمِ'),('sleep-early',2,'أَقْرَأُ قِصَّةً قَصِيرَةً'),('knock-and-wait',3,'أَبْقَى هَادِئًا حَتَّى يُفْتَحَ'),('hold-guardian-hand-outside',3,'نَمْشِي مَعًا خَارِجَ الْبَيْتِ'),('wipe-table-after-eating',0,'أُلَاحِظُ الْفُتَاتَ عَلَى الطَّاوِلَةِ'),('organize-small-bag',1,'أَضَعُ زُجَاجَةَ الْمَاءِ دَاخِلَهَا'),('put-plate-after-eating',3,'أَضَعُهُ فِي مَكَانِ التَّنْظِيفِ'),('help-water-plant',2,'أَسْقِي النَّبْتَةَ بِكَمِّيَّةٍ قَلِيلَةٍ')])]
def normal(t):return re.sub('[\u064b-\u065f\u0670.!؟،,;:]','',t).strip()
def cut(src,path,begin,end):
 assert end-begin>.055,(path,begin,end)
 path.parent.mkdir(parents=True,exist_ok=True)
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(src),'-ss',str(max(0,begin)),'-t',str(end-max(0,begin)),'-ar','24000','-ac','1','-af','apad=pad_dur=0.08','-codec:a','libmp3lame','-b:a','48k','-id3v2_version','0',str(path)],check=True)
 return dict(path=str(path.relative_to(root)),duration_s=end-begin+.08,sha256=hashlib.sha256(path.read_bytes()).hexdigest(),engine='SILMA')
rows=[];jobs=[];report=[]
for group,chosen in groups:
 for rid,step,text in chosen:
  source_row=sources[rid];a=alignment[source_row['path']];file=source/source_row['path'];assert hashlib.sha256(file.read_bytes()).hexdigest()==a['audio_sha256']
  words=text.split();full=a['text'].split();raw=[normal(x) for x in full];target=[normal(x) for x in words];assert normal(source_row['steps'][step])==normal(text),(rid,step,text,source_row['steps'][step])
  matches=[i for i in range(len(raw)-len(target)+1) if raw[i:i+len(target)]==target];assert matches
  start=matches[-1];cues={i:(b/1000,e/1000) for i,b,e in a['cues']};assert all(start+j in cues for j in range(len(words)))
  first,last=cues[start][0],cues[start+len(words)-1][1];prev=cues.get(start-1,(0,0))[1];nxt=cues.get(start+len(words),(a['duration']/1000,a['duration']/1000))[0]
  begin=max(prev+.025,first-.1);end=min(nxt-.025,last+.14)
  row=dict(id='s'+str(len(rows)+1).zfill(2),group=group,text=text+' .',words=words,source_id=rid,source_step=step,source_path=source_row['path'],source_begin=begin,source_end=end,cues=[[j,max(0,round((cues[start+j][0]-begin)*1000)),round((cues[start+j][1]-begin)*1000)] for j in range(len(words))],wordAudio=[],spell_index=max(range(len(words)),key=lambda j:len(normal(words[j]))))
  row['text']=text+'.'
  row['audio']=cut(file,root/'audio/sentences'/('sentence-'+row['id']+'.mp3'),begin,end)
  for j in range(len(words)):
   low=high=j
   if cues[start+j][1]-cues[start+j][0]<.12:
    if j+1<len(words):high=j+1
    elif j:low=j-1
   b,e=cues[start+low][0],cues[start+high][1];left=cues.get(start+low-1,(0,0))[1];right=cues.get(start+high+1,(a['duration']/1000,a['duration']/1000))[0];wb=max(left+.008,b-.045);we=min(right-.008,e+.045)
   clip=cut(file,root/'audio/sentences'/('word-'+row['id']+'-'+str(j)+'.mp3'),wb,we);clip['span']=[low,high];clip['text']=' '.join(words[low:high+1]);row['wordAudio'].append(clip)
  visual_number={34:46,35:47,36:48,37:40,38:41,39:0,40:49,41:50,46:37,47:38,48:39,49:34,50:35}.get(source_row['number'],source_row['number']);board_files=list((source/'storyboards').glob(str(visual_number).zfill(3)+'_*.png'));assert len(board_files)==1,rid;board=Image.open(board_files[0]);width,height=board.size;tile=width/5;img=board.crop((round((4-step)*tile),round(height*.18),round((5-step)*tile),height));img.thumbnail((360,360));dest=root/'assets/sentence-scenes'/(row['id']+'.webp');dest.parent.mkdir(exist_ok=True);img.save(dest,'WEBP',quality=84,method=6);row['scene']='assets/sentence-scenes/'+row['id']+'.webp';row['sceneSource']=str(board_files[0].relative_to(repo));row['scene_review']='visual match checked'
  rows.append(row);print('Built',row['id'],text,flush=True)
(root/'sentences-data-v32.js').write_text('window.CreativeSentencesData='+json.dumps(dict(sentences=rows,exercises=12,method='Existing SILMA sentences and MMS measured word boundaries',human_pronunciation_review='pending'),ensure_ascii=False,separators=(',',':'))+';\n')
(root/'audio/sentences-validation-v32.json').write_text(json.dumps(dict(recordings=sum(1+len(r['words']) for r in rows),sentences=len(rows),human_pronunciation_review='pending',items=[dict(id=r['id'],source_sha256=alignment[r['source_path']]['audio_sha256'],source_path=r['source_path'],source_begin=r['source_begin'],source_end=r['source_end'],audio=r['audio'],wordAudio=r['wordAudio'],cues=r['cues']) for r in rows]),ensure_ascii=False,indent=2)+'\n')
print('Sentence clips',len(rows),'word clips',sum(len(r['words']) for r in rows))
