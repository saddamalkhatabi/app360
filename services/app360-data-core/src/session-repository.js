'use strict';
var crypto=require('crypto');
function now(){return new Date().toISOString()}
function hash(v){return crypto.createHash('sha256').update(String(v||'')).digest('hex')}
function uid(p){return(p||'id')+'-'+Date.now().toString(36)+'-'+crypto.randomBytes(5).toString('hex')}
function token(){return crypto.randomBytes(32).toString('hex')}
function safeJson(v){try{return JSON.stringify(v==null?{}:v)}catch(e){return'{}'}}
function parseJson(v,fallback){try{return JSON.parse(v||'')}catch(e){return fallback}}
function internalId(prefix,value){return prefix+'-'+hash(value).slice(0,24)}
function unique(a){var out=[],seen={},i,v;for(i=0;i<(a||[]).length;i++){v=String(a[i]||'');if(v&&!seen[v]){seen[v]=1;out.push(v)}}return out}
function isManagerMembership(m){if(!m)return false;var p=parseJson(m.permissions_json,[])||[];return m.relationship==='owner'||m.relationship==='trainer'||p.indexOf('manage_content')>=0||p.indexOf('manage_children')>=0||p.indexOf('manage_members')>=0||p.indexOf('manage_trainees')>=0||p.indexOf('manage_audience')>=0}
function positive(n,max){n=Math.round(Number(n)||0);if(n<0)n=0;if(max&&n>max)n=max;return n}
function clone(v){try{return JSON.parse(JSON.stringify(v))}catch(e){return v}}
function dataUrlParts(v){var m=/^data:([^;,]+);base64,(.+)$/i.exec(String(v||''));if(!m)return null;var buf;try{buf=Buffer.from(m[2],'base64')}catch(e){return null}return{mime:m[1].toLowerCase(),buffer:buf}}

async function ensureExternalUser(db,identity){
  identity=identity||{};
  var source='safe-reels-360';
  var external=String(identity.external_user_id||'');
  var link,userId,user,accountId=null;
  if(!external)throw new Error('external_user_id required');
  link=await db('external_identities').where({source:source,external_user_id:external}).first();
  if(link){
    userId=link.user_id;
    await db('external_identities').where({source:source,external_user_id:external}).update({sync_status:'linked',last_synced_at:now(),metadata_json:safeJson({external_role:identity.external_role,age_band:identity.age_band})});
  }else{
    userId=internalId('user-sr',external);
    user=await db('users').where({id:userId}).first();
    if(!user)await db('users').insert({id:userId,display_name:identity.display_name||'متدرب',role:identity.role||'learner',age_band:identity.age_band||null,status:'active',preferences_json:safeJson({identity_source:source})});
    await db('external_identities').insert({user_id:userId,source:source,external_user_id:external,sync_status:'linked',last_synced_at:now(),metadata_json:safeJson({external_role:identity.external_role,age_band:identity.age_band})});
  }
  await db('users').where({id:userId}).update({display_name:identity.display_name||'متدرب',role:identity.role||'learner',age_band:identity.age_band||null,status:'active',updated_at:now()});
  if(identity.account_external_id){
    accountId=internalId('acct-sr',identity.account_external_id);
    var acctType=(identity.role==='parent')?'family':'institution';
    var relationship='learner',permissions=['practice'];
    if(identity.role==='parent'){relationship='owner';permissions=['manage_children','review_events','manage_content','manage_audience']}
    else if(identity.role==='trainer'){relationship='trainer';permissions=['practice','review_events','manage_content','manage_trainees','manage_audience']}
    else if(identity.role==='institution_admin'){relationship='owner';permissions=['manage_members','review_events','manage_content','manage_audience']}
    else if(String(identity.external_role||'').toLowerCase().indexOf('child')>=0)relationship='child';
    else if(String(identity.external_role||'').toLowerCase().indexOf('trainee')>=0)relationship='trainee';
    accountId=internalId('acct-sr',identity.account_external_id);
    var acct=await db('accounts').where({id:accountId}).first();
    if(!acct)await db('accounts').insert({id:accountId,type:acctType,name:identity.account_name||'حساب الريلز الآمن 360',status:'active',metadata_json:safeJson({external_account_id:identity.account_external_id,source:source})});
    await db('account_members').insert({account_id:accountId,user_id:userId,relationship:relationship,permissions_json:safeJson(permissions)}).onConflict(['account_id','user_id']).merge();
  }
  user=await db('users').where({id:userId}).first();
  return{user:user,account_id:accountId};
}

