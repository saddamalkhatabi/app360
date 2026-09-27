'use strict';
(function(){
/* v11: advanced-level fit, compact connected silhouettes, overlap guard, and larger tools. */
var PI=Math.PI, oldRebuildV11=rebuildPieces;
function rf(a){return a&&a.length>4&&a[4]?a[4]:1}
function rc(a,t,i){return a&&a.length>5&&a[5]?a[5]:(typePalette[t]||palette[i%palette.length])}
function nf(f){return n(.76+(f||1)*.34,.84,1.18)}
function layout(raw){
 var i,a,minX=9,maxX=-9,minY=9,maxY=-9,spanX,spanY,aw,ah,s,w0,h0;
 for(i=0;i<raw.length;i++){a=raw[i];if(a[1]<minX)minX=a[1];if(a[1]>maxX)maxX=a[1];if(a[2]<minY)minY=a[2];if(a[2]>maxY)maxY=a[2]}
 spanX=Math.max(.18,maxX-minX);spanY=Math.max(.18,maxY-minY);
 aw=zones.targetInner.w*(zones.mode==='side'?.88:.91);ah=zones.targetInner.h*(zones.mode==='side'?.84:.84);
 s=Math.min(aw/spanX,ah/spanY);w0=spanX*s;h0=spanY*s;
 return{minX:minX,minY:minY,spanX:spanX,spanY:spanY,s:s,x:zones.targetInner.x+(zones.targetInner.w-w0)/2,y:zones.targetInner.y+(zones.targetInner.h-h0)/2,w:w0,h:h0};
}
function inside(p){var r=Math.max(7,p.size*.46);p.tx=n(p.tx,zones.targetInner.x+r,zones.targetInner.x+zones.targetInner.w-r);p.ty=n(p.ty,zones.targetInner.y+r,zones.targetInner.y+zones.targetInner.h-r)}
function repel(list){var pass,i,j,a,b,dx,dy,d,minD,u,v,push;for(pass=0;pass<7;pass++){for(i=0;i<list.length;i++){for(j=i+1;j<list.length;j++){a=list[i];b=list[j];dx=b.tx-a.tx;dy=b.ty-a.ty;d=Math.sqrt(dx*dx+dy*dy);minD=(a.size+b.size)*.31;if(d<minD){if(d<1){u=((i+j)%2?1:-1);v=((j%3)-1)*.28;d=1}else{u=dx/d;v=dy/d}push=(minD-d)*.50+1;a.tx-=u*push*.47;a.ty-=v*push*.47;b.tx+=u*push*.53;b.ty+=v*push*.53;inside(a);inside(b)}}}}}
rebuildPieces=function(){
 if(level!==2){oldRebuildV11();return}
 var cp=currentPuzzle&&currentPuzzle(),raw=cp&&cp.pieces?cp.pieces:[],old={},i,a,o,l=layout(raw),base=n(l.s*.112,42,W>1200?138:(W>700?116:98)),f;
 base*=cp&&cp.pieceScale?cp.pieceScale:1;
 for(i=0;i<pieces.length;i++)old[pieces[i].id]=pieces[i];pieces=[];
 for(i=0;i<raw.length;i++){
  a=raw[i];o=old['p'+i];f=rf(a);
  pieces.push({id:'p'+i,type:a[0],tx:l.x+((a[1]-l.minX)/l.spanX)*l.w,ty:l.y+((a[2]-l.minY)/l.spanY)*l.h,rot:a[3]||0,size:base*nf(f),factor:f,color:rc(a,a[0],i),placed:o?o.placed:false,state:o?(o.placed?'placed':(o.state==='drag'?'tray':o.state)):'tray',x:o?o.x:0,y:o?o.y:0,magnet:false});
 }
 repel(pieces);
 for(i=0;i<pieces.length;i++){if(pieces[i].placed){pieces[i].state='placed';pieces[i].x=pieces[i].tx;pieces[i].y=pieces[i].ty}else if(pieces[i].state!=='drag')pieces[i].state='tray'}
 buildTrayStacks();updateStatus();
};
var oldTrayScaleV11=trayPieceScale;
trayPieceScale=function(sw,sh){return n(Math.max(oldTrayScaleV11(sw,sh),Math.min(sw,sh)*.58),34,W>1000?106:90)};
})();
