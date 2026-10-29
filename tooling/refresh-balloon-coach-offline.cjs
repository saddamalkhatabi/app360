'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
process.chdir(path.resolve(__dirname,'..'));
const dir='apps/1-4/balloon-garden',file='data/offline/fun-balloon-garden.json',bundle=JSON.parse(fs.readFileSync(file));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const map=new Map(bundle.files.map(x=>[x.path,x]));
function record(p){const b=fs.readFileSync(p);map.set(p,{path:p,bytes:b.length,sha256:hash(b)});}
function walk(p){for(const x of fs.readdirSync(p,{withFileTypes:true})){const f=p+'/'+x.name;if(x.isDirectory()){if(x.name!=='tests')walk(f);}else if(/\.(html|js|css|svg|mp3|webmanifest|json)$/.test(f)&&!/(?:package|app|offline-files)\.json$/.test(f))record(f);}}
walk(dir);
fs.writeFileSync(dir+'/offline-files.json',JSON.stringify({schema:1,files:[...map.keys()].filter(p=>p!==dir+'/offline-files.json').sort().map(p=>path.posix.relative(dir,p))})+'\n');record(dir+'/offline-files.json');
bundle.files=[...map.values()].sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0);bundle.version=hash(JSON.stringify(bundle.files)).slice(0,16);fs.writeFileSync(file,JSON.stringify(bundle)+'\n');
const catalog=JSON.parse(fs.readFileSync('data/offline-catalog.json')),entry=catalog.apps.find(x=>x.id==='fun-balloon-garden');
Object.assign(entry,{version:bundle.version,count:bundle.files.length,bytes:bundle.files.reduce((n,x)=>n+x.bytes,0),release:'3.2.0',updateNote:'صور الاكتشاف تنتظر التحميل، جمل عند الحاجة، وتشجيع المزرعة بعد كل اكتشاف؛ مدرب بمسارات مستقلة للعمرين وانتقال تلقائي بعد الصوت.'});
fs.writeFileSync('data/offline-catalog.json',JSON.stringify(catalog,null,2)+'\n');console.log(JSON.stringify(entry));
// Refresh shared runtime evidence only where that dependency already exists.
const shared=['assets/js/app360-family-sync-v1.js','assets/js/app360-family-media-v1.js','assets/js/app360-family-core-v2.js'];
for(const row of catalog.apps){const data=JSON.parse(fs.readFileSync(row.manifest));let changed=false;data.files=data.files.map(f=>{if(!shared.includes(f.path))return f;const b=fs.readFileSync(f.path);const next={path:f.path,bytes:b.length,sha256:hash(b)};if(next.sha256!==f.sha256)changed=true;return next;});if(!changed)continue;data.version=hash(JSON.stringify(data.files)).slice(0,16);row.version=data.version;row.bytes=data.files.reduce((n,f)=>n+f.bytes,0);fs.writeFileSync(row.manifest,JSON.stringify(data)+'\n');}
fs.writeFileSync('data/offline-catalog.json',JSON.stringify(catalog,null,2)+'\n');
