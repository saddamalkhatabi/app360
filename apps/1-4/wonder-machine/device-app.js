(function(w,d){'use strict';
var C=w.WonderDeviceCore,D=w.WonderDeviceContent,S=w.WonderDeviceScene,$=function(id){return d.getElementById(id);},store,device,task,round,age,owner,key,language='ar',classic=false,expanded=false,photos={},feedback='',feedbackBad=false,helpTool=null,preview=null,demoTool=null,timers=[],epoch=0,returnFocus=null;
var G=w.WonderDeviceGuide,guideAudio=null,advanceTimer=null,guideVoiceArmed=false,drawer='',drawerFocus=null,laidOutAge='';
var words={ar:{collection:'أجهزة الأدوات',original:'الجهاز الأول 📷',title:'أختار جهازًا… وأغيّر المشهد',intro:'أدوات ثابتة، وأثر واضح. جرّب بحرية أو اختر مهمة قصيرة.',levels:'المستويات',devices:'أجهزة المستوى',free:'استكشاف حر',missions:'مهمات الجهاز',control:'لوحة أدواتي',photo:'صور واقعية',drawing:'رسم واضح',zoom:'تكبير الجهاز والمشهد',small:'تصغير المساحة',help:'لمعة مساعدة',demo:'أرني أثر أداة',mine:'الآن دوري',preview:'هذا مثال مؤقت؛ اضغط أداة لتجرب بنفسك.',undo:'تراجع',reset:'أعيد المشهد',next:'الجهاز التالي',previous:'الجهاز السابق',nextLevel:'المستوى التالي',done:'المشهد جاهز كما طلبت المهمة!',try:'غيّر الأدوات لتجهز هذا المشهد، بأي ترتيب يسمح به الجهاز.',explore:'كل أداة تغيّر جزءًا محددًا. لا توجد إجابة مطلوبة في الاستكشاف الحر.',ready:'مهمات جاهزة',saving:'تعذر الحفظ؛ يمكنك مواصلة اللعب، لكن تقدمك قد لا يبقى بعد الإغلاق.',loading:'جارٍ تحميل صور هذا الجهاز؛ الرسم والأدوات يعملان الآن.',imageError:'تعذر تحميل صور الجهاز. المشهد المرسوم يعرض تأثير الأدوات.',scene:'المشهد المرتبط بأدواتي',goal:'المشهد المطلوب',solo:'أستكشف وحدي',turn:'دور ',star:'صاحب النجمة',circle:'صاحب الدائرة',virtual:'جهاز افتراضي · الأجهزة الحقيقية مع بالغ',companion:'مع المرافق: سمّ الأداة، واضغطها، ثم سمّ ما تغير.',road:'في الواقع نعبر مع بالغ، بعد التأكد من الإشارة وتوقف المركبات وفحص كل الاتجاهات.',fire:'تمرين سلامة افتراضي: نخرج ونبقى خارجًا. نشاهد إطفاء البالغ المدرّب من مكان آمن.',first:'جرّب أداة: ',closeDoor:'أغلق الباب أولًا؛ هذه الأداة تنتظر الباب.',stopFirst:'أوقف التشغيل أولًا، ثم افتح الباب.',openWater:'افتح الماء للشطف، ثم اضغط زر الصابون لإزالة الرغوة.',openCase:'افتح الحقيبة قبل تحريك الملابس.',packFirst:'ضع الملابس داخل الحقيبة قبل إغلاقها.',openDoor:'افتح باب المستودع أولًا؛ العربة تنتظر طريقًا مفتوحًا.',raiseBridge:'ارفع الجسر أولًا؛ القارب ينتظر الممر.',waitTraffic:'اطلب العبور وانتظر توقف المرور في النموذج أولًا.',checkWithAdult:'قبل العبور: ننتظر التوقف ونفحص الطريق مع المرافق.',staySafe:'وصلنا معًا. نبقى في المكان الآمن؛ زر إعادة المشهد يبدأ تجربة جديدة.',outsideFirst:'دور الطفل الخروج أولًا. أبلغ البالغ من نقطة اللقاء خارج المنزل.',stayOutside:'نبقى خارجًا ولا نعود للداخل. أعد المشهد إن أردت بدء التدريب من جديد.'},en:{collection:'Tool panels',original:'First machine 📷',title:'Choose a panel… change the scene',intro:'Steady controls, clear effects. Explore freely or choose a short mission.',levels:'Levels',devices:'Panels in this level',free:'Free exploration',missions:'Panel missions',control:'My control panel',photo:'Realistic photos',drawing:'Clear drawing',zoom:'Expand panel and scene',small:'Reduce the view',help:'A helpful glow',demo:'Show one tool effect',mine:'My turn now',preview:'A temporary example. Press any tool to try for yourself.',undo:'Undo',reset:'Reset scene',next:'Next panel',previous:'Previous panel',nextLevel:'Next level',done:'The scene matches the mission!',try:'Use the tools to prepare this scene, in any order the panel allows.',explore:'Each tool changes one part. Free exploration has no required answer.',ready:'missions ready',saving:'Saving is unavailable. Play can continue, but progress may not stay after closing.',loading:'Loading this panel’s photos; its drawing and controls work now.',imageError:'The photos could not load. The drawing still shows each tool’s effect.',scene:'The scene linked to my tools',goal:'The requested scene',solo:'Exploring on my own',turn:'Turn: ',star:'Star player',circle:'Circle player',virtual:'Virtual panel · real equipment needs a grown-up',companion:'With a grown-up: name the tool, press it, then name what changed.',road:'In real life cross with a grown-up after checking signals, stopped vehicles and all directions.',fire:'Virtual safety drill: get out and stay out. Watch trained adults from safety.',first:'Try this tool: ',closeDoor:'Close the door first; this control is waiting for it.',stopFirst:'Stop the machine first, then open the door.',openWater:'Open the tap to rinse, then press the soap button to remove foam.',openCase:'Open the case before moving clothes.',packFirst:'Pack the clothes before closing the case.',openDoor:'Open the depot door first; the trolley needs a clear path.',raiseBridge:'Raise the bridge first; the boat needs the passage.',waitTraffic:'Request crossing and wait for traffic to stop in the model first.',checkWithAdult:'Before crossing: wait for stopped traffic and check with your grown-up.',staySafe:'We arrived together. Stay safe; reset starts a new practice scene.',outsideFirst:'A child leaves first. Tell a grown-up from the outdoor meeting point.',stayOutside:'Stay outside. Do not return indoors. Reset if you want to start a new drill.'}};
function t(k){return words[language][k]||k;}function loc(x){return x[language];}function esc(s){return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/"/g,'&quot;');}
function prefs(){var p=w.WonderMachine.getState();language=p.settings.language;return p;}
function select(){device=C.find(store.selected[store.level],age);task=C.task(device,store.tasks[device.id]);var k=C.key(device,task.id);if(!store.rounds[k])store.rounds[k]=C.fresh(device,task.id);round=store.rounds[k];feedback='';feedbackBad=false;helpTool=null;}
function load(){guideVoiceArmed=false;owner=w.WonderMachine.owner();age=owner.slice(-3)==='4-8'?'4-8':'1-4';key='app360:wonder-devices:v1:'+owner;var raw=null;try{raw=JSON.parse(w.localStorage.getItem(key)||'null');}catch(e){}store=C.store(raw,age);select();layoutGuide();}
function save(){try{w.localStorage.setItem(key,JSON.stringify(store));$('deviceSave').hidden=true;}catch(e){$('deviceSave').textContent=t('saving');$('deviceSave').hidden=false;}}
function blocked(){return classic||d.hidden||w.WonderMachine.getState().panel;}
function stopDemo(){epoch++;for(var i=0;i<timers.length;i++)w.clearTimeout(timers[i]);timers=[];preview=null;demoTool=null;}
function expand(value){expanded=value;$('deviceWork').classList.toggle('dm-expanded',value);d.body.classList.toggle('dm-modal',value);$('deviceZoom').textContent=t(value?'small':'zoom');$('deviceZoom').setAttribute('aria-expanded',String(value));if(value){returnFocus=d.activeElement;$('deviceZoom').focus();}else if(returnFocus){returnFocus.focus();returnFocus=null;}}
function chooseLevel(n){if(blocked()||n%1||n<1||n>4)return;stopGuide();stopDemo();store.level=n;select();save();render();}
function chooseDevice(id){var found=C.find(id,age);if(blocked()||!found||found.levels[age]!==store.level)return;stopGuide();stopDemo();store.selected[store.level]=id;select();save();render();}
function chooseTask(id){if(blocked())return;stopGuide();stopDemo();store.tasks[device.id]=C.task(device,id).id;select();save();render();}
function navigate(delta){var list=C.list(age,store.level),i=list.indexOf(device);chooseDevice(list[(i+delta+list.length)%list.length].id);}
function guided(){return age==='4-8';}
function guideInstruction(){
  if(preview)return {text:G.labels[language].demo};
  if(task.goal&&C.progress(round.machine,task).done&&!G.next(device,task,store.level)){
    return {text:G.labels[language].last,clip:'done'};
  }
  return G.instruction(device,task,round.machine,language,store.guide.enabled||!!helpTool);
}
var schoolFeedback=w.APP360_SCHOOL_VOICE_FEEDBACK&&w.APP360_SCHOOL_VOICE_FEEDBACK.create();
function stopGuideAudio(){if(schoolFeedback)schoolFeedback.stop();if(guideAudio)guideAudio.pause();}
function cancelAdvance(){w.clearTimeout(advanceTimer);advanceTimer=null;}
function stopGuide(){cancelAdvance();stopGuideAudio();}
function startVoice(){
  if(!guided())return;
  guideVoiceArmed=store.guide.voice;
  speakGuide(false);
}
function speakGuide(explicit,clip){
  if(!guided()||blocked()||drawer||!store.guide.voice||(!explicit&&(!guideVoiceArmed||!store.guide.enabled)))return;
  clip=clip||guideInstruction().clip;
  if(!clip)return;
  try{
    guideAudio=guideAudio||new w.Audio();
    guideAudio.pause();
    guideAudio.src='audio/guide/'+language+'-'+clip+'.mp3';
    var playback=guideAudio.play();
    if(playback&&playback.catch)playback.catch(function(){});
  }catch(e){/* The instruction stays visible when audio is unavailable. */}
}
function advance(){
  if(!guided()||blocked()||drawer)return;
  if(task.goal&&!C.progress(round.machine,task).done)return;
  var target=G.next(device,task,store.level);
  if(!target){resetRound();return;}
  var moveFocus=d.activeElement===$('deviceAdvance')||d.activeElement===$('deviceCancelAdvance')||
    $('deviceControls').contains(d.activeElement);
  stopGuide();stopDemo();
  store.level=target.level;
  store.selected[target.level]=target.device;
  store.tasks[target.device]=target.task;
  select();save();render();startVoice();
  if(moveFocus)$('deviceGuideTitle').focus();
}
function scheduleAdvance(){
  if(!guided()||!store.guide.enabled||!store.guide.auto||!G.next(device,task,store.level))return;
  advanceTimer=w.setTimeout(advance,4500);
}
function paintGuide(){
  if(!guided())return;
  var words=G.labels[language],instruction=guideInstruction(),done=C.progress(round.machine,task).done;
  var index=device.tasks.indexOf(task),next=G.next(device,task,store.level),pending=advanceTimer!==null;
  var message=feedbackBad&&!preview?feedback:instruction.text;
  $('deviceGuideTitle').textContent=index<0?t('free'):loc(task.title);
  $('deviceGuideProgress').textContent=index<0?'':words.mission(index+1,device.tasks.length);
  if($('deviceGuideText').textContent!==message)$('deviceGuideText').textContent=message;
  $('deviceGuide').classList.toggle('dm-guide-done',done);
  $('deviceGuide').classList.toggle('dm-guide-caution',feedbackBad&&!preview);
  $('deviceCoachToggle').textContent=store.guide.enabled?'✋ '+words.coach:'★ '+words.solo;
  $('deviceCoachToggle').setAttribute('aria-label',words.coach);
  $('deviceCoachToggle').setAttribute('aria-pressed',String(store.guide.enabled));
  $('deviceListen').textContent=preview?t('mine'):'♪ '+words.listen;
  $('deviceAdvance').textContent=index<0?words.start:pending?words.waiting:next?words.next:words.replay;
  $('deviceAdvance').disabled=index>=0&&!done;
  $('deviceCancelAdvance').textContent=words.stay;
  $('deviceCancelAdvance').hidden=!pending;
  $('deviceGuideAuto').checked=store.guide.auto;
  $('deviceGuideMute').checked=!store.guide.voice;
  $('deviceGuideAutoLabel').textContent=words.auto;
  $('deviceGuideMuteLabel').textContent=words.mute;
  $('deviceChoose').setAttribute('aria-label',words.choose);
  $('deviceChooseFull').textContent=words.choose;
  $('deviceChooseShort').textContent=words.chooseShort;
  $('deviceActions').textContent='⋯';
  $('deviceActions').setAttribute('aria-label',words.actions);
  $('deviceDrawerTitle').textContent=drawer==='actions'?words.actions:words.choose;
  $('deviceDrawerClose').textContent=words.chooseClose;
  $('deviceGoalAudio').textContent='♪ '+words.goalAudio;
  $('deviceGoalAudio').hidden=!task.goal;
  $('deviceGoalNote').textContent=task.goal?loc(task.note):'';
  $('deviceGoalNote').hidden=!task.goal;
  $('deviceZoom').textContent=language==='ar'?(expanded?'تصغير':'تكبير'):(expanded?'Reduce':'Expand');
  $('deviceZoom').setAttribute('aria-label',t(expanded?'small':'zoom'));
  $('deviceChooseLevelLabel').textContent=words.chooseLevel;
  $('deviceChoosePanelLabel').textContent=words.chooseDevice;
  $('deviceChooseTaskLabel').textContent=words.chooseTask;
}
function setDrawer(kind,restore){
  if(kind){
    if(blocked()||!guided())return;
    drawerFocus=d.activeElement;
    stopGuide();stopDemo();
  }
  drawer=kind;
  $('deviceDrawer').hidden=!kind;
  $('deviceChoices').hidden=kind!=='choose';
  $('deviceOptions').hidden=kind!=='actions';
  $('deviceChoose').setAttribute('aria-expanded',String(kind==='choose'));
  $('deviceActions').setAttribute('aria-expanded',String(kind==='actions'));
  if(kind){render();$('deviceDrawerClose').focus();}
  else{if(restore&&drawerFocus)drawerFocus.focus();drawerFocus=null;}
}
function restoreChoice(attr,value){
  var choice=drawer&&$('deviceChoices').querySelector('['+attr+'="'+value+'"]');
  if(choice)choice.focus();
}
function visibleControls(root,selector){
  return Array.prototype.filter.call(root.querySelectorAll(selector),function(node){
    return node.getClientRects().length;
  });
}
function handleDrawerKey(event){
  if(event.key==='Escape'||event.keyCode===27){
    event.preventDefault();setDrawer('',true);return;
  }
  if(event.key!=='Tab'&&event.keyCode!==9)return;
  var visible=visibleControls($('deviceDrawer'),'button:not([disabled]),input:not([disabled])');
  var first=visible[0],last=visible[visible.length-1];
  if(event.shiftKey&&d.activeElement===first){event.preventDefault();last.focus();}
  else if(!event.shiftKey&&d.activeElement===last){event.preventDefault();first.focus();}
}
function bindGuide(){
  $('deviceChoose').onclick=function(){setDrawer('choose',false);};
  $('deviceActions').onclick=function(){setDrawer('actions',false);};
  $('deviceDrawerClose').onclick=function(){setDrawer('',true);};
  $('deviceDrawer').onclick=function(event){if(event.target===this)setDrawer('',true);};
  $('deviceCoachToggle').onclick=function(){
    stopGuide();stopDemo();helpTool=null;store.guide.enabled=!store.guide.enabled;save();render();startVoice();
  };
  $('deviceListen').onclick=function(){
    if(preview){stopDemo();render();return;}
    store.guide.voice=true;guideVoiceArmed=true;save();paintGuide();speakGuide(true);
  };
  $('deviceGoalAudio').onclick=function(){
    setDrawer('',true);store.guide.voice=true;guideVoiceArmed=true;save();
    speakGuide(true,G.missionClip(device,task));
  };
  $('deviceGuideMute').onchange=function(){store.guide.voice=!this.checked;stopGuideAudio();save();};
  $('deviceGuideAuto').onchange=function(){store.guide.auto=this.checked;cancelAdvance();save();};
  $('deviceAdvance').onclick=advance;
  $('deviceCancelAdvance').onclick=function(){cancelAdvance();$('deviceAdvance').focus();paintGuide();};
  d.querySelector('.topbar').addEventListener('click',function(){
    if(guided()){stopGuide();paintGuide();}
  },false);
}
function layoutGuide(){
  if(laidOutAge===age)return;
  laidOutAge=age;
  var older=guided(),realWorld=$('realWorld'),navs=['deviceLevels','deviceCards','deviceTasks'];
  realWorld.classList.toggle('dm-guided',older);
  navs.forEach(function(id){if(older)$('deviceChoice-'+id).appendChild($(id));else realWorld.insertBefore($(id),$('deviceWork'));});
  var items=['deviceViews','deviceToolsFooter','deviceUtilities','deviceSafety','deviceIdea'];
  items.forEach(function(id){
    var slot=$(id+'Slot');
    if(older)$('deviceOptions').appendChild($(id));else slot.parentNode.insertBefore($(id),slot);
  });
  ['deviceChoose','deviceActions','deviceGuide','deviceAdvance','deviceDock'].forEach(function(id){$(id).hidden=!older;});
  $('deviceNextLevel').hidden=older;
}
function resetRound(){
  if(blocked())return;
  stopGuide();stopDemo();
  var fresh=C.fresh(device,task.id);
  if(JSON.stringify(fresh.machine)!==JSON.stringify(round.machine)){
    round.history.push({machine:C.copy(round.machine),turn:round.turn});
    if(round.history.length>30)round.history.shift();
    round.machine=fresh.machine;round.turn=0;
  }
  feedback='';feedbackBad=false;helpTool=null;save();render();speakGuide(false);
}
function machine(){return preview||round.machine;}
function photoId(){return device.photoId||device.id;}
function loadPhoto(){var id=photoId();if(photos[id])return;var image=new w.Image(),record={state:'loading',image:image};photos[id]=record;image.onload=function(){record.state='ready';if(photoId()===id)paintScene();};image.onerror=function(){record.state='error';if(photoId()===id)paintScene();};image.src='assets/devices/'+id+'.webp';}
function fitPhoto(){var f=$('deviceFrame'),p=$('devicePhoto'),width=f.clientWidth,height=f.clientHeight;if(!height||!width)return;var fit=Math.min(width/16,height/9);p.style.width=(fit*16)+'px';p.style.height=(fit*9)+'px';p.style.left=((width-fit*16)/2)+'px';p.style.top=((height-fit*9)/2)+'px';}
function paintScene(){var m=machine(),frame=C.frame(device,m),record=photos[photoId()],show=store.photo&&record&&record.state==='ready';$('deviceDrawing').innerHTML=S.render(device,m);$('deviceDrawing').hidden=!!show;$('devicePhoto').hidden=!show;
 if(show){$('devicePhoto').style.backgroundImage='url("assets/devices/'+photoId()+'.webp")';$('devicePhoto').style.backgroundPosition=(frame%2*100)+'% '+(Math.floor(frame/2)*100)+'%';}
 $('deviceFrame').setAttribute('data-frame',String(frame));$('deviceFrame').setAttribute('data-device',device.id);$('deviceFrame').setAttribute('data-representation',show?'photo':'drawing');
 var description=loc(device.title),html='';for(var i=0;i<device.tools.length;i++){var tool=device.tools[i],n=m[tool.key];description+='، '+loc(tool.name)+' '+loc(tool.states[n]);html+='<span class="dm-link dm-color-'+i+(demoTool===tool.key?' dm-pulse':'')+'"><b aria-hidden="true">'+(i+1)+'</b>'+esc(loc(tool.name))+' · '+esc(loc(tool.states[n]))+'</span>';}
 $('deviceFrame').setAttribute('aria-label',description);$('deviceLinks').innerHTML=html;$('deviceImageNote').hidden=!store.photo||(record&&record.state==='ready');$('deviceImageNote').textContent=t(record&&record.state==='error'?'imageError':'loading');fitPhoto();
}
function paintControls(){
  var m=machine(),html='',p=prefs(),older=guided();
  var guideTool=older?guideInstruction().tool:null;
  for(var i=0;i<device.tools.length;i++){
    var tool=device.tools[i],key=tool.key,n=m[key];
    var disabled=(device.id==='crossing'||device.id==='fire')&&n===1;
    var classes='dm-tool dm-color-'+i;
    if((guideTool||helpTool)===key)classes+=' dm-hint';
    if(demoTool===key)classes+=' dm-demonstrating';
    var number=language==='ar'&&older?'١٢٣'.charAt(i):i+1;
    var indexId='deviceIndex-'+key;
    var badge='<span class="dm-tool-index" id="'+indexId+'"'+(older?'':' aria-hidden="true"')+'>'+number+'</span>';
    var controlLabel='deviceLabel-'+key+(older?' '+indexId:'');
    var label='<label for="deviceTool-'+key+'" id="deviceLabel-'+key+'">'+esc(loc(tool.name))+'</label>';
    html+='<div class="'+classes+'">'+(older?'':badge)+label+
      '<button type="button" class="dm-tool-button dm-'+tool.type+'" id="deviceTool-'+key+'"'+
      ' data-device-tool="'+key+'" aria-labelledby="'+controlLabel+'" aria-describedby="deviceValue-'+key+'"'+
      ' aria-pressed="'+!!n+'"'+(disabled?' disabled':'')+'>'+S.control(tool.type,n)+(older?badge:'')+
      '<span class="dm-hand" aria-hidden="true">☝</span></button>'+
      '<span id="deviceValue-'+key+'" class="dm-value">'+esc(loc(tool.states[n]))+'</span></div>';
  }
  $('deviceControls').innerHTML=html;
  var buttons=$('deviceControls').querySelectorAll('[data-device-tool]');
  for(i=0;i<buttons.length;i++)buttons[i].onclick=function(){act(this.getAttribute('data-device-tool'));};
  $('deviceTurn').textContent=p.settings.players===2?t('turn')+t(round.turn?'circle':'star'):t('solo');
  $('deviceTurn').parentNode.hidden=older&&p.settings.players!==2;
}
function paintStatus(){var p=C.progress(round.machine,task),html='';$('deviceTaskTitle').textContent=task.id==='free'?t('free'):loc(task.title);$('deviceTaskNote').textContent=task.id==='free'?t('explore'):loc(task.note);if(task.goal)for(var i=0;i<device.tools.length;i++){var tool=device.tools[i];if(Object.prototype.hasOwnProperty.call(task.goal,tool.key)){var n=task.goal[tool.key],match=round.machine[tool.key]===n;html+='<span class="dm-goal '+(match?'dm-matched':'')+'"><b>'+(match?'✓':'·')+'</b>'+esc(loc(tool.name))+': '+esc(loc(tool.states[n]))+'</span>';}}
 $('deviceGoals').innerHTML=html;$('deviceResult').textContent=preview?t('preview'):feedback||(task.goal?t(p.done?'done':'try'):'');$('deviceResult').className='dm-result'+(feedbackBad?' dm-caution':'')+(p.done&&!preview?' dm-success':'');$('deviceUndo').disabled=!round.history.length;$('deviceStopDemo').hidden=!preview;$('deviceDemo').hidden=!!preview;paintGuide();}
function act(k,value){
  if(blocked()||drawer)return false;
  stopGuide();stopDemo();
  var tool=device.tools.filter(function(item){return item.key===k;})[0];
  if(!tool)return false;
  var before=C.progress(round.machine,task).done;
  var n=value===undefined?1-round.machine[k]:value,result=C.act(round,device,k,n,prefs().settings.players);
  var praise=false;
  if(result.changed){
    feedback=loc(tool.verb)+' ← '+loc(tool.states[n]);feedbackBad=false;helpTool=null;
    var done=C.progress(round.machine,task).done;
    if(w.WonderMachine.effect)w.WonderMachine.effect(done);
    if(done&&!before){
      praise=guided()&&store.guide.enabled&&store.guide.voice&&schoolFeedback&&schoolFeedback.play({language:language},scheduleAdvance);
      if(!praise)scheduleAdvance();
    }
    save();
  }else{feedback=t(result.reason);feedbackBad=true;helpTool=guided()?null:k;}
  if(guided()&&store.guide.enabled&&store.guide.voice)guideVoiceArmed=true;
  render();if(task.goal&&!praise)speakGuide(false);
  var button=d.querySelector('[data-device-tool="'+k+'"]');
  if(button&&!button.disabled)button.focus();
  return result.changed;
}
function demo(){if(blocked())return;stopDemo();var path=guided()?G.plan(device,task,round.machine):C.plan(device,round.machine,task);if(!path.length){feedback=t(task.goal?'done':'explore');paintStatus();return;}var next=path[0],stamp=epoch;preview=C.copy(round.machine);demoTool=next.tool;paintControls();paintScene();paintStatus();timers.push(w.setTimeout(function(){if(stamp!==epoch||blocked())return;preview[next.tool]=next.value;paintControls();paintScene();paintStatus();},500));timers.push(w.setTimeout(function(){if(stamp!==epoch)return;stopDemo();render();},2300));}
function hint(){if(blocked())return;stopDemo();var path=guided()?G.plan(device,task,round.machine):C.plan(device,round.machine,task);helpTool=path.length?path[0].tool:null;feedback=helpTool?t('first')+loc(device.tools.filter(function(x){return x.key===helpTool;})[0].name):t('done');feedbackBad=false;paintControls();paintStatus();if(guided())speakGuide(true);}
function render(){prefs();var html='',i,j,total=0,all=D.devices.filter(function(x){return !!x.levels[age];});for(i=0;i<all.length;i++)for(j=0;j<all[i].tasks.length;j++){var r=store.rounds[C.key(all[i],all[i].tasks[j].id)];if(r&&C.progress(r.machine,all[i].tasks[j]).done)total++;}
 var taskCount=all.reduce(function(n,x){return n+x.tasks.length;},0);
 if(guided()){
   deviceGuidedProgress.hidden=!total;
   deviceGuidedProgress.textContent=G.labels[language].progress(total,taskCount);
 }
 var soundLabel=language==='ar'?'الصوت':'Sound';
 soundBtn.querySelector('[data-t]').textContent=guided()&&!classic?G.labels[language].effects:soundLabel;
 d.body.setAttribute('data-device-age',age);$('deviceAge').textContent=(language==='ar'?'أجهزتي · عمر ':'My panels · ages ')+age; $('deviceHeading').textContent=t('title');$('deviceIntro').textContent=t('intro');$('deviceProgress').textContent=total+' / '+taskCount+' '+t('ready');$('deviceProgress').dir='ltr';$('deviceLevels').setAttribute('aria-label',t('levels'));
 for(i=1;i<=4;i++)html+='<button type="button" data-device-level="'+i+'" aria-pressed="'+(store.level===i)+'"><strong><span class="dm-level-long">'+esc(loc(D.levels[age][i-1]))+'</span><span class="dm-level-short">'+i+' · '+(language==='ar'?(age==='1-4'?['ألمس','أرتب','أعتني','أحرك']:['البيت','العناية','الطريق','السلامة']):(age==='1-4'?['Tap','Tidy','Care','Move']:['Home','Care','Paths','Safety']))[i-1]+'</span></strong><small dir="ltr">'+C.list(age,i).length+' '+(language==='ar'?'أجهزة':'panels')+'</small></button>';
 $('deviceLevels').innerHTML=html;var buttons=$('deviceLevels').querySelectorAll('[data-device-level]');for(i=0;i<buttons.length;i++)buttons[i].onclick=function(){var attr='data-device-level',value=this.getAttribute(attr);chooseLevel(Number(value));restoreChoice(attr,value);};
 html='';var list=C.list(age,store.level);for(i=0;i<list.length;i++)html+='<button type="button" data-device-card="'+list[i].id+'" aria-pressed="'+(device.id===list[i].id)+'"><img width="100" height="56" loading="lazy" src="assets/devices/'+(list[i].photoId||list[i].id)+'-thumb.webp" alt=""><span><small>'+(i+1)+'</small>'+esc(loc(list[i].title))+'</span></button>';
 $('deviceCards').innerHTML=html;$('deviceCards').setAttribute('aria-label',t('devices'));buttons=$('deviceCards').querySelectorAll('[data-device-card]');for(i=0;i<buttons.length;i++)buttons[i].onclick=function(){var attr='data-device-card',value=this.getAttribute(attr);chooseDevice(value);restoreChoice(attr,value);};
 html='<button type="button" data-device-task="free" aria-pressed="'+(task.id==='free')+'">'+t('free')+'</button>';for(i=0;i<device.tasks.length;i++)html+='<button type="button" data-device-task="'+device.tasks[i].id+'" aria-pressed="'+(task.id===device.tasks[i].id)+'">'+(i+1)+' · '+esc(loc(device.tasks[i].title))+'</button>';
 $('deviceTasks').innerHTML=html;$('deviceTasks').setAttribute('aria-label',t('missions'));buttons=$('deviceTasks').querySelectorAll('[data-device-task]');for(i=0;i<buttons.length;i++)buttons[i].onclick=function(){var id=this.getAttribute('data-device-task');if(drawer)setDrawer('',true);chooseTask(id);startVoice();};
 $('deviceTitle').textContent=loc(device.title);$('devicePanelTitle').textContent=t('control');$('devicePhotoMode').textContent=t('photo');$('deviceDrawingMode').textContent=t('drawing');$('devicePhotoMode').setAttribute('aria-pressed',String(store.photo));$('deviceDrawingMode').setAttribute('aria-pressed',String(!store.photo));$('deviceIdea').textContent=loc(device.idea);$('deviceZoom').textContent=t(expanded?'small':'zoom');$('deviceHint').textContent=t('help');$('deviceDemo').textContent=t('demo');$('deviceStopDemo').textContent=t('mine');$('deviceUndo').textContent=t('undo');$('deviceReset').textContent=t('reset');$('devicePrevious').textContent=guided()?(language==='ar'?'→ ':'← ')+G.labels[language].previousPanel:t('previous');$('deviceNext').textContent=guided()?G.labels[language].nextPanel+(language==='ar'?' ←':' →'):t('next');$('deviceNextLevel').textContent=t('nextLevel');$('deviceSafety').textContent=t(device.safety);d.title=(guided()?(language==='ar'?'جهاز العجائب':'Wonder Machine'):t('collection'))+' | '+loc(device.title);
 if(store.photo)loadPhoto();paintControls();paintScene();paintStatus();
}
function shell(){
  $('realWorld').innerHTML=[
    '<div class="dm-intro"><span id="deviceAge" class="dm-age"></span><div><h2 id="deviceHeading" tabindex="-1"></h2><p id="deviceIntro"></p></div><span id="deviceProgress"></span></div>',
    '<nav id="deviceLevels" class="dm-levels"></nav>',
    '<nav id="deviceCards" class="dm-cards"></nav>',
    '<nav id="deviceTasks" class="dm-tasks"></nav>',
    '<section id="deviceWork" class="dm-work">',
    '<div class="dm-visual">',
    '<div class="dm-scene-header"><h3 id="deviceTitle"></h3>',
    '<div class="dm-scene-buttons"><button id="deviceChoose" type="button" aria-expanded="false" aria-controls="deviceDrawer" hidden><span id="deviceChooseFull"></span><span id="deviceChooseShort"></span></button><button id="deviceZoom" type="button" aria-expanded="false"></button><button id="deviceActions" type="button" aria-expanded="false" aria-controls="deviceDrawer" hidden></button></div></div><span id="deviceViewsSlot" hidden></span><div id="deviceViews" class="dm-views"><button id="devicePhotoMode" type="button"></button><button id="deviceDrawingMode" type="button"></button></div>',
    '<figure id="deviceFrame" class="dm-frame" role="img"><div id="deviceDrawing" class="dm-drawing"></div><div id="devicePhoto" class="dm-photo" hidden></div><span id="deviceImageNote" class="dm-image-note" hidden></span></figure><div id="deviceLinks" class="dm-links"></div><span id="deviceIdeaSlot" hidden></span><p id="deviceIdea" class="dm-idea"></p></div>',
    '<aside class="dm-console">',
    '<div class="dm-console-header"><strong id="devicePanelTitle"></strong><span id="deviceTurn"></span></div>',
    '<section id="deviceGuide" class="dm-guide" aria-labelledby="deviceGuideTitle" hidden>',
    '<div class="dm-guide-head"><div><small id="deviceGuideProgress"></small><h4 id="deviceGuideTitle" tabindex="-1"></h4></div><button id="deviceCoachToggle" type="button" aria-pressed="true"></button><button id="deviceListen" type="button"></button></div><p id="deviceGuideText" role="status" aria-live="polite"></p></section><div id="deviceControls" class="dm-controls"></div><span id="deviceToolsFooterSlot" hidden></span><div id="deviceToolsFooter" class="dm-tools-footer"><button id="deviceHint" type="button"></button><button id="deviceDemo" type="button"></button><button id="deviceStopDemo" type="button" hidden></button></div>',
    '<div class="dm-task"><h4 id="deviceTaskTitle"></h4><p id="deviceTaskNote"></p><div id="deviceGoals"></div></div><p id="deviceResult" class="dm-result" role="status" aria-live="polite"></p><span id="deviceUtilitiesSlot" hidden></span><div id="deviceUtilities" class="dm-utilities"><button id="deviceUndo" type="button"></button><button id="deviceReset" type="button"></button></div><span id="deviceSafetySlot" hidden></span><p id="deviceSafety" class="dm-safety"></p></aside></section>',
    '<nav class="dm-navigation"><button id="devicePrevious" type="button"></button><div id="deviceDock" class="dm-dock" hidden><button id="deviceAdvance" type="button"></button><button id="deviceCancelAdvance" type="button" hidden></button></div><button id="deviceNext" type="button"></button><button id="deviceNextLevel" type="button"></button></nav><p id="deviceSave" class="notice" role="status" hidden></p><div id="deviceDrawer" class="dm-drawer" hidden>',
    '<section class="dm-dialog" role="dialog" aria-modal="true" aria-labelledby="deviceDrawerTitle"><header><h3 id="deviceDrawerTitle"></h3><button id="deviceDrawerClose" type="button"></button></header><div id="deviceChoices"><p id="deviceGuidedProgress" hidden></p>',
    '<section id="deviceChoice-deviceLevels"><h4 id="deviceChooseLevelLabel"></h4></section>',
    '<section id="deviceChoice-deviceCards"><h4 id="deviceChoosePanelLabel"></h4></section>',
    '<section id="deviceChoice-deviceTasks"><h4 id="deviceChooseTaskLabel"></h4></section></div><div id="deviceOptions" hidden><p id="deviceGoalNote"></p><button type="button" id="deviceGoalAudio"></button><label><input id="deviceGuideAuto" type="checkbox"><span id="deviceGuideAutoLabel"></span></label><label><input id="deviceGuideMute" type="checkbox"><span id="deviceGuideMuteLabel"></span></label></div></section></div>'
  ].join('');
 $('devicePhotoMode').onclick=function(){stopGuide();store.photo=true;save();render();};$('deviceDrawingMode').onclick=function(){stopGuide();store.photo=false;save();render();};$('deviceHint').onclick=function(){if(drawer)setDrawer('',true);hint();};$('deviceDemo').onclick=function(){if(drawer)setDrawer('',true);stopGuide();demo();};$('deviceStopDemo').onclick=function(){stopDemo();render();};$('deviceUndo').onclick=function(){if(blocked())return;if(drawer)setDrawer('',true);stopGuide();stopDemo();C.undo(round);feedback='';feedbackBad=false;save();render();speakGuide(false);};$('deviceReset').onclick=function(){if(drawer)setDrawer('',true);resetRound();};$('deviceZoom').onclick=function(){stopGuide();expand(!expanded);render();};$('devicePrevious').onclick=function(){navigate(-1);};$('deviceNext').onclick=function(){navigate(1);};$('deviceNextLevel').onclick=function(){chooseLevel(store.level%4+1);};
 $('worldMode').onclick=function(){classic=false;stopDemo();sync();};$('classicMode').onclick=function(){classic=true;setDrawer('',false);stopGuide();expand(false);stopDemo();if(age==='1-4'&&w.WonderMachine.getState().settings.level!==1)w.WonderMachine.selectLevel(1);sync();};
}
function sync(){var previousLanguage=language,p=prefs();if(previousLanguage!==language){stopGuide();stopDemo();feedback='';}if(owner!==w.WonderMachine.owner()){setDrawer('',false);stopGuide();stopDemo();expand(false);load();}if(p.panel){setDrawer('',false);stopGuide();stopDemo();if(expanded)expand(false);}$('realWorld').hidden=classic||p.panel;$('playView').hidden=!classic||p.panel;$('modeNav').hidden=p.panel;$('legacyLevels').hidden=!classic||p.panel;d.body.setAttribute('data-wonder-mode',classic?'classic':'devices');d.body.setAttribute('data-device-settings',String(!!p.panel));d.body.classList.toggle('dm-still',!p.settings.motion||d.hidden);$('worldMode').textContent=t('collection');$('classicMode').textContent=t('original');$('worldMode').setAttribute('aria-pressed',String(!classic));$('classicMode').setAttribute('aria-pressed',String(classic));
 if(classic&&guided()){
   var taskMode=!!p.taskId;
   var earlier=language==='ar'?(taskMode?'المهمة السابقة':'العالم السابق'):(taskMode?'Previous mission':'Previous world');
   var later=language==='ar'?(taskMode?'المهمة التالية':'العالم التالي'):(taskMode?'Next mission':'Next world');
   $('previousBtn').querySelector('span').textContent=earlier;
   $('nextBtn').querySelector('span').textContent=later;
 }
 if(classic&&age==='1-4'&&p.settings.level!==1){w.WonderMachine.selectLevel(1);return;}var buttons=$('legacyLevels').querySelectorAll('[data-classic-level]');for(var i=0;i<buttons.length;i++){buttons[i].hidden=age==='1-4'&&i>0;buttons[i].textContent=(i+1)+' · '+(language==='ar'?['زر واحد','أربع أدوات','مهمات صغيرة','مهمات أكبر'][i]:['One button','Four tools','Little missions','Bigger missions'][i]);buttons[i].setAttribute('aria-pressed',String(p.settings.level===i+1));buttons[i].onclick=function(){w.WonderMachine.selectLevel(Number(this.getAttribute('data-classic-level')));};}render();}
shell();bindGuide();load();sync();w.addEventListener('resize',fitPhoto,false);w.addEventListener('wonder:render',sync,false);d.addEventListener('app360:authchange',sync,false);d.addEventListener('app360:agechange',sync,false);d.addEventListener('visibilitychange',function(){if(d.hidden){setDrawer('',false);stopGuide();stopDemo();expand(false);}sync();},false);w.addEventListener('pagehide',function(){stopGuide();stopDemo();save();},false);d.addEventListener('keydown',function(event){if(drawer){handleDrawerKey(event);return;}if((event.keyCode===27||event.key==='Escape')&&expanded){event.preventDefault();expand(false);}if(expanded&&(event.key==='Tab'||event.keyCode===9)){var nodes=visibleControls($('deviceWork'),'button:not([disabled])'),first=nodes[0],last=nodes[nodes.length-1];if(event.shiftKey&&d.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&d.activeElement===last){event.preventDefault();first.focus();}}},false);
w.WonderDevices={getState:function(){return C.copy({age:age,owner:owner,level:store.level,device:device.id,task:task.id,round:round,photo:store.photo,classic:classic,expanded:expanded,preview:preview,demoTool:demoTool});},chooseLevel:chooseLevel,chooseDevice:chooseDevice,chooseTask:chooseTask,act:act};
})(window,document);
