'use strict';
const BetterSQLiteClient=require('knex/lib/dialects/better-sqlite3');
// Reuse Knex's supported SQLite query/schema compilers and transaction implementation.
module.exports=class SchoolSQLiteClient extends BetterSQLiteClient {
 _driver(){return require('./sqlite-driver').driver().Database;}
};
