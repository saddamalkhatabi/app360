'use strict';
const fs=require('node:fs');
const test=require('node:test');
const assert=require('node:assert/strict');
const games=require('./games-data.js');
test('library has exactly 90 creative games',()=>{assert.equal(games.length,90);assert.equal(new Set(games.map(g=>g.id)).size,90);});
test('four readiness levels remain balanced after the 20 checkmark exercises',()=>{const expected={1:23,2:23,3:22,4:22};for(let level=1;level<=4;level++)assert.equal(games.filter(g=>g.level===level).length,expected[level]);});
test('G71 through G90 are multi-choice mark exercises',()=>{for(let n=71;n<=90;n++){const id='G'+n;const g=games.find(x=>x.id===id);assert.ok(g,id+' missing');assert.equal(g.type,'mark');assert.ok(Array.isArray(g.markOptions)&&g.markOptions.length>=12,id+' needs large option set');assert.ok(g.markOptions.filter(x=>x[1]).length>=3);assert.ok(g.markOptions.filter(x=>!x[1]).length>=3);assert.equal(g.frames.length,5);}});
test('all 90 games use supported direct play types and paper materials',()=>{const supported=new Set(['choice','match','sort','dots','path','pattern','memory','draw','order','puzzle','create','mark']);for(const g of games){assert.ok(supported.has(g.type),g.id+' unsupported');assert.ok(Array.isArray(g.materials)&&g.materials.length>=1);assert.equal(g.frames.length,5);}});
test('mark engine supports large selections, target toggling and printable checkboxes',()=>{const js=fs.readFileSync('./app.js','utf8');const css=fs.readFileSync('./styles.css','utf8')+fs.readFileSync('./v8.css','utf8');assert.match(js,/function buildMark\(box,g\)/);assert.match(js,/function markWorksheetSVG\(g\)/);assert.match(js,/g\.type==='mark'/);assert.match(js,/تحقق من الاختيارات/);assert.match(css,/\.mark-option/);});
test('five-step overview is the default and single-step view expands only on demand',()=>{const js=fs.readFileSync('./app.js','utf8');assert.match(js,/function setupReel\(\)/);assert.match(js,/showOverview\(\)\}/);assert.match(js,/reel-stage is-overview/);assert.match(js,/reel-stage is-single/);assert.doesNotMatch(js,/if\(compactReel\(\)\)\{show\(0\);play\(\)\}else showOverview\(\)/);});
test('shared name audio remains centralized',()=>{const js=fs.readFileSync('./app.js','utf8');const html=fs.readFileSync('./index.html','utf8');assert.match(js,/function speakCheer\(\)/);assert.match(html,/Audio360Base/);assert.match(html,/drawing-writing-foundations\/audio-v21\.js/);});

test('dots and paths share one geometry between viewer canvas and printable lesson',()=>{const js=fs.readFileSync('./app.js','utf8');assert.match(js,/function tracePoints\(g\)/);assert.match(js,/function tracePoint\(pt,w,h\)/);assert.match(js,/function traceSvg\(g,i\)/);assert.match(js,/return traceSvg\(g,i\)/);assert.match(js,/paintGuide\(\)/);assert.match(js,/ابدأ من الدائرة الحمراء رقم 1/);});
test('all trace games contain usable ordered coordinates',()=>{for(const g of games.filter(x=>x.type==='dots'||x.type==='path')){const pts=g.type==='dots'?g.points:g.path;assert.ok(Array.isArray(pts)&&pts.length>=3,g.id+' missing trace points');for(const p of pts){assert.ok(Array.isArray(p)&&p.length===2);assert.ok(p[0]>=0&&p[0]<=100&&p[1]>=0&&p[1]<=100,g.id+' point out of range');}}});
test('v6 overview removes forced tall thumbnails and adds tablet 3 by 2 clarity grid',()=>{const css=fs.readFileSync('./styles.css','utf8');assert.match(css,/v6: synchronized dots and paths/);assert.match(css,/grid-template-columns:repeat\(3,minmax\(0,1fr\)\)/);assert.match(css,/height:auto!important/);});

test('v7 checkboxes stay visually subordinate to the child choice',()=>{const css=fs.readFileSync('./styles.css','utf8');const js=fs.readFileSync('./app.js','utf8');assert.match(css,/child-friendly subordinate checkboxes/);assert.match(css,/width:22px;height:22px/);assert.match(css,/font-size:40px/);assert.match(js,/انظر إلى الصورة أولًا/);assert.match(js,/width=\"24\" height=\"24\"/);});


test('v8 opens games directly and exposes previous next game navigation',()=>{const js=fs.readFileSync('./app.js','utf8');assert.match(js,/function navigateGame\(delta\)/);assert.match(js,/id="prevGame"/);assert.match(js,/id="nextGame"/);assert.match(js,/openWorksheetDesigner\(g\)/);});
test('v8 reel overview has dynamic height and single-step expansion',()=>{const js=fs.readFileSync('./app.js','utf8');const css=fs.readFileSync('./v8.css','utf8');assert.match(js,/reel-stage is-overview/);assert.match(js,/reel-stage is-single/);assert.match(css,/height:auto!important/);});
test('v8 checkmark indicator is subordinate and below the visual target',()=>{const css=fs.readFileSync('./v8.css','utf8');assert.match(css,/\.mark-box\{position:absolute/);assert.match(css,/bottom:7px/);assert.match(css,/width:18px/);});
test('v8 provides A4 worksheet design tools and reuses stable say-and-name assets',()=>{const js=fs.readFileSync('./app.js','utf8');assert.match(js,/function openWorksheetDesigner\(game\)/);assert.match(js,/1\.4142/);assert.match(js,/say-and-name\/assets\/objects/);assert.match(js,/corrected-elephant-v24\.jpg/);});
test('shared ui icon library exists for legacy-safe navigation',()=>{for(const f of ['games.svg','print.svg','draw.svg','prev.svg','next.svg','check.svg'])assert.ok(fs.existsSync('../../../assets/ui-icons/'+f),f+' missing');});


test('v8 uses a Flexbox fallback for old tablets instead of requiring CSS Grid',()=>{const css=fs.readFileSync('./v8.css','utf8');assert.match(css,/v8 legacy layout fallback/);assert.match(css,/display:flex!important/);assert.match(css,/flex-wrap:wrap!important/);});
test('v8 service worker precaches shared legacy-safe icons and object art',()=>{const sw=fs.readFileSync('./sw.js','utf8');assert.match(sw,/assets\/ui-icons\/games\.svg/);assert.match(sw,/say-and-name\/assets\/objects\/cat\.svg/);});
