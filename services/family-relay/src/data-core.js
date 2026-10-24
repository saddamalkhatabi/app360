'use strict';
// Optional same-process private API. No second public port or permissive CORS is needed.
function createDataCore(){
 if(String(process.env.APP360_DATA_CORE_ENABLED||'')!=='1')return null;
 var core,api,bridge,diagnostics,stage='modules',failure;
 function record(e){failure=diagnostics?diagnostics.classify(e,stage):{error:'data_core_files_missing',reason:'SERVICE_FILES_INCOMPLETE',stage:'modules',message:'ملفات خدمة حسابات المدرسة غير مكتملة. حدّث نسخة المدرسة كاملة.'};if(diagnostics)diagnostics.log(failure);else console.error('[APP360_DATA_CORE] SERVICE_FILES_INCOMPLETE');}
 function unavailable(res){if(!res.headersSent){res.writeHead(503,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(failure));}}
 try{
  diagnostics=require('../../app360-data-core/src/startup-diagnostics');
  stage='runtime';diagnostics.runtime();
  stage='dependencies';diagnostics.dependencies();
  stage='storage';require('../../app360-data-core/src/storage').prepare();
  stage='modules';core=require('../../app360-data-core/src/index');api=require('../../app360-data-core/src/http-server');bridge=require('../../app360-data-core/src/reels-bridge');
  stage='configuration';try{bridge.configured()}catch(_){throw Object.assign(Error('Invalid bridge configuration'),{code:'APP360_BRIDGE_CONFIG_INVALID'});}
 }catch(e){record(e);return{ready:Promise.resolve(false),handle(req,res){unavailable(res)},close(){}}}
 stage='database';
 const ready=(async()=>{const db=await core.db.createDb();try{await require('../../app360-data-core/src/bootstrap').initialize(db);}finally{await db.destroy();}})();
 ready.catch(record);
 const timer=setInterval(async()=>{let db;try{await ready;if(!bridge.configured())return;db=await core.db.createDb();await bridge.drain(db);}catch(_){}finally{if(db)await db.destroy();}},30000);timer.unref();
 return {ready,handle(req,res){ready.then(()=>api.handler(req,res)).catch(()=>{unavailable(res)});},close(){clearInterval(timer);return core.db.closeRequestDb();}};
}
module.exports={createDataCore};