async function createIdentitySession(db,input){
  input=input||{};
  var raw=token();
  var ttl=Math.max(1,Math.min(Number(input.ttl_hours)||12,168));
  var exp=new Date(Date.now()+ttl*3600000).toISOString();
  var row={id:uid('auth'),user_id:input.user_id,account_id:input.account_id||null,source:input.source||'safe-reels-360',token_hash:hash(raw),external_session_ref:input.external_session_ref||null,status:'active',expires_at:exp,last_seen_at:now()};
  await db('identity_sessions').insert(row);
  return{token:raw,session:row};
}

async function findIdentitySession(db,raw){
  if(!raw)return null;
  var row=await db('identity_sessions').where({token_hash:hash(raw),status:'active'}).first();
  if(!row)return null;
  if(new Date(row.expires_at).getTime()<=Date.now()){
    await db('identity_sessions').where({id:row.id}).update({status:'expired'});
    return null;
  }
  await db('identity_sessions').where({id:row.id}).update({last_seen_at:now()});
  var user=await db('users').where({id:row.user_id,status:'active'}).first();
  if(!user)return null;
  return{session:row,user:user,account_id:row.account_id||null};
}

async function revokeIdentitySession(db,raw){
  if(!raw)return false;
  var n=await db('identity_sessions').where({token_hash:hash(raw),status:'active'}).update({status:'revoked',last_seen_at:now()});
  return n>0;
}

async function memberContext(db,userId,accountId){
  var q=db('account_members').where({user_id:userId});
  if(accountId)q=q.andWhere({account_id:accountId});
  var membership=await q.first();
  return{membership:membership,manager:isManagerMembership(membership),account_id:membership?membership.account_id:(accountId||null)};
}

async function listManagedMembers(db,userId,accountId){
  var ctx=await memberContext(db,userId,accountId);
  if(!ctx.manager||!ctx.account_id)return[];
  var rows=await db('account_members as m').join('users as u','u.id','m.user_id').where('m.account_id',ctx.account_id).andWhereNot('u.id',userId).andWhere('u.status','active').select('u.id as user_id','u.display_name','u.role','u.age_band','m.relationship','m.permissions_json').orderBy('u.display_name','asc');
  var out=[];
  for(var i=0;i<rows.length;i++){
    var r=rows[i];
    if(r.relationship==='child'||r.relationship==='trainee'||r.relationship==='learner'||r.role==='learner')out.push({user_id:r.user_id,display_name:r.display_name,role:r.role,age_band:r.age_band,relationship:r.relationship});
  }
  return out;
}

async function allowedAudienceIds(db,userId,accountId,requested){
  requested=unique(requested||[]);
  if(!requested.length)return[];
  var members=await listManagedMembers(db,userId,accountId),allowed={},out=[],i;
  for(i=0;i<members.length;i++)allowed[members[i].user_id]=1;
  for(i=0;i<requested.length;i++)if(allowed[requested[i]])out.push(requested[i]);
  return out;
}

async function importUsageBatch(db,userId,batch){
  batch=batch||{};
  var batchId=String(batch.batch_id||'');
  var entries=Array.isArray(batch.entries)?batch.entries:[];
  var saved=0,duplicates=0;
  if(!batchId)throw new Error('batch_id required');
  if(entries.length>100)throw new Error('usage batch too large');
  await db.transaction(async function(trx){
    for(var i=0;i<entries.length;i++){
      var e=entries[i]||{},appId=String(e.app_id||''),day=String(e.occurred_day||now().slice(0,10)).slice(0,10),seconds=positive(e.active_seconds,86400),opens=positive(e.opens,1000),receiptId=batchId+':'+appId+':'+day;
      if(!appId)continue;
      var app=await trx('applications').where({id:appId}).first();
      if(!app)continue;
      var oldReceipt=await trx('usage_receipts').where({id:receiptId}).first();
      if(oldReceipt){duplicates++;continue}
      await trx('usage_receipts').insert({id:receiptId,user_id:userId,app_id:appId,batch_id:batchId,occurred_day:day,active_seconds:seconds,opens:opens,device_id:batch.device_id||null});
      var row=await trx('app_usage_daily').where({user_id:userId,app_id:appId,day:day}).first();
      if(row)await trx('app_usage_daily').where({user_id:userId,app_id:appId,day:day}).update({active_seconds:(row.active_seconds||0)+seconds,opens:(row.opens||0)+opens,last_seen_at:now(),updated_at:now()});
      else await trx('app_usage_daily').insert({user_id:userId,app_id:appId,day:day,active_seconds:seconds,opens:opens,last_seen_at:now(),updated_at:now()});
      saved++;
    }
  });
  return{saved:saved,duplicates:duplicates,batch_id:batchId};
}

