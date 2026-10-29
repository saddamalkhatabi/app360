'use strict';
// Refresh only portal consumers; retain every other asset, including all praise recordings.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(process.env.APP360_GUIDE_ROOT||path.join(__dirname,'..')),base=path.resolve(process.env.APP360_GUIDE_BASE||root);
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),targets=['index.html','assets/js/home-showcase-v31.js','assets/js/school-guide-v1.js','assets/css/school-guide-v1.css'];
const records=targets.map(p=>{const b=fs.readFileSync(path.join(root,p));return {path:p,bytes:b.length,sha256:hash(b)}}),catalog=JSON.parse(fs.readFileSync(path.join(base,'data/offline-catalog.json')));let updated=0;
for(const entry of catalog.apps){const file=entry.manifest,original=JSON.parse(fs.readFileSync(path.join(base,file)));
 if(!original.files.some(f=>f.path==='index.html'))continue;
 const rows=original.files.filter(f=>!targets.includes(f.path)).concat(records).sort((a,b)=>a.path<b.path?-1:a.path>b.path?1:0),version=hash(JSON.stringify(rows)).slice(0,16);
 const next={...original,version,files:rows};fs.mkdirSync(path.dirname(path.join(root,file)),{recursive:true});fs.writeFileSync(path.join(root,file),JSON.stringify(next)+'\n');
 entry.version=version;entry.count=rows.length;entry.bytes=rows.reduce((n,r)=>n+r.bytes,0);updated++;
}
fs.mkdirSync(path.join(root,'data'),{recursive:true});fs.writeFileSync(path.join(root,'data/offline-catalog.json'),JSON.stringify(catalog,null,2)+'\n');console.log('School guide offline manifests refreshed:',updated,'portal consumers. Other application/media records retained.');
