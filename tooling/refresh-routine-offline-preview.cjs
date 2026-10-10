#!/usr/bin/env node
'use strict';
// Rebuild only a1-routine and its public catalog metadata, never touch other apps.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert');
const repo=path.resolve(__dirname,'..'),dir='apps/1-4/my-little-routine';
const manifestPath=path.join(repo,'data/offline/a1-routine.json');
const catalogPath=path.join(repo,'data/offline-catalog.json');
const orig=JSON.parse(fs.readFileSync(manifestPath,'utf8'));
const catalog=JSON.parse(fs.readFileSync(catalogPath,'utf8'));
assert.equal(orig.id,'a1-routine');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function walk(d){
 const location=path.join(repo,d);
 if(!fs.existsSync(location))return [];
 return fs.readdirSync(location,{withFileTypes:true}).flatMap(entry=>
   entry.isDirectory()?( /^(tools?|tooling|tests?|node_modules|\.git|drafts|archive)$/.test(entry.name)?[]:walk(d+'/'+entry.name))
   :[d+'/'+entry.name]);
}
const runtime=p=>/\.(?:html|js|css|json|webmanifest|svg|png|jpe?g|webp|gif|avif|mp3|wav|ogg|m4a|mp4|webm|woff2?|ttf|bin)$/i.test(p)
  && !/(?:CONTENT_SEEDS|test[-_]|\.test\.|validation|package(?:-lock)?\.json)/i.test(p);
const fresh=walk(dir).filter(runtime);
const all=[...new Set(orig.files.map(x=>x.path).concat(fresh))].filter(runtime).filter(p=>fs.existsSync(path.join(repo,p))).sort();
const rows=all.map(p=>{const bytes=fs.readFileSync(path.join(repo,p));return{path:p,bytes:bytes.length,sha256:sha(bytes)}});
const version=sha(JSON.stringify(rows)).slice(0,16);
const updated={schema:1,id:'a1-routine',version,files:rows};
const app=catalog.apps.find(a=>a.id==='a1-routine');
assert(app,'No app in public offline catalog');
app.version=version;app.count=rows.length;app.bytes=rows.reduce((n,r)=>n+r.bytes,0);
const audio=rows.filter(r=>r.path.startsWith(dir+'/audio/')&&r.path.endsWith('.mp3'));
const bylang={ar:audio.filter(x=>x.path.includes('/audio/silma/routines/')),
              en:audio.filter(x=>x.path.includes('/audio/en/routines/'))};
assert.equal(bylang.ar.length,50,'Expected 50 Arabic MP3 in offline package');
assert.equal(bylang.en.length,50,'Expected 50 English MP3 in offline package');
for(const required of [
 'audio/narration-timings.js','audio/narration-timings-en.js','audio/routine-english-labels.js',
 'routine-language-v1.js','routine-language-v1.css','routine-narration-v1.js','index.html']){
 assert(rows.some(x=>x.path===dir+'/'+required),'Missing required offline asset '+required);
}
fs.writeFileSync(manifestPath,JSON.stringify(updated)+'\n');
fs.writeFileSync(catalogPath,JSON.stringify(catalog,null,2)+'\n');
console.log('Offline bilingual routine:',version,rows.length,'assets',app.bytes,'bytes, AR 50, EN 50 MP3');
