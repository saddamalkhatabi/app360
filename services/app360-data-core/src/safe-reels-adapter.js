'use strict';
function configured(){return !!process.env.APP360_SAFE_REELS_AUTH_URL}
function first(obj,keys){for(var i=0;i<keys.length;i++)if(obj&&obj[keys[i]]!=null&&obj[keys[i]]!=='')return obj[keys[i]];return null}
function normalize(body){
  var root=body&&body.data&&typeof body.data==='object'?body.data:body||{};
  var x=root.user||root.child||root.trainee||root.profile||root;
  var externalId=first(x,['external_user_id','user_id','child_id','trainee_id','id','uuid']);
  if(externalId==null)throw new Error('Safe Reels auth response missing user id');
  var rawRole=String(first(x,['role','profile_type','user_type','type'])||'learner').toLowerCase();
  var role=(rawRole==='trainer'||rawRole==='coach')?'trainer':'learner';
  return{
    external_user_id:String(externalId),
    display_name:String(first(x,['display_name','name','child_name','trainee_name','full_name'])||'متدرب'),
    role:role,
    external_role:rawRole,
    age_band:first(x,['age_band','age_group','age_range']),
    account_external_id:first(x,['account_id','family_id','parent_id','institution_id']),
    account_name:first(x,['account_name','family_name','institution_name']),
    external_session_ref:first(root,['session_id','session_ref','login_id']),
    metadata:{source_fields:Object.keys?Object.keys(x).filter(function(k){return k!=='pin'&&k!=='password'&&k!=='token'&&k!=='access_token'}):[]}
  }
}
async function loginChild(input){
  input=input||{};
  if(!configured()){var e=new Error('Safe Reels auth integration is not configured');e.code='SAFE_REELS_NOT_CONFIGURED';throw e}
  var query=String(input.query||'').trim(),pin=String(input.pin||'').trim();
  if(!query||!pin){var bad=new Error('query and PIN are required');bad.code='INVALID_CREDENTIAL_INPUT';throw bad}
  var headers={'Content-Type':'application/json','Accept':'application/json'};
  if(process.env.APP360_SAFE_REELS_AUTH_TOKEN)headers.Authorization='Bearer '+process.env.APP360_SAFE_REELS_AUTH_TOKEN;
  var ctrl=typeof AbortController!=='undefined'?new AbortController():null,timer=ctrl?setTimeout(function(){ctrl.abort()},10000):null,res;
  try{
    res=await fetch(process.env.APP360_SAFE_REELS_AUTH_URL,{method:'POST',headers:headers,body:JSON.stringify({query:query,pin:pin,audience:'app360'}),signal:ctrl?ctrl.signal:undefined});
  }finally{if(timer)clearTimeout(timer)}
  var body={};try{body=await res.json()}catch(e){}
  pin='';input.pin='';
  if(!res.ok){var authErr=new Error((body&&body.message)||'Safe Reels login rejected');authErr.code=res.status===401||res.status===403?'AUTH_REJECTED':'SAFE_REELS_UPSTREAM_ERROR';authErr.status=res.status;throw authErr}
  return normalize(body)
}
module.exports={configured:configured,loginChild:loginChild,normalize:normalize};
