(function(w){
'use strict';
/* Deliberately semantic assignments: no photo stands for a different action. */
var C=w.APP360_CALM_CONTENT;if(!C)return;
var map={
 signals:{'stay-close':'gentle_closeness_mom_daughter','pick-me-up':'happy_hug_mom_daughter','what-next':'sequence_learning_with_mom'},
 helps:{'close':'gentle_closeness_mom_daughter','hold-if-wanted':'happy_hug_mom_daughter',
 'comfort-touch':'warm_hug_mom_daughter','quiet-place':'reading_corner_child',
 'familiar-object':'teddy_comfort_child','quiet-book':'read_story_with_mom',
 'water':'drink_water_child','show-next':'sequence_learning_with_mom',
 'move-together':'walk_with_mom'},
 transitions:{'book':'read_story_with_mom','water':'drink_water_child'}
};
var path='assets/images/what-to-try/',count=0,assigned=[];
for(var kind in map)if(map.hasOwnProperty(kind)){
 var list=C[kind]||[],ids=map[kind];
 for(var i=0;i<list.length;i++){
  var it=list[i],stem=ids[it.id];
  if(!stem)continue;
  it.photoFallback=it.image||'';
  it.image=path+stem+'-512.webp';
  it.imageSrcSet=path+stem+'-320.webp 320w, '+path+stem+'-512.webp 512w';
  it.imageSizes='(max-width: 470px) 44vw, 205px';
  assigned.push(kind+':'+it.id);
  count++;
 }
}
w.APP360_CALM_TRY_PHOTOS={version:1,assigned:assigned,count:count};
})(window);
