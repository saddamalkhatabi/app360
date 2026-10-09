'use strict';
/* Worker 2 SILMA structural and presence audit; does not synthesize. */
const fs=require('fs'),path=require('path'),assert=require('assert');
const repo=path.resolve(__dirname,'../../..');
const apps=['screen-to-move','imitate-one-step','my-little-routine','tangram-builder'];
const expected=[289,302,80,207],results=[];
function read(p){return JSON.parse(fs.readFileSync(p,'utf8'))}
function check(app,rows,expectedCount){
 assert.strictEqual(rows.length,expectedCount,app+' clip count');
 const paths=new Set();
 for(const row of rows){
  assert(row.text&&typeof row.text==='string',app+' missing text');
  assert(row.path&&row.path.indexOf('audio/silma/')===0&&row.path.indexOf('..')<0,app+' unsafe path');
  assert(!paths.has(row.path),app+' duplicate path '+row.path);paths.add(row.path);
  if(row.ready===true)assert(fs.statSync(path.join(repo,'apps/1-4',app,row.path)).size>512,app+' false ready');
 }
 const root=path.join(repo,'apps/1-4',app);
 const present=rows.filter(r=>fs.existsSync(path.join(root,r.path))).length;
 return {app,planned:rows.length,mp3_present:present,ready:rows.filter(r=>r.ready===true).length};
}
for(let i=0;i<apps.length;i++){
 const app=apps[i],p=path.join(repo,'apps/1-4',app,'audio/silma/worker-2-manifest.json');
 results.push(check(app,read(p).items,expected[i]));
}
const basket='sensory-motion-missions',root=path.join(repo,'apps/1-4',basket,'audio/silma');
const parts=['common','category-toys','category-fruits','category-animals','category-home','category-transport','category-nature'];
let rows=[];for(const part of parts){rows=rows.concat(read(path.join(root,'worker-2-'+part+'-v2.json')).items)}
results.push(check(basket,rows,103));
assert.strictEqual(new Set(rows.map(r=>r.key)).size,103,'basket keys');
console.log(JSON.stringify({worker:2,verified_structure:true,results},null,2));
