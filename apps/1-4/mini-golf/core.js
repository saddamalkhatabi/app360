(function(root,factory){'use strict';if(typeof module==='object'&&module.exports)module.exports=factory();else root.MiniGolfCore=factory();})(this,function(){
'use strict';
var R=3,FRICTION=.97,MAX=80;
function integer(n,a,b,f){return typeof n==='number'&&isFinite(n)&&n%1===0&&n>=a&&n<=b?n:f;}
function clone(x){return JSON.parse(JSON.stringify(x));}
function settings(s){s=s||{};return {level:integer(s.level,1,4,1),players:s.players===2?2:1,theme:['garden','island','moon'].indexOf(s.theme)>=0?s.theme:'garden',language:s.language==='en'?'en':'ar',sound:s.sound===true,motion:s.motion!==false,hints:s.hints!==false};}
function course(level,index){level=integer(level,1,4,1);index=integer(index,0,2,0);var starts=[{x:50,y:99},{x:27,y:99},{x:73,y:99}],cups=[{x:50,y:28},{x:70,y:31},{x:29,y:31}];var c={start:clone(starts[index]),cup:clone(cups[index]),radius:level===1?8:level===2?6:5,blocks:[]};
if(level===1){c.cup={x:c.start.x,y:31-index*3};}
if(level===3){c.blocks=index===0?[{x:35,y:57,w:30,h:7}]:index===1?[{x:42,y:55,w:25,h:8}]:[{x:33,y:55,w:25,h:8}];}
if(level===4){c.blocks=index===0?[{x:9,y:65,w:49,h:7},{x:64,y:36,w:27,h:7}]:index===1?[{x:40,y:66,w:51,h:7},{x:9,y:39,w:36,h:7}]:[{x:9,y:66,w:51,h:7},{x:55,y:39,w:36,h:7}];}
return c;}
function direction(from,to){return Math.atan2(to.x-from.x,from.y-to.y)*180/Math.PI;}
function simulate(c,start,aim,power,assisted){var a=integer(aim,-180,180,0)*Math.PI/180,speed=[0,1.4,2,2.8,3.6,4.5][integer(power,1,5,3)],x=start.x,y=start.y,frames=[{x:x,y:y}],vx,vy,captured=false,bounces=0;
if(assisted){a=direction(start,c.cup)*Math.PI/180;speed=Math.sqrt(Math.pow(c.cup.x-x,2)+Math.pow(c.cup.y-y,2))*(1-FRICTION);}
vx=Math.sin(a)*speed;vy=-Math.cos(a)*speed;
for(var tick=0;tick<260;tick++){
 for(var sub=0;sub<4;sub++){
  x+=vx/4;y+=vy/4;
  if(x<9+R){x=9+R;vx=Math.abs(vx)*.82;bounces++;}else if(x>91-R){x=91-R;vx=-Math.abs(vx)*.82;bounces++;}
  if(y<10+R){y=10+R;vy=Math.abs(vy)*.82;bounces++;}else if(y>111-R){y=111-R;vy=-Math.abs(vy)*.82;bounces++;}
  for(var j=0;j<c.blocks.length;j++){
   var b=c.blocks[j],nearX=Math.max(b.x,Math.min(b.x+b.w,x)),nearY=Math.max(b.y,Math.min(b.y+b.h,y)),dx=x-nearX,dy=y-nearY,dist=Math.sqrt(dx*dx+dy*dy);
   if(dist<R){if(dist>.000001){var nx=dx/dist,ny=dy/dist,dot=vx*nx+vy*ny;x+=nx*(R-dist+.001);y+=ny*(R-dist+.001);if(dot<0){vx-=(1+.82)*dot*nx;vy-=(1+.82)*dot*ny;bounces++;}}
    else {var sides=[Math.abs(x-b.x),Math.abs(x-b.x-b.w),Math.abs(y-b.y),Math.abs(y-b.y-b.h)],side=sides.indexOf(Math.min.apply(Math,sides));if(side===0){x=b.x-R-.001;vx=-Math.abs(vx)*.82;}else if(side===1){x=b.x+b.w+R+.001;vx=Math.abs(vx)*.82;}else if(side===2){y=b.y-R-.001;vy=-Math.abs(vy)*.82;}else{y=b.y+b.h+R+.001;vy=Math.abs(vy)*.82;}bounces++;}
   }
  }
  if(Math.sqrt(Math.pow(x-c.cup.x,2)+Math.pow(y-c.cup.y,2))<=c.radius&&Math.sqrt(vx*vx+vy*vy)<=1.7){x=c.cup.x;y=c.cup.y;captured=true;break;}
 }
 frames.push({x:x,y:y});if(captured)break;vx*=FRICTION;vy*=FRICTION;if(vx*vx+vy*vy<.0009)break;
}
return {position:{x:x,y:y},captured:captured,bounces:bounces,frames:frames};}
function fresh(level,players){return {level:integer(level,1,4,1),players:players===2?2:1,steps:[]};}
function initial(round){var c=course(round.level,0);return {index:0,player:0,course:c,position:clone(c.start),shots:0,captured:false,complete:false,results:[],last:null};}
function shot(state,round,aim,power){if(state.complete||state.captured||state.shots>=MAX||integer(aim,-180,180,999)===999||integer(power,1,5,99)===99)return false;state.last=simulate(state.course,state.position,aim,power,round.level===1);state.position=clone(state.last.position);state.captured=state.last.captured;state.shots++;return true;}
function next(state,round,skip){if(state.complete||!state.captured&&skip!==true)return false;state.results.push({player:state.player,hole:Math.floor(state.index/round.players),shots:state.shots,captured:state.captured});if(state.index===round.players*3-1){state.complete=true;return true;}state.index++;state.player=state.index%round.players;state.course=course(round.level,Math.floor(state.index/round.players));state.position=clone(state.course.start);state.shots=0;state.captured=false;state.last=null;return true;}
function play(state,round,step){if(!step||typeof step!=='object')return false;if(step.kind==='shot')return shot(state,round,step.aim,step.power);if(step.kind==='next')return next(state,round,step.skip);return false;}
function state(round){var out=initial(round);for(var i=0;i<round.steps.length;i++)if(!play(out,round,round.steps[i]))return initial(round);return out;}
function append(round,step){var out=state(round);if(!play(out,round,step))return false;round.steps.push(step.kind==='shot'?{kind:'shot',aim:step.aim,power:step.power}:{kind:'next',skip:step.skip===true});return true;}
function restore(raw,level,players){var round=fresh(level,players),out=initial(round);if(!raw||raw.level!==round.level||raw.players!==round.players||!Array.isArray(raw.steps)||raw.steps.length>(MAX+1)*6)return round;for(var i=0;i<raw.steps.length;i++){if(!play(out,round,raw.steps[i]))return fresh(level,players);var step=raw.steps[i];round.steps.push(step.kind==='shot'?{kind:'shot',aim:step.aim,power:step.power}:{kind:'next',skip:step.skip===true});}return round;}
function key(s){return s.level+':'+s.players;}
function restoreStore(raw,defaults){var store={schema:1,settings:settings(defaults),games:{}};if(raw&&raw.schema===1){store.settings=settings(raw.settings);for(var l=1;l<=4;l++)for(var p=1;p<=2;p++){var k=l+':'+p;if(raw.games&&Object.prototype.hasOwnProperty.call(raw.games,k)){var g=raw.games[k];store.games[k]={round:restore(g&&g.round,l,p),aim:integer(g&&g.aim,-180,180,0),power:integer(g&&g.power,1,5,3)};}}}return store;}
function undo(round){if(!round.steps.length)return false;round.steps.pop();return true;}
return {settings:settings,course:course,simulate:simulate,direction:direction,fresh:fresh,state:state,append:append,restore:restore,restoreStore:restoreStore,key:key,undo:undo,clone:clone,maxShots:MAX};
});
