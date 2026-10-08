/* Small, reusable SVG experiment player. Screen-rule demonstrations, not material physics. ES5. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory();else root.MAKER_SIMULATION=factory();}(this,function(){
'use strict';
var scripts={
 book:[['نجهّز الكتاب الخفيف فوق الحامل.','Place the light book above the stand.'],['نضع الكتاب ثم نرفع اليد. راقب ثباته.','Put down the book and lift your hand. Watch its balance.'],['هل بقي الكتاب ثابتًا؟ انظر إلى موضعه.','Did the book stay steady? Look at its position.']],
 house:[['نضع الدمية أمام الباب.','Place the figure in front of the door.'],['نحرك الدمية نحو الباب دون دفع.','Move the figure toward the door without pushing.'],['هل دخلت الدمية؟ قارن حجمها بالباب.','Did the figure enter? Compare it with the door.']],
 track:[['نضع الكرة في بداية المسار.','Place the ball at the start of the ramp.'],['نترك الكرة تتحرك. تابع طريقها إلى الأسفل.','Release the ball. Follow it down the ramp.'],['أين وصلت الكرة؟ قارنها بدائرة الوصول.','Where did the ball land? Compare it with the target.']],
 box:[['نجهّز نوعين من الألعاب خارج العلبة.','Prepare two kinds of toys outside the box.'],['نضع كل نوع في مكانه ثم نحرك العلبة قليلًا.','Put each kind in its place, then gently move the box.'],['هل بقي النوعان منفصلين؟ انظر إلى الحاجز.','Did the two kinds stay apart? Look at the divider.']],
 bridge:[['نضع اللعبة الخفيفة عند بداية الجسر.','Put the light toy at the start of the bridge.'],['نحرك اللعبة فوق الجسر. راقب الورق والدعامات.','Move the toy across the bridge. Watch the paper and supports.'],['هل بقي الجسر حاملًا للعبة؟','Did the bridge keep supporting the toy?']],
 drawing:[['نضع الرسمة داخل الغلاف.','Put the drawing inside the sleeve.'],['نحرك الرسمة قليلًا ونحاول إخراجها برفق.','Gently move the drawing and try to take it out.'],['هل بقيت الرسمة محفوظة وظاهرة؟','Did the drawing stay protected and visible?']]
};
function clamp(n){return Math.max(0,Math.min(1,n));}
function lerp(a,b,t){return a+(b-a)*clamp(t);}
function frame(id,d,result,p){if(!scripts[id])throw Error('project');p=clamp(p);var action=clamp((p-.15)/.65),observe=clamp((p-.72)/.28),ok=result.conditions[0],stage=p<.15?0:p<.8?1:2,x=0,y=0,angle=0,transform='',bend=null;
 switch(id){
 case'book':y=260-(60+d.back*35)-lerp(75,0,action);x=300+(ok?0:lerp(0,90,observe));angle=ok?-8:lerp(-8,35,observe);transform='translate('+x+' '+y+') rotate('+angle+')';break;
 case'house':x=lerp(115,ok?300:210,action);transform='translate('+x+' 230)';break;
 case'track':var startY=205-d.slope*47-20;if(action<.75){x=lerp(110,455,action/.75);y=lerp(startY,250,action/.75);}else{x=lerp(455,445+d.slope*35,(action-.75)/.25);y=lerp(250,255,(action-.75)/.25);}transform='translate('+x+' '+y+')';break;
 case'box':x=lerp(-90,0,action)+(ok?0:lerp(0,30,observe));y=lerp(-90,0,action);angle=stage===1&&action>.7?Math.sin(action*32)*3:0;transform='translate('+x+' '+y+') rotate('+angle+' 300 230)';break;
 case'bridge':var length=180+d.span*60,left=300-length/2;x=ok?lerp(left-30,left+length+25,action):lerp(left-30,300,action);y=ok?0:lerp(0,52,observe);transform='translate('+(x-300)+' '+y+')';if(!ok)bend='M'+left+' 230 Q300 '+lerp(244,290,observe)+' '+(left+length)+' 230';break;
 case'drawing':x=stage===0?-35:lerp(-35,0,action);if(stage===2)x=ok&&(d.opening>=1)?lerp(0,40,observe):Math.sin(observe*12)*5;y=ok?0:lerp(0,20,observe);transform='translate('+x+' '+y+')';break;
 }
 return {progress:p,stage:stage,caption:scripts[id][stage],transform:transform,bend:bend,complete:p>=1};
}
function create(options){var elapsed=0,duration=6000,last=0,handle=null,running=false,disposed=false,notifyStage=-1,win=options.window,raf=win.requestAnimationFrame||function(fn){return win.setTimeout(function(){fn(Date.now());},40);},cancel=win.cancelAnimationFrame||win.clearTimeout;
 function paint(){var f=frame(options.id,options.design,options.result,elapsed/duration);options.paint(f);if(f.stage!==notifyStage){notifyStage=f.stage;if(options.stage)options.stage(f);}return f;}
 function pause(){running=false;if(handle!==null)cancel.call(win,handle);handle=null;last=0;}
 function tick(time){handle=null;if(!running||disposed)return;if(last)elapsed=Math.min(duration,elapsed+Math.min(100,time-last));last=time;var f=paint();if(f.complete){pause();if(options.complete)options.complete(f);return;}handle=raf.call(win,tick);}
 function play(){if(disposed)return;if(elapsed>=duration)elapsed=0;pause();running=true;paint();handle=raf.call(win,tick);}
 function seek(p){if(disposed)return;pause();elapsed=clamp(p)*duration;var f=paint();if(f.complete&&options.complete)options.complete(f);}
 return {play:play,pause:pause,seek:seek,step:function(dir){var p=elapsed/duration,stops=[0,.15,.8,1],i;if(dir>0){for(i=0;i<stops.length;i++)if(stops[i]>p+.001){seek(stops[i]);return;}}else{for(i=stops.length-1;i>=0;i--)if(stops[i]<p-.001){seek(stops[i]);return;}}},state:function(){return{progress:elapsed/duration,running:running,disposed:disposed};},destroy:function(){pause();disposed=true;},init:paint};
}
return {version:1,scripts:scripts,frame:frame,create:create};
}));
