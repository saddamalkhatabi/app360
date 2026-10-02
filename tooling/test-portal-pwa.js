'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../assets/js/pwa-install-v24.js'),'utf8');
function setup(hasController){
  const swEvents={},docEvents={},timers=[];let reloads=0,active=false;
  const document={readyState:'complete',getElementById(){return null;},addEventListener(n,f){docEvents[n]=f;}};
  const navigator={serviceWorker:{controller:hasController?{}:null,addEventListener(n,f){swEvents[n]=f;},register(){return Promise.resolve({waiting:null,update(){return Promise.resolve();},addEventListener(){}});}}};
  const window={navigator,APP360_FAMILY_SHELL:{getActiveApp(){return active?{id:'a4-story-language'}:null;}},addEventListener(){}};
  vm.runInNewContext(source,{window,document,navigator,location:{protocol:'https:',reload(){reloads++;}},setTimeout(fn,ms){timers.push({fn,ms});return timers.length;},clearTimeout(){}});
  return {swEvents,docEvents,timers,reloads:()=>reloads,setActive(v){active=v;}};
}
test('first portal service-worker installation keeps the app and homepage open',()=>{
  const r=setup(false);r.setActive(true);r.swEvents.controllerchange();assert.equal(r.timers.filter(t=>t.ms===250).length,0);assert.equal(r.reloads(),0);
});
test('portal updates wait for return home and cannot interrupt a newly opened app',()=>{
  const r=setup(true);r.setActive(true);r.swEvents.controllerchange();assert.equal(r.timers.filter(t=>t.ms===250).length,0);
  r.setActive(false);r.docEvents['app360:shellchange']();const timer=r.timers.find(t=>t.ms===250);assert.ok(timer);
  r.setActive(true);timer.fn();assert.equal(r.reloads(),0);
  r.setActive(false);r.docEvents['app360:shellchange']();r.timers.filter(t=>t.ms===250).at(-1).fn();assert.equal(r.reloads(),1);
});
