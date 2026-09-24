'use strict';
var fs=require('fs');var path=require('path');var core=require('../src');var sessions=require('../src/session-repository');var demoAuth=require('../src/demo-auth');var createFileStore=require('../src/file-store').createFileStore;
(async function(){
  var db=await core.db.createDb(),stamp=Date.now().toString(36),uploadRoot=path.resolve(__dirname,'../var/smoke-uploads-'+stamp),store=createFileStore({root:uploadRoot});
  try{
    await db.migrate.latest();await db.seed.run();
    var parent=await demoAuth.authenticate(db,'demo.parent','2468');if(!parent||parent.user.id!=='user-parent-demo')throw new Error('seed parent login failed');
    if(await demoAuth.authenticate(db,'demo.parent','9999'))throw new Error('wrong demo PIN accepted');
    var child1=await demoAuth.authenticate(db,'demo.child1','1111'),child2=await demoAuth.authenticate(db,'demo.child2','2222'),trainer=await demoAuth.authenticate(db,'demo.trainer','8642');
    if(!child1||!child2||!trainer)throw new Error('seed child/trainer login failed');
    var family=await sessions.listManagedMembers(db,parent.user.id,parent.account_id),trainees=await sessions.listManagedMembers(db,trainer.user.id,trainer.account_id);
    if(family.length!==2)throw new Error('parent managed children mismatch '+family.length);if(trainees.length!==3)throw new Error('trainer managed trainees mismatch '+trainees.length);
    var auth=await sessions.createIdentitySession(db,{user_id:child1.user.id,account_id:child1.account_id,source:'seed-local',ttl_hours:1}),found=await sessions.findIdentitySession(db,auth.token);if(!found||found.user.id!==child1.user.id)throw new Error('identity session lookup failed');
    var batch={batch_id:'smoke-usage-'+stamp,device_id:'smoke-device',entries:[{app_id:'a1-first-words',active_seconds:31,opens:1,occurred_day:new Date().toISOString().slice(0,10)},{app_id:'a1-screen-move',active_seconds:47,opens:2,occurred_day:new Date().toISOString().slice(0,10)}]};
    var once=await sessions.importUsageBatch(db,child1.user.id,batch),twice=await sessions.importUsageBatch(db,child1.user.id,batch);if(once.saved!==2||twice.duplicates!==2)throw new Error('usage idempotency failed');
    var png='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Y9Z7N0AAAAASUVORK5CYII=';
    var saved=await sessions.upsertUserContentBatch(db,parent.user.id,{device_id:'smoke-parent-device',items:[{app_id:'a1-first-words',content_type:'ai_pack',client_key:'smoke-ai-'+stamp,title:'حزمة AI للأسرة',audience_user_ids:[child1.user.id,child2.user.id],content:{local_pack_id:'pack-'+stamp,title:'حزمة AI للأسرة',local_status:'published',items:[{id:'ai-1',word_ar:'قمر'}],assets:[{asset_id:'asset-1',file_name:'moon.png',mime_type:'image/png',purpose:'illustration',item_ref:'ai-1',data_url:png}]}}]},{account_id:parent.account_id,fileStore:store});
    if(saved.saved!==1||!saved.items[0]||saved.items[0].audience_user_ids.length!==2)throw new Error('parent content audience save failed');
    var fileCount=Number((await db('files').count({n:'id'}).first()).n)||0;if(fileCount!==1)throw new Error('image file persistence failed '+fileCount);
    var c1Visible=await sessions.listVisibleContent(db,child1.user.id,'a1-first-words',{account_id:child1.account_id,fileStore:store});if(c1Visible.length!==1||!c1Visible[0].content.assets[0].data_url)throw new Error('assigned AI/image content not visible to child');
    await sessions.setContentAudience(db,parent.user.id,parent.account_id,saved.items[0].id,[child2.user.id]);
    c1Visible=await sessions.listVisibleContent(db,child1.user.id,'a1-first-words',{account_id:child1.account_id,fileStore:store});var c2Visible=await sessions.listVisibleContent(db,child2.user.id,'a1-first-words',{account_id:child2.account_id,fileStore:store});if(c1Visible.length!==0||c2Visible.length!==1)throw new Error('audience update visibility failed');
    var own=await sessions.upsertUserContentBatch(db,child1.user.id,{device_id:'child-device',items:[{app_id:'a1-screen-move',content_type:'user_game',client_key:'private-game-'+stamp,title:'لعبتي الخاصة',content:{type:'choice'}}]},{account_id:child1.account_id,fileStore:store});if(own.saved!==1)throw new Error('child private content save failed');
    var sibling=await sessions.listVisibleContent(db,child2.user.id,'a1-screen-move',{account_id:child2.account_id,fileStore:store});if(sibling.length!==0)throw new Error('private child content leaked to sibling');
    var dash=await sessions.usageDashboard(db,child1.user.id);if(dash.total_active_seconds!==78)throw new Error('dashboard total mismatch '+dash.total_active_seconds);
    var parentDash=await sessions.managedUsageDashboard(db,parent.user.id,parent.account_id);if(!parentDash.managed_members||parentDash.managed_members.length!==2)throw new Error('parent managed dashboard failed');
    var creds=await db('local_credentials').select('pin_hash','pin_salt');for(var i=0;i<creds.length;i++)if(creds[i].pin_hash==='2468'||creds[i].pin_hash==='1111'||creds[i].pin_hash==='2222')throw new Error('plaintext PIN persisted');
    await sessions.revokeIdentitySession(db,auth.token);if(await sessions.findIdentitySession(db,auth.token))throw new Error('revoked session still accepted');
    console.log(JSON.stringify({ok:true,seed_parent:parent.user.id,seed_children:family.length,seed_trainer:trainer.user.id,seed_trainees:trainees.length,usage_saved:once.saved,duplicate_receipts:twice.duplicates,total_seconds:dash.total_active_seconds,stored_images:fileCount,audience_child1_after_change:c1Visible.length,audience_child2_after_change:c2Visible.length,pin_persisted:false},null,2));
  }finally{await db.destroy();try{if(fs.existsSync(uploadRoot))fs.rmSync(uploadRoot,{recursive:true,force:true})}catch(e){}}
})().catch(function(e){console.error(e&&e.stack||e);process.exit(1)});
