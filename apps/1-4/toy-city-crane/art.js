(function(w){'use strict';
var colors={house:'#e79a76',tree:'#77ad91',boat:'#7fabca',rocket:'#b29acc',arch:'#edc166'};
function shape(name,outline){var fill=outline?'#fff9e8':colors[name],stroke=outline?'#697f80':'#526b6b',body='';
if(name==='house')body='<path d="M-29-3 0-29 29-3Z"/>'+'<path d="M-23-3H23V27H7V9H-7V27H-23Z"/>';
if(name==='tree')body='<path d="M-8 27V11H-28L-14-6H-23L0-32 23-6H14L28 11H8V27Z"/>';
if(name==='boat')body='<path d="M-31 8H31L19 27H-19Z"/><path d="M-2 4V-30L-28 4ZM5-23V4H26Z"/>';
if(name==='rocket')body='<path d="M-11 16-23 27-20 4-11-4V-10Q-9-24 0-32 9-24 11-10V-4L20 4 23 27 11 16 6 28H-6Z"/>';
if(name==='arch')body='<path d="M-29 27V-5Q-29-30 0-30 29-30 29-5V27H12V-3Q12-14 0-14-12-14-12-3V27Z"/>';
var accents=outline?'':name==='house'?'<rect x="3" y="-2" width="10" height="9" rx="2" fill="#fff0ce" stroke="none"/>':name==='tree'?'<circle cx="-7" cy="0" r="4" fill="#f5d181" stroke="none"/><circle cx="5" cy="-11" r="3" fill="#fff0ce" stroke="none"/>':name==='boat'?'<path d="M-20 16H20" fill="none" stroke="#e7f4e9" stroke-width="3"/>':name==='rocket'?'<circle cy="-7" r="6" fill="#d9eae5"/><path d="M-4 23 0 34 4 23" fill="#edbc68" stroke="none"/>':'<path d="M-23-4h9M14-4h9M0-23v7" fill="none" stroke="#fff1ca" stroke-width="4"/>';
return '<g fill="'+fill+'" stroke="'+stroke+'" stroke-width="2.3" stroke-linejoin="round"'+(outline?' stroke-dasharray="4 3"':'')+'>'+body+accents+'</g>';}
function icon(name,angle,outline){return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="-43 -43 86 86" aria-hidden="true" focusable="false"><g transform="rotate('+angle*90+')">'+shape(name,outline)+'</g></svg>';}
function x(state,column){return 35+(column+.5)*530/state.board.count;}
function scene(state,theme,flash){var cx=x(state,state.column),body='',i,p,px;
body+='<rect x="22" y="275" width="556" height="99" rx="23" fill="#fcf5e4" stroke="#d8ccae" stroke-width="2"/><path d="M34 395H568" stroke="#c5cfbe" stroke-width="2" stroke-dasharray="5 8"/><rect x="22" y="416" width="556" height="108" rx="24" fill="'+(theme==='moon'?'#d7dce9':theme==='harbor'?'#cee4dd':'#dce7c5')+'" stroke="#aabaad" stroke-width="2"/>';
for(i=0;i<state.board.count;i++){px=x(state,i);body+='<ellipse cx="'+px+'" cy="502" rx="'+Math.min(44,230/state.board.count)+'" ry="8" fill="#496a5f" opacity=".12"/>';if(state.placed.indexOf(i)>=0){p=state.board.items[i];body+='<g class="built-piece" transform="translate('+px+' 468) rotate('+p.angle*90+')">'+shape(p.shape,false)+'</g><circle cx="'+(px+28)+'" cy="438" r="10" fill="#436d61"/><path d="m'+(px+23)+' 438 3 3 6-6" fill="none" stroke="#fff8e5" stroke-width="2.2"/>';}}
body+='<path d="M37 260V100H563V260" fill="none" stroke="#b98d43" stroke-width="14" stroke-linejoin="round"/><path d="M37 100H563" stroke="#e9bd63" stroke-width="25"/><path d="m58 91 17 18m30-18 17 18m30-18 17 18m30-18 17 18m30-18 17 18m30-18 17 18m30-18 17 18m30-18 17 18m30-18 17 18m30-18 17 18m30-18 17 18" stroke="#c39346" stroke-width="5"/>';
body+='<g id="craneArm" transform="translate('+cx+' 0)"><rect x="-29" y="82" width="58" height="38" rx="12" fill="#f3ca75" stroke="#a88243" stroke-width="2"/><circle cx="-15" cy="119" r="7" fill="#5c7370"/><circle cx="15" cy="119" r="7" fill="#5c7370"/><g id="swingArm"><path d="M0 125V205" stroke="#637b78" stroke-width="3"/><g id="claw" class="'+(flash?'claw-dip':'')+'"><circle cy="210" r="9" fill="#e5b45c" stroke="#a88243" stroke-width="2"/><path d="M-6 215-17 227-10 240M6 215 17 227 10 240" fill="none" stroke="#637b78" stroke-width="5" stroke-linecap="round"/>';
if(state.holding!==null)body+='<g transform="translate(0 250) scale(.72) rotate('+state.rotation*90+')">'+shape(state.board.items[state.holding].shape,false)+'</g>';
body+='</g></g></g>';
if(state.finished)body+='<g class="celebration-train" transform="translate(160 399)"><rect x="0" y="-18" width="60" height="24" rx="9" fill="#e9bd63"/><rect x="72" y="-18" width="55" height="24" rx="9" fill="#77ad91"/><rect x="139" y="-18" width="55" height="24" rx="9" fill="#b29acc"/><path d="M60 0h12m55 0h12" stroke="#536c69" stroke-width="4"/><g fill="#536c69"><circle cx="12" cy="8" r="7"/><circle cx="48" cy="8" r="7"/><circle cx="84" cy="8" r="7"/><circle cx="115" cy="8" r="7"/><circle cx="151" cy="8" r="7"/><circle cx="182" cy="8" r="7"/></g></g>';
return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 540" preserveAspectRatio="none" aria-hidden="true" focusable="false">'+body+'</svg>';}
w.ToyCraneArt={icon:icon,scene:scene,x:x};
})(typeof window==='undefined'?this:window);
