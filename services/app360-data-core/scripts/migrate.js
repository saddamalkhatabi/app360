'use strict';
var knex=require('knex');
var cfg=require('../knexfile').development;
var db=knex(cfg);
db.migrate.latest().then(function(r){console.log('migrations complete',r[1]||[]);return db.destroy()}).catch(function(e){console.error(e);db.destroy().then(function(){process.exit(1)})});
