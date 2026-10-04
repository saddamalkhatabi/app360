(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.COMMAND_MODEL = factory();
}(this, function () {
  'use strict';
  var dirs = [[0,-1],[1,0],[0,1],[-1,0]], absolute = {n:0,e:1,s:2,w:3};
  function copy(o) { return JSON.parse(JSON.stringify(o)); }
  function integer(n,min,max) { return typeof n==='number' && isFinite(n) && Math.floor(n)===n && n>=min && n<=max; }
  function point(p,size) { return p && integer(p.x,0,size-1) && integer(p.y,0,size-1); }
  function equal(a,b) { return a.x===b.x && a.y===b.y; }
  function blocked(m,p) { return !point(p,m.size) || m.walls.some(function(w){return equal(w,p);}); }
  function map(m) {
    if (!m || !integer(m.size,3,5) || !point(m.start,m.size) || !point(m.goal,m.size) || equal(m.start,m.goal) || !integer(m.start.dir,0,3)) throw Error('map');
    if (!Array.isArray(m.walls) || m.walls.length>23 || !/^[a-z0-9-]{1,80}$/.test(m.id||'')) throw Error('map');
    var seen={}; m.walls.forEach(function(p){if(!point(p,m.size)||equal(p,m.start)||equal(p,m.goal)||seen[p.x+':'+p.y])throw Error('wall');seen[p.x+':'+p.y]=true;});
    if (!m.title || typeof m.title.ar!=='string' || typeof m.title.en!=='string' || m.title.ar.length>100 || m.title.en.length>100) throw Error('title');
    if (["book","ball","apple","bear","cat","car","banana","orange","strawberry","watermelon","carrot","tomato","cucumber","potato","pepper","cube","doll","puzzle","pencil","paper","bag","ruler","eraser","cup","plate","spoon","bottle","chair","box","rabbit","bird","fish","bus","bicycle","train","boat"].indexOf(m.goal_asset)<0) throw Error('mode');
    var out={id:m.id,size:m.size,start:{x:m.start.x,y:m.start.y,dir:m.start.dir},goal:{x:m.goal.x,y:m.goal.y},walls:m.walls.map(function(p){return{x:p.x,y:p.y};}),title:{ar:m.title.ar,en:m.title.en},mode:m.mode,level:m.level,goal_asset:m.goal_asset,challenge:m.challenge==='debug'?'debug':'route',starter:Array.isArray(m.starter)?program(m.starter,m.mode,m.level):[]};
    if(m.adventure){if(['garden','river','stars'].indexOf(m.adventure.world)<0||!Array.isArray(m.adventure.tiles)||m.adventure.tiles.length>8)throw Error('adventure');var features={};out.adventure={world:m.adventure.world,tiles:m.adventure.tiles.map(function(q){if(!point(q,m.size)||equal(q,m.start)||equal(q,m.goal)||blocked(m,q)||features[q.x+':'+q.y]||['box','puddle'].indexOf(q.kind)<0)throw Error('feature');features[q.x+':'+q.y]=true;if(q.kind==='box'&&['shield','hop','reset'].indexOf(q.outcome)<0)throw Error('box');var t={x:q.x,y:q.y,kind:q.kind};if(q.kind==='box')t.outcome=q.outcome;return t;})};}return out;
  }
  function program(list,mode,level,depth) {
    depth=depth||0; if(!Array.isArray(list)||list.length>32||depth>1)throw Error('program');
    var out=list.map(function(c){
      if(!c||typeof c.op!=='string')throw Error('command');
      if(c.op==='repeat') { if(level!==3||depth||!integer(c.count,2,4)||!Array.isArray(c.body)||!c.body.length||c.body.length>6)throw Error('repeat');return {op:'repeat',count:c.count,body:program(c.body,mode,level,1)}; }
      if(c.op==='if') { if(level!==3||mode!=='relative')throw Error('condition');return {op:'if'}; }
      if((mode==='absolute'&&Object.prototype.hasOwnProperty.call(absolute,c.op))||(['f','l','r'].indexOf(c.op)>=0))return {op:c.op};
      throw Error('command');
    });
    if(!depth && expand(out).length>80)throw Error('length');return out;
  }
  function expand(list) { var out=[];list.forEach(function(c,index){if(c.op==='repeat'){for(var n=0;n<c.count;n++)c.body.forEach(function(b,inner){out.push({op:b.op,index:index,inner:inner,iteration:n});});}else out.push({op:c.op,index:index,inner:null,iteration:0});});return out; }
  function effect(m,pos,world){
    if(!m.adventure)return null;var tile=m.adventure.tiles.filter(function(q){return equal(q,pos);})[0];if(!tile)return null;
    var key=tile.x+':'+tile.y,event={kind:'',tile:{x:tile.x,y:tile.y}};
    if(tile.kind==='puddle'){if(world.shield){world.shield=false;event.kind='puddle-safe';}else{pos.x=m.start.x;pos.y=m.start.y;pos.dir=m.start.dir;event.kind='puddle-reset';}return event;}
    if(world.opened.indexOf(key)>=0)return null;world.opened.push(key);world.opened.sort();event.kind='box-'+tile.outcome;
    if(tile.outcome==='reset'){pos.x=m.start.x;pos.y=m.start.y;pos.dir=m.start.dir;}
    else if(tile.outcome==='shield')world.shield=true;
    else{var d=dirs[pos.dir],next={x:pos.x+d[0],y:pos.y+d[1]};if(!blocked(m,next)&&!m.adventure.tiles.some(function(q){return equal(q,next);})){pos.x=next.x;pos.y=next.y;}else{world.shield=true;event.kind='box-shield';}}
    return event;
  }
  function transition(m,initial,command,initialWorld){
    var pos=copy(initial),world=copy(initialWorld),effective=command,event=null,hit=false;
    if(command==='if'){var d=dirs[pos.dir],ahead={x:pos.x+d[0],y:pos.y+d[1]};effective=blocked(m,ahead)?'r':'f';}
    if(effective==='l')pos.dir=(pos.dir+3)%4;
    else if(effective==='r')pos.dir=(pos.dir+1)%4;
    else{var dir=effective==='f'?pos.dir:absolute[effective],next={x:pos.x+dirs[dir][0],y:pos.y+dirs[dir][1]};if(blocked(m,next))hit=true;else{pos.x=next.x;pos.y=next.y;pos.dir=dir;event=effect(m,pos,world);}}
    return{position:pos,world:world,effective:effective,event:event,blocked:hit};
  }
  function execute(input,list) {
    var m=map(input),p=program(list,m.mode,m.level),commands=expand(p),pos=copy(m.start),world={opened:[],shield:false},trace=[],status='empty',bad=null;
    for(var i=0;i<commands.length;i++){
      var c=commands[i],from=copy(pos),step=transition(m,pos,c.op,world);pos=step.position;world=step.world;
      var row={from:from,to:copy(pos),op:c.op,effective:step.effective,index:c.index,inner:c.inner,iteration:c.iteration,blocked:step.blocked};if(m.adventure){row.world=copy(world);row.event=step.event;}trace.push(row);
      if(step.blocked){status='blocked';bad=c.index;break;}
      if(m.adventure&&equal(pos,m.goal))break;
    }
    if(status!=='blocked'&&commands.length)status=equal(pos,m.goal)?'arrived':'away';
    var result={status:status,position:pos,trace:trace,debug_index:bad,expanded:commands.length};if(m.adventure)result.world=world;return result;
  }
  function solve(input) {
    var m=map(input),queue=[{p:copy(m.start),world:{opened:[],shield:false},commands:[]}],seen={},head=0;
    while(head<queue.length){var q=queue[head++],key=q.p.x+':'+q.p.y+':'+((m.mode==='relative'||m.adventure)?q.p.dir:0)+':'+q.world.opened.join(',')+':'+q.world.shield;if(seen[key])continue;seen[key]=true;if(equal(q.p,m.goal))return q.commands;if(q.commands.length>=32||head>50000)continue;
      (m.mode==='absolute'?['n','e','s','w']:['f','l','r']).forEach(function(op){var next=transition(m,q.p,op,q.world);if(!next.blocked)queue.push({p:next.position,world:next.world,commands:q.commands.concat([{op:op}])});});
    }return null;
  }
  function touchMove(m,pos,target){
    var dx=target.x-pos.x,dy=target.y-pos.y,distance=Math.abs(dx)+Math.abs(dy);
    if(!distance)return {kind:'robot'};
    if(distance!==1)return {kind:'jump'};
    var direction=dx===1?1:dx===-1?3:dy===1?2:0;
    if(direction!==pos.dir)return {kind:'turn',direction:direction};
    return {kind:blocked(m,target)?'blocked':'move',commands:[{op:'f'}]};
  }
  function directionCommands(pos,dir){var delta=(dir-pos.dir+4)%4,out=[];if(delta===3)out.push({op:'l'});else for(var n=0;n<delta;n++)out.push({op:'r'});out.push({op:'f'});return out;}
  function observedPrefix(previous,next){var i=0;while(i<previous.length&&i<next.length&&JSON.stringify(previous[i])===JSON.stringify(next[i]))i++;return i;}
  function blank(){return {schema_version:1,app_id:'a4-command-path',language:'ar',sound:true,adventure_mode:true,completed:[],level:1,view:'library',draft:null,saved:[],maps:[],recent:[],note:'',support:'together',reading_focus:true};}
  function start(m,profile){m=map(m);return {id:'path-'+Date.now()+'-'+Math.random().toString(36).slice(2,8),profile_ref:profile||'local-guest',map:m,commands:copy(m.starter),prediction:[],prediction_skipped:false,phase:'plan',cursor:0,result:null,history:[],reflection:'',assistance:'together',saved:false};}
  function validateDraft(d,profile) {
    if(!d||typeof d.id!=='string'||d.id.length>100||typeof d.reflection!=='string'||d.reflection.length>500)throw Error('draft');
    var n=start(d.map,profile);n.id=d.id;n.commands=program(d.commands,n.map.mode,n.map.level);
    if(!Array.isArray(d.prediction)||d.prediction.length>25)throw Error('prediction');
    var last=n.map.start;n.prediction=d.prediction.map(function(p){if(!point(p,n.map.size)||Math.abs(last.x-p.x)+Math.abs(last.y-p.y)!==1)throw Error('prediction');last=p;return{x:p.x,y:p.y};});
    n.prediction_skipped=!!d.prediction_skipped;n.phase=['predict','plan','run','review'].indexOf(d.phase)>=0?d.phase:'plan';n.cursor=integer(d.cursor,0,80)?d.cursor:0;n.reflection=d.reflection;n.assistance=d.assistance==='independent'?'independent':'together';n.saved=!!d.saved;
    if(d.result){n.result=execute(n.map,n.commands);n.cursor=Math.min(n.cursor,n.result.trace.length);}
    n.history=(Array.isArray(d.history)?d.history:[]).slice(-12).map(function(h){var p=program(h.commands,n.map.mode,n.map.level);return {commands:p,result:execute(n.map,p),prediction:Array.isArray(h.prediction)?h.prediction.filter(function(v){return point(v,n.map.size);}).slice(0,25):[],assistance:h.assistance==='independent'?'independent':'together'};});
    return n;
  }
  function restore(raw,profile){if(!raw)return blank();var o=typeof raw==='string'?JSON.parse(raw):raw;if(!o||o.app_id!=='a4-command-path'||o.schema_version!==1)throw Error('save');var n=blank();n.language=o.language==='en'?'en':'ar';n.sound=o.sound!==false;n.adventure_mode=o.adventure_mode!==false;n.completed=(Array.isArray(o.completed)?o.completed:[]).filter(function(id){return typeof id==='string'&&/^adventure-[0-2]-[0-9]{1,2}$/.test(id);}).slice(-36);n.level=integer(o.level,1,3)?o.level:1;n.view=['library','play','gallery','designer','coach'].indexOf(o.view)>=0?o.view:'library';n.reading_focus=o.reading_focus!==false;n.support=o.support==='independent'?'independent':'together';n.note=typeof o.note==='string'?o.note.slice(0,1000):'';n.draft=o.draft?validateDraft(o.draft,profile):null;if(n.view==='play'&&!n.draft)n.view='library';if(!Array.isArray(o.saved)||o.saved.length>50||!Array.isArray(o.maps)||o.maps.length>30)throw Error('capacity');n.saved=o.saved.map(function(v){return validateDraft(v,profile);});n.maps=o.maps.map(map);n.recent=(Array.isArray(o.recent)?o.recent:[]).slice(-12).map(function(v){return validateDraft(v,profile);});return n;}
  function artifact(d){return validateDraft(copy(d),d.profile_ref);}
  function publicArtifact(d){var n=artifact(d);delete n.profile_ref;return n;}
  function exported(s){return {schema_version:1,app_id:'a4-command-path',language:s.language,adventure_mode:s.adventure_mode,completed:s.completed,draft:s.draft?publicArtifact(s.draft):null,saved:s.saved.map(publicArtifact),maps:s.maps.map(map),sound:s.sound,level:s.level};}
  function importData(value,profile){var o=copy(value);o.note='';o.recent=[];if(!o.maps)o.maps=[];if(!o.saved)o.saved=[];var n=restore(o,profile);n.saved.forEach(function(d,i){d.id='import-'+Date.now()+'-'+i;d.saved=true;});if(n.draft){n.draft.id='import-draft-'+Date.now();n.draft.saved=false;}return n;}
  return {touchMove:touchMove,directionCommands:directionCommands,copy:copy,observedPrefix:observedPrefix,equal:equal,map:map,program:program,expand:expand,execute:execute,solve:solve,blank:blank,start:start,restore:restore,artifact:artifact,exported:exported,importData:importData,blocked:blocked};
}));
