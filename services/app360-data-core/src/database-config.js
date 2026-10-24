'use strict';
const path=require('node:path');
function invalid(){return Object.assign(Error('Invalid database configuration'),{code:'APP360_DATABASE_CONFIG_INVALID'});}
function engine(env=process.env){const value=String(env.APP360_DB_CLIENT||'sqlite').toLowerCase();if(['sqlite','sqlite3','better-sqlite3'].includes(value))return'sqlite';if(['pg','postgres','postgresql'].includes(value))return'postgresql';throw invalid();}
function integer(value,fallback,min,max){const n=value===undefined||value===''?fallback:Number(value);if(!Number.isInteger(n)||n<min||n>max)throw invalid();return n;}
function fileStorage(env=process.env){const value=env.APP360_FILE_STORAGE||(engine(env)==='postgresql'?'database':'filesystem');if(!['database','filesystem'].includes(value))throw invalid();return value;}
function configuration(env=process.env){
 const selected=engine(env),root=path.resolve(__dirname,'..'),adapter=require('./databases/'+selected),config=adapter.configuration(env);
 return {...config,compileSqlOnError:false,acquireConnectionTimeout:15000,migrations:{directory:[path.join(root,'migrations'),path.join(root,'database',selected,'migrations')],tableName:'knex_migrations',sortDirsSeparately:true,loadExtensions:['.js'],...(selected==='postgresql'?{schemaName:'public'}:{})},seeds:{directory:[path.join(root,'seeds'),path.join(root,'database',selected,'seeds')],sortDirsSeparately:true,loadExtensions:['.js']},log:{warn(){},error(){},deprecate(){},debug(){}}};
}
module.exports={engine,fileStorage,configuration,integer,invalid};
