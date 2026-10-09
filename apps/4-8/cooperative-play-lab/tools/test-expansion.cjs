const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),C=require('../src/content.js'),M=require('../src/model.js'),root=path.resolve(__dirname,'..');
test('each level has five unique practical situations with distinct requests and plans',()=>{
 assert.equal(new Set(C.experiments.map(e=>e.id)).size,15);
 for(const tr of C.tracks)assert.equal(C.experiments.filter(e=>e.track===tr.id).length,5);
 for(const e of C.experiments){for(const lang of ['ar','en']){assert(e.title[lang]);assert(e.materials[lang]);assert(e.trial[lang]);assert(e.question[lang]);assert.notEqual(e.phrases.needA[lang],e.phrases.needB[lang]);assert.notEqual(e.plans.turns['rule_'+lang],e.plans.together['rule_'+lang]);}}
});
test('all 15 situations can complete either plan and survive saving and importing',()=>{
 for(const e of C.experiments)for(const plan of ['turns','together']){let d=M.fresh('expansion-test',e.track,e.id);M.next(d);d.heard.needA=true;M.next(d);d.heard.needB=true;M.next(d);d.explored.turns=d.explored.together=true;M.select(d,plan);M.next(d);d.agreed_rule=e.plans[plan].rule_ar;d.consent=[true,true,true];if(e.track==='extend')d.participants=3;M.next(d);assert.throws(()=>M.next(d),/trial/);d.trial_done=true;M.next(d);d.reflection='worked';d=M.finish(d);assert.equal(M.validate(d,'expansion-test').situation_id,e.id);let out=M.exported({gallery:[d]}).agreements[0];assert(!out.profile_ref);out.profile_ref='another';out.coach_note='';out.attempt_history=[];assert.equal(M.validate(out,'another').situation_id,e.id);}
 assert.throws(()=>M.fresh('x','entry','team-map'),/situation/);assert.throws(()=>M.fresh('x','entry','unknown'),/situation/);
});
test('every new narration and hint has recorded audio and actual timing',()=>{
 const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/expansion-audio.json')));
 for(const lang of ['ar','en']){const cues=JSON.parse(fs.readFileSync(path.join(root,'data',lang==='ar'?'silma-read-along.json':'english-read-along.json'))).items;
  for(const item of manifest.items.filter(x=>x.language===lang)){const audio=fs.readFileSync(path.join(root,item.path)),row=cues[item.path];assert(audio.length>1000,item.path);assert(row,item.path);assert.equal(row.text,item.text);assert(row.cues.length>0);if(lang==='ar')assert.equal(row.audio_sha256,crypto.createHash('sha256').update(audio).digest('hex'));for(const [i,a,b] of row.cues)assert(i>=0&&a>=0&&a<b&&b<=row.duration,item.path);}}
 for(const key of Object.keys(C.hints))assert(manifest.items.some(x=>x.path==='audio/ar/hint-'+key+'.mp3'));
});
