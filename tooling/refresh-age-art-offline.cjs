'use strict';
// Refresh only changed runtime records; preserve the existing media inventory and small game bundles.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),cp=require('child_process');
const root=path.resolve(__dirname,'..');process.chdir(root);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const changed=new Set(cp.execFileSync('git',['diff','--name-only','867d9c158df175d1a06e130a7dd15aa711c5b05b'],{encoding:'utf8'}).trim().split('\n').filter(p=>!p.startsWith('data/offline/')&&!p.includes('/tests/')&&/\.(js|css|html|json)$/.test(p)));
const shared=['assets/js/fun-age-experience-v1.js','assets/css/fun-age-experience-v1.css'];
const record=p=>{const b=fs.readFileSync(p);return{path:p,bytes:b.length,sha256:hash(b)}};
const catalog=JSON.parse(fs.readFileSync('data/offline-catalog.json'));
for(const app of catalog.apps){
 const bundle=JSON.parse(fs.readFileSync(app.manifest)),records=new Map(bundle.files.map(r=>[r.path,changed.has(r.path)?record(r.path):r]));
 const html=path.join(app.directory,'index.html');
 if(fs.readFileSync(html,'utf8').includes('fun-age-experience-v1.js')){
  for(const p of shared)records.set(p,record(p));
  const list=path.join(app.directory,'offline-files.json'),preparation=JSON.parse(fs.readFileSync(list));
  for(const p of shared){const rel=path.posix.relative(app.directory,p);if(!preparation.files.includes(rel))preparation.files.push(rel);}
  fs.writeFileSync(list,JSON.stringify(preparation)+'\n');records.set(list,record(list));
 }
 bundle.files=[...records.values()].sort((a,b)=>a.path.localeCompare(b.path,'en'));
 bundle.version=hash(JSON.stringify(bundle.files)).slice(0,16);
 app.version=bundle.version;app.bytes=bundle.files.reduce((n,f)=>n+f.bytes,0);app.count=bundle.files.length;
 fs.writeFileSync(app.manifest,JSON.stringify(bundle)+'\n');
}
fs.writeFileSync('data/offline-catalog.json',JSON.stringify(catalog,null,2)+'\n');
console.log('Updated runtime digests in '+catalog.apps.length+' app bundles; retained all media and saved-progress keys.');
