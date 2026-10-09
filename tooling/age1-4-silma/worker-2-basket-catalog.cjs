/* Generate basket narration catalog from existing app data; Node.js only. */
'use strict';
const fs=require('fs'),path=require('path');
const root=path.resolve(__dirname,'../../apps/1-4/sensory-motion-missions');
const src=fs.readFileSync(path.join(root,'simulation.js'),'utf8');
const groups=[],re=/\['[^']+',\[([^\]]+)\]\]/g;
let match;
while((match=re.exec(src))!==null){const names=[...match[1].matchAll(/'([^']+)'/g)].map(x=>x[1]);if(names.length===8)groups.push(names)}
if(groups.length!==6)throw Error('Unexpected basket category structure');
const words=[...new Set(groups.flat())];
const file=path.join(root,'audio/silma/worker-2-manifest.json');
const manifest=JSON.parse(fs.readFileSync(file,'utf8'));
const items=manifest.items.filter(x=>!x.key.startsWith('in:')&&!x.key.startsWith('out:'));
for(let i=0;i<words.length;i++){
 const word=words[i],num=String(i+1).padStart(3,'0');
 items.push({key:'in:'+word,path:'audio/silma/worker-2/words/'+num+'-in.mp3',text:'دخلت '+word+' إلى السلة.',language:'ar',engine:'silma',focus:'basket',ready:false});
 items.push({key:'out:'+word,path:'audio/silma/worker-2/words/'+num+'-out.mp3',text:'خرجت '+word+' من السلة.',language:'ar',engine:'silma',focus:'insideBasket',ready:false});
}
manifest.items=items;manifest.synthesis='NOT_GENERATED';manifest.counts={categories:groups.length,unique_words:words.length,clips:items.length};
fs.writeFileSync(file,JSON.stringify(manifest,null,2)+'\n','utf8');
console.log(JSON.stringify(manifest.counts));
