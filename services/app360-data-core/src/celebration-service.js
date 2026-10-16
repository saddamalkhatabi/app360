'use strict';
var fs=require('fs'),path=require('path'),lookup=require('../../../resources/celebration-audio/name-lookup-v1'),google=require('./google-name-tts');
var resource=path.resolve(__dirname,'../../../resources/celebration-audio');
function createCelebrationService(options){options=options||{};var env=options.env||process.env,tts=options.tts||google.createGoogleNameTTS({env:env}),readNames=options.readNames||function(){return JSON.parse(fs.readFileSync(path.join(resource,'names.json'),'utf8')).records};
 async function entitled(db,me){if(env.APP360_ENABLE_PERSONALIZED_PRAISE!=='1'||!me||!me.user||!me.session)return false;var now=new Date().toISOString();var q=db('feature_entitlements').where({feature:'personalized-praise',status:'active'}).where('starts_at','<=',now).where('expires_at','>',now).where(function(){this.where('user_id',me.user.id);if(me.account_id)this.orWhere('account_id',me.account_id)});return !!await q.first()}
 async function reserve(db,user){var day=new Date().toISOString().slice(0,10),max=Number(env.APP360_GOOGLE_NAME_DAILY_LIMIT||10);if(!Number.isInteger(max)||max<1||max>100)return false;return db.transaction(async function(trx){await trx('celebration_tts_daily').insert({user_id:user,day:day,requests:0}).onConflict(['user_id','day']).ignore();return !!await trx('celebration_tts_daily').where({user_id:user,day:day}).where('requests','<',max).increment('requests',1)})}
 async function prepare(db,me,input){input=input||{};function generic(reason){return {personalized:false,reason:reason,clips:[]}}if(!await entitled(db,me))return generic('not_entitled');if(input.language&&input.language!=='ar')return generic('arabic_names_only');var name=lookup.validate(input.name);if(!name)return generic('invalid_name');var match=lookup.resolve(name,readNames()),clip,gender=input.gender==='girl'||input.gender==='female'||input.gender==='f'?'f':'m',kind=input.kind==='creative'?'creative':'well-done';
 if(match.status==='ambiguous')return generic('ambiguous_name');
 if(match.record){var a=match.record.audio;if(!a||a.auditory_review!=='approved'||!/^audio\/names\/name-[0-9]+\.mp3$/.test(a.path||''))return generic('name_review_pending');clip={kind:'name',path:a.path,duration_ms:a.duration_ms};}
 else{if(input.allowGoogle!==true||!tts.configured())return generic('unknown_name');if(!await reserve(db,me.user.id))return generic('daily_limit');try{clip=await tts.synthesize(name)}catch(_){return generic('voice_unavailable')}}
 return {personalized:true,expires_at:new Date(Date.now()+15000).toISOString(),clips:[{kind:'prefix',path:'audio/ar/'+kind+'-name-'+gender+'.mp3'},clip]};
 }
 return {prepare:prepare,entitled:entitled};
}
module.exports={createCelebrationService:createCelebrationService};
