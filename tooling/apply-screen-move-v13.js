'use strict';
const fs=require('node:fs');
const path=require('node:path');
const ROOT=process.cwd();
const APP=path.join(ROOT,'apps/1-4/screen-to-move');
const SAY=path.join(ROOT,'apps/1-4/say-and-name');
function read(p){return fs.readFileSync(p,'utf8')}
function write(p,s){fs.writeFileSync(p,s)}
function ap(n){return path.join(APP,n)}

const css=`/* screen-to-move v13: Android 4.4 overlays, wide-low-height layout, real-image fallbacks */
/* Never depend on CSS inset for any full-screen overlay. */
.sheet,.drawing-overlay{position:fixed!important;top:0!important;right:0!important;bottom:0!important;left:0!important;width:100%!important;height:100%!important;z-index:1000000!important;margin:0!important;padding:0!important}
.sheet-backdrop,.drawing-backdrop{position:absolute!important;top:0!important;right:0!important;bottom:0!important;left:0!important;width:100%!important;height:100%!important;z-index:0!important}
.sheet-card{position:absolute!important;right:0!important;left:0!important;bottom:0!important;z-index:2!important}
.drawing-panel,.worksheet-panel,.wd9-panel,.gd-panel{z-index:2!important}
/* Legacy Android class is added by legacy-v13.js when inset/fixed viewport behavior is unsafe. */
html.legacy-android,html.legacy-android body{min-height:100%!important}
html.legacy-android body{overflow-x:hidden!important}
html.legacy-android .sheet,html.legacy-android .drawing-overlay{display:block;position:fixed!important;top:0!important;right:0!important;bottom:0!important;left:0!important;-webkit-transform:translateZ(0);transform:translateZ(0);background:rgba(16,47,45,.60)!important}
html.legacy-android .sheet[hidden],html.legacy-android .drawing-overlay[hidden]{display:none!important}
html.legacy-android .sheet-card{top:5px!important;right:5px!important;bottom:5px!important;left:5px!important;max-height:none!important;border-radius:15px!important;overflow:auto!important;-webkit-overflow-scrolling:touch!important;padding:10px!important}
html.legacy-android .drawing-panel{position:absolute!important;top:5px!important;right:5px!important;bottom:5px!important;left:5px!important;max-height:none!important;width:auto!important;height:auto!important;margin:0!important;overflow:auto!important;border-radius:15px!important;background:#fff!important}
html.legacy-android .worksheet-panel,html.legacy-android .wd9-panel{position:absolute!important;top:4px!important;right:4px!important;bottom:4px!important;left:4px!important;max-height:none!important;width:auto!important;height:auto!important;margin:0!important;overflow:auto!important;border-radius:12px!important}
html.legacy-android .gd-panel{position:absolute!important;top:4px!important;right:4px!important;bottom:4px!important;left:4px!important;max-height:none!important;width:auto!important;height:auto!important;margin:0!important;border-radius:12px!important}
html.legacy-android .sheet-head,html.legacy-android .drawing-head,html.legacy-android .wd9-head{position:relative!important;top:auto!important}
html.legacy-android .close{position:relative!important;z-index:6!important;min-width:44px!important;min-height:40px!important}
html.legacy-android .wd-settings-drawer.open,html.legacy-android .gd-settings.open{display:block!important;top:58px!important;bottom:8px!important;max-height:none!important;overflow:auto!important}
/* Real teaching photos replacing unsupported emoji glyphs. */
.stable-visual.legacy-real-visual img{display:block!important;width:66px!important;height:66px!important;object-fit:contain!important;background:#fff!important;border-radius:10px!important}
.stable-visual.legacy-real-visual b{display:none!important}
.legacy-sequence-photo{width:52px!important;height:52px!important;object-fit:contain!important;vertical-align:middle!important;border-radius:8px!important;background:#fff!important}
/* Compact landscape mode for 1024x600-class tablets and other wide low-height screens. */
@media (min-width:800px) and (max-height:700px){
 body{background:#f7fbfa!important}
 .compact-topbar{padding:3px 7px!important;min-height:38px!important;flex-wrap:nowrap!important}
 .compact-topbar .brand{display:none!important}
 .compact-topbar .top-actions{width:100%!important;max-width:none!important;padding:0!important;gap:3px!important}
 .compact-topbar .top-actions button{min-height:32px!important;padding:4px 7px!important;font-size:10px!important;border-radius:8px!important}
 .compact-topbar .top-actions img,.compact-topbar .ui-icon{width:16px!important;height:16px!important;flex-basis:16px!important}
 .app-root{max-width:none!important;padding:5px 9px 8px!important}
 .compact-hero{padding:7px 10px!important;border-radius:12px!important;min-height:58px!important}
 .compact-hero h2{font-size:20px!important;margin:1px 0!important}
 .compact-hero p{display:none!important}
 .compact-hero .hero-badge{font-size:10px!important;padding:3px 7px!important}
 .hero-mini{padding:4px 7px!important;min-width:90px!important;border-radius:10px!important}
 .hero-mini b{font-size:21px!important}
 .hero-mini span{font-size:10px!important}
 .level-tabs{padding:4px 0 2px!important;gap:4px!important}
 .level-tabs .chip{min-height:34px!important;padding:4px 7px!important;border-radius:9px!important}
 .level-tabs .chip b{font-size:11px!important}.level-tabs .chip small{font-size:9px!important;margin-top:1px!important}
 .library-head{margin:5px 2px 3px!important;align-items:center!important}.library-head h2{font-size:18px!important}.library-head p{display:none!important}
 .game-card{width:calc(20% - 8px)!important;margin:4px!important;min-height:178px!important;border-radius:13px!important}
 .game-cover-art{height:96px!important}.game-body{padding:6px 7px!important}.game-body>b{font-size:13px!important;margin-bottom:4px!important;line-height:1.3!important}.meta{font-size:9px!important}.meta span{padding:3px 5px!important}.play-now{font-size:10px!important;margin-top:5px!important}
 .game-view>*{margin-bottom:5px!important}.game-switcher{padding:3px 5px!important;margin-bottom:4px!important;border-radius:10px!important}.game-switcher button{min-height:31px!important;padding:3px 7px!important;font-size:10px!important}.game-count{min-width:48px!important}.game-count span{font-size:9px!important}
 .screen-game{padding:7px 9px!important;border-radius:13px!important}.screen-game-head{align-items:center!important}.screen-game-head h2{font-size:20px!important;line-height:1.2!important}.screen-game-head p{font-size:10px!important;margin:1px 0!important}.game-heading>.ui-icon{width:30px!important;height:30px!important;flex-basis:30px!important}.screen-game-head .btn{min-height:32px!important;padding:4px 7px!important;font-size:10px!important}
 .score-hud{display:-webkit-flex!important;display:flex!important;-webkit-align-items:center!important;align-items:center!important;gap:5px!important;padding:5px 7px!important;margin:5px 0!important;border-radius:10px!important}.score-top{min-width:190px!important}.score-top small{font-size:9px!important}.score-top strong{font-size:14px!important;margin-top:0!important}.score-top button{min-height:30px!important;padding:4px 6px!important;font-size:10px!important}.score-counters{margin:0!important;gap:4px!important;-webkit-flex:1!important;flex:1!important}.score-counters span{padding:4px 6px!important;font-size:10px!important}.progress-track{width:110px!important;height:6px!important;margin:0!important;flex:0 0 110px!important}
 .challenge{min-height:205px!important;padding:6px!important;border-radius:11px!important}.challenge h3{font-size:18px!important;margin:4px 0 7px!important}.challenge-msg{font-size:11px!important;min-height:18px!important;margin:5px 0!important}.choice-grid{gap:7px!important}.choice-grid button{min-width:72px!important;min-height:68px!important;padding:6px!important;font-size:34px!important}.mark-option{min-height:94px!important;padding:5px 5px 25px!important}.mark-value{min-height:54px!important;font-size:27px!important}.stable-visual img,.stable-visual.legacy-real-visual img{width:52px!important;height:52px!important}.stable-visual small{font-size:9px!important}.mark-help{font-size:10px!important;margin:3px 0!important}
 .game-tools{margin-top:5px!important;gap:5px!important}.game-tools .btn{min-height:34px!important;padding:5px 8px!important;font-size:10px!important}.score-note{display:none!important}.after-play{margin-top:7px!important}.section-title{padding:7px 9px!important;border-radius:10px!important}.section-title h3{font-size:16px!important}.section-title p{font-size:10px!important}
}
`;
write(ap('v13.css'),css);

