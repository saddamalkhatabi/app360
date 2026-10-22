/* Deterministic local selection, shared by the player and route validation. ES5. */
(function(w){'use strict';
function pool(games,route){return games.filter(function(g){return !g.custom&&route.levels.indexOf(g.level)>=0&&(!route.types.length||route.types.indexOf(g.type)>=0)})}
function choose(games,route,history,visited,previous,support,targetLevel){var list=pool(games,route),fresh=list.filter(function(g){return visited.indexOf(g.id)<0}),level=typeof targetLevel==='number'?targetLevel:previous&&previous.level,type=previous&&previous.type;if(fresh.length)list=fresh;else list=list.filter(function(g){return !previous||g.id!==previous.id});if(!list.length)return null;list.sort(function(a,b){var ah=history[a.id]||{},bh=history[b.id]||{},ac=ah.completed||0,bc=bh.completed||0;if(support&&level){var ad=Math.abs(a.level-Math.max(route.levels[0],level-1)),bd=Math.abs(b.level-Math.max(route.levels[0],level-1));if(ad!==bd)return ad-bd}if(ac!==bc)return ac-bc;if(level&&!support){var ap=Math.abs(a.level-level),bp=Math.abs(b.level-level);if(ap!==bp)return ap-bp}if(type&&(a.type===type)!==(b.type===type))return a.type===type?1:-1;return a.level-b.level||String(a.id).localeCompare(String(b.id))});return list[0]}
function duration(value){var n=Number(value);return isFinite(n)&&n>0?Math.max(60,Math.min(1800,Math.round(n))):300}
function assistance(errors,idle,shown){return errors>=2||idle>=25000&&(shown||0)<2}
var api={pool:pool,choose:choose,duration:duration,needsHelp:assistance};if(typeof module==='object'&&module.exports)module.exports=api;else w.CreativeCoachCore=api;
})(this);
