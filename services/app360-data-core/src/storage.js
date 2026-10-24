'use strict';
// Resolve once, without touching disk during module loading. Never silently switch databases.
var fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function legacyHasData(dir){
 // Do not mistake an inaccessible directory or a broken mount for an empty install.
 try{
  var entry;try{entry=fs.lstatSync(dir)}catch(e){if(e.code==='ENOENT')return false;throw e;}
  if(entry.isSymbolicLink())fs.realpathSync(dir);
  try{fs.lstatSync(path.join(dir,'app360.sqlite3'));return true}catch(e){if(e.code!=='ENOENT')throw e;}
  if(fs.readdirSync(dir).some(name=>/^app360\.sqlite3-/.test(name)))return true;
  var uploads=path.join(dir,'uploads');
  try{var uploadEntry=fs.lstatSync(uploads)}catch(e){if(e.code==='ENOENT')return false;throw e;}
  if(uploadEntry.isSymbolicLink())fs.realpathSync(uploads);
  return fs.readdirSync(uploads).some(name=>name!=='.gitkeep');
 }catch(e){throw storageError(e,'database_directory','stat');}
}
function settings(env){
 env=env||process.env;
 var legacy=path.join(__dirname,'../var'),base=path.join(__dirname,'../school-data');
 if((!env.APP360_DB_FILE||!env.APP360_UPLOAD_ROOT)&&legacyHasData(legacy))base=legacy;
 return {database:path.resolve(env.APP360_DB_FILE||path.join(base,'app360.sqlite3')),uploads:path.resolve(env.APP360_UPLOAD_ROOT||path.join(base,'uploads'))};
}
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