const legacyJs=`(function(){'use strict';
var doc=document,html=doc.documentElement;
function hasClass(n,c){return(' '+(n.className||'')+' ').indexOf(' '+c+' ')>=0}
function addClass(n,c){if(n&&!hasClass(n,c))n.className=(n.className? n.className+' ':'')+c}
var ua=navigator.userAgent||'';var st=doc.createElement('div').style;var old=/Android\\s(?:[0-4])(?:\\.|;)/i.test(ua)||!('inset' in st);if(old)addClass(html,'legacy-android');
var BASE='../say-and-name/assets/word-images/';
var real={
'حذاء':'w0028.jpg','جورب':'w0029.jpg','قبعة':'w0030.jpg','معطف':'w0392.jpg','قميص':'w0025.jpg','بنطال':'w0026.jpg','سرير':'w0032.jpg','كلب':'w0096.jpg','أرنب':'w0099.jpg','سمكة':'w0098.jpg','طائر':'w0097.jpg','سلحفاة':'corrected-turtle-v24.jpg','أسد':'corrected-lion-v24.jpg','فيل':'corrected-elephant-v24.jpg','قرش':'corrected-shark-v24.jpg','فظ':'corrected-walrus-v24.jpg','برتقال':'w0082.jpg','كمثرى':'w0235.jpg','عنب':'w0083.jpg','بطيخ':'w0085.jpg','جزر':'w0090.jpg','بروكلي':'w0249.jpg','خبز':'w0071.jpg','حليب':'w0075.jpg','جبن':'w0074.jpg','دراجة':'w0114.jpg','حافلة':'w0112.jpg','قطار':'w0115.jpg','طائرة':'w0116.jpg','مروحية':'w0297.jpg','قارب':'w0118.jpg','لعبة':'w0035.jpg','منزل':'w0045.jpg','شجرة':'w0125.jpg','نجمة':'w0139.jpg','قلب':'w0140.jpg','شمس':'w0119.jpg','قمر':'w0120.jpg','صابون':'w0066.jpg','منشفة':'w0067.jpg','نحلة':'w0109.jpg','زهرة':'w0126.jpg','وجه سعيد':'w0622.jpg','عينان':'w0014.jpg','أنف':'w0015.jpg','فم':'w0016.jpg','بذرة':'w0303.jpg','صخرة':'w0776.jpg','نهاية':'w0977.jpg','طبق':'w0057.jpg','حمام':'w0048.jpg','بيضة':'w0760.jpg','فرخ':'w0762.jpg','كتكوت':'w0259.jpg','أسنان':'w0018.jpg','قلم':'w0148.jpg','ورقة':'w0149.jpg','طباخ':'w0366.jpg','طبيب':'w0163.jpg','سماعة طبيب':'w0664.jpg','عامل':'w0371.jpg','مطرقة':'w0566.jpg','سحابة':'w0123.jpg','مطر':'w0124.jpg','مظلة':'w0151.jpg','مكنسة':'w0420.jpg','فراشة':'w0110.jpg','هدف':'w0577.jpg','إشارة مرور':'w0819.jpg','مبنى':'w0833.jpg','جسر':'w0821.jpg','مسطرة':'w0339.jpg','طوب':'w0889.jpg','قدم':'w0022.jpg','طريق':'w0316.jpg','كرسي':'w0039.jpg','كرة':'w0037.jpg','سيارة':'w0111.jpg','تفاحة':'w0080.jpg','موز':'w0081.jpg'};
var symbol={'👟':'حذاء','🧦':'جورب','🧢':'قبعة','🧥':'معطف','👕':'قميص','👖':'بنطال','🛏️':'سرير','🐶':'كلب','🐰':'أرنب','🐟':'سمكة','🐦':'طائر','🐢':'سلحفاة','🦁':'أسد','🐘':'فيل','🦈':'قرش','🦭':'فظ','🍊':'برتقال','🍐':'كمثرى','🍇':'عنب','🍉':'بطيخ','🥕':'جزر','🥦':'بروكلي','🍞':'خبز','🥛':'حليب','🧀':'جبن','🚲':'دراجة','🚌':'حافلة','🚂':'قطار','✈️':'طائرة','🚁':'مروحية','🚤':'قارب','⛵':'قارب','🧸':'لعبة','🏠':'منزل','🌳':'شجرة','⭐':'نجمة','❤️':'قلب','☀️':'شمس','🌞':'شمس','🌙':'قمر','🧼':'صابون','🧻':'منشفة','🐝':'نحلة','🌼':'زهرة','😊':'وجه سعيد','👃':'أنف','👄':'فم','🌰':'بذرة','🪨':'صخرة','🏁':'نهاية','🍽️':'طبق','🛁':'حمام','🥚':'بيضة','🐣':'فرخ','🐥':'كتكوت','😁':'أسنان','✏️':'قلم','📄':'ورقة','👨‍🍳':'طباخ','👨‍⚕️':'طبيب','🩺':'سماعة طبيب','👷':'عامل','🔨':'مطرقة','☁️':'سحابة','🌧️':'مطر','☂️':'مظلة','🧹':'مكنسة','🦋':'فراشة','🎯':'هدف','🚦':'إشارة مرور','🏢':'مبنى','🌉':'جسر','📏':'مسطرة','🧱':'طوب','🦶':'قدم','🛣️':'طريق','🪑':'كرسي','⚽':'كرة','🚗':'سيارة','🍎':'تفاحة','🍌':'موز'};
function trim(s){return String(s||'').replace(/^\\s+|\\s+$/g,'')}
function putImage(box,label){var file=real[label];if(!file||!box)return;var imgs=box.getElementsByTagName('img'),img=imgs.length?imgs[0]:null;if(!img){img=doc.createElement('img');var b=box.getElementsByTagName('b');if(b.length)box.insertBefore(img,b[0]);else box.insertBefore(img,box.firstChild)}img.src=BASE+file;img.alt=label;addClass(box,'legacy-real-visual');var bs=box.getElementsByTagName('b');for(var j=0;j<bs.length;j++)bs[j].style.display='none'}
function replaceStable(){var nodes=doc.querySelectorAll?doc.querySelectorAll('.stable-visual'):[];for(var i=0;i<nodes.length;i++){var sm=nodes[i].getElementsByTagName('small');if(!sm.length)continue;var label=trim(sm[0].textContent||sm[0].innerText);if(real[label])putImage(nodes[i],label)}var shoes=doc.getElementsByTagName('img');for(var k=0;k<shoes.length;k++){var src=shoes[k].getAttribute('src')||'';if(src.indexOf('/objects/shoe.svg')>=0||src.indexOf('objects/shoe.svg')>=0)shoes[k].src=BASE+'w0028.jpg'}}
function replaceSequence(){var rows=doc.querySelectorAll?doc.querySelectorAll('.sequence-row span'):[];for(var i=0;i<rows.length;i++){var n=rows[i];if(hasClass(n,'missing')||n.getAttribute('data-real-v13')==='1')continue;var raw=trim(n.textContent||n.innerText),label=symbol[raw],file=label&&real[label];if(!file)continue;n.innerHTML='';var img=doc.createElement('img');img.className='legacy-sequence-photo';img.src=BASE+file;img.alt=label;n.appendChild(img);n.setAttribute('data-real-v13','1')}}
function forceOverlay(o){if(!old||!o||o.hidden)return;o.style.display='block';o.style.position='fixed';o.style.top='0px';o.style.right='0px';o.style.bottom='0px';o.style.left='0px';o.style.zIndex='1000000';var de=doc.documentElement;o.style.width=(de.clientWidth||window.innerWidth||1024)+'px';o.style.height=(de.clientHeight||window.innerHeight||600)+'px';o.style.webkitTransform='translateZ(0)'}
function fixOverlays(){forceOverlay(doc.getElementById('sheet'));forceOverlay(doc.getElementById('drawingOverlay'))}
function scan(){replaceStable();replaceSequence();fixOverlays()}
if(doc.addEventListener){doc.addEventListener('click',function(){setTimeout(scan,0);setTimeout(scan,80)},false);window.addEventListener('resize',function(){setTimeout(fixOverlays,30)},false)}
if(window.MutationObserver){try{new MutationObserver(function(){scan()}).observe(doc.body,{childList:true,subtree:true})}catch(e){}}
setInterval(scan,700);scan();
})();\n`;
write(ap('legacy-v13.js'),legacyJs);

