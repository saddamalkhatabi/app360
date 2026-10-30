/* Bounded, incremental planning and honest local activity measures. ES5. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));else root.MiniGolfCoachCore=factory(root.MiniGolfCore);})(this,function(C){'use strict';
function distance(a,b){return Math.sqrt(Math.pow(a.x-b.x,2)+Math.pow(a.y-b.y,2));}
function planner(course,position,assisted){var beam=[{p:C.clone(position),steps:[]}],next=[],seen={},node=0,angle=-180,power=1,depth=0,count=0,result=null,best=null,done=false;
 function step(budget){budget=Math.max(1,Math.min(120,budget||40));while(budget--&&!done){if(count>=26000){done=true;break;}if(node>=beam.length){depth++;if(depth>=3||!next.length||count>=26000){done=true;break;}next.sort(function(a,b){return a.score-b.score;});beam=next.slice(0,42);next=[];node=0;angle=-180;power=1;}
 var base=beam[node],out=C.simulate(course,base.p,angle,power,assisted),steps=base.steps.concat([{aim:angle,power:power}]),score=distance(out.position,course.cup);count++;if(!best||score<best.score)best={steps:steps,score:score};if(out.captured){result={steps:steps,captured:true};done=true;break;}var key=Math.round(out.position.x/3)+':'+Math.round(out.position.y/3);if(!seen[key]){seen[key]=true;next.push({p:out.position,steps:steps,score:score});}power++;if(power>5){power=1;angle+=5;}if(angle>180){node++;angle=-180;}}
 return{done:done,result:result||(done&&best?{steps:best.steps,captured:false}:null),simulations:count};}
 return{step:step};}
function number(n){return typeof n==='number'&&isFinite(n)&&n>=0?Math.min(100000,Math.floor(n)):0;}
function record(raw){raw=raw||{};return{shots:number(raw.shots),captures:number(raw.captures),approaches:number(raw.approaches),practiceShots:number(raw.practiceShots),practiceCaptures:number(raw.practiceCaptures),independentPractice:number(raw.independentPractice),recent:Array.isArray(raw.recent)?raw.recent.filter(function(n){return n===0||n===1;}).slice(-10):[]};}
function measure(stats,event,independent){if(event.source!=='child')return false;if(event.training){stats.practiceShots++;if(event.captured){stats.practiceCaptures++;if(independent)stats.independentPractice++;}return false;}
 var closer=event.captured||distance(event.position,event.cup)<distance(event.start,event.cup)-2;stats.shots++;if(event.captured)stats.captures++;if(closer)stats.approaches++;stats.recent.push(closer?1:0);stats.recent=stats.recent.slice(-10);return closer;}
function comparison(stats){if(stats.recent.length<10)return null;var first=0,last=0;for(var i=0;i<10;i++)if(i<5)first+=stats.recent[i];else last+=stats.recent[i];return{first:first,last:last,change:last-first};}
return{planner:planner,record:record,measure:measure,comparison:comparison,distance:distance};
});
