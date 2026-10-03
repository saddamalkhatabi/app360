/* Frozen original geometry for regression parity, prior to extraction. */
function localPoint(pt,p){var dx=pt.x-p.x,dy=pt.y-p.y,c=Math.cos(-(p.rot||0)),s=Math.sin(-(p.rot||0));return{x:dx*c-dy*s,y:dx*s+dy*c}}
function pointInPoly(pt,poly){var inside=false,i,j,xi,yi,xj,yj,hit;for(i=0,j=poly.length-1;i<poly.length;j=i++){xi=poly[i][0];yi=poly[i][1];xj=poly[j][0];yj=poly[j][1];hit=((yi>pt.y)!==(yj>pt.y))&&(pt.x<(xj-xi)*(pt.y-yi)/(yj-yi||.0001)+xi);if(hit)inside=!inside}return inside}
function nearestCompatibleTarget(p){var i,q,best=null,bestD=1e9,dd;for(i=0;i<pieces.length;i++){q=pieces[i];if(q.type!==p.type||q.placed)continue;dd=dist({x:p.x,y:p.y},{x:q.tx,y:q.ty});if(dd<bestD){bestD=dd;best=q}}return best?{p:best,d:bestD}:null}
function dist(a,b){var x=a.x-b.x,y=a.y-b.y;return Math.sqrt(x*x+y*y)}
module.exports={localPoint,pointInPoly,nearest:function(p,list){pieces=list;return nearestCompatibleTarget(p)}};var pieces=[];