// Replace the ambiguous boot-like shoe source with a clear side-view sneaker pictogram.
const shoe=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" role="img" aria-label="حذاء رياضي"><rect width="256" height="256" rx="34" fill="#f7fbfb"/><path d="M54 145c15-9 28-24 40-51l20-43 38 16-7 38c18 14 37 25 58 33 19 7 30 19 30 36 0 19-16 31-38 31H61c-25 0-39-11-39-30 0-13 9-23 32-30z" fill="#4f8bd6" stroke="#17343a" stroke-width="9" stroke-linejoin="round"/><path d="M108 89l39 17M101 105l42 17M92 122l43 18" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round"/><path d="M30 177h194" stroke="#17343a" stroke-width="10" stroke-linecap="round"/><path d="M67 188h120" stroke="#d7e8e6" stroke-width="7" stroke-linecap="round"/></svg>`;
write(path.join(SAY,'assets/objects/shoe.svg'),shoe);

let html=read(ap('index.html')).replace(/\\?v=12/g,'?v=13');
if(html.indexOf('v13.css')<0)html=html.replace('<link rel="stylesheet" href="v10.css?v=13">','<link rel="stylesheet" href="v10.css?v=13">\n<link rel="stylesheet" href="v13.css?v=13">');
if(html.indexOf('legacy-v13.js')<0)html=html.replace('</body>','<script src="legacy-v13.js?v=13"></script>\n</body>');
write(ap('index.html'),html);

