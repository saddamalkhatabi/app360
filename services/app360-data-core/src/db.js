'use strict';
var path=require('path');
var knexFactory=require('knex');
var config=require('../knexfile').development;
function createDb(){require('./storage').prepareDirectory(path.dirname(config.connection.filename),false);var db=knexFactory(config);return db.raw('PRAGMA foreign_keys = ON').then(function(){return db.raw('PRAGMA journal_mode = WAL')}).then(function(){return db.raw('PRAGMA busy_timeout = 5000')}).then(function(){return db}).catch(async function(e){await db.destroy();throw e})}
module.exports={createDb:createDb,config:config};
