'use strict';
// Preserve indexed media hashes in a partial checkout; rehash edited runtime files.
const fs=require('fs'),cp=require('child_process'),crypto=require('crypto'),vm=require('vm');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const tracked=new Set(cp.execFileSync('git',['ls-files'],{encoding:'utf8',maxBuffer:32*1024*1024}).trim().split('\n'));
const rows=cp.execFileSync('git',['ls-files','-s','resources/celebration-audio'],{encoding:'utf8'}).trim().split('\n').map(r=>({sha:r.split(/\s+/)[1],path:r.split('\t')[1]}));
const sizes=cp.execFileSync('git',['cat-file','--batch-check'],{input:rows.map(r=>r.sha).join('\n')+'\n',encoding:'utf8'}).trim().split('\n');
const bytes=new Map(rows.map((r,i)=>[r.path,Number(sizes[i].split(' ')[2])]));
const names=require('../resources/celebration-audio/names.json').records,context={window:{}};vm.runInNewContext(fs.readFileSync('resources/celebration-audio/manifest-v1.js','utf8'),context);
function record(path){const b=fs.readFileSync(path);return{path,bytes:b.length,sha256:hash(b)}}
const shared=[record('assets/js/teacher-encouragement-v1.js'),record('resources/celebration-audio/names.json')];
for(const r of names){if(!r.audio)continue;const path='resources/celebration-audio/'+r.audio.path;shared.push({path,bytes:bytes.get(path),sha256:r.audio.sha256})}
for(const r of context.window.APP360_CELEBRATION_MANIFEST.items){const path='resources/celebration-audio/'+r.path;shared.push({path,bytes:bytes.get(path),sha256:r.sha256})}
if(shared.some(r=>!r.bytes||!r.sha256))throw Error('Missing recorded encouragement metadata');
const catalog=JSON.parse(fs.readFileSync('data/offline-catalog.json','utf8'));let count=0;
for(const name of fs.readdirSync('data/offline').filter(p=>p.endsWith('.json'))){const file='data/offline/'+name,m=JSON.parse(fs.readFileSync(file,'utf8'));let dirty=false;
 m.files=m.files.filter(r=>{if(!tracked.has(r.path)||r.path.startsWith('apps/4-8/maker-solutions-lab/')){dirty=true;return false}return true});
 m.files=m.files.map(r=>{if(fs.existsSync(r.path)){const next=record(r.path);if(next.sha256!==r.sha256){dirty=true;return next}}return r});
 if(['a4-story-language','a4-wonder-lab'].includes(m.id)){const dir=m.id==='a4-story-language'?'apps/4-8/story-language-lab/':'apps/4-8/wonder-experiment-lab/';const map=new Map(m.files.map(r=>[r.path,r]));for(const r of shared.concat(['src/watch.js','assets/teacher.svg','app.js','index.html','styles.css'].map(p=>record(dir+p))))map.set(r.path,r);m.files=[...map.values()].sort((a,b)=>a.path.localeCompare(b.path));dirty=true;}
 if(!dirty)continue;m.version=hash(JSON.stringify(m.files)).slice(0,16);fs.writeFileSync(file,JSON.stringify(m));const app=catalog.apps.find(a=>a.id===m.id);if(app){app.version=m.version;app.count=m.files.length;app.bytes=m.files.reduce((sum,r)=>sum+r.bytes,0)}count++;
}
fs.writeFileSync('data/offline-catalog.json',JSON.stringify(catalog,null,2)+'\n');console.log('Refreshed',count,'offline manifests; shared encouragement files:',shared.length);
