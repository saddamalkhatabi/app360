'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'../..');
function readJson(p){return JSON.parse(fs.readFileSync(path.join(root,p),'utf8'))}
function fail(msg){console.error('FAIL:',msg);process.exitCode=1}
function ok(msg){console.log('OK:',msg)}
const expectedAges=['1-4','4-8','8-12','12-16','16-24','24-45','45-60','60-80'];
const validStatus=new Set(['live','planned','idea']);
const validKind=new Set(['goal_aligned','modern_extension','hybrid']);
const catalog=readJson('data/catalog.json');
const goals=readJson('data/goals.json');
const ages=(catalog.age_groups||[]).map(x=>x.id);
if(JSON.stringify(ages)!==JSON.stringify(expectedAges))fail('catalog age groups must be exactly '+expectedAges.join(', '));else ok('8 canonical age groups');
for(const age of expectedAges){
 const p=path.join(root,'ages',age,'index.html');
 if(!fs.existsSync(p))fail('missing age page '+age);else ok('age page '+age);
 if(!goals.age_groups||!Array.isArray(goals.age_groups[age])||!goals.age_groups[age].length)fail('missing goals for '+age);
}
const allGoals=new Map();
for(const age of expectedAges){
 for(const g of goals.age_groups[age]||[]){
  if(!g.key)fail('goal without key in '+age);
  if(allGoals.has(g.key))fail('duplicate goal key '+g.key);
  allGoals.set(g.key,{age,role:g.role,title:g.title_ar});
 }
}
ok(allGoals.size+' unique reference goals');
const ids=new Set(),slugsByAge=new Set(),coverage=new Map();
for(const a of catalog.apps||[]){
 if(!a.id||ids.has(a.id))fail('missing/duplicate app id '+a.id);else ids.add(a.id);
 const sk=a.age_group+'|'+a.slug;
 if(!a.slug||slugsByAge.has(sk))fail('missing/duplicate app slug '+sk);else slugsByAge.add(sk);
 if(!expectedAges.includes(a.age_group))fail('invalid age on app '+a.id+': '+a.age_group);
 if(!validStatus.has(a.status))fail('invalid status on '+a.id+': '+a.status);
 if(!validKind.has(a.kind))fail('invalid kind on '+a.id+': '+a.kind);
 if(!a.title_ar||!a.description_ar||!a.practice_model)fail('incomplete practical metadata on '+a.id);
 const gks=a.goal_keys||[];
 if(a.kind!=='modern_extension'&&gks.length===0)fail('non-extension app has no goal keys: '+a.id);
 for(const key of gks){
  const g=allGoals.get(key);
  if(!g){fail('unknown goal key '+key+' on '+a.id);continue}
  if(g.age!==a.age_group)fail('cross-age goal mapping '+a.id+' -> '+key);
  coverage.set(key,(coverage.get(key)||0)+1);
 }
 if(a.status==='live'){
  if(!a.href)fail('live app without href: '+a.id);
  else {
   const clean=a.href.split('?')[0].split('#')[0];
   if(!fs.existsSync(path.join(root,clean)))fail('live href does not exist: '+a.id+' -> '+clean);
  }
 }
}
ok(ids.size+' unique apps/ideas in catalog');
const missing=[];
for(const [key,g] of allGoals)if(!coverage.get(key))missing.push(g.age+' :: '+key);
if(missing.length)fail('reference goals without app coverage:\n - '+missing.join('\n - '));else ok('all '+allGoals.size+' reference goals covered by roadmap apps');
const ageCounts={};for(const a of catalog.apps||[])ageCounts[a.age_group]=(ageCounts[a.age_group]||0)+1;
for(const age of expectedAges){if(!ageCounts[age])fail('age has zero apps '+age);else console.log('AGE',age,'apps:',ageCounts[age],'goals:',(goals.age_groups[age]||[]).length)}
if(process.exitCode){console.error('\nApp 360 Lab validation FAILED');process.exit(1)}
console.log('\nApp 360 Lab validation PASSED');
