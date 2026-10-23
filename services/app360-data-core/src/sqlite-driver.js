'use strict';
// Keep SQLite files and the Knex API, without requiring an external native addon on Node 22.
let selected;
function failure(reason){return Object.assign(Error('No supported SQLite driver is available'),{code:'APP360_NATIVE_UNAVAILABLE',nativeReason:reason});}
function builtIn(){
 const {DatabaseSync}=require('node:sqlite');
 const probe=new DatabaseSync(':memory:');try{if(typeof probe.prepare('SELECT 1').columns!=='function')throw failure('NODE_SQLITE_VERSION')}finally{probe.close()}
 function row(value){if(!value)return value;const out={};for(const key of Object.keys(value))out[key]=value[key] instanceof Uint8Array?Buffer.from(value[key]):value[key];return out;}
 class NodeSQLite {
  constructor(file,options={}){this.database=new DatabaseSync(file,{readOnly:!!options.readonly});this.readBigInts=false;}
  prepare(sql){const raw=this.database.prepare(sql);if(this.readBigInts)raw.setReadBigInts(true);const args=a=>(a.length===1&&Array.isArray(a[0])?a[0]:a).map(value=>value===undefined?null:value);
   return {reader:raw.columns().length>0,all(...a){return raw.all(...args(a)).map(row)},get(...a){return row(raw.get(...args(a)))},run(...a){return raw.run(...args(a))},safeIntegers(value=true){raw.setReadBigInts(value);return this}};
  }
  pragma(sql,options={}){const statement=this.prepare('PRAGMA '+sql);const rows=statement.reader?statement.all():(statement.run(),[]);return options.simple?Object.values(rows[0]||{})[0]:rows;}
  defaultSafeIntegers(value=true){this.readBigInts=value;return this;}
  exec(sql){this.database.exec(sql);return this;}
  close(){this.database.close();}
 }
 return {name:'node:sqlite',Database:NodeSQLite};
}
function native(){const Database=require('better-sqlite3'),probe=new Database(':memory:');probe.close();return{name:'better-sqlite3',Database};}
function driver(){
 if(selected)return selected;const mode=String(process.env.APP360_SQLITE_DRIVER||'auto');if(!['auto','node','native'].includes(mode))throw failure('DRIVER_SELECTION');
 if(mode!=='native'&&Number(process.versions.node.split('.')[0])>=22){try{return selected=builtIn()}catch(_){if(mode==='node')throw failure('NODE_SQLITE_UNAVAILABLE')}}
 try{return selected=native()}catch(_){throw failure('SQLITE_DRIVERS_UNAVAILABLE')}
}
module.exports={driver};
