(function(w){'use strict';
var lastLane=1;
function draw(canvas,s){var c=canvas.getContext('2d');if(!c)return;var W=480,H=560,p=s.progress,night=s.theme==='night',coast=s.theme==='coast',i,y,x;
function oval(x,y,rx,ry){c.save();c.translate(x,y);c.scale(rx,ry);c.beginPath();c.arc(0,0,1,0,Math.PI*2);c.fill();c.restore();}
function rect(x,y,a,b,color){c.fillStyle=color;c.fillRect(x,y,a,b);}
function circle(x,y,r,color){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();}
function line(x,y,x2,y2,color,width){c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function curve(d){return Math.sin(d/210+s.stage*.8)*(s.level===1?4+s.stage*4:12+s.level*4)+Math.sin(d/430)*9;}
function center(y){return 240+curve(p+(440-y)*1.8)-curve(p)*.25;}
function width(y){return 74+(y-90)*.29;}
function wy(at){return s.motion?440-(at-p)*.78:515-at*.42;}
function lane(at,l){var y=wy(at);return center(y)+(l-1)*width(y)*.63;}
rect(0,0,W,H,night?'#132c4a':'#a9e4ee');
if(night){for(i=0;i<24;i++)circle((i*79+31)%480,15+(i*43)%76,i%3===0?2:1,'#e7f3f3');circle(395,45,22,'#fff3bf');circle(386,37,21,'#132c4a');}else{circle(394,43,25,'#ffe19a');for(i=0;i<3;i++){x=50+i*130;circle(x,42+i%2*18,14,'#edf9f4');circle(x+18,36+i%2*18,20,'#edf9f4');circle(x+38,44+i%2*18,13,'#edf9f4');}}
c.beginPath();c.moveTo(0,110);c.quadraticCurveTo(75,10,175,112);c.quadraticCurveTo(320,12,480,107);c.lineTo(480,H);c.lineTo(0,H);c.fillStyle=night?'#244653':coast?'#75bebe':'#7bc78a';c.fill();
rect(0,126,W,434,night?'#28544c':coast?'#f4dca3':'#91ce77');
if(coast){rect(366,126,114,434,'#60c7d7');for(y=145;y<560;y+=35)line(398,y,462,y+5,'#b4eef0',3);}
// The verges, road and dashed lane markings all move relative to world distance.
var left=[],right=[];for(y=90;y<=580;y+=10){x=center(y);left.push([x-width(y),y]);right.unshift([x+width(y),y]);}
c.beginPath();c.moveTo(left[0][0],left[0][1]);for(i=1;i<left.length;i++)c.lineTo(left[i][0],left[i][1]);for(i=0;i<right.length;i++)c.lineTo(right[i][0],right[i][1]);c.closePath();c.fillStyle=night?'#263745':'#435361';c.fill();c.strokeStyle=night?'#b4cdc9':'#faf4d7';c.lineWidth=7;c.stroke();
for(i=-2;i<16;i++){var at=Math.floor(p/65)*65+i*65;y=wy(at);if(y<105||y>590)continue;x=center(y);var rw=width(y);for(var side=-1;side<=1;side+=2){line(x+side*rw,y,x+side*(rw+3),y+18,i%2?'#f9f2d7':'#e78367',7);if(s.level>1)line(x+side*rw*.315,y,x+side*(rw+6)*.315,y+17,'#f4efdb',3);}}
for(i=-2;i<13;i++){var treeAt=Math.floor(p/115)*115+i*115;y=wy(treeAt);if(y<123||y>600)continue;var scale=.45+(y-110)/500;x=center(y)+(i%2?-1:1)*(width(y)+35);c.save();c.translate(x,y);c.scale(scale,scale);if(night){line(0,12,0,-36,'#acced5',4);circle(0,-38,9,'#ffe9a9');}else{rect(-4,-5,8,26,'#97714c');circle(0,-17,24,coast?'#429987':'#409d66');circle(-12,-8,14,coast?'#5ab18a':'#68b66b');circle(9,-23,14,'#73bf72');if(!coast)circle(9,-18,4,'#ffbd68');}c.restore();}
if(s.hint>=0&&s.level>1&&!s.finished){c.save();c.globalAlpha=.12;for(y=220;y<445;y+=10){var hintAt=p+(440-y)/.78;x=lane(hintAt,s.hint);rect(x-width(y)*.24,y,width(y)*.48,11,'#c5f7b0');}c.restore();}
var finish=wy(960);if(finish>95&&finish<580){var fw=width(finish)*2,fx=center(finish)-fw/2;for(i=0;i<12;i++)for(var row=0;row<2;row++)rect(fx+i*fw/12,finish+row*9,fw/12+1,9,(i+row)%2?'#f8f5df':'#203746');line(fx,finish,fx,finish-43,'#f8f5df',4);line(fx+fw,finish,fx+fw,finish-43,'#f8f5df',4);}
for(i=0;i<s.track.flags.length;i++){if(s.flags.indexOf(i)>=0)continue;var f=s.track.flags[i];y=wy(f.at);if(y<104||y>585)continue;x=lane(f.at,f.lane);var radius=9+Math.max(0,y-100)/65;circle(x+2,y+5,radius+2,'rgba(16,40,45,.2)');circle(x,y,radius,'#ffda6c');circle(x,y,radius-4,'#fff1b0');line(x-3,y+7,x-3,y-8,'#b97637',2);c.beginPath();c.moveTo(x-2,y-8);c.lineTo(x+9,y-4);c.lineTo(x-2,y);c.fillStyle='#e78c4a';c.fill();}
for(i=0;i<s.track.cones.length;i++){var cone=s.track.cones[i];y=wy(cone.at);if(y<102||y>590)continue;x=lane(cone.at,cone.lane);var z=.55+(y-100)/480;c.save();c.translate(x,y);c.scale(z,z);c.fillStyle='rgba(15,30,40,.2)';oval(2,10,21,7);rect(-19,6,38,7,'#d77b48');c.beginPath();c.moveTo(-14,7);c.lineTo(0,-28);c.lineTo(14,7);c.fillStyle='#ff9d52';c.fill();line(-7,-9,7,-9,'#fff6da',5);line(-11,2,11,2,'#fff6da',5);c.restore();}
y=s.motion?440:wy(p);x=s.motion?center(y)+(s.lane-1)*width(y)*.63:lane(p,s.lane);c.save();c.translate(x,y);var tilt=(s.lane-lastLane)*.17;if(!s.motion)tilt=0;c.rotate(tilt);lastLane=s.lane;
c.fillStyle='rgba(9,30,40,.28)';oval(4,9,30,45);rect(-29,-26,10,23,'#172b39');rect(19,-26,10,23,'#172b39');rect(-29,17,10,23,'#172b39');rect(19,17,10,23,'#172b39');
var color=s.car==='mint'?'#51c7ae':s.car==='violet'?'#a493eb':'#f47e59';c.beginPath();c.moveTo(-21,-37);c.quadraticCurveTo(0,-49,21,-37);c.lineTo(24,34);c.quadraticCurveTo(0,48,-24,34);c.closePath();c.fillStyle=color;c.fill();c.strokeStyle='#ffe5c4';c.lineWidth=2;c.stroke();rect(-17,-26,34,17,'#d5f3f1');rect(-14,-22,28,10,'#518899');rect(-17,18,34,12,'#347283');rect(-16,-37,9,5,'#fff2b4');rect(7,-37,9,5,'#fff2b4');rect(-16,34,8,4,'#d94746');rect(8,34,8,4,'#d94746');line(-4,-5,-4,14,'#ffe6c7',3);line(4,-5,4,14,'#ffe6c7',3);c.restore();
if(s.finished){c.save();for(i=0;i<30;i++){rect((i*103+20)%480,120+(i*67)%360,5,9,['#ffc95b','#ff9174','#84debd','#bba7f2'][i%4]);}c.restore();}
}
w.LittleRaceScene={draw:draw};
})(window);
