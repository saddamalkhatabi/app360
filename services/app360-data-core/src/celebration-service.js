'use strict';
var fs=require('fs'),path=require('path'),lookup=require('../../../resources/celebration-audio/name-lookup-v1');
var resource=path.resolve(__dirname,'../../../resources/celebration-audio');
function createCelebrationService(options){options=options||{};var env=options.env||process.env,readNames=options.readNames||function(){return JSON.parse(fs.readFileSync(path.join(resource,'names.json'),'utf8')).records};
 async function entitled(db,me){if(!me||!me.user||!me.session)return false;var prefs={};try{prefs=JSON.parse(me.user.preferences_json||'{}')}catch(_){}var access=prefs.official_entitlements;if(access&&(!access.named_encouragement||access.active===false||access.ends_at&&new Date(access.ends_at).getTime()<=Date.now()))return false;if(me.session.source==='safe-reels-360')return !!(access&&access.active===true&&access.named_encouragement===true&&/^(learner|child)$/.test(me.user.role||''));if(env.APP360_ENABLE_PERSONALIZED_PRAISE!=='1')return false;var now=new Date().toISOString();var q=db('feature_entitlements').where({feature:'personalized-praise',status:'active'}).where('starts_at','<=',now).where('expires_at','>',now).where(function(){this.where('user_id',me.user.id);if(me.account_id)this.orWhere('account_id',me.account_id)});return !!await q.first()}
 async function prepare(db,me,input){input=input||{};function generic(reason){return {personalized:false,reason:reason,clips:[]}}if(!await entitled(db,me))return generic('not_entitled');if(input.language&&input.language!=='ar')return generic('arabic_names_only');var name=lookup.validate(input.name);if(!name)return generic('invalid_name');var match=lookup.resolve(name,readNames()),clip,gender=input.gender==='girl'||input.gender==='female'||input.gender==='f'?'f':'m',kind=input.kind==='creative'?'creative':'well-done';
 if(match.status==='ambiguous')return generic('ambiguous_name');
 if(!match.record)return generic('unknown_name');
 var a=match.record.praise_audio&&match.record.praise_audio[gender],expected='audio/praise/'+match.record.id+'-'+gender+'.mp3';
 if(!a||a.kind!=='full-praise'||a.gender!==gender||a.path!==expected||!/^audio\/praise\/name-[1-9][0-9]*-[mf]\.mp3$/.test(a.path)||a.auditory_review!=='approved'||!a.review||a.review.sha256!==a.sha256)return generic('name_review_pending');
 return {personalized:true,expires_at:new Date(Date.now()+15000).toISOString(),clips:[{kind:'full-praise',path:a.path,duration_ms:a.duration_ms}]};
 }
 return {prepare:prepare,entitled:entitled};
}
module.exports={createCelebrationService:createCelebrationService};
