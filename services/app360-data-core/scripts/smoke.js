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
    await core.repository.recordEvent(db,{session_id:session.id,user_id:'user-child-01',app_id:'a1-first-words',event_type:'content.opened',content_item_id:imported.content_ids[0],payload:{smoke:true}});
    await db('plans').insert({id:'plan-smoke',owner_user_id:'user-parent-demo',account_id:'acct-family-demo',age_group:'1-4',age_band:'2-3',title:'خطة اختبار',purpose:'Smoke persisted plan'}).onConflict('id').merge();
    await db('plan_steps').insert([{id:'step-smoke-1',plan_id:'plan-smoke',position:1,app_id:'a1-first-words',route_level:'item',target_ref:'ai-smoke-word',label:'كلمة كرة',duration_seconds:30,advance_mode:'manual'},{id:'step-smoke-2',plan_id:'plan-smoke',position:2,app_id:'a1-imitate',route_level:'app',label:'دوري ودورك',duration_seconds:45,advance_mode:'timer'}]).onConflict('id').merge();
    var runId='run-'+Date.now();await db('plan_runs').insert({id:runId,plan_id:'plan-smoke',user_id:'user-child-01',session_id:session.id,status:'running',current_position:1,context_json:JSON.stringify({smoke:true})});
    await db('plan_step_results').insert({id:'result-'+Date.now(),run_id:runId,step_id:'step-smoke-1',status:'completed',opened_at:new Date().toISOString(),completed_at:new Date().toISOString(),result_json:JSON.stringify({smoke:true})});
    await db('plan_runs').where({id:runId}).update({status:'completed',current_position:2,ended_at:new Date().toISOString()});
    await core.repository.endSession(db,session.id,'completed');
    var planRuns=await db('plan_runs').where({plan_id:'plan-smoke'}).count({n:'id'}).first();
    console.log(JSON.stringify({ok:true,apps:Number(apps.n),users:Number(users.n),content_types:Number(types.n),imported:imported.content_ids,session:session.id,plan_runs:Number(planRuns.n)},null,2));
  }finally{await db.destroy()}
})().catch(function(e){console.error(e&&e.stack||e);process.exit(1)});
