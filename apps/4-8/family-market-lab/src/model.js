/* Family Market v2: quantities are counted from actual tokens, never screen positions. */
(function (w) {
  'use strict';
  var products = w.APP360_MARKET_OBJECTS?w.APP360_MARKET_OBJECTS.items.map(function(x){return x.id}):['apple','banana','orange','grapes','strawberry','carrot','tomato','cucumber','book','cup','ball','milk'];
  var kinds = ['count','share','partition','compare','pattern','combine','measure'];
  function copy(x) { return JSON.parse(JSON.stringify(x)); }
  function id() { return 'market-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2,8); }
  function integer(n,min,max) { return typeof n === 'number' && isFinite(n) && Math.floor(n) === n && n >= min && n <= max; }
  function text(x,n) { return typeof x === 'string' ? x.slice(0,n) : ''; }
  function product(p) { if (products.indexOf(p) < 0) throw Error('unknown-product'); return p; }
  function task(x) {
    if (!x || kinds.indexOf(x.kind) < 0 || !integer(x.level,1,4) || ['ar','en'].indexOf(x.language) < 0) throw Error('invalid-task');
    var q = {id:text(x.id,90)||id(),kind:x.kind,level:x.level,language:x.language,title:text(x.title,120),prompt:text(x.prompt,500),hint:text(x.hint,400),real:text(x.real,400),product:product(x.product),support:x.support||'together',audio:{},seller:!!x.seller};
    if(x.exercise){if(['count','fill','return','share','split','combine','mixed','compare','pattern','measure'].indexOf(x.exercise)<0)throw Error('invalid-exercise');q.exercise=x.exercise;q.market=text(x.market,30);q.recipe_ref=text(x.recipe_ref,90);if(x.recipe_spec){if(!w.MARKET_EXERCISES)throw Error('recipe-engine');q.recipe_spec=w.MARKET_EXERCISES.recipe(x.recipe_spec)}}
    if (!q.title || !q.prompt) throw Error('missing-task-text');
    ['title','prompt','hint','real'].forEach(function(k) { if (x.audio && /^audio\/[a-z0-9-]+\.mp3$/.test(x.audio[k]||'')) q.audio[k]=x.audio[k]; });
    if (x.kind==='count' || x.kind==='measure') {
      if (!Array.isArray(x.requests) || x.requests.length<1 || x.requests.length>2) throw Error('invalid-order');
      var seen={},sum=0;
      q.requests=x.requests.map(function(r) { var p=product(r.product);if(seen[p]||!integer(r.quantity,1,20))throw Error('invalid-quantity');seen[p]=true;sum+=r.quantity;return {product:p,quantity:r.quantity}; });
      if (sum>20 || !integer(x.initial||0,0,20)) throw Error('order-limit'); q.initial=x.initial||0;
    } else if (x.kind==='share' || x.kind==='partition' || x.kind==='combine') {
      if (!integer(x.total,2,20)) throw Error('invalid-total');q.total=x.total;q.groups=x.kind==='combine'?3:x.kind==='partition'?2:x.groups;
      if (!integer(q.groups,2,4) || x.kind==='share' && q.total%q.groups!==0) throw Error('invalid-groups');
      if (x.kind==='combine') { if(!integer(x.left,1,x.total-1))throw Error('invalid-addends');q.left=x.left; }
    } else if (x.kind==='compare') {
      if(!integer(x.left,1,10)||!integer(x.right,1,10))throw Error('invalid-comparison');q.left=x.left;q.right=x.right;q.groups=2;
    } else {
      if(!Array.isArray(x.rule)||x.rule.length<2||x.rule.length>3||!integer(x.prefix,2,9)||!integer(x.length,x.prefix+1,12))throw Error('invalid-pattern');
      q.rule=x.rule.map(product);q.prefix=x.prefix;q.length=x.length;
    }
    return q;
  }
  function blank() { return {schema_version:1,language:'ar',level:1,view:'library',voice:true,support:'together',draft:null,saved:[],templates:[],notes:{},market:'fruits',recent:[],recipes:[],practice:[]}; }
  function start(source,support) {
    var t=task(source),tokens=[],i,j,n=0;
    function add(p,z){tokens.push({id:'item-'+(++n),product:p,zone:z});}
    if(t.kind==='count'||t.kind==='measure')t.requests.forEach(function(r,j){var count=Math.max(r.quantity+3,j===0?t.initial:0);for(var i=0;i<count;i++)add(r.product,j===0&&i<t.initial?0:-1);});
    else if(t.kind==='compare'){for(i=0;i<t.left;i++)add(t.product,0);for(i=0;i<t.right;i++)add(t.product,1);}
    else if(t.kind!=='pattern')for(i=0;i<t.total;i++)add(t.product,t.kind==='combine'?(i<t.left?0:1):-1);
    var sequence=[];if(t.kind==='pattern')for(i=0;i<t.prefix;i++)sequence.push(t.rule[i%t.rule.length]);
    return {id:id(),task:t,state:'in_progress',stage:'play',tokens:tokens,sequence:sequence,choice:'',destination:t.kind==='combine'?2:0,representation:'objects',explanation:'',reflection:'',support:support||'together',help_used:0,checked:false,history:[],future:[],attempt_history:[],created:Date.now(),updated:Date.now()};
  }
  function board(d) { return {tokens:copy(d.tokens),sequence:d.sequence.slice(),choice:d.choice}; }
  function edit(d) { d.history.push(board(d));if(d.history.length>30)d.history.shift();d.future=[];d.checked=false;d.state='in_progress';d.updated=Date.now(); }
  function setBoard(d,b) { d.tokens=copy(b.tokens);d.sequence=b.sequence.slice();d.choice=b.choice;d.checked=false; }
  function undo(d,redo) { var from=redo?d.future:d.history,to=redo?d.history:d.future;if(!from.length)return false;to.push(board(d));setBoard(d,from.pop());d.state='in_progress';return true; }
  function move(d,tokenId,zone) {
    if(d.task.kind==='compare'||d.task.kind==='pattern'||!integer(zone,-1,(d.task.groups||1)-1))return false;
    for(var i=0;i<d.tokens.length;i++)if(d.tokens[i].id===tokenId && d.tokens[i].zone!==zone){edit(d);d.tokens[i].zone=zone;return true;}return false;
  }
  function take(d,p,zone) {
    for(var i=0;i<d.tokens.length;i++)if(d.tokens[i].product===p && (d.task.kind==='combine'?d.tokens[i].zone!==2:d.tokens[i].zone===-1))return move(d,d.tokens[i].id,zone);return false;
  }
  function append(d,p) { if(d.task.kind!=='pattern'||d.sequence.length>=d.task.length||d.task.rule.indexOf(p)<0)return false;edit(d);d.sequence.push(p);return true; }
  function removePattern(d) { if(d.task.kind!=='pattern'||d.sequence.length<=d.task.prefix)return false;edit(d);d.sequence.pop();return true; }
  function choose(d,value) { if(d.task.kind!=='compare'||['a','b','equal'].indexOf(value)<0)return false;edit(d);d.choice=value;return true; }
  function count(d,zone,p) { var n=0;for(var i=0;i<d.tokens.length;i++)if(d.tokens[i].zone===zone&&(!p||d.tokens[i].product===p))n++;return n; }
  function evaluate(d) {
    var t=d.task,ok=false,i,counts=[],remaining=count(d,-1);
    if(t.kind==='count'||t.kind==='measure'){ok=count(d,0)===t.requests.reduce(function(n,r){return n+r.quantity;},0);for(i=0;i<t.requests.length;i++)ok=ok&&count(d,0,t.requests[i].product)===t.requests[i].quantity;counts=[count(d,0)];}
    else if(t.kind==='compare'){counts=[count(d,0),count(d,1)];ok=d.choice===(counts[0]===counts[1]?'equal':counts[0]>counts[1]?'a':'b');}
    else if(t.kind==='pattern'){ok=d.sequence.length===t.length;for(i=0;i<d.sequence.length;i++)ok=ok&&d.sequence[i]===t.rule[i%t.rule.length];counts=[d.sequence.length];}
    else if(t.kind==='combine'){counts=[count(d,0),count(d,1),count(d,2)];ok=counts[2]===t.total;}
    else {ok=remaining===0;for(i=0;i<t.groups;i++){counts.push(count(d,i));ok=ok&&(t.kind==='share'?counts[i]===t.total/t.groups:counts[i]>0);} }
    return {matches:!!ok,counts:counts,remaining:remaining,total:d.tokens.length};
  }
  function checkpoint(d,reason) { var b=board(d),last=d.attempt_history[d.attempt_history.length-1];if(last&&JSON.stringify(last.board)===JSON.stringify(b)&&last.support===d.support)return;d.attempt_history.push({at:Date.now(),reason:text(reason,60),support:d.support,board:b});if(d.attempt_history.length>8)d.attempt_history.shift(); }
  function cleanBoard(b,t) {
    if(!b||!Array.isArray(b.tokens)||b.tokens.length>26||!Array.isArray(b.sequence)||b.sequence.length>12)throw Error('invalid-board');var ids={};
    var q={tokens:b.tokens.map(function(x){if(!x||!(/^[a-z0-9-]{1,60}$/.test(x.id||''))||ids[x.id]||!integer(x.zone,-1,(t.groups||1)-1))throw Error('invalid-token');ids[x.id]=true;return{id:text(x.id,60),product:product(x.product),zone:x.zone};}),sequence:b.sequence.map(product),choice:['','a','b','equal'].indexOf(b.choice)>=0?b.choice:''};
    if(t.kind==='pattern'){if(q.tokens.length||q.sequence.length<t.prefix||q.sequence.length>t.length)throw Error('invalid-pattern-board');for(var i=0;i<t.prefix;i++)if(q.sequence[i]!==t.rule[i%t.rule.length])throw Error('changed-pattern-prefix');}
    else if(q.sequence.length)throw Error('unexpected-sequence');
    if(['share','partition','combine'].indexOf(t.kind)>=0 && (q.tokens.length!==t.total || q.tokens.some(function(x){return x.product!==t.product;})))throw Error('changed-total');
    if(t.kind==='compare' && (q.tokens.length!==t.left+t.right || q.tokens.some(function(x){return x.product!==t.product||x.zone<0;}) || q.tokens.filter(function(x){return x.zone===0;}).length!==t.left))throw Error('changed-comparison');
    if(t.kind==='count'||t.kind==='measure'){var initial=start(t).tokens;if(q.tokens.length!==initial.length)throw Error('changed-stock');for(var j=0;j<initial.length;j++)if(q.tokens.filter(function(x){return x.product===initial[j].product;}).length!==initial.filter(function(x){return x.product===initial[j].product;}).length)throw Error('changed-stock-product');}
    return q;
  }
  function artifact(x) {
    if(!x||!Array.isArray(x.attempt_history)||x.attempt_history.length>8)throw Error('invalid-work');var t=task(x.task),b=cleanBoard(x,t),d=start(t);d.id=text(x.id,100)||id();d.tokens=b.tokens;d.sequence=b.sequence;d.choice=b.choice;d.stage=x.stage==='review'?'review':'play';d.state=['in_progress','paused','needs_help','review','saved'].indexOf(x.state)>=0?x.state:'in_progress';d.destination=integer(x.destination,0,(t.groups||1)-1)?x.destination:0;d.representation=x.representation==='frame'?'frame':'objects';d.explanation=text(x.explanation,600);d.reflection=text(x.reflection,500);d.support=['together','hint','independent'].indexOf(x.support)>=0?x.support:'together';d.help_used=integer(x.help_used,0,999)?x.help_used:0;d.checked=!!x.checked;d.created=Number(x.created)||Date.now();d.updated=Number(x.updated)||Date.now();
    ['history','future'].forEach(function(k){if(x[k]&&!Array.isArray(x[k]))throw Error('invalid-history');d[k]=(x[k]||[]).slice(-30).map(function(b){return cleanBoard(b,t);});});
    d.attempt_history=x.attempt_history.map(function(a){if(!a||typeof a!=='object')throw Error('invalid-attempt');return{at:Number(a.at)||0,reason:text(a.reason,60),support:text(a.support,30),board:cleanBoard(a.board,t)};});return d;
  }
  function restore(raw) {
    if(!raw)return blank();var x=JSON.parse(raw);if(!x||x.schema_version!==1||!Array.isArray(x.saved)||x.saved.length>50||!Array.isArray(x.templates)||x.templates.length>20)throw Error('invalid-save');var s=blank();s.language=x.language==='en'?'en':'ar';s.level=integer(x.level,1,4)?x.level:1;s.view=['library','play','saved','coach','builder','review'].indexOf(x.view)>=0?x.view:'library';s.voice=x.voice!==false;s.support=['together','hint','independent'].indexOf(x.support)>=0?x.support:'together';s.draft=x.draft?artifact(x.draft):null;s.saved=x.saved.map(artifact);s.templates=x.templates.map(task);s.notes=x.notes&&typeof x.notes==='object'?x.notes:{};s.market=w.APP360_MARKET_OBJECTS&&w.APP360_MARKET_OBJECTS.markets.some(function(m){return m.id===x.market})?x.market:'fruits';if(x.recent&&!Array.isArray(x.recent)||x.recipes&&!Array.isArray(x.recipes))throw Error('invalid-practice');s.recent=(x.recent||[]).slice(-80).map(function(r){if(!r||typeof r.key!=='string'||r.key.length>140||typeof r.signature!=='string'||r.signature.length>1500||products.indexOf(r.product)<0||!integer(r.quantity,1,20))throw Error('invalid-rotation');return{key:r.key,product:r.product,quantity:r.quantity,signature:r.signature}});if((x.recipes||[]).length>20)throw Error('recipe-limit');if(x.practice&&!Array.isArray(x.practice)||(x.practice||[]).length>20)throw Error('practice-limit');s.practice=(x.practice||[]).map(artifact);s.recipes=(x.recipes||[]).map(function(r){if(!w.MARKET_EXERCISES)throw Error('recipe-engine');return w.MARKET_EXERCISES.recipe(r)});return s;
  }
  function saved(s) { if(!s.draft)return null;checkpoint(s.draft,'saved');var a=artifact(s.draft);a.id=id();a.state='saved';a.history=[];a.future=[];s.saved.push(a);return a; }
  function exportData(items) { return {schema_version:1,app_id:'a4-family-market',privacy:'Account identity and private coach notes excluded',projects:items.map(function(x){var a=artifact(x);a.history=[];a.future=[];return a;})}; }
  function importData(raw) { var x=JSON.parse(raw);if(x.app_id!=='a4-family-market'||x.schema_version!==1||!Array.isArray(x.projects)||x.projects.length>50)throw Error('invalid-import');return x.projects.map(function(a){var d=artifact(a);d.id=id();return d;}); }
  w.MARKET_MODEL={products:products,copy:copy,id:id,task:task,blank:blank,start:start,move:move,take:take,append:append,choose:choose,removePattern:removePattern,undo:undo,count:count,evaluate:evaluate,checkpoint:checkpoint,board:board,setBoard:setBoard,artifact:artifact,restore:restore,saved:saved,exportData:exportData,importData:importData};
})(typeof window!=='undefined'?window:globalThis);
