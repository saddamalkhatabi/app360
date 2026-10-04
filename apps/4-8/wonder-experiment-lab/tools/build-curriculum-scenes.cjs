/* Crop approved 4x4 photographic boards into four independent 2x2 scene atlases.
   node tools/build-curriculum-scenes.cjs source-map.json
   Input: [{board:1,path:'/absolute/source.png'}, ...]; originals remain unchanged. */
'use strict';
const fs=require('fs'),path=require('path'),sharp=require('sharp'),crypto=require('crypto');
const app=path.resolve(__dirname,'..'),hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const boards=JSON.parse(fs.readFileSync(process.argv[2],'utf8'));
 const tasks=JSON.parse(fs.readFileSync(path.join(app,'data/levels-2-3-authored.json'),'utf8')).activities;
 const dest=path.join(app,'assets/scenes'),old=JSON.parse(fs.readFileSync(path.join(dest,'manifest.json'),'utf8'));
 let assets=old.assets.filter(a=>!tasks.some(q=>q.scene_key===a.id));const provenance=[];
 for(const board of boards){
  const data=fs.readFileSync(board.path),m=await sharp(data).metadata();
  if(m.width!==m.height||m.width<1024||board.board<1||board.board>10)throw Error('Invalid photographic board');
  const sourceHash=hash(data);
  for(let row=0;row<4;row++){
   const q=tasks[(board.board-1)*4+row],cells=[];
   for(let col=0;col<4;col++){
    const left=Math.floor(col*m.width/4)+5,top=Math.floor(row*m.height/4)+5;
    const width=Math.floor((col+1)*m.width/4)-left-5,height=Math.floor((row+1)*m.height/4)-top-5;
    cells.push({input:await sharp(data).extract({left,top,width,height}).resize(512,512).toBuffer(),left:(col%2)*512,top:Math.floor(col/2)*512});
   }
   const file=q.scene_key+'.jpg';await sharp({create:{width:1024,height:1024,channels:3,background:'#fff'}}).composite(cells).jpeg({quality:82,mozjpeg:true}).toFile(path.join(dest,file));
   const image=fs.readFileSync(path.join(dest,file));assets.push({id:q.scene_key,file,width:1024,height:1024,frames:4,bytes:image.length,sha256:hash(image)});
   provenance.push({id:q.id,source_board:board.board,source_row:row+1,source_sha256:sourceHash,source_dimensions:[m.width,m.height],operation:'crop, resize and arrange; no semantic pixel edits'});
  }
 }
 if(provenance.length!==40||assets.length!==64)throw Error('Expected 40 new and 64 total atlases');
 fs.writeFileSync(path.join(dest,'manifest.json'),JSON.stringify({...old,assets},null,2)+'\n');
 fs.writeFileSync(path.join(dest,'levels-2-3-provenance.json'),JSON.stringify({generated_with:'built-in imagegen',review_date:'2026-10-04',assets:provenance},null,2)+'\n');
 console.log(JSON.stringify({atlases:assets.length,frames:assets.length*4,bytes:assets.reduce((n,a)=>n+a.bytes,0)}));
})().catch(e=>{console.error(e);process.exitCode=1});
