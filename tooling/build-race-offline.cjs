'use strict';
const path=require('path');
require('child_process').execFileSync(process.execPath,[path.join(__dirname,'build-race-knowledge.cjs')],{stdio:'inherit'});
require('./refresh-race-knowledge-offline.cjs');
