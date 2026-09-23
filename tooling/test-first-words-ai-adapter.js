'use strict';
const fs=require('fs');
const path=require('path');
const assert=require('assert');
const code=fs.readFileSync(path.join(__dirname,'..','apps/1-4/say-and-name/ai-native-adapter.js'),'utf8');
const SEP='\u0001';
const packs=[
  {local_status:'published',content_type:'word_cards',items:[{id:'ai-window',level:1,category_ar:'المنزل',category_en:'Home',word_ar:'نافذة',word_en:'Window',asset_ref:'window.png'}],assets:[{file_name:'window.png',item_ref:'ai-window',data_url:'data:image/png;base64,AAA'}]},
  {local_status:'published',content_type:'word_category',items:[{id:'ai-hygiene',level:2,category_ar:'أدوات النظافة',category_en:'Hygiene',words:[{id:'ai-towel',word_ar:'منشفة',word_en:'Towel'}]}],assets:[]},
  {local_status:'draft',content_type:'word_cards',items:[{id:'ai-hidden',level:1,category_ar:'المنزل',word_ar:'يجب ألا تظهر'}],assets:[]}
];
const store={'app360:ai-content:v1:a1-first-words':JSON.stringify(packs)};
const windowMock={
  APP360_LEVELS:{'1':[['المنزل','🏠','باب']]},
  APP360_EN:{categories:{},words:{}},
  localStorage:{getItem:k=>store[k]||null},
  addEventListener:function(){},
  MutationObserver:null,
  location:{reload:function(){}}
};
const documentMock={readyState:'loading',addEventListener:function(){},attachEvent:function(){},getElementById:function(){return null},querySelector:function(){return null},body:{}};
new Function('window','document',code)(windowMock,documentMock);
function row(level,name){return (windowMock.APP360_LEVELS[String(level)]||[]).find(r=>r[0]===name)}
assert(row(1,'المنزل'),'existing category must remain');
assert(row(1,'المنزل')[2].split('|').includes('نافذة'),'published AI word must merge into native category');
assert(!row(1,'المنزل')[2].split('|').includes('يجب ألا تظهر'),'draft AI word must not merge');
assert(row(2,'أدوات النظافة'),'published AI category must be created');
assert(row(2,'أدوات النظافة')[2].split('|').includes('منشفة'),'nested category word must merge');
assert.strictEqual(windowMock.APP360_EN.categories['المنزل'],'Home');
assert.strictEqual(windowMock.APP360_EN.words['المنزل'+SEP+'نافذة'],'Window');
assert.strictEqual(windowMock.APP360_EN.words['أدوات النظافة'+SEP+'منشفة'],'Towel');
assert.strictEqual(windowMock.APP360_AI_WORD_IMAGES['المنزل'+SEP+'نافذة'],'data:image/png;base64,AAA');
assert.strictEqual(windowMock.APP360_FIRST_WORDS_AI_SUMMARY.packs,2);
console.log('First-words native AI adapter test PASSED');
