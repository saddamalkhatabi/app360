'use strict';
exports.seed=async function(knex){
  var accounts=[
    {id:'acct-family-demo',type:'family',name:'أسرة App360 التجريبية',status:'active',metadata_json:JSON.stringify({seed:true,demo:true})},
    {id:'acct-institution-demo',type:'institution',name:'مؤسسة App360 التدريبية التجريبية',status:'active',metadata_json:JSON.stringify({seed:true,demo:true})}
  ];
  var users=[
    {id:'user-parent-demo',display_name:'الأب التجريبي',role:'parent',status:'active',preferences_json:JSON.stringify({language:'ar',seed:true})},
    {id:'user-child-01',display_name:'الطفل التجريبي 1',role:'learner',age_band:'2-3',status:'active',preferences_json:JSON.stringify({seed:true})},
    {id:'user-child-02',display_name:'الطفل التجريبي 2',role:'learner',age_band:'3-4',status:'active',preferences_json:JSON.stringify({seed:true})},
    {id:'user-trainer-demo',display_name:'المدرب التجريبي',role:'trainer',status:'active',preferences_json:JSON.stringify({language:'ar',seed:true})},
    {id:'user-trainee-01',display_name:'المتدرب التجريبي 1',role:'learner',age_band:'12-16',status:'active',preferences_json:JSON.stringify({seed:true})},
    {id:'user-trainee-02',display_name:'المتدرب التجريبي 2',role:'learner',age_band:'16-24',status:'active',preferences_json:JSON.stringify({seed:true})},
    {id:'user-trainee-03',display_name:'المتدرب التجريبي 3',role:'learner',age_band:'24-45',status:'active',preferences_json:JSON.stringify({seed:true})},
    {id:'user-institution-admin',display_name:'مسؤول المؤسسة التجريبي',role:'institution_admin',status:'active',preferences_json:JSON.stringify({seed:true})}
  ];
  var members=[
    {account_id:'acct-family-demo',user_id:'user-parent-demo',relationship:'owner',permissions_json:JSON.stringify(['manage_children','review_events','manage_content','manage_audience'])},
    {account_id:'acct-family-demo',user_id:'user-child-01',relationship:'child',permissions_json:JSON.stringify(['practice'])},
    {account_id:'acct-family-demo',user_id:'user-child-02',relationship:'child',permissions_json:JSON.stringify(['practice'])},
    {account_id:'acct-institution-demo',user_id:'user-institution-admin',relationship:'owner',permissions_json:JSON.stringify(['manage_members','review_events','manage_content','manage_audience'])},
    {account_id:'acct-institution-demo',user_id:'user-trainer-demo',relationship:'trainer',permissions_json:JSON.stringify(['practice','review_events','manage_content','manage_trainees','manage_audience'])},
    {account_id:'acct-institution-demo',user_id:'user-trainee-01',relationship:'trainee',permissions_json:JSON.stringify(['practice'])},
    {account_id:'acct-institution-demo',user_id:'user-trainee-02',relationship:'trainee',permissions_json:JSON.stringify(['practice'])},
    {account_id:'acct-institution-demo',user_id:'user-trainee-03',relationship:'trainee',permissions_json:JSON.stringify(['practice'])}
  ];
  var external=[
    {user_id:'user-parent-demo',source:'safe-reels-360-future',external_user_id:'seed-parent-placeholder',sync_status:'seed-local',metadata_json:JSON.stringify({placeholder:true})},
    {user_id:'user-child-01',source:'safe-reels-360-future',external_user_id:'seed-child-01-placeholder',sync_status:'seed-local',metadata_json:JSON.stringify({placeholder:true})},
    {user_id:'user-child-02',source:'safe-reels-360-future',external_user_id:'seed-child-02-placeholder',sync_status:'seed-local',metadata_json:JSON.stringify({placeholder:true})},
    {user_id:'user-trainer-demo',source:'safe-reels-360-future',external_user_id:'seed-trainer-placeholder',sync_status:'seed-local',metadata_json:JSON.stringify({placeholder:true})},
    {user_id:'user-trainee-01',source:'safe-reels-360-future',external_user_id:'seed-trainee-01-placeholder',sync_status:'seed-local',metadata_json:JSON.stringify({placeholder:true})},
    {user_id:'user-trainee-02',source:'safe-reels-360-future',external_user_id:'seed-trainee-02-placeholder',sync_status:'seed-local',metadata_json:JSON.stringify({placeholder:true})},
    {user_id:'user-trainee-03',source:'safe-reels-360-future',external_user_id:'seed-trainee-03-placeholder',sync_status:'seed-local',metadata_json:JSON.stringify({placeholder:true})}
  ];
  var credentials=[
    {user_id:'user-parent-demo',username:'demo.parent',pin_algo:'scrypt',pin_salt:'app360-demo-salt-01',pin_hash:'50027d4ee59e916717a592a91b63e06037f5a50e8322e3e11d428b1e34359a58',status:'active',is_demo:1},
    {user_id:'user-child-01',username:'demo.child1',pin_algo:'scrypt',pin_salt:'app360-demo-salt-02',pin_hash:'0c46d280efbbf127e4179912bcd4041fd4a63398cf75380084f70ebd8255e631',status:'active',is_demo:1},
    {user_id:'user-child-02',username:'demo.child2',pin_algo:'scrypt',pin_salt:'app360-demo-salt-03',pin_hash:'ca486c00700598ece943878c4c9574a14e4ae5bfc42773d8f83b7704284e0d31',status:'active',is_demo:1},
    {user_id:'user-trainer-demo',username:'demo.trainer',pin_algo:'scrypt',pin_salt:'app360-demo-salt-04',pin_hash:'f177d93080bda97571d5d5367a49ec2472b524353e4aeb93038e52243814aba6',status:'active',is_demo:1},
    {user_id:'user-trainee-01',username:'demo.trainee1',pin_algo:'scrypt',pin_salt:'app360-demo-salt-05',pin_hash:'354916bcc966fae243a0e457e39445b5960e3159b9df0b7a441e3685dc22c357',status:'active',is_demo:1},
    {user_id:'user-trainee-02',username:'demo.trainee2',pin_algo:'scrypt',pin_salt:'app360-demo-salt-06',pin_hash:'e0e510d4e4d333b0597f4ec4f9530c2fd486aa7d3999fbeb9fff215c61486b8c',status:'active',is_demo:1},
    {user_id:'user-trainee-03',username:'demo.trainee3',pin_algo:'scrypt',pin_salt:'app360-demo-salt-07',pin_hash:'4c10b64d8375feb7b536a5607a3cfdd965ee8e7547402259a1c66a3290594f76',status:'active',is_demo:1}
  ];
  await knex('accounts').insert(accounts).onConflict('id').merge();
  await knex('users').insert(users).onConflict('id').merge();
  await knex('account_members').insert(members).onConflict(['account_id','user_id']).merge();
  await knex('external_identities').insert(external).onConflict(['source','external_user_id']).merge();
  await knex('local_credentials').insert(credentials).onConflict('username').merge();
};
