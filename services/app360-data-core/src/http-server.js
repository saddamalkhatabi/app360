'use strict';
var http=require('http');var url=require('url');var core=require('./index');var sessions=require('./session-repository');var demoAuth=require('./demo-auth');var safe=require('./safe-reels-adapter');var fileStore=require('./file-store').createFileStore();
var PORT=Number(process.env.APP360_PORT||3036),MAX_BODY=20*1024*1024;
function send(res,status,obj,origin){var body=JSON.stringify(obj||{});res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');if(origin)res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Vary','Origin');res.end(body)}
function allowedOrigin(req){var origin=req.headers.origin||'';if(!origin)return'';try{var u=new URL(origin);if(u.host===req.headers.host)return origin}catch(e){}var list=String(process.env.APP360_ALLOWED_ORIGINS||'').split(',');for(var i=0;i<list.length;i++)if(list[i].trim()===origin)return origin;return null}
function body(req){return new Promise(function(resolve,reject){var parts=[],size=0;req.on('data',function(c){size+=c.length;if(size>MAX_BODY){reject(new Error('body too large'));req.destroy();return}parts.push(c)});req.on('end',function(){if(!parts.length){resolve({});return}try{resolve(JSON.parse(Buffer.concat(parts).toString('utf8')))}catch(e){reject(new Error('invalid JSON'))}});req.on('error',reject)})}
function bearer(req){var h=String(req.headers.authorization||''),m=/^Bearer\s+(.+)$/i.exec(h);return m?m[1]:''}
function demoLoginEnabled(){if(String(process.env.APP360_ENABLE_SEED_LOGIN||'')==='1')return true;if(String(process.env.APP360_ENABLE_SEED_LOGIN||'')==='0')return false;return String(process.env.NODE_ENV||'development')!=='production'}
async function auth(db,req){return await sessions.findIdentitySession(db,bearer(req))}
function profileOf(user,accountId,extra){var p={user_id:user.id,display_name:user.display_name,role:user.role,age_band:user.age_band,account_id:accountId||null};if(extra)for(var k in extra)p[k]=extra[k];return p}
async function loginRequest(db,input){
  input=input||{};var local=null,identity,linked,source='safe-reels-360',accountId=null,user=null,extra={};
  if(demoLoginEnabled())local=await demoAuth.authenticate(db,input.query,input.pin);
  if(local){user=local.user;accountId=local.account_id;source='seed-local';extra.username=local.username;extra.demo=!!local.is_demo}
  else{
    if(demoLoginEnabled()&&await demoAuth.hasCredential(db,input.query)){var denied=new Error('Demo login rejected');denied.code='AUTH_REJECTED';denied.httpStatus=401;throw denied}
    try{identity=await safe.loginChild(input)}catch(e){if(e.code==='SAFE_REELS_NOT_CONFIGURED'){e.httpStatus=503;throw e}if(e.code==='AUTH_REJECTED'||e.code==='INVALID_CREDENTIAL_INPUT'){e.httpStatus=401;throw e}throw e}
    linked=await sessions.ensureExternalUser(db,identity);user=linked.user;accountId=linked.account_id;extra.external=true;
  }
  input.pin='';
  var created=await sessions.createIdentitySession(db,{user_id:user.id,account_id:accountId,source:source,external_session_ref:identity&&identity.external_session_ref});
  return{token:created.token,expires_at:created.session.expires_at,profile:profileOf(user,accountId,extra)};
}
async function handler(req,res){var origin=allowedOrigin(req);if(origin===null){send(res,403,{error:'origin_not_allowed'});return}if(req.method==='OPTIONS'){res.statusCode=204;if(origin)res.setHeader('Access-Control-Allow-Origin',origin);res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','GET, POST, OPTIONS');res.setHeader('Vary','Origin');res.end();return}var p=url.parse(req.url,true),path=p.pathname||'',db=await core.db.createDb();try{
  if(req.method==='GET'&&path==='/api/app360/health'){var m=await db('knex_migrations').count({n:'id'}).first().catch(function(){return{n:0}});send(res,200,{ok:true,service:'app360-data-core',safe_reels_auth_configured:safe.configured(),seed_login_enabled:demoLoginEnabled(),applied_migrations:Number(m.n)||0},origin);return}
  if(req.method==='POST'&&(path==='/api/app360/auth/login'||path==='/api/app360/auth/child-login')){
    var input=await body(req);try{var logged=await loginRequest(db,input);send(res,200,logged,origin)}catch(e){input.pin='';if(e.httpStatus===503){send(res,503,{error:'SAFE_REELS_NOT_CONFIGURED',message:'خدمة الريلز الآمن غير مهيأة، ويمكن استخدام حسابات الـSeeds في بيئة التطوير.'},origin);return}if(e.httpStatus===401){send(res,401,{error:'AUTH_REJECTED',message:'بيانات الدخول غير صحيحة.'},origin);return}throw e}return
  }
  if(req.method==='POST'&&path==='/api/app360/auth/logout'){await sessions.revokeIdentitySession(db,bearer(req));send(res,200,{ok:true},origin);return}
  var me=await auth(db,req);if(!me){send(res,401,{error:'authentication_required',message:'سجل دخول المستخدم أولًا.'},origin);return}
  if(req.method==='GET'&&path==='/api/app360/me/members'){var members=await sessions.listManagedMembers(db,me.user.id,me.account_id);send(res,200,{profile:profileOf(me.user,me.account_id),members:members,can_manage_audience:members.length>0},origin);return}
  if(req.method==='POST'&&path==='/api/app360/usage/batch'){var usage=await body(req),ur=await sessions.importUsageBatch(db,me.user.id,usage);send(res,200,ur,origin);return}
  if(req.method==='GET'&&path==='/api/app360/me/dashboard'){var dash=await sessions.managedUsageDashboard(db,me.user.id,me.account_id);dash.profile=profileOf(me.user,me.account_id);send(res,200,dash,origin);return}
  if(req.method==='POST'&&path==='/api/app360/content/batch'){var content=await body(req),cr=await sessions.upsertUserContentBatch(db,me.user.id,content,{account_id:me.account_id,fileStore:fileStore});send(res,200,cr,origin);return}
  if(req.method==='GET'&&path==='/api/app360/content'){var rows=await sessions.listVisibleContent(db,me.user.id,p.query.app_id||null,{account_id:me.account_id,fileStore:fileStore,owned_only:String(p.query.owned||'')==='1'});send(res,200,{items:rows},origin);return}
  if(req.method==='POST'&&path==='/api/app360/content/audience'){var au=await body(req);try{var ar=await sessions.setContentAudience(db,me.user.id,me.account_id,String(au.content_item_id||''),au.audience_user_ids||[]);send(res,200,ar,origin)}catch(e){if(e.message==='content_not_found'){send(res,404,{error:e.message},origin);return}if(e.message==='content_not_owned'){send(res,403,{error:e.message,message:'لا يمكن تعديل جمهور محتوى لا تملكه.'},origin);return}throw e}return}
  send(res,404,{error:'not_found'},origin)
 }catch(e){console.error(e&&e.stack||e);send(res,500,{error:'server_error',message:'حدث خطأ في خدمة بيانات App360.'},origin)}finally{await db.destroy()}}
var server=http.createServer(function(req,res){handler(req,res).catch(function(e){console.error(e&&e.stack||e);if(!res.headersSent)send(res,500,{error:'server_error'})})});
if(require.main===module)server.listen(PORT,function(){console.log('App360 Data Core API listening on '+PORT);console.log('Safe Reels auth configured:',safe.configured()?'yes':'no');console.log('Seed/demo login:',demoLoginEnabled()?'enabled':'disabled')});
module.exports={handler:handler,server:server,demoLoginEnabled:demoLoginEnabled};
