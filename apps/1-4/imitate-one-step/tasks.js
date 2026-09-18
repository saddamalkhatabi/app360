(function(root){
'use strict';
function scene(kind){
  var common='viewBox="0 0 320 190" role="img" aria-hidden="true" focusable="false"';
  var s='';
  if(kind==='cube-basket') s='<rect x="188" y="86" width="92" height="70" rx="16" fill="#e8b35a"/><path d="M198 86h72l-8-24h-56z" fill="#f4cc84"/><rect x="58" y="84" width="58" height="58" rx="10" fill="#4ea6a0"/><path d="M127 110h42" stroke="#17343a" stroke-width="9" stroke-linecap="round"/><path d="M159 94l24 16-24 16" fill="none" stroke="#17343a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>';
  if(kind==='ball-roll') s='<circle cx="70" cy="112" r="34" fill="#f19a69"/><circle cx="249" cy="112" r="27" fill="#4ea6a0" opacity=".28"/><path d="M116 112h82" stroke="#17343a" stroke-width="9" stroke-linecap="round"/><path d="M188 96l25 16-25 16" fill="none" stroke="#17343a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>';
  if(kind==='car-push') s='<rect x="58" y="88" width="92" height="42" rx="14" fill="#5d86c8"/><path d="M80 88l18-26h35l18 26" fill="#8fb0df"/><circle cx="82" cy="137" r="14" fill="#17343a"/><circle cx="134" cy="137" r="14" fill="#17343a"/><path d="M170 111h72" stroke="#17343a" stroke-width="9" stroke-linecap="round"/><path d="M232 95l25 16-25 16" fill="none" stroke="#17343a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>';
  if(kind==='stack') s='<rect x="92" y="110" width="72" height="54" rx="10" fill="#4ea6a0"/><rect x="92" y="36" width="72" height="54" rx="10" fill="#ffd54f"/><path d="M128 94v10" stroke="#17343a" stroke-width="9" stroke-linecap="round"/><path d="M112 96l16 20 16-20" fill="none" stroke="#17343a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><circle cx="233" cy="123" r="33" fill="#f19a69" opacity=".2"/>';
  if(kind==='give-ball') s='<circle cx="86" cy="104" r="34" fill="#f19a69"/><path d="M130 104h66" stroke="#17343a" stroke-width="9" stroke-linecap="round"/><path d="M186 88l25 16-25 16" fill="none" stroke="#17343a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/><path d="M232 69c22 0 38 18 38 40s-16 40-38 40" fill="none" stroke="#4ea6a0" stroke-width="11" stroke-linecap="round"/>';
  if(kind==='cloth-chair') s='<path d="M198 70h58v78h-58z" fill="#bd8d60"/><path d="M191 148h72M205 148v24M249 148v24" stroke="#704c2d" stroke-width="10" stroke-linecap="round"/><path d="M62 62h72v72H62z" fill="#7ccbc6"/><path d="M142 98h34" stroke="#17343a" stroke-width="9" stroke-linecap="round"/><path d="M166 82l25 16-25 16" fill="none" stroke="#17343a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>';
  if(kind==='spoon-cup') s='<path d="M202 82h58l-8 76h-42z" fill="#7ccbc6"/><ellipse cx="112" cy="64" rx="18" ry="28" fill="#d9dde0"/><rect x="106" y="86" width="12" height="62" rx="6" fill="#b8c1c7"/><path d="M136 108h42" stroke="#17343a" stroke-width="9" stroke-linecap="round"/><path d="M168 92l25 16-25 16" fill="none" stroke="#17343a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>';
  if(kind==='doll-pillow') s='<rect x="194" y="106" width="84" height="48" rx="22" fill="#ffd98f"/><circle cx="90" cy="72" r="24" fill="#eab184"/><path d="M90 98v48M70 116h40M90 146l-20 24M90 146l20 24" stroke="#8b5a3c" stroke-width="10" stroke-linecap="round"/><path d="M128 118h38" stroke="#17343a" stroke-width="9" stroke-linecap="round"/><path d="M156 102l25 16-25 16" fill="none" stroke="#17343a" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/>';
  return '<svg '+common+'><rect width="320" height="190" rx="28" fill="#f6fbfa"/>'+s+'</svg>';
}
root.ImitateTasks=[
{id:'cube-basket',title:'ضع المكعب الكبير في السلة',short:'المكعب والسلة',objectHint:'مكعب كبير + سلة',scene:scene('cube-basket')},
{id:'ball-roll',title:'دحرج الكرة الكبيرة نحو المرافق',short:'دحرجة الكرة',objectHint:'كرة كبيرة آمنة',scene:scene('ball-roll')},
{id:'car-push',title:'ادفع السيارة اللعبة إلى الأمام',short:'ادفع السيارة',objectHint:'سيارة لعبة مناسبة للعمر',scene:scene('car-push')},
{id:'stack',title:'ضع مكعبًا كبيرًا فوق مكعب آخر',short:'مكعب فوق مكعب',objectHint:'مكعبان كبيران',scene:scene('stack')},
{id:'give-ball',title:'أعطِ الكرة للمرافق',short:'أعطِ الكرة',objectHint:'كرة كبيرة آمنة',scene:scene('give-ball')},
{id:'cloth-chair',title:'ضع قطعة القماش على الكرسي',short:'القماش والكرسي',objectHint:'قطعة قماش خفيفة + كرسي ثابت',scene:scene('cloth-chair')},
{id:'spoon-cup',title:'ضع الملعقة الكبيرة داخل الكوب',short:'الملعقة والكوب',objectHint:'ملعقة كبيرة + كوب بلاستيكي',scene:scene('spoon-cup')},
{id:'doll-pillow',title:'ضع الدمية على الوسادة',short:'الدمية والوسادة',objectHint:'دمية آمنة + وسادة',scene:scene('doll-pillow')}
];
}(typeof self!=='undefined'?self:this));
