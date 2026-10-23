'use strict';
// Resolve once, without touching disk during module loading. Never silently switch databases.
var fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function settings(env){env=env||process.env;return {database:path.resolve(env.APP360_DB_FILE||path.join(__dirname,'../var/app360.sqlite3')),uploads:path.resolve(env.APP360_UPLOAD_ROOT||path.join(__dirname,'../var/uploads'))};}
function storageError(e,target,operation){var wrapped=Error('School storage is unavailable');wrapped.code='APP360_STORAGE_UNAVAILABLE';wrapped.storageReason=['ENOENT','EACCES','EPERM','EROFS','ENOTDIR','EISDIR','ENOSPC','EDQUOT'].includes(e.code)?e.code:'STORAGE_IO';wrapped.storageTarget=target;wrapped.storageOperation=operation;return wrapped;}
function prepareDirectory(dir,verifyWrite,target){
 var probe,operation='mkdir';
 try{
  fs.mkdirSync(dir,{recursive:true});
  operation='stat';
  if(!fs.statSync(dir).isDirectory())throw Object.assign(Error('Not a directory'),{code:'ENOTDIR'});
  // Test actual write access as the Node service user, not just mode bits.
  if(verifyWrite!==false){probe=path.join(dir,'.app360-write-check-'+crypto.randomBytes(12).toString('hex'));
  operation='write';fs.writeFileSync(probe,'',{flag:'wx',mode:0o600});operation='unlink';fs.unlinkSync(probe);probe=null;}
 }catch(e){throw storageError(e,target,operation);}
 finally{if(probe)try{fs.unlinkSync(probe)}catch(_){}}
}
function prepare(env){
 var s=settings(env);prepareDirectory(path.dirname(s.database),true,'database_directory');
 try{
  var stat;
  try{stat=fs.statSync(s.database)}catch(e){
   if(e.code!=='ENOENT')throw e;
   // A missing file is valid on first install; never replace a dangling database link.
   var entry;try{entry=fs.lstatSync(s.database)}catch(missing){if(missing.code!=='ENOENT')throw missing;}
   if(entry)throw e;
  }
  if(stat&&!stat.isFile())throw Object.assign(Error('Database path is not a file'),{code:'EISDIR'});
 }catch(e){throw storageError(e,'database_file','stat');}
 prepareDirectory(s.uploads,true,'uploads_directory');return s;
}
module.exports={settings:settings,prepare:prepare,prepareDirectory:prepareDirectory};
