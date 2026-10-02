'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/app-pwa.js'),'utf8');
function setup(hooks={}){
  const listeners={},timers=[],nodes={updateAppBtn:{},appPwaNotice:{style:{}}};
  let reloads=0,updates=0;
  const registration={waiting:null,update(){updates++;return Promise.resolve();},addEventListener(){}};
  const document={readyState:'complete',getElementById:id=>nodes[id]||null};
  const navigator={serviceWorker:{controller:{},addEventListener(name,fn){listeners[name]=fn;},register(){return Promise.resolve(registration);}}};
  const location={protocol:'https:',pathname:'/apps/example/index.html',reload(){reloads++;}};
  const window=Object.assign({APP360_AI_SHELL:{},addEventListener(){},matchMedia(){return{matches:false};}},hooks);
  vm.runInNewContext(source,{window,document,navigator,location,setTimeout(fn,ms){timers.push({fn,ms});return timers.length;},clearTimeout(){}});
  return{nodes,window,listeners,timers,reloads:()=>reloads,updates:()=>updates};
}
test('applications without a reload hook keep the shared PWA update behavior',async()=>{
  const r=setup();await Promise.resolve();
  r.listeners.controllerchange();r.listeners.controllerchange();
  const changes=r.timers.filter(t=>t.ms===180);assert.equal(changes.length,1);changes[0].fn();
  assert.equal(r.reloads(),1);await r.nodes.updateAppBtn.onclick();await Promise.resolve();assert.equal(r.updates(),1);
});
test('a story can retain its draft while the new service worker waits for a safe return',()=>{
  let apply;
  const r=setup({APP360_PWA_BEFORE_RELOAD(reload){apply=reload;}});
  r.listeners.controllerchange();r.timers.find(t=>t.ms===180).fn();
  assert.equal(r.reloads(),0);assert.equal(typeof apply,'function');apply();assert.equal(r.reloads(),1);
});
test('explicit update can apply a pending story update without starting another update',async()=>{
  let applications=0;
  const r=setup({APP360_PWA_APPLY_PENDING(){applications++;return true;}});await Promise.resolve();
  r.nodes.updateAppBtn.onclick();assert.equal(applications,1);assert.equal(r.updates(),0);assert.equal(r.reloads(),0);
});
