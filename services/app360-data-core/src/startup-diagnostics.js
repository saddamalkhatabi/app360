'use strict';
// Public diagnostics and server logs use fixed codes only, never exception text, paths or credentials.
function classify(error,stage){
 var e=error||{},reason='INITIALIZATION_FAILED',code='data_core_initialization_failed',message='تعذر بدء خدمة حسابات المدرسة. أبلغ مسؤول الموقع برمز العطل.';
 if(e.code==='APP360_UNSUPPORTED_RUNTIME'){code='data_core_runtime_unsupported';reason='NODE_VERSION';message='إصدار تشغيل خدمة الحسابات غير مدعوم. يلزم تحديث إعدادات الاستضافة.'}
 else if(e.code==='APP360_STORAGE_UNAVAILABLE'||['ENOENT','EACCES','EPERM','EROFS','ENOTDIR','EISDIR','ENOSPC','EDQUOT'].includes(e.code)){
  code='data_core_storage_unavailable';var why=e.storageReason||e.code;reason=['ENOENT','EACCES','EPERM','EROFS','ENOTDIR','EISDIR','ENOSPC','EDQUOT','STORAGE_IO'].includes(why)?why:'STORAGE_IO';message='تعذر الوصول إلى تخزين حسابات المدرسة. يلزم مراجعة إعدادات الاستضافة.';
 }
 else if(e.code==='APP360_NATIVE_UNAVAILABLE'||e.code==='ERR_DLOPEN_FAILED'){code='data_core_native_dependency_unavailable';reason='SQLITE_NATIVE_BINDING';message='مكتبة قاعدة بيانات المدرسة تحتاج إعادة تثبيت على الاستضافة.'}
 else if(e.code==='MODULE_NOT_FOUND'||e.code==='ERR_MODULE_NOT_FOUND'){code='data_core_dependencies_missing';reason='MODULE_NOT_FOUND';message='ملفات خدمة الحسابات أو اعتمادياتها غير مكتملة على الاستضافة.'}
 else if(e.code==='APP360_BRIDGE_CONFIG_INVALID'){code='data_core_configuration_invalid';reason='BRIDGE_ORIGIN';message='إعدادات اتصال المدرسة بخدمة الحسابات تحتاج مراجعة.'}
 else if(stage==='database'){code='data_core_database_unavailable';reason=/^SQLITE_[A-Z_]+$/.test(e.code||'')?e.code:'DATABASE_INITIALIZATION';message='قاعدة حسابات المدرسة غير متاحة حالياً.'}
 var result={error:code,reason:reason,stage:['runtime','dependencies','storage','modules','configuration','database'].includes(stage)?stage:'startup',message:message};
 if(code==='data_core_storage_unavailable'){
  if(['database_directory','database_file','uploads_directory'].includes(e.storageTarget))result.storage_target=e.storageTarget;
  if(['mkdir','stat','write','unlink'].includes(e.storageOperation))result.storage_operation=e.storageOperation;
 }
 return result;
}
function runtime(){if(!/^(20|22)\./.test(process.versions.node))throw Object.assign(Error('Use Node 20 or 22'),{code:'APP360_UNSUPPORTED_RUNTIME'});}
function dependencies(){
 require('knex');var Database=require('./sqlite-driver').driver().Database,db;
 try{db=new Database(':memory:');db.prepare('SELECT 1').get();}
 catch(e){throw Object.assign(Error('SQLite native binding unavailable'),{code:'APP360_NATIVE_UNAVAILABLE'});}
 finally{if(db)db.close();}
}
function log(diagnostic){console.error('[APP360_DATA_CORE] '+JSON.stringify({error:diagnostic.error,reason:diagnostic.reason,stage:diagnostic.stage,storage_target:diagnostic.storage_target,storage_operation:diagnostic.storage_operation,node:process.versions.node,platform:process.platform,arch:process.arch}));}
module.exports={classify:classify,runtime:runtime,dependencies:dependencies,log:log};
