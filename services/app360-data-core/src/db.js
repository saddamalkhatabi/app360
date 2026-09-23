'use strict';
var fs=require('fs');
var path=require('path');
var knexFactory=require('knex');
var config=require('../knexfile').development;
function ensureDir(){var dir=path.dirname(config.connection.filename);if(!fs.existsSync(dir))fs.mkdirSync(dir,{recursive:true})}
function createDb(){ensureDir();var db=knexFactory(config);return db.raw('PRAGMA foreign_keys = ON').then(function(){return db.raw('PRAGMA journal_mode = WAL')}).then(function(){return db.raw('PRAGMA busy_timeout = 5000')}).then(function(){return db})}
module.exports={createDb:createDb,config:config};
