'use strict';
const dashboard=require('./school-dashboard-service').createSchoolDashboardService();
const reports=require('./school-report-mail').createSchoolReportMail();
async function handle(req,res,db,me,parsed,readBody,send,origin){
 const path=parsed.pathname||'';if(!path.startsWith('/api/app360/school/'))return false;
 try {
  if(['/api/app360/school/reports','/api/app360/school/policy','/api/app360/school/app','/api/app360/school/media','/api/app360/school/media/remove'].includes(path))await dashboard.syncRoster(db,me);
  if(dashboard.media.scope(me).global&&(req.method==='POST'||path==='/api/app360/school/dashboard'))await require('./reels-bridge').check(db,me);
  let data;
  if(req.method==='GET'&&path==='/api/app360/school/dashboard'){data=await dashboard.dashboard(db,me);data.report_preferences=await db('school_report_preferences').where({owner_user_id:me.user.id});data.report_email_configured=reports.configured();}
  else if(req.method==='GET'&&path==='/api/app360/school/children')data=await dashboard.manageChildren(db,me,'children-info',parsed.query);
  else if(req.method==='GET'&&path==='/api/app360/school/reports')data=await dashboard.usageReport(db,me,parsed.query);
  else if(req.method==='GET'&&path==='/api/app360/school/catalog')data=await dashboard.catalog(db,me);
  else if(req.method==='POST'){
   const input=await readBody(req);
   if(path==='/api/app360/school/children')data=await dashboard.manageChildren(db,me,'children-create',input);
   else if(path==='/api/app360/school/policy')data=await dashboard.savePolicy(db,me,input);
   else if(path==='/api/app360/school/report-preferences'){await dashboard.syncRoster(db,me);data=await reports.save(db,me,input);}
   else if(path==='/api/app360/school/platform')data=await dashboard.savePlatform(db,me,input);
   else if(path==='/api/app360/school/app')data=await dashboard.saveApp(db,me,input);
   else if(path==='/api/app360/school/migrate')data=await dashboard.migrate(db,me);
   else if(path==='/api/app360/school/media')data=await dashboard.media.save(db,me,input);
   else if(path==='/api/app360/school/media/remove')data=await dashboard.media.remove(db,me,String(input.id||''));
   else if(path==='/api/app360/school/media/preview'){await dashboard.syncRoster(db,me);data=await dashboard.media.preview(db,me,String(input.id||''));}
   else if(path==='/api/app360/school/media/prepare')data=await dashboard.media.prepare(db,me,input.kind,input.cached_version);
   else if(path==='/api/app360/school/media/event')data=await dashboard.media.event(db,me,input);
   else if(path==='/api/app360/school/task')data=await dashboard.media.task(db,me,input);
  }
  if(!data){send(res,404,{error:'not_found'},origin);return true;}
  send(res,200,data,origin);
 }catch(error){send(res,error.httpStatus||500,{ok:false,error:error.httpStatus?'school_request_rejected':'school_request_failed',message:error.httpStatus?error.message:'تعذر تنفيذ طلب المدرسة؛ حاول مجدداً.'},origin);}
 return true;
}
module.exports={handle,dashboard};
