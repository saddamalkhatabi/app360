from pathlib import Path
import json,re,html,os

ROOT=Path('.')
APP=ROOT/'apps/1-4/screen-to-move'
SAY=ROOT/'apps/1-4/say-and-name'

def replace_once(text, old, new, name):
    if old not in text:
        raise SystemExit('missing pattern: '+name)
    return text.replace(old,new,1)

def xml(s):
    return html.escape(str(s), quote=True)

def parse_games():
    t=(APP/'games-data.js').read_text(encoding='utf-8')
    start=t.index('return [')+len('return ')
    end=t.rfind('];})')
    if end<0:
        end=t.rfind('];')
    return json.loads(t[start:end+1])

GAMES=parse_games()
COVERS=APP/'assets/game-covers'
COVERS.mkdir(parents=True,exist_ok=True)
level_pal={1:('#e9fbf8','#0f8f8a','#ffd54f'),2:('#eef5ff','#2563eb','#9ed0ff'),3:('#fff7e8','#d97706','#ffd19a'),4:('#f6efff','#7c3aed','#d7b8ff')}

def wrap_title(title, limit=22):
    words=title.split(); lines=['']
    for w in words:
        if len(lines[-1])+len(w)+1<=limit: lines[-1]=(lines[-1]+' '+w).strip()
        elif len(lines)<2: lines.append(w)
        else: lines[-1]+='…'; break
    return lines[:2]

def scene(g,accent,soft):
    typ=g.get('type','choice')
    s=[]
    if typ in ('choice','pattern'):
        for i,x in enumerate((115,235,355,475)):
            fill=accent if i==1 else '#ffffff'
            sw='#ffffff' if i==1 else accent
            s.append(f'<rect x="{x}" y="88" width="88" height="88" rx="20" fill="{fill}" stroke="{accent}" stroke-width="5"/>')
            s.append(f'<circle cx="{x+44}" cy="132" r="18" fill="{sw}" opacity=".9"/>')
    elif typ=='match':
        for y in (92,157,222):
            s.append(f'<circle cx="150" cy="{y}" r="25" fill="#fff" stroke="{accent}" stroke-width="5"/><rect x="450" y="{y-25}" width="50" height="50" rx="10" fill="#fff" stroke="{accent}" stroke-width="5"/><path d="M180 {y} C270 {y-25} 360 {y+25} 440 {y}" fill="none" stroke="{accent}" stroke-width="5" stroke-dasharray="10 8"/>')
    elif typ=='sort':
        s.append(f'<path d="M95 205h180l-20 80H115z" fill="#fff" stroke="{accent}" stroke-width="5"/><path d="M365 205h180l-20 80H385z" fill="#fff" stroke="{accent}" stroke-width="5"/>')
        for x,y in ((150,100),(235,120),(360,110),(470,105)):
            s.append(f'<circle cx="{x}" cy="{y}" r="22" fill="{soft}" stroke="{accent}" stroke-width="4"/>')
        s.append(f'<path d="M220 145l-25 45M410 145l25 45" stroke="{accent}" stroke-width="6" stroke-linecap="round"/>')
    elif typ=='memory':
        for r in range(2):
            for c in range(4):
                x=115+c*105;y=80+r*100
                s.append(f'<rect x="{x}" y="{y}" width="78" height="78" rx="14" fill="{accent if (r+c)%3==0 else "#fff"}" stroke="{accent}" stroke-width="5"/>')
    elif typ=='order':
        for i,x in enumerate((110,260,410)):
            s.append(f'<rect x="{x}" y="95" width="120" height="125" rx="18" fill="#fff" stroke="{accent}" stroke-width="5"/><circle cx="{x+60}" cy="145" r="24" fill="{soft}"/><text x="{x+60}" y="154" text-anchor="middle" font-family="Arial" font-size="24" fill="{accent}">{i+1}</text>')
        s.append(f'<path d="M230 157h25m125 0h25" stroke="{accent}" stroke-width="7" stroke-linecap="round"/>')
    elif typ=='puzzle':
        s.append(f'<path d="M180 75h115v55a25 25 0 0 1 50 0v-55h115v95h-55a25 25 0 0 0 0 50h55v70H345v-55a25 25 0 0 0-50 0v55H180v-95h55a25 25 0 0 0 0-50h-55z" fill="#fff" stroke="{accent}" stroke-width="6"/>')
    elif typ in ('dots','path'):
        pts=[(105,230),(180,115),(285,185),(390,90),(500,205)]
        s.append('<path d="M'+' L'.join(f'{x} {y}' for x,y in pts)+'" fill="none" stroke="#aac8c5" stroke-width="7" stroke-dasharray="12 10"/>')
        for i,(x,y) in enumerate(pts):
            s.append(f'<circle cx="{x}" cy="{y}" r="18" fill="{accent}" stroke="#fff" stroke-width="4"/><text x="{x}" y="{y+6}" text-anchor="middle" font-family="Arial" font-size="15" fill="#fff">{i+1}</text>')
    elif typ=='mark':
        for r in range(3):
            for c in range(4):
                x=105+c*110;y=78+r*72
                s.append(f'<rect x="{x}" y="{y}" width="86" height="58" rx="12" fill="#fff" stroke="#c6dedb" stroke-width="3"/>')
                if (r+c)%3==0:s.append(f'<path d="M{x+23} {y+31}l13 13 28-30" fill="none" stroke="{accent}" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>')
    elif typ in ('draw','create'):
        s.append(f'<rect x="145" y="62" width="330" height="215" rx="18" fill="#fff" stroke="{accent}" stroke-width="5"/><path d="M215 214c35-80 75 40 115-35s65 20 100-45" fill="none" stroke="{accent}" stroke-width="7" stroke-linecap="round"/><path d="M455 75l55 55-20 20-55-55z" fill="{soft}" stroke="{accent}" stroke-width="4"/>')
    else:
        s.append(f'<circle cx="310" cy="155" r="90" fill="#fff" stroke="{accent}" stroke-width="7"/>')
    return ''.join(s)

