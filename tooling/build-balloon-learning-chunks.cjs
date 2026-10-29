'use strict';
// Keep the canonical timing data intact; request only the current word's bucket.
const fs=require('fs'),path=require('path'),vm=require('vm');
const dir=path.resolve(__dirname,'../apps/1-4/balloon-garden'),ctx={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(dir,'learning.js'),'utf8'),ctx);
const source=ctx.window.BalloonGardenLearning,buckets={};
for(const [id,rows] of Object.entries(source.items)){
 const bucket=buckets[id[0]]||(buckets[id[0]]={items:{},clips:{}});
 bucket.items[id]=rows;
 for(const row of rows)for(const lang of ['ar','en']){
  const line=row[lang];if(line&&source.clips[line.clip])bucket.clips[line.clip]=source.clips[line.clip];
 }
}
fs.mkdirSync(path.join(dir,'learning'),{recursive:true});
for(const [id,data] of Object.entries(buckets))fs.writeFileSync(path.join(dir,'learning',id+'.js'),
 '(function(w){var d='+JSON.stringify(data)+',t=w.BalloonGardenLearning||(w.BalloonGardenLearning={items:{},clips:{}}),k;for(k in d.items)t.items[k]=d.items[k];for(k in d.clips)t.clips[k]=d.clips[k];})(window);\n');
console.log('Built '+Object.keys(buckets).length+' on-demand sentence buckets.');
