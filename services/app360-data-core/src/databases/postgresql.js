'use strict';
function configuration(env){const {integer,invalid}=require('../database-config');for(const key of ['HOST','DATABASE','USER','PASSWORD'])if(!env['APP360_PG_'+key])throw invalid();
 const mode=env.APP360_PG_SSL_MODE||'verify-full';if(!['verify-full','require','disable'].includes(mode))throw invalid();
 return {client:'pg',connection:{host:env.APP360_PG_HOST,port:integer(env.APP360_PG_PORT,5432,1,65535),database:env.APP360_PG_DATABASE,user:env.APP360_PG_USER,password:env.APP360_PG_PASSWORD,ssl:mode==='disable'?false:{rejectUnauthorized:true,...(env.APP360_PG_SSL_CA?{ca:env.APP360_PG_SSL_CA.replace(/\\n/g,'\n')}:{})},application_name:'app360-school',connectionTimeoutMillis:10000,query_timeout:30000},pool:{min:0,max:integer(env.APP360_PG_POOL_MAX,4,1,20),idleTimeoutMillis:30000,propagateCreateError:true}};
}
async function initialize(db){await db.raw('SELECT 1');}
module.exports={configuration,initialize};
