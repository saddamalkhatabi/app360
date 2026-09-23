'use strict';
exports.seed=async function(knex){
  await knex('applications').del();
  await knex('applications').insert([
    {id:'a1-first-words',slug:'say-and-name',title_ar:'كلماتي مع أشيائي: اسمع وأشر وسمِّ',age_group:'1-4',status:'live',entry_path:'apps/1-4/say-and-name/index.html',capabilities_json:JSON.stringify(['audio.tts','audio.recorded','pwa.offline','compat.legacy-web','ai.content-import'])},
    {id:'a1-imitate',slug:'imitate-one-step',title_ar:'دوري ودورك: قلّد حركة واحدة',age_group:'1-4',status:'live',entry_path:'apps/1-4/imitate-one-step/index.html',capabilities_json:JSON.stringify(['practice.core','pwa.offline','compat.legacy-web','ai.content-import'])},
    {id:'a1-screen-move',slug:'screen-to-move',title_ar:'ألعاب إبداعية عبر الشاشة — أو بدون الشاشة',age_group:'1-4',status:'live',entry_path:'apps/1-4/screen-to-move/index.html',capabilities_json:JSON.stringify(['practice.core','audio.tts','pwa.offline','compat.legacy-web','ai.content-import'])},
    {id:'a1-drawing-writing',slug:'drawing-writing-foundations',title_ar:'لوحة الطفل للرسم والكتابة المبكرة',age_group:'1-4',status:'live',entry_path:'apps/1-4/drawing-writing-foundations/index.html',capabilities_json:JSON.stringify(['practice.core','audio.tts','audio.recorded','pwa.offline','compat.legacy-web','ai.content-import'])},
    {id:'a1-calm',slug:'calm-with-me',title_ar:'مشاعري معك: أحتاج مساعدة',age_group:'1-4',status:'live',entry_path:'apps/1-4/calm-with-me/index.html',capabilities_json:JSON.stringify(['practice.core','emotion.guided-journey','pwa.offline','compat.legacy-web','ai.content-import'])},
    {id:'a1-plan-runner',slug:'plan-runner-360',title_ar:'مخطط التشغيل 360: ابنِ ونفّذ خطة',age_group:'1-4',status:'live',entry_path:'apps/1-4/plan-runner-360/index.html',capabilities_json:JSON.stringify(['practice.core','deep-links','pwa.offline','compat.legacy-web','ai.content-import'])}
  ]);
};
