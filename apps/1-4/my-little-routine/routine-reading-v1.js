/* Recorded-word captions. No estimated word timings or device speech. ES5. */
(function(w,d){
'use strict';
var active=null,owner='',sentence='',enabled=false,key='',panel,words,toggle,frame=0;
function E(id){return d.getElementById(id)}
function en(){return w.APP360_ROUTINE_LANG==='en'}
function t(ar,english){return en()?english:ar}
function esc(s){return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')}
function current(){return w.APP360_RoutineReel&&w.APP360_RoutineReel.currentHabit()}
function clear(){if(!words)return;var a=d.querySelectorAll('#routineReadWords .routineReadWord,#routineChildReadWords .routineReadWord'),i;for(i=0;i<a.length;i++){a[i].className='routineReadWord';a[i].removeAttribute('aria-current')}}
function show(text,offset,lang){
 var stamp=text+'|'+offset+'|'+lang;if(stamp===sentence)return;sentence=stamp;
 words.setAttribute('lang',lang);words.setAttribute('dir',lang==='ar'?'rtl':'ltr');
 var a=String(text||'').split(/\s+/),html='',i;for(i=0;i<a.length;i++)if(a[i])html+='<span class="routineReadWord" data-word="'+(offset+i)+'">'+esc(a[i])+'</span> ';
 words.innerHTML=html;words.scrollTop=0;var child=E('routineChildReadWords');if(child){child.innerHTML=html;child.setAttribute('lang',lang);child.setAttribute('dir',lang==='ar'?'rtl':'ltr')}
}
function preview(){var h=current();if(active||!h||!words)return;var text=h.steps[frame]||h.title;
 if(E('child')&&E('child').className.indexOf('on')>=0)try{var saved=JSON.parse(w.localStorage.getItem(w.APP360_ROUTINE_STORAGE_KEY)||'null');if(saved&&saved.routine&&saved.run){var step=saved.routine.steps[saved.run.current];if(step)text=step.label}}catch(e){}
 show(text,0,en()?'en':'ar')}

function update(ms){
 if(!active||!words)return;
 var segments=active.segments||[],text=active.text||'',offset=0,i,s,chosen=segments[0]||null,start=0;
 for(i=0;i<segments.length;i++){s=segments[i];if(ms>=s.start_ms){chosen=s;start=offset}offset+=String(s.text||'').split(/\s+/).length}
 if(chosen){text=chosen.text;offset=start}else offset=0;
 if(!text&&segments.length)text=segments.map(function(x){return x.text}).join(' ');
 show(text,offset,active.language||(en()?'en':'ar'));clear();
 if(!enabled)return;
 var extra=(w.APP360_ROUTINE_WORD_CUES||{})[active.path];if(extra&&extra.sha256!==active.sha256)extra=null;
 var cues=active.cues||(extra&&extra.cues)||[],index=-1;
 for(i=0;i<cues.length;i++)if(ms>=cues[i][1]&&ms<cues[i][2]){index=cues[i][0];break}
 var matches=d.querySelectorAll('#routineReadWords [data-word="'+index+'"],#routineChildReadWords [data-word="'+index+'"]');
 for(i=0;i<matches.length;i++){var word=matches[i];word.className='routineReadWord active';word.setAttribute('aria-current','true')}
}
function begin(clip,source,ms){active=clip;owner=source;sentence='';update(ms||0)}
function stop(source){if(source&&owner!==source)return;active=null;owner='';clear()}
function visibility(){if(!panel)return;panel.hidden=!enabled;panel.style.display=enabled?'':'none';toggle.checked=enabled;E('routineReadingLayout').className='routineReadingLayout'+(enabled?' readingOn':'');var child=E('routineChildReading');if(child)child.style.display=enabled?'':'none';d.body.className=d.body.className.replace(/\s*routineSpokenTextOn/g,'')+(enabled?' routineSpokenTextOn':'');if(enabled&&!active)preview()}
function init(){
 var reel=E('habitReel');if(!reel)return;
 key='app360-routine-spoken-text-v1:'+(w.APP360_ROUTINE_AGE||'1-4');var saved=null;
 try{saved=w.localStorage.getItem(key)}catch(e){}
 enabled=saved===null?w.APP360_ROUTINE_AGE==='4-8':saved==='true';
 var bar=d.createElement('div');bar.className='routineReadControls';
 bar.innerHTML='<label for="routineReadToggle"><input id="routineReadToggle" type="checkbox"> <span>'+t('عرض النص مع الصوت','Show spoken text')+'</span></label>';
 reel.parentNode.insertBefore(bar,reel);
 var layout=d.createElement('div');layout.id='routineReadingLayout';layout.className='routineReadingLayout';reel.parentNode.insertBefore(layout,reel);layout.appendChild(reel);
 panel=d.createElement('aside');panel.id='routineReadPanel';panel.className='routineReadPanel';panel.setAttribute('aria-label',t('النص المنطوق بجانب الصور','Spoken text beside the pictures'));
 panel.innerHTML='<h3>'+t('أقرأ مع الصوت','Read with the voice')+'</h3><p id="routineReadWords" class="routineReadWords" aria-live="off"></p>';
 layout.appendChild(panel);var childHost=E('focusInstruction')&&E('focusInstruction').parentNode;if(childHost){var child=d.createElement('div');child.id='routineChildReading';child.className='routineReadChild';child.innerHTML='<p id="routineChildReadWords" class="routineReadWords" aria-live="off"></p>';childHost.insertBefore(child,E('speakStep'))}
 words=E('routineReadWords');toggle=E('routineReadToggle');
 toggle.onchange=function(){enabled=!!toggle.checked;try{w.localStorage.setItem(key,String(enabled))}catch(e){}visibility();if(!enabled)clear()};
 var api=w.APP360_RoutineReel,showFrame=api.showFrame;
 api.showFrame=function(n){frame=n;showFrame(n);preview()};
 var ids=['prevHabit','nextHabit','habitCards','categoryRail'],i;
 for(i=0;i<ids.length;i++)if(E(ids[i]))E(ids[i]).addEventListener('click',function(){w.setTimeout(function(){if(!active){frame=0;sentence='';preview()}},130)},false);
 d.addEventListener('click',function(e){var node=e.target||e.srcElement;while(node&&node!==d){if(node.id==='startRoutine'||node.id==='backBuilder'||node.id==='stopRun'||(node.getAttribute&&node.getAttribute('data-outcome'))){w.setTimeout(function(){if(!active){sentence='';preview()}},100);break}node=node.parentNode}},false);
 visibility();preview();
}
w.APP360_ROUTINE_READING={begin:begin,update:update,stop:stop,preview:preview,isEnabled:function(){return enabled}};
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',init,false);else init();
})(window,document);
