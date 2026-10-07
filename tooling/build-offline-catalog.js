'use strict';
// Run after changing runtime files. A content digest makes updates independent of app.json versions.
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const root=path.resolve(__dirname,'..'),catalog=require('../data/catalog.json'),deps=require('../data/offline-dependencies.json');
const overrides=require('../data/offline-policy.json');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
function walk(dir){if(!fs.existsSync(path.join(root,dir)))return [];return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?(/^(tools?|tooling|tests?|node_modules|\.git|drafts|archive)$/.test(e.name)?[]:walk(dir+'/'+e.name)):[dir+'/'+e.name]);}
function runtime(p){return !/^data\/offline(?:\/|[-.])/.test(p)&&/\.(html|js|css|json|webmanifest|svg|png|jpe?g|webp|gif|avif|mp3|wav|ogg|m4a|mp4|webm|woff2?|ttf|bin)$/i.test(p)&&!/(?:CONTENT_SEEDS|test[-_]|\.test\.|validation|package(?:-lock)?\.json)/i.test(p);}
const common=walk('assets/js').concat(walk('assets/css'),walk('assets/brand'),walk('assets/vendor'),walk('assets/fonts'),walk('assets/ui-icons'),walk('packages')).filter(runtime);
const records=new Map();
function record(p){if(!records.has(p)){const b=fs.readFileSync(path.join(root,p));records.set(p,{path:p,bytes:b.length,sha256:hash(b)});}return records.get(p);}
const result={schema:1,policy:'cache-on-use',ages:catalog.age_groups,apps:[]};
const directories=[...new Set(Object.keys(deps).concat(walk('apps').filter(p=>p.endsWith('/app.json')&&!p.includes('/_template/')).map(p=>path.posix.dirname(p))))].sort();
for(const dir of directories){
 const meta=JSON.parse(fs.readFileSync(path.join(root,dir,'app.json'),'utf8'));
 const live=require('../data/live-overrides.json').apps.find(a=>a.id===meta.id);
 if((live&&live.status||meta.status)!=='live')continue;
 const worker="self.APP360_OFFLINE_ROOT='../../../';\nimportScripts('../../../assets/js/offline-worker-v1.js?v=1');\n";fs.writeFileSync(path.join(root,dir,'sw.js'),worker);
 let files=walk(dir).filter(runtime).concat(common,deps[dir]||[],['index.html','manifest.webmanifest','data/catalog.json','data/goals.json','data/live-overrides.json','data/public-links.json','links.html']);
 const card=catalog.apps.find(a=>a.id===meta.id)||{};
 ['cover','cover_fallback','cover_small','cover_small_fallback'].forEach(field=>{if(card[field])files.push(card[field].split('?')[0]);});
 // Include dynamically selected media directories and sibling-app audio bases, not just old precache literals.
 for(const source of walk(dir).filter(p=>/\.(js|html|json|css)$/.test(p))){
  const text=fs.readFileSync(path.join(root,source),'utf8');
  for(const match of text.matchAll(/["']((?:\.\.\/)+(?:[^"'\s<>]+))["']/g)){
   const ref=match[1].split('?')[0].split('#')[0];if(ref==='../'||ref==='../../'||ref==='../../../')continue;
   for(const base of [dir,path.posix.dirname(source)]){const target=path.resolve(root,base,ref);if(!target.startsWith(root+path.sep)||!fs.existsSync(target))continue;const rel=path.relative(root,target).split(path.sep).join('/');
    if((rel==='apps'||rel.startsWith('apps/'))&&!rel.startsWith(dir+'/')){
     if(/\.html$/.test(rel))continue; // Navigation links are not dependencies: download the other app separately.
     if(fs.statSync(target).isDirectory()&&!/\/(assets|audio|data|src)(\/|$)/.test(rel)){
      const context=text.slice(Math.max(0,match.index-70),match.index);
      if(rel.split('/').length!==3||!/\.(js|html)$/.test(source)||!/(Audio360Base|\bBASE|\bbase|\bBase)/.test(context))continue;
     }
    }
    if(fs.statSync(target).isDirectory())files=files.concat(walk(rel).filter(runtime));else if(runtime(rel))files.push(rel);
   }
  }
 }
 // Name congratulations use a shared local registry and must also work without Google TTS.
 const texts=walk(dir).filter(p=>/\.(js|html)$/.test(p)).map(p=>fs.readFileSync(path.join(root,p),'utf8')).join('\n');
 if(/early-child-name-audio|audio\/names|names\/manifest/.test(texts))files=files.concat(walk('resources/early-child-name-audio').filter(runtime));
 const rows=[...new Set(files)].filter(runtime).filter(p=>fs.existsSync(path.join(root,p))).sort().map(record);
 const version=hash(JSON.stringify(rows)).slice(0,16),policy=overrides.apps[meta.id]||{};
 const bundle={schema:1,id:meta.id,version,files:rows};
 fs.writeFileSync(path.join(root,'data/offline',meta.id+'.json'),JSON.stringify(bundle)+'\n');
 result.apps.push({id:meta.id,title:meta.title_ar,age:meta.age_group,entry:dir+'/index.html',directory:dir+'/',version,release:String(meta.version||1),bytes:rows.reduce((n,r)=>n+r.bytes,0),count:rows.length,manifest:'data/offline/'+meta.id+'.json',required:!!policy.required,minimumVersion:policy.minimumVersion||null,updateNote:policy.note_ar||'',networkNote:'المزامنة العائلية والذكاء الاصطناعي والصوت السحابي تحتاج اتصالًا؛ الأنشطة والمواد المحلية تعمل دون اتصال.'});
}
fs.writeFileSync(path.join(root,'data/offline-catalog.json'),JSON.stringify(result,null,2)+'\n');
console.log('Offline catalog:',result.apps.length,'applications; no install-time bulk download.');
