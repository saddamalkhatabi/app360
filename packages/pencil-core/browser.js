/* App360 pencil contract v1: ES5 canvas primitives shared with foundations. */
(function(w){'use strict';
function segment(ctx,a,b){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}
function quadratic(ctx,a,b,c){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.quadraticCurveTo(b.x,b.y,c.x,c.y);ctx.stroke()}
function line(ctx,points,options){options=options||{};if(!points||!points.length)return;var sx=options.width||1,sy=options.height||1,i,p,last,mid;ctx.save();ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=options.penWidth||5;ctx.strokeStyle=options.color||points[0].c||'#27354b';ctx.globalCompositeOperation=options.erase?'destination-out':'source-over';p={x:points[0].x*sx,y:points[0].y*sy};if(points.length===1){ctx.fillStyle=ctx.strokeStyle;ctx.beginPath();ctx.arc(p.x,p.y,ctx.lineWidth/2,0,Math.PI*2);ctx.fill();ctx.restore();return}ctx.beginPath();ctx.moveTo(p.x,p.y);for(i=1;i<points.length;i++){last=p;p={x:points[i].x*sx,y:points[i].y*sy};if(options.smooth){mid={x:(last.x+p.x)/2,y:(last.y+p.y)/2};ctx.quadraticCurveTo(last.x,last.y,mid.x,mid.y)}else ctx.lineTo(p.x,p.y)}ctx.lineTo(p.x,p.y);ctx.stroke();ctx.restore()}
function stamp(ctx,kind,x,y,size,color){ctx.save();ctx.translate(x,y);ctx.scale(size/100,size/100);ctx.lineWidth=4;ctx.lineCap='round';ctx.lineJoin='round';ctx.strokeStyle=color||'#7a60bd';ctx.fillStyle=color||'#7a60bd';ctx.beginPath();var i,a;
if(kind==='heart'){ctx.moveTo(0,36);ctx.bezierCurveTo(-64,-4,-38,-55,0,-20);ctx.bezierCurveTo(38,-55,64,-4,0,36);ctx.fill()}
else if(kind==='star'){for(i=0;i<10;i++){a=i*Math.PI/5-Math.PI/2;var r=i%2?20:43;ctx[i?'lineTo':'moveTo'](Math.cos(a)*r,Math.sin(a)*r)}ctx.closePath();ctx.fill()}
else if(kind==='sun'){ctx.arc(0,0,23,0,Math.PI*2);ctx.fill();for(i=0;i<8;i++){a=i*Math.PI/4;segment(ctx,{x:Math.cos(a)*32,y:Math.sin(a)*32},{x:Math.cos(a)*44,y:Math.sin(a)*44})}}
else if(kind==='flower'){for(i=0;i<5;i++){a=i*Math.PI*2/5;ctx.beginPath();ctx.arc(Math.cos(a)*20,Math.sin(a)*20,16,0,Math.PI*2);ctx.fill()}ctx.fillStyle='#ffd678';ctx.beginPath();ctx.arc(0,0,12,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#459b78';segment(ctx,{x:0,y:24},{x:0,y:47})}
else if(kind==='house'){ctx.moveTo(-38,-4);ctx.lineTo(0,-40);ctx.lineTo(38,-4);ctx.closePath();ctx.fill();ctx.fillRect(-28,-3,56,44);ctx.strokeStyle='#fff';segment(ctx,{x:0,y:40},{x:0,y:16})}
else if(kind==='book'){ctx.moveTo(0,-25);ctx.quadraticCurveTo(-20,-39,-40,-27);ctx.lineTo(-40,32);ctx.quadraticCurveTo(-18,22,0,35);ctx.quadraticCurveTo(18,22,40,32);ctx.lineTo(40,-27);ctx.quadraticCurveTo(20,-39,0,-25);ctx.closePath();ctx.stroke();segment(ctx,{x:0,y:-25},{x:0,y:35})}
else if(kind==='balloon'){ctx.ellipse?ctx.ellipse(0,-10,28,35,0,0,Math.PI*2):ctx.arc(0,-10,30,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(0,25);ctx.bezierCurveTo(-15,34,18,41,0,51);ctx.stroke()}
else if(kind==='leaf'){ctx.moveTo(-32,30);ctx.quadraticCurveTo(-50,-30,36,-36);ctx.quadraticCurveTo(42,25,-32,30);ctx.fill();ctx.strokeStyle='#fff';segment(ctx,{x:-26,y:24},{x:26,y:-26})}
else if(kind==='smile'){ctx.arc(0,0,40,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(-13,-10,3,0,Math.PI*2);ctx.arc(13,-10,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(0,0,23,.2,Math.PI-.2);ctx.stroke()}
else {ctx.arc(0,0,35,0,Math.PI*2);ctx.stroke()}ctx.restore()}
function artwork(ctx,commands,width,height){ctx.clearRect(0,0,width,height);for(var i=0;i<commands.length;i++){var c=commands[i];if(c.type==='stroke')line(ctx,c.points,{width:width,height:height,penWidth:c.width*width/1000,color:c.color,erase:c.erase,smooth:true});else if(c.type==='stamp')stamp(ctx,c.kind,c.x*width,c.y*height,c.size*width,c.color)}}
w.APP360_PENCIL={version:1,segment:segment,quadratic:quadratic,line:line,stamp:stamp,artwork:artwork};
})(typeof window!=='undefined'?window:globalThis);
