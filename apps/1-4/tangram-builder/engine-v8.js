'use strict';
(function(){
/* v8: cleaner level-1 spacing plus optional direct white-circle helper. */
settings.directGuide=G('app360:a1-tangram:directGuide','1')!=='0';
var oldTargetPieceScale=targetPieceScale;
targetPieceScale=function(){
 var inner=zones&&zones.targetInner?zones.targetInner:{w:W,h:H},p=currentPuzzle&&currentPuzzle();
 if(level===0){
  var m=Math.min(inner.w*.72,inner.h*.80);
  return n(m*.175,34,80)*(p&&p.pieceScale?p.pieceScale:1);
 }
 return oldTargetPieceScale();
};

draw=function(){
 var i,p,cfg=levelCfg[level],near=null,helper=null;
 ctx.clearRect(0,0,W,H);drawWood();drawWorkspace();
 if(drag&&drag.p&&settings.directGuide!==false){
  near=nearestCompatibleTarget(drag.p);if(near&&near.p)helper=near.p;
 }
 for(i=0;i<pieces.length;i++){
  p=pieces[i];
  if(p.state!=='placed')drawGuidePiece(p,hints===2?Math.max(cfg.targetAlpha,.50):cfg.targetAlpha);
 }
 if(helper){
  ctx.save();
  ctx.fillStyle='rgba(255,255,255,.92)';ctx.strokeStyle='rgba(108,70,31,.48)';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(helper.tx,helper.ty,Math.max(11,Math.min(19,helper.size*.20)),0,Math.PI*2);ctx.fill();ctx.stroke();
  ctx.restore();
 }
 for(i=0;i<pieces.length;i++){
  p=pieces[i];if(p.state==='placed')drawPiece(ctx,p,p.x,p.y,p.color,1,2.2);
 }
 for(i=0;i<trayStacks.length;i++)drawTrayStack(trayStacks[i]);
 if(drag&&drag.p){
  p=drag.p;ctx.save();ctx.shadowColor='rgba(0,0,0,.28)';ctx.shadowBlur=12;ctx.shadowOffsetY=5;drawPiece(ctx,p,p.x,p.y,p.color,.98,2.5);ctx.restore();
 }
};
})();
