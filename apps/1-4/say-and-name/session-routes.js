/* Relative, validated launch routes shared by the coach and future planners. ES5. */
(function(w){'use strict';
var routes=[
{id:'names-category',age:'1-4',track:'names',review:false,label_ar:'مدربة الروضة · أسماء مجموعة',label_en:'Kindergarten coach · One word group'},
{id:'names-review',age:'1-4',track:'names',review:true,label_ar:'مدربة الروضة · مراجعة كلمات متنوعة',label_en:'Kindergarten coach · Mixed words'},
{id:'sentences-category',age:'4-8',track:'sentences',review:false,label_ar:'مدربة المدرسة · جمل مجموعة',label_en:'School coach · One sentence group'},
{id:'sentences-review',age:'4-8',track:'sentences',review:true,label_ar:'مدربة المدرسة · مراجعة جمل متنوعة',label_en:'School coach · Mixed sentences'}];
function route(id){for(var i=0;i<routes.length;i++)if(routes[i].id===id)return routes[i];return null}
function bound(value,min,max,fallback){var n=Number(value);return isFinite(n)&&n>0?Math.max(min,Math.min(max,Math.round(n))):fallback}
function parse(input){var q=input||{},a,i,p;if(typeof input==='string'){q={};a=input.replace(/^\?/,'').split('&');for(i=0;i<a.length;i++){p=a[i].split('=');try{q[decodeURIComponent(p[0])]=decodeURIComponent(p.slice(1).join('=').replace(/\+/g,' '))}catch(e){}}}
var r=route(q.route)||route(q.learn==='sentences'||q.launch_age==='4-8'||q.age==='4-8'?'sentences-category':'names-category');
return {route:r.id,level:bound(q.level,1,4,1),category:String(q.category||'').slice(0,100),duration_seconds:bound(q.duration_seconds,30,1800,300),response_seconds:bound(q.response_seconds,3,30,6),autoplay:q.autoplay!==false&&q.autoplay!=='0',caller:String(q.caller||'').slice(0,80),launch_id:String(q.launch_id||'').slice(0,120)};}
var api={routes:routes,route:route,parse:parse};w.App360WordCoachRoutes=api;if(typeof module==='object'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
