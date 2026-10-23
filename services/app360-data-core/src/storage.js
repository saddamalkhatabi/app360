'use strict';
// Resolve once, without touching disk during module loading. Never silently switch databases.
var fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function settings(env){env=env||process.env;return {database:path.resolve(env.APP360_DB_FILE||path.join(__dirname,'../var/app360.sqlite3')),uploads:path.resolve(env.APP360_UPLOAD_ROOT||path.join(__dirname,'../var/uploads'))};}
function prepareDirectory(dir,verifyWrite){
 var probe;
 try{
  fs.mkdirSync(dir,{recursive:true});
  if(!fs.statSync(dir).isDirectory())throw Object.assign(Error('Not a directory'),{code:'ENOTDIR'});
  // Test actual write access as the Node service user, not just mode bits.
  if(verifyWrite!==false){probe=path.join(dir,'.app360-write-check-'+crypto.randomBytes(12).toString('hex'));
  fs.writeFileSync(probe,'',{flag:'wx',mode:0o600});fs.unlinkSync(probe);probe=null;}
 }catch(e){var wrapped=Error('School storage is unavailable');wrapped.code='APP360_STORAGE_UNAVAILABLE';wrapped.storageReason=['ENOENT','EACCES','EPERM','EROFS','ENOTDIR','EISDIR','ENOSPC','EDQUOT'].includes(e.code)?e.code:'STORAGE_IO';throw wrapped;}
 finally{if(probe)try{fs.unlinkSync(probe)}catch(_){}}
}
function prepare(env){var s=settings(env);prepareDirectory(path.dirname(s.database));if(fs.existsSync(s.database)&&!fs.statSync(s.database).isFile())throw Object.assign(Error('Database path is not a file'),{code:'APP360_STORAGE_UNAVAILABLE',storageReason:'EISDIR'});prepareDirectory(s.uploads);return s;}
module.exports={settings:settings,prepare:prepare,prepareDirectory:prepareDirectory};
