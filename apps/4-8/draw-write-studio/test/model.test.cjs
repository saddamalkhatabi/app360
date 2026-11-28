const test=require('node:test'),assert=require('node:assert/strict'),fs=require('fs'),vm=require('vm'),path=require('path');
const ctx={};for (const script of ['data/coach.js','src/coach.js','src/model.js']) vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..',script),'utf8'),ctx);const M=ctx.STUDIO_MODEL,L=ctx.STUDIO_COACH;
const content=require('../data/content.json');
test('all four levels have separate Arabic and English missions and the six seed outcomes',()=>{for(let n=1;n<=4;n++)for(const lang of ['ar','en'])assert.equal(content.missions.filter(m=>m.level===n&&m.language===lang).length,3);for(const name of ['thank-you','name-tag','two-page-book','play-invite','book-corner'])assert.ok(content.missions.some(m=>m.id==='ar-'+name));});
test('save, restore, undo history and immutable saved work preserve the child attempt',()=>{const s=M.blank();s.draft=M.start(content.missions[0]);s.draft.pages[0].commands.push({type:'stroke',points:[{x:.1,y:.2},{x:.9,y:.7}],width:8,color:'#65519b',erase:false});s.draft.pages[0].caption='معنى';M.checkpoint(s.draft,'first');const a=M.saveAttempt(s);s.draft.pages[0].caption='تعديل';assert.equal(a.pages[0].caption,'معنى');const r=M.restore(JSON.stringify(s));assert.equal(r.draft.pages[0].commands[0].points.length,2);assert.equal(r.draft.original_attempts[0].pages[0].caption,'معنى');});
test('export excludes private notes, profile identity and every recording reference',()=>{const s=M.blank();s.notes={observation:'PRIVATE NOTE'};s.profile_ref='SECRET';s.draft=M.start(content.missions[0]);s.draft.pages[0].recording_ref='PRIVATE AUDIO';M.saveAttempt(s);const exportText=JSON.stringify(M.exportData(s.saved));assert.ok(!exportText.includes('PRIVATE'));assert.ok(!exportText.includes('SECRET'));const imported=M.importData(exportText);assert.equal(imported[0].pages[0].recording_ref,'');});
test('unknown schemas and invalid drawing coordinates are rejected before replacing data',()=>{assert.throws(()=>M.restore('{bad'));assert.throws(()=>M.restore('{"schema_version":9}'));const s=M.blank();s.draft=M.start(content.missions[0]);s.draft.pages[0].commands.push({type:'stroke',points:[{x:4,y:.2}],color:'#65519b',width:8});assert.throws(()=>M.restore(JSON.stringify(s)));assert.throws(()=>M.importData('{"app_id":"other-app","schema_version":1,"projects":[]}'));});
test('each recording has word boundaries from its own text, ordered within clip duration',()=>{const manifest=require('../data/audio-manifest.json'),cues=require('../data/read-along.json').items;for(const clip of manifest.items){assert.ok(fs.statSync(path.join(__dirname,'..',clip.path)).size>1000);const entry=cues[clip.path];assert.equal(entry.text,clip.text);if(clip.sha256){const hash=require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(__dirname,'..',clip.path))).digest('hex');assert.equal(hash,clip.sha256);assert.equal(entry.audio_sha256,hash);assert.equal(entry.duration,clip.duration_ms)}if(entry.timing_source==='sentence'){assert.equal(entry.cues.length,0);continue}let last=-1;for(const [index,start,end] of entry.cues){assert.ok(index>last);assert.ok(start>=0&&end>=start&&end<=entry.duration);last=index}assert.equal(entry.cues.length,clip.text.split(/\s+/).length)}});
test('shared pencil primitives preserve the foundations segment and curve commands',()=>{const sandbox={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../../../../packages/pencil-core/browser.js'),'utf8'),sandbox);const calls=[],ctx={beginPath(){calls.push(['begin'])},moveTo(x,y){calls.push(['move',x,y])},lineTo(x,y){calls.push(['line',x,y])},quadraticCurveTo(x,y,a,b){calls.push(['quad',x,y,a,b])},stroke(){calls.push(['stroke'])}};sandbox.APP360_PENCIL.segment(ctx,{x:1,y:2},{x:3,y:4});sandbox.APP360_PENCIL.quadratic(ctx,{x:3,y:4},{x:6,y:8},{x:9,y:12});assert.deepEqual(calls,[['begin'],['move',1,2],['line',3,4],['stroke'],['begin'],['move',3,4],['quad',6,8,9,12],['stroke']]);});

test('four coach routes advance only on their own events and cannot fake a gallery save',()=>{
  assert.equal(L.routes.length,4);
  for(const path of L.routes){
    const run=L.start(path.id,'same-draft');
    assert.equal(L.advance(run,'unrelated-event'),false);
    for(const id of path.steps){
      assert.equal(L.current(run).id,id);
      const event=L.current(run).details.event;
      if(id!=='save')assert.equal(L.advance(run,'saved'),false);
      assert.equal(L.advance(run,event),true);
    }
    assert.equal(L.current(run).id,'done');
    assert.equal(L.advance(run,'saved'),false);
  }
});
test('a restored coach pauses and resumes only for the saved draft; words are optional',()=>{
  const state=M.blank();state.draft=M.start(content.missions[0]);
  state.coach_run=L.start('card',state.draft.id);
  assert.equal(L.advance(state.coach_run,'ink'),true);
  assert.equal(L.advance(state.coach_run,'stage-meaning'),true);
  const saved=M.restore(JSON.stringify(state));
  assert.equal(saved.coach_run.paused,true);
  assert.equal(L.advance(saved.coach_run,'words'),false);
  saved.coach_run.paused=false;
  assert.equal(L.advance(saved.coach_run,'stage-review'),true);
  assert.equal(L.current(saved.coach_run).id,'save');
  assert.equal(L.restore(saved.coach_run,'other-draft'),null);
});
test('both languages use recorded SILMA for the authored app and coach',()=>{
  const manifest=require('../data/audio-manifest.json');
  for(const lang of ['ar','en']){
    const clips=manifest.items.filter(clip=>clip.language===lang);
    assert.equal(manifest.voices[lang],'SILMA TTS 1.0.5');
    assert.ok(clips.every(clip=>clip.engine==='silma-tts-1.0.5'));
    for(const id of Object.keys(ctx.STUDIO_COACH_DATA.steps)){
      const audioPath=L.path(lang,id);
      assert.equal(clips.find(clip=>clip.path===audioPath).text,L.audioItem(audioPath).text);
    }
  }
});
