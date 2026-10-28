'use strict';
// Identity and the shared subscription come from YEM1/Reels. Application content
// and age availability are owned by the independent School catalogue.
async function response(db,me,authority,dashboard){const own=await dashboard.catalog(db,me),used=await db('app_usage_daily').where({user_id:me.user.id,day:new Date().toISOString().slice(0,10)}).sum({seconds:'active_seconds'}).first();return {...authority,allowed_app_ids:own.apps.map(x=>x.id),daily_limit_minutes:Number(own.policy.daily_limit_minutes||0),used_seconds:Number(used?.seconds||0),catalogue_authority:'school'};}
module.exports={response};
