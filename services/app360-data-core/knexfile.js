'use strict';
var path=require('path');
var file=require('./src/storage').settings().database;
module.exports={
  development:{
    client:require('./src/sqlite-client'),
    connection:{filename:file},
    useNullAsDefault:true,
    migrations:{directory:path.join(__dirname,'migrations'),tableName:'knex_migrations'},
    seeds:{directory:path.join(__dirname,'seeds')},
    pool:{afterCreate:function(conn,done){try{conn.pragma('journal_mode = WAL');conn.pragma('foreign_keys = ON');conn.pragma('busy_timeout = 5000');done(null,conn)}catch(e){done(e,conn)}}}
  }
};
