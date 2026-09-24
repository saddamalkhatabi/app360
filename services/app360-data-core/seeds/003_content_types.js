'use strict';
var fs=require('fs');
var path=require('path');
exports.seed=async function(knex){
  var p=path.resolve(__dirname,'../../../data/ai-content-contracts.json');
  var contracts=JSON.parse(fs.readFileSync(p,'utf8'));
  await knex('content_types').del();
  var rows=[],apps=contracts.apps||[],i,j,a,t,base=[
    {id:'ai_pack',label_ar:'حزمة AI شخصية',supports_images:true,supports_audio_script:true},
    {id:'user_input',label_ar:'مدخل مستخدم محفوظ',supports_images:true,supports_audio_script:false},
    {id:'user_artifact',label_ar:'مخرج أو تصميم شخصي',supports_images:true,supports_audio_script:false}
  ];
  for(i=0;i<apps.length;i++){
    a=apps[i];
    for(j=0;j<(a.content_types||[]).length;j++){
      t=a.content_types[j];
      rows.push({key:a.app_id+':'+t.id,app_id:a.app_id,type_id:t.id,label_ar:t.label_ar,supports_images:t.supports_images?1:0,supports_audio_script:t.supports_audio_script?1:0,schema_json:JSON.stringify({fields:t.fields||[],required_item_fields:t.required_item_fields||[],example:t.example||{}})});
    }
    for(j=0;j<base.length;j++)rows.push({key:a.app_id+':'+base[j].id,app_id:a.app_id,type_id:base[j].id,label_ar:base[j].label_ar,supports_images:base[j].supports_images?1:0,supports_audio_script:base[j].supports_audio_script?1:0,schema_json:JSON.stringify({generic:true,fields:['content','assets'],required_item_fields:[]})});
  }
  if(rows.length)await knex('content_types').insert(rows);
};
