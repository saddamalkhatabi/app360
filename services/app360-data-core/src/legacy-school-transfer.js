'use strict';
const crypto=require('node:crypto');
const names=['addon_school_registry','addon_school_policies','addon_school_app_overrides','addon_school_usage_daily','addon_school_usage_receipts'];
function canonical(v){if(v instanceof Date)return v.toISOString();if(Array.isArray(v))return v.map(canonical);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(key=>[key,canonical(v[key])]));return v;}
const digest=v=>crypto.createHash('sha256').update(JSON.stringify(canonical(v))).digest('hex');
const problem=message=>Object.assign(Error(message),{httpStatus:409});
function createLegacySchoolTransfer(call){
 let running;
 async function verify(db,id,manifest){
  const actual={};
  for(const table of names){let count=0;const hash=crypto.createHash('sha256');while(true){const rows=await db('school_transfer_rows').where({transfer_id:id,source_table:table}).orderBy('row_number').offset(count).limit(500);for(const row of rows)hash.update(JSON.stringify(canonical(JSON.parse(row.payload_json)))+'\n');count+=rows.length;if(rows.length<500)break;}actual[table]={rows:count,sha256:hash.digest('hex')};}
  if(digest(actual)!==digest(manifest))throw problem('Imported School records do not match the Reels manifest; source deletion is forbidden');
  return actual;
 }
 async function materialize(db,id){
  for(const table of names){let offset=0;while(true){const rows=await db('school_transfer_rows').where({transfer_id:id,source_table:table}).orderBy('row_number').offset(offset).limit(500);await db.transaction(async t=>{for(const item of rows){const row=JSON.parse(item.payload_json),updated_at=new Date().toISOString();
   if(table==='addon_school_registry')await t('school_platform_settings').insert({key:'school_enabled',value:String(row.enabled)}).onConflict('key').ignore();
   if(table==='addon_school_policies')await t('school_account_policies').insert({account_external_id:String(row.owner_user_id),enabled:row.enabled,allow_preview:row.allow_preview,daily_limit_minutes:row.daily_limit_minutes,allowed_app_ids_json:row.allowed_app_ids_json,updated_at}).onConflict('account_external_id').ignore();
   if(table==='addon_school_app_overrides')await t('school_app_overrides').insert({app_id:row.app_id,enabled:row.enabled,preview:row.preview,updated_at}).onConflict('app_id').ignore();
   if(table==='addon_school_usage_daily')await t('school_legacy_usage').insert({external_child_id:'child:'+row.child_id,app_id:row.app_id,day:row.day,active_seconds:row.active_seconds,opens:row.opens}).onConflict(['external_child_id','app_id','day']).merge({active_seconds:t.raw('CASE WHEN school_legacy_usage.active_seconds > ? THEN school_legacy_usage.active_seconds ELSE ? END',[row.active_seconds,row.active_seconds]),opens:t.raw('CASE WHEN school_legacy_usage.opens > ? THEN school_legacy_usage.opens ELSE ? END',[row.opens,row.opens])});
  }});offset+=rows.length;if(rows.length<500)break;}}
 }
 async function work(db,grantToken){
  if(process.env.NODE_ENV==='production'&&process.env.APP360_PUBLIC_ORIGIN!=='https://school.yem1.com')throw problem('Verified transfer is restricted to the configured production School origin https://school.yem1.com');
  const authorizedCall=(action,input)=>call(action,{...input,...(grantToken?{grant_token:grantToken}:{})});
  const state=await authorizedCall('data-prepare',{}),id=String(state.id||'');if(!id||!state.manifest||names.some(name=>!state.manifest[name]))throw problem('Reels transfer protocol is unavailable; deploy the matching Reels patch first');
  const old=await db('school_data_transfers').where({id}).first();if(state.status==='complete'&&!old)throw problem('Reels was already detached from a different School database. Restore the School database backup; do not create a new empty replacement.');
  if(old&&old.status==='complete')return {ok:true,complete:true,already_complete:true};
  if(!old)await db('school_data_transfers').insert({id,status:'importing',manifest_json:JSON.stringify(state.manifest),created_at:new Date().toISOString()});
  else if(digest(JSON.parse(old.manifest_json))!==digest(state.manifest))throw problem('Transfer manifest changed');
  if(state.status!=='complete')for(const table of names){for(let offset=0;offset<state.manifest[table].rows;offset+=500){const page=await authorizedCall('data-page',{id,table,offset});if(page.id!==id||page.table!==table||page.offset!==offset||!Array.isArray(page.rows)||!page.rows.length||page.rows.length>500||digest(page.rows)!==page.page_sha256)throw problem('Invalid source transfer page');await db.transaction(async t=>{for(let n=0;n<page.rows.length;n++)await t('school_transfer_rows').insert({transfer_id:id,source_table:table,row_number:offset+n,payload_json:JSON.stringify(canonical(page.rows[n]))}).onConflict(['transfer_id','source_table','row_number']).ignore();});}}
  const verified=await verify(db,id,state.manifest);
  await materialize(db,id);
  await db('school_data_transfers').where({id}).update({status:'verified'});
  // This acknowledgement is sent only after durable row-by-row import verification.
  const result=await authorizedCall('data-complete',{id,manifest:verified});if(!result.complete)throw problem('Reels did not confirm data detachment');
  await db('school_data_transfers').where({id}).update({status:'complete',completed_at:new Date().toISOString()});
  return {ok:true,complete:true,manifest:verified};
 }
 function run(db,grantToken){if(!running)running=work(db,grantToken).finally(()=>{running=null});return running;}
 return {run,verify};
}
module.exports={createLegacySchoolTransfer,canonical,digest,names};
