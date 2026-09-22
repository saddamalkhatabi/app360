(function(w){
'use strict';
var shared='../../../resources/early-child-visuals/objects/';
w.APP360_CALM_CONTENT={
  schema_version:'1.0',
  app_id:'a1-calm',
  principles:{
    no_inference:true,
    skippable:true,
    no_forced_breathing:true,
    no_scores:true,
    local_only:true
  },
  signals:[
    {id:'need-help',label_ar:'أحتاج مساعدة',symbol:'🤝',speech_ar:'أحتاج مساعدة'},
    {id:'stay-close',label_ar:'أريدك قريبًا',symbol:'🫶',speech_ar:'أريدك قريبًا'},
    {id:'need-space',label_ar:'أريد مساحة',symbol:'↔',speech_ar:'أريد مساحة'},
    {id:'pause-now',label_ar:'توقف قليلًا',symbol:'⏸',speech_ar:'توقف قليلًا'},
    {id:'what-next',label_ar:'أرني ماذا بعد',symbol:'➡',speech_ar:'أرني ماذا بعد'},
    {id:'no-label',label_ar:'لا أريد تسمية',symbol:'○',speech_ar:'لا أريد تسمية الشعور'}
  ],
  feelings:[
    {id:'happy',label_ar:'فرح',symbol:'🙂',speech_ar:'فرح'},
    {id:'sad',label_ar:'حزن',symbol:'☹',speech_ar:'حزن'},
    {id:'upset',label_ar:'انزعاج',symbol:'◉',speech_ar:'انزعاج'},
    {id:'afraid',label_ar:'خوف',symbol:'◇',speech_ar:'خوف'},
    {id:'tired',label_ar:'تعب',symbol:'☾',speech_ar:'تعب'},
    {id:'unsure',label_ar:'لا أعرف',symbol:'?',speech_ar:'لا أعرف'}
  ],
  helps:[
    {id:'close',label_ar:'ابقَ قريبًا',symbol:'🫶',category:'closeness',speech_ar:'ابق قريبًا',enabled:true},
    {id:'space',label_ar:'مساحة أكبر',symbol:'↔',category:'space',speech_ar:'مساحة أكبر',enabled:true},
    {id:'quiet-book',label_ar:'كتاب أو نشاط هادئ',image:shared+'book.svg',category:'quiet',speech_ar:'كتاب أو نشاط هادئ',enabled:true},
    {id:'familiar-play',label_ar:'لعبة مألوفة',image:shared+'ball.svg',category:'activity',speech_ar:'لعبة مألوفة',enabled:true},
    {id:'water',label_ar:'ماء إذا أراد',image:shared+'water.svg',category:'care',speech_ar:'ماء إذا أردت',enabled:true},
    {id:'show-next',label_ar:'أرني ماذا بعد',symbol:'➡',category:'transition',speech_ar:'سأريك ماذا بعد',enabled:true},
    {id:'more-time',label_ar:'وقت إضافي',symbol:'⌛',category:'time',speech_ar:'وقت إضافي',enabled:true},
    {id:'move-together',label_ar:'ننتقل معًا',symbol:'👣',category:'transition',speech_ar:'ننتقل معًا',enabled:true}
  ],
  transitions:[
    {id:'book',label_ar:'نقرأ كتابًا',image:shared+'book.svg',speech_ar:'الآن نقرأ كتابًا'},
    {id:'ball',label_ar:'نلعب بالكرة',image:shared+'ball.svg',speech_ar:'نلعب بالكرة'},
    {id:'water',label_ar:'نشرب ماء',image:shared+'water.svg',speech_ar:'نشرب ماء'},
    {id:'shoe',label_ar:'نرتدي الحذاء',image:shared+'shoe.svg',speech_ar:'نرتدي الحذاء'},
    {id:'toothbrush',label_ar:'ننظف الأسنان',image:shared+'toothbrush.svg',speech_ar:'ننظف الأسنان'},
    {id:'cup',label_ar:'نستخدم الكوب',image:shared+'cup.svg',speech_ar:'نستخدم الكوب'},
    {id:'leave',label_ar:'ننتقل إلى المكان التالي',symbol:'🚪',speech_ar:'ننتقل إلى المكان التالي'},
    {id:'wait',label_ar:'ننتظر قليلًا معًا',symbol:'⌛',speech_ar:'ننتظر قليلًا معًا'}
  ],
  assistance_levels:[
    {id:'child-points',label_ar:'الطفل أشار أو اختار'},
    {id:'adult-offered-two',label_ar:'المرافق عرض خيارين'},
    {id:'adult-modeled',label_ar:'المرافق عرض نموذجًا أو صورة'},
    {id:'no-choice',label_ar:'لم نطلب اختيارًا'}
  ],
  review_options:[
    {id:'accepted',label_ar:'قَبِل الخيار المعروض'},
    {id:'different',label_ar:'اختار شيئًا مختلفًا'},
    {id:'no-response-needed',label_ar:'لم يحتج إلى اختيار'},
    {id:'stopped',label_ar:'توقفنا ولم نكمل'}
  ]
};
})(window);
(function(w,d){
'use strict';
if(!d||!d.createElement)return;
try{
  var s=d.createElement('script');
  s.src='interop-ui.js?v=2';
  s.async=true;
  (d.head||d.documentElement).appendChild(s);
}catch(e){}
})(window,typeof document!=='undefined'?document:null);
