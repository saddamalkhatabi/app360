'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8'),json=p=>JSON.parse(read(p));
const catalog=json('data/catalog.json'),apps=catalog.apps.filter(a=>a.age_group==='4-8'),roadmap=json('data/family-school-4-8-roadmap.json');
test('each rebuilt proposal binds its own requirements, seeds and canonical identity',()=>{
 assert.equal(apps.length,12);assert.equal(new Set(apps.map(a=>a.id)).size,12);assert.deepEqual(roadmap.build_sequence,apps.map(a=>a.id));
 for(const a of apps){const base=`apps/4-8/${a.slug}/`,m=json(a.manifest);assert.equal(m.id,a.id);assert.equal(m.slug,a.slug);assert.equal(m.title_ar,a.title_ar);if(a.id==='a4-story-language'){assert.equal(m.status,'live');assert.equal(m.release_channel,'preview');assert(a.href);assert(fs.existsSync(path.join(root,base,'index.html')))}else{assert.equal(m.status,'planned');assert(!a.href);assert(!fs.existsSync(path.join(root,base,'index.html')))}
  const req=read(a.blueprint.prebuild_path),prompt=read(a.prompt_path);for(const token of ['APP360-PREBUILD-MATURITY-V1','الحلقة العملية الأساسية','نموذج البيانات','التكامل مع التطبيقات السابقة','Big TAB Android 4.4.2','Offline','Definition of Done'])assert(req.includes(token),`${a.id}: ${token}`);
  assert(prompt.includes(a.blueprint.prebuild_path));assert(prompt.includes(a.blueprint.content_seed_path));assert(a.blueprint.continuity_ar.length>=2);assert(a.blueprint.experience_tracks_ar.length===3);assert(fs.existsSync(path.join(root,a.cover)));
 }
 for(const old of roadmap.replaces){assert(!catalog.apps.some(a=>a.id===old.id));assert(!fs.existsSync(path.join(root,'apps/4-8',old.slug)))}
});
test('initial content is explicitly draft and covers 72 unique practical tasks',()=>{
 const ids=new Set();for(const a of apps){const s=json(a.blueprint.content_seed_path);assert.equal(s.status,'planning-only');assert.equal(s.tasks.length,6);for(const t of s.tasks){assert(!ids.has(t.id));ids.add(t.id);assert(t.prompt_ar&&t.observable_output_ar&&t.easier_variant_ar&&t.harder_variant_ar);assert.equal(t.asset_status,'not-yet-authored');assert.equal(t.review_status,'draft-for-prebuild-review');assert(t.safety_ar.length>0)}}assert.equal(ids.size,72);
});
test('all 4–8 goals resolve in the correct age and have concrete contributions',()=>{
 const goals=json('data/goals.json').age_groups['4-8'],valid=new Set(goals.map(g=>g.key)),covered=new Set();
 for(const a of apps){assert.deepEqual(a.goal_keys,a.goal_links.map(l=>l.goal_key));for(const l of a.goal_links){assert(valid.has(l.goal_key));assert.equal(l.delivery,a.id==='a4-story-language'?'available_with_facilitator':'planned');assert(l.rationale_ar&&l.evidence_ar);covered.add(l.goal_key)}}assert.deepEqual([...covered].sort(),[...valid].sort());
});
test('role labels respect primary coach, shared play and child practice',()=>{
 const w={};vm.runInNewContext(read('assets/js/app360-app-audience-v1.js'),{window:w});const helper=w.APP360_APP_AUDIENCE;
 assert.equal(helper.label(catalog.apps.find(a=>a.id==='a1-calm')),'للمدرب أساسًا');assert.equal(helper.label(catalog.apps.find(a=>a.id==='a1-plan-runner')),'للمدرب أساسًا');assert.equal(helper.label(catalog.apps.find(a=>a.id==='a1-imitate')),'للطفل والمدرب معًا');assert.equal(helper.label(catalog.apps.find(a=>a.id==='a1-first-words')),'للطفل بإسناد المدرب');assert.equal(helper.label({is_home:true}),'');
 assert.equal(apps.filter(a=>a.audience==='coach').length,2);
 for(const a of json('data/runtime-apps.json').apps)assert(helper.label(a),`runtime role missing: ${a.id}`);
});
test('puzzles are regular registry-backed steps in canonical ready plans',()=>{
 const p=json('apps/1-4/plan-runner-360/data/presets.json'),registry=json('data/app-links-registry.json');assert.equal(p.presets.length,24);assert.equal(new Set(p.presets.map(x=>x.id)).size,24);
 for(const level of ['1-2','2-3','3-4']){const rows=p.presets.filter(x=>x.level_id===level);assert.equal(rows.length,8);for(const id of ['a1-tangram','a1-picture-puzzles']){const step=rows.flatMap(x=>x.steps).find(s=>s.app_id===id);assert(step);const reg=registry.apps.find(a=>a.app_id===id),links=json(reg.archive_path);assert(links.routes.some(r=>r.id===step.route_id));assert(step.duration_seconds>0&&step.advance_mode==='manual');assert(fs.existsSync(path.join(root,step.href.split('?')[0])));}}
 const html=read('apps/1-4/plan-runner-360/index.html');assert(html.includes('مخطط جلسات 1–4'));assert(!html.includes('تطبيقان جديدان'));assert(!html.includes('جديد في v3'));assert(!html.includes('أضفنا أيضًا'));assert(!read('apps/1-4/plan-runner-360/sw.js').includes('presets-merge-v3-original'));
 const m=json('apps/1-4/plan-runner-360/app.json');assert.equal(m.storage.key,'app360:a1-plan-runner:schema-1');assert.equal(m.integrated_apps.length,9);
});