for idx,g in enumerate(GAMES):
    bg,accent,soft=level_pal.get(g.get('level',1),level_pal[1])
    title=wrap_title(g.get('title','لعبة'))
    text=''.join(f'<text x="310" y="{325+i*30}" text-anchor="middle" direction="rtl" unicode-bidi="plaintext" font-family="Tahoma,Arial,sans-serif" font-size="{23 if i==0 else 20}" font-weight="700" fill="#17302f">{xml(line)}</text>' for i,line in enumerate(title))
    svg=f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 390"><rect width="620" height="390" rx="28" fill="{bg}"/><circle cx="565" cy="48" r="28" fill="{soft}"/><text x="565" y="57" text-anchor="middle" font-family="Arial" font-size="20" font-weight="700" fill="{accent}">{xml(g['id'])}</text><rect x="28" y="28" width="564" height="260" rx="24" fill="#ffffffaa" stroke="#ffffff" stroke-width="2"/>{scene(g,accent,soft)}{text}<text x="310" y="378" text-anchor="middle" direction="rtl" unicode-bidi="plaintext" font-family="Tahoma,Arial,sans-serif" font-size="13" fill="#55706d">{xml(g.get('topic',''))}</text></svg>'''
    (COVERS/(g['id']+'.svg')).write_text(svg,encoding='utf-8')

manual_labels={'apple':'تفاحة','ball':'كرة','banana':'موز','book':'كتاب','car':'سيارة','cat':'قطة','chair':'كرسي','cup':'كوب','shoe':'حذاء','spoon':'ملعقة','toothbrush':'فرشاة أسنان','water':'ماء','animals':'حيوانات','fruits':'فواكه','home':'المنزل','nature':'الطبيعة','professions':'المهن','corrected-elephant-v24':'فيل','corrected-lion-v24':'أسد','corrected-shark-v24':'قرش','corrected-turtle-v24':'سلحفاة','corrected-walrus-v24':'فظ'}

def infer_category(label,path):
    s=(label+' '+path).lower()
    groups=[('حيوانات',['حيوان','قطة','قط','كلب','أسد','فيل','سلحفاة','قرش','animal','cat','dog','lion','elephant','turtle','shark','walrus']),('طعام وفواكه',['فاكه','تفاح','موز','طعام','خض','food','fruit','apple','banana','spoon']),('منزل',['منزل','بيت','كرسي','كوب','home','chair','cup']),('نقل',['سيارة','نقل','قطار','طائرة','دراجة','car','transport','train','bus','bike']),('طبيعة',['طبيعة','شجر','زهرة','شمس','قمر','nature','tree','flower']),('أدوات',['فرشاة','كتاب','حذاء','ماء','أداة','tool','book','shoe','toothbrush']),('أشخاص ومهن',['مهنة','شخص','طبيب','معلم','profession','person','doctor','teacher'])]
    for cat,keys in groups:
        if any(k in s for k in keys): return cat
    return 'صور إضافية'

