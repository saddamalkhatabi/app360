(function(w){
'use strict';
var C=w.APP360_CALM_CONTENT||{};
var STATE_KEY='app360:a1-calm:schema-1.0:state';
var AGE_KEY='app360:a1-calm:age-band';
var allowed={'1-2':1,'2-3':1,'3-4':1,'4-5':1};
function getStore(k){try{return w.localStorage.getItem(k)||''}catch(e){return''}}
function setStore(k,v){try{w.localStorage.setItem(k,v);return true}catch(e){return false}}
function parse(s){try{return JSON.parse(s)}catch(e){return null}}
function ageAllowed(item,age){var a=item&&item.age_bands,i;if(!a||!a.length)return true;for(i=0;i<a.length;i++)if(a[i]===age)return true;return false}
function profile(age){var a=C.age_bands||[],i;for(i=0;i<a.length;i++)if(a[i].id===age)return a[i];return a[1]||a[0]||{id:'2-3',max_signals:10,max_feelings:6,max_helps:12}}
function filtered(list,age,max){var out=[],i;for(i=0;i<(list||[]).length;i++){if(ageAllowed(list[i],age))out.push(list[i]);if(max&&out.length>=max)break}return out}
function byId(list,id){var i;for(i=0;i<(list||[]).length;i++)if(list[i].id===id)return list[i];return null}
var storedState=parse(getStore(STATE_KEY));
var age=getStore(AGE_KEY)||(storedState&&storedState.settings&&storedState.settings.age_band)||'2-3';
if(!allowed[age])age='2-3';
var p=profile(age),allHelps=C.helps||[],oldLib=storedState&&storedState.library||[],newLib=[],i,base,old,custom=[];
for(i=0;i<oldLib.length;i++)if(oldLib[i]&&oldLib[i].custom)custom.push(oldLib[i]);
for(i=0;i<allHelps.length;i++)if(ageAllowed(allHelps[i],age)){
  base=JSON.parse(JSON.stringify(allHelps[i]));
  old=byId(oldLib,base.id);
  if(old){if(old.label_ar)base.label_ar=old.label_ar;if(typeof old.enabled!=='undefined')base.enabled=old.enabled;if(old.audio)base.audio=old.audio;if(old.image&&old.custom)base.image=old.image}
  newLib.push(base);
  if(p.max_helps&&newLib.length>=p.max_helps)break;
}
for(i=0;i<custom.length;i++)newLib.push(custom[i]);
if(storedState&&typeof storedState==='object'){
  if(!storedState.settings)storedState.settings={speech:true};
  storedState.settings.age_band=age;
  storedState.library=newLib;
  setStore(STATE_KEY,JSON.stringify(storedState));
}
C.signals=filtered(C.signals||[],age,p.max_signals||0);
C.feelings=filtered(C.feelings||[],age,p.max_feelings||0);
C.helps=filtered(allHelps,age,p.max_helps||0);
w.APP360_CALM_AGE_BAND=age;
w.APP360_CALM_AGE_PROFILE=p;
w.APP360_CALM_SET_AGE=function(next){if(!allowed[next])return false;setStore(AGE_KEY,next);var s=parse(getStore(STATE_KEY));if(s){if(!s.settings)s.settings={speech:true};s.settings.age_band=next;setStore(STATE_KEY,JSON.stringify(s))}return true};
})(window);
