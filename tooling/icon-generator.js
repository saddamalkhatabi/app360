'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}
function parseHex(hex) {
  const h = String(hex || '#0f8f8a').replace('#', '');
  return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16), 255];
}
function hashText(s) {
  let h = 2166136261 >>> 0;
  for (let i=0;i<s.length;i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) >>> 0; }
  return h >>> 0;
}
function insideRounded(x,y,left,top,right,bottom,r) {
  if (x>=left+r && x<=right-r && y>=top && y<=bottom) return true;
  if (y>=top+r && y<=bottom-r && x>=left && x<=right) return true;
  const cx=x<left+r?left+r:right-r, cy=y<top+r?top+r:bottom-r;
  const dx=x-cx,dy=y-cy; return dx*dx+dy*dy<=r*r;
}
function set(buf,w,x,y,c) {
  if(x<0||y<0||x>=w||y>=w)return; const i=(y*w+x)*4;
  buf[i]=c[0];buf[i+1]=c[1];buf[i+2]=c[2];buf[i+3]=c[3];
}
function fillCircle(buf,w,cx,cy,r,c) {
  const r2=r*r;
  for(let y=Math.max(0,cy-r);y<=Math.min(w-1,cy+r);y++) for(let x=Math.max(0,cx-r);x<=Math.min(w-1,cx+r);x++) {const dx=x-cx,dy=y-cy;if(dx*dx+dy*dy<=r2)set(buf,w,x,y,c)}
}
function ring(buf,w,cx,cy,r,thick,c,startGap) {
  const outer=r*r,inner=(r-thick)*(r-thick);
  for(let y=Math.max(0,cy-r);y<=Math.min(w-1,cy+r);y++) for(let x=Math.max(0,cx-r);x<=Math.min(w-1,cx+r);x++) {const dx=x-cx,dy=y-cy,d=dx*dx+dy*dy;if(d<=outer&&d>=inner){let a=Math.atan2(dy,dx);if(a<0)a+=Math.PI*2;if(!(a>startGap[0]&&a<startGap[1]))set(buf,w,x,y,c)}}
}
function triangle(buf,w,a,b,c0,color) {
  function area(p1,p2,p3){return (p1[0]*(p2[1]-p3[1])+p2[0]*(p3[1]-p1[1])+p3[0]*(p1[1]-p2[1]))/2}
  const minX=Math.floor(Math.min(a[0],b[0],c0[0])),maxX=Math.ceil(Math.max(a[0],b[0],c0[0]));
  const minY=Math.floor(Math.min(a[1],b[1],c0[1])),maxY=Math.ceil(Math.max(a[1],b[1],c0[1]));
  const A=Math.abs(area(a,b,c0));
  for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const p=[x,y],sum=Math.abs(area(p,b,c0))+Math.abs(area(a,p,c0))+Math.abs(area(a,b,p));if(Math.abs(sum-A)<0.7)set(buf,w,x,y,color)}
}
function buildPng(size, opts) {
  const bg=[243,248,247,255], white=[255,255,255,255], accent=parseHex(opts.accent || '#ffd54f'), primary=parseHex(opts.primary);
  const pixels=Buffer.alloc(size*size*4); for(let i=0;i<pixels.length;i+=4){pixels[i]=bg[0];pixels[i+1]=bg[1];pixels[i+2]=bg[2];pixels[i+3]=255}
  const s=size/512, l=Math.round(36*s), t=l, r=size-l-1, b=r, rr=Math.round(108*s);
  for(let y=t;y<=b;y++)for(let x=l;x<=r;x++)if(insideRounded(x,y,l,t,r,b,rr))set(pixels,size,x,y,primary);
  const h=hashText(opts.seed||'app360'), shift=((h>>>8)%45)-22;
  ring(pixels,size,Math.round(256*s),Math.round(238*s),Math.round(132*s),Math.max(4,Math.round(20*s)),white,[5.2,6.05]);
  const px=(256+shift)*s;
  triangle(pixels,size,[Math.round((194+shift/4)*s),Math.round(164*s)],[Math.round((346+shift/4)*s),Math.round(255*s)],[Math.round((194+shift/4)*s),Math.round(346*s)],white);
  fillCircle(pixels,size,Math.round((150+(h%35))*s),Math.round((380-((h>>>5)%28))*s),Math.max(5,Math.round(17*s)),accent);
  // Accent sweep made from overlapping circles, gives each slug a slightly different signature.
  for(let i=0;i<7;i++)fillCircle(pixels,size,Math.round((174+i*25)*s),Math.round((394-((h+i*17)%42))*s),Math.max(3,Math.round(8*s)),accent);

  const raw=Buffer.alloc((size*4+1)*size);
  for(let y=0;y<size;y++){const off=y*(size*4+1);raw[off]=0;pixels.copy(raw,off+1,y*size*4,(y+1)*size*4)}
  const ihdr=Buffer.alloc(13); ihdr.writeUInt32BE(size,0);ihdr.writeUInt32BE(size,4);ihdr[8]=8;ihdr[9]=6;ihdr[10]=0;ihdr[11]=0;ihdr[12]=0;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',ihdr),chunk('IDAT',zlib.deflateSync(raw,{level:9})),chunk('IEND',Buffer.alloc(0))]);
}
function writeIconPngs(target, opts) {
  for (const size of [192,512]) fs.writeFileSync(path.join(target,`icon-${size}.png`),buildPng(size,opts));
}
module.exports={buildPng,writeIconPngs};
