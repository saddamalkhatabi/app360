from pathlib import Path
import json,re
ROOT=Path('.')
APP=ROOT/'apps/1-4/screen-to-move'

def rep(s,a,b,n):
    if a not in s: raise SystemExit('missing '+n)
    return s.replace(a,b,1)

# Worksheet controls: visible by default and user-controlled only.
p=APP/'designer-v10.js'; s=p.read_text(encoding='utf-8')
s=rep(s,"  var page=el('wdPage');if(page){page.addEventListener('mousedown',close);page.addEventListener('touchstart',close,false)}\n  var zone=panel.querySelector('.wd-paper-zone');if(zone){zone.addEventListener('mousedown',function(e){if(e.target===zone)close()});zone.addEventListener('touchstart',function(e){if(e.target===zone)close()},false)}\n  close();","  toggle.title='إظهار أو إخفاء الأدوات والإعدادات';\n  open();",'worksheet default settings')
p.write_text(s,encoding='utf-8')

# Electronic game designer: visible by default and no automatic hiding from board interactions.
p=APP/'game-designer-v10.js'; s=p.read_text(encoding='utf-8')
s=s.replace(";renderBoard();closeSettings();if(e.preventDefault)e.preventDefault()",";renderBoard();if(e.preventDefault)e.preventDefault()")
s=s.replace(";renderBoard();closeSettings()}",";renderBoard()}")
s=rep(s,"board.onmousedown=function(e){if(e.target===board||e.target===el('gdItems')||e.target===el('gdEmpty')){S.selected=null;renderBoard()}closeSettings()};board.ontouchstart=function(){closeSettings()};","board.onmousedown=function(e){if(e.target===board||e.target===el('gdItems')||e.target===el('gdEmpty')){S.selected=null;renderBoard()}};",'game board auto close')
s=rep(s,"renderBoard();ensureRatio(el('gdBoard'),W,H);closeSettings()}","renderBoard();ensureRatio(el('gdBoard'),W,H);openSettings()}",'game settings default open')
p.write_text(s,encoding='utf-8')

# Move designer invitation to the bottom of the game library and reframe it.
p=APP/'app.js'; s=p.read_text(encoding='utf-8')
start=s.index('function renderLibrary(){')
end=s.index('function renderReel(g){',start)
new="""function renderLibrary(){stopReel();state.game=null;state.mode=null;state.round=null;var list=currentGames(),total=GAMES.length,h='<section class=\"hero compact-hero\"><div><span class=\"hero-badge\">'+total+' لعبة عملية</span><h2>اختر لعبة وابدأ مباشرة</h2><p>كل بطاقة لها صورة خاصة توضّح فكرة اللعبة، واللعبة نفسها تظهر أولًا ثم الشرح والطباعة.</p></div><div class=\"hero-mini\"><b>'+list.length+'</b><span>في '+levelLabel(state.level)+'</span></div></section><div class=\"level-tabs\">';for(var i=1;i<=4;i++)h+='<button class=\"chip '+(i===state.level?'active':'')+'\" data-level=\"'+i+'\"><b>'+levelLabel(i)+'</b><small>'+levelAge(i)+'</small></button>';h+='</div><div class=\"library-head\"><div><h2>'+levelLabel(state.level)+'</h2><p>'+levelHelp(state.level)+'</p></div><b>'+list.length+' ألعاب</b></div><div class=\"games-grid\">';list.forEach(function(g){h+='<button class=\"game-card\" data-game=\"'+g.id+'\"><div class=\"game-art game-cover-art\"><img class=\"game-cover\" src=\"assets/game-covers/'+g.id+'.svg\" alt=\"صورة لعبة '+esc(g.title)+'\"></div><div class=\"game-body\"><b>'+esc(g.title)+'</b><div class=\"meta\"><span>'+esc(g.topic)+'</span><span>'+esc(g.id)+'</span></div><div class=\"play-now\">ابدأ اللعبة الآن</div></div></button>'});h+='</div><section class=\"library-designer-feature library-designer-footer\"><div class=\"designer-invite-copy\"><span class=\"designer-invite-kicker\">لم تجد اللعبة التي تريدها؟</span><h3>صمّم لعبتك أنت في مختبر 360</h3><p>أنشئ لعبة إلكترونية قابلة للتجربة والحفظ والطباعة، أو صمّم ورقة لعب A4 خاصة بك من مكتبة الرسومات والقوالب.</p></div><div class=\"library-designer-actions\"><button id=\"libraryGameDesigner\" class=\"game\">صمّم لعبة إلكترونية</button><button id=\"libraryDesigner\" class=\"paper\">صمّم ورقة لعب</button></div></section>';root.innerHTML=h;if(el('libraryDesigner'))el('libraryDesigner').onclick=function(){launchWorksheetDesigner(null)};if(el('libraryGameDesigner'))el('libraryGameDesigner').onclick=function(){if(window.App360GameDesigner&&window.App360GameDesigner.open)window.App360GameDesigner.open()};arr(root.querySelectorAll('[data-level]')).forEach(function(b){b.onclick=function(){state.level=Number(this.getAttribute('data-level'));db.prefs.level=state.level;saveStore();renderLibrary()}});arr(root.querySelectorAll('[data-game]')).forEach(function(b){b.onclick=function(){openGame(this.getAttribute('data-game'))}})}
"""
s=s[:start]+new+s[end:]
p.write_text(s,encoding='utf-8')

