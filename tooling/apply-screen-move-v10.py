from pathlib import Path
import json,re
ROOT=Path('.')
APP=ROOT/'apps/1-4/screen-to-move'

def rep(text,old,new,name):
    if old not in text: raise SystemExit('missing '+name)
    return text.replace(old,new,1)

# index integration + visible separate buttons
p=APP/'index.html'; s=p.read_text(encoding='utf-8')
s=s.replace('?v=9','?v=10')
s=rep(s,'<link rel="stylesheet" href="v9.css?v=10">','<link rel="stylesheet" href="v9.css?v=10">\n<link rel="stylesheet" href="v10.css?v=10">','v10 css')
old='<button id="drawingBtn" class="designer-feature-btn"><img src="../../../assets/ui-icons/draw.svg" alt=""><span>مصمم أوراق الألعاب</span></button>'
new=old+'<button id="gameDesignerBtn" class="game-designer-feature-btn"><img src="../../../assets/ui-icons/games.svg" alt=""><span>مصمم الألعاب الإلكترونية</span></button>'
s=rep(s,old,new,'game designer header button')
s=rep(s,'<script src="designer-v9.js?v=10"></script>','<script src="designer-v9.js?v=10"></script>\n<script src="designer-v10.js?v=10"></script>\n<script src="game-designer-v10.js?v=10"></script>','v10 scripts')
p.write_text(s,encoding='utf-8')

# app launchers + library feature actions
p=APP/'app.js'; s=p.read_text(encoding='utf-8')
old="function launchWorksheetDesigner(game){if(window.App360WorksheetDesigner&&window.App360WorksheetDesigner.open){window.App360WorksheetDesigner.open(game||null);return}openWorksheetDesigner(game||null)}"
new=old+"\nfunction launchGameDesigner(){if(window.App360GameDesigner&&window.App360GameDesigner.open){window.App360GameDesigner.open();return}toast('مصمم الألعاب ما زال في طور التحميل؛ جرّب مرة أخرى.') }"
s=rep(s,old,new,'launch game designer')
old='<section class="library-designer-feature"><div><h3>مصمم أوراق ألعاب الأطفال 360</h3><p>أنشئ ورقة A4 من الصفر: صور، بحث، رفع، سحب وإفلات، قوالب، شبكات وصفوف وأعمدة ثم اطبعها مباشرة.</p></div><button id="libraryDesigner">افتح المصمم</button></section>'
new='<section class="library-designer-feature"><div><h3>مصمما الألعاب 360</h3><p>صمّم ورقة A4 أو ابنِ لعبة إلكترونية قابلة للتجربة والحفظ ضمن أي مستوى، ثم اطبع نسخة ورقية منها عند الحاجة.</p></div><div class="library-designer-actions"><button id="libraryDesigner" class="paper">مصمم أوراق الألعاب</button><button id="libraryGameDesigner" class="game">مصمم الألعاب الإلكترونية</button></div></section>'
s=rep(s,old,new,'library designer feature')
old="if(el('libraryDesigner'))el('libraryDesigner').onclick=function(){launchWorksheetDesigner(null)};arr(root.querySelectorAll('[data-level]'))"
new="if(el('libraryDesigner'))el('libraryDesigner').onclick=function(){launchWorksheetDesigner(null)};if(el('libraryGameDesigner'))el('libraryGameDesigner').onclick=launchGameDesigner;arr(root.querySelectorAll('[data-level]'))"
s=rep(s,old,new,'library game handler')
old="el('libraryBtn').onclick=renderLibrary;el('worksheetsBtn').onclick=openWorksheets;el('drawingBtn').onclick=function(){launchWorksheetDesigner(state.game||null)};el('historyBtn').onclick=openHistory;"
new="el('libraryBtn').onclick=renderLibrary;el('worksheetsBtn').onclick=openWorksheets;el('drawingBtn').onclick=function(){launchWorksheetDesigner(state.game||null)};if(el('gameDesignerBtn'))el('gameDesignerBtn').onclick=launchGameDesigner;el('historyBtn').onclick=openHistory;"
s=rep(s,old,new,'header game handler')
p.write_text(s,encoding='utf-8')