refs={}
text_files=[]
for p in SAY.rglob('*'):
    if p.is_file() and p.suffix.lower() in ('.js','.json','.md','.txt','.html','.csv') and p.stat().st_size<3_000_000:
        text_files.append(p)
for p in text_files:
    try:t=p.read_text(encoding='utf-8',errors='ignore')
    except:continue
    for m in re.finditer(r'w(\d{4})\.jpg',t):
        key='w'+m.group(1)
        if key in refs: continue
        sn=t[max(0,m.start()-260):min(len(t),m.end()+260)]
        cand=re.findall(r'["\']([^"\']*[\u0600-\u06FF][^"\']{0,45})["\']',sn)
        cand=[c.strip() for c in cand if 1<len(c.strip())<46 and 'assets/' not in c and 'word-images' not in c]
        if cand: refs[key]=min(cand,key=len)

assets=[]
for p in (SAY/'assets').rglob('*'):
    if not p.is_file() or p.suffix.lower() not in ('.svg','.jpg','.jpeg','.png','.webp'): continue
    rel=p.relative_to(SAY/'assets').as_posix()
    stem=p.stem
    label=manual_labels.get(stem) or refs.get(stem) or ('صورة تعليمية '+stem[1:] if re.fullmatch(r'w\d{4}',stem) else stem.replace('-',' ').replace('_',' '))
    assets.append({'src':'../say-and-name/assets/'+rel,'label':label,'en':stem.replace('-',' '),'category':infer_category(label,rel),'tags':label+' '+stem,'file':rel})
for g in GAMES:
    assets.append({'src':'assets/game-covers/'+g['id']+'.svg','label':g['title'],'en':g['id'],'category':'أغلفة الألعاب','tags':g.get('topic','')+' '+g.get('type',''),'file':g['id']+'.svg'})
assets.sort(key=lambda x:(x['category'],x['label']))
(APP/'designer-assets-v9.js').write_text('window.ScreenMoveDesignerAssets='+json.dumps(assets,ensure_ascii=False,separators=(',',':'))+';\n',encoding='utf-8')

p=APP/'designer-v9.js'; s=p.read_text(encoding='utf-8')
s=replace_once(s,"page.setAttribute('data-orientation',state.orientation);page.style.aspectRatio? page.style.aspectRatio=(d.w+'/'+d.h):null;","page.setAttribute('data-orientation',state.orientation);if('aspectRatio' in page.style){page.style.aspectRatio=(d.w+'/'+d.h)}else{var pw=page.clientWidth||Math.min(794,(page.parentNode&&page.parentNode.clientWidth)||620);page.style.height=Math.round(pw*d.h/d.w)+'px'};",'legacy aspect ratio')
p.write_text(s,encoding='utf-8')
cp=APP/'v9.css'; css=cp.read_text(encoding='utf-8')
css=css.replace('width:min(794px,100%);','width:100%;max-width:794px;')
if '/* v9 explicit old-web positioning */' not in css:
    css+='\n/* v9 explicit old-web positioning */\n.wd9-panel{top:1vh!important;right:1vw!important;bottom:1vh!important;left:1vw!important}.wd-background,.wd-items{top:0;right:0;bottom:0;left:0}\n'
cp.write_text(css,encoding='utf-8')

ap=APP/'app.js'; js=ap.read_text(encoding='utf-8')
if 'function launchWorksheetDesigner' not in js:
    js=replace_once(js,"function findGame(id){for(var i=0;i<GAMES.length;i++)if(GAMES[i].id===id)return GAMES[i];return null}","function findGame(id){for(var i=0;i<GAMES.length;i++)if(GAMES[i].id===id)return GAMES[i];return null}\nfunction launchWorksheetDesigner(game){if(window.App360WorksheetDesigner&&window.App360WorksheetDesigner.open){window.App360WorksheetDesigner.open(game||null);return}openWorksheetDesigner(game||null)}",'launch designer')
