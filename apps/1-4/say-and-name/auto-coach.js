/* One cancellable audio owner; time is practice time, never a learning score. ES5. */
(function(w,d){'use strict';
var R=w.App360WordCoachRoutes,player=w.App360WordPlayer,meaning=w.App360MeaningLearning;
var active=false,paused=false,phase='idle',serial=0,task=null,clock=null,started=0,remaining=0,queue=[],index=0,config=null,lastError='',saved=null;
var key='app360:say-name:coach:v1';
function el(id){return d.getElementById(id)}
function en(){return player.preferences().display==='en'}
function text(ar,english){return en()?english:ar}
function caption(value){el('wordCoachCaption').textContent=value||''}
function emit(type,reason){var data={schema_version:1,app_id:'a1-first-words',type:type,reason:reason||'',route:config&&config.route,remaining_seconds:Math.ceil(left()),items_presented:index+1,practice_confirmed:false,caller:config&&config.caller||'',launch_id:config&&config.launch_id||''};var event=d.createEvent('CustomEvent');event.initCustomEvent('app360:word-coach',false,false,data);d.dispatchEvent(event)}
function left(){return Math.max(0,remaining-(active&&!paused?(Date.now()-started)/1000:0))}
function status(){
 var r=config&&R.route(config.route),seconds=Math.ceil(left());
 el('wordCoachLabel').textContent=(meaning.active()?text('مدربة المدرسة','School coach'):text('مدربة الروضة','Kindergarten coach'))+' · '+text('المدرب الآلي','Automatic coach');
 if(!config)return;
 var labels={intro:text('استمع لطريقة اللعب','Listen to the instructions'),look:text('انظر للصورة وحاول الإشارة أو التسمية','Look, point or name it'),listen:text('استمع','Listen'),practice:text('دورك: ردد أو أشِر إلى شيء حقيقي','Your turn: repeat or point to a real object'),praise:text('أحسنت، هيا نتابع','Well done, let us continue'),manual:text('يمكنك الانتقال عندما تكون مستعدًا','Move on when you are ready'),ended:text('انتهت الجلسة','Session ended')};
 el('wordCoachStatus').textContent=(en()?r.label_en:r.label_ar)+' · '+(paused?text('متوقف مؤقتًا','Paused'):labels[phase]||'')+' · '+seconds+' '+text('ثانية متبقية','seconds left')+(lastError?' · '+lastError:'');
 el('wordCoachToggle').textContent=paused?text('استئناف','Resume'):text('إيقاف مؤقت','Pause');
 el('wordCoachToggle').disabled=!active;el('wordCoachPrevious').disabled=!active||index===0;el('wordCoachNext').disabled=!active;
}
function cancel(){serial++;clearTimeout(task);task=null;player.stop();if(w.APP360_TEACHER_ENCOURAGEMENT)w.APP360_TEACHER_ENCOURAGEMENT.stop();caption('')}
function finish(reason){if(!active)return;remaining=left();active=false;paused=false;cancel();clearInterval(clock);clock=null;phase='ended';lastError='';status();emit('session-ended',reason)}
function pause(reason){if(!active||paused)return;remaining=left();paused=true;cancel();if(reason)lastError=reason;status();emit('session-paused')}
function guard(n){return active&&!paused&&n===serial}
function delay(seconds,fn){var n=serial;task=setTimeout(function(){task=null;if(guard(n))fn()},seconds*1000)}
function error(){pause(text('تعذر الصوت. تحقق من الاتصال ثم اضغط استئناف للمحاولة.','Audio unavailable. Check the connection, then tap Resume.'))}
function practice(){phase='practice';status();delay(config.response_seconds,function(){if(config.autoplay)advance(1,true);else{phase='manual';status()}})}
function narrate(){phase='listen';status();var n=serial;function done(err){if(!guard(n))return;if(err){error();return}practice()}
 if(!player.preferences().speech){practice();return}
 if(R.route(config.route).track==='sentences')meaning.speak(done,{skipName:true});else player.sayCurrent(done,{once:true});
}
function show(){if(!active||paused)return;cancel();lastError='';var route=R.route(config.route);meaning.setActive(route.track==='sentences');if(!player.coachSelect(queue[index],config.level)){error();return}phase='look';status();delay(2,narrate)}
function advance(direction,praise){if(!active)return;if(left()<=0){finish('time');return}remaining=left();started=Date.now();paused=false;cancel();if(direction<0){index=Math.max(0,index-1);show();return}if(index+1>=queue.length){finish('route');return}
 function next(){index++;show()}
 if(!praise||!player.preferences().speech){next();return}
 phase='praise';status();var n=serial;w.APP360_TEACHER_ENCOURAGEMENT.play({language:player.preferences().voice==='en'?'en':'ar',caption:caption},function(){if(guard(n))next()});
}
function resume(){if(!active||!paused)return false;paused=false;started=Date.now();lastError='';show();emit('session-resumed');return true}
function build(options){var route=R.route(options.route),items=player.coachItems(options.level),p=player.preferences(),langs=p.voice==='both'?['ar','en']:[p.voice],content=w.APP360_MEANING_CONTENT||{items:[]},clips=w.APP360_MEANING_AUDIO||{clips:{}},map={};
 if(route.track==='sentences')for(var i=0;i<content.items.length;i++){var it=content.items[i];if(it.sentences.length&&it.sentences.every(function(row){return langs.every(function(lang){return row[lang]&&clips.clips[row[lang].clip]})}))map[it.key]=true}
 items=items.filter(function(it){return (!options.category||route.review||it.category===options.category||it.category_ar===options.category)&&(route.track!=='sentences'||map[it.category_ar+'\u0001'+it.ar])});
 if(route.review)for(var j=items.length-1;j>0;j--){var k=Math.floor(Math.random()*(j+1)),swap=items[j];items[j]=items[k];items[k]=swap}
 return items;
}
function start(options){var opts=R.parse(options||read()),items=build(opts);if(!items.length){pause();el('wordCoachPanel').hidden=false;el('wordCoachButton').setAttribute('aria-expanded','true');el('wordCoachControls').hidden=false;el('wordCoachStatus').textContent=text('لا توجد مواد صوتية جاهزة لهذا الاختيار. اختر مجموعة أو مستوى آخر.','No ready recordings for this selection. Choose another group or level.');return false}
 if(active)finish('replaced');cancel();config=opts;queue=items;index=0;remaining=opts.duration_seconds;active=true;paused=false;started=Date.now();lastError='';el('wordCoachControls').hidden=false;el('wordCoachPanel').hidden=true;el('wordCoachButton').setAttribute('aria-expanded','false');
 clock=setInterval(function(){if(active&&!paused&&left()<=0){finish('time');return}status()},250);
 try{w.localStorage.setItem(key,JSON.stringify(opts))}catch(e){}
 emit('session-started');meaning.setActive(R.route(opts.route).track==='sentences');player.coachSelect(queue[0],opts.level);
 phase='intro';status();var n=serial;if(player.preferences().speech)player.guide('coach',function(err){if(!guard(n))return;if(err)error();else show()});else show();
 try{el('stage').scrollIntoView({block:'start',behavior:'smooth'})}catch(e){el('stage').scrollIntoView(true)}return true;
}
function read(){return {route:el('wordCoachRoute').value,level:el('wordCoachLevel').value,category:el('wordCoachCategory').value,duration_seconds:Number(el('wordCoachMinutes').value)*60,response_seconds:el('wordCoachWait').value,autoplay:el('wordCoachAuto').checked}}
function categories(selected){var select=el('wordCoachCategory'),items=player.coachItems(el('wordCoachLevel').value),seen={};select.innerHTML='';var option=d.createElement('option');option.value='';option.textContent=text('كل المجموعات','All groups');select.appendChild(option);for(var i=0;i<items.length;i++)if(!seen[items[i].category]){seen[items[i].category]=1;option=d.createElement('option');option.value=items[i].category;option.textContent=items[i].category_ar;select.appendChild(option)}select.value=selected||'';if(select.selectedIndex<0)select.selectedIndex=0;select.disabled=R.route(el('wordCoachRoute').value).review}
function prepare(options){if(active)pause();var opts=R.parse(options||saved||{});el('wordCoachRoute').value=opts.route;el('wordCoachLevel').value=opts.level;categories(opts.category);el('wordCoachMinutes').value=opts.duration_seconds/60;el('wordCoachWait').value=opts.response_seconds;el('wordCoachAuto').checked=opts.autoplay;el('wordCoachPanel').hidden=false;el('wordCoachButton').setAttribute('aria-expanded','true');return opts}
function init(){for(var i=0;i<R.routes.length;i++){var o=d.createElement('option');o.value=R.routes[i].id;o.textContent=R.routes[i].label_ar+' · '+R.routes[i].label_en;el('wordCoachRoute').appendChild(o)}
 try{saved=JSON.parse(w.localStorage.getItem(key)||'null')}catch(e){}
 el('wordCoachButton').onclick=function(){if(el('wordCoachPanel').hidden)prepare(saved||{route:meaning.active()?'sentences-category':'names-category'});else{el('wordCoachPanel').hidden=true;el('wordCoachButton').setAttribute('aria-expanded','false')}};
 el('wordCoachRoute').onchange=function(){categories(el('wordCoachCategory').value)};el('wordCoachLevel').onchange=function(){categories('')};el('wordCoachStart').onclick=function(){saved=R.parse(read());start(saved)};el('wordCoachToggle').onclick=function(){if(paused)resume();else pause()};el('wordCoachStop').onclick=function(){finish('user')};el('wordCoachNext').onclick=function(){advance(1,true)};el('wordCoachPrevious').onclick=function(){advance(-1,false)};
 function within(node,id){while(node&&node!==d){if(node.id===id)return true;node=node.parentNode}return false}
 function handled(e){e.preventDefault();if(e.stopImmediatePropagation)e.stopImmediatePropagation();else e.stopPropagation()}
 function replay(){cancel();lastError='';narrate()}
 d.addEventListener('click',function(e){
  var node=e.target,button=node;
  if(within(node,'wordCoachControls')||within(node,'wordCoachPanel')||within(node,'wordCoachButton')||within(node,'stageFullscreenBtn'))return;
  while(button&&button!==d&&!/^(BUTTON|INPUT|SELECT)$/.test(button.tagName||''))button=button.parentNode;
  if(!button||button===d)return;
  if(active&&!paused&&(button.id==='pictureButton'||button.id==='stageSpeakBtn'||button.id==='meaningWordOnly'||button.getAttribute('data-sentence')!==null)){handled(e);replay();return}
  if(active&&/^(prevBtn|bottomPrevBtn|nextBtn|bottomNextBtn)$/.test(button.id)){handled(e);advance(/Prev|^prev/.test(button.id)?-1:1,true);return}
  pause();
 },true);
 d.addEventListener('input',function(e){if(e.target.id==='itemRange')pause()},true);
 d.addEventListener('keydown',function(e){if((e.key==='ArrowLeft'||e.key==='ArrowRight')&&!(e.target&&/^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName||''))){if(active){handled(e);advance(e.key==='ArrowLeft'?-1:1,true)}else pause()}},true);
 var touchX=0,touchY=0;el('stage').addEventListener('touchstart',function(e){if(e.changedTouches&&e.changedTouches.length){touchX=e.changedTouches[0].clientX;touchY=e.changedTouches[0].clientY}},true);
 el('stage').addEventListener('touchend',function(e){if(!e.changedTouches||!e.changedTouches.length)return;var dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.25&&active){handled(e);advance(dx>0?-1:1,true)}},true);
 d.addEventListener('visibilitychange',function(){if(d.hidden)pause()},false);d.addEventListener('app360:authchange',function(){pause()},false);w.addEventListener('pagehide',function(){pause()},false);
 var query=String(w.location.search||'');if(/[?&]action=session(?:&|$)/.test(query)||/[?&]route=/.test(query))prepare(R.parse(query));status();
}
w.App360WordCoach={routes:R.routes,start:start,pause:pause,resume:resume,stop:function(){finish('user')},prepare:prepare,ownsAudio:function(){return active},state:function(){return {active:active,paused:paused,phase:phase,remaining_seconds:left(),route:config&&config.route,index:index,count:queue.length,practice_confirmed:false}}};
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init);else init();
})(window,document);
