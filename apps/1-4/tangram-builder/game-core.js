'use strict';
var d=document,w=window;
var canvas=d.getElementById('gameCanvas'),ctx=canvas.getContext('2d'),wrap=d.getElementById('boardWrap');
var fx=d.getElementById('celebrateCanvas'),fctx=fx.getContext('2d');
var message=d.getElementById('message'),winCard=d.getElementById('winCard'),pieceStatus=d.getElementById('pieceStatus');
var levelLabel=d.getElementById('levelLabel'),puzzleTitle=d.getElementById('puzzleTitle'),progressDots=d.getElementById('progressDots');
var raf=w.requestAnimationFrame||w.webkitRequestAnimationFrame||function(fn){return setTimeout(fn,16)};
var caf=w.cancelAnimationFrame||w.webkitCancelAnimationFrame||clearTimeout;
var DPR=1,W=1,H=1,level=0,puzzleIndex=0,pieces=[],drag=null,hints=1,won=false,fxFrame=0,confetti=[];
var soundEnabled=true,userName='نور',userGender='girl',audioMode='auto',registry=null,audioCtx=null,lastCheer=-1,audioUnlocked=false;
var SHARED='../../../resources/early-child-name-audio/';
var palette=['#ef4b4d','#f4c845','#41a8e5','#79c94b','#8a4fc5','#f08f35','#e967b2'];