new_library="""function renderLibrary(){stopReel();state.game=null;state.mode=null;state.round=null;var list=currentGames(),total=GAMES.length,h='<section class=\"hero compact-hero\"><div><span class=\"hero-badge\">'+total+' لعبة عملية</span><h2>اختر لعبة وابدأ مباشرة</h2><p>كل بطاقة لها صورة خاصة توضّح فكرة اللعبة، واللعبة نفسها تظهر أولًا ثم الشرح والطباعة.</p></div><div class=\"hero-mini\"><b>'+list.length+'</b><span>في '+levelLabel(state.level)+'</span></div></section><section class=\"library-designer-feature\"><div><h3>مصمم أوراق ألعاب الأطفال 360</h3><p>أنشئ ورقة A4 من الصفر: صور، بحث، رفع، سحب وإفلات، قوالب، شبكات وصفوف وأعمدة ثم اطبعها مباشرة.</p></div><button id=\"libraryDesigner\">افتح المصمم</button></section><div class=\"level-tabs\">';for(var i=1;i<=4;i++)h+='<button class=\"chip '+(i===state.level?'active':'')+'\" data-level=\"'+i+'\"><b>'+levelLabel(i)+'</b><small>'+levelAge(i)+'</small></button>';h+='</div><div class=\"library-head\"><div><h2>'+levelLabel(state.level)+'</h2><p>'+levelHelp(state.level)+'</p></div><b>'+list.length+' ألعاب</b></div><div class=\"games-grid\">';list.forEach(function(g){h+='<button class=\"game-card\" data-game=\"'+g.id+'\"><div class=\"game-art game-cover-art\"><img class=\"game-cover\" src=\"assets/game-covers/'+g.id+'.svg\" alt=\"صورة لعبة '+esc(g.title)+'\"></div><div class=\"game-body\"><b>'+esc(g.title)+'</b><div class=\"meta\"><span>'+esc(g.topic)+'</span><span>'+esc(g.id)+'</span></div><div class=\"play-now\">ابدأ اللعبة الآن</div></div></button>'});h+='</div>';root.innerHTML=h;if(el('libraryDesigner'))el('libraryDesigner').onclick=function(){launchWorksheetDesigner(null)};arr(root.querySelectorAll('[data-level]')).forEach(function(b){b.onclick=function(){state.level=Number(this.getAttribute('data-level'));db.prefs.level=state.level;saveStore();renderLibrary()}});arr(root.querySelectorAll('[data-game]')).forEach(function(b){b.onclick=function(){openGame(this.getAttribute('data-game'))}})}"""
js=re.sub(r'function renderLibrary\(\)\{.*?\nfunction renderReel',new_library+'\nfunction renderReel',js,count=1,flags=re.S)
js=js.replace("uiIcon('prev','اللعبة السابقة')","uiIcon('next','اللعبة السابقة')")
js=js.replace("uiIcon('next','اللعبة التالية')","uiIcon('prev','اللعبة التالية')")
js=replace_once(js,"<button id=\"reelPrev\" class=\"nav-main\">السابق</button><button id=\"reelPlay\">تشغيل الشرح</button><button id=\"reelNext\" class=\"nav-main\">التالي</button>","<button id=\"reelPrev\" class=\"nav-main\">'+uiIcon('next','السابق')+'</button><button id=\"reelPlay\">تشغيل الشرح</button><button id=\"reelNext\" class=\"nav-main\">'+uiIcon('prev','التالي')+'</button>",'reel arrows')
js=js.replace("openWorksheetDesigner(g)","launchWorksheetDesigner(g)")
js=js.replace("openWorksheetDesigner(state.game||null)","launchWorksheetDesigner(state.game||null)")
if 'window.App360SetOverlayKind' not in js:
    js=replace_once(js,'var overlayKind=null;','var overlayKind=null;\nwindow.App360SetOverlayKind=function(k){overlayKind=k};','overlay setter')
if 'window.App360CloseDrawing' not in js:
    js=replace_once(js,"function closeDrawing(){if(overlayKind==='drawing'){try{history.back();return}catch(e){}}hideDrawing()}","function closeDrawing(){if(overlayKind==='drawing'){try{history.back();return}catch(e){}}hideDrawing()}\nwindow.App360CloseDrawing=closeDrawing;window.App360HideDrawing=hideDrawing;",'overlay close expose')
ap.write_text(js,encoding='utf-8')

ip=APP/'index.html'; idx=ip.read_text(encoding='utf-8')
idx=idx.replace('?v=8','?v=9')
if 'v9.css?v=9' not in idx:
    idx=idx.replace('<link rel="stylesheet" href="v8.css?v=9">','<link rel="stylesheet" href="v8.css?v=9">\n<link rel="stylesheet" href="v9.css?v=9">')
