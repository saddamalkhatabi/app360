(function(w,d){
'use strict';
if(w.APP360_DAILY_USAGE&&w.APP360_DAILY_USAGE.__ready)return;
var VERSION='1.0',KEY='app360:usage-daily:v1',INTERVAL=15000,MAX_SLICE=30000,startAt=0,currentScope='',openedScope='';
var MAP={
 'say-and-name':{id:'a1-first-words',title:'كلماتي مع أشيائي'},
 'imitate-one-step':{id:'a1-imitate',title:'دوري ودورك'},
 'screen-to-move':{id:'a1-screen-move',title:'ألعاب إبداعية'},
 'drawing-writing-foundations':{id:'a1-drawing-writing',title:'لوحة الطفل للرسم والكتابة المبكرة'},
 'calm-with-me':{id:'a1-calm',title:'مشاعري معك: أحتاج مساعدة'},
 'plan-runner-360':{id:'a1-plan-runner',title:'مخطط التشغيل 360'}
};
function parse(s){try{return JSON.parse(s)}catch(e){return null}}
function get(k){try{return w.localStorage.getItem(k)||''}catch(e){return''}}
function set(k,v){try{w.localStorage.setItem(k,v);return true}catch(e){return false}}
function today(){return new Date().toISOString().slice(0,10)}
function now(){return new Date().toISOString()}
function app(){var p=(w.location&&w.location.pathname)||'',m=/\/apps\/([^/]+)\/([^/]+)\//.exec(p),age=m&&m[1]||'',slug=m&&m[2]||'',x=MAP[slug]||{id:'app-'+slug,title:(d.title||slug||'App360').split('|')[0]};return{age_group:age,slug:slug,id:x.id,title:x.title}}
function profile(){try{if(w.APP360_SESSION&&w.APP360_SESSION.getProfile)return w.APP360_SESSION.getProfile()}catch(e){}try{return parse(w.sessionStorage.getItem('app360:auth-profile:v1')||'')}catch(e){return null}}
function scopeKey(){var p=profile();return p&&p.user_id?'user:'+p.user_id:'guest'}
function load(){var x=parse(get(KEY));if(!x||typeof x!=='object')x={};if(!x.scopes)x.scopes={};x.schema_version='1.0';return x}
function save(x){set(KEY,JSON.stringify(x))}
function active(){return !d.hidden&&(!d.visibilityState||d.visibilityState==='visible')}
function ensure(scope,day,a){var st=load(),s=st.scopes[scope],dr,r;if(!s){s={days:{}};st.scopes[scope]=s}if(!s.days)s.days={};dr=s.days[day];if(!dr){dr={apps:{}};s.days[day]=dr}if(!dr.apps)dr.apps={};r=dr.apps[a.id];if(!r){r={app_id:a.id,title:a.title,age_group:a.age_group,active_seconds:0,opens:0,last_seen:now()};dr.apps[a.id]=r}return{state:st,row:r}}
function markOpen(scope){var a=app(),e;if(!a.slug||openedScope===scope)return;e=ensure(scope,today(),a);e.row.opens=(e.row.opens||0)+1;e.row.last_seen=now();save(e.state);openedScope=scope}
function switchScope(){var s=scopeKey();if(currentScope&&s!==currentScope)flush();currentScope=s;markOpen(s);return s}
function begin(){if(active()&&!startAt)startAt=Date.now()}
function flush(){var t=Date.now(),ms,a,e,s;if(!startAt){switchScope();begin();return}ms=t-startAt;if(ms<0)ms=0;if(ms>MAX_SLICE)ms=MAX_SLICE;startAt=active()?t:0;if(ms<1000)return;s=switchScope();a=app();if(!a.slug)return;e=ensure(s,today(),a);e.row.active_seconds=(e.row.active_seconds||0)+Math.round(ms/1000);e.row.last_seen=now();save(e.state)}
function snapshot(){flush();return load()}
function init(){if(((w.location&&w.location.pathname)||'').indexOf('/apps/')<0)return;currentScope=scopeKey();markOpen(currentScope);begin();setInterval(function(){if(active())flush();else startAt=0},INTERVAL);if(d.addEventListener)d.addEventListener('visibilitychange',function(){if(d.hidden){flush();startAt=0}else begin()},false);if(w.addEventListener){w.addEventListener('pagehide',flush,false);w.addEventListener('beforeunload',flush,false);w.addEventListener('focus',function(){switchScope();begin()},false);w.addEventListener('blur',function(){flush();startAt=0},false)}}
w.APP360_DAILY_USAGE={__ready:true,version:VERSION,key:KEY,snapshot:snapshot,scopeKey:scopeKey};
if(d.readyState==='loading'){if(d.addEventListener)d.addEventListener('DOMContentLoaded',init,false);else if(w.attachEvent)w.attachEvent('onload',init)}else init();
})(window,document);
