'use strict';
/* Prepare basket SILMA build input; mark ready only after ffprobe verification. */
const fs=require('fs'),path=require('path'),cp=require('child_process'),assert=require('assert');
const root=path.resolve(__dirname,'../../../apps/1-4/sensory-motion-missions');
const dir=path.join(root,'audio/silma');
const parts=['common','category-toys','category-fruits','category-animals','category-home','category-transport','category-nature'];
const docs=parts.map(p=>({name:p,file:path.join(dir,'worker-2-'+p+'-v2.json')}));
const entries=[],keys=new Set(),paths=new Set();
for(const part of docs){
 part.data=JSON.parse(fs.readFileSync(part.file,'utf8'));
 for(const r of part.data.items){
  assert(r.key&&r.path&&r.text&&r.ready===false||r.ready===true,'bad row');
  assert(!keys.has(r.key)&&!paths.has(r.path),'duplicate audio entry');
  assert(r.path.indexOf('audio/silma/')===0&&r.path.indexOf('..')<0,'unsafe path');
  keys.add(r.key);paths.add(r.path);
  entries.push(Object.assign({language:'ar',engine:'silma'},r));
 }
}
assert.strictEqual(entries.length,103,'unexpected basket catalog size');
const out=path.join(dir,'worker-2-synthesis-manifest.json');
fs.writeFileSync(out,JSON.stringify({schema_version:2,worker:2,app:'sensory-motion-missions',synthesis:'NOT_GENERATED',items:entries},null,2)+'\n');
const unvowelled=entries.filter(r=>!/[\u064B-\u0652]/.test(r.text));
if(process.argv.indexOf('--mark-verified')>=0){
 assert.strictEqual(unvowelled.length,0,'review diacritics before marking clips ready');
 for(const r of entries){
  const file=path.join(root,r.path);
  assert(fs.existsSync(file)&&fs.statSync(file).size>512,'missing MP3 '+r.path);
  const check=cp.spawnSync('ffprobe',['-v','error','-show_entries','format=duration','-of','default=noprint_wrappers=1:nokey=1',file],{encoding:'utf8'});
  assert.strictEqual(check.status,0,'invalid MP3 '+r.path);
  assert(Number(check.stdout)>0.3,'short MP3 '+r.path);
 }
 for(const part of docs){part.data.items.forEach(r=>r.ready=true);part.data.synthesis='VERIFIED_MP3';fs.writeFileSync(part.file,JSON.stringify(part.data,null,2)+'\n')}
}
console.log(JSON.stringify({clips:entries.length,unvowelled:unvowelled.length,marked:process.argv.indexOf('--mark-verified')>=0,output:out}));
