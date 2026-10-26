'use strict';
// Update existing immutable bundle digests only for the shared files changed by this feature.
// This also works from a sparse checkout: unchanged files retain their existing recorded digests.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..');process.chdir(root);
const dir='apps/1-4/balloon-garden',id='fun-balloon-garden';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const record=p=>{const b=fs.readFileSync(p);return{path:p,bytes:b.length,sha256:hash(b)}};
const runtime=p=>/\.(html|js|css|svg|mp3|webmanifest|json)$/.test(p)&&!p.includes('/tests/')&&!/package\.json|app\.json|offline-files\.json/.test(p);
function walk(d){return fs.readdirSync(d,{withFileTypes:true}).flatMap(x=>x.isDirectory()?walk(d+'/'+x.name):[d+'/'+x.name]);}
const shared=['assets/js/integration-context-v1.js','assets/js/app360-ai-shell.js','assets/js/app-pwa.js','assets/js/offline-worker-v1.js','assets/js/offline-client-v1.js','assets/js/offline-manager-v2.js','assets/js/app360-session-v1.js','assets/js/app360-account-access-v1.js','assets/js/app360-login-entry-v2.js','assets/js/app360-usage-daily-v1.js','assets/js/app360-family-sync-v1.js','assets/js/app360-family-core-v2.js','assets/js/app360-family-media-core-v3.js','assets/js/app360-peer-media-bootstrap-v1.js','assets/js/app360-peer-bootstrap-v1.js','assets/js/app360-family-catalog-v1.js','assets/js/app360-access-v1.js','assets/css/app360-responsive-policy-v1.css'];
const local=walk(dir).filter(runtime);
const preparation=local.concat(shared);
fs.writeFileSync(dir+'/offline-files.json',JSON.stringify({schema:1,files:preparation.map(p=>path.posix.relative(dir,p))})+'\n');
const common=['index.html','data/catalog.json','data/public-links.json','links.html','assets/js/home-showcase-v31.js','assets/js/lab360.js','assets/js/runtime-apps-v1.js','assets/css/fun-category-tabs-v1.css','ages/1-4/index.html','ages/4-8/index.html'];
const changed=new Set(common.concat(['assets/js/app360-family-core-v2.js','assets/js/offline-manager-v2.js','assets/js/offline-client-v1.js']));
const catalog=JSON.parse(fs.readFileSync('data/offline-catalog.json'));
for(const row of catalog.apps){
 const file=row.manifest;if(!fs.existsSync(file))continue;
 const bundle=JSON.parse(fs.readFileSync(file));let touched=false;
 bundle.files=bundle.files.map(f=>{if(changed.has(f.path)){touched=true;return record(f.path)}return f});
 if(!bundle.files.some(f=>f.path==='assets/css/fun-category-tabs-v1.css')){bundle.files.push(record('assets/css/fun-category-tabs-v1.css'));touched=true;}
 if(!touched)continue;
 bundle.files.sort((a,b)=>a.path.localeCompare(b.path));bundle.version=hash(JSON.stringify(bundle.files)).slice(0,16);
 fs.writeFileSync(file,JSON.stringify(bundle)+'\n');row.version=bundle.version;row.bytes=bundle.files.reduce((n,f)=>n+f.bytes,0);row.count=bundle.files.length;
}
const files=[...new Set(local.concat(shared,dir+'/offline-files.json'))].sort().map(record);
const version=hash(JSON.stringify(files)).slice(0,16);
fs.writeFileSync('data/offline/'+id+'.json',JSON.stringify({schema:1,id,version,files})+'\n');
const row={id,title:'حديقة البالونات',age:'1-4',age_groups:['1-4','4-8'],age_entry_levels:{'1-4':2,'4-8':3},entry:dir+'/index.html',directory:dir+'/',version,release:'1.0.0',bytes:files.reduce((n,f)=>n+f.bytes,0),count:files.length,manifest:'data/offline/'+id+'.json',required:false,minimumVersion:null,updateNote:'حديقة البالونات: أول تطبيقات التسلية، بعوالم مرحة ولعب تعاوني.',networkNote:'تعمل اللعبة وأصواتها محليًا بعد تنزيل الملفات على متصفح يدعم التخزين دون اتصال؛ مزامنة الحساب تحتاج اتصالًا.'};
catalog.apps=catalog.apps.filter(a=>a.id!==id).concat([row]);
fs.writeFileSync('data/offline-catalog.json',JSON.stringify(catalog,null,2)+'\n');
console.log(JSON.stringify({app:id,files:row.count,bytes:row.bytes,version}));
