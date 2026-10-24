'use strict';
async function initialize(db){
 if(require('./database-config').engine()==='postgresql')return db.transaction(async trx=>{
  // Transaction-scoped only: compatible with PgBouncer transaction pooling.
  await trx.raw('SELECT pg_advisory_xact_lock(360,2501)');
  await trx.migrate.latest();await trx.seed.run();
 });
 await db.migrate.latest();await db.seed.run();
}
module.exports={initialize};
