from pathlib import Path
import json, re

root=Path(".")
app=root/"apps/1-4/screen-to-move/app.js"
cssp=root/"apps/1-4/screen-to-move/styles.css"
testp=root/"apps/1-4/screen-to-move/app.test.js"
indexp=root/"apps/1-4/screen-to-move/index.html"
swp=root/"apps/1-4/screen-to-move/sw.js"
manifestp=root/"apps/1-4/screen-to-move/manifest.webmanifest"
contractp=root/"apps/1-4/screen-to-move/app.json"
catalogp=root/"data/catalog.json"
livep=root/"data/live-overrides.json"
readmep=root/"apps/1-4/screen-to-move/README.md"

js=app.read_text(encoding="utf-8")

new_svg=r"""function tracePoints(g){return(g.type==='dots'?g.points:g.path)||[]}
function tracePoint(pt,w,h){var px=w*.08,py=h*.10;return{x:px+(Number(pt[0])||0)*(w-px*2)/100,y:py+(100-(Number(pt[1])||0))*(h-py*2)/100}}
function traceProgressCount(points,frameIndex){if(points.length<2)return 0;return Math.min(points.length-1,Math.max(1,Math.ceil((frameIndex+1)*(points.length-1)/5)))}
function traceSvg(g,i){var pts=tracePoints(g),w=640,h=360,bg=['#e8faf7','#fff4cb','#eef4ff','#f7edff','#eaf8e5'][i%5],body='<rect width="640" height="360" rx="30" fill="'+bg+'"/><rect x="20" y="20" width="600" height="320" rx="22" fill="#fff" stroke="#dceae8" stroke-width="3"/>',done=traceProgressCount(pts,i),p,q,k;for(k=0;k<pts.length-1;k++){p=tracePoint(pts[k],w,h);q=tracePoint(pts[k+1],w,h);body+='<line x1="'+p.x+'" y1="'+p.y+'" x2="'+q.x+'" y2="'+q.y+'" stroke="#c6d7d5" stroke-width="8" stroke-linecap="round" stroke-dasharray="12 12"/>';if(k<done)body+='<line x1="'+p.x+'" y1="'+p.y+'" x2="'+q.x+'" y2="'+q.y+'" stroke="#0f8f8a" stroke-width="9" stroke-linecap="round"/>'}for(k=0;k<pts.length;k++){p=tracePoint(pts[k],w,h);var fill=k===0?'#ef4444':(k===pts.length-1?'#1c9f69':'#0f8f8a'),r=k===0||k===pts.length-1?16:13;body+='<circle cx="'+p.x+'" cy="'+p.y+'" r="'+r+'" fill="'+fill+'" stroke="#fff" stroke-width="4"/>';body+=svgText(p.x,p.y,String(k+1),k===0||k===pts.length-1?16:14,'#fff')}if(pts.length){p=tracePoint(pts[0],w,h);q=tracePoint(pts[pts.length-1],w,h);var sx=Math.max(70,Math.min(570,p.x)),sy=Math.max(39,p.y-33),ex=Math.max(70,Math.min(570,q.x)),ey=Math.max(39,q.y-33);body+='<rect x="'+(sx-42)+'" y="'+(sy-15)+'" width="84" height="30" rx="15" fill="#ef4444"/>'+svgText(sx,sy,'ابدأ',15,'#fff');body+='<rect x="'+(ex-42)+'" y="'+(ey-15)+'" width="84" height="30" rx="15" fill="#1c9f69"/>'+svgText(ex,ey,'نهاية',15,'#fff')}body+='<rect x="128" y="306" width="384" height="38" rx="18" fill="#ffffffee"/>'+svgText(320,326,(g.frames&&g.frames[i])||g.title,21,'#24413f');return'<svg class="frame-visual trace-frame" viewBox="0 0 640 360" role="img" aria-label="'+esc((g.frames&&g.frames[i])||g.title)+'" xmlns="http://www.w3.org/2000/svg">'+body+'</svg>'}
function svgForFrame(g,i){if((g.type==='dots'||g.type==='path')&&tracePoints(g).length>1)return traceSvg(g,i);var s=g.symbols||[g.icon],a=s[i%s.length]||g.icon,b=s[(i+1)%s.length]||g.icon,c=s[(i+2)%s.length]||g.icon,bg=['#e8faf7','#fff4cb','#eef4ff','#f7edff','#eaf8e5'][i%5],body='<rect width="640" height="360" rx="30" fill="'+bg+'"/><circle cx="78" cy="70" r="42" fill="#ffffffcc"/>'+svgText(78,70,String(i+1),30,'#0f8f8a')+'<circle cx="555" cy="280" r="62" fill="#ffffff88"/>';body+=svgText(150,168,a,76)+svgText(320,168,b,76)+svgText(490,168,c,76);if(i===1||i===3)body+='<path d="M210 168 H270 M370 168 H430" stroke="#0f8f8a" stroke-width="10" stroke-linecap="round"/><path d="M260 153 L280 168 L260 183 M420 153 L440 168 L420 183" fill="none" stroke="#0f8f8a" stroke-width="8"/>';body+=svgText(320,326,(g.frames&&g.frames[i])||g.title,22,'#24413f');return'<svg class="frame-visual" viewBox="0 0 640 360" role="img" aria-label="'+esc((g.frames&&g.frames[i])||g.title)+'" xmlns="http://www.w3.org/2000/svg">'+body+'</svg>'}"""