# strengthen old-browser game board ratio and expose saved-game opening
p=APP/'game-designer-v10.js'; s=p.read_text(encoding='utf-8')
anchor="function eventPoint(e){var t=e.touches&&e.touches[0]?e.touches[0]:(e.changedTouches&&e.changedTouches[0]?e.changedTouches[0]:e);return{x:t.clientX,y:t.clientY}}"
s=rep(s,anchor,anchor+"\nfunction ensureRatio(n,w,h){if(!n)return;if(!('aspectRatio' in n.style)){var cw=n.clientWidth||Math.min(900,(n.parentNode&&n.parentNode.clientWidth)||700);n.style.height=Math.round(cw*h/w)+'px'}}",'legacy ratio helper')
s=s.replace("var layer=el('gdPreview');layer.innerHTML=previewHtml(d);layer.style.display='block';bindPreview(d);closeSettings()","var layer=el('gdPreview');layer.innerHTML=previewHtml(d);layer.style.display='block';ensureRatio(layer.querySelector('.gdp-board'),W,H);bindPreview(d);closeSettings()")
s=s.replace("renderCategories();renderAssets();renderSaved();bindUi();syncMeta();renderBoard();closeSettings()","renderCategories();renderAssets();renderSaved();bindUi();syncMeta();renderBoard();ensureRatio(el('gdBoard'),W,H);closeSettings()")
p.write_text(s,encoding='utf-8')

# manifest
p=APP/'manifest.webmanifest'; m=json.loads(p.read_text(encoding='utf-8'));m['start_url']='./index.html?v=10';m['description']='90 لعبة إبداعية مع أغلفة مرئية، مصمم أوراق A4 متقدم، ومصمم ألعاب إلكترونية قابل للتجربة والحفظ والطباعة ضمن أي مستوى.';p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# package
p=APP/'package.json'; pkg=json.loads(p.read_text(encoding='utf-8'));pkg['version']='0.10.0';pkg['scripts']['validate']='node --check app.js && node --check designer-v9.js && node --check designer-v10.js && node --check game-designer-v10.js && node --check designer-assets-v9.js && node --check games-data.js && node --check offline-alternatives.js && node --check sw.js && node --test app.test.js';p.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# app contract
p=APP/'app.json'; cfg=json.loads(p.read_text(encoding='utf-8'));cfg['version']=10;cfg['implementation']['state']='live-v10-collapsible-workspace-and-electronic-game-designer';features=cfg['implementation']['features'];extra=[
'worksheet designer controls collapse into a temporary edge drawer so the A4 page stays clear',
'designer controls automatically hide when the worksheet itself is touched',
'high-contrast worksheet designer button with always-visible label',
'separate electronic game designer sharing the same visual asset library and interaction language',
'electronic game designer supports choice multi-mark matching two-group sorting and ordered-sequence games',
'every designed electronic game can be assigned to readiness level 1 2 3 or 4',
'game elements carry logical roles such as correct distractor pair group and sequence order',
'electronic games include direct live preview before saving',
'locally saved custom electronic games plus JSON export and import',
'paper version printing directly from the electronic game layout without revealing answers',
'legacy Android game-board sizing fallback without requiring CSS aspect-ratio or Pointer Events'
]
for x in extra:
    if x not in features: features.append(x)
