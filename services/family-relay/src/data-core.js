'use strict';
// Optional same-process private API. No second public port or permissive CORS is needed.
function createDataCore(){
 if(String(process.env.APP360_DATA_CORE_ENABLED||'')!=='1')return null;
 const core=require('../../app360-data-core/src/index'),api=require('../../app360-data-core/src/http-server'),bridge=require('../../app360-data-core/src/reels-bridge');
 const ready=(async()=>{const db=await core.db.createDb();try{await db.migrate.latest();await db.seed.run();}finally{await db.destroy();}})();
 ready.catch(()=>{});
 const timer=setInterval(async()=>{if(!bridge.configured())return;let db;try{await ready;db=await core.db.createDb();await bridge.drain(db);}catch(_){}finally{if(db)await db.destroy();}},30000);timer.unref();
 return {ready,handle(req,res){ready.then(()=>api.handler(req,res)).catch(()=>{if(!res.headersSent){res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify({error:'data_core_unavailable',message:'خدمة الحسابات غير متاحة حالياً'}));}});},close(){clearInterval(timer);}};
}
module.exports={createDataCore};
