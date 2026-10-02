'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
function runtime(blockStorage = false) {
  const nodes = {}, listeners = {}, events = [], timers = [];
  function node(tag) {
    const attrs = {};
    const n = {tagName: tag.toUpperCase(), className: '', hidden: false, style: {cssText: ''},
      appendChild(c) { if (c.id) nodes[c.id] = c; }, getAttribute(k) { return attrs[k] == null ? null : attrs[k]; },
      setAttribute(k, v) { attrs[k] = String(v); }, querySelector() { return null; }, querySelectorAll() { return []; }};
    if (tag === 'a') Object.defineProperty(n, 'href', {set(v) { Object.assign(n, new URL(v, 'https://school.example/index.html')); for (const k of ['protocol', 'host', 'pathname']) n[k] = new URL(v, 'https://school.example/index.html')[k]; }});
    if (tag === 'iframe') Object.defineProperty(n, 'src', {set(v) { attrs.src = v; }, get() { return attrs.src || ''; }});
    if (tag === 'section') Object.defineProperty(n, 'innerHTML', {set() {
      const frame = node('iframe'); frame.id = 'app360FamilyShellFrame'; nodes[frame.id] = frame;
      const title = node('div'), wait = node('div');
      n.querySelector = s => s === '.a360-shell-title' ? title : s === '.a360-shell-wait' ? wait : null;
    }});
    return n;
  }
  const document = {readyState: 'loading', title: 'School', documentElement: node('html'), body: node('body'), head: node('head'),
    getElementById(id) { return nodes[id] || null; }, createElement: node, getElementsByTagName() { return []; },
    addEventListener(name, fn) { (listeners[name] ||= []).push(fn); },
    createEvent() { return {initCustomEvent(type, bubble, cancel, detail) {this.type = type; this.detail = detail;}, initEvent(type) {this.type = type;}}; },
    dispatchEvent(e) { events.push(e); for (const fn of listeners[e.type] || []) fn(e); }};
  const storage = () => {const data = {}; return {getItem(k) {if (blockStorage) throw Error('blocked'); return data[k] || null;}, setItem(k,v) {if (blockStorage) throw Error('blocked');data[k]=String(v);}, removeItem(k) {delete data[k];}};};
  const window = {document, location: {pathname:'/index.html', protocol:'https:', host:'school.example', search:''}, navigator:{userAgent:'Chrome/153'},
    localStorage:storage(), sessionStorage:storage(), history:{replaceState() {}}, pageXOffset:0, pageYOffset:320,
    scrollTo(x,y) {this.pageXOffset=x;this.pageYOffset=y;}, addEventListener() {}};
  window.parent = window;
  const context = vm.createContext({window, document, URL, setTimeout(fn) {timers.push(fn);return timers.length;}, setInterval() {return 1;}, clearTimeout() {}, clearInterval() {}});
  const load = f => vm.runInContext(fs.readFileSync(path.join(root,'assets/js',f),'utf8'),context);
  return {window, document, nodes, events, load};
}
test('return home restores existing styles and ignores late iframe blank loads', () => {
  const r=runtime();r.window.APP360_FAMILY_SYNC={__ready:true,apps:[{id:'words',title:'Words',href:'apps/1-4/words/index.html'}],getSession:()=>({role:'none'}),forceHeartbeat(){}};
  r.document.documentElement.style.cssText='color: teal';r.document.body.style.cssText='padding: 7px';
  r.load('app360-family-shell-v1.js');const sh=r.window.APP360_FAMILY_SHELL;
  for(let i=0;i<3;i++) {assert.equal(sh.openApp('words'),true);const frame=sh.getFrame();frame.onload();assert.equal(r.document.body.style.position,'fixed');assert.equal(sh.closeApp(),true);frame.onload();assert.equal(r.document.body.style.cssText,'padding: 7px');assert.equal(r.document.documentElement.style.cssText,'color: teal');assert.equal(r.document.body.className,'');assert.equal(r.window.pageYOffset,320);assert.equal(sh.getActiveApp(),null);}
});
test('trusted remote home survives the navigation wrapper; guest lock remains effective', () => {
  const r=runtime();let policy={mode:'locked',selected:'words'};
  r.window.APP360_FAMILY_SYNC={__ready:true,apps:[{id:'words',href:'apps/1-4/words/index.html'}],getSession:()=>({role:'guest',adminRole:'member'}),getPolicy:()=>policy};
  r.load('app360-family-shell-v1.js');r.document.readyState='complete';r.load('app360-family-navigation-safety-v1.js');
  const sh=r.window.APP360_FAMILY_SHELL;sh.openApp('words');assert.equal(sh.openApp('app360-home'),false);assert.equal(sh.getActiveApp().id,'words');assert.equal(sh.openApp('app360-home',true),true);sh.getFrame().onload();assert.equal(sh.getActiveApp(),null);
  policy={mode:'locked',selected:'app360-home'};assert.equal(sh.openApp('app360-home'),true);
});
test('ages are required, remembered per profile and isolated by account identity', () => {
  const r=runtime();r.load('app360-family-core-v2.js');const api=r.window.APP360_FAMILY_SYNC;
  assert.equal(api.getAgeGroups().length,8);api.setName('نور');assert.equal(api.getAgeGroup(),'');assert.equal(api.setAgeGroup('all'),false);assert.equal(api.setAgeGroup('1-4'),true);
  api.setName('سارة');assert.equal(api.getAgeGroup(),'');api.setAgeGroup('8-12');api.setName('نور');assert.equal(api.getAgeGroup(),'1-4');
  r.window.sessionStorage.setItem('app360:auth-profile:v1',JSON.stringify({user_id:'a'}));assert.equal(api.getAgeGroup(),'');api.setAgeGroup('12-16');r.window.sessionStorage.setItem('app360:auth-profile:v1',JSON.stringify({user_id:'b'}));assert.equal(api.getAgeGroup(),'');api.setAgeGroup('16-24');r.window.sessionStorage.setItem('app360:auth-profile:v1',JSON.stringify({user_id:'a'}));assert.equal(api.getAgeGroup(),'12-16');
});
test('age selection remains usable when local storage is unavailable', () => {
  const r=runtime(true);r.load('app360-family-core-v2.js');const api=r.window.APP360_FAMILY_SYNC;api.setName('نور');assert.equal(api.setAgeGroup('4-8'),true);assert.equal(api.getAgeGroup(),'4-8');
});
test('future live apps keep age metadata and homepage is shared across age groups', () => {
  const r=runtime();r.load('app360-family-core-v2.js');const api=r.window.APP360_FAMILY_SYNC;
  api.registerApps([{id:'future',age_group:'8-12',href:'apps/8-12/future/index.html',title_ar:'Future',status:'live'},{id:'coming',age_group:'4-8',href:'apps/4-8/coming/index.html',status:'planned'}]);
  assert.equal(api.apps.find(a=>a.id==='future').age_group,'8-12');assert.equal(api.apps.some(a=>a.id==='coming'),false);assert.equal(api.apps.find(a=>a.id==='app360-home').is_home,true);assert(r.events.some(e=>e.type==='app360:family-apps-updated'));
});
