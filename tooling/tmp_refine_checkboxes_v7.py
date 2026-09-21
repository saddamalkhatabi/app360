from pathlib import Path
import json, re

base = Path('apps/1-4/screen-to-move')

css = base.joinpath('styles.css').read_text()
marker = '/* v7: child-friendly subordinate checkboxes */'
if marker not in css:
    css += r'''

/* v7: child-friendly subordinate checkboxes */
.mark-option{position:relative;gap:0;padding:20px 12px 12px;overflow:hidden}
.mark-option .mark-box{position:absolute;top:8px;right:8px;display:flex;flex:0 0 22px;width:22px;height:22px;min-width:22px;min-height:22px;border-width:2px;border-radius:5px;font-size:15px;line-height:1;background:#fff;box-shadow:0 1px 3px #00000010}
.mark-option .mark-value{display:flex;align-items:center;justify-content:center;width:100%;min-height:72px;font-size:34px;line-height:1.25;text-align:center}
.level-1 .mark-option{padding-top:22px}
.level-1 .mark-option .mark-value{font-size:40px;min-height:82px}
.mark-option.selected .mark-box{background:#fff7bd;border-color:#a98200;color:#665200}
.mark-option.checked .mark-box{background:#1c9f69;border-color:#1c9f69;color:#fff}
.mark-option.wrong .mark-box{background:#ef6767;border-color:#ef6767;color:#fff}
@media(max-width:760px){
  .mark-option{padding:18px 8px 9px}
  .mark-option .mark-box{top:6px;right:6px;width:20px;height:20px;min-width:20px;min-height:20px;font-size:13px;border-width:2px}
  .mark-option .mark-value{font-size:28px;min-height:66px}
  .level-1 .mark-option .mark-value{font-size:34px;min-height:76px}
}
@media(max-width:430px){
  .mark-option .mark-box{width:18px;height:18px;min-width:18px;min-height:18px;font-size:12px}
  .mark-option .mark-value{font-size:26px}
  .level-1 .mark-option .mark-value{font-size:32px}
}
'''
base.joinpath('styles.css').write_text(css)

app = base.joinpath('app.js').read_text()
new_fn = r'''function markWorksheetSVG(g){var opts=g.markOptions||[],cols=4,cardW=220,cardH=205,startX=95,startY=330,gapX=15,gapY=18,body='<rect width="1120" height="1584" fill="white"/><rect x="45" y="45" width="1030" height="1494" rx="34" fill="#fbfefd" stroke="#0f8f8a" stroke-width="5"/>'+svgText(560,105,'تمييز واختيار بعلامة صح',34,'#0f8f8a')+svgText(560,168,g.title,42,'#17302f')+svgText(560,225,g.prompt||'ضع علامة صح على الاختيارات المطلوبة',27,'#24413f')+svgText(560,275,'انظر إلى الصورة أولًا، ثم ضع ✓ داخل المربع الصغير',23,'#647b79');for(var i=0;i<opts.length;i++){var row=Math.floor(i/cols),col=i%cols,x=startX+col*(cardW+gapX),y=startY+row*(cardH+gapY),value=String(opts[i][0]);body+='<rect x="'+x+'" y="'+y+'" width="'+cardW+'" height="'+cardH+'" rx="22" fill="#fff" stroke="#d5e8e5" stroke-width="4"/>';body+='<rect x="'+(x+cardW-38)+'" y="'+(y+12)+'" width="24" height="24" rx="4" fill="#fff" stroke="#789995" stroke-width="3"/>';body+=svgText(x+cardW/2,y+cardH/2+10,value,value.length>5?31:46,'#17302f')}var rows=Math.ceil(opts.length/cols),noteY=Math.min(1460,startY+rows*(cardH+gapY)+35);body+=svgText(560,noteY,'المربع صغير حتى يبقى التركيز على الصورة أو الشيء نفسه',22,'#647b79');return'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1120 1584">'+body+'</svg>'}'''
pattern = r'function markWorksheetSVG\(g\)\{.*?\}(?=\nfunction worksheetSVG\(g\))'
app2, count = re.subn(pattern, new_fn, app, count=1, flags=re.S)
if count != 1:
    raise SystemExit('markWorksheetSVG replacement failed: %s' % count)
base.joinpath('app.js').write_text(app2)

base.joinpath('index.html').write_text(base.joinpath('index.html').read_text().replace('?v=6', '?v=7'))
base.joinpath('manifest.webmanifest').write_text(base.joinpath('manifest.webmanifest').read_text().replace('./index.html?v=6', './index.html?v=7'))
base.joinpath('sw.js').write_text(base.joinpath('sw.js').read_text().replace('app360-app-screen-to-move-v6', 'app360-app-screen-to-move-v7').replace('?v=6', '?v=7'))

meta = json.loads(base.joinpath('app.json').read_text())
meta['version'] = 7
meta['implementation']['state'] = 'live-v7-child-friendly-small-checkboxes'
feat = 'small subordinate checkboxes keep the visual object dominant on screen and print'
if feat not in meta['implementation'].setdefault('features', []):
    meta['implementation']['features'].append(feat)
meta['practice_model_ar'] = 'في تمارين علامة الصح يبقى العنصر أو الصورة هو الأكبر والأوضح، بينما يظهر مربع ✓ صغيرًا وثانويًا في زاوية البطاقة على الشاشة والورق حتى لا يربك الطفل؛ وتبقى بقية الألعاب والمسارات المتطابقة متاحة كما هي.'
base.joinpath('app.json').write_text(json.dumps(meta, ensure_ascii=False, indent=2) + '\n')

for path in [Path('data/catalog.json'), Path('data/live-overrides.json')]:
    if path.exists():
        path.write_text(path.read_text().replace('screen-to-move/index.html?v=6', 'screen-to-move/index.html?v=7'))

test = base.joinpath('app.test.js').read_text()
extra = r'''
test('v7 checkboxes stay visually subordinate to the child choice',()=>{const css=fs.readFileSync('./styles.css','utf8');const js=fs.readFileSync('./app.js','utf8');assert.match(css,/child-friendly subordinate checkboxes/);assert.match(css,/width:22px;height:22px/);assert.match(css,/font-size:40px/);assert.match(js,/انظر إلى الصورة أولًا/);assert.match(js,/width=\"24\" height=\"24\"/);});
'''
if 'v7 checkboxes stay visually subordinate' not in test:
    base.joinpath('app.test.js').write_text(test + extra)
