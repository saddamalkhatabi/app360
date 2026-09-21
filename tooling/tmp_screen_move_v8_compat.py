from pathlib import Path
import re

ROOT=Path('.')
APP=ROOT/'apps/1-4/screen-to-move'

# Update obsolete tests to the requested v8 behavior.
tp=APP/'app.test.js'
t=tp.read_text(encoding='utf-8')
t=re.sub(r"test\('mark engine supports large selections, validation and printable checkboxes'.*?\}\);", "test('mark engine supports large selections, target toggling and printable checkboxes',()=>{const js=fs.readFileSync('./app.js','utf8');const css=fs.readFileSync('./styles.css','utf8')+fs.readFileSync('./v8.css','utf8');assert.match(js,/function buildMark\\(box,g\\)/);assert.match(js,/function markWorksheetSVG\\(g\\)/);assert.match(js,/g\\.type==='mark'/);assert.match(js,/تحقق من الاختيارات/);assert.match(css,/\\.mark-option/);});", t, count=1, flags=re.S)
t=re.sub(r"test\('wide screen five-step overview and mobile autoplay remain enabled'.*?\}\);", "test('five-step overview is the default and single-step view expands only on demand',()=>{const js=fs.readFileSync('./app.js','utf8');assert.match(js,/function setupReel\\(\\)/);assert.match(js,/showOverview\\(\\)\\}/);assert.match(js,/reel-stage is-overview/);assert.match(js,/reel-stage is-single/);assert.doesNotMatch(js,/if\\(compactReel\\(\\)\\)\\{show\\(0\\);play\\(\\)\\}else showOverview\\(\\)/);});", t, count=1, flags=re.S)
tp.write_text(t,encoding='utf-8')

# Add explicit Flexbox fallbacks for Android 4.4-class browsers.
cp=APP/'v8.css'
c=cp.read_text(encoding='utf-8')
fallback='''\n/* v8 legacy layout fallback: Android 4.4 / old WebView */\n.reel-stage.is-overview .reel-overview{display:flex!important;flex-wrap:wrap!important;align-items:flex-start!important;justify-content:center!important}\n.reel-stage.is-overview .overview-step{flex:0 0 19%!important;width:19%!important;max-width:19%!important}\n.stamp-grid{display:flex!important;flex-wrap:wrap!important;gap:5px}\n.stamp-grid .stamp-btn{width:31%!important;flex:0 0 31%!important}\n@media(max-width:900px){.reel-stage.is-overview .overview-step{flex-basis:31.5%!important;width:31.5%!important;max-width:31.5%!important}}\n@media(max-width:720px){.reel-stage.is-overview .overview-step{flex-basis:47%!important;width:47%!important;max-width:47%!important}.stamp-grid .stamp-btn{width:31%!important;flex-basis:31%!important}}\n'''
if 'v8 legacy layout fallback' not in c:c+=fallback
cp.write_text(c,encoding='utf-8')

# Pre-cache shared interface icons and the most-used stable object art so installed PWA works offline too.
sp=APP/'sw.js'
s=sp.read_text(encoding='utf-8')
needle="'../drawing-writing-foundations/audio/registry.json?v=22'"
extras=[
"'../../../assets/ui-icons/games.svg'","'../../../assets/ui-icons/print.svg'","'../../../assets/ui-icons/draw.svg'","'../../../assets/ui-icons/prev.svg'","'../../../assets/ui-icons/next.svg'","'../../../assets/ui-icons/check.svg'","'../../../assets/ui-icons/restart.svg'","'../../../assets/ui-icons/hint.svg'",
"'../say-and-name/assets/objects/apple.svg'","'../say-and-name/assets/objects/ball.svg'","'../say-and-name/assets/objects/banana.svg'","'../say-and-name/assets/objects/book.svg'","'../say-and-name/assets/objects/car.svg'","'../say-and-name/assets/objects/cat.svg'","'../say-and-name/assets/objects/chair.svg'","'../say-and-name/assets/objects/cup.svg'","'../say-and-name/assets/objects/shoe.svg'","'../say-and-name/assets/objects/spoon.svg'","'../say-and-name/assets/objects/toothbrush.svg'","'../say-and-name/assets/objects/water.svg'",
"'../say-and-name/assets/word-images/corrected-elephant-v24.jpg'","'../say-and-name/assets/word-images/corrected-lion-v24.jpg'","'../say-and-name/assets/word-images/corrected-turtle-v24.jpg'"
]
if needle in s and '../../../assets/ui-icons/games.svg' not in s:
    s=s.replace(needle,needle+','+','.join(extras))
sp.write_text(s,encoding='utf-8')

# Add regression tests for legacy-safe Flexbox fallback and offline stable assets.
t=tp.read_text(encoding='utf-8')
addon="""\ntest('v8 uses a Flexbox fallback for old tablets instead of requiring CSS Grid',()=>{const css=fs.readFileSync('./v8.css','utf8');assert.match(css,/v8 legacy layout fallback/);assert.match(css,/display:flex!important/);assert.match(css,/flex-wrap:wrap!important/);});\ntest('v8 service worker precaches shared legacy-safe icons and object art',()=>{const sw=fs.readFileSync('./sw.js','utf8');assert.match(sw,/assets\\/ui-icons\\/games\\.svg/);assert.match(sw,/say-and-name\\/assets\\/objects\\/cat\\.svg/);});\n"""
if 'Flexbox fallback for old tablets' not in t:t+='\n'+addon
tp.write_text(t,encoding='utf-8')
