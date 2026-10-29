/* Pure, bounded, age-scoped teaching contract. No storage or media. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory(require('./core.js'));else root.LinesCoachSession=factory(root.LinesHousesCore);})(this,function(C){
'use strict';
var units={
 line:{id:'line',cue:'line',label_ar:'نصل نقطتين',label_en:'Connect two dots',mode:'local',moves:[],target:0,goal:'line'},
 capture:{id:'capture',cue:'capture',label_ar:'أكمل البيت',label_en:'Complete a house',mode:'local',moves:[0,2,6],target:7,goal:'capture'},
 double:{id:'double',cue:'double',label_ar:'خط يبني بيتين',label_en:'Two houses, one line',mode:'local',moves:[0,1,2,3,6,8],target:7,goal:'double'},
 together:{id:'together',cue:'together',label_ar:'دوري ودورك',label_en:'Take turns together',mode:'coop',moves:[],target:7,goal:'line'},
 safe:{id:'safe',cue:'safe',label_ar:'أفكر قبل الخط',label_en:'Think before drawing',mode:'local',moves:[0,6],target:1,goal:'safe'},
 chain:{id:'chain',cue:'chain',label_ar:'بيت ثم جاره',label_en:'A house and its neighbor',mode:'local',moves:[0,1,2,3,6],target:7,goal:'chain'},
 independent:{id:'independent',cue:'independent',label_ar:'أختار بنفسي',label_en:'Choose for myself',mode:'local',moves:[0,1,2,3,6],target:7,goal:'capture',independent:true}
};
function routes(age){age=age==='4-8'?'4-8':'1-4';var small=age==='1-4',rows=small?[
 ['all','رحلة البناء كاملة','Whole building journey',['line','capture','double','together','independent']],
 ['build','أول بيت لي','My first house',['line','capture']],['shared','الخط المشترك','The shared line',['capture','double']],['together','نبني معًا','Build together',['line','together']],['independent','أجرب بنفسي','Try for myself',['independent']]
 ]:[['all','رحلة التخطيط كاملة','Whole planning journey',['capture','safe','double','chain','independent']],['build','إكمال البيوت','Complete houses',['capture','double']],['safe','الخط الآمن','A safer line',['safe']],['chains','البيوت المتتابعة','House chains',['double','chain']],['independent','أخطط بنفسي','Plan for myself',['independent']]],out=[];
 for(var i=0;i<rows.length;i++)out.push({id:'lines-'+age+'-'+rows[i][0],age_group:age,label_ar:rows[i][1],label_en:rows[i][2],unit_ids:rows[i][3]});return out;
}
function unit(id){return units[id]?JSON.parse(JSON.stringify(units[id])):null;}
function position(id){var u=unit(id);if(!u)return null;var s=C.settings({size:2,mode:u.mode}),r=C.create(s);for(var i=0;i<u.moves.length;i++)C.play(r,u.moves[i]);return r;}
function risk(r,edge){var t=C.topology(r.size).edges[edge];if(!t||r.edges[edge])return true;for(var i=0;i<t.boxes.length;i++)if(C.sides(r,t.boxes[i])===2)return true;return false;}
function advice(r){var a=C.available(r),best=-1,gain=0,i;for(i=0;i<a.length;i++){var g=C.gain(r,a[i]);if(g>gain){gain=g;best=a[i];}}if(best>=0)return{edge:best,cue:gain>1?'double':'capture'};for(i=0;i<a.length;i++)if(!risk(r,a[i]))return{edge:a[i],cue:'safe'};return{edge:C.hint(r),cue:'chain'};}
function accepts(id,before,edge){var u=unit(id);if(!u||before.edges[edge]||C.ended(before))return false;if(u.goal==='line')return true;if(u.goal==='safe')return !risk(before,edge);if(u.goal==='double')return C.gain(before,edge)>1;return C.gain(before,edge)>0;}
function integer(v,min,max,fallback){var n=Number(v);return isFinite(n)&&n===Math.floor(n)&&n>=min&&n<=max?n:fallback;}
function query(text){var out={},parts=String(text||'').replace(/^\?/,'').split('&');for(var i=0;i<parts.length;i++){var p=parts[i].split('=');try{out[decodeURIComponent(p[0])]=decodeURIComponent(p.slice(1).join('=').replace(/\+/g,' '));}catch(e){}}return out;}
function normalize(input,age){input=typeof input==='string'?query(input):input||{};age=age==='4-8'?'4-8':'1-4';if((input.ageGroup||input.launch_age||input.age)&&String(input.ageGroup||input.launch_age||input.age)!==age)return{ok:false,error:'age'};
 var ids=input.routeIds||input.route_ids||input.routes||input.route_id||input.coach_route,catalog=routes(age),chosen=[],unitIds=[],i,j,row;if(ids===undefined)ids=[catalog[0].id];if(typeof ids==='string')ids=ids.split(',');if(!Array.isArray(ids)||!ids.length||ids.length>5)return{ok:false,error:'route'};
 for(i=0;i<ids.length;i++){row=null;for(j=0;j<catalog.length;j++)if(catalog[j].id===ids[i])row=catalog[j];if(!row)return{ok:false,error:'route'};if(chosen.indexOf(row.id)<0)chosen.push(row.id);for(j=0;j<row.unit_ids.length;j++)if(unitIds.indexOf(row.unit_ids[j])<0)unitIds.push(row.unit_ids[j]);}
 return{ok:true,schema_version:1,ageGroup:age,routeIds:chosen,unitIds:unitIds,mode:input.mode==='demo'?'demo':'guided',autoplay:input.autoplay!==false&&input.autoplay!==0&&input.autoplay!=='0',duration_seconds:integer(input.duration_seconds,0,1800,0),response_seconds:integer(input.response_seconds,0,15,2),caller:String(input.caller||'').slice(0,80),launch_id:String(input.launch_id||'').slice(0,100)};
}
function catalog(){return{schema_version:1,app_id:'fun-lines-and-houses',age_groups:['1-4','4-8'],routes:routes('1-4').concat(routes('4-8')),units:units,launch:{path:'launch.html',params:['launch_age','route_ids','mode','autoplay','duration_seconds','response_seconds','caller','launch_id']},events:{viewed:'app360:lines-trainer:experienceviewed',practiced:'app360:lines-trainer:practice',complete:'app360:lines-trainer:sessioncomplete'},completion:{demonstrations_are_practice:false,automatic_mastery:false}};}
return{routes:routes,unit:unit,position:position,risk:risk,advice:advice,accepts:accepts,query:query,normalize:normalize,catalog:catalog};
});