async function usageDashboard(db,userId){
  var rows=await db('app_usage_daily as u').leftJoin('applications as a','a.id','u.app_id').where('u.user_id',userId).groupBy('u.app_id','a.title_ar').select('u.app_id','a.title_ar').sum({active_seconds:'u.active_seconds'}).sum({opens:'u.opens'}).max({last_seen_at:'u.last_seen_at'}).orderBy('active_seconds','desc');
  var total=0;
  for(var i=0;i<rows.length;i++){rows[i].active_seconds=Number(rows[i].active_seconds)||0;rows[i].opens=Number(rows[i].opens)||0;total+=rows[i].active_seconds}
  return{user_id:userId,total_active_seconds:total,apps:rows};
}

async function managedUsageDashboard(db,userId,accountId){
  var own=await usageDashboard(db,userId),members=await listManagedMembers(db,userId,accountId),out=[],i,u;
  for(i=0;i<members.length;i++){
    u=await usageDashboard(db,members[i].user_id);
    u.profile=members[i];
    out.push(u);
  }
  own.managed_members=out;
  return own;
}

async function persistContentAssets(db,fileStore,userId,content){
  var result={content:clone(content),links:[]};
  if(!fileStore||!result.content||typeof result.content!=='object')return result;
  var assets=result.content.assets;
  if(!Array.isArray(assets))return result;
  for(var i=0;i<assets.length;i++){
    var a=assets[i]||{},parts=dataUrlParts(a.data_url);
    if(!parts)continue;
    if(parts.mime.indexOf('image/')!==0)continue;
    if(parts.buffer.length>2*1024*1024)throw new Error('image asset too large');
    var row=await fileStore.putBuffer(db,userId,a.file_name||('image-'+(i+1)+'.png'),parts.mime,parts.buffer,{width:a.width||null,height:a.height||null,asset_id:a.asset_id||null});
    result.links.push({file_id:row.id,purpose:a.purpose||'illustration',item_ref:a.item_ref||null,sort_order:i});
    delete a.data_url;
    a.file_id=row.id;a.mime_type=row.mime_type;a.size=row.byte_size;a.stored=true;
  }
  return result;
}

async function replaceAudience(db,itemId,userId,accountId,requested){
  var ids=await allowedAudienceIds(db,userId,accountId,requested);
  await db('content_audiences').where({content_item_id:itemId}).del();
  for(var i=0;i<ids.length;i++)await db('content_audiences').insert({content_item_id:itemId,target_user_id:ids[i],granted_by_user_id:userId,can_edit:0,status:'active',updated_at:now()});
  await db('content_items').where({id:itemId}).update({audience_mode:ids.length?'selected':'private',updated_at:now()});
  return ids;
}

async function audienceForItem(db,itemId){
  var rows=await db('content_audiences as ca').join('users as u','u.id','ca.target_user_id').where({'ca.content_item_id':itemId,'ca.status':'active'}).select('u.id as user_id','u.display_name','u.role','u.age_band','ca.can_edit');
  return rows.map(function(r){return{user_id:r.user_id,display_name:r.display_name,role:r.role,age_band:r.age_band,can_edit:!!r.can_edit}});
}

async function upsertUserContentBatch(db,userId,batch,opts){
  batch=batch||{};opts=opts||{};
  var items=Array.isArray(batch.items)?batch.items:[],saved=0,result=[];
  if(items.length>100)throw new Error('content batch too large');
  for(var i=0;i<items.length;i++){
    var x=items[i]||{},appId=String(x.app_id||''),clientKey=String(x.client_key||''),type=String(x.content_type||'user_content'),title=String(x.title||'محتوى شخصي').slice(0,240);
    if(!appId||!clientKey)continue;
    var app=await db('applications').where({id:appId}).first();if(!app)continue;
    var existing=await db('content_items').where({owner_user_id:userId,app_id:appId,client_key:clientKey}).first();
    var id=existing?existing.id:internalId('uc',userId+'|'+appId+'|'+clientKey),rev=existing?(existing.current_revision||1)+1:1;
    var assetResult=await persistContentAssets(db,opts.fileStore,userId,clone(x.content||{}));
    var content=assetResult.content,contentJson=safeJson(content);
    if(existing){
      await db('content_items').where({id:id}).update({content_type:type,title:title,status:'draft',source_kind:x.source_kind||'user-created',current_revision:rev,content_json:contentJson,tags_json:safeJson(x.tags||[]),visibility:'private',origin_device_id:batch.device_id||null,updated_at:now()});
    }else{
      await db('content_items').insert({id:id,app_id:appId,content_type:type,owner_user_id:userId,title:title,status:'draft',source_kind:x.source_kind||'user-created',current_revision:1,content_json:contentJson,tags_json:safeJson(x.tags||[]),client_key:clientKey,visibility:'private',moderation_status:'not_submitted',origin_device_id:batch.device_id||null,audience_mode:'private'});
    }
    for(var li=0;li<assetResult.links.length;li++)await opts.fileStore.linkToContent(db,id,assetResult.links[li].file_id,assetResult.links[li].purpose,assetResult.links[li].item_ref,assetResult.links[li].sort_order);
    await db('content_revisions').insert({content_item_id:id,revision:rev,changed_by_user_id:userId,change_kind:existing?'user-sync-update':'user-sync-create',content_json:contentJson,change_note:'private account save'});
    var audience;
    if(Object.prototype.hasOwnProperty.call(x,'audience_user_ids'))audience=await replaceAudience(db,id,userId,opts.account_id||null,x.audience_user_ids||[]);
    else audience=(await audienceForItem(db,id)).map(function(a){return a.user_id});
    result.push({id:id,client_key:clientKey,app_id:appId,content_type:type,audience_user_ids:audience});
    saved++;
  }
  return{saved:saved,items:result};
}

