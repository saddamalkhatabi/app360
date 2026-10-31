'use strict';
const fs=require('fs'),path=require('path'),sharp=require('sharp'),crypto=require('crypto');
const input=process.argv[2];if(!input)throw Error('Pass the local source-index.json file.');
const entries=JSON.parse(fs.readFileSync(input)),root=path.resolve(__dirname,'..'),out=path.join(root,'apps/1-4/wonder-machine/assets/devices'),report=path.dirname(path.resolve(input)),originals=path.join(report,'originals'),qa=path.join(report,'atlas-qa');
fs.mkdirSync(out,{recursive:true});fs.mkdirSync(originals,{recursive:true});fs.mkdirSync(qa,{recursive:true});
const append=process.argv.includes('--append'),manifest=append?JSON.parse(fs.readFileSync(path.join(out,'manifest.json'))):{schema:1,frameOrder:['A0 B0','A1 B0','A0 B1','A1 B1'],atlas:[2048,1152],frame:[1024,576],masterAtlas:[3328,1872],devices:[]},prompts=[];
(async()=>{
for(const entry of entries){
const web=[],master=[],sources=[];for(let n=0;n<4;n++){const source=entry.frames[n],meta=await sharp(source.path).metadata();if(meta.width<1500||meta.height<800)throw Error(entry.id+' frame '+n+' is not a full-resolution source');
const raw=fs.readFileSync(source.path),filename=entry.id+'-'+n+'.png';fs.copyFileSync(source.path,path.join(originals,filename));sources.push({frame:n,width:meta.width,height:meta.height,sha256:crypto.createHash('sha256').update(raw).digest('hex'),repeated:!!source.repeated});
web.push({input:await sharp(source.path).resize(1024,576,{fit:'cover'}).png().toBuffer(),left:n%2*1024,top:Math.floor(n/2)*576});
master.push({input:await sharp(source.path).resize(1664,936,{fit:'cover'}).png().toBuffer(),left:n%2*1664,top:Math.floor(n/2)*936});
prompts.push({device:entry.id,frame:n,prompt:source.prompt,repeated:!!source.repeated});
}
const file=path.join(out,entry.id+'.webp');let quality=82;do{await sharp({create:{width:2048,height:1152,channels:3,background:'#eee'}}).composite(web).webp({quality,effort:6}).toFile(file);quality-=4;}while(fs.statSync(file).size>700000&&quality>=66);if(fs.statSync(file).size>750000)throw Error(entry.id+' exceeds web byte budget');
await sharp({create:{width:3328,height:1872,channels:3,background:'#eee'}}).composite(master).webp({quality:96,effort:5}).toFile(path.join(originals,entry.id+'-master.webp'));
await sharp(entry.frames[0].path).resize(256,144,{fit:'cover'}).webp({quality:70}).toFile(path.join(out,entry.id+'-thumb.webp'));
await sharp(file).resize(960,540).png().toFile(path.join(qa,entry.id+'.png'));
manifest.devices=manifest.devices.filter(x=>x.id!==entry.id);manifest.devices.push({id:entry.id,atlas:'assets/devices/'+entry.id+'.webp',bytes:fs.statSync(file).size,thumbBytes:fs.statSync(path.join(out,entry.id+'-thumb.webp')).size,sources});
console.log(entry.id,fs.statSync(file).size);
}
fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n');
fs.writeFileSync(path.join(report,'prepared-frame-prompts.json'),JSON.stringify(prompts,null,2)+'\n');

console.log(JSON.stringify({atlases:manifest.devices.length,totalBytes:manifest.devices.reduce((n,x)=>n+x.bytes+x.thumbBytes,0),masterAtlas:manifest.masterAtlas,webFrame:manifest.frame}));
})().catch(e=>{console.error(e);process.exitCode=1;});
