'use strict';
// Public titles only. No account credentials or caller-selected upstream URL.
const cache=new Map();
module.exports=async function(req,res){
 const json=(status,data)=>{res.writeHead(status,{'content-type':'application/json; charset=utf-8','cache-control':'no-store'});res.end(JSON.stringify(data));};
 if(req.method!=='GET')return json(405,{error:'method_not_allowed'});
 const q=new URL(req.url,'http://school.local').searchParams,age=q.get('age'),role=q.get('role'),lang=q.get('lang');
 if(!['1-4','4-8','8-12','12-16','16-24','24-45','45-60','60-80'].includes(age)||!['learner','coach'].includes(role)||!['ar','en'].includes(lang))return json(400,{error:'invalid_filters'});
 let base;try{base=new URL(process.env.APP360_REELS_BASE_URL||'https://yem1.com');}catch(_){return json(503,{error:'invalid_reels_origin'});}
 if(base.username||base.password||base.pathname!=='/'||base.search||base.hash)return json(503,{error:'invalid_reels_origin'});
 if(base.protocol!=='https:'&&!(process.env.NODE_ENV==='test'&&['localhost','127.0.0.1'].includes(base.hostname)))return json(503,{error:'invalid_reels_origin'});
 const key=[base.origin,age,role,lang].join('|'),previous=cache.get(key);if(previous&&previous.until>Date.now())return json(200,await previous.result);
 const result=(async()=>{const url=new URL('/api/goals',base);url.search=new URLSearchParams({age_group:age,audience_role:role,ui_language:lang,content_language:lang}).toString();const response=await fetch(url,{signal:AbortSignal.timeout(8000),redirect:'error',headers:{Accept:'application/json'}});if(!response.ok)throw Error('upstream_unavailable');const text=await response.text();if(text.length>2000000)throw Error('catalog_too_large');const body=JSON.parse(text);return {goals:(body.goals||[]).slice(0,1000).map(g=>({id:String(g.id),title:String(g.title||g.title_ar||g.title_en||'').slice(0,300)}))};})();
 cache.set(key,{until:Date.now()+300000,result});try{return json(200,await result);}catch(_){cache.delete(key);return json(502,{error:'reels_catalog_unavailable',goals:[]});}
};