p.write_text(json.dumps(cfg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# SW v10
p=APP/'sw.js'; s=p.read_text(encoding='utf-8');s=s.replace("screen-to-move-v9","screen-to-move-v10").replace('?v=9','?v=10')
needle="'./designer-v9.js?v=10'"
if needle not in s: raise SystemExit('missing sw designer-v9')
s=s.replace(needle,needle+",'./designer-v10.js?v=10','./game-designer-v10.js?v=10','./v10.css?v=10'",1)
p.write_text(s,encoding='utf-8')

# tests: migrate SW expectation and add v10 checks
p=APP/'app.test.js'; t=p.read_text(encoding='utf-8')
t=t.replace("test('v9 service worker includes designer shell and game cover offline assets'","test('v10 service worker preserves designer shell and game cover offline assets'")
t=t.replace('/screen-to-move-v9/','/screen-to-move-v10/').replace('/designer-v9\\.js\\?v=9/','/designer-v9\\.js\\?v=10/')
if "v10 worksheet settings hide from the drawing page" not in t:
    t += """

test('v10 worksheet settings hide from the drawing page and reopen from an edge button',()=>{const js=fs.readFileSync('./designer-v10.js','utf8');const css=fs.readFileSync('./v10.css','utf8');assert.match(js,/wdSettingsToggle/);assert.match(js,/page\.addEventListener\('touchstart',close/);assert.match(css,/\.wd-settings-drawer\{[^}]*display:none/s);assert.match(css,/\.wd-settings-drawer\.open\{display:block/);});
test('v10 designer buttons keep their labels visually prominent',()=>{const html=fs.readFileSync('./index.html','utf8');const css=fs.readFileSync('./v10.css','utf8');assert.match(html,/designer-feature-btn[^>]*>.*مصمم أوراق الألعاب/s);assert.match(html,/gameDesignerBtn.*مصمم الألعاب الإلكترونية/s);assert.match(css,/\.designer-feature-btn span\{color:#17302f!important;opacity:1!important;font-weight:900!important\}/);});
test('v10 electronic game designer supports levels five game types roles preview save and paper print',()=>{const js=fs.readFileSync('./game-designer-v10.js','utf8');for(const x of ["value=\\\"choice\\\"","value=\\\"mark\\\"","value=\\\"match\\\"","value=\\\"sort\\\"","value=\\\"order\\\"","gdLevel","correct","pair","group","order","function preview","function saveGame","function printGame","app360-electronic-game-v10"])assert.match(js,new RegExp(x));});
test('v10 game designer shares the large visual library and supports upload drag resize and legacy touch',()=>{const js=fs.readFileSync('./game-designer-v10.js','utf8');assert.match(js,/ScreenMoveDesignerAssets/);assert.match(js,/gdUpload/);assert.match(js,/ondragstart/);assert.match(js,/ondrop=drop/);assert.match(js,/gd-resize/);assert.match(js,/ontouchstart/);assert.match(js,/ensureRatio/);assert.doesNotMatch(js,/=>|\\bconst\\b|\\blet\\b|`/);});
test('v10 electronic game can print a paper version without exposing answer roles',()=>{const js=fs.readFileSync('./game-designer-v10.js','utf8');assert.match(js,/ورقة اللعبة مشتقة من التصميم الإلكتروني دون إظهار الحلول/);assert.match(js,/gd-print-board/);assert.match(js,/d\.type==='mark'/);});
test('v10 service worker caches both new designer runtimes',()=>{const sw=fs.readFileSync('./sw.js','utf8');assert.match(sw,/designer-v10\.js\?v=10/);assert.match(sw,/game-designer-v10\.js\?v=10/);assert.match(sw,/v10\.css\?v=10/);});
"""
p.write_text(t,encoding='utf-8')

# README note
p=APP/'README.md'; r=p.read_text(encoding='utf-8')
if '## ترقية v10' not in r:
    r += '''\n\n## ترقية v10 — مساحة رسم واضحة + مصمم الألعاب الإلكترونية\n- أصبح زر مصمم أوراق الألعاب عالي التباين والنص داخله ظاهرًا بوضوح.\n- أدوات وإعدادات مصمم الورق موجودة في درج جانبي مؤقت يفتح من زر طرفي ويغلق عند لمس الورقة.\n- أضيف مصمم مستقل للألعاب الإلكترونية يستخدم نفس مكتبة الصور الكبيرة، ويتيح تحديد المستوى ونوع اللعبة وأدوار العناصر.\n- الأنواع الحالية: اختيار إجابة، تحديد عدة عناصر، وصل أزواج، فرز مجموعتين، وترتيب/تسلسل.\n- يمكن تجربة اللعبة مباشرة، حفظها محليًا، تصديرها واستيرادها JSON، وطباعة نسخة ورقية من التصميم دون إظهار الحل.\n- صُممت v10 دون الاعتماد الإجباري على Pointer Events أو CSS Grid أو aspect-ratio لدعم الأجهزة القديمة قدر الإمكان.\n'''
p.write_text(r,encoding='utf-8')

# update catalog links when present
for rel in ['data/catalog.json','data/live-overrides.json']:
    p=ROOT/rel
    if p.exists():
        txt=p.read_text(encoding='utf-8').replace('apps/1-4/screen-to-move/index.html?v=9','apps/1-4/screen-to-move/index.html?v=10')
        p.write_text(txt,encoding='utf-8')
print('v10 integration prepared')
