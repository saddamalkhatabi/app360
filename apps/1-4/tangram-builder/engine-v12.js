'use strict';
(function(){
/* v12: one-screen responsive layout. Keeps figures large, close and non-overlapping on phone, tablet and desktop. */
var PI=Math.PI;
function rf(a){return a&&a.length>4&&a[4]?a[4]:1}
function rc(a,t,i){return a&&a.length>5&&a[5]?a[5]:(typePalette[t]||palette[i%palette.length])}
function nf(f){return n(.82+(f||1)*.30,.91,1.16)}
function inside(p){var r=Math.max(6,p.size*.48);p.tx=n(p.tx,zones.targetInner.x+r,zones.targetInner.x+zones.targetInner.w-r);p.ty=n(p.ty,zones.targetInner.y+r,zones.targetInner.y+zones.targetInner.h-r)}
function repel(list){var pass,i,j,a,b,dx,dy,d,minD,u,v,push;for(pass=0;pass<6;pass++){for(i=0;i<list.length;i++){for(j=i+1;j<list.length;j++){a=list[i];b=list[j];dx=b.tx-a.tx;dy=b.ty-a.ty;d=Math.sqrt(dx*dx+dy*dy);minD=(a.size+b.size)*.45;if(d<minD){if(d<1){u=((i+j)%2?1:-1);v=((j%3)-1)*.28;d=1}else{u=dx/d;v=dy/d}push=(minD-d)*.52+1;a.tx-=u*push*.48;a.ty-=v*push*.48;b.tx+=u*push*.52;b.ty+=v*push*.52;inside(a);inside(b)}}}}}
computeZones=function(){
 var pad=Math.max(6,Math.round(Math.min(W,H)*.014)),split;
 if(W/H>1.12){
  zones.mode='side';split=Math.round(W*.76);
  zones.target={x:pad,y:pad,w:split-pad*1.2,h:H-pad*2};
  zones.tray={x:split+pad*.20,y:pad,w:W-split-pad*1.2,h:H-pad*2};
 }else{
  zones.mode='stack';split=Math.round(H*.64);
  zones.target={x:pad,y:pad,w:W-pad*2,h:split-pad*.8};
  zones.tray={x:pad,y:split+pad*.15,w:W-pad*2,h:H-split-pad*1.15};
 }
 zones.targetInner={x:zones.target.x+8,y:zones.target.y+34,w:Math.max(90,zones.target.w-16),h:Math.max(82,zones.target.h-42)};
 zones.trayInner={x:zones.tray.x+8,y:zones.tray.y+34,w:Math.max(80,zones.tray.w-16),h:Math.max(72,zones.tray.h-42)};
};
function unitFor(inner){var ux=inner.w/.88,uy=inner.h/.76;return Math.min(ux,uy)}
rebuildPieces=function(){
 var cp=currentPuzzle&&currentPuzzle(),raw=cp&&cp.pieces?cp.pieces:[],old={},i,a,o,inner=zones.targetInner,unit=unitFor(inner),compact=zones.mode==='side'?.82:.76,
     coef=level===0?.145:(level===1?.128:.116),base=n(unit*coef,level===0?40:(level===1?37:34),W>1200?138:(W>700?112:94)),f,cx=inner.x+inner.w*.50,cy=inner.y+inner.h*.50;
 base*=cp&&cp.pieceScale?cp.pieceScale:1;
 for(i=0;i<pieces.length;i++)old[pieces[i].id]=pieces[i];pieces=[];
 for(i=0;i<raw.length;i++){
  a=raw[i];o=old['p'+i];f=rf(a);
  pieces.push({id:'p'+i,type:a[0],tx:cx+(a[1]-.50)*unit*compact,ty:cy+(a[2]-.45)*unit*compact,rot:a[3]||0,size:base*nf(f),factor:f,color:rc(a,a[0],i),placed:o?o.placed:false,state:o?(o.placed?'placed':(o.state==='drag'?'tray':o.state)):'tray',x:o?o.x:0,y:o?o.y:0,magnet:false});
 }
 repel(pieces);
 for(i=0;i<pieces.length;i++){if(pieces[i].placed){pieces[i].state='placed';pieces[i].x=pieces[i].tx;pieces[i].y=pieces[i].ty}else if(pieces[i].state!=='drag')pieces[i].state='tray'}
 buildTrayStacks();updateStatus();
};
trayPieceScale=function(sw,sh){return n(Math.min(sw,sh)*.68,38,W>1000?108:92)};
})();
