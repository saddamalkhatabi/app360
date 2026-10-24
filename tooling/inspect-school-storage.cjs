'use strict';
// Operator-only, read-only diagnosis. Never opens SQLite, creates directories, or reads secret values.
require('../services/family-relay/src/load-env').load();
const fs=require('node:fs'),path=require('node:path');
const settings=require('../services/app360-data-core/src/storage').settings();
function inspect(file){
 const result={path:file,exists:false};
 try{const entry=fs.lstatSync(file);result.symbolic_link=entry.isSymbolicLink();const stat=fs.statSync(file);result.exists=true;result.kind=stat.isDirectory()?'directory':stat.isFile()?'file':'other';try{fs.accessSync(file,fs.constants.W_OK);result.writable_by_access_check=true}catch(e){result.writable_by_access_check=false;result.access_error=e.code}}
 catch(e){result.error=e.code;}
 return result;
}
function chain(file){const parts=[];let cursor=file;for(;;){parts.unshift(inspect(cursor));const parent=path.dirname(cursor);if(parent===cursor)break;cursor=parent;}return parts;}
const report={check:'school-storage-read-only',node:process.versions.node,cwd:process.cwd(),database_source:process.env.APP360_DB_FILE?'APP360_DB_FILE':'default',uploads_source:process.env.APP360_UPLOAD_ROOT?'APP360_UPLOAD_ROOT':'default',database:chain(settings.database),uploads:chain(settings.uploads),note:'Run as the same user and environment as npm start. No database or file has been created or modified.'};
if(require.main!==module)console.log(JSON.stringify({check:'school-storage-paths',database_directory:inspect(path.dirname(settings.database)),database_file:inspect(settings.database),uploads:inspect(settings.uploads)}));
console.log(JSON.stringify(report,null,2));
