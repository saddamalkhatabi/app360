(function(w,d){'use strict';
var current=null,focused=null;
function stop(){if(current){current.pause();current=null}if(focused){focused.style.outline='';focused=null}}
function play(clip,element){if(!clip||clip.render_status!=='rendered_and_verified')return false;
 stop();if(!w.Audio)return false;current=new w.Audio(clip.path.replace('apps/1-4/plan-runner-360/',''));
 if(element){focused=element;focused.style.outline='3px solid orange'}
 current.onended=stop;current.onerror=stop;current.play();return true}
w.SilmaCoachPreview={status:'awaiting-recordings',play:play,stop:stop};
})(window,document);
