'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {createApp360Server} = require('../src/server');

function attachInbox(ws){
  const q=[],waiters=[];
  ws.addEventListener('message',e=>{let m;try{m=JSON.parse(String(e.data||''));}catch{return}for(let i=0;i<waiters.length;i++){if(waiters[i].pred(m)){const w=waiters.splice(i,1)[0];clearTimeout(w.t);w.resolve(m);return}}q.push(m)});
  return function next(pred=()=>true,timeout=3000){
    for(let i=0;i<q.length;i++)if(pred(q[i]))return Promise.resolve(q.splice(i,1)[0]);
    return new Promise((resolve,reject)=>{const w={pred,resolve,reject,t:null};w.t=setTimeout(()=>{const i=waiters.indexOf(w);if(i>=0)waiters.splice(i,1);reject(new Error('message timeout'));},timeout);waiters.push(w)});
  };
}
function openWs(url){
  return new Promise((resolve,reject)=>{
    const ws=new WebSocket(url);
    const t=setTimeout(()=>reject(new Error('open timeout')),3000);
    ws.addEventListener('open',()=>{clearTimeout(t);resolve({ws,next:attachInbox(ws)})},{once:true});
  });
}
function send(ws,obj){ws.send(JSON.stringify(obj));}
async function start(){const app=createApp360Server({root:process.cwd(),hostGraceMs:2500,pendingConnectMs:3000});const addr=await app.listen(0,'127.0.0.1');return {app,url:`ws://127.0.0.1:${addr.port}/family-ws`}}

test('relays family data both directions', async (t)=>{
  const {app,url}=await start(); t.after(()=>app.close());
  const H=await openWs(url), G=await openWs(url); t.after(()=>{try{H.ws.close()}catch{};try{G.ws.close()}catch{}});
  send(H.ws,{type:'peer-register',peerId:'app360fam-abc123'}); assert.equal((await H.next(m=>m.type==='peer-open')).peerId,'app360fam-abc123');
  send(G.ws,{type:'peer-register',peerId:'guest-one'}); await G.next(m=>m.type==='peer-open');
  send(G.ws,{type:'connect',hostId:'app360fam-abc123',connectionId:'c1',metadata:{name:'نور'}});
  const incoming=await H.next(m=>m.type==='incoming'); assert.equal(incoming.connectionId,'c1'); assert.equal(incoming.metadata.name,'نور'); await G.next(m=>m.type==='conn-open'&&m.connectionId==='c1');
  send(G.ws,{type:'data',connectionId:'c1',payload:{type:'heartbeat',n:1}}); assert.deepEqual((await H.next(m=>m.type==='data'&&m.connectionId==='c1')).payload,{type:'heartbeat',n:1});
  send(H.ws,{type:'data',connectionId:'c1',payload:{type:'welcome'}}); assert.deepEqual((await G.next(m=>m.type==='data'&&m.connectionId==='c1')).payload,{type:'welcome'});
});

test('keeps guest connection alive across host refresh grace', async (t)=>{
  const {app,url}=await start(); t.after(()=>app.close());
  let H=await openWs(url); const G=await openWs(url); t.after(()=>{try{H.ws.close()}catch{};try{G.ws.close()}catch{}});
  send(H.ws,{type:'peer-register',peerId:'app360fam-refresh'}); await H.next(m=>m.type==='peer-open');
  send(G.ws,{type:'peer-register',peerId:'guest-r'}); await G.next(m=>m.type==='peer-open');
  send(G.ws,{type:'connect',hostId:'app360fam-refresh',connectionId:'cr',metadata:{name:'child'}}); await H.next(m=>m.type==='incoming'&&m.connectionId==='cr'); await G.next(m=>m.type==='conn-open'&&m.connectionId==='cr');
  const suspendedP=G.next(m=>m.type==='conn-suspended'&&m.connectionId==='cr'); H.ws.close(); await suspendedP;
  send(G.ws,{type:'data',connectionId:'cr',payload:{type:'heartbeat',after:'refresh'}});
  H=await openWs(url); send(H.ws,{type:'peer-register',peerId:'app360fam-refresh'}); await H.next(m=>m.type==='peer-open'); await H.next(m=>m.type==='incoming'&&m.connectionId==='cr');
  const queued=await H.next(m=>m.type==='data'&&m.connectionId==='cr'); assert.deepEqual(queued.payload,{type:'heartbeat',after:'refresh'}); await G.next(m=>m.type==='conn-resumed'&&m.connectionId==='cr');
});

test('survives twelve consecutive host refresh handoffs', async (t)=>{
  const {app,url}=await start(); t.after(()=>app.close());
  let H=await openWs(url); const G=await openWs(url);
  t.after(()=>{try{H.ws.close()}catch{};try{G.ws.close()}catch{}});
  send(H.ws,{type:'peer-register',peerId:'app360fam-twelve'}); await H.next(m=>m.type==='peer-open');
  send(G.ws,{type:'peer-register',peerId:'guest-12'}); await G.next(m=>m.type==='peer-open');
  send(G.ws,{type:'connect',hostId:'app360fam-twelve',connectionId:'c12',metadata:{name:'child'}});
  await H.next(m=>m.type==='incoming'&&m.connectionId==='c12'); await G.next(m=>m.type==='conn-open'&&m.connectionId==='c12');
  for(let i=1;i<=12;i++){
    const suspended=G.next(m=>m.type==='conn-suspended'&&m.connectionId==='c12');
    H.ws.close(); await suspended;
    H=await openWs(url); send(H.ws,{type:'peer-register',peerId:'app360fam-twelve'});
    await H.next(m=>m.type==='peer-open'); await H.next(m=>m.type==='incoming'&&m.connectionId==='c12');
    await G.next(m=>m.type==='conn-resumed'&&m.connectionId==='c12');
    send(H.ws,{type:'data',connectionId:'c12',payload:{type:'cycle',i}});
    assert.equal((await G.next(m=>m.type==='data'&&m.connectionId==='c12')).payload.i,i);
  }
});
