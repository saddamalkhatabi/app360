'use strict';
(function(){
var oldTargetPieceScale=targetPieceScale;
function trapezoid(s){return [[-s*.48,s*.42],[s*.48,s*.42],[s*.34,-s*.42],[-s*.34,-s*.42]]}
function slope(s){return [[-s*.56,s*.40],[s*.56,s*.40],[s*.24,-s*.40],[-s*.56,-s*.40]]}
function quarter(s){
 var p=[],i,t,cx=-s*.45,cy=-s*.45,r=s*.90;
 p.push([cx,cy]);
 for(i=0;i<=12;i++){t=(Math.PI*.5)*i/12;p.push([cx+Math.cos(t)*r,cy+Math.sin(t)*r])}
 return p;
}
function arc(s){
 var p=[],i,t,cx=-s*.28,cy=-s*.28,ro=s*.78,ri=s*.42;
 for(i=0;i<=14;i++){t=(Math.PI*.5)*i/14;p.push([cx+Math.cos(t)*ro,cy+Math.sin(t)*ro])}
 for(i=14;i>=0;i--){t=(Math.PI*.5)*i/14;p.push([cx+Math.cos(t)*ri,cy+Math.sin(t)*ri])}
 return p;
}
function leaf(s){return [[-s*.56,0],[-s*.28,-s*.28],[s*.08,-s*.38],[s*.56,0],[s*.08,s*.38],[-s*.28,s*.28]]}
function drop(s){return [[0,-s*.58],[s*.28,-s*.14],[s*.34,s*.18],[s*.18,s*.44],[0,s*.53],[-s*.18,s*.44],[-s*.34,s*.18],[-s*.28,-s*.14]]}
function crescent(s){
 var p=[],i,t,ro=s*.54,ri=s*.40,ox=s*.18;
 for(i=0;i<=18;i++){t=-Math.PI*.62+(Math.PI*1.24)*i/18;p.push([Math.cos(t)*ro,Math.sin(t)*ro])}
 for(i=18;i>=0;i--){t=-Math.PI*.50+(Math.PI*1.0)*i/18;p.push([ox+Math.cos(t)*ri,Math.sin(t)*ri])}
 return p;
}
function star(s){
 var p=[],i,t,r;
 for(i=0;i<10;i++){t=-Math.PI/2+i*Math.PI/5;r=i%2===0?s*.54:s*.23;p.push([Math.cos(t)*r,Math.sin(t)*r])}
 return p;
}
function arch(s){
 var p=[],i,t,ro=s*.58,ri=s*.33;
 for(i=0;i<=16;i++){t=Math.PI+Math.PI*i/16;p.push([Math.cos(t)*ro,Math.sin(t)*ro])}
 for(i=16;i>=0;i--){t=Math.PI+Math.PI*i/16;p.push([Math.cos(t)*ri,Math.sin(t)*ri])}
 return p;
}
var oldShape=shape;
shape=function(type,s){
 if(type==='trap')return trapezoid(s);
 if(type==='slope')return slope(s);
 if(type==='quarter')return quarter(s);
 if(type==='arc')return arc(s);
 if(type==='leaf')return leaf(s);
 if(type==='drop')return drop(s);
 if(type==='crescent')return crescent(s);
 if(type==='star')return star(s);
 if(type==='arch')return arch(s);
 return oldShape(type,s);
};
typePalette.trap='#f08f35';
typePalette.slope='#79c94b';
typePalette.quarter='#41a8e5';
typePalette.arc='#8a4fc5';
typePalette.leaf='#79c94b';
typePalette.drop='#ef4b4d';
typePalette.crescent='#f4c845';
typePalette.star='#f4c845';
typePalette.arch='#e967b2';
function compositionRect(){
 var w0=Math.min(zones.targetInner.w*.72,zones.targetInner.h*1.15);
 var h0=Math.min(zones.targetInner.h*.80,zones.targetInner.w*.72);
 return {x:zones.targetInner.x+(zones.targetInner.w-w0)/2,y:zones.targetInner.y+(zones.targetInner.h-h0)/2,w:w0,h:h0};
}
targetPieceScale=function(){
 var cr=compositionRect(),m=Math.min(cr.w,cr.h),base=level===0?.255:(level===1?.215:.185),p=currentPuzzle&&currentPuzzle();
 var k=p&&p.pieceScale?p.pieceScale:1;
 return n(m*base,level===0?44:36,level===0?126:(level===1?104:92))*k;
};
rebuildPieces=function(){
 var raw=currentPuzzle().pieces,old={},i,a,o,s=targetPieceScale(),cr=compositionRect();
 for(i=0;i<pieces.length;i++)old[pieces[i].id]=pieces[i];
 pieces=[];
 for(i=0;i<raw.length;i++){
  a=raw[i];o=old['p'+i];
  pieces.push({id:'p'+i,type:a[0],tx:cr.x+a[1]*cr.w,ty:cr.y+a[2]*cr.h,rot:a[3]||0,size:s,color:typePalette[a[0]]||palette[i%palette.length],placed:o?o.placed:false,state:o?(o.placed?'placed':(o.state==='drag'?'tray':o.state)):'tray',x:o?o.x:0,y:o?o.y:0,magnet:false});
 }
 for(i=0;i<pieces.length;i++)if(pieces[i].placed){pieces[i].state='placed';pieces[i].x=pieces[i].tx;pieces[i].y=pieces[i].ty}else if(pieces[i].state!=='drag'){pieces[i].state='tray'}
 buildTrayStacks();updateStatus();
};
})();
