/* Shared opt-in-per-app music engine, ES5. Speech/effects hold independent locks. */
(function(w,d){'use strict';if(w.APP360_PLAY_MUSIC)return;
var base='',scripts=d.getElementsByTagName('script'),i;for(i=0;i<scripts.length;i++){var src=scripts[i].src||'',at=src.indexOf('/resources/play-music/player-v1.js');if(at>=0)base=src.slice(0,at)+'/resources/play-music/'}
var pack=null,key='',enabled=true,master=true,unlocked=false,locks={},audio=null,index=-1,order=[],resumeTimer=0,serial=0,volume=.18,listeners=[],failed=0;
function saved(k,fallback){try{var v=w.localStorage.getItem(k);return v===null?fallback:v}catch(e){return fallback}}
function save(k,v){try{w.localStorage.setItem(k,String(v))}catch(e){}}
function notify(){var s=state();for(var j=0;j<listeners.length;j++)listeners[j](s)}
function state(){var held=[];for(var k in locks)if(locks.hasOwnProperty(k)&&locks[k])held.push(k);return{enabled:enabled,master:master,unlocked:unlocked,blocked:held,playing:!!(audio&&!audio.paused),track:index>=0&&pack?pack.tracks[index]:null,volume:volume}}
function canPlay(){var s=state();return pack&&enabled&&master&&unlocked&&!d.hidden&&!s.blocked.length}
function pause(){serial++;clearTimeout(resumeTimer);if(audio)audio.pause();notify()}
function shuffle(){order=[];for(var n=0;n<pack.tracks.length;n++)if(n!==index)order.push(n);for(var j=order.length-1;j>0;j--){var k=Math.floor(Math.random()*(j+1)),v=order[j];order[j]=order[k];order[k]=v}}
function pick(){if(!order.length)shuffle();index=order.length?order.pop():0}
function load(){if(audio){audio.onended=audio.onerror=null;audio.pause()}if(index<0)pick();audio=new w.Audio(base+pack.id+'/'+pack.tracks[index].path);audio.preload='none';audio.loop=true;audio.volume=volume;audio.onplay=audio.onpause=notify;audio.onerror=function(){if(++failed>=pack.tracks.length){pause();return}pick();load();sync()}}
function sync(){clearTimeout(resumeTimer);if(!canPlay()){pause();return}var token=++serial;resumeTimer=setTimeout(function(){if(token!==serial||!canPlay())return;if(!audio)load();try{var p=audio.play();if(p&&p.catch)p.catch(function(){if(token===serial)notify()})}catch(e){}notify()},650)}
function block(reason){locks[reason||'speech']=true;pause()}
function release(reason){delete locks[reason||'speech'];sync()}
function configure(opts){opts=opts||{};pack=(w.APP360_MUSIC_PACKS||{})[opts.pack];if(!pack||!pack.tracks.length)throw Error('Music pack missing');pause();if(audio){audio.onplay=audio.onpause=audio.onerror=null;audio=null}key=opts.storageKey||'app360:play-music:'+pack.id;enabled=saved(key+':enabled',opts.defaultEnabled===false?'0':'1')!=='0';var v=parseFloat(saved(key+':volume',String(typeof opts.volume==='number'?opts.volume:.18)));volume=Math.max(0,Math.min(.30,isFinite(v)?v:.18));index=-1;order=[];failed=0;notify()}
function unlock(){var first=!unlocked;if(first){unlocked=true;failed=0}if(first&&canPlay()){clearTimeout(resumeTimer);if(!audio)load();try{var p=audio.play();if(p&&p.catch)p.catch(function(){notify()})}catch(e){}notify();return}sync()}
function setEnabled(value){enabled=!!value;save(key+':enabled',enabled?'1':'0');if(enabled)unlocked=true;sync();notify()}
function setVolume(value){volume=Math.max(0,Math.min(.30,Number(value)||0));if(audio)audio.volume=volume;save(key+':volume',volume);notify()}
function next(){pause();if(!pack)return;pick();load();sync();notify()}
function select(id){if(!pack)return;for(var j=0;j<pack.tracks.length;j++)if(pack.tracks[j].id===id){pause();index=j;order=[];load();sync();notify();return}}
w.APP360_PLAY_MUSIC={configure:configure,unlock:unlock,block:block,release:release,setEnabled:setEnabled,setMasterEnabled:function(v){master=!!v;sync()},setVolume:setVolume,next:next,select:select,state:state,onChange:function(fn){listeners.push(fn);fn(state())},stop:pause};
d.addEventListener('visibilitychange',function(){if(d.hidden)block('hidden');else release('hidden')},false);w.addEventListener('blur',function(){block('blur')},false);w.addEventListener('focus',function(){release('blur')},false);w.addEventListener('pagehide',function(){block('pagehide')},false);w.addEventListener('pageshow',function(){release('pagehide')},false);
})(window,document);