# Stronger visible copy, bottom invitation, explicit old-browser fallbacks.
p=APP/'v10.css'; css=p.read_text(encoding='utf-8')
css += """
/* v11: user-controlled visible settings + bottom create-your-own invitation */
.library-designer-footer{margin:28px 0 10px!important;padding:20px!important;background:#fff8cf!important;border:3px solid #0f8f8a!important;box-shadow:0 7px 22px #00000018!important}.library-designer-footer .designer-invite-copy{min-width:0}.library-designer-footer .designer-invite-kicker{display:inline-block;background:#17302f;color:#fff;border-radius:999px;padding:5px 10px;font-weight:900;font-size:12px;margin-bottom:7px}.library-designer-footer h3{color:#17302f!important;background:transparent!important;font-size:23px!important;font-weight:900!important;line-height:1.35;margin:0 0 6px!important}.library-designer-footer p{color:#36514f!important;font-size:14px!important}.library-designer-footer .library-designer-actions{justify-content:flex-end}.library-designer-footer .library-designer-actions button{font-size:14px;min-height:48px;padding:10px 16px;border-width:2px}.library-designer-footer .library-designer-actions .game{background:#7c3aed!important;color:#fff!important}.library-designer-footer .library-designer-actions .paper{background:#ffd54f!important;color:#17302f!important}
.wd-settings-toggle.open:after,.gd-settings-toggle.open:after{content:' · إخفاء';font-size:10px;font-weight:800}.wd-settings-toggle:not(.open):after,.gd-settings-toggle:not(.open):after{content:' · إظهار';font-size:10px;font-weight:800}
/* Android 4.4 / older WebKit fallbacks: avoid depending on inset, gap or modern aspect-ratio. */
.gd-empty{top:0!important;right:0!important;bottom:0!important;left:0!important}.wd-settings-drawer,.gd-settings{-webkit-overflow-scrolling:touch}.library-designer-feature,.library-designer-actions,.gd-two,.gd-main-actions,.gd-board-wrap,.gd-item,.gdp-head,.gdp-bins{display:-webkit-flex;display:flex}.library-designer-feature{-webkit-align-items:center;align-items:center}.library-designer-actions{-webkit-flex-wrap:wrap;flex-wrap:wrap}.gd-two label{-webkit-flex:1;flex:1}.gd-board-wrap{-webkit-align-items:center;align-items:center;-webkit-justify-content:center;justify-content:center}
@media(max-width:720px){.library-designer-footer{padding:14px!important}.library-designer-footer h3{font-size:19px!important}.library-designer-footer .library-designer-actions button{width:100%;display:block}.wd-settings-drawer.open,.gd-settings.open{display:block!important}}
"""
p.write_text(css,encoding='utf-8')

# Version/cache references.
p=APP/'index.html'; h=p.read_text(encoding='utf-8')
h=h.replace('?v=10','?v=11')
p.write_text(h,encoding='utf-8')

p=APP/'manifest.webmanifest'; m=json.loads(p.read_text(encoding='utf-8'))
m['start_url']='./index.html?v=11'
m['description']='90 لعبة إبداعية مع مصمم أوراق ومصمم ألعاب إلكترونية؛ الإعدادات ظاهرة افتراضيًا ويمكن للمستخدم إخفاؤها، مع دعم الأجهزة القديمة.'
p.write_text(json.dumps(m,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

p=APP/'sw.js'; sw=p.read_text(encoding='utf-8')
sw=sw.replace("screen-to-move-v10","screen-to-move-v11").replace('?v=10','?v=11')
p.write_text(sw,encoding='utf-8')

p=APP/'package.json'; pkg=json.loads(p.read_text(encoding='utf-8'));pkg['version']='0.11.0';p.write_text(json.dumps(pkg,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

p=APP/'app.json'; a=json.loads(p.read_text(encoding='utf-8'));a['version']=11;a['implementation']['state']='live-v11-visible-user-controlled-settings-and-bottom-designer-invitation';a['implementation']['features'] += ['worksheet and electronic game settings are visible by default and hidden only by explicit user action','bottom-of-library create-your-own invitation with both electronic-game and paper-game designer actions','explicit older-WebKit flex and positioning fallbacks for designer controls'];p.write_text(json.dumps(a,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

# Tests.
p=APP/'app.test.js'; t=p.read_text(encoding='utf-8')
t += """
test('v11 worksheet and electronic game settings open by default and remain user controlled',()=>{const w=fs.readFileSync('./designer-v10.js','utf8');const g=fs.readFileSync('./game-designer-v10.js','utf8');assert.match(w,/toggle\.title=.*إظهار أو إخفاء/);assert.match(w,/open\(\);/);assert.doesNotMatch(w,/page\.addEventListener\('mousedown',close/);assert.match(g,/ensureRatio\(el\('gdBoard'\),W,H\);openSettings\(\)/);assert.doesNotMatch(g,/board\.ontouchstart=function\(\)\{closeSettings/);});
test('v11 library places create-your-own designer invitation after the game grid with both designer buttons',()=>{const js=fs.readFileSync('./app.js','utf8');const iGrid=js.indexOf("h+='</div><section class=\\\"library-designer-feature library-designer-footer");assert.ok(iGrid>0);assert.match(js,/لم تجد اللعبة التي تريدها؟/);assert.match(js,/libraryGameDesigner/);assert.match(js,/libraryDesigner/);});
test('v11 designer invitation title has explicit non-white high-contrast color',()=>{const css=fs.readFileSync('./v10.css','utf8');assert.match(css,/library-designer-footer h3\{color:#17302f!important/);assert.match(css,/Android 4\.4 \/ older WebKit fallbacks/);assert.match(css,/display:-webkit-flex;display:flex/);});
test('v11 cache version is active',()=>{const sw=fs.readFileSync('./sw.js','utf8');const html=fs.readFileSync('./index.html','utf8');assert.match(sw,/screen-to-move-v11/);assert.match(html,/v10\.css\?v=11/);});
"""
p.write_text(t,encoding='utf-8')
print('v11 prepared')
