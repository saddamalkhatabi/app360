(function(w,d){
'use strict';
function rootPath(){var p=(w.location&&w.location.pathname)||'/',i=p.indexOf('/apps/');if(i>=0)return p.substring(0,i+1);i=p.lastIndexOf('/');return i>=0?p.substring(0,i+1):'/'}
function origin(){return w.location.protocol+'//'+w.location.host}
function merge(){var api=w.APP360_FAMILY_SYNC;if(!api||!api.apps)return false;var x;try{x=new XMLHttpRequest();x.open('GET',origin()+rootPath()+'data/catalog.json?v=57&_='+(+new Date()),true);x.onreadystatechange=function(){if(x.readyState!==4||x.status<200||x.status>=300)return;var j,a,i,k,exists,slug,m;try{j=JSON.parse(x.responseText||'{}')}catch(e){return}a=j&&j.apps||[];for(i=0;i<a.length;i++){if(!a[i]||!a[i].href||a[i].status!=='live')continue;slug=a[i].slug||'';if(!slug){m=/\/apps\/[^/]+\/([^/]+)\//.exec('/'+String(a[i].href||''));slug=m&&m[1]||''}if(!slug)continue;exists=false;for(k=0;k<api.apps.length;k++)if(api.apps[k].id===a[i].id||api.apps[k].slug===slug){api.apps[k].title=a[i].title_ar||api.apps[k].title;api.apps[k].href=a[i].href||api.apps[k].href;exists=true;break}if(!exists)api.apps.push({id:a[i].id||('app-'+slug),slug:slug,title:a[i].title_ar||slug,href:a[i].href})}try{var ev=d.createEvent('Event');ev.initEvent('app360:family-apps-updated',true,false);d.dispatchEvent(ev)}catch(e2){}};x.send(null)}catch(e){return false}return true}
function start(){if(merge())return;setTimeout(start,120)}
if(d.readyState==='loading'){if(d.addEventListener)d.addEventListener('DOMContentLoaded',start,false);else if(w.attachEvent)w.attachEvent('onload',start)}else start();
})(window,document);
