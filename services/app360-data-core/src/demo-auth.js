'use strict';
var crypto=require('crypto');
function safeEqualHex(a,b){try{var x=Buffer.from(String(a||''),'hex'),y=Buffer.from(String(b||''),'hex');return x.length>0&&x.length===y.length&&crypto.timingSafeEqual(x,y)}catch(e){return false}}
function scryptHash(pin,salt){return crypto.scryptSync(String(pin||''),String(salt||''),32,{N:16384,r:8,p:1}).toString('hex')}
async function hasCredential(db,query){query=String(query||'').trim().toLowerCase();if(!query)return false;var row=await db('local_credentials').whereRaw('lower(username)=?',[query]).andWhere({status:'active'}).first();return !!row}
async function authenticate(db,query,pin){query=String(query||'').trim().toLowerCase();if(!query||!pin)return null;var cred=await db('local_credentials').whereRaw('lower(username)=?',[query]).andWhere({status:'active'}).first();if(!cred)return null;var calculated=scryptHash(pin,cred.pin_salt);if(!safeEqualHex(calculated,cred.pin_hash))return null;var user=await db('users').where({id:cred.user_id,status:'active'}).first();if(!user)return null;var membership=await db('account_members').where({user_id:user.id}).first();return{user:user,account_id:membership?membership.account_id:null,source:'seed-local',username:cred.username,is_demo:!!cred.is_demo}}
module.exports={authenticate:authenticate,hasCredential:hasCredential,scryptHash:scryptHash};
