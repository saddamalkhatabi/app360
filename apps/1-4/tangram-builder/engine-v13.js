'use strict';
(function(){
/* v13: clear size families for identical shapes. Same-size circles group together; different sizes are visually unmistakable. */
var PI=Math.PI;
function rawFactor13(a){return a&&a.length>4&&a[4]?a[4]:1}
function rawColor13(a,t,i){return a&&a.length>5&&a[5]?a[5]:(typePalette[t]||palette[i%palette.length])}
function factorKey13(v){return Math.round((v||1)*100)/100}
function addUnique13(arr,v){var i,k=factorKey13(v);for(i=0;i<arr.length;i++)if(factorKey13(arr[i])===k)return;arr.push(v)}
function sortNum13(a,b){return a-b}
function profiles13(raw){var m={},i,a,t,k;for(i=0;i<raw.length;i++){a=raw[i];t=a[0];if(!m[t])m[t]=[];addUnique13(m[t],rawFactor13(a))}for(k in m)if(m.hasOwnProperty(k))m[k].sort(sortNum13);return m}
function rankFactor13(type,f,prof){var arr=prof[type]||[f],i,idx=0,k=factorKey13(f);for(i=0;i<arr.length;i++)if(factorKey13(arr[i])===k){idx=i;break}
 if(arr.length===1)return n(.90+(f||1)*.14,.94,1.10);
 if(arr.length===2)return idx===0?.78:1.22;
 if(arr.length===3)return idx===0?.72:(idx===1?.98:1.28);
 if(arr.length===4)return [.70,.88,1.08,1.30][idx]||1;
 return .68+(idx/Math.max(1,arr.length-1))*.64;
}
function inside13(p){var r=Math.max(7,p.size*.49);p.tx=n(p.tx,zones.targetInner.x+r,zones.targetInner.x+zones.targetInner.w-r);p.ty=n(p.ty,zones.targetInner.y+r,zones.targetInner.y+zones.targetInner.h-r)}
function repel13(list){var pass,i,j,a,b,dx,dy,d,minD,u,v,push;for(pass=0;pass<7;pass++){for(i=0;i<list.length;i++){for(j=i+1;j<list.length;j++){a=list[i];b=list[j];dx=b.tx-a.tx;dy=b.ty-a.ty;d=Math.sqrt(dx*dx+dy*dy);minD=(a.size+b.size)*.40;if(d<minD){if(d<1){u=((i+j)%2?1:-1);v=((j%3)-1)*.25;d=1}else{u=dx/d;v=dy/d}push=(minD-d)*.50+1;a.tx-=u*push*.47;a.ty-=v*push*.47;b.tx+=u*push*.53;b.ty+=v*push*.53;inside13(a);inside13(b)}}}}}
function rotKey13(p){var r=p.rot||0,t=p.type;if(t==='circle')return 0;if(t==='square'){r=r%(PI/2);if(r<0)r+=PI/2}return Math.round(r*100)/100}
function geomKey13(p){return p.type+'|'+factorKey13(p.factor||1)+'|'+rotKey13(p)}

var oldRebuild13=rebuildPieces;
rebuildPieces=function(){
 var cp=currentPuzzle&&currentPuzzle(),raw=cp&&cp.pieces?cp.pieces:[],old={},prof=profiles13(raw),i,a,o,inner=zones.targetInner,
     unit=Math.min(inner.w/.86,inner.h/.74),compact=zones.mode==='side'?.80:.74,
     coef=level===0?.148:(level===1?.132:.120),base=n(unit*coef,level===0?42:(level===1?39:36),W>1200?142:(W>700?116:98)),f,vf,cx=inner.x+inner.w*.50,cy=inner.y+inner.h*.50;
 if(!raw.length){oldRebuild13();return}
 base*=cp&&cp.pieceScale?cp.pieceScale:1;
 for(i=0;i<pieces.length;i++)old[pieces[i].id]=pieces[i];pieces=[];
 for(i=0;i<raw.length;i++){
  a=raw[i];o=old['p'+i];f=rawFactor13(a);vf=rankFactor13(a[0],f,prof);
  pieces.push({id:'p'+i,type:a[0],tx:cx+(a[1]-.50)*unit*compact,ty:cy+(a[2]-.45)*unit*compact,rot:a[3]||0,size:base*vf,factor:f,visualFactor:vf,color:rawColor13(a,a[0],i),placed:o?o.placed:false,state:o?(o.placed?'placed':(o.state==='drag'?'tray':o.state)):'tray',x:o?o.x:0,y:o?o.y:0,magnet:false});
 }
 repel13(pieces);
 for(i=0;i<pieces.length;i++){if(pieces[i].placed){pieces[i].state='placed';pieces[i].x=pieces[i].tx;pieces[i].y=pieces[i].ty}else if(pieces[i].state!=='drag')pieces[i].state='tray'}
 buildTrayStacks();updateStatus();
};

buildTrayStacks=function(){
 var map={},order=[],i,p,k,cols,rows,rect=zones.trayInner,slotW,slotH,r,c,idx,g,baseSize;
 trayStacks=[];
 for(i=0;i<pieces.length;i++){
  p=pieces[i];if(p.state!=='tray')continue;k=geomKey13(p);
  if(!map[k]){map[k]={key:k,type:p.type,rot:p.rot||0,factor:p.factor||1,visualFactor:p.visualFactor||1,color:p.color,count:0,members:[]};order.push(k)}
  map[k].count++;map[k].members.push(p.id);
 }
 if(!order.length)return;
 if(zones.mode==='side')cols=rect.w<190?1:2;else cols=order.length<=4?order.length:(order.length<=8?4:5);
 if(cols<1)cols=1;rows=Math.ceil(order.length/cols);slotW=rect.w/cols;slotH=rect.h/rows;baseSize=trayPieceScale(slotW,slotH);
 for(idx=0;idx<order.length;idx++){
  c=idx%cols;r=Math.floor(idx/cols);g=map[order[idx]];
  g.x=rect.x+slotW*(c+.5);g.y=rect.y+slotH*(r+.5);
  g.size=n(baseSize*(g.visualFactor||1),28,Math.min(slotW,slotH)*.78);
  trayStacks.push(g);
 }
};

drawTrayStack=function(g){
 var rep={type:g.type,size:g.size,rot:g.rot||0},i,layers=Math.min(g.count,3),badgeR;
 for(i=layers-1;i>=0;i--)drawPiece(ctx,rep,g.x-i*4,g.y-i*4,'#f6efd9',1,1.5,g.size);
 drawPiece(ctx,rep,g.x,g.y,g.color||typePalette[g.type]||palette[0],1,2.2,g.size);
 if(g.count>1){badgeR=Math.max(11,Math.min(17,g.size*.19));ctx.save();ctx.fillStyle='#e85a34';ctx.beginPath();ctx.arc(g.x+g.size*.43,g.y-g.size*.43,badgeR,0,PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold '+Math.max(11,Math.round(badgeR*.95))+'px Tahoma';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(g.count),g.x+g.size*.43,g.y-g.size*.43+1);ctx.restore()}
};

nearestCompatibleTarget=function(p){return w.APP360_PIECES.nearestCompatible(p,pieces,geomKey13)};
})();
