'use strict';
function configuration(env){const filename=require('../storage').settings(env).database;return {client:require('../sqlite-client'),connection:{filename},useNullAsDefault:true,pool:{min:1,max:1,afterCreate(conn,done){try{conn.pragma('journal_mode = WAL');conn.pragma('foreign_keys = ON');conn.pragma('busy_timeout = 5000');done(null,conn)}catch(e){done(e,conn)}}}};}
async function initialize(db){await db.raw('PRAGMA foreign_keys = ON');await db.raw('PRAGMA journal_mode = WAL');await db.raw('PRAGMA busy_timeout = 5000');}
module.exports={configuration,initialize};