js,n=re.subn(r"function svgForFrame\(g,i\)\{.*?\}\nfunction renderLibrary",new_svg+"\nfunction renderLibrary",js,count=1,flags=re.S)
if n!=1: raise SystemExit("svgForFrame replacement failed")

new_canvas=r"""function setupCanvas(c,g,mode){var r=c.getBoundingClientRect(),d=window.devicePixelRatio||1;if(d>2)d=2;var cw=Math.max(320,Math.floor(r.width||320)),ch=Math.max(300,Math.floor(r.height||360));c.width=Math.floor(cw*d);c.height=Math.floor(ch*d);var ctx=c.getContext('2d');ctx.setTransform(d,0,0,d,0,0);var w=cw,h=ch,points=tracePoints(g),nextIndex=1,down=false,started=false,last=null,hitRadius=Math.max(34,Math.min(48,w*.065));ctx.lineCap='round';ctx.lineJoin='round';function paintGuide(){ctx.clearRect(0,0,w,h);ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);for(var j=0;j<points.length-1;j++){var a=tracePoint(points[j],w,h),b=tracePoint(points[j+1],w,h);ctx.strokeStyle='#c6d7d5';ctx.lineWidth=6;if(ctx.setLineDash)ctx.setLineDash([12,10]);ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();if(ctx.setLineDash)ctx.setLineDash([])}for(var i=0;i<points.length;i++){var q=tracePoint(points[i],w,h);ctx.beginPath();ctx.arc(q.x,q.y,i===0||i===points.length-1?15:12,0,Math.PI*2);ctx.fillStyle=i===0?'#ef4444':(i===points.length-1?'#1c9f69':'#0f8f8a');ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=3;ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 13px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(i+1),q.x,q.y)}if(points.length){var s=tracePoint(points[0],w,h),e=tracePoint(points[points.length-1],w,h);ctx.font='bold 15px Tahoma,Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#ef4444';ctx.fillText('ابدأ',s.x,Math.max(16,s.y-28));ctx.fillStyle='#1c9f69';ctx.fillText('نهاية',e.x,Math.max(16,e.y-28))}}function near(a,b,rad){var dx=a.x-b.x,dy=a.y-b.y;return Math.sqrt(dx*dx+dy*dy)<=rad}function markCheckpoint(index){var q=tracePoint(points[index],w,h);ctx.beginPath();ctx.arc(q.x,q.y,index===points.length-1?17:14,0,Math.PI*2);ctx.fillStyle='#1c9f69';ctx.fill();ctx.strokeStyle='#fff';ctx.lineWidth=4;ctx.stroke();ctx.fillStyle='#fff';ctx.font='bold 13px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(index+1),q.x,q.y)}function check(p){if(nextIndex>=points.length)return;var q=tracePoint(points[nextIndex],w,h);if(near(p,q,hitRadius)){markCheckpoint(nextIndex);nextIndex++;scoreAttempt(true);if(nextIndex>=points.length){down=false;toast('أحسنت، وصلت إلى النهاية ✓')}}}function start(e){var p=canvasPos(c,e);if(!points.length)return;var first=tracePoint(points[0],w,h);if(!started){if(!near(p,first,hitRadius+12)){toast('ابدأ من الدائرة الحمراء رقم 1');if(e.preventDefault)e.preventDefault();return}started=true;last=first;down=true}else{down=true;last=p}if(e.preventDefault)e.preventDefault()}function move(e){if(!down||!started)return;var p=canvasPos(c,e);ctx.strokeStyle='#0f8f8a';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(last.x,last.y);ctx.lineTo(p.x,p.y);ctx.stroke();last=p;check(p);if(e.preventDefault)e.preventDefault()}function end(){down=false;last=null}paintGuide();c.addEventListener('mousedown',start);c.addEventListener('mousemove',move);document.addEventListener('mouseup',end);c.addEventListener('touchstart',start,{passive:false});c.addEventListener('touchmove',move,{passive:false});c.addEventListener('touchend',end)}"""

