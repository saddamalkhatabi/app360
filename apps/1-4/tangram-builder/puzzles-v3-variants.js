'use strict';
(function(){
function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
var rotPattern=[.08,-.06,.05,-.04,.07,-.05,.03];
var lv,i,j,p,amt,stage;
for(lv=0;lv<puzzles.length;lv++){
 for(i=1;i<puzzles[lv].length;i+=2){
  stage=puzzles[lv][i];amt=lv===0?.020:(lv===1?.026:.032);
  for(j=0;j<stage.pieces.length;j++){
   p=stage.pieces[j];
   p[1]=clamp(p[1]+(((j%3)-1)*amt),.10,.90);
   p[2]=clamp(p[2]+((j%2?1:-1)*amt*.65),.07,.72);
   if(p[0]==='tri'||p[0]==='rect'||p[0]==='para'||p[0]==='semi')p[3]=(p[3]||0)+rotPattern[j%rotPattern.length]*(lv===0?.55:(lv===1?.8:1));
  }
 }
}
})();
