(function(w,d){
'use strict';
if(w.APP360_AI_ACCOUNT_BRIDGE&&w.APP360_AI_ACCOUNT_BRIDGE.__ready)return;
var VERSION='1.0',bound=false,providerId='app360-ai-account-v1';
function parse(s){try{return JSON.parse(s)}catch(e){return null}}
function clone(x){try{return JSON.parse(JSON.stringify(x))}catch(e){return x}}
function appId(){return w.APP360_AI_CONTENT&&w.APP360_AI_CONTENT.app_id||''}
function key(){return'app360:ai-content:v1:'+appId()}
function readPacks(){try{var a=parse(w.localStorage.getItem(key())||'[]');return a&&a.length?a:[]}catch(e){return[]}}
function writePacks(a){try{w.localStorage.setItem(key(),JSON.stringify((a||[]).slice(0,40)));return true}catch(e){return false}}
function itemFromPack(p){return{app_id:appId(),content_type:'ai_pack',client_key:'ai-pack:'+(p.local_pack_id||p.id||Date.now()),title:p.title||p.content_type||'حزمة AI شخصية',content:clone(p),tags:['ai-assisted','app360-ai-pack'],source_kind:'ai-assisted'}}
function collect(cb){var a=readPacks(),out=[],i;for(i=0;i<a.length;i++)out.push(itemFromPack(a[i]));cb(out)}
function markServer(packId,server){var a=readPacks(),i,p;for(i=0;i<a.length;i++){p=a[i];if((p.local_pack_id||p.id)===packId){p._app360_server_content_id=server&&server.id||p._app360_server_content_id;p._app360_audience_user_ids=server&&server.audience_user_ids||p._app360_audience_user_ids||[];p._app360_account_saved_at=new Date().toISOString();break}}writePacks(a);if(w.APP360_AI_CONTENT&&w.APP360_AI_CONTENT.reload)w.APP360_AI_CONTENT.reload()}
function saveImported(pack){if(!pack||!w.APP360_SESSION||!w.APP360_SESSION.isAuthenticated()||!w.APP360_SESSION.saveUserContent)return;var item=itemFromPack(pack),reason='حدد من الأبناء أو المتدربين الذين يظهر لهم محتوى AI الجديد «'+(pack.title||pack.content_type||'الحزمة')+'».';w.APP360_SESSION.saveUserContent(item,function(ok,data){if(ok)markServer(pack.local_pack_id||pack.id,data)}, {reason:reason})}
function mergeCloud(rows){var local=readPacks(),byKey={},i,p,item,content,keyId;for(i=0;i<local.length;i++){p=local[i];byKey['ai-pack:'+(p.local_pack_id||p.id||'')]=i}for(i=0;i<(rows||[]).length;i++){item=rows[i];if(item.content_type!=='ai_pack'||!item.content)continue;content=clone(item.content);keyId=item.client_key||('ai-pack:'+(content.local_pack_id||content.id||''));content._app360_server_content_id=item.id;content._app360_audience_user_ids=item.audience_user_ids||[];content._app360_assigned_to_me=!!item.assigned_to_me;if(byKey[keyId]!==undefined)local[byKey[keyId]]=content;else{local.unshift(content);byKey[keyId]=0}}if(local.length>40)local=local.slice(0,40);writePacks(local);if(w.APP360_AI_CONTENT&&w.APP360_AI_CONTENT.reload)w.APP360_AI_CONTENT.reload()}
function pull(){if(!w.APP360_SESSION||!w.APP360_SESSION.isAuthenticated()||!w.APP360_SESSION.listContent||!appId())return;w.APP360_SESSION.listContent(appId(),function(ok,rows){if(ok)mergeCloud(rows||[])})}
function bind(){if(bound||!w.APP360_AI_CONTENT||!w.APP360_SESSION||!w.APP360_SESSION.saveUserContent)return false;bound=true;w.APP360_SESSION.registerContentProvider({id:providerId+':'+appId(),collect:collect});if(d.addEventListener)d.addEventListener('app360:ai-content-imported',function(e){saveImported(e&&e.detail)},false);pull();return true}
function start(){var tries=0,t=setInterval(function(){tries++;if(bind()||tries>160)clearInterval(t)},100);bind();if(d.addEventListener)d.addEventListener('app360:account-access-ready',function(){bind();pull()},false)}
w.APP360_AI_ACCOUNT_BRIDGE={__ready:true,version:VERSION,bind:bind,pull:pull,collect:collect};
if(d.readyState==='loading'){if(d.addEventListener)d.addEventListener('DOMContentLoaded',start,false);else if(w.attachEvent)w.attachEvent('onload',start)}else start();
})(window,document);