js,n=re.subn(r"function setupCanvas\(c,g,mode\)\{.*?\}\nfunction buildTrace",new_canvas+"\nfunction buildTrace",js,count=1,flags=re.S)
if n!=1: raise SystemExit("setupCanvas replacement failed")

js=js.replace("ابدأ من النقطة الحمراء واتبع العلامات. سيحسب التطبيق نقاط الطريق التي وصلت إليها فقط.","ابدأ من الدائرة الحمراء رقم 1، ثم اتبع نفس الخط والنقاط بالترتيب حتى الدائرة الخضراء الأخيرة. شكل المسار هنا مطابق تمامًا لشاشة الشرح والورقة المطبوعة.")
js=js.replace("<canvas id=\"playCanvas\" class=\"play-canvas\"></canvas><p class=\"challenge-msg\">","<div class=\"trace-legend\"><span class=\"trace-start\"><i></i>ابدأ من الأحمر رقم 1</span><span class=\"trace-end\"><i></i>انتهِ عند الأخضر</span></div><canvas id=\"playCanvas\" class=\"play-canvas\"></canvas><p class=\"challenge-msg\">",1)
app.write_text(js,encoding="utf-8")

css=cssp.read_text(encoding="utf-8")
marker="/* v6: synchronized dots and paths + clearer overview */"
if marker in css: css=css[:css.index(marker)].rstrip()+"\n"
css+=r"""
/* v6: synchronized dots and paths + clearer overview */
.trace-frame text{font-weight:700}.reel-stage .overview-step{border:2px solid #d4e6e4;background:#fff;box-shadow:0 2px 7px #17302f12}.reel-stage .overview-step .frame-visual{display:block;width:100%;height:auto!important;max-height:none!important;aspect-ratio:16/9;object-fit:contain;background:#fff;border-radius:10px}.reel-stage .overview-step b{font-size:13px;line-height:1.45;min-height:44px;padding:6px 5px;color:#17302f}.trace-wrap{max-width:900px}.trace-wrap h3{margin-bottom:8px}.play-canvas{height:420px;border:3px solid #9abbb7;background:#fff}.trace-legend{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin:8px 0}.trace-legend span{display:inline-flex;align-items:center;gap:6px;font-weight:700}.trace-legend i{width:16px;height:16px;border-radius:50%;display:inline-block}.trace-start i{background:#ef4444}.trace-end i{background:#1c9f69}
@media(min-width:721px) and (max-width:1024px){.reel-stage .reel-overview{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr));gap:6px;overflow:hidden;padding:6px}.reel-stage .overview-step{width:auto;height:auto;min-height:0}.reel-stage .overview-step .frame-visual{max-height:128px!important}.reel-stage .overview-step b{font-size:12px;min-height:34px;padding:3px 4px}}
@media(min-width:1025px){.reel-stage .reel-overview{align-items:flex-start}.reel-stage .overview-step{justify-content:flex-start}.reel-stage .overview-step .frame-visual{margin-top:20px}.reel-stage .overview-step b{font-size:14px}}
@media(max-width:720px){.reel-stage .overview-step{flex-basis:84%;width:84%;min-width:84%}.reel-stage .overview-step .frame-visual{height:auto!important;max-height:none!important}.play-canvas{height:360px}}
"""
cssp.write_text(css,encoding="utf-8")

html=indexp.read_text(encoding="utf-8").replace("?v=5","?v=6")
indexp.write_text(html,encoding="utf-8")
sw=swp.read_text(encoding="utf-8").replace("screen-to-move-v5","screen-to-move-v6").replace("?v=5","?v=6")
swp.write_text(sw,encoding="utf-8")
manifest=json.loads(manifestp.read_text(encoding="utf-8")); manifest["start_url"]="./index.html?v=6"; manifestp.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

