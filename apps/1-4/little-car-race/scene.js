(function(w){'use strict';
var lastLane=1,thumbnails={};
function draw(canvas,s){var c=canvas.getContext('2d');if(!c)return;var W=480,H=560,p=s.progress,night=s.theme==='night',coast=s.theme==='coast',i,y,x;
function oval(x,y,rx,ry){c.save();c.translate(x,y);c.scale(rx,ry);c.beginPath();c.arc(0,0,1,0,Math.PI*2);c.fill();c.restore();}
function rect(x,y,a,b,color){c.fillStyle=color;c.fillRect(x,y,a,b);}
function circle(x,y,r,color){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();}
function line(x,y,x2,y2,color,width){c.beginPath();c.moveTo(x,y);c.lineTo(x2,y2);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
function curve(d){return 0;}
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
for(i=0;i<s.track.flags.length;i++){if(s.flags.indexOf(i)>=0)continue;var f=s.track.flags[i],word=s.offers&&s.offers[i];y=wy(f.at);if(y<104||y>585)continue;x=lane(f.at,f.lane);var size=23+Math.max(0,y-100)/15;c.save();c.translate(x,y);c.fillStyle='rgba(15,35,40,.2)';oval(3,size*.47,size*.64,size*.2);rect(-size*.58,-size*.58,size*1.16,size*1.16,'#e6a85e');rect(-size*.48,-size*.48,size*.96,size*.96,'#fff5d9');var img=word&&s.imageFor&&s.imageFor(word);if(img&&img.complete&&img.naturalWidth){var thumb=thumbnails[word.id];if(!thumb){thumb=document.createElement('canvas');thumb.width=thumb.height=12;var tc=thumb.getContext('2d');tc.drawImage(img,0,0,12,12);thumbnails[word.id]=thumb;}c.globalAlpha=.8;if('filter'in c)c.filter='blur(2.7px)';c.drawImage(thumb,-size*.44,-size*.44,size*.88,size*.88);if('filter'in c)c.filter='none';c.globalAlpha=1;}else{c.font='bold '+Math.round(size*.8)+'px Arial';c.textAlign='center';c.fillStyle='#c79959';c.fillText('?',0,size*.25);}rect(-size*.11,-size*.58,size*.22,size*1.16,'rgba(255,214,124,.8)');rect(-size*.58,-size*.11,size*1.16,size*.22,'rgba(255,214,124,.8)');circle(0,0,size*.2,'#fff4d0');c.font='bold '+Math.round(size*.32)+'px Arial';c.textAlign='center';c.fillStyle='#896037';c.fillText('?',0,size*.11);c.strokeStyle='#bc8045';c.lineWidth=2;c.strokeRect(-size*.58,-size*.58,size*1.16,size*1.16);c.restore();}
for(i=0;i<s.track.cones.length;i++){var cone=s.track.cones[i];y=wy(cone.at);if(y<102||y>590)continue;x=lane(cone.at,cone.lane);var z=.55+(y-100)/480;c.save();c.translate(x,y);c.scale(z,z);c.fillStyle='rgba(15,30,40,.2)';oval(2,10,23,8);c.beginPath();c.moveTo(-25,8);c.lineTo(-20,-9);c.lineTo(-8,-23);c.lineTo(10,-26);c.lineTo(23,-9);c.lineTo(27,8);c.closePath();c.fillStyle='#7a858c';c.fill();c.strokeStyle='#536470';c.lineWidth=2;c.stroke();c.beginPath();c.moveTo(-8,-23);c.lineTo(-3,-5);c.lineTo(23,-9);c.moveTo(-3,-5);c.lineTo(-16,7);c.strokeStyle='#a1acaf';c.stroke();c.restore();}

y=s.motion?440:wy(p);x=s.motion?center(y)+(s.lane-1)*width(y)*.63:lane(p,s.lane);c.save();c.translate(x,y);var tilt=(s.lane-lastLane)*.17;if(!s.motion)tilt=0;c.rotate(tilt);lastLane=s.lane;
c.fillStyle='rgba(9,30,40,.28)';oval(4,9,30,45);rect(-29,-26,10,23,'#172b39');rect(19,-26,10,23,'#172b39');rect(-29,17,10,23,'#172b39');rect(19,17,10,23,'#172b39');
var color=s.car==='mint'?'#51c7ae':s.car==='violet'?'#a493eb':'#f47e59';c.beginPath();c.moveTo(-21,-37);c.quadraticCurveTo(0,-49,21,-37);c.lineTo(24,34);c.quadraticCurveTo(0,48,-24,34);c.closePath();c.fillStyle=color;c.fill();c.strokeStyle='#ffe5c4';c.lineWidth=2;c.stroke();rect(-17,-26,34,17,'#d5f3f1');rect(-14,-22,28,10,'#518899');rect(-17,18,34,12,'#347283');rect(-16,-37,9,5,'#fff2b4');rect(7,-37,9,5,'#fff2b4');rect(-16,34,8,4,'#d94746');rect(8,34,8,4,'#d94746');line(-4,-5,-4,14,'#ffe6c7',3);line(4,-5,4,14,'#ffe6c7',3);c.restore();
if(s.finished){c.save();for(i=0;i<30;i++){rect((i*103+20)%480,120+(i*67)%360,5,9,['#ffc95b','#ff9174','#84debd','#bba7f2'][i%4]);}c.restore();}
}
w.LittleRaceScene={draw:draw};
})(window);
