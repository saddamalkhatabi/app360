(function(w,d){
'use strict';
var STATE_KEY='app360:a1-calm:schema-1.0:state';
var EVENT_KEY='app360:interop:v1:events';
function text(v){return String(v==null?'':v)}
function now(){return new Date().toISOString()}
function q(){var o={},s=(w.location.search||'').replace(/^\?/,'').split('&'),i,p;for(i=0;i<s.length;i++){if(!s[i])continue;p=s[i].split('=');try{o[decodeURIComponent(p[0])]=decodeURIComponent(p.slice(1).join('=')||'')}catch(e){}}return o}
function read(){try{return JSON.parse(w.localStorage.getItem(STATE_KEY)||'null')}catch(e){return null}}
function write(s){try{w.localStorage.setItem(STATE_KEY,JSON.stringify(s));return true}catch(e){return false}}
function events(){try{var a=JSON.parse(w.localStorage.getItem(EVENT_KEY)||'[]');return a&&a.push?a:[]}catch(e){return[]}}
function verified(id){var a=events(),i;for(i=a.length-1;i>=0;i--)if(a[i]&&a[i].launch_id===id&&a[i].type==='completed')return true;return false}
function ensureRun(s,ref){s.interop_runs=s.interop_runs||{};if(!s.interop_runs[ref])s.interop_runs[ref]={run_id:'run-'+(+new Date()).toString(36),plan_ref:ref,created_at:now(),updated_at:now(),steps:{now:{status:'pending'},then:{status:'pending'}},history:[]};if(!s.interop_runs[ref].steps)s.interop_runs[ref].steps={now:{status:'pending'},then:{status:'pending'}};if(!s.interop_runs[ref].history)s.interop_runs[ref].history=[];return s.interop_runs[ref]}
function remember(msg){try{w.sessionStorage.setItem('app360:simple-v4:view','transition');if(msg)w.sessionStorage.setItem('app360:simple-v4:message',msg)}catch(e){}}
function clean(){try{if(w.history&&w.history.replaceState){w.history.replaceState(null,d.title,w.location.href.split('?')[0].split('#')[0]);return}}catch(e){} }
function process(){var x=q(),s,pending,ref,slot,run,id;if(x.app360_result!=='completed'||!x.app360_launch_id)return false;s=read();if(!s)return false;id=x.app360_launch_id;pending=s.interop_pending&&s.interop_pending[id];ref=x.interop_plan||(pending&&pending.plan_ref)||'';slot=x.interop_slot||(pending&&pending.slot)||'';if(!ref||!slot)return false;run=ensureRun(s,ref);run.steps[slot]={status:'completed',at:now(),launch_id:id,target_app:x.app360_target||(pending&&pending.target_app)||'',event_verified:verified(id)};run.updated_at=now();run.history.unshift({at:now(),slot:slot,status:'completed',launch_id:id,target_app:x.app360_target||(pending&&pending.target_app)||'',event_verified:verified(id)});if(s.interop_pending)delete s.interop_pending[id];write(s);remember('✓ عاد النشاط إلى الخطة وتم تسجيل تنفيذه.');clean();return true}
process();
w.App360CalmInteropV4={state_key:STATE_KEY,event_key:EVENT_KEY,query:q};
})(window,document);
