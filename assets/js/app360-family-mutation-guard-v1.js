(function(w,d){
'use strict';
if(w.APP360_FAMILY_MUTATION_GUARD&&w.APP360_FAMILY_MUTATION_GUARD.__ready)return;
var Native=w.MutationObserver||w.WebKitMutationObserver||w.MozMutationObserver;
if(!Native){w.APP360_FAMILY_MUTATION_GUARD={__ready:true,version:'1.0.0',native:false};return}
function hasClass(el,n){var c=' '+String(el&&el.className||'')+' ';return c.indexOf(' '+n+' ')>=0}
function mediaOnlyTarget(node){var el=node&&node.nodeType===1?node:node&&node.parentNode,i=0,id;while(el&&i<7){id=el.id||'';if(hasClass(el,'a360-media-btn')||id==='app360MediaStatuses'||hasClass(el,'a360-media-status'))return true;if(hasClass(el,'a360-person-controls')||hasClass(el,'a360-person')||hasClass(el,'a360-family-people'))return false;el=el.parentNode;i++}return false}
function GuardedMutationObserver(cb){var scheduled=false,last=null,self=this;this._inner=new Native(function(muts,obs){var keep=[],i,m;for(i=0;i<muts.length;i++){m=muts[i];if(!mediaOnlyTarget(m.target))keep.push(m)}if(!keep.length)return;last={m:keep,o:obs};if(scheduled)return;scheduled=true;setTimeout(function(){var x=last;last=null;scheduled=false;if(x)try{cb(x.m,x.o)}catch(e){setTimeout(function(){throw e},0)}},45)});this.observe=function(t,o){return self._inner.observe(t,o)};this.disconnect=function(){last=null;scheduled=false;return self._inner.disconnect()};this.takeRecords=function(){return self._inner.takeRecords()}}
try{w.MutationObserver=GuardedMutationObserver;if(w.WebKitMutationObserver===Native)w.WebKitMutationObserver=GuardedMutationObserver;if(w.MozMutationObserver===Native)w.MozMutationObserver=GuardedMutationObserver}catch(e){}
w.APP360_FAMILY_MUTATION_GUARD={__ready:true,version:'1.0.0',native:true};
})(window,document);
