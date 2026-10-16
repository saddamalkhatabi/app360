'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..');
function load(age,lang='ar'){
 const w={location:{search:'?routine_age='+age},localStorage:{getItem(){return null}}};w.parent=w;
 const d={readyState:'loading',addEventListener(){},querySelector(){return null},documentElement:{},body:{className:''}};
 const c=vm.createContext({window:w,document:d});
 for(const f of ['data.js','storyboard-data-v6.js','storyboard-data-v7-extra.js','storyboard-remap-v8.js','audio/routine-english-labels.js','islamic-routines-content-v1.js','audio/islamic-recordings-v1.js','islamic-routines-v1.js'])vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),c);
 return {w,c};
}
for(const [age,count] of [['1-4',52],['4-8',24]]){
 const {w,c}=load(age);const h=w.ROUTINE_DATA.habits;
 assert.equal(h.length,count);assert.equal(new Set(h.map(x=>x.id)).size,count);assert.equal(new Set(h.map(x=>x.num)).size,count);
 for(const habit of h){assert.equal(habit.steps.length,5);assert.equal(habit.arts.length,5);if(habit.islamic){
  assert.equal(habit.islamic.steps_en.length,5);
  for(const scene of habit.islamic.scenes)assert(fs.existsSync(path.join(root,'assets/routine-scenes',scene+'.svg')));
  for(const id of Object.values(habit.islamic.duas))assert(w.APP360_ISLAMIC_ROUTINES.duas[id].url.startsWith('https://'));
 }}
 // A changed routine must not retain the old voice index even when it had been verified.
 const changed=h.find(x=>x.islamic),id=changed.id;
 w.APP360_ROUTINE_NARRATIONS={habits:{[id]:{verified:true,steps:['outdated']}}};w.APP360_ROUTINE_NARRATIONS_EN={habits:{}};
 w.APP360_ROUTINE_INSTALL_ISLAMIC_AUDIO();assert.equal(w.APP360_ROUTINE_NARRATIONS.habits[id],undefined);
 assert.equal(w.APP360_ROUTINE_STORAGE_KEY,age==='1-4'?'app360-a1-routine-v2':'app360-a4-routine-v1');
}
const catalog=JSON.parse(fs.readFileSync(path.join(root,'../../../data/catalog.json')));const app=catalog.apps.find(x=>x.id==='a1-routine');
assert.deepEqual(app.age_groups,['1-4','4-8']);assert.equal(app.age_entry_levels['4-8'],2);
const w={location:{search:'?age=4-8'}};w.parent=w;vm.runInNewContext(fs.readFileSync(path.join(root,'../../../assets/js/app360-age-launch-v1.js'),'utf8'),{window:w});
assert.match(w.App360AgeLaunch.href(app),/launch_age=4-8&launch_level=2/);
console.log('PASS: 52/24 age libraries, source links, illustrations, isolated progress, exact-text voice guard and launch URLs');
