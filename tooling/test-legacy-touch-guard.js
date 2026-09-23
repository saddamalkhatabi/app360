'use strict';
const fs=require('fs');
const path=require('path');
const vm=require('vm');
const source=fs.readFileSync(path.join(__dirname,'..','assets/js/app360-ai-shell.js'),'utf8');
const listeners={};
const nodes={};
function add(type,fn){(listeners[type]||(listeners[type]=[])).push(fn)}
function element(tag){return {tagName:String(tag).toUpperCase(),style:{},className:'',children:[],attrs:{},setAttribute:function(k,v){this.attrs[k]=v},getAttribute:function(k){return this.attrs[k]||''},appendChild:function(n){this.children.push(n);if(n.id)nodes[n.id]=n;n.parentNode=this},parentNode:null};}
const body=element('body'),head=element('head'),html=element('html');
const document={readyState:'complete',body:body,head:head,documentElement:html,getElementsByTagName:function(n){return n==='head'?[head]:n==='html'?[html]:[]},getElementById:function(id){return nodes[id]||null},createElement:function(tag){return element(tag)},addEventListener:add};
const window={document:document,navigator:{userAgent:'Mozilla/5.0 (Linux; Android 4.4.2; BigTAB DMTAB) AppleWebKit/537.36'},location:{pathname:'/saddamalkhatabi/app360/main/apps/1-4/calm-with-me/index.html',href:''},CSS:null,Date:Date};
window.window=window;
vm.runInNewContext(source,{window:window,document:document,navigator:window.navigator,Date:Date,Math:Math,console:console,setTimeout:setTimeout,clearTimeout:clearTimeout});
function assert(v,m){if(!v)throw new Error(m)}
function event(type,x,y){return {type:type,touches:type==='touchend'?[]:[{clientX:x,clientY:y}],changedTouches:[{clientX:x,clientY:y}],prevented:false,stopped:false,preventDefault:function(){this.prevented=true},stopImmediatePropagation:function(){this.stopped=true},stopPropagation:function(){this.stopped=true}}}
function fire(type,e){(listeners[type]||[]).forEach(function(fn){fn(e)})}
assert(window.APP360_TOUCH_GUARD&&window.APP360_TOUCH_GUARD.__ready,'legacy touch guard did not initialize');
assert(nodes.app360HomeBtn,'home button was not injected');
let a=event('touchstart',100,100);fire('touchstart',a);let tapEnd=event('touchend',103,104);fire('touchend',tapEnd);assert(!tapEnd.prevented&&!tapEnd.stopped,'small tap was incorrectly treated as scroll');
let s=event('touchstart',100,100);fire('touchstart',s);let m=event('touchmove',102,135);fire('touchmove',m);let end=event('touchend',102,135);fire('touchend',end);assert(end.prevented&&end.stopped,'scroll touchend was not blocked');
let click={prevented:false,stopped:false,preventDefault:function(){this.prevented=true},stopImmediatePropagation:function(){this.stopped=true},stopPropagation:function(){this.stopped=true}};fire('click',click);assert(click.prevented&&click.stopped,'synthetic click after scroll was not blocked');
console.log('Legacy touch guard simulation PASSED: tap stays tap; scroll cannot trigger touchend/click activation.');
