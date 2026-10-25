'use strict';
// Build the general MP3/legacy PCM bank, then index complete phrases in all 18 apps.
const fs=require('node:fs'),crypto=require('node:crypto'),cp=require('node:child_process');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),record=p=>{const b=fs.readFileSync(p);return {path:p,bytes:b.length,sha256:hash(b)}};
const root='resources/celebration-audio/',generic=JSON.parse(fs.readFileSync(root+'full-praise-generics.json'));
const phrases=JSON.parse(fs.readFileSync(root+'phrases.json')),pcmContext={window:{}};
require('node:vm').runInNewContext(fs.readFileSync(root+'pcm-v1.js','utf8'),pcmContext);const pcm=pcmContext.window.APP360_CELEBRATION_PCM;
for(const g of ['f','m']){const a=generic[g];if(!a)throw Error('Missing generic full praise '+g);const file=root+a.path;if(hash(fs.readFileSync(file))!==a.sha256)throw Error('Generic digest changed');const row={...a,id:'well-done-dear-'+g,language:'ar',kind:'generic'};phrases.items=phrases.items.filter(r=>r.id!==row.id).concat([row]);const raw=cp.execFileSync('ffmpeg',['-v','error','-i',file,'-f','u8','-ac','1','-ar',String(pcm.rate||16000),'-']);pcm.clips[row.id]=raw.toString('base64');}
fs.writeFileSync(root+'phrases.json',JSON.stringify(phrases,null,2)+'\n');fs.writeFileSync(root+'manifest-v1.js','window.APP360_CELEBRATION_MANIFEST='+JSON.stringify(phrases)+';\n');fs.writeFileSync(root+'pcm-v1.js','window.APP360_CELEBRATION_PCM='+JSON.stringify(pcm)+';\n');
const names=JSON.parse(fs.readFileSync(root+'names.json')),shared=['assets/js/teacher-encouragement-v1.js',root+'player-v1.js',root+'names.json',root+'full-praise-generics.json',root+'manifest-v1.js',root+'pcm-v1.js',root+'phrases.json',...['f','m'].map(g=>root+generic[g].path)];
for(const row of names.records)for(const g of ['f','m']){const a=row.praise_audio&&row.praise_audio[g];if(a)shared.push(root+a.path)}
const records=shared.map(record),catalog=JSON.parse(fs.readFileSync('data/offline-catalog.json'));
for(const app of catalog.apps){const m=JSON.parse(fs.readFileSync(app.manifest)),map=new Map(m.files.filter(r=>!/^resources\/celebration-audio\/audio\/(names|praise)\//.test(r.path)).map(r=>[r.path,r]));for(const r of records)map.set(r.path,r);for(const [p,r] of map)if(fs.existsSync(p)&&(/\.html$/.test(p)||shared.includes(p)))map.set(p,record(p));m.files=[...map.values()].sort((a,b)=>a.path.localeCompare(b.path,'en'));m.version=hash(JSON.stringify(m.files)).slice(0,16);fs.writeFileSync(app.manifest,JSON.stringify(m)+'\n');app.version=m.version;app.bytes=m.files.reduce((s,r)=>s+r.bytes,0);app.count=m.files.length;}
fs.writeFileSync('data/offline-catalog.json',JSON.stringify(catalog,null,2)+'\n');console.log(JSON.stringify({apps:catalog.apps.length,complete_phrase_files:shared.length-9}));
