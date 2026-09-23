'use strict';
var core=require('../src');
(async function(){
  var db=await core.db.createDb();
  try{
    await db.migrate.latest();await db.seed.run();
    var apps=await db('applications').count({n:'id'}).first();var users=await db('users').count({n:'id'}).first();var types=await db('content_types').count({n:'key'}).first();
    var sample={schema_version:'1.0',app_id:'a1-first-words',content_type:'word_cards',title:'Smoke AI bundle',items:[{id:'ai-smoke-word',level:1,category_ar:'اختبار',word_ar:'كرة'}],assets:[]};
    var imported=await core.repository.importAiBundle(db,sample,'user-parent-demo');
    var session=await core.repository.startSession(db,{user_id:'user-child-01',account_id:'acct-family-demo',app_id:'a1-first-words',context:{smoke:true}});
    await core.repository.recordEvent(db,{session_id:session.id,user_id:'user-child-01',app_id:'a1-first-words',event_type:'content.opened',content_item_id:imported.content_ids[0],payload:{smoke:true}});await core.repository.endSession(db,session.id,'completed');
    console.log(JSON.stringify({ok:true,apps:Number(apps.n),users:Number(users.n),content_types:Number(types.n),imported:imported.content_ids,session:session.id},null,2));
  }finally{await db.destroy()}
})().catch(function(e){console.error(e&&e.stack||e);process.exit(1)});