async function hydrateAssets(db,fileStore,row,content){
  if(!fileStore||!content||!Array.isArray(content.assets))return content;
  for(var i=0;i<content.assets.length;i++){
    var a=content.assets[i]||{};
    if(!a.file_id||a.data_url)continue;
    var f=await fileStore.readBuffer(db,a.file_id);
    if(!f||f.buffer.length>2*1024*1024)continue;
    a.data_url='data:'+(f.row.mime_type||a.mime_type||'application/octet-stream')+';base64,'+f.buffer.toString('base64');
  }
  return content;
}

async function listVisibleContent(db,userId,appId,opts){
  opts=opts||{};
  var q=db('content_items as c').leftJoin('content_audiences as ca',function(){this.on('ca.content_item_id','=','c.id').andOn('ca.target_user_id','=',db.raw('?',[userId])).andOn('ca.status','=',db.raw('?',['active']))});
  if(opts.owned_only)q=q.where('c.owner_user_id',userId);else q=q.where(function(){this.where('c.owner_user_id',userId).orWhereNotNull('ca.target_user_id')});
  if(appId)q=q.andWhere('c.app_id',appId);
  var rows=await q.select('c.*','ca.can_edit as assigned_can_edit').distinct().orderBy('c.updated_at','desc').limit(300),out=[];
  for(var i=0;i<rows.length;i++){
    var r=rows[i],x={};for(var k in r)x[k]=r[k];
    var content=parseJson(r.content_json,{})||{};content=await hydrateAssets(db,opts.fileStore,r,content);x.content=content;delete x.content_json;
    x.is_owner=r.owner_user_id===userId;x.assigned_to_me=!x.is_owner&&r.assigned_can_edit!==undefined;x.can_edit=x.is_owner||!!r.assigned_can_edit;delete x.assigned_can_edit;
    if(x.is_owner){var aud=await audienceForItem(db,r.id);x.audience=aud;x.audience_user_ids=aud.map(function(a){return a.user_id})}
    out.push(x);
  }
  return out;
}

async function setContentAudience(db,userId,accountId,itemId,ids){
  var item=await db('content_items').where({id:itemId}).first();
  if(!item)throw new Error('content_not_found');
  if(item.owner_user_id!==userId)throw new Error('content_not_owned');
  var applied=await replaceAudience(db,itemId,userId,accountId,ids||[]);
  await db('content_revisions').insert({content_item_id:itemId,revision:(item.current_revision||1)+1,changed_by_user_id:userId,change_kind:'audience-update',content_json:item.content_json||'{}',change_note:'audience:'+applied.join(',')});
  await db('content_items').where({id:itemId}).update({current_revision:(item.current_revision||1)+1,updated_at:now()});
  return{content_item_id:itemId,audience_user_ids:applied,audience:await audienceForItem(db,itemId)};
}

module.exports={
  hashToken:hash,
  ensureExternalUser:ensureExternalUser,
  createIdentitySession:createIdentitySession,
  findIdentitySession:findIdentitySession,
  revokeIdentitySession:revokeIdentitySession,
  memberContext:memberContext,
  listManagedMembers:listManagedMembers,
  importUsageBatch:importUsageBatch,
  usageDashboard:usageDashboard,
  managedUsageDashboard:managedUsageDashboard,
  upsertUserContentBatch:upsertUserContentBatch,
  listUserContent:listVisibleContent,
  listVisibleContent:listVisibleContent,
  setContentAudience:setContentAudience,
  audienceForItem:audienceForItem
};
