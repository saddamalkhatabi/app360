(function(root,factory){
  var api=factory();
  if(typeof module==='object'&&module.exports) module.exports=api;
  if(root) root.ImitatePracticeCore=api;
}(typeof self!=='undefined'?self:this,function(){
  'use strict';
  var SCHEMA=1;
  var KEY='app360:a1-imitate:v1:sessions';
  var CURRENT_KEY='app360:a1-imitate:v1:current';
  var ASSISTANCE={
    independent:{label:'محاولة ذاتية',rank:0},
    gesture:{label:'إشارة فقط',rank:1},
    model:{label:'احتاج نموذجًا',rank:2},
    direct:{label:'مساعدة مباشرة',rank:3}
  };
  function uid(){return 's-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,8)}
  function now(){return new Date().toISOString()}
  function createSession(taskId){return {schema_version:SCHEMA,session_id:uid(),task_id:taskId,started_at:now(),completed_at:null,status:'in_progress',attempts:[],artifact:{role_exchange_completed:false,child_led_turn_completed:false,replay_count:0,skipped:false},reflection:'',assistance_level:null}}
  function copy(o){return JSON.parse(JSON.stringify(o))}
  function recordAttempt(session,level){
    if(!ASSISTANCE[level]) throw new Error('Unknown assistance level');
    var s=copy(session); s.attempts.push({at:now(),assistance_level:level}); s.assistance_level=level; return s;
  }
  function replayModel(session){var s=copy(session);s.artifact.replay_count=(s.artifact.replay_count||0)+1;return s}
  function complete(session,opts){var s=copy(session);opts=opts||{};s.status='completed';s.completed_at=now();s.artifact.role_exchange_completed=!!opts.roleExchangeCompleted;s.artifact.child_led_turn_completed=!!opts.childLedTurnCompleted;s.reflection=(opts.reflection||'').slice(0,300);return s}
  function skip(session){var s=copy(session);s.status='skipped';s.completed_at=now();s.artifact.skipped=true;return s}
  function summary(session){
    var last=session.assistance_level;return {task_id:session.task_id,status:session.status,attempt_count:session.attempts.length,replay_count:session.artifact.replay_count||0,assistance_level:last,assistance_label:last&&ASSISTANCE[last]?ASSISTANCE[last].label:'لم يسجل',role_exchange_completed:!!session.artifact.role_exchange_completed,child_led_turn_completed:!!session.artifact.child_led_turn_completed};
  }
  function storageAdapter(storage){
    var memory={}; var persistent=true;
    try{var probe='__a1_probe__';storage.setItem(probe,'1');storage.removeItem(probe)}catch(e){persistent=false;storage=null}
    function getRaw(k){if(storage){try{return storage.getItem(k)}catch(e){persistent=false;storage=null}}return Object.prototype.hasOwnProperty.call(memory,k)?memory[k]:null}
    function setRaw(k,v){if(storage){try{storage.setItem(k,v);return true}catch(e){persistent=false;storage=null}}memory[k]=v;return false}
    function removeRaw(k){if(storage){try{storage.removeItem(k);return true}catch(e){persistent=false;storage=null}}delete memory[k];return false}
    function parse(raw,fallback){if(!raw)return fallback;try{return JSON.parse(raw)}catch(e){return fallback}}
    return {
      isPersistent:function(){return persistent&&!!storage},
      list:function(){var rows=parse(getRaw(KEY),[]);return Array.isArray(rows)?rows:[]},
      append:function(session){var rows=this.list();rows.unshift(session);rows=rows.slice(0,30);setRaw(KEY,JSON.stringify(rows));return rows},
      clear:function(){removeRaw(KEY);removeRaw(CURRENT_KEY)},
      saveCurrent:function(session){setRaw(CURRENT_KEY,JSON.stringify(session))},
      loadCurrent:function(){return parse(getRaw(CURRENT_KEY),null)},
      clearCurrent:function(){removeRaw(CURRENT_KEY)},
      exportPayload:function(current){return {app_id:'a1-imitate',schema_version:SCHEMA,exported_at:now(),persistent:this.isPersistent(),current:current||null,sessions:this.list()}}
    };
  }
  return {SCHEMA:SCHEMA,KEY:KEY,CURRENT_KEY:CURRENT_KEY,ASSISTANCE:ASSISTANCE,createSession:createSession,recordAttempt:recordAttempt,replayModel:replayModel,complete:complete,skip:skip,summary:summary,storageAdapter:storageAdapter};
}));
