/* Small authored SVG models. No simulation result is written to the child's observations. */
(function(w,d){'use strict';
var state=null,frame=0,timerFrame=false,generation=0;
var examples={
 'float':{type:'float',ar:['بقيت الزجاجة المغلقة عند السطح.','وصلت الملعقة إلى أسفل الوعاء.'],en:['The closed bottle stayed at the surface.','The spoon reached the bottom of the container.']},
 'absorb':{type:'absorb',ar:['ظهرت بقعة مبللة داخل القماش.','بقي الماء على سطح البلاستيك.'],en:['A wet patch appeared in the cloth.','Water stayed on the plastic surface.']},
 'roll':{type:'roll',ar:['تدحرجت الكرة في النموذج.','تحرك المكعب قليلًا وبقي على وجهه المسطح.'],en:['The ball rolled in the model.','The cube moved a little and stayed on its flat face.']},
 'push':{type:'push',ar:['حرّكت الدفعة الخفيفة السيارة مسافة قصيرة.','حرّكت الدفعة الأقوى السيارة مسافة أطول.'],en:['The gentle push moved the car a short distance.','The stronger push moved the car farther.']},
 'transparent':{type:'light',ar:['مر الضوء عبر اللوح الشفاف.','حجب الورق المقوى الضوء.'],en:['Light passed through the clear sheet.','The cardboard blocked the light.']},
 'shadow-basic':{type:'shadow',ar:['ظهر ظل اللعبة عندما أضأنا المصباح.','لم يظهر ظل المصباح عندما أطفأناه.'],en:['The toy shadow appeared with the light on.','No flashlight shadow appeared with the light off.']}
};
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function tr(ar,en){return state&&state.lang==='en'?en:ar;}
function config(q){return examples[q.scene_key||q.audio_key||q.id]||null;}
function stop(){generation++;if(frame){if(timerFrame)w.clearTimeout(frame);else if(w.cancelAnimationFrame)w.cancelAnimationFrame(frame);frame=0;}if(state)state.running=false;}
function attrs(svg,selector,values){var n=svg.querySelector(selector),k;if(!n)return;for(k in values)if(Object.prototype.hasOwnProperty.call(values,k))n.setAttribute(k,String(values[k]));}
function svg(type,c){var s='<svg viewBox="0 0 360 190" role="img" aria-label="'+esc(tr('نموذج مصوّر متحرك','Animated illustrative model'))+'"><rect width="360" height="190" rx="20" fill="#edf5ef"/><path d="M20 165H340" stroke="#c4d5c9" stroke-width="4"/>';
 if(type==='float'){s+='<path d="M44 63V174H316V63" fill="#c8e7ed" stroke="#4e8f9d" stroke-width="5"/><path d="M46 96Q80 88 114 96T182 96T250 96T314 96" fill="none" stroke="#528fa2" stroke-width="3"/>';s+=c?'<g class="motion-object"><ellipse cx="0" rx="18" ry="9" fill="#66838f"/><rect x="12" y="-4" width="65" height="8" rx="4" fill="#66838f"/></g>':'<g class="motion-object"><rect x="-25" y="-13" width="65" height="26" rx="10" fill="#fff" stroke="#6fa7b2" stroke-width="3"/><rect x="40" y="-8" width="10" height="16" fill="#edb94d"/></g>';}
 else if(type==='absorb'){s+='<path d="M65 122L250 104L299 139L108 157Z" fill="'+(c?'#b2e3ed':'#deb877')+'" stroke="#7b9f9c" stroke-width="3"/><ellipse class="motion-patch" cx="180" cy="130" rx="36" ry="11" fill="#77938c" opacity="0"/><g class="motion-object"><path d="M0-21Q-21 4 0 10Q21 4 0-21" fill="#468eb1"/></g>';}
 else if(type==='roll'){s+='<g class="motion-object">'+(c?'<rect x="-23" y="-23" width="46" height="46" rx="5" fill="#e8ad4f"/><path d="M-15-14H13" stroke="#f7df9c" stroke-width="5"/>':'<circle r="24" fill="#d97956"/><path d="M-20-12Q23-15 12 20M-14 18Q-18-24 20-10" fill="none" stroke="#ffdb9d" stroke-width="4"/>')+'</g>';}
 else if(type==='push'){s+='<g class="motion-object"><rect x="-27" y="-21" width="54" height="25" rx="8" fill="#db7055"/><path d="M-18-21L-10-34H11L21-21" fill="#579ca3"/><circle cx="-15" cy="5" r="9" fill="#2e4f56"/><circle cx="15" cy="5" r="9" fill="#2e4f56"/></g><path d="M35 95H'+(c?126:91)+'M'+(c?'113 85L126 95L113 105':'78 85L91 95L78 105')+'" fill="none" stroke="#73967c" stroke-width="5"/>';}
 else if(type==='light'){s+='<rect x="316" y="31" width="12" height="136" rx="5" fill="#c5d0ce"/><path class="motion-beam" d="M65 94L172 62V139Z" fill="#f7d984" opacity="0"/><path class="motion-through" d="M186 60L315 38V165L186 140Z" fill="#f7d984" opacity="0"/><rect x="172" y="47" width="15" height="111" rx="4" fill="'+(c?'#bc9464':'#b5d9df')+'" stroke="#759da4" stroke-width="3"/><ellipse class="motion-spot" cx="318" cy="101" rx="6" ry="50" fill="#fff3aa" opacity="0"/><rect x="28" y="82" width="39" height="28" rx="6" fill="#427e85"/>';}
 else if(type==='shadow'){s+='<rect x="300" y="25" width="35" height="141" rx="6" fill="#d3dbd6"/><path class="motion-beam" d="M69 106L300 40V161Z" fill="#f9e6a3" opacity="0"/><path class="motion-shadow" d="M301 78H330V156H301Z" fill="#617877" opacity="0"/><rect x="169" y="92" width="36" height="69" rx="5" fill="#e3ad4c"/><rect x="30" y="92" width="42" height="26" rx="6" fill="'+(c?'#81928c':'#3c7d85')+'"/>';}
 return s+'</svg>';}
function paint(p){var box=d.getElementById('wonderMotionDiagram'),node=box&&box.querySelector('svg');if(!node||!state)return;var c=state.condition,type=state.config.type,y,hit,remaining;state.progress=p;
 if(type==='float'){y=35+(c?112:48)*p;attrs(node,'.motion-object',{transform:'translate(150 '+y.toFixed(2)+')'});}
 else if(type==='absorb'){hit=Math.min(1,p/.65);remaining=Math.max(0,(p-.65)/.35);attrs(node,'.motion-object',{transform:'translate(180 '+(35+85*hit).toFixed(2)+')',opacity:c?1:1-remaining});attrs(node,'.motion-patch',{opacity:c?0:remaining});}
 else if(type==='roll')attrs(node,'.motion-object',{transform:'translate('+(65+(c?28:230)*p).toFixed(2)+' 140) rotate('+(c?0:550*p).toFixed(2)+')'});
 else if(type==='push')attrs(node,'.motion-object',{transform:'translate('+(65+(c?230:105)*p).toFixed(2)+' 150)'});
 else if(type==='light'){attrs(node,'.motion-beam',{opacity:p*.8});attrs(node,'.motion-through',{opacity:c?0:p*.6});attrs(node,'.motion-spot',{opacity:c?0:p});}
 else if(type==='shadow'){attrs(node,'.motion-beam',{opacity:c?0:p*.7});attrs(node,'.motion-shadow',{opacity:c?0:p});}
}
function status(text){var n=d.getElementById('wonderMotionStatus');if(n)n.textContent=text;}
function panel(q,owner,lang){var cfg=config(q);if(!cfg)return '';if(!state||state.owner!==owner||state.key!==(q.scene_key||q.audio_key||q.id)){stop();state={owner:owner,key:q.scene_key||q.audio_key||q.id,config:cfg,condition:0,done:false,progress:0,running:false};}state.lang=lang;var c=state.condition,html='<details class="motion-lab"><summary>'+tr('جرّب بالرسم المتحرك','Try the animated model')+'</summary><p>'+tr('بدّل الحالة، ثم شغّل الحركة وقارن.','Change the condition, play and compare.')+'</p><div class="motion-conditions row">',i;
 for(i=0;i<2;i++)html+='<button data-do="motion-condition" data-value="'+i+'" aria-pressed="'+String(c===i)+'"'+(c===i?' class="selected"':'')+'>'+esc(q.conditions[i][lang]||q.conditions[i].ar)+'</button>';
 return html+'</div><div class="motion-diagram" id="wonderMotionDiagram">'+svg(cfg.type,c)+'</div><div class="row"><button class="primary" data-do="motion-run">'+tr('شغّل الحركة','Play motion')+'</button><button data-do="motion-reset">'+tr('أعد إلى البداية','Back to start')+'</button></div><p id="wonderMotionStatus" class="motion-status" role="status">'+(state.done?esc(cfg[lang][c]):tr('اختر الحالة وتوقع ما سيحدث.','Choose a condition and predict what will happen.'))+'</p><small>'+tr('رسم تعليمي مبسّط، وليس قياسًا للواقع. لا يملأ ملاحظتك ولا يحكم عليها.','An illustrative model, not a real measurement. It does not fill in or grade your observation.')+'</small></details>';
}
function mount(){if(state)paint(state.done?1:0);}
function handle(cmd,value){if(!state)return;if(cmd==='motion-condition'){stop();state.condition=Number(value)===1?1:0;state.done=false;state.progress=0;return 'render';}if(cmd==='motion-reset'){stop();state.done=false;paint(0);status(tr('عدنا إلى البداية. ما توقعك الآن؟','Back at the start. What do you predict now?'));return;}
 if(cmd!=='motion-run')return;stop();state.done=false;paint(0);var reduced=false;try{reduced=!!(w.matchMedia&&w.matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(e){}var token=generation,start=Date.now();state.running=true;status(tr('نراقب ما يحدث…','Watch what happens…'));function finish(){state.done=true;state.running=false;frame=0;paint(1);status(state.config[state.lang][state.condition]+(reduced?tr(' عُرضت النتيجة دون حركة بحسب إعداد الجهاز.',' Result shown without motion, following device settings.'):''));}
 function step(){if(token!==generation||!state||!d.getElementById('wonderMotionDiagram'))return;var p=Math.min(1,(Date.now()-start)/1800);paint(p);if(p===1){finish();return;}schedule();}
 function schedule(){timerFrame=!w.requestAnimationFrame;frame=timerFrame?w.setTimeout(step,30):w.requestAnimationFrame(step);}
 if(reduced)finish();else schedule();
}
w.WONDER_MOTION={supports:function(q){return !!config(q);},panel:panel,mount:mount,handle:handle,stop:stop,debug:function(){return state?{key:state.key,condition:state.condition,progress:state.progress,done:state.done,running:state.running}:null;}};
}(window,document));
