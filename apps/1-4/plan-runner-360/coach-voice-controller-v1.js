(function(w,d){'use strict';
var items={},clip=null,ready=false,selectedId='';
function E(id){return d.getElementById(id)}
function put(id,value){var n=E(id);if(n)n.textContent=value}
function status(value){put('silmaCoachInfo',value)}
function audioReady(x){return !!(w.SilmaCoachManifest&&w.SilmaCoachManifest.audioReady(x))}
function target(){var runner=E('runner'),running=runner&&!runner.hidden,focus=clip&&clip.focus||'';
 if(running){if(focus==='next-button')return E('nextBtn');if(focus==='pause-button')return E('pauseBtn');if(focus==='finish')return E('stopBtn');
 return focus.indexOf('plan-step:')===0?E('runStepTitle'):E('runPlanTitle')}
 return E('silmaCoachPanel')}
function controls(){var active=audioReady(clip),p=E('silmaCoachPlay'),s=E('silmaCoachStop');
 if(p)p.disabled=!active;if(s)s.disabled=!active;
 put('silmaCoachText',clip?clip.text:'اختر خطة أو خطوة لمراجعة نص الإرشاد.');
 if(!ready){status('جارٍ قراءة فهرس التعليمات الصوتية…');return}
 if(!clip){status('لا يوجد نص صوتي لهذه الخطوة في حصة العامل الرابع.');return}
 status(active?'تسجيل SILMA متاح للمعاينة.':'نص إرشادي تجريبي فقط؛ لم يتم توليد ملف SILMA أو اعتماده بعد.')}
function play(){if(!audioReady(clip))return false;return w.SilmaCoachPreview.play(clip,target())}
function select(id,opts){selectedId=id||'';w.SilmaCoachPreview.stop();clip=items[selectedId]||null;controls();
 if(opts&&opts.autoplay&&E('silmaCoachAuto')&&E('silmaCoachAuto').checked)play();
 return !!clip}
function boot(){var panel=E('silmaCoachPanel');if(!panel)return;
 var p=E('silmaCoachPlay'),s=E('silmaCoachStop');
 if(p)p.onclick=function(){play()};if(s)s.onclick=function(){w.SilmaCoachPreview.stop();controls()};
 w.SilmaCoachPreview.onstatechange=function(state){if(state==='play-blocked')status('منع المتصفح التشغيل التلقائي؛ اضغط استمع للتعليمات.');
 else if(state==='audio-error')status('تعذر تشغيل الملف الصوتي. يمكنك متابعة الجلسة دون صوت.');
 else if(state==='playing')status('يعمل صوت SILMA مع إضاءة العنصر المرتبط بالتعليمة.');
 else if(state==='ended')controls()};
 w.SilmaCoachUI={select:select,play:play,stop:function(){w.SilmaCoachPreview.stop()},getSelected:function(){return selectedId}};
 controls();w.SilmaCoachManifest.load(function(data,error){ready=true;if(!data){status('فهرس الصوت غير متاح ('+(error||'unknown')+').');return}
 var a=data.items||[];for(var i=0;i<a.length;i++)items[a[i].clip_id]=a[i];
 select(selectedId||'plan-runner-360:shared:coach-welcome');
 var count=0;for(i=0;i<a.length;i++)if(audioReady(a[i]))count++;
 if(!count)status('التسجيلات غير مولدة بعد؛ يمكنك مراجعة نص الإرشاد فقط، دون تشغيل صوت بديل.')})}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,false);else boot();
})(window,document);
