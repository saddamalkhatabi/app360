(function(w){'use strict';
var positions={lamp:[0,0],ball:[1,0],cork:[2,0],stone:[3,0],magnet:[0,1],clip:[1,1],block:[2,1],plant:[3,1],bowl:[0,2],boat:[1,2],helmet:[2,2],truck:[3,2]};
var safetyCrops={car:[0,130,657,290],cup:[660,70,430,400],seat:[1120,10,400,470],engine:[0,550,655,360],hands:[650,515,480,460],firefighter:[1150,470,380,530]};
function sprite(name,x,y,width,height,extra){var p=positions[name],crop=safetyCrops[name],asset=crop?'assets/safety-objects.webp':'assets/objects.webp',b=crop||[p[0]*100,p[1]*100,100,100],aw=crop?1536:400,ah=crop?1024:300;return '<svg x="'+x+'" y="'+y+'" width="'+width+'" height="'+height+'" viewBox="0 0 '+b[2]+' '+b[3]+'" '+(extra||'')+'><svg width="'+b[2]+'" height="'+b[3]+'" viewBox="'+b.join(' ')+'" overflow="hidden"><image href="'+asset+'" xlink:href="'+asset+'" x="0" y="0" width="'+aw+'" height="'+ah+'"/></svg></svg>';}

function label(text,x,y){return '<g><rect x="'+(x-145)+'" y="'+(y-24)+'" width="290" height="46" rx="18" fill="#fffdf4" fill-opacity=".94"/><text x="'+x+'" y="'+(y+6)+'" text-anchor="middle" fill="#204a42" font-family="Tahoma,Arial" font-size="20">'+text+'</text></g>';}
function shadow(x,y,rx){return '<ellipse cx="'+x+'" cy="'+y+'" rx="'+rx+'" ry="12" fill="#22180f" opacity=".20" filter="url(#soft)"/>';}
var defs='<defs><filter id="soft"><feGaussianBlur stdDeviation="5"/></filter><radialGradient id="metal"><stop stop-color="#fff"/><stop offset=".5" stop-color="#c9d2d5"/><stop offset="1" stop-color="#657779"/></radialGradient><linearGradient id="wood" x2="0" y2="1"><stop stop-color="#d6a46d"/><stop offset=".5" stop-color="#9d6436"/><stop offset="1" stop-color="#633f24"/></linearGradient><linearGradient id="glass" x2="1" y2="1"><stop stop-color="#e9ffff" stop-opacity=".3"/><stop offset=".5" stop-color="#d7ffff" stop-opacity=".08"/><stop offset="1" stop-color="#f0ffff" stop-opacity=".55"/></linearGradient><linearGradient id="water" x2="0" y2="1"><stop stop-color="#9ddbe9" stop-opacity=".65"/><stop offset="1" stop-color="#257fad" stop-opacity=".85"/></linearGradient><linearGradient id="flame" x2="0" y2="1"><stop stop-color="#ffe987"/><stop offset=".45" stop-color="#ffb13b"/><stop offset="1" stop-color="#e34e20"/></linearGradient><linearGradient id="car"><stop stop-color="#d3e5ee"/><stop offset=".5" stop-color="#3c7791"/><stop offset="1" stop-color="#254559"/></linearGradient></defs>';
function flame(x,y,small){return '<g class="ww-flame" transform="translate('+x+' '+y+') scale('+(small||1)+')"><ellipse cx="0" cy="0" rx="75" ry="18" fill="#ffad35" opacity=".2" filter="url(#soft)"/><path d="M-44 0Q-76-55-28-85q-4 30 9 35 6-69 27-103 4 47 28 62 49 43 15 91Z" fill="url(#flame)"/><path d="M-15 0Q-37-33-7-64 2-26 17-47 27-16 15 0Z" fill="#ffedab"/></g>';}
function car(x,y,parked){return '<g class="ww-car'+(parked?' stopped':'')+'">'+shadow(x+80,y+60,95)+sprite('car',x-20,y-15,220,100)+'</g>';}

function render(e,v,english){var a='',n,p,scene=e.scene;function L(ar,en,x,y){return label(english?en:ar,x,y);}
 if(e.type==='light'||e.type==='shadow'){
  var distance=v.distance===undefined?3:v.distance,lampX=e.type==='light'?110:310-distance*42;
  if(e.type==='light')a+='<rect width="960" height="540" fill="#07141e" opacity="'+(v.light ? .06 : .64)+'"/>';
  a+=shadow(lampX+95,440,78)+sprite('lamp',lampX,180,210,260);
  if(e.type==='shadow'||v.light)a+='<path d="M'+(lampX+130)+' 265 800 170V430Z" fill="#fff6b0" opacity=".18"/>';
  if(e.type==='shadow'){var size=110-distance*13;a+='<rect x="720" y="130" width="180" height="290" rx="8" fill="#f3efe2" stroke="#cec7b6" stroke-width="5"/><ellipse cx="805" cy="282" rx="'+(size*.55)+'" ry="'+size+'" fill="#202b2b" opacity=".68" filter="url(#soft)"/>';a+=sprite('block',450,302,140,140)+L('حجم الظل يتغير','The shadow changes size',510,485);}
  else a+=sprite('block',550,285,160,160)+L(v.light?'الضوء يعمل':'المصباح مطفأ',v.light?'The light is on':'The lamp is off',520,485);
 }else if(e.type==='ramp'){
  n=v.slope||0;var top=390-n*45;a+=shadow(480,450,280)+'<path d="M190 '+top+' 680 420l-5 20L185 '+(top+20)+'Z" fill="url(#wood)"/><path d="M205 '+(top+20)+'V440h18V'+(top+20)+'M640 438v10" stroke="#6d482b" stroke-width="9"/>';
  var ballX=v.released?Math.min(845,650+n*45):220,ballY=v.released?375:top-65;
  a+=sprite('ball',ballX-48,ballY-30,96,96,v.released?'class="ww-roll"':'')+L('الميل: '+n,'Slope: '+n,450,490);
 }else if(e.type==='float'){
  a+=shadow(480,455,235)+'<path d="M250 220v193q230 70 460 0V220Z" fill="url(#glass)" stroke="#dfedf0" stroke-width="7"/><path d="M255 285v125q225 65 450 0V285Z" fill="url(#water)"/><ellipse cx="480" cy="285" rx="225" ry="32" fill="#a6dbe5" opacity=".8"/>';
  a+=sprite('cork',v.cork?345:110,v.cork?240:360,110,110)+sprite('stone',v.stone?515:745,v.stone?340:365,120,95,v.stone?'class="ww-sink"':'');
  a+='<path d="M268 231v170m12-154v100m406-110v155" stroke="white" stroke-width="6" opacity=".6"/>';
  a+=L(v.stone?'حجر يغوص · فلين يطفو':'راقب سطح الماء',v.stone?'Stone sinks · cork floats':'Watch the water surface',480,490);
 }else if(e.type==='magnet'){
  n=v.distance===undefined?5:v.distance;a+=shadow(440,440,240)+sprite('magnet',230,235,210,210)+sprite('clip',v.attracted||n<=1?370:455+n*40,335,100,100,v.attracted?'class="ww-attracted"':'')+sprite('block',690,285,130,145);
  if(n<=1)a+='<path d="M385 330q45-55 95 0m-100 40q45 50 95 0" fill="none" stroke="#559c9e" stroke-width="4" stroke-dasharray="8 10" opacity=".7"/>';
  a+=L(v.wood?'الخشب بقي في مكانه':'قوة تعمل من مسافة',v.wood?'Wood stays in place':'A force across a distance',480,490);
 }else if(e.type==='balance'){
  n=v.weight||0;p=(n-2)*13;a+=shadow(480,450,240)+'<path d="m425 442 55-140 55 140Z" fill="url(#metal)"/><g transform="rotate('+p+' 480 300)"><rect x="245" y="290" width="470" height="15" rx="7" fill="url(#metal)"/><path d="m265 300-50 90h100Zm430 0-50 90h100Z" fill="none" stroke="#7e8d8a" stroke-width="3"/><ellipse cx="265" cy="394" rx="80" ry="14" fill="url(#metal)"/><ellipse cx="695" cy="394" rx="80" ry="14" fill="url(#metal)"/>';
  for(var i=0;i<2;i++)a+=sprite('block',220+i*43,337,65,65);for(i=0;i<n;i++)a+=sprite('block',642+(i%2)*43,337-Math.floor(i/2)*47,65,65);a+='</g>'+L('يسار ٢ · يمين '+n,'Left 2 · right '+n,480,490);
 }else if(e.type==='water'){
  n=v.water||0;a+=shadow(440,455,210)+sprite('plant',260,v.plant===2?165:250,v.plant===2?285:230,v.plant===2?285:230)+sprite('bowl',590,300,200,170);
  if(n)a+='<path d="M614 '+(407-n*15)+'h153v30q-76 28-153 0Z" fill="url(#water)"/>';
  if(v.plant)a+='<ellipse cx="375" cy="395" rx="48" ry="13" fill="#3e2e16" opacity=".5"/>';
  if(v.plant===2)a+=L('بعد عدة أيام في النموذج','Several days later in the model',480,112);
  a+=L(v.closed?'أغلقنا الماء':'الماء: '+n,v.closed?'The water is off':'Water: '+n,510,490);
 }else if(e.type==='wind'){
  n=v.power||0;a+=shadow(480,440,240)+'<ellipse cx="480" cy="437" rx="285" ry="20" fill="#7dcbdb" opacity=".5"/>'+sprite('boat',280+n*55,220,280,230,'class="ww-moving"');
  for(i=0;i<n+1;i++)if(n)a+='<path class="ww-air" d="M80 '+(250+i*38)+'h'+(130+n*30)+'q28-15 20-30" stroke="#effcff" stroke-width="7" fill="none" opacity=".8"/>';
  a+=L('قوة الهواء: '+n,'Air strength: '+n,490,490);
 }else if(e.type==='mix'){
  var color=v.mix===2?'#4ba95c':v.mix===1?'#efc83e':'#b9e9e9';a+=shadow(480,447,190)+'<ellipse cx="480" cy="389" rx="180" ry="52" fill="'+color+'" opacity=".87"/><path d="M300 280v110q180 112 360 0V280" fill="url(#glass)" stroke="#e9f9fa" stroke-width="7"/><ellipse cx="480" cy="280" rx="180" ry="45" fill="url(#glass)" stroke="#e4f3f2" stroke-width="6"/><ellipse cx="480" cy="350" rx="174" ry="46" fill="'+color+'" opacity=".8"/>'+L(v.mix===2?'أصفر + أزرق = أخضر':'نلاحظ اللون قبل المزج',v.mix===2?'Yellow + blue = green':'Notice the colour before mixing',480,490);
 }else if(e.type==='road'){
  a+=car(v.checked?40:100,255,!!v.checked)+car(v.checked?740:660,230,!!v.checked);
  a+='<g transform="translate(805 80)"><path d="M35 100v180" stroke="#61716a" stroke-width="12"/><rect width="72" height="122" rx="14" fill="#283530"/><circle cx="36" cy="34" r="20" fill="'+(v.checked?'#5d7063':'#ed6854')+'"/><circle cx="36" cy="87" r="20" fill="'+(v.checked?'#70dc98':'#50615b')+'"/></g>';
  if(e.id==='road-ball')a+=sprite('ball',595,265,75,75);
  if(e.id==='road-parked')a+=car(v.adult?5:220,305,true);
  a+='<ellipse class="ww-position" cx="480" cy="'+(v.crossed?193:465)+'" rx="'+(v.crossed?30:52)+'" ry="'+(v.crossed?13:20)+'" fill="#ffd979" stroke="#fff" stroke-width="4"/>';
  a+=L(v.crossed?'وصلنا معًا بأمان':v.adult?'أنا والمرافق على الرصيف':'أنا هنا · على الرصيف',v.crossed?'We arrived together':v.adult?'With my grown-up on the sidewalk':'I am here · on the sidewalk',480,v.crossed?145:510);
  if(v.checked)a+='<path d="M480 430V240m-22 25 22-25 22 25" stroke="#fff6b9" stroke-width="9" fill="none" stroke-dasharray="15 12"/>';
 }else if(e.type==='fire'){
  if(v.outside){scene='garden';a+='<rect x="93" y="118" width="468" height="280" rx="12" fill="#fdf6e3"/><image href="assets/scene-home.webp" xlink:href="assets/scene-home.webp" x="104" y="129" width="446" height="250"/>';if(!v.extinguished)a+=flame(327,335,.5);a+=L('نحن خارج المنزل','We are outside',685,135);if(v.help)a+=sprite('engine',640,310,280,155)+sprite('firefighter',555,240,140,230);if(v.extinguished)a+='<path class="ww-water-spray" d="M575 335Q460 240 333 325" fill="none" stroke="#daeff7" stroke-width="17" stroke-dasharray="5 8" opacity=".85"/>';}
  else {a+=flame(337,375,.65);a+='<path d="M335 240q-80-55-25-100t70-60" stroke="#65706a" stroke-width="55" opacity=".22" fill="none" filter="url(#soft)"/>';a+='<path d="M580 415h170l-35-30m35 30-35 30" stroke="#c6efd0" stroke-width="10" fill="none"/>';}
  a+=L(v.extinguished?'الفريق أخمد النار · نبقى خارجًا':v.outside?'ننتظر في نقطة اللقاء':'نتجه إلى مخرج آمن',v.extinguished?'The crew put it out · stay outside':v.outside?'Wait at the meeting point':'Move to a safe exit',480,490);
 }else if(e.type==='electric'){
  a+='<path d="M250 389c90-150 190 120 290-5s140-40 190-12" stroke="#292f30" stroke-width="17" fill="none"/><path d="m505 386 15-19m-4 28 16-23" stroke="#b99b65" stroke-width="7"/><rect x="725" y="349" width="60" height="42" rx="8" fill="url(#metal)"/><path d="M785 359h24m-24 19h24" stroke="#878f8b" stroke-width="8"/>'+L(v.help?'البالغ يتولى الأمر':'أبتعد · لا ألمس السلك',v.help?'A grown-up handles this':'Keep away · do not touch',480,490);
 }else if(e.type==='hot'){
  a+='<path d="m325 365 300 0 60 45H285Z" fill="url(#wood)"/><path d="M310 410v85m350-85v85" stroke="#6c472c" stroke-width="17"/>'+shadow(505,390,100)+sprite('cup',v.help?390:505,205,190,190)+'<path d="M'+(v.help?450:565)+' 220q-25-25 0-53m37 53q-22-32 0-65m37 65q-23-24 0-49" stroke="#fff" opacity=".65" stroke-width="7" fill="none"/>'+L(v.help?'طلبت مساعدة بالغ':'ساخن · أبقى بعيدًا',v.help?'You asked a grown-up':'Hot · stay back',480,490);
 }else if(e.type==='helmet'){
  a+=shadow(480,430,150)+sprite('helmet',315,200,330,260);if(v.helmet)a+='<path d="M405 373q75 105 145 0" stroke="#3c4b52" stroke-width="10" fill="none"/>';a+=L(v.safe?'مكان مخصص بعيد عن السيارات':'المرافق يضبط الخوذة',v.safe?'A designated area away from cars':'A grown-up fits the helmet',480,490);
 }else if(e.type==='belt'){
  a+=shadow(480,460,160)+sprite('seat',330,145,300,310);if(v.belt)a+='<circle cx="620" cy="350" r="35" fill="#417a54"/><path d="m603 350 12 13 23-27" stroke="#fff7e1" stroke-width="7" fill="none"/>';a+=L(v.belt?'المرافق فحص الحزام':'مقعد يناسب العمر والحجم',v.belt?'A grown-up checked the harness':'A seat suited to age and size',480,490);
 }else if(e.type==='wash'){
  a+=shadow(480,440,180)+sprite('hands',300,175,360,270);
  if(v.soap&&!v.clean)for(i=0;i<14;i++)a+='<circle cx="'+(340+(i*47)%250)+'" cy="'+(300+(i*19)%90)+'" r="'+(9+i%4*4)+'" fill="#eaffff" fill-opacity=".6" stroke="#fff" stroke-width="2"/>';a+=L(v.clean?'غسل وشطف وتجفيف':'نفرك جميع أجزاء اليدين',v.clean?'Washed, rinsed and dried':'Rub all parts of both hands',480,490);
 }else {
  a+=shadow(480,445,240)+'<rect x="240" y="300" width="180" height="140" rx="9" fill="#b18a5a"/><rect x="560" y="300" width="180" height="140" rx="9" fill="#6c908b"/>'+L('الورق','Paper',330,350)+L(e.id==='explorer-sort'?'المعادن':'المكعبات',e.id==='explorer-sort'?'Metal':'Blocks',650,350);
  if(!v.sorted)a+='<path d="m420 225 90-12 15 65-90 12Z" fill="#f6f3e9"/>';if(!(v.sorted>=2))a+=sprite('block',710,200,115,115);a+=L(v.sorted===2?'لكل شيء مكان':'نرتب ونحافظ على الموارد',v.sorted===2?'A place for everything':'Sort and care for resources',480,490);
 }
 return {scene:scene,svg:'<svg viewBox="0 0 960 540" aria-hidden="true">'+defs+a+'</svg>'};
}
w.WonderWorldScene={render:render};
})(window);