let sw=read(ap('sw.js')).replace(/screen-to-move-v12/g,'screen-to-move-v13').replace(/\\?v=12/g,'?v=13');
if(sw.indexOf("'./v13.css?v=13'")<0)sw=sw.replace("'./v10.css?v=13'","'./v10.css?v=13','./v13.css?v=13','./legacy-v13.js?v=13'");
const realFiles=['w0028.jpg','w0029.jpg','w0030.jpg','w0392.jpg','w0025.jpg','w0026.jpg','w0032.jpg','w0096.jpg','w0099.jpg','w0098.jpg','w0097.jpg','w0082.jpg','w0235.jpg','w0083.jpg','w0085.jpg','w0090.jpg','w0249.jpg','w0071.jpg','w0075.jpg','w0074.jpg','w0114.jpg','w0112.jpg','w0115.jpg','w0116.jpg','w0297.jpg','w0118.jpg','w0035.jpg','w0045.jpg','w0125.jpg','w0139.jpg','w0140.jpg','w0119.jpg','w0120.jpg','w0066.jpg','w0067.jpg','w0109.jpg','w0126.jpg','w0622.jpg','w0014.jpg','w0015.jpg','w0016.jpg','w0303.jpg','w0776.jpg','w0977.jpg','w0057.jpg','w0048.jpg','w0760.jpg','w0762.jpg','w0259.jpg','w0018.jpg','w0148.jpg','w0149.jpg','w0366.jpg','w0163.jpg','w0664.jpg','w0371.jpg','w0566.jpg','w0123.jpg','w0124.jpg','w0151.jpg','w0420.jpg','w0110.jpg','w0577.jpg','w0819.jpg','w0833.jpg','w0821.jpg','w0339.jpg','w0889.jpg','w0022.jpg','w0316.jpg','w0039.jpg','w0037.jpg','w0111.jpg','w0080.jpg','w0081.jpg'];
const additions=realFiles.map(f=>"'../say-and-name/assets/word-images/"+f+"'").filter(x=>sw.indexOf(x)<0);
if(additions.length)sw=sw.replace(/\];\nself\.addEventListener\('install'/,','+additions.join(',')+"];\nself.addEventListener('install'");
write(ap('sw.js'),sw);

