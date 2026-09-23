'use strict';
exports.seed=async function(knex){
  var accounts=[
    {id:'acct-family-demo',type:'family',name:'أسرة تجريبية',status:'active',metadata_json:JSON.stringify({seed:true})},
    {id:'acct-institution-demo',type:'institution',name:'مؤسسة تدريب تجريبية',status:'active',metadata_json:JSON.stringify({seed:true})}
  ];
  var users=[
    {id:'user-parent-demo',display_name:'ولي أمر تجريبي',role:'parent',status:'active',preferences_json:JSON.stringify({language:'ar'})},
    {id:'user-child-01',display_name:'طفل تجريبي 1',role:'learner',age_band:'2-3',status:'active',preferences_json:JSON.stringify({seed:true})},
    {id:'user-child-02',display_name:'طفل تجريبي 2',role:'learner',age_band:'3-4',status:'active',preferences_json:JSON.stringify({seed:true})},
    {id:'user-trainer-demo',display_name:'مدرب تجريبي',role:'trainer',status:'active',preferences_json:JSON.stringify({language:'ar'})},
    {id:'user-institution-admin',display_name:'مسؤول مؤسسة تجريبي',role:'institution_admin',status:'active',preferences_json:JSON.stringify({seed:true})}
  ];
  var members=[
    {account_id:'acct-family-demo',user_id:'user-parent-demo',relationship:'owner',permissions_json:JSON.stringify(['manage_children','review_events','manage_content'])},
    {account_id:'acct-family-demo',user_id:'user-child-01',relationship:'child',permissions_json:JSON.stringify(['practice'])},
    {account_id:'acct-family-demo',user_id:'user-child-02',relationship:'child',permissions_json:JSON.stringify(['practice'])},
    {account_id:'acct-institution-demo',user_id:'user-institution-admin',relationship:'owner',permissions_json:JSON.stringify(['manage_members','review_events','manage_content'])},
    {account_id:'acct-institution-demo',user_id:'user-trainer-demo',relationship:'trainer',permissions_json:JSON.stringify(['practice','review_events','manage_content'])}
  ];
  var external=[
    {user_id:'user-parent-demo',source:'safe-reels-360-future',external_user_id:'seed-parent-placeholder',sync_status:'seed-local',metadata_json:JSON.stringify({placeholder:true})},
    {user_id:'user-child-01',source:'safe-reels-360-future',external_user_id:'seed-child-01-placeholder',sync_status:'seed-local',metadata_json:JSON.stringify({placeholder:true})},
    {user_id:'user-trainer-demo',source:'safe-reels-360-future',external_user_id:'seed-trainer-placeholder',sync_status:'seed-local',metadata_json:JSON.stringify({placeholder:true})}
  ];
  await knex('accounts').insert(accounts).onConflict('id').merge();
  await knex('users').insert(users).onConflict('id').merge();
  await knex('account_members').insert(members).onConflict(['account_id','user_id']).merge();
  await knex('external_identities').insert(external).onConflict(['source','external_user_id']).merge();
};