idx=idx.replace('<button id="globalPrevBtn"><img src="../../../assets/ui-icons/prev.svg" alt=""><span>السابق</span></button>','<button id="globalPrevBtn"><img src="../../../assets/ui-icons/next.svg" alt=""><span>السابق</span></button>')
idx=idx.replace('<button id="globalNextBtn"><img src="../../../assets/ui-icons/next.svg" alt=""><span>التالي</span></button>','<button id="globalNextBtn"><img src="../../../assets/ui-icons/prev.svg" alt=""><span>التالي</span></button>')
idx=idx.replace('<button id="drawingBtn"><img src="../../../assets/ui-icons/draw.svg" alt=""><span>تصميم ورقة</span></button>','<button id="drawingBtn" class="designer-feature-btn"><img src="../../../assets/ui-icons/draw.svg" alt=""><span>مصمم أوراق الألعاب</span></button>')
if 'designer-assets-v9.js?v=9' not in idx:
    idx=idx.replace('<script src="app.js?v=9"></script>','<script src="app.js?v=9"></script>\n<script src="designer-assets-v9.js?v=9"></script>\n<script src="designer-v9.js?v=9"></script>')
ip.write_text(idx,encoding='utf-8')

sp=APP/'sw.js'; sw=sp.read_text(encoding='utf-8')
sw=re.sub(r"var CACHE='app360-app-screen-to-move-v\d+';","var CACHE='app360-app-screen-to-move-v9';",sw)
sw=sw.replace('?v=8','?v=9')
extras=['./v9.css?v=9','./designer-assets-v9.js?v=9','./designer-v9.js?v=9','../../../assets/ui-icons/select.svg']+[f'./assets/game-covers/{g["id"]}.svg' for g in GAMES]
m=re.search(r"var CORE=\[(.*?)\];",sw,re.S)
if not m: raise SystemExit('CORE not found')
body=m.group(1)
for x in extras:
    token="'"+x+"'"
    if token not in body: body+=(',' if body.strip() else '')+token
sw=sw[:m.start(1)]+body+sw[m.end(1):]
sp.write_text(sw,encoding='utf-8')

mp=APP/'manifest.webmanifest'; manifest=json.loads(mp.read_text(encoding='utf-8'))
manifest['start_url']='./index.html?v=9'
manifest['description']='90 لعبة إبداعية مع صور خاصة لكل لعبة ومصمم أوراق ألعاب أطفال A4 متقدم بالسحب والإفلات والقوالب والبحث والطباعة.'
mp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

pp=APP/'package.json'; pkg=json.loads(pp.read_text(encoding='utf-8'));pkg['version']='0.9.0'
val=pkg.get('scripts',{}).get('validate','')
if 'designer-v9.js' not in val:
    pkg['scripts']['validate']=val.replace('node --check app.js','node --check app.js && node --check designer-v9.js && node --check designer-assets-v9.js')
pp.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

aj=APP/'app.json'; cfg=json.loads(aj.read_text(encoding='utf-8'));cfg['version']=9;cfg['implementation']['state']='live-v9-game-covers-advanced-worksheet-designer'
features=cfg['implementation'].setdefault('features',[])
new_features=['90 dedicated SVG game cover images for clear library recognition','Arabic RTL previous and next arrows reversed consistently across global game and lesson navigation','advanced A4 worksheet designer highlighted as a primary system feature','large categorized local illustration library reusing say-and-name assets and all game covers','local asset search plus optional Wikimedia Commons open-image search and device image upload','drag and drop image placement with click fallback for legacy tablets','touch and mouse movement of worksheet elements with manual resize handles','automatic new-item sizing plus selected-item size slider','blank lined handwriting dotted and automatic row-column page layouts','ready-made checkmark matching sorting tracing story and visual-discrimination worksheet templates','portrait and landscape A4 design modes','local design save/load plus JSON export/import for future interactive game conversion','legacy Android fallback without requiring Pointer Events CSS Grid or aspect-ratio support']
for f in new_features:
    if f not in features: features.append(f)
aj.write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

