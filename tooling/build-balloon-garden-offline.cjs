'use strict';
// Refresh this game's files and references; update changed common digests in all bundles.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),vm=require('vm');
const root=path.resolve(__dirname,'..');process.chdir(root);
const dir='apps/1-4/balloon-garden',id='fun-balloon-garden';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const record=p=>{const b=fs.readFileSync(p);return{path:p,bytes:b.length,sha256:hash(b)}};
const catalog=JSON.parse(fs.readFileSync('data/offline-catalog.json'));
const sharedChanges=['data/catalog.json','data/public-links.json','links.html','index.html','assets/js/home-showcase-v31.js'];
const local=[];function walk(d){for(const x of fs.readdirSync(d,{withFileTypes:true})){const p=d+'/'+x.name;if(x.isDirectory()){if(x.name!=='tests')walk(p);}else if(/\.(html|js|css|svg|mp3|webmanifest|json)$/.test(p)&&!/\/(package|app|offline-files)\.json$/.test(p))local.push(p);}}walk(dir);
const context={window:{}};vm.runInNewContext(fs.readFileSync(dir+'/content.js','utf8'),context);const media=context.window.BalloonGardenContent,refs=[];
for(const x of media.words){refs.push(x.image);for(const f of Object.values(x.audio))if(f)refs.push(f);}vm.runInNewContext(fs.readFileSync(dir+'/learning.js','utf8'),context);for(const clip of Object.values(context.window.BalloonGardenLearning.clips))refs.push(clip.path);refs.push(...media.letters);for(const n of media.numbers)refs.push(...Object.values(n.audio));for(const x of media.colors)for(const lang of ['ar','en'])if(x[lang])refs.push(x[lang]);
const referenced=[...new Set(refs.map(f=>path.posix.normalize(dir+'/'+f)))];
const prior=JSON.parse(fs.readFileSync('data/offline/'+id+'.json'));
const inherited=prior.files.filter(f=>!f.path.startsWith(dir+'/'));
for(const name of ['parent-experiences-v1.js','teacher-encouragement-v1.js']){const p='assets/js/'+name;if(!inherited.some(f=>f.path===p))inherited.push(record(p));}
for(const p of ['resources/celebration-audio/audio/ar/well-done-dear-m.mp3','resources/celebration-audio/audio/ar/well-done-dear-f.mp3','resources/celebration-audio/audio/ar/well-done-m.mp3','resources/celebration-audio/audio/ar/well-done-f.mp3','resources/celebration-audio/audio/en/well-done-en.mp3'])if(!inherited.some(f=>f.path===p))inherited.push(record(p));
const prep=[...new Set(local.concat(referenced,inherited.map(f=>f.path)))].sort();
fs.writeFileSync(dir+'/offline-files.json',JSON.stringify({schema:1,files:prep.map(p=>path.posix.relative(dir,p))})+'\n');
for(const row of catalog.apps){const file=row.manifest,bundle=JSON.parse(fs.readFileSync(file));
 if(row.id===id){const rows=new Map(inherited.map(f=>[f.path,f]));for(const p of local.concat(referenced,[dir+'/offline-files.json']))rows.set(p,record(p));bundle.files=[...rows.values()];row.release='3.1.0';row.title='حديقة البالونات · مزرعتي تنمو';row.age_entry_levels={'1-4':1,'4-8':1};row.updateNote='اكتشاف غامض ونمو مباشر، وطريقة الزراعة أولًا، ومكتبة 1203 كلمة و110 تصنيفات، وأعداد عربية وإنجليزية حتى 20 وأشكال هندسية؛ الجمل افتراضية للفئة 4–8 واختيارية للصغار، مع التشجيع العام والمخصص. تنزيل المكتبة الكاملة اختياري.';}
 bundle.files=bundle.files.filter(f=>!f.path.startsWith('apps/1-4/mini-golf/')).map(f=>sharedChanges.includes(f.path)?record(f.path):f).sort((a,b)=>a.path.localeCompare(b.path,'en'));
 bundle.version=hash(JSON.stringify(bundle.files)).slice(0,16);row.version=bundle.version;row.bytes=bundle.files.reduce((n,f)=>n+f.bytes,0);row.count=bundle.files.length;fs.writeFileSync(file,JSON.stringify(bundle)+'\n');
}
fs.writeFileSync('data/offline-catalog.json',JSON.stringify(catalog,null,2)+'\n');console.log(JSON.stringify(catalog.apps.find(a=>a.id===id)));