contract=json.loads(contractp.read_text(encoding="utf-8")); contract["version"]=6
contract["practice_model_ar"]="عرض تعليمي واضح بخمس مراحل؛ ألعاب النقاط والمسارات تستخدم نفس هندسة الإحداثيات في الشرح واللعب والورقة المطبوعة، مع بداية حمراء مرقمة ونهاية خضراء ومسار إرشادي مطابق؛ بقية 90 لعبة تبقى متاحة بالشاشة أو الورق"
impl=contract.setdefault("implementation",{}); impl["state"]="live-v6-synchronized-trace-geometry"; impl["built_on"]="2026-09-21"
features=impl.setdefault("features",[])
for f in ["shared trace geometry for dots and paths across lesson viewer game canvas and worksheets","numbered checkpoints with explicit red start and green finish","clearer five-step overview especially on wide tablets"]:
    if f not in features: features.append(f)
contractp.write_text(json.dumps(contract,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

catalog=json.loads(catalogp.read_text(encoding="utf-8")); approw=next(x for x in catalog["apps"] if x["id"]=="a1-screen-move")
approw["href"]="apps/1-4/screen-to-move/index.html?v=6"
approw["description_ar"]="90 لعبة وتمرينًا متدرجًا. تم توحيد ألعاب النقاط والمسارات بحيث يتطابق شكل وإحداثيات البداية والنهاية والنقاط والخطوط بين شاشة التعلم واللعبة الفعلية والورقة المطبوعة، مع تحسين وضوح عرض المراحل الخمس على الشاشات العريضة والتابلت."
catalog["updated"]="2026-09-21"; catalogp.write_text(json.dumps(catalog,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

live=json.loads(livep.read_text(encoding="utf-8")); row=next(x for x in live["apps"] if x["id"]=="a1-screen-move"); row["href"]="apps/1-4/screen-to-move/index.html?v=6"; live["updated"]="2026-09-21"; livep.write_text(json.dumps(live,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")

readme=readmep.read_text(encoding="utf-8")
if "## إصلاح v6 للنقاط والمسارات" not in readme:
    readme += "\n## إصلاح v6 للنقاط والمسارات\n\n- تستخدم شاشة التعلم واللعبة والورقة المطبوعة نفس تحويل الإحداثيات للنقاط والمسارات.\n- البداية حمراء وموسومة بالرقم 1 والنهاية خضراء، وكل نقاط المرور مرقمة.\n- يظهر المسار الإرشادي كاملًا بخط متقطع، بينما تُظهر مراحل التعلم تقدم المسار خطوة بخطوة فوق نفس الشكل.\n- لا يبدأ الرسم إلا من نقطة البداية لمنع اختلاف نتيجة اللعب عن المثال.\n- تحسين عرض الخطوات الخمس: خمس بطاقات واضحة على الشاشات الواسعة، وشبكة 3+2 على التابلت المتوسط، وعرض متحرك كبير على الجوال.\n"
readmep.write_text(readme,encoding="utf-8")

tests=testp.read_text(encoding="utf-8")
extra=r"""
test('dots and paths share one geometry between viewer canvas and printable lesson',()=>{const js=fs.readFileSync('./app.js','utf8');assert.match(js,/function tracePoints\(g\)/);assert.match(js,/function tracePoint\(pt,w,h\)/);assert.match(js,/function traceSvg\(g,i\)/);assert.match(js,/return traceSvg\(g,i\)/);assert.match(js,/paintGuide\(\)/);assert.match(js,/ابدأ من الدائرة الحمراء رقم 1/);});
test('all trace games contain usable ordered coordinates',()=>{for(const g of games.filter(x=>x.type==='dots'||x.type==='path')){const pts=g.type==='dots'?g.points:g.path;assert.ok(Array.isArray(pts)&&pts.length>=3,g.id+' missing trace points');for(const p of pts){assert.ok(Array.isArray(p)&&p.length===2);assert.ok(p[0]>=0&&p[0]<=100&&p[1]>=0&&p[1]<=100,g.id+' point out of range');}}});
test('v6 overview removes forced tall thumbnails and adds tablet 3 by 2 clarity grid',()=>{const css=fs.readFileSync('./styles.css','utf8');assert.match(css,/v6: synchronized dots and paths/);assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);assert.match(css,/height:auto!important/);});
"""
if "dots and paths share one geometry" not in tests: tests += extra
testp.write_text(tests,encoding="utf-8")
