'use strict';
async function run(action){let db;try{
 require('../../family-relay/src/load-env').load();
 const settings=require('./database-config');
 if(action==='reset'&&settings.engine()==='postgresql'&&process.env.APP360_ALLOW_DATABASE_RESET!=='1')throw Object.assign(Error('Reset requires explicit opt in'),{code:'APP360_DATABASE_CONFIG_INVALID'});
 db=await require('./db').createDb();
 if(action==='migrate')await db.migrate.latest();
 else if(action==='seed')await db.seed.run();
 else if(action==='rollback')await db.migrate.rollback();
 else if(action==='reset'){await db.migrate.rollback({},true);await db.migrate.latest();await db.seed.run();}
 else throw Error('Unknown database command');
 console.log(JSON.stringify({ok:true,action,database_engine:settings.engine()}));
 }catch(e){const diagnostics=require('./startup-diagnostics');diagnostics.log(diagnostics.classify(e,'database'));process.exitCode=1;}finally{if(db)await db.destroy();}}
module.exports={run};
