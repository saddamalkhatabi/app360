'use strict';
var fs=require('fs');var path=require('path');var core=require('../src');
var file=process.argv[2],user=process.argv[3]||'user-parent-demo';
if(!file){console.error('Usage: node scripts/import-bundle.js <bundle.json> [user_id]');process.exit(1)}
(async function(){var raw=fs.readFileSync(path.resolve(file),'utf8'),bundle=JSON.parse(raw),db=await core.db.createDb();try{await db.migrate.latest();var result=await core.repository.importAiBundle(db,bundle,user);console.log(JSON.stringify(result,null,2))}finally{await db.destroy()}})().catch(function(e){console.error(e&&e.stack||e);if(e&&e.validation)console.error(JSON.stringify(e.validation,null,2));process.exit(1)});
