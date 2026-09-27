'use strict';
(function(){
var baseSnap=snapRadius;
snapRadius=function(){var r=baseSnap(),total=puzzles[level]&&puzzles[level].length||1,t=total>1?puzzleIndex/(total-1):0;return r*(1.08-(t*.16))};
})();
