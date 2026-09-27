'use strict';
(function(){
/* v9: responsive large composition area, collision-aware piece sizing, and stronger 3D rendering. */
var PI=Math.PI;
function rawFactor(a){return a&&a.length>4&&a[4]?a[4]:1}
function rawColor(a,type,i){return a&&a.length>5&&a[5]?a[5]:(typePalette[type]||palette[i%palette.length])}
computeZones=function(){
 var pad=Math.max(8,Math.round(Math.min(W,H)*.018)),split;
 if(W/H>1.08){
  zones.mode='side';split=Math.round(W*.75);
  zones.target={x:pad,y:pad,w:split-pad*1.35,h:H-pad*2};
  zones.tray={x:split+pad*.35,y:pad,w:W-split-pad*1.35,h:H-pad*2};
 }else{
  zones.mode='stack';split=Math.round(H*.68);
  zones.target={x:pad,y:pad,w:W-pad*2,h:split-pad*1.05};
  zones.tray={x:pad,y:split+pad*.10,w:W-pad*2,h:H-split-pad*1.10};
 }
 zones.targetInner={x:zones.target.x+10,y:zones.target.y+38,w:Math.max(80,zones.target.w-20),h:Math.max(80,zones.target.h-48)};
 zones.trayInner={x:zones.tray.x+10,y:zones.tray.y+38,w:Math.max(70,zones.tray.w-20),h:Math.max(70,zones.tray.h-48)};
};
function fitLayout(raw){
 var i,a,minX=9,maxX=-9,minY=9,maxY=-9,spanX,spanY,availW,availH,scale,rectW,rectH;
 for(i=0;i<raw.length;i++){a=raw[i];if(a[1]<minX)minX=a[1];if(a[1]>maxX)maxX=a[1];if(a[2]<minY)minY=a[2];if(a[2]>maxY)maxY=a[2]}
 spanX=Math.max(.18,maxX-minX);spanY=Math.max(.18,maxY-minY);
 availW=zones.targetInner.w*(zones.mode==='side'?.90:.94);availH=zones.targetInner.h*(zones.mode==='side'?.88:.82);
 scale=Math.min(availW/spanX,availH/spanY);rectW=spanX*scale;rectH=spanY*scale;
 return{minX:minX,minY:minY,spanX:spanX,spanY:spanY,scale:scale,x:zones.targetInner.x+(zones.targetInner.w-rectW)/2,y:zones.targetInner.y+(zones.targetInner.h-rectH)/2,w:rectW,h:rectH};
}
function nearestRawDistance(raw,layout){var i,j,a,b,dx,dy,d,best=1e9;for(i=0;i<raw.length;i++){for(j=i+1;j<raw.length;j++){a=raw[i];b=raw[j];dx=(a[1]-b[1])*layout.scale;dy=(a[2]-b[2])*layout.scale;d=Math.sqrt(dx*dx+dy*dy);if(d>2&&d<best)best=d}}return best===1e9?Math.min(layout.w,layout.h)*.25:best}
function separateHiddenCenters(list){
 var i,j,a,b,dx,dy,d,minD,ang,push;
 for(i=0;i<list.length;i++){for(j=i+1;j<list.length;j++){
  a=list[i];b=list[j];dx=b.tx-a.tx;dy=b.ty-a.ty;d=Math.sqrt(dx*dx+dy*dy);minD=Math.min(a.size,b.size)*.16;
  if(d<minD){ang=((j+1)*1.71+(i*.67))%(PI*2);push=(minD-d)*.62+2;a.tx-=Math.cos(ang)*push*.45;a.ty-=Math.sin(ang)*push*.45;b.tx+=Math.cos(ang)*push*.55;b.ty+=Math.sin(ang)*push*.55}
 }}
}
rebuildPieces=function(){
 var cp=currentPuzzle&&currentPuzzle(),raw=cp&&cp.pieces?cp.pieces:[],old={},i,a,o,layout=fitLayout(raw),nearest=nearestRawDistance(raw,layout),m=Math.min(layout.w,layout.h),baseByLevel=level===0?.19:(level===1?.165:.145),base=Math.min(m*baseByLevel,nearest*(level===1?.88:.92)),maxSize=level===0?(W>1100?110:92):(level===1?(W>1100?104:88):(W>1100?94:82)),minSize=level===0?34:(level===1?31:28),factor;
 base=n(base,minSize,maxSize)*(cp&&cp.pieceScale?cp.pieceScale:1);
 for(i=0;i<pieces.length;i++)old[pieces[i].id]=pieces[i];pieces=[];
 for(i=0;i<raw.length;i++){a=raw[i];o=old['p'+i];factor=rawFactor(a);pieces.push({id:'p'+i,type:a[0],tx:layout.x+((a[1]-layout.minX)/layout.spanX)*layout.w,ty:layout.y+((a[2]-layout.minY)/layout.spanY)*layout.h,rot:a[3]||0,size:base*factor,factor:factor,color:rawColor(a,a[0],i),placed:o?o.placed:false,state:o?(o.placed?'placed':(o.state==='drag'?'tray':o.state)):'tray',x:o?o.x:0,y:o?o.y:0,magnet:false})}
 separateHiddenCenters(pieces);
 for(i=0;i<pieces.length;i++){if(pieces[i].placed){pieces[i].state='placed';pieces[i].x=pieces[i].tx;pieces[i].y=pieces[i].ty}else if(pieces[i].state!=='drag')pieces[i].state='tray'}
 buildTrayStacks();updateStatus();
};
drawPiece=function(c,p,x,y,fill,alpha,outline,sizeOverride){
 var s=sizeOverride||p.size,poly=shape(p.type,s),i,grad;c.save();c.globalAlpha=typeof alpha==='number'?alpha:1;c.translate(x,y);c.rotate(p.rot||0);
 c.shadowColor='rgba(64,35,12,.30)';c.shadowBlur=Math.max(4,s*.11);c.shadowOffsetX=Math.max(1,s*.035);c.shadowOffsetY=Math.max(2,s*.075);
 c.beginPath();for(i=0;i<poly.length;i++){if(i===0)c.moveTo(poly[i][0],poly[i][1]);else c.lineTo(poly[i][0],poly[i][1])}c.closePath();c.fillStyle=fill||'#d9c4a4';c.fill();c.shadowColor='transparent';
 grad=c.createLinearGradient(-s*.55,-s*.58,s*.58,s*.62);grad.addColorStop(0,'rgba(255,255,255,.38)');grad.addColorStop(.32,'rgba(255,255,255,.08)');grad.addColorStop(.72,'rgba(76,43,17,.02)');grad.addColorStop(1,'rgba(76,43,17,.22)');c.fillStyle=grad;c.fill();
 if(outline){c.lineWidth=outline;c.strokeStyle='rgba(78,45,18,.56)';c.stroke();c.lineWidth=Math.max(1,outline*.42);c.strokeStyle='rgba(255,255,255,.34)';c.stroke()}c.restore();
};
drawPanel=function(rect,title,icon){ctx.save();ctx.shadowColor='rgba(73,39,14,.18)';ctx.shadowBlur=15;ctx.shadowOffsetY=6;ctx.fillStyle='rgba(255,248,233,.95)';roundRect(ctx,rect.x,rect.y,rect.w,rect.h,22);ctx.fill();ctx.shadowColor='transparent';ctx.lineWidth=2;ctx.strokeStyle='rgba(122,74,34,.24)';ctx.stroke();ctx.fillStyle='rgba(255,255,255,.42)';roundRect(ctx,rect.x+4,rect.y+4,rect.w-8,Math.max(18,rect.h*.12),18);ctx.fill();ctx.fillStyle='#74471f';ctx.font='bold '+(W>900?18:16)+'px Tahoma';ctx.textAlign='center';ctx.fillText((icon?icon+' ':'')+title,rect.x+rect.w/2,rect.y+26);ctx.restore()};
drawGuidePiece=function(p,alpha){drawPiece(ctx,p,p.tx,p.ty,'#b5a083',Math.min(.30,alpha),2.2)};
draw=function(){
 var i,p,cfg=levelCfg[level],near=null,helper=null;ctx.clearRect(0,0,W,H);drawWood();drawWorkspace();if(drag&&drag.p&&settings.directGuide!==false){near=nearestCompatibleTarget(drag.p);if(near&&near.p)helper=near.p}
 for(i=0;i<pieces.length;i++){p=pieces[i];if(p.state!=='placed')drawGuidePiece(p,hints===2?Math.max(cfg.targetAlpha,.52):cfg.targetAlpha)}
 if(helper){ctx.save();ctx.shadowColor='rgba(0,0,0,.16)';ctx.shadowBlur=6;ctx.fillStyle='rgba(255,255,255,.98)';ctx.strokeStyle='rgba(94,57,20,.42)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(helper.tx,helper.ty,Math.max(7,Math.min(15,helper.size*.15)),0,PI*2);ctx.fill();ctx.stroke();ctx.restore()}
 for(i=0;i<pieces.length;i++){p=pieces[i];if(p.state==='placed')drawPiece(ctx,p,p.x,p.y,p.color,1,2.25)}for(i=0;i<trayStacks.length;i++)drawTrayStack(trayStacks[i]);if(drag&&drag.p){p=drag.p;drawPiece(ctx,p,p.x,p.y,p.color,.99,2.7)}
};
})();
