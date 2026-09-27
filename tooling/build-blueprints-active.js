'use strict';
const catalog=require('../data/catalog.json');
const retired=require('../data/retired-apps.json');
const retiredIds=new Set((retired.apps||[]).map(x=>x.id));
catalog.apps=(catalog.apps||[]).filter(x=>!retiredIds.has(x.id));
require('./build-blueprints.js');
