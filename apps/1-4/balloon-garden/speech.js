/* One cancellable recorded-audio lane, shared by discovery and future coach routes. */
(function(w){'use strict';
function cueIndex(cues,time){for(var i=0;i<cues.length;i++)if(time>=cues[i][1]&&time<cues[i][2])return cues[i][0];return -1;}
function create(hooks){var serial=0,audio=null,tick=0,deadline=0;hooks=hooks||{};
 function clear(){w.clearInterval(tick);w.clearTimeout(deadline);tick=deadline=0;if(audio){audio.onended=audio.onerror=audio.ontimeupdate=audio.onpause=null;audio.pause();if(audio.parentNode)audio.parentNode.removeChild(audio);audio=null;}}
 function stop(){serial++;clear();if(hooks.word)hooks.word(-1);}
 function play(queue){stop();var id=serial,pos=0;
  function fail(){if(id!==serial)return;stop();if(hooks.error)hooks.error();}
  function next(){if(id!==serial)return;clear();if(pos>=queue.length){if(hooks.word)hooks.word(-1);if(hooks.done)hooks.done();return;}var row=queue[pos++];if(!row.audio){next();return;}audio=new w.Audio(row.audio);audio.preload='none';audio.volume=.92;if(hooks.attach)hooks.attach(audio);var playing=audio;function rowFail(){if(id===serial&&audio===playing)fail();}if(hooks.line)hooks.line(row);
   function update(){if(id!==serial||audio!==playing)return;if(hooks.word)hooks.word(row.cues?cueIndex(row.cues,audio.currentTime*1000):(row.words&&row.words.length===1?0:-1));}
   audio.onended=function(){if(id===serial&&audio===playing)next();};audio.onerror=rowFail;audio.onpause=function(){if(id===serial&&audio===playing&&!playing.ended){stop();if(hooks.cancel)hooks.cancel();}};audio.ontimeupdate=update;tick=w.setInterval(update,40);deadline=w.setTimeout(rowFail,(row.duration_ms||30000)+10000);
   try{var p=audio.play();if(p&&p.catch)p.catch(rowFail);if(hooks.started)hooks.started();}catch(e){rowFail();}update();
  }next();
 }
 return{play:play,stop:stop,isPlaying:function(){return !!audio&&!audio.paused;}};
}
w.BalloonFarmSpeech={create:create,cueIndex:cueIndex};
})(window);
