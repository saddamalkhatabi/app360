'use strict';
const assert=require('assert'),W=require('../src/watch.js'),M=require('../src/model.js');
let scheduled=new Map(),nextId=0,reads=[],shown=[],stops=0,blocked=0;
const c=W.create({setTimeout(fn,ms){scheduled.set(++nextId,{fn,ms});return nextId},clearTimeout(id){scheduled.delete(id)},stop(){stops++},render(s){shown.push(s)},speak(s,done){reads.push({s,done})},blocked(){blocked++}});
function end(error){reads[reads.length-1].done(error)}function advance(){assert(scheduled.size);let [id,v]=scheduled.entries().next().value;scheduled.delete(id);v.fn()}
c.start(['a','b']);assert.equal(c.snapshot().stage,0);let stale=reads[0].done;c.pause();stale();assert.equal(scheduled.size,0);assert(!c.snapshot().running);
c.play();end();assert.equal([...scheduled.values()][0].ms,850);c.pause();assert.equal(scheduled.size,0);
c.play();end('blocked');assert.equal(blocked,1);assert(!c.snapshot().running);assert.equal(scheduled.size,0);
c.play();end('unavailable');assert.equal([...scheduled.values()][0].ms,4500);advance();assert.equal(c.snapshot().stage,1);
c.move(1,true);assert.equal(c.snapshot().id,'b');assert.equal(c.snapshot().stage,0);c.move(1,true);assert.equal(c.snapshot().id,'b');
c.pause();c.move(-1,true);assert.equal(c.snapshot().id,'a');assert(!c.snapshot().running);assert.equal(scheduled.size,0);
c.start(Array.from({length:60},(_,i)=>'q'+i));for(let i=0;i<360;i++){assert(c.snapshot().running);end();advance()}assert(c.snapshot().ended);assert(!c.snapshot().running);assert.equal(c.snapshot().index,59);assert.equal(scheduled.size,0);
c.play();assert.equal(c.snapshot().index,0);let late=reads[reads.length-1].done;c.close();late();assert.equal(c.snapshot().ids.length,0);assert.equal(scheduled.size,0);
assert.equal(M.blank().captions,true);let s=M.blank();s.captions=false;assert.equal(M.restore(JSON.stringify(s)).captions,false);delete s.captions;assert.equal(M.restore(JSON.stringify(s)).captions,true);
console.log('Viewing queue: 360 narrated stages, cancellation, blocked audio, failures, boundaries, restart and saved-caption migration passed.');
