'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const root=path.resolve(__dirname,'..');
let code=fs.readFileSync(path.join(root,'runtime-v27.js'),'utf8');
code=code.replace('if(document.readyState', 'window.playerTest={state:state,audioPath:audioPath,speak:speak,stop:stopAudio,setDisplay:setDisplay,restart:restart,guide:guide};\nif(document.readyState');
const active={},attrs={},timers=new Map();let serial=0;const audios=[];
const el={classList:{toggle:(k,on)=>active[k]=on},setAttribute:(k,v)=>attrs[k]=v};
class AudioMock{constructor(){audios.push(this)}load(){}play(){this.paused=false;return {catch:()=>{}}}pause(){this.paused=true}}
const window={APP360_SILMA:{words:{'أم':'silma-mom.mp3'},senses:{'الجسم\u0001ظهر':'back.mp3','الوقت\u0001ظهر':'noon.mp3','غرفة النوم\u0001درج':'drawer.mp3'},guides:{welcome:'welcome.mp3','welcome-en':'welcome-en.mp3'},spoken:{}},APP360_AUDIO_MAP_EN:{Mother:'mother.mp3'},APP360_EN:{categories:{},words:{'الأسرة\u0001أم':'Mother'}},APP360_LEVELS:{1:[['الأسرة','🙂','أم']]}};
const sandbox={window,document:{readyState:'loading',hidden:false,addEventListener(){},getElementById:()=>el},Audio:AudioMock,setTimeout:(cb,ms)=>{let id=++serial;timers.set(id,{cb,ms});return id},clearTimeout:id=>timers.delete(id),console,localStorage:{getItem:()=>null,setItem(){}},navigator:{}};
vm.runInNewContext(code,sandbox);const p=window.playerTest;
assert.equal(p.audioPath({ar:'ظهر',category_ar:'الجسم'},'ar'),'back.mp3');assert.equal(p.audioPath({ar:'ظهر',category_ar:'الوقت'},'ar'),'noon.mp3');assert.equal(p.audioPath({ar:'درج',category_ar:'غرفة النوم'},'ar'),'drawer.mp3');
assert.equal(p.state.repeat,true);p.state.repeat=false;p.state.voice='both';p.state.autoplay=true;p.speak();let audio=audios[0];assert.equal(audio.src,'silma-mom.mp3');assert(active['is-speaking']);assert(![...timers.values()].some(t=>t.ms===4000),'navigation must wait for Arabic');
audio.onended();assert.equal(audio.src,'mother.mp3');assert(![...timers.values()].some(t=>t.ms===4000),'navigation must wait for English');audio.onended();assert(!active['is-speaking']);assert([...timers.values()].some(t=>t.ms===4000));
p.speak();const obsolete=audio.onended;p.stop();obsolete();assert(audio.paused);assert(!active['is-speaking']);assert.equal(timers.size,0,'stop clears navigation and watchdog');
p.speak();const oldEnd=audio.onended;p.speak();const timerCount=timers.size;oldEnd();assert.equal(timers.size,timerCount,'stale end must preserve the new playback watchdog');p.stop();
p.state.voice='en';p.guide('welcome');assert.equal(audio.src,'welcome-en.mp3');p.stop();p.state.voice='ar';p.guide('welcome');assert.equal(audio.src,'welcome.mp3');p.stop();
p.state.repeat=true;p.state.voice='ar';p.speak();audio.onended();const pause=[...timers.values()].find(t=>t.ms===1400);assert(pause,'repeat has a child response pause');for(const [id,t] of timers)if(t===pause)timers.delete(id);pause.cb();assert.equal(audio.src,'silma-mom.mp3');audio.onended();p.stop();p.speak();audio.onended();p.stop();assert.equal(timers.size,0,'cancel clears repeat pause');
const raw=fs.readFileSync(path.join(root,'runtime-v27.js'),'utf8');assert(!raw.includes('state.display=mode;state.voice=mode;'),'display language must preserve independent audio choice');console.log('Recorded player: senses, bilingual sequencing, guides, stale callbacks, highlight and autoplay passed');
