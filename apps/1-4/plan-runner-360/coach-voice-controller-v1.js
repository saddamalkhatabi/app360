(function(w,d){'use strict';
var items={},clip=null;
function byId(id){return d.getElementById(id)}
function show(s){byId('silmaCoachInfo').textContent=s}
function select(id){clip=items[id]||null;byId('silmaCoachPlay').disabled=!(clip&&clip.render_status==='rendered_and_verified')}
function boot(){var btn=byId('silmaCoachPlay');if(!btn)return;
 btn.onclick=function(){if(clip)w.SilmaCoachPreview.play(clip,byId('runStepTitle'))};
 w.SilmaCoachManifest.load(function(data){if(!data){show('فهرس الصوت غير متاح');return}
 var a=data.items||[];for(var i=0;i<a.length;i++)items[a[i].clip_id]=a[i];
 select('plan-runner-360:shared:coach-welcome');
 show('النصوص مجهزة والتسجيلات لم تنتج بعد')});
 w.SilmaCoachUI={select:select};
}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,false);else boot();
})(window,document);