function S(k,v){try{if(w.localStorage)localStorage.setItem(k,v)}catch(e){}}
function G(k,v){try{var x=w.localStorage?localStorage.getItem(k):null;return x===null?String(v):x}catch(e){return String(v)}}
function n(v,a,b){return Math.max(a,Math.min(b,v))}
function dist(a,b){var x=a.x-b.x,y=a.y-b.y;return Math.sqrt(x*x+y*y)}
function esc(s){return String(s||'').replace(/[&<>"']/g,function(c){return{'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]})}
function showMsg(t,kind,delay){message.className='message'+(kind?' '+kind:'');message.innerHTML=esc(t);if(delay)setTimeout(function(){if(!won){message.className='message';message.innerHTML='اسحب أي قطعة إلى مكانها'}},delay)}
function unlockAudio(){if(audioUnlocked)return;audioUnlocked=true;try{var AC=w.AudioContext||w.webkitAudioContext;if(AC){audioCtx=audioCtx||new AC();if(audioCtx.state==='suspended'&&audioCtx.resume)audioCtx.resume()}}catch(e){}}

/* Shapes are original geometric primitives. Rotation is fixed on purpose: the toddler task is matching and placement, not rotation. */
function tri(s){return [[-s*.55,s*.45],[0,-s*.52],[s*.55,s*.45]]}
function square(s){return [[-s*.48,-s*.48],[s*.48,-s*.48],[s*.48,s*.48],[-s*.48,s*.48]]}
function rect(s){return [[-s*.65,-s*.34],[s*.65,-s*.34],[s*.65,s*.34],[-s*.65,s*.34]]}
function para(s){return [[-s*.55,-s*.36],[s*.34,-s*.36],[s*.55,s*.36],[-s*.34,s*.36]]}
function semi(s){var p=[],i,t;for(i=0;i<=12;i++){t=Math.PI*i/12;p.push([Math.cos(t)*s*.55,-Math.sin(t)*s*.55])}p.push([-s*.55,0]);return p}
function circlePoly(s){var p=[],i,t;for(i=0;i<18;i++){t=Math.PI*2*i/18;p.push([Math.cos(t)*s*.48,Math.sin(t)*s*.48])}return p}
function diamond(s){return [[0,-s*.58],[s*.48,0],[0,s*.58],[-s*.48,0]]}
function shape(type,s){if(type==='tri')return tri(s);if(type==='square')return square(s);if(type==='rect')return rect(s);if(type==='para')return para(s);if(type==='semi')return semi(s);if(type==='circle')return circlePoly(s);return diamond(s)}

/* x/y are normalized in the play field. tx/ty is the target, sx/sy is the tray/start. */
var puzzles=[
 [
  {name:'بيت صغير',pieces:[['square',.50,.42,.18,.78,0],['tri',.50,.26,.46,.79,0],['rect',.50,.57,.76,.78,0]]},
  {name:'شجرة جميلة',pieces:[['circle',.50,.30,.19,.79,0],['circle',.42,.39,.50,.79,0],['rect',.50,.57,.80,.79,0]]},
  {name:'سمكة صغيرة',pieces:[['diamond',.48,.41,.18,.79,0],['tri',.65,.41,.50,.79,Math.PI/2],['circle',.36,.40,.80,.79,0]]}
 ],
 [
  {name:'قارب',pieces:[['para',.49,.56,.12,.80,0],['rect',.49,.49,.31,.80,0],['tri',.43,.34,.50,.80,Math.PI/2],['tri',.56,.34,.69,.80,-Math.PI/2],['rect',.49,.34,.87,.80,Math.PI/2]]},
  {name:'فراشة',pieces:[['circle',.50,.42,.12,.80,0],['semi',.38,.36,.31,.80,-Math.PI/2],['semi',.62,.36,.50,.80,Math.PI/2],['semi',.40,.51,.69,.80,-Math.PI/2],['semi',.60,.51,.87,.80,Math.PI/2]]},
  {name:'صاروخ',pieces:[['rect',.50,.43,.12,.80,Math.PI/2],['tri',.50,.24,.31,.80,0],['tri',.38,.57,.50,.80,-Math.PI/2],['tri',.62,.57,.69,.80,Math.PI/2],['circle',.50,.42,.87,.80,0]]}
 ],
 [
  {name:'قطة تانغرام',pieces:[['tri',.50,.25,.08,.82,0],['tri',.38,.32,.22,.82,-.35],['tri',.62,.32,.36,.82,.35],['square',.50,.43,.50,.82,.78],['tri',.50,.58,.64,.82,Math.PI],['para',.63,.59,.78,.82,.45],['tri',.72,.51,.92,.82,Math.PI/2]]},
  {name:'طائر تانغرام',pieces:[['tri',.35,.42,.08,.82,-Math.PI/2],['tri',.49,.38,.22,.82,.35],['tri',.55,.51,.36,.82,Math.PI],['square',.60,.39,.50,.82,.78],['tri',.69,.34,.64,.82,Math.PI/2],['para',.67,.49,.78,.82,-.35],['tri',.78,.49,.92,.82,Math.PI/2]]},
  {name:'شخص مرح',pieces:[['circle',.50,.22,.08,.82,0],['square',.50,.39,.22,.82,0],['rect',.36,.40,.36,.82,.6],['rect',.64,.40,.50,.82,-.6],['rect',.43,.59,.64,.82,.45],['rect',.57,.59,.78,.82,-.45],['tri',.50,.52,.92,.82,Math.PI]]}
 ]
];
var levelCfg=[{scale:1.14,snap:.115,targetAlpha:.34},{scale:.97,snap:.095,targetAlpha:.25},{scale:.84,snap:.082,targetAlpha:.16}];

function loadPrefs(){level=parseInt(G('app360:a1-tangram:level','0'),10)||0;level=n(level,0,2);puzzleIndex=parseInt(G('app360:a1-tangram:puzzle','0'),10)||0;puzzleIndex=n(puzzleIndex,0,2);soundEnabled=G('app360:a1-tangram:sound','1')!=='0';userName=G('app360:a1-tangram:name',G('pk_user_name','نور'))||'نور';userGender=G('app360:a1-tangram:gender',G('pk_user_gender','girl'))==='boy'?'boy':'girl';audioMode=G('app360:a1-tangram:audio-mode','auto');if(audioMode!=='recorded'&&audioMode!=='tts')audioMode='auto';d.getElementById('nameInput').value=userName;d.getElementById('genderSelect').value=userGender;d.getElementById('audioMode').value=audioMode;updateSoundBtn()}
function savePrefs(){S('app360:a1-tangram:level',level);S('app360:a1-tangram:puzzle',puzzleIndex)}
function updateSoundBtn(){d.getElementById('soundBtn').innerHTML=soundEnabled?'🔊':'🔇'}

function size(){var r=wrap.getBoundingClientRect();DPR=w.devicePixelRatio||1;if(DPR>2)DPR=2;W=Math.max(1,r.width);H=Math.max(1,r.height);canvas.width=Math.round(W*DPR);canvas.height=Math.round(H*DPR);fx.width=Math.round(W*DPR);fx.height=Math.round(H*DPR);canvas.style.width=W+'px';canvas.style.height=H+'px';fx.style.width=W+'px';fx.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0);fctx.setTransform(DPR,0,0,DPR,0,0);layoutPieces();draw()}
function playArea(){var top=H*.05,bottom=H*.91;return{top:top,bottom:bottom,h:bottom-top,w:W}}
function pieceScale(){return n(Math.min(W,H)*.20,54,112)*levelCfg[level].scale}
function layoutPieces(){var p=playArea(),cfg=levelCfg[level],raw=puzzles[level][puzzleIndex].pieces,s=pieceScale(),i,a,old={};for(i=0;i<pieces.length;i++)old[pieces[i].id]=pieces[i];pieces=[];for(i=0;i<raw.length;i++){a=raw[i];var o=old['p'+i],pc={id:'p'+i,type:a[0],tx:a[1]*W,ty:p.top+a[2]*p.h,sx:a[3]*W,sy:p.top+a[4]*p.h,rot:a[5]||0,size:s,color:palette[i%palette.length],placed:o?o.placed:false,x:0,y:0};if(pc.placed){pc.x=pc.tx;pc.y=pc.ty}else{pc.x=pc.sx;pc.y=pc.sy}pieces.push(pc)}updateStatus()}
function currentPuzzle(){return puzzles[level][puzzleIndex]}
function buildDots(){var i,h='';for(i=0;i<3;i++){var done=G('app360:a1-tangram:done:'+level+':'+i,'0')==='1';h+='<i class="dot'+(i===puzzleIndex?' on':'')+(done?' done':'')+'"></i>'}progressDots.innerHTML=h}
function setLevel(v){if(v===level)return;level=v;puzzleIndex=0;hints=1;won=false;winCard.style.display='none';savePrefs();refresh(true)}
function refresh(resetAll){if(resetAll){pieces=[]}levelLabel.innerHTML='المستوى '+(level+1);puzzleTitle.innerHTML=currentPuzzle().name;var bs=d.getElementsByClassName('levelBtn'),i;for(i=0;i<bs.length;i++)bs[i].className='levelBtn'+(parseInt(bs[i].getAttribute('data-level'),10)===level?' on':'');buildDots();layoutPieces();won=false;winCard.style.display='none';showMsg(level===0?'اسحب القطعة الملونة فوق شكلها':'ابنِ '+currentPuzzle().name,'',0);draw()}
function resetPuzzle(){var i;won=false;drag=null;for(i=0;i<pieces.length;i++){pieces[i].placed=false;pieces[i].x=pieces[i].sx;pieces[i].y=pieces[i].sy}winCard.style.display='none';hints=1;updateStatus();showMsg('جرب مرة أخرى بطريقتك','',1100);draw()}
function nextPuzzle(){puzzleIndex=(puzzleIndex+1)%3;hints=1;savePrefs();pieces=[];refresh(true)}

function pathPoly(c,p){var poly=shape(p.type,p.size),i;c.beginPath();for(i=0;i<poly.length;i++){if(i===0)c.moveTo(poly[i][0],poly[i][1]);else c.lineTo(poly[i][0],poly[i][1])}c.closePath()}
function transform(c,p,x,y){c.translate(x,y);c.rotate(p.rot)}
function drawPiece(c,p,x,y,fill,alpha,outline){c.save();c.globalAlpha=typeof alpha==='number'?alpha:1;transform(c,p,x,y);pathPoly(c,p);if(fill){c.fillStyle=fill;c.fill()}if(outline){c.lineWidth=outline;c.strokeStyle='rgba(75,43,18,.58)';c.stroke()}c.restore()}
function drawWood(){var i;ctx.save();ctx.fillStyle='rgba(255,255,255,.07)';for(i=0;i<9;i++){ctx.fillRect(0,(i+1)*H/10,W,1)}ctx.restore()}
function draw(){ctx.clearRect(0,0,W,H);drawWood();var i,p,cfg=levelCfg[level];for(i=0;i<pieces.length;i++){p=pieces[i];if(!p.placed){var a=cfg.targetAlpha;if(hints===2)a=Math.max(a,.40);drawPiece(ctx,p,p.tx,p.ty,level===2&&hints===1?'#8b785f':p.color,a,2.2)}}
 for(i=0;i<pieces.length;i++){p=pieces[i];if(p.placed){drawPiece(ctx,p,p.x,p.y,p.color,1,2.2);ctx.save();ctx.strokeStyle='rgba(255,255,255,.65)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(p.x,p.y,p.size*.62,0,Math.PI*2);ctx.stroke();ctx.restore()}}
 for(i=0;i<pieces.length;i++){p=pieces[i];if(!p.placed&&(!drag||drag.p!==p))drawPiece(ctx,p,p.x,p.y,p.color,1,2.4)}
 if(drag&&drag.p){p=drag.p;ctx.save();ctx.shadowColor='rgba(0,0,0,.32)';ctx.shadowBlur=12;ctx.shadowOffsetY=5;drawPiece(ctx,p,p.x,p.y,p.color,.95,2.4);ctx.restore()}}
function screenPos(clientX,clientY){var r=canvas.getBoundingClientRect();return{x:(clientX-r.left)*(W/r.width),y:(clientY-r.top)*(H/r.height)}}
function localPoint(pt,p){var dx=pt.x-p.x,dy=pt.y-p.y,c=Math.cos(-p.rot),s=Math.sin(-p.rot);return{x:dx*c-dy*s,y:dx*s+dy*c}}
function pointInPoly(pt,poly){var inside=false,i,j,xi,yi,xj,yj,hit;for(i=0,j=poly.length-1;i<poly.length;j=i++){xi=poly[i][0];yi=poly[i][1];xj=poly[j][0];yj=poly[j][1];hit=((yi>pt.y)!==(yj>pt.y))&&(pt.x<(xj-xi)*(pt.y-yi)/(yj-yi||.0001)+xi);if(hit)inside=!inside}return inside}
function hitPiece(pt,p){var q=localPoint(pt,p);return pointInPoly(q,shape(p.type,p.size*1.13))}
function findPiece(pt){var i;for(i=pieces.length-1;i>=0;i--)if(!pieces[i].placed&&hitPiece(pt,pieces[i]))return pieces[i];return null}
function beginDrag(pt){if(won)return;unlockAudio();var p=findPiece(pt);if(!p)return;drag={p:p,dx:pt.x-p.x,dy:pt.y-p.y};if(d.body.className.indexOf('grabCursor')<0)d.body.className+=' grabCursor';draw()}
function moveDrag(pt){if(!drag)return;drag.p.x=n(pt.x-drag.dx,drag.p.size*.35,W-drag.p.size*.35);drag.p.y=n(pt.y-drag.dy,drag.p.size*.35,H-drag.p.size*.35);draw()}
function endDrag(){if(!drag)return;var p=drag.p,diag=Math.sqrt(W*W+H*H),snap=diag*levelCfg[level].snap;if(dist({x:p.x,y:p.y},{x:p.tx,y:p.ty})<=snap){p.x=p.tx;p.y=p.ty;p.placed=true;softSuccess();showMsg('ممتاز! القطعة في مكانها','good',900)}else{p.x=p.sx;p.y=p.sy;softReturn();showMsg('قربها من الشكل المشابه','soft',900)}drag=null;d.body.className=d.body.className.replace(/\s*grabCursor/g,'');updateStatus();draw();if(allPlaced())stageWin()}
function allPlaced(){var i;if(!pieces.length)return false;for(i=0;i<pieces.length;i++)if(!pieces[i].placed)return false;return true}
function updateStatus(){var i,c=0;for(i=0;i<pieces.length;i++)if(pieces[i].placed)c++;pieceStatus.innerHTML=c+' / '+pieces.length}

function touchById(list,id){var i;for(i=0;i<(list?list.length:0);i++)if(list[i].identifier===id)return list[i];return null}
var touchId=null;
