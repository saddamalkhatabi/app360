/* Geometry contract extracted from a1-tangram. ES5; no DOM or app imports. */
(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.APP360_PIECES=api})(this,function(){'use strict';
function pointInPoly(pt,poly){var inside=false,i,j,xi,yi,xj,yj,hit;for(i=0,j=poly.length-1;i<poly.length;j=i++){xi=poly[i][0];yi=poly[i][1];xj=poly[j][0];yj=poly[j][1];hit=((yi>pt.y)!==(yj>pt.y))&&(pt.x<(xj-xi)*(pt.y-yi)/(yj-yi||.0001)+xi);if(hit)inside=!inside}return inside}
function localPoint(pt,p){var dx=pt.x-p.x,dy=pt.y-p.y,c=Math.cos(-(p.rot||0)),s=Math.sin(-(p.rot||0));return{x:dx*c-dy*s,y:dx*s+dy*c}}
function nearest(p,list,classifier){var key=classifier?classifier(p):p.type;var i,q,best=null,bestD=1e9,dd,dx,dy;for(i=0;i<list.length;i++){q=list[i];if((classifier?classifier(q):q.type)!==key||q.placed)continue;dx=p.x-q.tx;dy=p.y-q.ty;dd=Math.sqrt(dx*dx+dy*dy);if(dd<bestD){bestD=dd;best=q}}return best?{p:best,d:bestD}:null}
/* Quarter turns and reflection, normalized to a top-left integer lattice anchor. */
function transform(poly,rot,flip){var out=[],minX=1e9,minY=1e9,i,j,x,y,z;rot=((rot||0)%4+4)%4;for(i=0;i<poly.length;i++){x=poly[i][0]*(flip?-1:1);y=poly[i][1];for(j=0;j<rot;j++){z=x;x=-y;y=z}out.push([x,y]);minX=Math.min(minX,x);minY=Math.min(minY,y)}for(i=0;i<out.length;i++){out[i][0]-=minX;out[i][1]-=minY}return out}
function bounds(poly){var x=0,y=0;for(var i=0;i<poly.length;i++){x=Math.max(x,poly[i][0]);y=Math.max(y,poly[i][1])}return{w:x,h:y}}
function snap(x,y,unit){return{x:Math.round(x/unit),y:Math.round(y/unit)}}
return{version:1,pointInPoly:pointInPoly,localPoint:localPoint,nearestCompatible:nearest,transform:transform,bounds:bounds,snap:snap};
});
