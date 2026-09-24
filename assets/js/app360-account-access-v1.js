(function(w,d){
'use strict';
if(w.APP360_ACCOUNT_ACCESS&&w.APP360_ACCOUNT_ACCESS.__ready)return;
var VERSION='1.0',tries=0;
function parse(s){try{return JSON.parse(s)}catch(e){return null}}
function clone(x){try{return JSON.parse(JSON.stringify(x))}catch(e){return x}}
function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]})}
function token(){try{return parse(w.sessionStorage.getItem('app360:auth-token:v1')||'')||''}catch(e){return''}}
function apiBase(){return w.APP360_SESSION&&w.APP360_SESSION.apiBase?w.APP360_SESSION.apiBase():String(w.APP360_API_BASE||'/api/app360').replace(/\/$/,'')}
function request(method,path,body,cb){var x,t=token();if(!t){cb&&cb(401,{error:'authentication_required'});return}try{x=new XMLHttpRequest();x.open(method,apiBase()+path,true);x.setRequestHeader('Content-Type','application/json');x.setRequestHeader('Authorization','Bearer '+t);x.onreadystatechange=function(){if(x.readyState!==4)return;cb&&cb(x.status,parse(x.responseText||'')||{})};x.onerror=function(){cb&&cb(0,{error:'network'})};x.send(body==null?null:JSON.stringify(body))}catch(e){cb&&cb(0,{error:'network'})}}
function profile(){return w.APP360_SESSION&&w.APP360_SESSION.getProfile?w.APP360_SESSION.getProfile():null}
function manager(){var p=profile(),r=p&&p.role||'';return r==='parent'||r==='trainer'||r==='institution_admin'}
function emit(name,detail){try{var e;if(typeof w.CustomEvent==='function')e=new CustomEvent(name,{detail:detail});else{e=d.createEvent('CustomEvent');e.initCustomEvent(name,true,true,detail)}d.dispatchEvent(e)}catch(x){}}
function getMembers(cb){if(!manager()){cb&&cb(true,[]);return}request('GET','/me/members',null,function(status,data){cb&&cb(status>=200&&status<300,data.members||[])})}
function inject(){if(d.getElementById('a360AccountAccessStyle'))return;var s=d.createElement('style');s.id='a360AccountAccessStyle';s.type='text/css';s.innerHTML='#a360AudienceSheet{position:fixed;left:0;right:0;top:0;bottom:0;z-index:10020;background:rgba(0,0,0,.45);overflow:auto;direction:rtl;font:15px/1.5 Tahoma,Arial,sans-serif}#a360AudienceSheet[hidden]{display:none!important}.a360-audience-card{max-width:520px;margin:40px auto;background:#fff;color:#17343a;border:2px solid #17343a;border-radius:18px;padding:16px}.a360-audience-list label{display:block;border-bottom:1px solid #dce7e5;padding:10px}.a360-audience-list input{width:22px;height:22px;vertical-align:middle}.a360-audience-actions{display:flex;flex-wrap:wrap;gap:7px;margin-top:12px}.a360-audience-actions button{min-height:46px;padding:8px 12px;border:1px solid #4b8f89;border-radius:10px;background:#fff;color:#155f5b;font-weight:bold}.a360-content-row{border:1px solid #dce7e5;border-radius:10px;padding:9px;margin:8px 0}.app360-legacy #a360AudienceSheet{position:absolute;background:#eef5f4}.app360-legacy .a360-audience-card{margin:6px;border-radius:10px;max-width:none}@media(max-width:580px){.a360-audience-card{margin:8px}}';(d.head||d.getElementsByTagName('head')[0]||d.body).appendChild(s)}
function sheet(){inject();var n=d.getElementById('a360AudienceSheet');if(!n){n=d.createElement('div');n.id='a360AudienceSheet';n.hidden=true;d.body.appendChild(n)}return n}
function closeSheet(){var n=d.getElementById('a360AudienceSheet');if(n)n.hidden=true}
function chooseAudience(reason,current,cb){current=current||[];if(!manager()){cb&&cb([]);return}getMembers(function(ok,members){if(!ok){cb&&cb(null);return}var n=sheet(),h='<section class="a360-audience-card"><h2>👥 يظهر لمن؟</h2><p>'+esc(reason||'اختر الأبناء أو المتدربين الذين يظهر لهم هذا المحتوى.')+'</p><div class="a360-audience-list">',i,m,checked;for(i=0;i<members.length;i++){m=members[i];checked=current.indexOf(m.user_id)>=0?' checked':'';h+='<label><input type="checkbox" data-a360-audience-id="'+esc(m.user_id)+'"'+checked+'> <b>'+esc(m.display_name)+'</b> <small>'+esc(m.relationship||m.age_band||'')+'</small></label>'}h+='</div><div class="a360-audience-actions"><button type="button" data-a360-all>الجميع</button><button type="button" data-a360-none>لي فقط</button><button type="button" data-a360-save>حفظ الاختيار</button><button type="button" data-a360-cancel>إلغاء</button></div></section>';n.innerHTML=h;n.hidden=false;function boxes(){return n.querySelectorAll?n.querySelectorAll('[data-a360-audience-id]'):[]}function setAll(v){var b=boxes(),j;for(j=0;j<b.length;j++)b[j].checked=v}n.querySelector('[data-a360-all]').onclick=function(){setAll(true)};n.querySelector('[data-a360-none]').onclick=function(){setAll(false)};n.querySelector('[data-a360-cancel]').onclick=function(){closeSheet();cb&&cb(null)};n.onclick=function(e){if((e.target||e.srcElement)===n){closeSheet();cb&&cb(null)}};n.querySelector('[data-a360-save]').onclick=function(){var b=boxes(),ids=[],j;for(j=0;j<b.length;j++)if(b[j].checked)ids.push(b[j].getAttribute('data-a360-audience-id'));closeSheet();cb&&cb(ids)};if(w.APP360_LEGACY)try{w.scrollTo(0,0)}catch(e){}})}
function postContent(items,aud,cb){items=clone(items||[]);for(var i=0;i<items.length;i++)if(aud!==undefined&&aud!==null)items[i].audience_user_ids=clone(aud);request('POST','/content/batch',{device_id:w.APP360_SESSION.deviceId(),items:items},function(status,data){cb&&cb(status>=200&&status<300,data||{})})}
function saveContentBatch(items,opts,cb){opts=opts||{};if(!w.APP360_SESSION.requireAccount('الحفظ في الحساب',opts.reason||'هذه الميزة تحتاج تسجيل المستخدم.',function(){saveContentBatch(items,opts,cb)}))return false;if(Object.prototype.hasOwnProperty.call(opts,'audience_user_ids')){postContent(items,opts.audience_user_ids,cb);return true}if(!manager()){postContent(items,undefined,cb);return true}chooseAudience(opts.reason,[],function(ids){if(ids===null){cb&&cb(false,{cancelled:true});return}postContent(items,ids,cb)});return true}
function saveUserContent(item,cb,opts){return saveContentBatch([item],opts||{},function(ok,data){cb&&cb(ok,data&&data.items&&data.items[0]?data.items[0]:data)})}
function listContent(appId,cb,ownedOnly){var q='/content?app_id='+encodeURIComponent(appId||'');if(ownedOnly)q+='&owned=1';request('GET',q,null,function(status,data){cb&&cb(status>=200&&status<300,data.items||[])})}
function updateAudience(contentId,current,cb,reason){chooseAudience(reason,current||[],function(ids){if(ids===null){cb&&cb(false,{cancelled:true});return}request('POST','/content/audience',{content_item_id:contentId,audience_user_ids:ids},function(status,data){cb&&cb(status>=200&&status<300,data)})})}
function openContentManager(){
  if(!w.APP360_SESSION.isAuthenticated()){w.APP360_SESSION.open();return}
  var n=sheet();n.hidden=false;
  n.innerHTML='<section class="a360-audience-card"><h2>👥 إدارة ظهور المحتوى</h2><p>جارٍ تحميل المحتوى الذي أنشأته…</p><div class="a360-audience-actions"><button type="button" data-a360-cancel>إغلاق</button></div></section>';
  n.querySelector('[data-a360-cancel]').onclick=closeSheet;
  listContent('',function(ok,rows){
    if(!ok){n.querySelector('p').innerHTML='تعذر تحميل المحتوى.';return}
    var h='<section class="a360-audience-card"><h2>👥 إدارة ظهور المحتوى</h2><p>يمكنك تغيير الأبناء أو المتدربين الذين يظهر لهم كل محتوى تملكه.</p>',i,r,a;
    for(i=0;i<rows.length;i++){
      r=rows[i];if(!r.is_owner)continue;a=r.audience_user_ids||[];
      h+='<div class="a360-content-row"><b>'+esc(r.title||r.content_type)+'</b><br><small>'+esc(r.app_id)+' · يظهر لـ '+a.length+'</small><br><button type="button" data-a360-edit="'+esc(r.id)+'">تعديل من يراه</button></div>';
    }
    h+='<div class="a360-audience-actions"><button type="button" data-a360-cancel>إغلاق</button></div></section>';
    n.innerHTML=h;n.querySelector('[data-a360-cancel]').onclick=closeSheet;
    var bs=n.querySelectorAll?n.querySelectorAll('[data-a360-edit]'):[],j;
    for(j=0;j<bs.length;j++)bs[j].onclick=function(){
      var id=this.getAttribute('data-a360-edit'),row=null,k;
      for(k=0;k<rows.length;k++)if(rows[k].id===id){row=rows[k];break}
      if(row)updateAudience(id,row.audience_user_ids||[],function(ok2){if(ok2)openContentManager()},'حدد من يظهر له «'+(row.title||row.content_type)+'».');
    };
  },true);
}
function patchPanel(){var p=d.getElementById('app360SessionPanel');if(!p||p.hidden)return;var txt=p.innerHTML;if(txt.indexOf('دخول طفل/متدرب')>=0)p.innerHTML=txt.replace(/دخول طفل\/متدرب/g,'دخول مستخدم').replace(/دخول الريلز الآمن 360/g,'دخول App360 التجريبي / الريلز الآمن');if(manager()&&p.querySelector&&!p.querySelector('[data-a360-manage-content]')){var actions=p.querySelector('.a360-session-actions');if(actions){var b=d.createElement('button');b.type='button';b.setAttribute('data-a360-manage-content','1');b.innerHTML='👥 إدارة ظهور المحتوى';b.onclick=openContentManager;actions.appendChild(b)}}}
function patch(){var s=w.APP360_SESSION;if(!s||s.__account_access_v1)return false;s.__account_access_v1=true;var oldOpen=s.open;s.open=function(){oldOpen();setTimeout(patchPanel,30)};s.isManager=manager;s.getMembers=getMembers;s.chooseAudience=chooseAudience;s.saveContentBatch=saveContentBatch;s.saveUserContent=saveUserContent;s.listContent=listContent;s.updateAudience=updateAudience;s.openContentManager=openContentManager;emit('app360:account-access-ready',{version:VERSION});return true}
function start(){if(patch())return;var t=setInterval(function(){tries++;if(patch()||tries>150)clearInterval(t)},80)}
w.APP360_ACCOUNT_ACCESS={__ready:true,version:VERSION,patch:patch};
if(d.readyState==='loading'){if(d.addEventListener)d.addEventListener('DOMContentLoaded',start,false);else if(w.attachEvent)w.attachEvent('onload',start)}else start();
})(window,document);
