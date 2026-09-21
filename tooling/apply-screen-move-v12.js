'use strict';
const fs=require('node:fs');
const path=require('node:path');
const ROOT=process.cwd();
const APP=path.join(ROOT,'apps/1-4/screen-to-move');
function read(name){return fs.readFileSync(path.join(APP,name),'utf8')}
function write(name,text){fs.writeFileSync(path.join(APP,name),text)}
function escXml(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
const base=require(path.join(APP,'games-data.js'));
const extra=require(path.join(APP,'games-data-v12.js'));
if(extra.length!==80)throw new Error('Expected 80 new games, found '+extra.length);
for(let level=1;level<=4;level++){const n=extra.filter(g=>g.level===level).length;if(n!==20)throw new Error('Level '+level+' expected 20 new games, found '+n)}
const all=base.concat(extra);
if(all.length!==170)throw new Error('Expected 170 games total');
if(new Set(all.map(g=>g.id)).size!==170)throw new Error('Duplicate game ids');
if(new Set(all.map(g=>g.title)).size!==170)throw new Error('Duplicate game titles');

// Generate dedicated, legacy-safe SVG covers for G91-G170.
const coverDir=path.join(APP,'assets/game-covers');fs.mkdirSync(coverDir,{recursive:true});
function visual(type){
  if(type==='choice')return '<rect x="54" y="76" width="84" height="70" rx="14" fill="#fff" stroke="#96b8b4" stroke-width="4"/><rect x="158" y="76" width="84" height="70" rx="14" fill="#e8faf7" stroke="#0f8f8a" stroke-width="5"/><rect x="262" y="76" width="84" height="70" rx="14" fill="#fff" stroke="#96b8b4" stroke-width="4"/><path d="M183 111l14 14 27-31" fill="none" stroke="#16875e" stroke-width="8" stroke-linecap="round"/>';
  if(type==='match')return '<rect x="62" y="70" width="66" height="46" rx="11" fill="#fff" stroke="#7ba5a1" stroke-width="4"/><rect x="62" y="134" width="66" height="46" rx="11" fill="#fff" stroke="#7ba5a1" stroke-width="4"/><rect x="272" y="70" width="66" height="46" rx="11" fill="#fff" stroke="#7ba5a1" stroke-width="4"/><rect x="272" y="134" width="66" height="46" rx="11" fill="#fff" stroke="#7ba5a1" stroke-width="4"/><path d="M128 92 C180 80 220 80 272 92M128 156 C180 170 220 170 272 156" fill="none" stroke="#0f8f8a" stroke-width="5"/>';
  if(type==='sort')return '<rect x="58" y="115" width="120" height="70" rx="15" fill="#eaf8ff" stroke="#3976a8" stroke-width="4"/><rect x="222" y="115" width="120" height="70" rx="15" fill="#fff3da" stroke="#d79228" stroke-width="4"/><circle cx="112" cy="82" r="18" fill="#0f8f8a"/><rect x="264" y="65" width="36" height="36" rx="7" fill="#7c3aed"/>';
  if(type==='pattern')return '<circle cx="80" cy="112" r="22" fill="#ef4444"/><circle cx="145" cy="112" r="22" fill="#2563eb"/><circle cx="210" cy="112" r="22" fill="#ef4444"/><circle cx="275" cy="112" r="22" fill="#2563eb"/><rect x="326" y="88" width="44" height="48" rx="10" fill="#fff" stroke="#0f8f8a" stroke-width="4" stroke-dasharray="6 5"/>';
  if(type==='memory')return '<rect x="72" y="68" width="72" height="58" rx="12" fill="#7c3aed"/><rect x="164" y="68" width="72" height="58" rx="12" fill="#fff" stroke="#7c3aed" stroke-width="4"/><rect x="256" y="68" width="72" height="58" rx="12" fill="#7c3aed"/><rect x="118" y="142" width="72" height="58" rx="12" fill="#fff" stroke="#7c3aed" stroke-width="4"/><rect x="210" y="142" width="72" height="58" rx="12" fill="#7c3aed"/>';
  if(type==='order')return '<circle cx="76" cy="122" r="28" fill="#e8faf7" stroke="#0f8f8a" stroke-width="4"/><circle cx="200" cy="122" r="28" fill="#e8faf7" stroke="#0f8f8a" stroke-width="4"/><circle cx="324" cy="122" r="28" fill="#e8faf7" stroke="#0f8f8a" stroke-width="4"/><path d="M106 122h62m62 0h62" stroke="#0f8f8a" stroke-width="6"/><path d="M160 111l15 11-15 11m124-22 15 11-15 11" fill="none" stroke="#0f8f8a" stroke-width="5"/><text x="76" y="131" text-anchor="middle" font-size="26" font-weight="700" fill="#17302f">1</text><text x="200" y="131" text-anchor="middle" font-size="26" font-weight="700" fill="#17302f">2</text><text x="324" y="131" text-anchor="middle" font-size="26" font-weight="700" fill="#17302f">3</text>';
  if(type==='dots')return '<path d="M72 164 L126 86 L202 144 L278 74 L334 160" fill="none" stroke="#b7cfcc" stroke-width="5" stroke-dasharray="8 8"/><circle cx="72" cy="164" r="13" fill="#ef4444"/><circle cx="126" cy="86" r="11" fill="#0f8f8a"/><circle cx="202" cy="144" r="11" fill="#0f8f8a"/><circle cx="278" cy="74" r="11" fill="#0f8f8a"/><circle cx="334" cy="160" r="13" fill="#16a34a"/>';
  if(type==='path')return '<path d="M62 168 C110 80 160 190 214 106 S306 92 346 54" fill="none" stroke="#0f8f8a" stroke-width="9" stroke-linecap="round" stroke-dasharray="15 10"/><circle cx="62" cy="168" r="15" fill="#ef4444"/><circle cx="346" cy="54" r="15" fill="#16a34a"/>';
  if(type==='mark')return '<rect x="64" y="72" width="74" height="58" rx="10" fill="#fff" stroke="#9bb8b5" stroke-width="4"/><rect x="163" y="72" width="74" height="58" rx="10" fill="#e8faf7" stroke="#0f8f8a" stroke-width="4"/><rect x="262" y="72" width="74" height="58" rx="10" fill="#fff" stroke="#9bb8b5" stroke-width="4"/><rect x="184" y="145" width="30" height="30" rx="5" fill="#fff" stroke="#17302f" stroke-width="4"/><path d="M189 160l7 8 14-18" fill="none" stroke="#16a34a" stroke-width="5"/>';
  return '<rect x="82" y="76" width="94" height="78" rx="16" fill="#7c3aed"/><rect x="168" y="112" width="94" height="78" rx="16" fill="#ffd54f"/><rect x="254" y="76" width="72" height="78" rx="16" fill="#0f8f8a"/>';
}
for(const g of extra){
  const svg='<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 260" role="img" aria-label="'+escXml(g.title)+'"><rect width="400" height="260" rx="28" fill="#f8fcfb"/><rect x="12" y="12" width="376" height="236" rx="22" fill="#fff" stroke="#d5e8e5" stroke-width="3"/><rect x="22" y="20" width="76" height="28" rx="14" fill="#17302f"/><text x="60" y="39" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-size="14" font-weight="700" fill="#fff">'+g.id+'</text>'+visual(g.type)+'<text x="200" y="214" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-size="17" font-weight="700" fill="#17302f">'+escXml(g.title)+'</text><text x="200" y="238" text-anchor="middle" font-family="Tahoma,Arial,sans-serif" font-size="12" fill="#54706d">'+escXml(g.topic)+'</text></svg>';
  fs.writeFileSync(path.join(coverDir,g.id+'.svg'),svg);
}

// Add new covers to the shared designer image library without bloating the original catalog.
const assetJs="(function(root){'use strict';var a=root.ScreenMoveDesignerAssets||[];var x="+JSON.stringify(extra.map(g=>({label:g.title,en:'game '+g.id,tags:g.topic+' '+g.title,category:'أغلفة الألعاب',src:'assets/game-covers/'+g.id+'.svg',file:g.id+'.svg'})))+";for(var i=0;i<x.length;i++)a.push(x[i]);root.ScreenMoveDesignerAssets=a;})(this);\n";
write('designer-assets-v12.js',assetJs);

// Index: load extra games before app.js and extra cover catalog before designers.
let html=read('index.html').replace(/\?v=11/g,'?v=12');
if(html.indexOf('games-data-v12.js')<0)html=html.replace('<script src="games-data.js?v=12"></script>','<script src="games-data.js?v=12"></script>\n<script src="games-data-v12.js?v=12"></script>');
if(html.indexOf('designer-assets-v12.js')<0)html=html.replace('<script src="designer-assets-v9.js?v=12"></script>','<script src="designer-assets-v9.js?v=12"></script>\n<script src="designer-assets-v12.js?v=12"></script>');
write('index.html',html);

// Service worker cache v12 and all new generated covers/data.
let sw=read('sw.js').replace(/screen-to-move-v11/g,'screen-to-move-v12').replace(/\?v=11/g,'?v=12');
sw=sw.replace("'./games-data.js?v=12','./app.js?v=12'","'./games-data.js?v=12','./games-data-v12.js?v=12','./app.js?v=12'");
sw=sw.replace("'./designer-assets-v9.js?v=12','./designer-v9.js?v=12'","'./designer-assets-v9.js?v=12','./designer-assets-v12.js?v=12','./designer-v9.js?v=12'");
if(sw.indexOf("'./assets/game-covers/G91.svg'")<0){const covers=extra.map(g=>"'./assets/game-covers/"+g.id+".svg'").join(',');sw=sw.replace(/\];\nself\.addEventListener\('install'/,','+covers+"];\nself.addEventListener('install'")}
write('sw.js',sw);

// Stable Arabic labels for new symbols on old Android/WebKit when emoji glyphs are missing.
let app=read('app.js');
if(app.indexOf('EXTRA_VISUAL_NAMES_V12')<0){
  const labels={'🧦':'جورب','🧢':'قبعة','🧸':'لعبة','🧼':'صابون','👐':'يدان','🧻':'منشفة','🐝':'نحلة','🌼':'زهرة','🌿':'نبات','😊':'وجه سعيد','👀':'عينان','👃':'أنف','👄':'فم','🌰':'بذرة','⛵':'قارب','🪨':'صخرة','🏁':'نهاية','🚌':'حافلة','🚲':'دراجة','🚂':'قطار','🍽️':'طبق','🛁':'حمام','🥦':'خضار','🧀':'جبن','🍐':'كمثرى','🍇':'عنب','🍉':'بطيخ','🐶':'كلب','🐦':'طائر','🥚':'بيضة','🐣':'فرخ','🐥':'كتكوت','🔧':'أداة','😁':'أسنان','🍲':'طعام','✏️':'قلم','📄':'ورقة','🦈':'قرش','👨‍🍳':'طباخ','👨‍⚕️':'طبيب','🩺':'سماعة طبيب','👷':'عامل','🔨':'مطرقة','☁️':'سحابة','🌧️':'مطر','☂️':'مظلة','💥':'كسر','🧹':'مكنسة','🦋':'فراشة','🎯':'هدف','🏙️':'مدينة','🚦':'إشارة مرور','🏢':'مبنى','🌉':'جسر','🛏️':'سرير','🏗️':'بناء','📝':'خطة','📏':'مسطرة','🧱':'طوب','🏰':'قلعة','🦶':'قدم','🛣️':'طريق'};
  const code="\nvar EXTRA_VISUAL_NAMES_V12="+JSON.stringify(labels)+";for(var v12k in EXTRA_VISUAL_NAMES_V12){if(EXTRA_VISUAL_NAMES_V12.hasOwnProperty(v12k)&&!VISUAL_NAMES[v12k])VISUAL_NAMES[v12k]=EXTRA_VISUAL_NAMES_V12[v12k]}\n";
  app=app.replace(/var VISUAL_NAMES=\{[\s\S]*?\};/,m=>m+code);
}
write('app.js',app);

// Manifest/package/app metadata.
let manifest=JSON.parse(read('manifest.webmanifest'));manifest.start_url='./index.html?v=12';manifest.description='170 لعبة إبداعية متدرجة، 20 لعبة جديدة لكل مستوى، مع مصمم أوراق ومصمم ألعاب إلكترونية ودعم الأجهزة القديمة.';write('manifest.webmanifest',JSON.stringify(manifest,null,2)+'\n');
let pkg=JSON.parse(read('package.json'));pkg.version='0.12.0';write('package.json',JSON.stringify(pkg,null,2)+'\n');
let meta=JSON.parse(read('app.json'));meta.version=12;meta.implementation.state='live-v12-170-progressive-games';meta.implementation.experiments=170;meta.implementation.level_distribution={'1':43,'2':43,'3':42,'4':42};meta.implementation.features.push('80 additional progressive games: exactly 20 new games in each of the four readiness levels');meta.implementation.features.push('new game set spans choice matching sorting patterns memory sequencing dots paths multi-selection and puzzles');meta.implementation.features.push('dedicated legacy-safe SVG cover for every new G91-G170 game');meta.implementation.features.push('Arabic text fallbacks for new game symbols on older Android devices with incomplete emoji fonts');meta.implementation.features.push('new game covers are available inside worksheet and electronic-game designer image libraries');write('app.json',JSON.stringify(meta,null,2)+'\n');

// Tests: treat v12 data as part of the live library and keep historical tests version-tolerant.
let test=read('app.test.js');
test=test.replace("const games=require('./games-data.js');","const games=require('./games-data.js').concat(require('./games-data-v12.js'));");
test=test.replace("test('library has exactly 90 creative games',()=>{assert.equal(games.length,90);assert.equal(new Set(games.map(g=>g.id)).size,90);});","test('library has exactly 170 creative games',()=>{assert.equal(games.length,170);assert.equal(new Set(games.map(g=>g.id)).size,170);});");
test=test.replace("const expected={1:23,2:23,3:22,4:22}","const expected={1:43,2:43,3:42,4:42}");
test=test.replace("test('all 90 games use supported direct play types and paper materials'","test('all 170 games use supported direct play types and paper materials'");
test=test.replace(/screen-to-move-v1\[012\]/g,'screen-to-move-v1[012]');
test=test.replace(/screen-to-move-v1\[01\]/g,'screen-to-move-v1[012]');
test=test.replace(/\?v=1\[012\]/g,'?v=1[012]');
test=test.replace(/\?v=1\[01\]/g,'?v=1[012]');
test=test.replace("test('v11 cache version is active',()=>{const sw=fs.readFileSync('./sw.js','utf8');const html=fs.readFileSync('./index.html','utf8');assert.match(sw,/screen-to-move-v11/);assert.match(html,/v10\\.css\\?v=11/);});","test('v12 cache version is active',()=>{const sw=fs.readFileSync('./sw.js','utf8');const html=fs.readFileSync('./index.html','utf8');assert.match(sw,/screen-to-move-v12/);assert.match(html,/v10\\.css\\?v=12/);});");
if(test.indexOf("v12 adds exactly twenty new games to every readiness level")<0){test += `\n\ntest('v12 adds exactly twenty new games to every readiness level',()=>{const extra=require('./games-data-v12.js');assert.equal(extra.length,80);for(let level=1;level<=4;level++)assert.equal(extra.filter(g=>g.level===level).length,20);assert.equal(extra[0].id,'G91');assert.equal(extra[79].id,'G170');});\ntest('v12 new games have unique titles supported play schemas and five-step guidance',()=>{const extra=require('./games-data-v12.js');const supported=new Set(['choice','match','sort','dots','path','pattern','memory','order','puzzle','mark']);assert.equal(new Set(extra.map(g=>g.title)).size,80);for(const g of extra){assert.ok(supported.has(g.type),g.id);assert.equal(g.frames.length,5,g.id);assert.ok(g.materials.length>=1,g.id);if(g.type==='choice'||g.type==='pattern'){assert.ok(Array.isArray(g.options)&&g.options.length>=3,g.id);assert.ok(Number.isInteger(g.answer),g.id)}if(g.type==='match')assert.ok(g.pairs.length>=3,g.id);if(g.type==='sort')assert.ok(g.bins.length>=2&&g.items.length>=4,g.id);if(g.type==='memory')assert.ok(g.cards.length>=3,g.id);if(g.type==='order')assert.ok(g.order.length>=4,g.id);if(g.type==='mark')assert.ok(g.markOptions.length>=12,g.id);}});\ntest('v12 progression increases memory and visual planning demand across levels',()=>{const extra=require('./games-data-v12.js');const mem=l=>extra.filter(g=>g.level===l&&g.type==='memory').reduce((a,g)=>a+g.cards.length,0);const dots=l=>extra.filter(g=>g.level===l&&g.type==='dots').reduce((a,g)=>a+g.points.length,0);assert.ok(mem(4)>mem(1));assert.ok(dots(4)>dots(1));});\ntest('v12 creates a dedicated SVG cover for every new game',()=>{const extra=require('./games-data-v12.js');for(const g of extra)assert.ok(fs.existsSync('./assets/game-covers/'+g.id+'.svg'),g.id);});\ntest('v12 loads extra games before app runtime and adds covers to both designers',()=>{const html=fs.readFileSync('./index.html','utf8');assert.ok(html.indexOf('games-data-v12.js?v=12')<html.indexOf('app.js?v=12'));assert.ok(html.indexOf('designer-assets-v12.js?v=12')<html.indexOf('designer-v9.js?v=12'));const assets=fs.readFileSync('./designer-assets-v12.js','utf8');assert.match(assets,/G91\\.svg/);assert.match(assets,/G170\\.svg/);});\ntest('v12 extra game runtime stays ES5 friendly for Android 4.4 class browsers',()=>{const js=fs.readFileSync('./games-data-v12.js','utf8');assert.doesNotMatch(js,/=>|\\bconst\\b|\\blet\\b|`/);const app=fs.readFileSync('./app.js','utf8');assert.match(app,/EXTRA_VISUAL_NAMES_V12/);});\ntest('v12 service worker caches extra game data designer catalog and final cover',()=>{const sw=fs.readFileSync('./sw.js','utf8');assert.match(sw,/games-data-v12\\.js\\?v=12/);assert.match(sw,/designer-assets-v12\\.js\\?v=12/);assert.match(sw,/game-covers\\/G170\\.svg/);});\n`;}
write('app.test.js',test);
console.log('v12 prepared with',extra.length,'new games and',all.length,'total games');
