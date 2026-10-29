'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../../..'),ctx={window:{}};
for(const f of ['content','learning'])vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../'+f+'.js'),'utf8'),ctx);
const D=ctx.window.BalloonGardenContent,L=ctx.window.BalloonGardenLearning,C=require('../core.js');
test('all 1193 contextual words and 110 categories retain their original images and recordings',()=>{
 const source={window:{}};for(const f of ['word-images-context-map','word-images-map','silma-map','meaning-sentences-v1'])vm.runInNewContext(fs.readFileSync(path.join(root,'apps/1-4/say-and-name/data/'+f+'.js'),'utf8'),source);
 const w=source.window;assert.equal(D.words.length,1193);assert.equal(D.categories.length,110);assert.equal(new Set(D.words.map(x=>x.id)).size,1193);
 for(const word of D.words){assert.equal(word.image,'../say-and-name/assets/word-images/'+(w.APP360_WORD_IMAGE_CONTEXT_MAP[word.key]||w.APP360_WORD_IMAGE_MAP[word.ar]));assert.equal(word.audio.ar,'../say-and-name/'+(w.APP360_SILMA.senses[word.key]||w.APP360_SILMA.words[word.ar]));assert(L.items[word.id]);}
});
test('every displayed sentence uses measured cues for the exact spoken words',()=>{
 for(const word of D.words)for(const row of L.items[word.id])for(const lang of ['ar','en']){const line=row[lang],clip=L.clips[line.clip];assert.equal(clip.engine,'silma');assert.deepEqual(clip.words,line.words);assert(clip.cues.length>0);for(const cue of clip.cues){assert(cue[0]>=0&&cue[0]<line.words.length);assert(cue[1]>=0&&cue[2]>cue[1]&&cue[2]<=clip.duration_ms);}}
});
test('category-specific discoveries always point to the selected contextual words after save/restore',()=>{
 const pool=D.words.flatMap((w,i)=>w.category==='الحيوانات'?[i]:[]),s=C.settings({age:'1-4',level:4});let r=C.create(s);r.seed=873544;
 while(!r.ended){for(const offer of C.offers(r,s,pool))assert(pool.includes(offer.item));const token=C.pop(r,s,C.offers(r,s,pool)[0].id,pool);assert(pool.includes(token.item));C.apply(r,r.active);r=C.restore(JSON.parse(JSON.stringify(r)),s,D.words.length);}
 assert.equal(r.pops,12);assert.equal(C.flowers(r),4);
});
test('every drawing color and its old-device formats now come from shared SILMA speech',()=>{
 const registry=require('../../../1-4/drawing-writing-foundations/audio/registry.json');assert.match(registry.voices.colors.engine,/SILMA/);assert.equal(registry.colors.length,10);
 for(const row of registry.colors){assert.equal(row.engine,'silma');const recorded=fs.readFileSync(path.join(root,'apps/1-4/drawing-writing-foundations',row.files.mp3));assert.deepEqual(recorded,fs.readFileSync(path.join(root,row.source)));for(const file of Object.values(row.files))assert(fs.statSync(path.join(root,'apps/1-4/drawing-writing-foundations',file)).size>100);}
});
function voice(){const clips=[],timers=new Map(),lines=[],words=[],errors=[];let next=0;function Audio(src){this.src=src;this.currentTime=0;this.paused=true;this.pause=()=>this.paused=true;this.play=()=>{this.paused=false;};clips.push(this);}const w={Audio,setInterval:f=>{timers.set(++next,f);return next;},setTimeout:f=>{timers.set(++next,f);return next;},clearInterval:id=>timers.delete(id),clearTimeout:id=>timers.delete(id)};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../speech.js'),'utf8'),{window:w});return{clips,lines,words,errors,timers,api:w.BalloonFarmSpeech.create({line:r=>lines.push(r),word:i=>words.push(i),error:()=>errors.push(true)}),cue:w.BalloonFarmSpeech.cueIndex};}
test('recorded cue boundaries follow audio time and cancel all late events when a child leaves',()=>{const v=voice(),row={audio:'one.mp3',words:['one','two'],cues:[[0,100,300],[1,350,600]],duration_ms:700};v.api.play([row,{audio:'two.mp3'}]);assert.equal(v.clips.length,1);const a=v.clips[0];a.currentTime=.4;a.ontimeupdate();assert.equal(v.words.at(-1),1);const late=a.onended;v.api.stop();late();assert.equal(v.clips.length,1);assert.equal(v.timers.size,0);assert.equal(v.words.at(-1),-1);assert.equal(v.cue(row.cues,300),-1);});
test('a new discovery replaces the old speech lane and a failed recording cannot advance into another lesson',()=>{const v=voice();v.api.play([{audio:'old.mp3'},{audio:'old-next.mp3'}]);const late=v.clips[0].onended;v.api.play([{audio:'new.mp3'},{audio:'new-next.mp3'}]);late();assert.deepEqual(v.clips.map(a=>a.src),['old.mp3','new.mp3']);v.clips[1].onerror();assert.equal(v.errors.length,1);assert.equal(v.clips.length,2);assert.equal(v.timers.size,0);});
test('external media pause cancels narration and a late error from an ended clip cannot stop the next clip',()=>{const v=voice();v.api.play([{audio:'one.mp3'},{audio:'two.mp3'}]);const staleError=v.clips[0].onerror;v.clips[0].onended();assert.equal(v.clips.length,2);staleError();assert.equal(v.errors.length,0);v.clips[1].onpause();assert.equal(v.timers.size,0);assert.equal(v.words.at(-1),-1);});
test('published guidance contains exact decodable sources and only independently confirmed English letters',()=>{
 const w={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../guidance.js'),'utf8'),{window:w});const g=w.BalloonGardenGuidance,seen=new Set();let letters=0;
 for(const clip of Object.values(g.clips)){const bytes=fs.readFileSync(path.join(__dirname,'..',clip.path));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),clip.sha256);assert(clip.duration_ms>0);if(clip.id.startsWith('letter-')){letters++;assert.equal(clip.speech_qa.passed,true);assert(!seen.has(clip.sha256));seen.add(clip.sha256);}}
 assert.equal(letters,18);assert.equal(g.pending_recordings.length,8);for(const pending of g.pending_recordings){assert(!g.clips[pending.language+':'+pending.id]);assert(!fs.existsSync(path.join(__dirname,'../audio/guide/en/'+pending.id+'.mp3')));}
});
