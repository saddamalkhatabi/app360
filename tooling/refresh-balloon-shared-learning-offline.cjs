'use strict';
// Preserve each bundle's declared boundary; add new media only to its canonical owner.
const fs=require('fs'),vm=require('vm'),path=require('path'),crypto=require('crypto'),child=require('child_process');
const root=path.resolve(__dirname,'..');process.chdir(root);
const base='apps/1-4/say-and-name/',w={};
vm.runInNewContext(fs.readFileSync(base+'data/meaning-audio-v1.js','utf8'),{window:w});
const numbers=JSON.parse(fs.readFileSync(base+'data/number-lessons-20.json','utf8'));
const extra=[base+'data/number-lessons-20.json'];
for(const n of numbers.numbers)for(const ext of ['jpg','svg'])extra.push(base+'assets/word-images/number-'+n.value+'-blocks.'+ext);
for(const id of numbers.new_clip_ids){const clip=w.APP360_MEANING_AUDIO.clips[id];if(!clip)throw Error('Missing verified number speech '+id);extra.push(base+clip.path);}
const file='data/offline/a1-first-words.json',bundle=JSON.parse(fs.readFileSync(file));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex'),record=p=>{const b=fs.readFileSync(p);return{path:p,bytes:b.length,sha256:hash(b)};};
const map=new Map(bundle.files.map(x=>[x.path,x]));for(const p of extra)map.set(p,record(p));bundle.files=[...map.values()].sort((a,b)=>a.path.localeCompare(b.path,'en'));fs.writeFileSync(file,JSON.stringify(bundle)+'\n');
child.execFileSync(process.execPath,['tooling/build-balloon-garden-offline.cjs'],{stdio:'inherit'});
child.execFileSync(process.execPath,['tooling/refresh-membership-offline.cjs'],{stdio:'inherit'});
console.log('Canonical word library and Balloon Garden share verified number lessons; unrelated bundles retain their resource boundaries.');
