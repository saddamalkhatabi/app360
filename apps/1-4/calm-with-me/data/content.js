(function(w){
'use strict';
var shared='../../../resources/early-child-visuals/objects/';
w.APP360_CALM_CONTENT={
  schema_version:'1.1',
  app_id:'a1-calm',
  principles:{no_inference:true,skippable:true,no_forced_breathing:true,no_scores:true,local_only:true},
  age_bands:[
    {id:'1-2',label_ar:'1–2 سنة',hint_ar:'صور وإشارات وكلمات قليلة جدًا. نبدأ بالقرب والاحتياجات الجسدية قبل كثرة الأسئلة.',max_signals:8,max_feelings:4,max_helps:10},
    {id:'2-3',label_ar:'2–3 سنوات',hint_ar:'جملة قصيرة وخياران واضحان. نساعد الطفل على قول الحاجة قبل شرح السبب.',max_signals:10,max_feelings:6,max_helps:12},
    {id:'3-4',label_ar:'3–4 سنوات',hint_ar:'يمكن استخدام شعور + سبب بسيط + حاجة، مع اللعب والرسم لتوضيح ما حدث.',max_signals:12,max_feelings:9,max_helps:12},
    {id:'4-5',label_ar:'4–5 سنوات · امتداد',hint_ar:'يمكن استخدام قصة قصيرة عن الموقف وحلين للاختيار، مع التفريق بين الفكرة والواقع.',max_signals:12,max_feelings:12,max_helps:12}
  ],
  signals:[
    {id:'need-help',label_ar:'ساعدني',symbol:'🤝',speech_ar:'ساعدني',age_bands:['1-2','2-3','3-4','4-5']},
    {id:'stay-close',label_ar:'ابقَ قريبًا',symbol:'🫶',speech_ar:'ابق قريبًا مني',age_bands:['1-2','2-3','3-4','4-5']},
    {id:'pick-me-up',label_ar:'احملني',symbol:'🤲',speech_ar:'احملني إذا سمحت',age_bands:['1-2','2-3']},
    {id:'need-space',label_ar:'أريد مساحة',symbol:'↔',speech_ar:'أريد مساحة قليلًا',age_bands:['2-3','3-4','4-5']},
    {id:'pause-now',label_ar:'توقف قليلًا',symbol:'⏸',speech_ar:'توقف قليلًا',age_bands:['1-2','2-3','3-4','4-5']},
    {id:'all-done',label_ar:'خلص',symbol:'✅',speech_ar:'خلص',age_bands:['1-2','2-3']},
    {id:'no',label_ar:'لا أريد',symbol:'✋',speech_ar:'لا أريد',age_bands:['1-2','2-3','3-4','4-5']},
    {id:'water-now',label_ar:'أريد ماء',image:shared+'water.svg',speech_ar:'أريد ماء',age_bands:['1-2','2-3']},
    {id:'what-next',label_ar:'أرني ماذا بعد',symbol:'➡',speech_ar:'أرني ماذا بعد',age_bands:['1-2','2-3','3-4','4-5']},
    {id:'want-mom-dad',label_ar:'أريد أمي أو أبي',symbol:'🏠',speech_ar:'أريد أمي أو أبي',age_bands:['1-2','2-3','3-4']},
    {id:'quiet',label_ar:'أريد هدوءًا',symbol:'🤫',speech_ar:'أريد مكانًا أهدأ',age_bands:['2-3','3-4','4-5']},
    {id:'move',label_ar:'أريد حركة',symbol:'👣',speech_ar:'أريد أن أتحرك',age_bands:['2-3','3-4','4-5']},
    {id:'my-turn',label_ar:'أريد دوري',symbol:'🔁',speech_ar:'أريد دوري',age_bands:['2-3','3-4','4-5']},
    {id:'my-toy',label_ar:'أريد لعبتي',symbol:'🧸',speech_ar:'أريد لعبتي',age_bands:['2-3','3-4']},
    {id:'explain',label_ar:'اشرح لي',symbol:'💬',speech_ar:'اشرح لي ماذا سيحدث',age_bands:['3-4','4-5']},
    {id:'try-myself',label_ar:'أريد أجرب بنفسي',symbol:'🙋',speech_ar:'أريد أن أجرب بنفسي',age_bands:['3-4','4-5']},
    {id:'talk-later',label_ar:'سأتكلم بعد قليل',symbol:'🕰️',speech_ar:'سأتكلم بعد قليل',age_bands:['3-4','4-5']},
    {id:'two-solutions',label_ar:'أعطني حلين',symbol:'2️⃣',speech_ar:'أعطني حلين لأختار',age_bands:['4-5']},
    {id:'no-label',label_ar:'لا أريد تسمية',symbol:'○',speech_ar:'لا أريد تسمية الشعور',age_bands:['1-2','2-3','3-4','4-5']}
  ],
  feelings:[
    {id:'happy',label_ar:'فرح',symbol:'🙂',speech_ar:'فرح',age_bands:['1-2','2-3','3-4','4-5']},
    {id:'sad',label_ar:'حزن',symbol:'☹',speech_ar:'حزن',age_bands:['1-2','2-3','3-4','4-5']},
    {id:'afraid',label_ar:'خوف',symbol:'😟',speech_ar:'خوف',age_bands:['1-2','2-3','3-4','4-5']},
    {id:'upset',label_ar:'انزعاج',symbol:'◉',speech_ar:'انزعاج',age_bands:['1-2','2-3','3-4','4-5']},
    {id:'angry',label_ar:'غضب',symbol:'😠',speech_ar:'غضب',age_bands:['2-3','3-4','4-5']},
    {id:'tired',label_ar:'تعب',symbol:'☾',speech_ar:'تعب',age_bands:['1-2','2-3','3-4','4-5']},
    {id:'worried',label_ar:'قلق',symbol:'🌦️',speech_ar:'قلق',age_bands:['3-4','4-5']},
    {id:'frustrated',label_ar:'إحباط',symbol:'🧩',speech_ar:'إحباط',age_bands:['3-4','4-5']},
    {id:'jealous',label_ar:'غيرة',symbol:'💚',speech_ar:'غيرة',age_bands:['3-4','4-5']},
    {id:'shy',label_ar:'خجل',symbol:'🙈',speech_ar:'خجل',age_bands:['3-4','4-5']},
    {id:'embarrassed',label_ar:'إحراج',symbol:'😳',speech_ar:'إحراج',age_bands:['4-5']},
    {id:'lonely',label_ar:'وحدة أو اشتياق',symbol:'🤍',speech_ar:'أشعر بالاشتياق',age_bands:['3-4','4-5']},
    {id:'disappointed',label_ar:'خيبة',symbol:'🌧️',speech_ar:'أنا محبط لأن ما أردته لم يحدث',age_bands:['4-5']},
    {id:'unsure',label_ar:'لا أعرف',symbol:'?',speech_ar:'لا أعرف',age_bands:['1-2','2-3','3-4','4-5']}
  ],
  helps:[
    {id:'close',label_ar:'ابقَ قريبًا',symbol:'🫶',category:'closeness',speech_ar:'أنا قريب منك',age_bands:['1-2','2-3','3-4','4-5'],suggest_for:['afraid','sad','worried','stay-close','want-mom-dad'],enabled:true},
    {id:'hold-if-wanted',label_ar:'احملني إذا أردت',symbol:'🤲',category:'closeness',speech_ar:'إذا أردت يمكنني أن أحملك',age_bands:['1-2','2-3'],suggest_for:['afraid','sad','pick-me-up','want-mom-dad'],enabled:true},
    {id:'comfort-touch',label_ar:'حضن أو لمسة إذا طلبت',symbol:'🫂',category:'closeness',speech_ar:'إذا أردت حضنًا أنا هنا',age_bands:['1-2','2-3','3-4','4-5'],suggest_for:['sad','afraid','lonely'],enabled:true},
    {id:'space',label_ar:'مساحة أكبر',symbol:'↔',category:'space',speech_ar:'سأعطيك مساحة وأبقى قريبًا',age_bands:['2-3','3-4','4-5'],suggest_for:['angry','upset','need-space'],enabled:true},
    {id:'quiet-place',label_ar:'مكان أهدأ',symbol:'🤫',category:'sensory',speech_ar:'يمكننا الذهاب لمكان أهدأ',age_bands:['1-2','2-3','3-4','4-5'],suggest_for:['afraid','upset','tired','quiet','worried'],enabled:true},
    {id:'reduce-noise',label_ar:'نخفف الصوت والضوء',symbol:'🎧',category:'sensory',speech_ar:'سنخفف الصوت والضوء قليلًا',age_bands:['1-2','2-3','3-4','4-5'],suggest_for:['upset','quiet','tired'],enabled:true},
    {id:'familiar-object',label_ar:'غرض أو لعبة مألوفة',image:shared+'ball.svg',category:'comfort',speech_ar:'يمكنك أن تمسك لعبتك المألوفة',age_bands:['1-2','2-3','3-4'],suggest_for:['afraid','sad','want-mom-dad'],enabled:true},
    {id:'quiet-book',label_ar:'كتاب أو نشاط هادئ',image:shared+'book.svg',category:'quiet',speech_ar:'هل تريد كتابًا أو نشاطًا هادئًا',age_bands:['1-2','2-3','3-4','4-5'],suggest_for:['tired','quiet','upset'],enabled:true},
    {id:'water',label_ar:'ماء إذا أراد',image:shared+'water.svg',category:'care',speech_ar:'هل تريد ماء',age_bands:['1-2','2-3','3-4','4-5'],suggest_for:['water-now','tired'],enabled:true},
    {id:'body-check',label_ar:'نتحقق من الجوع والتعب والألم',symbol:'🩺',category:'care',speech_ar:'سنرى أولًا ماذا يحتاج جسمك',age_bands:['1-2','2-3','3-4','4-5'],suggest_for:['tired','upset'],enabled:true},
    {id:'show-next',label_ar:'أريك ماذا بعد',symbol:'➡',category:'transition',speech_ar:'سأريك ماذا بعد',age_bands:['1-2','2-3','3-4','4-5'],suggest_for:['what-next','worried','upset'],enabled:true},
    {id:'more-time',label_ar:'وقت إضافي قصير',symbol:'⌛',category:'time',speech_ar:'لديك وقت قصير إضافي ثم ننتقل',age_bands:['2-3','3-4','4-5'],suggest_for:['upset','angry'],enabled:true},
    {id:'move-together',label_ar:'ننتقل معًا',symbol:'👣',category:'transition',speech_ar:'سننتقل معًا',age_bands:['1-2','2-3','3-4','4-5'],suggest_for:['afraid','what-next','want-mom-dad'],enabled:true},
    {id:'two-choices',label_ar:'خياران واضحان',symbol:'✌️',category:'choice',speech_ar:'سأعطيك خيارين فقط',age_bands:['2-3','3-4','4-5'],suggest_for:['angry','upset','two-solutions'],enabled:true},
    {id:'one-choice',label_ar:'خيار واحد بسيط',symbol:'1️⃣',category:'choice',speech_ar:'سنختار شيئًا واحدًا بسيطًا الآن',age_bands:['1-2'],suggest_for:['upset','afraid'],enabled:true},
    {id:'model-words',label_ar:'أعطيك الكلمات بدل السؤال',symbol:'💬',category:'language',speech_ar:'يمكنني أن أقول الكلمات وأنت تشير فقط',age_bands:['1-2','2-3'],suggest_for:['need-help','no-label'],enabled:true},
    {id:'name-one-feeling',label_ar:'نقترح كلمة شعور واحدة',symbol:'🙂',category:'language',speech_ar:'قد يكون هذا خوفًا أو انزعاجًا، ويمكنك أن تقول لا أعرف',age_bands:['2-3','3-4'],suggest_for:['no-label','unsure'],enabled:true},
    {id:'draw-feeling',label_ar:'نرسم ما حدث أو الشعور',symbol:'🖍️',category:'expression',speech_ar:'يمكننا أن نرسم ما حدث بدل أن نشرحه كله',age_bands:['3-4','4-5'],suggest_for:['sad','afraid','angry','worried','shy','embarrassed'],enabled:true},
    {id:'role-play',label_ar:'نمثل الموقف بالدمى',symbol:'🎭',category:'expression',speech_ar:'يمكننا أن نمثل القصة بالدمى',age_bands:['3-4','4-5'],suggest_for:['afraid','shy','jealous','worried'],enabled:true},
    {id:'short-story',label_ar:'قصة قصيرة: ماذا حدث؟',symbol:'📖',category:'expression',speech_ar:'سنحكي ما حدث في جملتين فقط',age_bands:['3-4','4-5'],suggest_for:['sad','worried','embarrassed'],enabled:true},
    {id:'wall-push',label_ar:'ندفع الجدار بأيدينا',symbol:'👐',category:'movement',speech_ar:'يمكننا دفع الجدار بقوة آمنة ثم التوقف',age_bands:['2-3','3-4','4-5'],suggest_for:['angry','frustrated','move'],enabled:true},
    {id:'pillow-push',label_ar:'ندفع وسادة كبيرة',symbol:'🛋️',category:'movement',speech_ar:'يمكننا دفع الوسادة بأمان',age_bands:['1-2','2-3','3-4'],suggest_for:['angry','upset','move'],enabled:true},
    {id:'heavy-walk',label_ar:'نمشي خطوات ثقيلة معًا',symbol:'🐻',category:'movement',speech_ar:'لنمش خطوات ثقيلة مثل الدب',age_bands:['2-3','3-4','4-5'],suggest_for:['angry','frustrated','move'],enabled:true},
    {id:'playdough',label_ar:'نعصر عجينة لعب',symbol:'🟠',category:'movement',speech_ar:'يمكنك عصر عجينة اللعب بيديك',age_bands:['3-4','4-5'],suggest_for:['angry','worried','frustrated'],enabled:true},
    {id:'safe-jumps',label_ar:'قفزات قليلة إذا أراد',symbol:'⬆️',category:'movement',speech_ar:'إذا أردت يمكننا عمل قفزات قليلة وآمنة',age_bands:['2-3','3-4','4-5'],suggest_for:['move','angry','upset'],enabled:true},
    {id:'check-reality',label_ar:'نفرق بين الفكرة وما يحدث الآن',symbol:'🔎',category:'thinking',speech_ar:'سنرى: هل حدث هذا الآن أم أنها فكرة أخافتك',age_bands:['4-5'],suggest_for:['afraid','worried'],enabled:true},
    {id:'two-solutions-help',label_ar:'نقترح حلين واقعيين',symbol:'💡',category:'thinking',speech_ar:'لدي حلان، اختر واحدًا منهما',age_bands:['4-5'],suggest_for:['two-solutions','frustrated','worried','angry'],enabled:true},
    {id:'wait-nearby',label_ar:'أنتظر بقربك دون كلام',symbol:'🪑',category:'space',speech_ar:'سأنتظر هنا بقربك ولا تحتاج للكلام الآن',age_bands:['2-3','3-4','4-5'],suggest_for:['talk-later','sad','shy','embarrassed'],enabled:true}
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
