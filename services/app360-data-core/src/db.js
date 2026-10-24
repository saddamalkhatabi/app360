'use strict';
const path=require('node:path'),knexFactory=require('knex'),settings=require('./database-config'),config=require('../knexfile').development,adapter=require('./databases/'+settings.engine());
async function createDb(){if(settings.engine()==='sqlite')require('./storage').prepareDirectory(path.dirname(config.connection.filename),false);const db=knexFactory(config);try{await adapter.initialize(db);return db}catch(e){await db.destroy();throw e}}
let shared;
function requestDb(){if(settings.engine()==='sqlite')return createDb();if(!shared)shared=createDb().catch(e=>{shared=null;throw e});return shared;}
async function releaseRequestDb(db){if(settings.engine()==='sqlite'&&db)await db.destroy();}
async function closeRequestDb(){const pending=shared;shared=null;if(pending)try{await(await pending).destroy()}catch(_){}}
module.exports={createDb,requestDb,releaseRequestDb,closeRequestDb,config};
