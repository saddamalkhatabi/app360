'use strict';
const crypto=require('node:crypto');
const {validateMedia}=require('./media-validation');
const problem=(message,httpStatus=400)=>Object.assign(Error(message),{httpStatus});
const parse=value=>{try{return JSON.parse(value||'{}')}catch(_){return {}}};
const now=()=>new Date().toISOString();
const safeMedia=row=>{if(!row)return null;const {data,slot_key,...safe}=row;return safe;};
function createParentMediaService(){
 function scope(me){const p=parse(me.user.preferences_json);return {global:me.session.source==='safe-reels-360'&&p.official_school_global===true,manager:me.session.source==='safe-reels-360'&&p.official_school_family===true,entitlements:p.official_entitlements||{}};}
 async function children(db,me){const s=scope(me);if(!s.manager&&!s.global)throw problem('هذه الواجهة لولي الأمر أو مسؤول التدريب',403);const q=db('account_members as m').join('users as u','u.id','m.user_id').where('u.status','active').whereIn('u.role',['learner','child','trainer']).select('u.id','u.display_name','u.role','u.age_band','m.account_id');if(!s.global)q.whereIn('u.id',db('school_manager_children').select('child_user_id').where({manager_user_id:me.user.id}));return q.orderBy('u.display_name').limit(5000);}
 async function targets(db,me,input){const list=await children(db,me),byId=new Map(list.map(row=>[row.id,row]));let ids=Array.isArray(input)?[...new Set(input.map(String))]:[];if(ids.some(id=>!byId.has(id)))throw problem('لا يمكنك اختيار ملف خارج الأسرة أو فريق التدريب',403);return {list,ids};}
 async function save(db,me,input){
  const kind=input.kind;if(!['praise','video'].includes(kind))throw problem('نوع تسجيل غير صالح');
  const audience=await targets(db,me,input.audience_user_ids),child=String(input.child_user_id||'');
  if(kind==='praise'&&(!child||!audience.list.some(row=>row.id===child)))throw problem('اختر ملفاً تابعاً لك',403);
  const accountId=kind==='praise'?audience.list.find(row=>row.id===child).account_id:String(input.account_id||me.account_id||'');
  if(!accountId||!scope(me).global&&accountId!==me.account_id)throw problem('الحساب غير متاح',403);
  if(!await db('accounts').where({id:accountId,status:'active'}).first())throw problem('الحساب غير متاح',403);
  const ids=kind==='praise'?[child]:audience.ids.length?audience.ids:audience.list.filter(row=>row.account_id===accountId).map(row=>row.id);
  if(!ids.length||ids.some(id=>!audience.list.some(row=>row.id===id&&row.account_id===accountId)))throw problem('اختر أطفالاً من حساب واحد');
  if(typeof input.base64!=='string'||!input.base64||input.base64.length>(kind==='video'?8388608:2796204)||!/^[A-Za-z0-9+/]+={0,2}$/.test(input.base64))throw problem('التسجيل غير صالح أو كبير جداً');
  const buffer=Buffer.from(input.base64,'base64'),mime=String(input.mime||'').split(';')[0],checked=validateMedia(buffer,mime,kind);
  const task=kind==='video'?String(input.task_app_id||''):'';
  if(task){const app=await db('applications').where({id:task}).first();if(!app||app.status==='retired'||!/^\/?apps\/[a-zA-Z0-9/_-]+\/(index|launch)\.html$/.test(app.entry_path||''))throw problem('التطبيق المطلوب غير متاح');const selected=audience.list.filter(row=>ids.includes(row.id));if(selected.some(row=>row.age_band&&row.age_band!==app.age_group))throw problem('التطبيق لا يناسب فئة أحد الملفات المختارة');}
  const slot=kind==='praise'?'praise:'+child:'video:'+me.user.id+':'+accountId;
  const row={id:crypto.randomUUID(),owner_user_id:me.user.id,account_id:accountId,kind,child_user_id:kind==='praise'?child:null,slot_key:slot,version:crypto.randomUUID(),mime,...checked,data:buffer,task_app_id:task||null,created_at:now()};
  await db.transaction(async t=>{
   // Serialize replacements for the same account across processes (SQLite serializes writes).
   if(t.client.config.client==='pg')await t('accounts').where({id:accountId}).forUpdate().first();
   await t('school_parent_media').where({slot_key:slot}).del();
   await t('school_parent_media').insert(row);
   for(const id of ids)await t('school_media_audience').insert({media_id:row.id,child_user_id:id});
  });
  return {ok:true,media:safeMedia(row)};
 }
 async function remove(db,me,id){const permitted=await children(db,me),row=await db('school_parent_media').where({id}).first();if(!row)throw problem('التسجيل غير موجود',404);if(!scope(me).global&&(row.account_id!==me.account_id||row.kind==='video'&&row.owner_user_id!==me.user.id))throw problem('التسجيل لا يخصك',403);if(row.child_user_id&&!permitted.some(child=>child.id===row.child_user_id))throw problem('التسجيل لا يخصك',403);await db('school_parent_media').where({id}).del();return {ok:true};}
 async function preview(db,me,id){const permitted=await children(db,me),row=await db('school_parent_media').where({id}).first();if(!row)throw problem('التسجيل غير موجود',404);if(!scope(me).global&&(row.kind==='video'?row.owner_user_id!==me.user.id:!permitted.some(child=>child.id===row.child_user_id)))throw problem('التسجيل لا يخصك',403);return {ok:true,media:{...safeMedia(row),base64:Buffer.from(row.data).toString('base64')}};}
 function entitled(me){const access=scope(me).entitlements;return access.active===true&&access.named_encouragement===true&&(!access.ends_at||Date.parse(access.ends_at)>Date.now());}
 async function prepare(db,me,kind,cachedVersion){
  if(!['praise','video'].includes(kind)||!['learner','child','trainer'].includes(me.user.role))return {ok:true,media:null};
  if(kind==='praise'&&!entitled(me))return {ok:true,media:null,reason:'not_entitled'};
  const row=await db('school_parent_media as p').join('school_media_audience as a','a.media_id','p.id').where({'a.child_user_id':me.user.id,'p.kind':kind}).orderBy('p.created_at','desc').select('p.*').first();
  if(!row)return {ok:true,media:null};
  const id=crypto.randomUUID(),last=kind==='video'?await db('school_media_events').where({version:row.version,child_user_id:me.user.id}).orderBy('updated_at','desc').first():null;
  const position=last&&!last.completed?Math.min(Number(last.position_ms)||0,row.duration_ms-300):0;
  const event={id,version:row.version,kind,owner_user_id:row.owner_user_id,child_user_id:me.user.id,session_id:me.session.id,duration_ms:row.duration_ms,position_ms:Math.max(0,position),created_at:now(),updated_at:now()};
  await db('school_media_events').insert(event);
  const progress=kind==='video'?await db('school_task_progress').where({child_user_id:me.user.id,video_version:row.version}).first():null;
  return {ok:true,media:{...safeMedia(row),base64:cachedVersion===row.version?null:Buffer.from(row.data).toString('base64'),event_id:id,resume_ms:Math.max(0,position),task_progress:progress||null}};
 }
 async function event(db,me,input){
  return db.transaction(async t=>{
   let query=t('school_media_events').where({id:String(input.event_id||''),child_user_id:me.user.id,session_id:me.session.id});if(t.client.config.client==='pg')query=query.forUpdate();const old=await query.first();if(!old)throw problem('حدث غير متاح',404);
   if(old.kind==='praise'&&!entitled(me))throw problem('انتهى استحقاق التشجيع الشخصي',403);
   const position=Math.min(old.duration_ms,Math.max(Number(old.position_ms)||0,Math.floor(Number(input.position_ms)||0)));
   const started=Number(old.started)||input.started===true?1:0;
   const completed=Number(old.completed)||input.completed===true&&started&&position>=old.duration_ms*.8&&Date.now()-Date.parse(old.created_at)>=Math.max(0,(old.duration_ms-(old.position_ms||0))*.7)?1:0;
   await t('school_media_events').where({id:old.id}).update({started,completed,position_ms:position,updated_at:now()});
   const media=await t('school_parent_media').where({version:old.version}).first();
   if(completed&&old.kind==='video'&&media&&media.task_app_id)await t('school_task_progress').insert({child_user_id:me.user.id,video_version:old.version,app_id:media.task_app_id,status:'assigned',checkpoint_json:'{}',updated_at:now()}).onConflict(['child_user_id','video_version']).ignore();
   return {ok:true,started:!!started,completed:!!completed};
  });
 }
 async function task(db,me,input){const version=String(input.video_version||''),row=await db('school_task_progress').where({child_user_id:me.user.id,video_version:version}).first();if(!row)throw problem('المهمة غير متاحة',404);if(!['start','complete','checkpoint'].includes(input.action))throw problem('إجراء غير صالح');let checkpoint={};if(input.action==='checkpoint'){if(!input.checkpoint||typeof input.checkpoint!=='object'||Array.isArray(input.checkpoint))throw problem('نقطة استكمال غير صالحة');const value=JSON.stringify(input.checkpoint);if(value.length>4096)throw problem('نقطة الاستكمال كبيرة جداً');checkpoint=input.checkpoint;}
  const app=await db('applications').where({id:row.app_id}).first();if(!app||!/^\/?apps\/[a-zA-Z0-9/_-]+\/(index|launch)\.html$/.test(app.entry_path||''))throw problem('التطبيق غير متاح',404);
  await db('school_task_progress').where({child_user_id:me.user.id,video_version:version}).update({status:input.action==='complete'?'completed':row.status==='completed'?'completed':'in_progress',checkpoint_json:input.action==='checkpoint'?JSON.stringify(checkpoint):row.checkpoint_json,updated_at:now()});
  return {ok:true,entry_path:'/'+app.entry_path.replace(/^\//,''),app_id:app.id,checkpoint:parse(row.checkpoint_json),status:input.action==='complete'||row.status==='completed'?'completed':'in_progress'};
 }
 async function dashboard(db,me){const members=await children(db,me),ids=members.map(child=>child.id),s=scope(me);const q=db('school_parent_media').select('id','owner_user_id','account_id','kind','child_user_id','version','mime','duration_ms','byte_size','task_app_id','created_at');if(!s.global)q.where({account_id:me.account_id}).where(function(){this.where('owner_user_id',me.user.id).orWhere(function(){this.where('kind','praise').whereIn('child_user_id',ids)})});const media=await q.orderBy('created_at','desc').limit(1000);const events=ids.length?await db('school_media_events').whereIn('child_user_id',ids).select('child_user_id','version','kind').sum({starts:'started',completions:'completed'}).groupBy('child_user_id','version','kind'):[];const tasks=ids.length?await db('school_task_progress').whereIn('child_user_id',ids).orderBy('updated_at','desc').limit(1000):[];return {ok:true,children:members,media,events,tasks,global:s.global,measurement:'Client-reported playback starts/completions and explicit task completion; not a verified learning score.'};}
 return {scope,children,save,remove,preview,prepare,event,task,dashboard,entitled};
}
module.exports={createParentMediaService};
