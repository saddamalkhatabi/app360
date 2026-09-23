'use strict';
var knex=require('knex');var cfg=require('../knexfile').development;var db=knex(cfg);db.seed.run().then(function(r){console.log('seeds complete',r||[]);return db.destroy()}).catch(function(e){console.error(e);db.destroy().then(function(){process.exit(1)})});
