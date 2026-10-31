'use strict';
// Refresh only the shared worker record; preserve every other bundled asset.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),file='assets/js/offline-worker-v1.js';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const bytes=fs.readFileSync(path.join(root,file)),record={path:file,bytes:bytes.length,sha256:hash(bytes)};
const catalog=JSON.parse(fs.readFileSync(path.join(root,'data/offline-catalog.json'),'utf8'));
let updated=0;
for(const app of catalog.apps){
 const bundlePath=path.join(root,app.manifest),bundle=JSON.parse(fs.readFileSync(bundlePath,'utf8'));
 const index=bundle.files.findIndex(r=>r.path===file);if(index<0)continue;
 if(bundle.files[index].sha256===record.sha256&&bundle.files[index].bytes===record.bytes)continue;
 bundle.files[index]={...record};bundle.version=hash(JSON.stringify(bundle.files)).slice(0,16);
 app.version=bundle.version;app.bytes=bundle.files.reduce((sum,r)=>sum+r.bytes,0);app.count=bundle.files.length;
 fs.writeFileSync(bundlePath,JSON.stringify(bundle)+'\n');updated++;
}
if(updated)fs.writeFileSync(path.join(root,'data/offline-catalog.json'),JSON.stringify(catalog,null,2)+'\n');
console.log('Refreshed shared media worker in '+updated+' offline bundles.');
