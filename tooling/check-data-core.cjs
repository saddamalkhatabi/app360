'use strict';
// Run in the same hosting application/environment as the School. Does not migrate, seed or contact Reels.
require('../services/family-relay/src/load-env').load();
let diagnostics,stage='modules';
(async()=>{
 diagnostics=require('../services/app360-data-core/src/startup-diagnostics');
 stage='runtime';diagnostics.runtime();
 stage='dependencies';diagnostics.dependencies();
 stage='storage';require('../services/app360-data-core/src/storage').prepare();
 stage='modules';require('../services/app360-data-core/src/http-server');
 stage='configuration';try{require('../services/app360-data-core/src/reels-bridge').configured()}catch(_){throw Object.assign(Error('Invalid bridge configuration'),{code:'APP360_BRIDGE_CONFIG_INVALID'});}
 stage='database';const db=await require('../services/app360-data-core/src/db').createDb();try{await db.raw('SELECT 1')}finally{await db.destroy()}
 console.log(JSON.stringify({ok:true,check:'data-core-startup',node:process.versions.node,migrations_run:false,seeds_run:false,bridge_request_sent:false}));
})().catch(e=>{const d=diagnostics?diagnostics.classify(e,stage):{error:'data_core_files_missing',reason:'SERVICE_FILES_INCOMPLETE',stage:'modules'};if(diagnostics)diagnostics.log(d);else console.error('[APP360_DATA_CORE] SERVICE_FILES_INCOMPLETE');process.exitCode=1;});
