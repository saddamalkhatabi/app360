'use strict';
function uid(p){return (p||'id')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
function now(){return new Date().toISOString()}
async function setContentStatus(db,contentItemId,status,actorUserId,note){
  var row=await db('content_items').where({id:contentItemId}).first();if(!row)throw new Error('content item not found: '+contentItemId);
  var rev=(row.current_revision||1)+1,content=row.content_json;
  await db.transaction(async function(trx){await trx('content_items').where({id:contentItemId}).update({status:status,current_revision:rev,updated_at:now()});await trx('content_revisions').insert({content_item_id:contentItemId,revision:rev,changed_by_user_id:actorUserId||null,change_kind:'status:'+status,content_json:content,change_note:note||null})});
  return await db('content_items').where({id:contentItemId}).first();
}
async function startSession(db,input){input=input||{};var row={id:input.id||uid('session'),user_id:input.user_id,account_id:input.account_id||null,app_id:input.app_id,plan_id:input.plan_id||null,status:'started',context_json:JSON.stringify(input.context||{})};await db('learning_sessions').insert(row);return row}
async function recordEvent(db,input){input=input||{};var row={id:input.id||uid('evt'),session_id:input.session_id||null,user_id:input.user_id,app_id:input.app_id,event_type:input.event_type,content_item_id:input.content_item_id||null,target_ref:input.target_ref||null,payload_json:JSON.stringify(input.payload||{}),occurred_at:input.occurred_at||now(),source_device_id:input.source_device_id||null};await db('learning_events').insert(row);return row}
async function endSession(db,sessionId,status){await db('learning_sessions').where({id:sessionId}).update({status:status||'completed',ended_at:now()});return await db('learning_sessions').where({id:sessionId}).first()}
async function queueSync(db,entityType,entityId,operation,payload,destination){var row={id:uid('sync'),entity_type:entityType,entity_id:entityId,operation:operation,payload_json:JSON.stringify(payload||{}),destination:destination||'safe-reels-360',status:'pending'};await db('sync_outbox').insert(row);return row}
module.exports={setContentStatus:setContentStatus,startSession:startSession,recordEvent:recordEvent,endSession:endSession,queueSync:queueSync};
