'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const manifest=JSON.parse(fs.readFileSync('storyboards/manifest.json'));
function size(path){
 const b=fs.readFileSync(path);assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');
 for(let i=12;i+8<=b.length;){const kind=b.toString('ascii',i,i+4),n=b.readUInt32LE(i+4),p=i+8;
  if(kind==='VP8X')return [b.readUIntLE(p+4,3)+1,b.readUIntLE(p+7,3)+1];
  if(kind==='VP8 ')return [b.readUInt16LE(p+6)&16383,b.readUInt16LE(p+8)&16383];
  i=p+n+(n%2);
 }throw Error('No supported WebP frame: '+path);
}
test('all 220 experiences use a real five-square photographic atlas',()=>{
 assert.equal(Object.keys(manifest.assets).length,220);
 const localized=Object.values(manifest.localized_assets||{}).flatMap(Object.values);
 for(const path of new Set([...Object.values(manifest.assets),...localized]))assert.deepEqual(size(path),[4500,900],path);
});
test('the reviewed scenes have distinct atlases and square library previews',()=>{
 const report=JSON.parse(fs.readFileSync('storyboards/photo-build-report.json'));
 assert.equal(report.assets.filter(a=>Number(a.id)>=201).length,20);
 assert.equal(new Set(report.assets.map(a=>a.path)).size,21);
 for(const a of report.assets){assert.equal(manifest.assets[a.id],a.path);assert.equal(manifest.previews[a.id],a.preview);assert.deepEqual(size(a.preview),[320,320]);assert.equal(a.placements.length,5);
  assert.equal(crypto.createHash('sha256').update(fs.readFileSync(a.path)).digest('hex'),a.sha256);
  a.placements.forEach((p,i)=>{const [x,y,w,h]=p.destination_rect;assert.ok(x>=i*900&&x+w<=(i+1)*900&&y>=0&&y+h<=900);const [l,t,r,b]=p.source_rect;assert.ok(Math.abs(w/h-(r-l)/(b-t))<.005,'aspect ratio preserved for '+a.id)});
 }
});
