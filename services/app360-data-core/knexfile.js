'use strict';
var path=require('path');
var file=process.env.APP360_DB_FILE||path.join(__dirname,'var','app360.sqlite3');
module.exports={
  development:{
    client:'better-sqlite3',
    connection:{filename:file},
    useNullAsDefault:true,
    migrations:{directory:path.join(__dirname,'migrations'),tableName:'knex_migrations'},
    seeds:{directory:path.join(__dirname,'seeds')},
    pool:{afterCreate:function(conn,done){try{conn.pragma('journal_mode = WAL');conn.pragma('foreign_keys = ON');conn.pragma('busy_timeout = 5000');done(null,conn)}catch(e){done(e,conn)}}}
  }
};
