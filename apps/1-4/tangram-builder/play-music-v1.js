'use strict';
(function(w,d){var music=w.APP360_PLAY_MUSIC;if(!music)return;
music.configure({pack:'children-1-8',storageKey:'app360:a1-tangram:music',defaultEnabled:true,volume:.18});music.setMasterEnabled(soundEnabled);
var button=d.getElementById('musicBtn'),select=d.getElementById('musicTrack'),range=d.getElementById('musicVolume'),effectTimer=0;
var tracks=w.APP360_MUSIC_PACKS['children-1-8'].tracks,i;for(i=0;i<tracks.length;i++){var opt=d.createElement('option');opt.value=tracks[i].id;opt.text=tracks[i].label_ar;select.appendChild(opt)}
music.onChange(function(s){button.setAttribute('aria-pressed',s.enabled?'true':'false');button.textContent=s.enabled?'موسيقى: مفعّلة':'موسيقى: متوقفة';range.value=Math.round(s.volume*100);d.getElementById('musicVolumeValue').textContent=Math.round(s.volume*100)+'%'});
button.onclick=function(){music.unlock();music.setEnabled(!music.state().enabled)};
var selected=G('app360:a1-tangram:music:track','auto');for(i=0;i<select.options.length;i++)if(select.options[i].value===selected)select.value=selected;if(select.value!=='auto')music.select(select.value);
select.onchange=function(){S('app360:a1-tangram:music:track',this.value);if(this.value==='auto')music.next();else music.select(this.value)};range.oninput=function(){music.setVolume(Number(this.value)/100)};
function gesture(){music.unlock()}d.addEventListener('mousedown',gesture,true);d.addEventListener('touchstart',gesture,true);
var oldSound=d.getElementById('soundBtn').onclick;d.getElementById('soundBtn').onclick=function(){oldSound();music.setMasterEnabled(soundEnabled)};
var oldTone=tone;tone=function(freq,dur,vol){if(soundEnabled){music.block('effect');clearTimeout(effectTimer);effectTimer=setTimeout(function(){music.release('effect')},(dur||90)+250)}return oldTone(freq,dur,vol)};
var oldWin=stageWin;stageWin=function(){music.block('win');return oldWin()};
function afterRefresh(){music.release('win');music.setMasterEnabled(soundEnabled);if(select.value==='auto')music.next()}
var oldRefresh=refresh;refresh=function(){var r=oldRefresh.apply(this,arguments);afterRefresh();return r};
var oldReset=resetPuzzle;resetPuzzle=function(){var r=oldReset.apply(this,arguments);afterRefresh();return r};
// Existing onclick handlers retain older reset function references.
var ids=['resetBtn','replayBtn','nextBtn','nextPuzzleBtn'];for(i=0;i<ids.length;i++)(function(el){var fn=el.onclick;el.onclick=function(){var r=fn.apply(this,arguments);if(!won&&music.state().blocked.indexOf('win')>=0)afterRefresh();return r}})(d.getElementById(ids[i]));
var originalPlay=w.App360Celebration.play,originalStop=w.App360Celebration.stop;
w.App360Celebration.play=function(options,done){music.block('praise');return originalPlay(options,function(ok){music.release('praise');if(done)done(ok)})};
w.App360Celebration.stop=function(){originalStop();music.release('praise')};
d.addEventListener('app360:authchange',function(){music.release('praise')},false);
var oldOpen=openPanel;openPanel=function(id){music.block('panel');return oldOpen(id)};var oldClose=closePanel;closePanel=function(id){var r=oldClose(id),panels=d.getElementsByClassName('panel'),visible=false;for(var n=0;n<panels.length;n++)if(panels[n].getAttribute('aria-hidden')==='false')visible=true;if(!visible)music.release('panel');return r};
var originalSize=size;size=function(){if((' '+d.body.className+' ').indexOf(' shapeFocus ')>=0){var bar=d.querySelector('.missionBar'),app=d.getElementById('app');wrap.style.setProperty('top',Math.ceil(bar.getBoundingClientRect().bottom-app.getBoundingClientRect().top+8)+'px','important')}else wrap.style.removeProperty('top');return originalSize.apply(this,arguments)};
})(window,document);
