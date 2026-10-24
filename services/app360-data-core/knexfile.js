'use strict';
const config=require('./src/database-config').configuration();
module.exports={development:config,production:config,test:config};
