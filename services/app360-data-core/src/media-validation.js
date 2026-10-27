'use strict';
const fail=message=>Object.assign(Error(message),{httpStatus:400});
function wavDuration(b){
 if(b.length<44||b.toString('ascii',0,4)!=='RIFF'||b.toString('ascii',8,12)!=='WAVE')throw fail('Invalid WAV');
 let rate=0,bytes=0,alignment=0;
 for(let i=12;i+8<=b.length;){const size=b.readUInt32LE(i+4),end=i+8+size;if(end>b.length)throw fail('Truncated WAV');const id=b.toString('ascii',i,i+4);if(id==='fmt '&&size>=16){const format=b.readUInt16LE(i+8),channels=b.readUInt16LE(i+10),sampleRate=b.readUInt32LE(i+12),bits=b.readUInt16LE(i+22);if(format!==1||![1,2].includes(channels)||![8,16,24,32].includes(bits)||sampleRate<8000||sampleRate>96000)throw fail('Only valid mono/stereo PCM WAV is accepted');rate=b.readUInt32LE(i+16);alignment=b.readUInt16LE(i+20);if(alignment!==channels*bits/8||rate!==sampleRate*alignment)throw fail('Inconsistent WAV timing header');}if(id==='data')bytes+=size;i=end+(size%2);}
 if(!rate||!bytes||bytes%alignment)throw fail('Missing or misaligned WAV data');return bytes/rate*1000;
}
function mp4Duration(b){
 if(b.length<16||b.toString('ascii',4,8)!=='ftyp')throw fail('Invalid MP4');
 let duration=0,tracks=0;
 // Check each nonfragmented track's sample timeline too: duration headers alone
 // can understate a long upload. ISO stts stores count/delta pairs per track.
 function timeline(start,end,scale){let ticks=0,seen=false;function scan(a,z,depth){if(depth>8)throw fail('Invalid MP4 timeline nesting');for(let p=a;p+8<=z;){let size=b.readUInt32BE(p),head=8;if(size===1){if(p+16>z)throw fail('Truncated MP4');const big=b.readBigUInt64BE(p+8);if(big>BigInt(Number.MAX_SAFE_INTEGER))throw fail('Invalid MP4 size');size=Number(big);head=16;}if(!size)size=z-p;if(size<head||p+size>z)throw fail('Truncated MP4 timeline');const type=b.toString('ascii',p+4,p+8),s=p+head,e=p+size;if(type==='mdhd'){const at=s+(b[s]===1?20:12);if(at+4>e)throw fail('Invalid MP4 scale');scale=b.readUInt32BE(at);}if(type==='stts'){if(s+8>e)throw fail('Truncated MP4 sample timing');const count=b.readUInt32BE(s+4);if(count>100000||s+8+count*8!==e)throw fail('Invalid MP4 sample timing');for(let n=0;n<count;n++){ticks+=b.readUInt32BE(s+8+n*8)*b.readUInt32BE(s+12+n*8);if(!Number.isSafeInteger(ticks))throw fail('Invalid MP4 timeline duration');}seen=true;}if(['mdia','minf','stbl'].includes(type))scan(s,e,depth+1);p+=size;}}scan(start,end,0);if(!seen||!scale||!ticks)throw fail('MP4 needs a complete sample timeline');return ticks/scale*1000;}
 function walk(start,end,depth){if(depth>5)throw fail('Invalid MP4 nesting');for(let p=start;p+8<=end;){let n=b.readUInt32BE(p),head=8;if(n===1){if(p+16>end)throw fail('Truncated MP4');const big=b.readBigUInt64BE(p+8);if(big>BigInt(Number.MAX_SAFE_INTEGER))throw fail('Invalid MP4 size');n=Number(big);head=16;}if(n===0)n=end-p;if(n<head||p+n>end)throw fail('Truncated MP4 box');const type=b.toString('ascii',p+4,p+8),s=p+head,e=p+n;if(type==='mvhd'||type==='mdhd'){const v=b[s],at=s+(v===1?20:12);if((v!==0&&v!==1)||at+(v===1?12:8)>e)throw fail('Invalid MP4 duration');const scale=b.readUInt32BE(at),ticks=v===1?Number(b.readBigUInt64BE(at+4)):b.readUInt32BE(at+4);if(!scale||!Number.isFinite(ticks))throw fail('Invalid MP4 timescale');duration=Math.max(duration,ticks/scale*1000);if(type==='mdhd')tracks++;}if(['moov','trak','mdia'].includes(type))walk(s,e,depth+1);if(type==='moof')throw fail('Fragmented MP4 is not accepted; use browser recording');p+=n;}}
 walk(0,b.length,0);if(!tracks||!duration)throw fail('MP4 needs a complete duration header');
 for(let p=0;p+8<=b.length;){let size=b.readUInt32BE(p);if(size===0)size=b.length-p;if(size===1)size=Number(b.readBigUInt64BE(p+8));if(size<8||p+size>b.length)throw fail('Invalid MP4');if(b.toString('ascii',p+4,p+8)==='moov'){const head=b.readUInt32BE(p)===1?16:8;for(let n=p+head;n+8<=p+size;){let length=b.readUInt32BE(n),trackHead=8;if(length===1){length=Number(b.readBigUInt64BE(n+8));trackHead=16;}if(!length)length=p+size-n;if(length<trackHead||n+length>p+size)throw fail('Invalid MP4 track');if(b.toString('ascii',n+4,n+8)==='trak')duration=Math.max(duration,timeline(n+trackHead,n+length));n+=length;}}p+=size;}
 return duration;
}
function webmDuration(b){
 if(b.length<8||b.readUInt32BE(0)!==0x1a45dfa3)throw fail('Invalid WebM');
 function vint(pos,keep){if(pos>=b.length)throw fail('Truncated WebM');let n=1,mask=128;while(n<=8&&!(b[pos]&mask)){n++;mask>>=1;}if(n>8||keep&&n>4||pos+n>b.length)throw fail('Invalid WebM integer');let value=keep?b[pos]:b[pos]&(mask-1),unknown=!keep&&(b[pos]&(mask-1))===mask-1;for(let i=1;i<n;i++){value=value*256+b[pos+i];unknown=unknown&&b[pos+i]===255;}if(!unknown&&!Number.isSafeInteger(value))throw fail('Invalid WebM integer');return {n,value,unknown};}
 let scale=1000000,declared=0,last=0,first=0,blocks=0,defaultMs=0,elements=0;
 const levels=new Map([[0x18538067,0],[0x1549a966,1],[0x1654ae6b,1],[0x1f43b675,1],[0x114d9b74,1],[0x1c53bb6b,1],[0x1254c367,1],[0x1043a770,1],[0x1941a469,1],[0xae,2],[0xa0,2]]);
 const masters=new Set([0x18538067,0x1549a966,0x1654ae6b,0xae,0x1f43b675,0xa0]);
 function uint(s,e){let n=0;if(e-s<1||e-s>8)throw fail('Invalid WebM scalar');for(let p=s;p<e;p++)n=n*256+b[p];if(!Number.isSafeInteger(n))throw fail('Invalid WebM scalar');return n;}
 // An unknown-sized Cluster ends at its next level-one sibling. It is not
 // the parent of every later Cluster emitted by MediaRecorder.start(timeslice).
 function walk(start,end,parent,depth,unknown,inheritedClock){if(depth>8)throw fail('Invalid WebM nesting');let clock=inheritedClock||0,p=start;for(;p<end;){if(++elements>500000)throw fail('Too many WebM elements');const id=vint(p,true),level=levels.get(id.value);if(unknown&&level!==undefined&&level<=levels.get(parent))return p;
  const size=vint(p+id.n,false),a=p+id.n+size.n,z=size.unknown?end:a+size.value;if(a>end||z>end||z<a)throw fail('Truncated WebM element');if(size.unknown&&id.value!==0x18538067&&id.value!==0x1f43b675)throw fail('Invalid unknown WebM size');
  if(level!==undefined&&((parent===0&&id.value!==0x18538067)||(parent===0x18538067&&level!==1)||(parent===0x1654ae6b&&id.value!==0xae)||(parent===0x1f43b675&&level<=1)))throw fail('Invalid WebM hierarchy');
  if(id.value===0x2ad7b1){scale=uint(a,z);if(!scale)throw fail('Invalid WebM scale');}
  if(id.value===0x4489){if(z-a!==4&&z-a!==8)throw fail('Invalid WebM duration');const value=z-a===4?b.readFloatBE(a):b.readDoubleBE(a);if(!Number.isFinite(value)||value<0)throw fail('Invalid WebM duration');declared=Math.max(declared,value);}
  if(id.value===0x23e383)defaultMs=Math.max(defaultMs,uint(a,z)/1e6);
  if(id.value===0xe7)clock=uint(a,z);
  if(id.value===0xa3||id.value===0xa1){if(parent!==0x1f43b675&&parent!==0xa0)throw fail('WebM block outside cluster');const track=vint(a,false);if(a+track.n+3>=z)throw fail('Truncated WebM block');const flags=b[a+track.n+2];if(flags&6)throw fail('Laced WebM is not accepted');const stamp=clock+b.readInt16BE(a+track.n);first=Math.min(first,stamp);last=Math.max(last,stamp);blocks++;}
  if(masters.has(id.value)){const next=walk(a,z,id.value,depth+1,size.unknown,id.value===0xa0?clock:0);if(next<=p)throw fail('Invalid WebM progress');p=next;}else p=z;
 }return p;}
 walk(0,b.length,0,0,false);if(!blocks)throw fail('WebM has no media blocks');return Math.max(declared*scale/1e6,(last-first)*scale/1e6+Math.max(defaultMs,20));
}
function validateMedia(buffer,mime,kind){
 if(!Buffer.isBuffer(buffer)||!buffer.length)throw fail('Empty recording');
 const maximum=kind==='video'?6*1024*1024:2*1024*1024,limit=kind==='video'?30000:15000;
 if(buffer.length>maximum)throw fail(kind==='video'?'الفيديو أكبر من 6 MB؛ أعد تسجيله بجودة أقل':'الصوت أكبر من 2 MB');
 let duration;if(mime==='audio/wav'&&kind==='praise')duration=wavDuration(buffer);else if(mime==='video/mp4'&&kind==='video')duration=mp4Duration(buffer);else if(mime==='video/webm'&&kind==='video'||mime==='audio/webm'&&kind==='praise')duration=webmDuration(buffer);else throw fail('صيغة غير مدعومة؛ استخدم التسجيل من المتصفح');
 if(!Number.isFinite(duration)||duration<=0||duration>limit)throw fail(kind==='video'?'يجب ألا يتجاوز الفيديو 30 ثانية':'يجب ألا يتجاوز التشجيع 15 ثانية');
 return {duration_ms:Math.ceil(duration),byte_size:buffer.length,mime};
}
module.exports={validateMedia,wavDuration,mp4Duration,webmDuration};