rp=APP/'README.md'; read=rp.read_text(encoding='utf-8')
section='''\n\n## v9 — مصمم أوراق ألعاب الأطفال 360\n- لكل واحدة من الألعاب التسعين غلاف SVG مستقل يوضح نوع اللعبة وفكرتها من المكتبة.\n- اتجاه السابق/التالي أصبح متوافقًا بصريًا مع العربية: السابق إلى اليمين، التالي إلى اليسار.\n- مصمم A4 متقدم: مكتبة صور كبيرة، تصنيفات، بحث محلي، رفع صور، وبحث اختياري في Wikimedia Commons.\n- سحب وإفلات على الأجهزة الحديثة، ونقر ثم سحب باللمس/الفأرة كبديل للأجهزة القديمة.\n- تغيير الحجم من مقابض العنصر أو شريط الحجم، مع خيار الحجم التلقائي عند الإضافة.\n- قوالب تسطير ونقاط وخط كتابة وشبكات بعدد صفوف وأعمدة يحدده المدرب.\n- قوالب كاملة جاهزة: علامة صح، وصل، فرز، تتبع ورسم، قصة 3 صور، وابحث عن المختلف.\n- حفظ التصاميم محليًا وتصدير/استيراد JSON، وهو أساس يمكن إعادة استخدامه لاحقًا لتحويل تصميم اللعبة التفاعلية إلى ورقة مطبوعة.\n'''
if '## v9 — مصمم أوراق ألعاب الأطفال 360' not in read: read+=section
rp.write_text(read,encoding='utf-8')

for path in (ROOT/'data/catalog.json',ROOT/'data/live-overrides.json'):
    if path.exists():
        t=path.read_text(encoding='utf-8').replace('apps/1-4/screen-to-move/index.html?v=8','apps/1-4/screen-to-move/index.html?v=9')
        path.write_text(t,encoding='utf-8')

TEST=APP/'app.test.js'; tests=TEST.read_text(encoding='utf-8')
addon=r'''
test('v9 reverses previous next arrows for Arabic RTL navigation',()=>{const html=fs.readFileSync('./index.html','utf8');const js=fs.readFileSync('./app.js','utf8');assert.match(html,/globalPrevBtn[^\n]+ui-icons\/next\.svg/);assert.match(html,/globalNextBtn[^\n]+ui-icons\/prev\.svg/);assert.match(js,/uiIcon\('next','اللعبة السابقة'\)/);assert.match(js,/uiIcon\('prev','اللعبة التالية'\)/);});
test('v9 gives every one of the 90 games its own cover image',()=>{const games=require('./games-data.js');for(const g of games)assert.ok(fs.existsSync(`./assets/game-covers/${g.id}.svg`),g.id);const js=fs.readFileSync('./app.js','utf8');assert.match(js,/assets\/game-covers\/.*g\.id/);});
test('v9 worksheet designer exposes search upload drag resize templates and persistence',()=>{const js=fs.readFileSync('./designer-v9.js','utf8');for(const x of ['Wikimedia Commons','wdUpload','ondragstart','ondrop','data-resize','wdSize','wdAutoSize','wdRows','wdCols','data-ready','saveLocal','exportJson','importJsonFile'])assert.match(js,new RegExp(x));});
test('v9 designer stays ES5 friendly for Android 4.4 class browsers',()=>{const js=fs.readFileSync('./designer-v9.js','utf8');assert.doesNotMatch(js,/=>|\bconst\b|\blet\b|`/);assert.match(js,/ontouchstart/);assert.match(js,/App360CloseDrawing/);assert.match(js,/aspectRatio.*clientWidth/s);});
test('v9 designer asset catalog is large and includes local assets and game covers',()=>{const src=fs.readFileSync('./designer-assets-v9.js','utf8');assert.match(src,/ScreenMoveDesignerAssets/);assert.match(src,/say-and-name\/assets/);assert.match(src,/game-covers\/G90\.svg/);assert.ok(src.length>5000);});
test('v9 service worker includes designer shell and game cover offline assets',()=>{const sw=fs.readFileSync('./sw.js','utf8');assert.match(sw,/screen-to-move-v9/);assert.match(sw,/designer-v9\.js\?v=9/);assert.match(sw,/game-covers\/G01\.svg/);assert.match(sw,/game-covers\/G90\.svg/);});
'''
if "v9 reverses previous next arrows" not in tests: tests+='\n'+addon
TEST.write_text(tests,encoding='utf-8')

print('v9 prepared:',len(GAMES),'covers,',len(assets),'designer assets')
