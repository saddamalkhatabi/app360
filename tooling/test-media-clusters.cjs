'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {webmDuration,validateMedia}=require('../services/app360-data-core/src/media-validation');
function vint(n){for(let size=1;size<=4;size++){if(n<Math.pow(2,7*size)-1){const b=Buffer.alloc(size);for(let i=size-1;i>=0;i--){b[i]=n%256;n=Math.floor(n/256)}b[0]|=1<<(8-size);return b}}throw Error('size');}
function el(id,data,unknown=false){return Buffer.concat([Buffer.from(id,'hex'),unknown?Buffer.from('01ffffffffffffff','hex'):vint(data.length),data])}
function uint(n){return n>255?Buffer.from([n>>8,n&255]):Buffer.from([n])}
function cluster(clock,unknown=true){return el('1f43b675',Buffer.concat([el('e7',uint(clock)),el('a3',Buffer.from([0x81,0,0,0x80,1]))]),unknown)}
function file(count=20,interval=1000){return Buffer.concat([el('1a45dfa3',Buffer.alloc(0)),el('18538067',Buffer.concat([el('1549a966',el('2ad7b1',Buffer.from([0x0f,0x42,0x40]))),...Array.from({length:count},(_,i)=>cluster(i*interval))]),true)])}
test('MediaRecorder consecutive unknown-sized Clusters are siblings, even after more than eight chunks',()=>{assert.equal(webmDuration(file()),19020);assert.equal(validateMedia(file(),'video/webm','video').duration_ms,19020)});
test('duration is measured across every streaming Cluster and the 30-second cap remains enforced',()=>{assert.throws(()=>validateMedia(file(32),'video/webm','video'),/30/);assert(webmDuration(file(10,2900))>26000)});
test('unknown sizes are not allowed for media blocks or arbitrary leaves, and truncation is rejected',()=>{const b=file();assert.throws(()=>webmDuration(b.subarray(0,b.length-1)),/Truncated/);const malformed=Buffer.concat([el('1a45dfa3',Buffer.alloc(0)),el('18538067',el('a3',Buffer.from([0x81,0,0,0,1]),true),true)]);assert.throws(()=>webmDuration(malformed),/unknown WebM size/)});
module.exports={file,cluster,el};
