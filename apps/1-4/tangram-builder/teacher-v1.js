'use strict';
(function(){
/* ES5/Canvas teaching overlay. Demonstration never mutates puzzle progress. */
var hint=d.getElementById('hintBtn'),teacher=d.getElementById('teacherBtn'),listen=d.getElementById('instructionsBtn'),cb=d.getElementById('directGuideToggle');
var winHint=d.getElementById('winHintBtn');
var active=false,run=0,frame=0,timer=0,voice=null,voiceTimer=0,done={},ghost=null,hand=null;
var lines={intro:'شاهد كيف نركب الأشكال.',pick:'نختار قطعة من هنا.',move:'نسحب القطعة إلى مكانها في الشكل.',place:'نضع القطعة هنا.',turn:'الآن دورك. اختر قطعة، وجرب بنفسك.',instructions:'اختر قطعة من الأدوات. اسحبها إلى مكانها في الشكل، ثم اتركها. الدائرة البيضاء تساعدك عندما يكون التلميح مفعلاً.',hintOn:'التلميح مفعّل. الدائرة البيضاء تدلك على مكان القطعة.',hintOff:'أوقفنا التلميح. جرب تركيب القطعة دون الدائرة البيضاء.'};
function syncHint(){hint.setAttribute('aria-pressed',settings.directGuide?'true':'false');hint.innerHTML=settings.directGuide?'تلميح: مفعّل':'تلميح: متوقف';winHint.setAttribute('aria-pressed',settings.directGuide?'true':'false');winHint.textContent=hint.textContent;cb.checked=!!settings.directGuide;hints=1;S('app360:a1-tangram:directGuide',settings.directGuide?'1':'0')}
function stopVoice(){if(w.APP360_PLAY_MUSIC)w.APP360_PLAY_MUSIC.release('narration');clearTimeout(voiceTimer);if(voice){voice.onended=voice.onerror=null;voice.pause();voice=null}}
function say(id,next){w.APP360_TANGRAM_TEACHER.phase=id;stopVoice();showMsg(lines[id],'',0);if(!soundEnabled){timer=setTimeout(function(){if(next)next()},900);return}if(w.APP360_PLAY_MUSIC)w.APP360_PLAY_MUSIC.block('narration');var finished=false,a=new Audio('audio/teacher/'+id+'.mp3?v=2');voice=a;function finish(){if(finished)return;finished=true;if(w.APP360_PLAY_MUSIC)w.APP360_PLAY_MUSIC.release('narration');clearTimeout(voiceTimer);a.onended=a.onerror=null;if(voice===a)voice=null;if(next)next()}
 a.onended=finish;a.onerror=function(){showMsg(lines[id]+' — تعذر تشغيل الصوت، اضغط اسمع التعليمات للمحاولة.','',0);finish()};voiceTimer=setTimeout(function(){a.pause();finish()},id==='instructions'?60000:20000);try{var p=a.play();if(p&&p.catch)p.catch(finish)}catch(e){finish()}}
function stop(){if(w.APP360_PLAY_MUSIC)w.APP360_PLAY_MUSIC.release('trainer');if(w.App360Celebration)w.App360Celebration.stop();run++;active=false;clearTimeout(timer);caf(frame);frame=0;stopVoice();ghost=null;hand=null;done={};teacher.setAttribute('aria-pressed','false');teacher.innerHTML='<img src="../../../assets/ui-icons/family-teacher.svg" alt="">مدربة الروضة';draw()}
function circle(x,y,size){ctx.save();ctx.beginPath();ctx.arc(x,y,Math.max(11,Math.min(19,size*.20)),0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.strokeStyle='#79512f';ctx.lineWidth=2;ctx.stroke();ctx.restore()}
function drawHand(x,y){ctx.save();ctx.translate(x,y);ctx.scale(1.15,1.15);ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(0,-22);ctx.bezierCurveTo(0,-29,9,-29,9,-22);ctx.lineTo(9,-7);ctx.bezierCurveTo(13,-13,18,-10,18,-5);ctx.bezierCurveTo(24,-10,28,-5,27,0);ctx.bezierCurveTo(35,-3,37,4,34,14);ctx.lineTo(29,29);ctx.lineTo(8,29);ctx.bezierCurveTo(1,22,-7,13,-10,7);ctx.bezierCurveTo(-13,0,-7,-4,0,4);ctx.closePath();ctx.fillStyle='#ffe1bb';ctx.strokeStyle='#68462b';ctx.lineWidth=2.5;ctx.shadowColor='rgba(0,0,0,.25)';ctx.shadowBlur=5;ctx.fill();ctx.stroke();ctx.restore()}
var baseDraw=draw;draw=function(){baseDraw();if(!active)return;var i,p;for(i=0;i<pieces.length;i++){p=pieces[i];if(done[p.id])drawPiece(ctx,p,p.tx,p.ty,p.color,1,2.2)}if(ghost){p=ghost.p;if(settings.directGuide)circle(p.tx,p.ty,p.size);drawPiece(ctx,p,ghost.x,ghost.y,p.color,.97,2.5)}if(hand)drawHand(hand.x,hand.y)};
function start(){if(active){stop();showMsg('الآن دورك. جرب بنفسك.','',0);return}if(drag){showMsg('أكمل وضع القطعة أو اضغط إعادة، ثم افتح المدربة.','',0);return}unlockAudio();stop();active=true;if(w.APP360_PLAY_MUSIC)w.APP360_PLAY_MUSIC.block('trainer');var token=run;teacher.setAttribute('aria-pressed','true');teacher.innerHTML='<img src="../../../assets/ui-icons/family-teacher.svg" alt="">إيقاف العرض';
 var remaining=[],i;for(i=0;i<pieces.length;i++)if(!pieces[i].placed)remaining.push(pieces[i]);if(!remaining.length){stop();showMsg('اكتمل الشكل. اختر شكلاً آخر لتشاهد المدربة.','',0);return}
 function valid(){return active&&token===run}function later(fn,ms){timer=setTimeout(function(){if(valid())fn()},ms)}
 function step(index){if(!valid())return;if(index>=remaining.length){later(function(){stop();say('turn')},950);return}var p=remaining[index],stack=null,j;for(j=0;j<trayStacks.length;j++)if(trayStacks[j].members.indexOf(p.id)>=0){stack=trayStacks[j];break}if(!stack){stop();return}
 hand={x:stack.x,y:stack.y};draw();say('pick',function(){if(!valid())return;ghost={p:p,x:stack.x,y:stack.y};var started=Date.now(),motionEnded=false,speechEnded=false;function finish(){if(!valid()||!motionEnded||!speechEnded)return;done[p.id]=true;ghost=null;hand={x:p.tx,y:p.ty};draw();say('place',function(){if(valid())later(function(){step(index+1)},400)})}
 say('move',function(){speechEnded=true;finish()});function move(){if(!valid())return;var t=Math.min(1,(Date.now()-started)/2200),ease=t*t*(3-2*t);ghost.x=stack.x+(p.tx-stack.x)*ease;ghost.y=stack.y+(p.ty-stack.y)*ease;hand={x:ghost.x,y:ghost.y};draw();if(t<1)frame=raf(move);else{motionEnded=true;finish()}}move()})}
 say('intro',function(){if(valid())step(0)})}
 hint.onclick=function(){stop();settings.directGuide=!settings.directGuide;syncHint();draw();unlockAudio();say(settings.directGuide?'hintOn':'hintOff')};
 winHint.onclick=hint.onclick;
 var oldChange=cb.onchange;cb.onchange=function(){stop();if(oldChange)oldChange();syncHint();draw()};
 var oldSave=d.getElementById('saveSettingsBtn').onclick;d.getElementById('saveSettingsBtn').onclick=function(){if(oldSave)oldSave();syncHint()};
 var oldReset=d.getElementById('resetSettingsBtn').onclick;d.getElementById('resetSettingsBtn').onclick=function(){if(oldReset)oldReset();syncHint()};
 d.addEventListener('click',function(e){var el=e.target;while(el&&el!==d.body){if(el.tagName==='BUTTON'){if(el!==teacher&&el!==listen&&el!==hint)stop();return}el=el.parentNode}},true);
 teacher.onclick=start;listen.onclick=function(){stop();unlockAudio();say('instructions')};
 function guard(fn){return function(){stop();return fn.apply(this,arguments)}}
 refresh=guard(refresh);resetPuzzle=guard(resetPuzzle);size=guard(size);openPanel=guard(openPanel);
 var sound=d.getElementById('soundBtn'),oldSound=sound.onclick;sound.onclick=function(){stop();oldSound()};
 function touchBoard(e){if(!active||e.target!==canvas)return;stop();showMsg('الآن دورك. اختر قطعة وجرب.','',0);if(e.cancelable!==false)e.preventDefault();e.stopPropagation()}
 d.addEventListener('mousedown',touchBoard,true);d.addEventListener('touchstart',touchBoard,true);
 d.addEventListener('keydown',function(e){if((e.keyCode||e.which)===27)stop()},false);d.addEventListener('visibilitychange',function(){if(d.hidden)stop()},false);w.addEventListener('pagehide',stop,false);w.addEventListener('blur',stop,false);
 w.APP360_TANGRAM_TEACHER={phase:'ready',stop:stop,isActive:function(){return active},isSpeaking:function(){return !!voice}};
 syncHint();draw();
})();
