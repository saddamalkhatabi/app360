(function(root,factory){var api=factory();if(typeof module==='object'&&module.exports)module.exports=api;if(root)root.A1CommunityEngine=api;}(typeof self!=='undefined'?self:this,function(){'use strict';
function tag(id){return'[EXP:'+String(id).padStart(3,'0')+']'}
function parse(body){body=String(body||'');var m=body.match(/^\s*\[EXP:(\d{3})\]\s*([\s\S]*)$/i);if(!m)return null;return{experience_id:m[1],text:(m[2]||'').trim()}}
function normalize(c){var p=parse(c&&c.body);if(!p)return null;return{experience_id:p.experience_id,text:p.text,user:c&&c.user&&c.user.login?c.user.login:'مستخدم',avatar:c&&c.user&&c.user.avatar_url?c.user.avatar_url:'',created_at:c&&c.created_at?c.created_at:'',url:c&&c.html_url?c.html_url:(c&&c.url?c.url:'')}}
function filter(comments,id){var out=[];(comments||[]).forEach(function(c){var n=normalize(c);if(n&&n.experience_id===String(id).padStart(3,'0')&&n.text)out.push(n)});return out}
function compose(id,text){return tag(id)+' '+String(text||'').trim()}
return{tag:tag,parse:parse,normalize:normalize,filter:filter,compose:compose};
}));