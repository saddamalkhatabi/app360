'use strict';
(function(){
/* v7: exact piece geometry, per-piece sizes/colors, exact tool grouping, and a self-contained composition area. */
var PI=Math.PI;
function round3(v){return Math.round(v*1000)/1000}
function rotKey(r){var two=PI*2,x=(r||0)%two;if(x<0)x+=two;return Math.round(x*100)/100}
function pieceScaleValue(raw){return raw&&raw.length>4&&raw[4]?raw[4]:1}
function pieceColorValue(raw,type,i){return raw&&raw.length>5&&raw[5]?raw[5]:(typePalette[type]||palette[i%palette.length])}
function geomKey(p){return p.type+'|'+round3(p.factor||1)+'|'+rotKey(p.rot||0)}
function compositionRectV7(){
 var inner=zones&&zones.targetInner?zones.targetInner:{x:0,y:0,w:W,h:H};
 var w0=Math.min(inner.w*.72,inner.h*1.15);
 var h0=Math.min(inner.h*.80,inner.w*.72);
 if(w0<120)w0=Math.max(80,inner.w*.84);
 if(h0<120)h0=Math.max(80,inner.h*.84);
 return {x:inner.x+(inner.w-w0)/2,y:inner.y+(inner.h-h0)/2,w:w0,h:h0};
}
var oldTargetPieceScale=targetPieceScale;
targetPieceScale=function(){
 var cr=compositionRectV7(),m=Math.min(cr.w,cr.h),p=currentPuzzle&&currentPuzzle();
 if(level===0){return n(m*.205,38,92)*(p&&p.pieceScale?p.pieceScale:1)}
 return oldTargetPieceScale();
};
rebuildPieces=function(){
 var cp=currentPuzzle&&currentPuzzle(),raw=cp&&cp.pieces?cp.pieces:[],old={},i,a,o,base=targetPieceScale(),cr=compositionRectV7(),factor;
 for(i=0;i<pieces.length;i++)old[pieces[i].id]=pieces[i];
 pieces=[];
 for(i=0;i<raw.length;i++){
  a=raw[i];o=old['p'+i];factor=pieceScaleValue(a);
  pieces.push({id:'p'+i,type:a[0],tx:cr.x+a[1]*cr.w,ty:cr.y+a[2]*cr.h,rot:a[3]||0,size:base*factor,factor:factor,color:pieceColorValue(a,a[0],i),placed:o?o.placed:false,state:o?(o.placed?'placed':(o.state==='drag'?'tray':o.state)):'tray',x:o?o.x:0,y:o?o.y:0,magnet:false});
 }
 for(i=0;i<pieces.length;i++){
  if(pieces[i].placed){pieces[i].state='placed';pieces[i].x=pieces[i].tx;pieces[i].y=pieces[i].ty}
  else if(pieces[i].state!=='drag'){pieces[i].state='tray'}
 }
 buildTrayStacks();updateStatus();
};
buildTrayStacks=function(){
 var map={},order=[],i,p,k,cols,rows,rect=zones.trayInner,slotW,slotH,r,c,idx,g;
 trayStacks=[];
 for(i=0;i<pieces.length;i++){
  p=pieces[i];if(p.state!=='tray')continue;k=geomKey(p);
  if(!map[k]){map[k]={key:k,type:p.type,rot:p.rot||0,factor:p.factor||1,color:p.color,count:0,members:[]};order.push(k)}
  map[k].count++;map[k].members.push(p.id);
 }
 if(!order.length)return;
 if(zones.mode==='side')cols=rect.w<180?1:2;else cols=order.length<=4?order.length:(order.length<=8?4:5);
 if(cols<1)cols=1;rows=Math.ceil(order.length/cols);slotW=rect.w/cols;slotH=rect.h/rows;
 for(idx=0;idx<order.length;idx++){
  c=idx%cols;r=Math.floor(idx/cols);g=map[order[idx]];
  g.x=rect.x+slotW*(c+.5);g.y=rect.y+slotH*(r+.5);
  g.size=trayPieceScale(slotW,slotH)*n(g.factor||1,.62,1.22);
  trayStacks.push(g);
 }
};
drawTrayStack=function(g){
 var rep={type:g.type,size:g.size,rot:g.rot||0},i,layers=Math.min(g.count,3);
 for(i=layers-1;i>=0;i--)drawPiece(ctx,rep,g.x-i*4,g.y-i*4,'#f6efd9',1,1.6,g.size);
 drawPiece(ctx,rep,g.x,g.y,g.color||typePalette[g.type]||palette[0],1,2.2,g.size);
 if(g.count>1){ctx.save();ctx.fillStyle='#e85a34';ctx.beginPath();ctx.arc(g.x+g.size*.42,g.y-g.size*.42,Math.max(12,g.size*.20),0,Math.PI*2);ctx.fill();ctx.fillStyle='#fff';ctx.font='bold '+Math.round(Math.max(12,g.size*.22))+'px Tahoma';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(g.count),g.x+g.size*.42,g.y-g.size*.42+1);ctx.restore()}
};
hitStack=function(pt,stack){
 var dx=pt.x-stack.x,dy=pt.y-stack.y,c=Math.cos(-(stack.rot||0)),s=Math.sin(-(stack.rot||0)),q={x:dx*c-dy*s,y:dx*s+dy*c};
 if(pointInPoly(q,shape(stack.type,stack.size*settings.pickupFactor*1.02)))return true;
 return Math.abs(q.x)<stack.size*.72*settings.pickupFactor&&Math.abs(q.y)<stack.size*.72*settings.pickupFactor;
};
nearestCompatibleTarget=function(p){
 var i,q,best=null,bestD=1e9,dd,k=geomKey(p);
 for(i=0;i<pieces.length;i++){
  q=pieces[i];if(q.placed||geomKey(q)!==k)continue;
  dd=dist({x:p.x,y:p.y},{x:q.tx,y:q.ty});if(dd<bestD){bestD=dd;best=q}
 }
 return best?{p:best,d:bestD}:null;
};
drawGuidePiece=function(p,alpha){drawPiece(ctx,p,p.tx,p.ty,'#b29a78',Math.min(.28,alpha),2.4)};
})();