let manifest=JSON.parse(read(ap('manifest.webmanifest')));manifest.start_url='./index.html?v=13';manifest.description='170 لعبة متدرجة مع إصلاحات خاصة للشاشات العريضة وAndroid 4.4، ونوافذ تصميم ونتائج واسم متوافقة وصور تعليمية حقيقية بديلة للإيموجي.';write(ap('manifest.webmanifest'),JSON.stringify(manifest,null,2)+'\n');
let pkg=JSON.parse(read(ap('package.json')));pkg.version='0.13.0';write(ap('package.json'),JSON.stringify(pkg,null,2)+'\n');
let meta=JSON.parse(read(ap('app.json'));meta.version=13;meta.implementation.state='live-v13-legacy-tablet-overlay-real-visual-and-wide-layout-fixes';meta.implementation.features.push('explicit top right bottom left overlay positioning for Android 4.4 browsers that do not support CSS inset');meta.implementation.features.push('runtime legacy overlay viewport fixer for sheet drawing worksheet and electronic game designer surfaces');meta.implementation.features.push('real say-and-name word images replace unsupported emoji glyphs for clothing animals food transport nature and common game objects');meta.implementation.features.push('shoe teaching visual replaced by a clearer side-view sneaker and gameplay uses the real w0028 image');meta.implementation.features.push('compact wide-low-height landscape layout brings the active game and first library row into view sooner on 1024x600-class tablets');write(ap('app.json'),JSON.stringify(meta,null,2)+'\n');

let test=read(ap('app.test.js'));
test=test.replace("test('v12 cache version is active',()=>{const sw=fs.readFileSync('./sw.js','utf8');const html=fs.readFileSync('./index.html','utf8');assert.match(sw,/screen-to-move-v12/);assert.match(html,/v10\\.css\\?v=12/);});","test('v13 cache version is active',()=>{const sw=fs.readFileSync('./sw.js','utf8');const html=fs.readFileSync('./index.html','utf8');assert.match(sw,/screen-to-move-v13/);assert.match(html,/v13\\.css\\?v=13/);assert.match(html,/legacy-v13\\.js\\?v=13/);});");
if(test.indexOf('v13 gives every overlay explicit legacy-safe viewport edges')<0){test += "\n\ntest('v13 gives every overlay explicit legacy-safe viewport edges',()=>{const css=fs.readFileSync('./v13.css','utf8');assert.match(css,/\\.sheet,\\.drawing-overlay\\{[^}]*top:0!important;right:0!important;bottom:0!important;left:0!important/s);assert.match(css,/legacy-android \\.sheet-card/);assert.match(css,/legacy-android \\.drawing-panel/);});\ntest('v13 legacy runtime forces visible overlays into the old Android viewport',()=>{const js=fs.readFileSync('./legacy-v13.js','utf8');assert.match(js,/Android\\\\s/);assert.match(js,/function forceOverlay/);assert.match(js,/drawingOverlay/);assert.match(js,/sheet/);assert.doesNotMatch(js,/=>|\\bconst\\b|\\blet\\b|`/);});\ntest('v13 uses real teaching images for missing legacy glyphs and the shoe',()=>{const js=fs.readFileSync('./legacy-v13.js','utf8');for(const x of ['w0028.jpg','w0029.jpg','w0030.jpg','w0392.jpg','w0032.jpg','w0025.jpg','w0026.jpg'])assert.match(js,new RegExp(x.replace('.','\\\\.')));const shoe=fs.readFileSync('../say-and-name/assets/objects/shoe.svg','utf8');assert.match(shoe,/حذاء رياضي/);assert.match(shoe,/4f8bd6/);});\ntest('v13 compact landscape mode targets wide low-height tablets',()=>{const css=fs.readFileSync('./v13.css','utf8');assert.match(css,/@media \\(min-width:800px\\) and \\(max-height:700px\\)/);assert.match(css,/\\.game-card\\{width:calc\\(20% - 8px\\)/);assert.match(css,/\\.challenge\\{min-height:205px/);assert.match(css,/\\.score-hud\\{display:-webkit-flex/);});\ntest('v13 service worker precaches legacy runtime css and real clothing images',()=>{const sw=fs.readFileSync('./sw.js','utf8');assert.match(sw,/v13\\.css\\?v=13/);assert.match(sw,/legacy-v13\\.js\\?v=13/);assert.match(sw,/word-images\\/w0028\\.jpg/);assert.match(sw,/word-images\\/w0392\\.jpg/);});\n";}
write(ap('app.test.js'),test);
console.log('v13 prepared');
