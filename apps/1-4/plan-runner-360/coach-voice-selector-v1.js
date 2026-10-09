(function(w,d){'use strict';
var selected='',last='';
function E(id){return d.getElementById(id)}
function boot(){var list=E('presetList');if(list&&list.addEventListener)list.addEventListener('click',function(e){
 var n=e.target||e.srcElement,id='';
 while(n&&n!==list){if(n.getAttribute&&n.getAttribute('data-id')){id=n.getAttribute('data-id');break}n=n.parentNode}
 if(id&&w.SilmaCoachUI){selected=id;w.SilmaCoachUI.select('plan-runner-360:'+id+':intro')}},false);
 w.setInterval(function(){var r=E('runner'),p=E('runProgress'),t=E('runStepTitle');if(!r||r.hidden||!w.SilmaCoachUI)return;
 var index=p?parseInt(p.textContent,10):0,key=selected+'|'+index+'|'+(t?t.textContent:'');
 if(last===key)return;last=key;
 w.SilmaCoachPreview.stop();
 w.SilmaCoachUI.select(selected&&index>0?'plan-runner-360:'+selected+':step-'+index:'plan-runner-360:shared:coach-next')},750)}
if(d.readyState==='loading')d.addEventListener('DOMContentLoaded',boot,false);else boot();
})(window,document);
