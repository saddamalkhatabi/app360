'use strict';
var fs=require('fs');
var path=require('path');
var contractPath=path.resolve(__dirname,'../../../data/ai-content-contracts.json');
function loadContracts(){return JSON.parse(fs.readFileSync(contractPath,'utf8'))}
function findApp(contracts,appId){var apps=contracts.apps||[],i;for(i=0;i<apps.length;i++)if(apps[i].app_id===appId)return apps[i];return null}
function findType(app,typeId){var types=app&&app.content_types||[],i;for(i=0;i<types.length;i++)if(types[i].id===typeId)return types[i];return null}
function validateBundle(bundle){
  var errors=[],contracts=loadContracts(),app,type,items,i,j,item,req;
  if(!bundle||typeof bundle!=='object')return {ok:false,errors:['bundle must be an object']};
  if(!bundle.app_id)errors.push('app_id is required');
  app=findApp(contracts,bundle.app_id);if(bundle.app_id&&!app)errors.push('unsupported app_id: '+bundle.app_id);
  if(!bundle.content_type)errors.push('content_type is required');
  type=findType(app,bundle.content_type);if(app&&bundle.content_type&&!type)errors.push('unsupported content_type for '+bundle.app_id+': '+bundle.content_type);
  items=bundle.items;if(!Array.isArray(items)||!items.length)errors.push('items must be a non-empty array');
  if(type&&Array.isArray(items)){req=type.required_item_fields||[];for(i=0;i<items.length;i++){item=items[i]||{};for(j=0;j<req.length;j++)if(item[req[j]]===undefined||item[req[j]]===null||item[req[j]]==='')errors.push('items['+i+'] missing '+req[j])}}
  return {ok:errors.length===0,errors:errors,app:app,type:type};
}
module.exports={loadContracts:loadContracts,findApp:findApp,findType:findType,validateBundle:validateBundle};
