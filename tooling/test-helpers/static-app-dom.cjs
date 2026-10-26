'use strict';
// Minimal DOM fixture for state transitions only. It has no layout or actual browser engine.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
module.exports=function createRuntime({directory,globals,search='',script='app.js',initialStorage=[]}){
 const nodes={},all=[],listeners={},events={},timers=new Map(),storage=new Map(initialStorage);let timerId=0,child=null,denied=false;
 function matches(e,selector){if(selector[0]==='['){const name=selector.slice(1,-1);return e.attrs[name]!==undefined;}if(selector[0]==='.')return (' '+e.className+' ').includes(' '+selector.slice(1)+' ');return false;}
 class Element{
  constructor(tag='div'){this.tagName=tag.toUpperCase();this.attrs={};this.children=[];this.style={};this.hidden=false;this.options=[];this._html='';this.textContent='';this.value='';this.disabled=false;this.className='';all.push(this);}
  set id(v){this._id=v;nodes[v]=this;}get id(){return this._id;}
  setAttribute(k,v){this.attrs[k]=String(v);}getAttribute(k){return this.attrs[k]??null;}
  appendChild(el){this.children.push(el);el.parentNode=this;}
  set innerHTML(v){this._html=v;if(v==='')this.children=[];}get innerHTML(){return this._html;}
  querySelectorAll(selector){const out=[];const visit=el=>{for(const c of el.children){if(matches(c,selector))out.push(c);visit(c);}};visit(this);return out;}
  focus(){document.activeElement=this;}scrollIntoView(){}
 }
 const html=fs.readFileSync(path.join(directory,'index.html'),'utf8'),stack=[];
 for(const match of html.matchAll(/<(\/?)([a-z][a-z0-9]*)\b([^>]*)>/g)){if(match[1]){while(stack.length){const p=stack.pop();if(p.tagName===match[2].toUpperCase())break;}continue;}const e=new Element(match[2]);for(const a of match[3].matchAll(/([\w-]+)="([^"]*)"/g)){if(a[1]==='id')e.id=a[2];else {e.setAttribute(a[1],a[2]);if(a[1]==='class')e.className=a[2];if(a[1]==='value')e.value=a[2];}}e.hidden=/(?:^|\s)hidden(?:\s|$)/.test(match[3]);e.checked=/(?:^|\s)checked(?:\s|$)/.test(match[3]);if(stack.length)stack[stack.length-1].appendChild(e);if(!['meta','link','input','img','br','hr'].includes(match[2]))stack.push(e);}
 for(const m of html.matchAll(/<select id="([^"]+)"[^>]*>(.*?)<\/select>/gs))nodes[m[1]].options=[...m[2].matchAll(/<option value="([^"]+)"/g)].map(x=>({value:x[1],text:''}));
 const document={hidden:false,activeElement:null,documentElement:{},title:'',getElementById:id=>nodes[id],createElement:tag=>new Element(tag),querySelectorAll:selector=>all.filter(e=>matches(e,selector)),addEventListener:(name,fn)=>{(listeners[name]??=[]).push(fn);}};
 const window={...globals,location:{search,href:'https://school.example/apps/test/index.html'+search},localStorage:{getItem:k=>{if(denied)throw Error('denied');return storage.get(k);},setItem:(k,v)=>{if(denied)throw Error('denied');storage.set(k,v);}},APP360_SESSION:{getProfile:()=>child?{user_id:child}:null},setTimeout:fn=>{timers.set(++timerId,fn);return timerId;},clearTimeout:id=>timers.delete(id),history:{pushState(){},back(){(events.popstate||[]).forEach(f=>f());}},matchMedia:()=>({matches:false}),scrollTo(){},addEventListener:(name,fn)=>{(events[name]??=[]).push(fn);}};window.parent=window;
 vm.runInNewContext(fs.readFileSync(path.join(directory,script),'utf8'),{window,document,navigator:{}});
 return {nodes,window,document,storage,timers,click:id=>nodes[id].onclick(),dispatch:(name,arg={})=>(listeners[name]||[]).forEach(f=>f(arg)),tick(){const next=timers.entries().next().value;if(next){timers.delete(next[0]);next[1]();}},identity(id){child=id;(listeners['app360:authchange']||[]).forEach(f=>f());},deny(){denied=true;}};
};
