'use strict';
var contracts=require('./contracts');
function uid(p){return (p||'id')+'-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
function now(){return new Date().toISOString()}
function titleOf(item){return item.title_ar||item.label_ar||item.word_ar||item.id||'محتوى جديد'}
async function importAiBundle(db,bundle,actorUserId,opts){
  opts=opts||{};var check=contracts.validateBundle(bundle);if(!check.ok){var err=new Error('AI bundle validation failed: '+check.errors.join('; '));err.validation=check;throw err}
  var batchId=opts.batchId||uid('batch');var appId=bundle.app_id,type=bundle.content_type,items=bundle.items||[];
  return await db.transaction(async function(trx){
    await trx('ai_import_batches').insert({id:batchId,app_id:appId,imported_by_user_id:actorUserId||null,generation_request_id:opts.generationRequestId||null,content_type:type,title:bundle.title||('AI '+type),item_count:items.length,asset_count:(bundle.assets||[]).length,status:'draft',raw_bundle_json:JSON.stringify(bundle),validation_json:JSON.stringify({ok:true,errors:[]})});
    var imported=[];
    for(var i=0;i<items.length;i++){
      var item=items[i]||{},itemId=item.id||uid('content'),existing=await trx('content_items').where({id:itemId}).first(),rev=existing?(existing.current_revision||1)+1:1;
      if(existing){
        await trx('content_items').where({id:itemId}).update({title:titleOf(item),status:'draft',source_kind:'ai-assisted',current_revision:rev,content_json:JSON.stringify(item),updated_at:now()});
      }else{
        await trx('content_items').insert({id:itemId,app_id:appId,content_type:type,owner_user_id:actorUserId||null,title:titleOf(item),status:'draft',source_kind:'ai-assisted',current_revision:1,content_json:JSON.stringify(item),tags_json:JSON.stringify(item.tags||[])});
      }
      await trx('content_revisions').insert({content_item_id:itemId,revision:rev,changed_by_user_id:actorUserId||null,change_kind:existing?'ai-reimport':'ai-import',content_json:JSON.stringify(item),change_note:bundle.title||null});
      imported.push(itemId);
    }
    return {batch_id:batchId,content_ids:imported,validation:check};
  });
}
async function setContentStatus(db,contentItemId,status,actorUserId,note){
  var row=await db('content_items').where({id:contentItemId}).first();if(!row)throw new Error('content item not found: '+contentItemId);
  var rev=(row.current_revision||1)+1,content=row.content_json;
  await db.transaction(async function(trx){await trx('content_items').where({id:contentItemId}).update({status:status,current_revision:rev,updated_at:now()});await trx('content_revisions').insert({content_item_id:contentItemId,revision:rev,changed_by_user_id:actorUserId||null,change_kind:'status:'+status,content_json:content,change_note:note||null})});
  return await db('content_items').where({id:contentItemId}).first();
}
async function createGenerationRequest(db,input){
  input=input||{};var row={id:input.id||uid('gen'),app_id:input.app_id,requested_by_user_id:input.user_id||null,content_type:input.content_type,prompt_text:input.prompt_text,options_json:JSON.stringify(input.options||{}),provider_hint:input.provider_hint||null,status:input.status||'prompt-created'};await db('ai_generation_requests').insert(row);return row;
}
async function startSession(db,input){input=input||{};var row={id:input.id||uid('session'),user_id:input.user_id,account_id:input.account_id||null,app_id:input.app_id,plan_id:input.plan_id||null,status:'started',context_json:JSON.stringify(input.context||{})};await db('learning_sessions').insert(row);return row}
async function recordEvent(db,input){input=input||{};var row={id:input.id||uid('evt'),session_id:input.session_id||null,user_id:input.user_id,app_id:input.app_id,event_type:input.event_type,content_item_id:input.content_item_id||null,target_ref:input.target_ref||null,payload_json:JSON.stringify(input.payload||{}),occurred_at:input.occurred_at||now(),source_device_id:input.source_device_id||null};await db('learning_events').insert(row);return row}
async function endSession(db,sessionId,status){await db('learning_sessions').where({id:sessionId}).update({status:status||'completed',ended_at:now()});return await db('learning_sessions').where({id:sessionId}).first()}
async function queueSync(db,entityType,entityId,operation,payload,destination){var row={id:uid('sync'),entity_type:entityType,entity_id:entityId,operation:operation,payload_json:JSON.stringify(payload||{}),destination:destination||'safe-reels-360',status:'pending'};await db('sync_outbox').insert(row);return row}
module.exports={importAiBundle:importAiBundle,setContentStatus:setContentStatus,createGenerationRequest:createGenerationRequest,startSession:startSession,recordEvent:recordEvent,endSession:endSession,queueSync:queueSync};
