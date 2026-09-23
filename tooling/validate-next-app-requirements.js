'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
let failed=false;
function fail(m){failed=true;console.error('FAIL:',m)}
function ok(m){console.log('OK:',m)}
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
const baseline='docs/IMPLEMENTATION_MATURITY_BASELINE_AR.md';
if(!fs.existsSync(path.join(root,baseline)))fail('missing maturity baseline');
else{
  const b=read(baseline);
  ['Tap','Scroll','Android 4.4','Relative-only','Offline','48px','Big TAB','المطالبة العامة وحدها لم تعد كافية'].forEach(x=>{if(b.indexOf(x)<0)fail('maturity baseline missing '+x)});
  ok('shared implementation maturity baseline');
}
const apps=[
 {slug:'my-little-routine',tokens:['الحلقة العملية الأساسية','الآن وبعد ذلك','السحب','current_step_id','ترتيب الألعاب','Big TAB Android 4.4.2','فتح تطبيق مساعد ثم العودة']},
 {slug:'responsive-play-coach',tokens:['الحلقة العملية الأساسية','وضع أثناء اللعب','أخفِ الشاشة','child_initiative_note','say-and-name','calm-with-me','Big TAB Android 4.4.2']},
 {slug:'sensory-motion-missions',tokens:['بوابة السلامة قبل النشاط','الأجزاء','mission','easier_variant','screen-to-move','Big TAB Android 4.4.2','لا يمكن حفظ مهمة دون مادة']}
];
apps.forEach(a=>{
 const dir='apps/1-4/'+a.slug;
 const rel=dir+'/PREBUILD_REQUIREMENTS_AR.md';
 if(!fs.existsSync(path.join(root,rel))){fail('missing '+rel);return}
 const txt=read(rel);
 if(txt.indexOf('APP360-PREBUILD-MATURITY-V1')<0)fail(rel+' missing maturity marker');
 if(txt.indexOf('docs/IMPLEMENTATION_MATURITY_BASELINE_AR.md')<0)fail(rel+' does not bind shared maturity baseline');
 ['خصوصية هذا التطبيق','نموذج البيانات','التكامل مع التطبيقات السابقة','Offline','Definition of Done'].forEach(x=>{if(txt.indexOf(x)<0)fail(rel+' missing section/token '+x)});
 a.tokens.forEach(x=>{if(txt.indexOf(x)<0)fail(rel+' missing app-specific requirement '+x)});
 if(!failed)ok('app-specific prebuild maturity: '+a.slug);
});
const scaffold=read('tooling/scaffold-app.js');
if(scaffold.indexOf("'PREBUILD_REQUIREMENTS_AR.md'")<0)fail('scaffold does not preserve PREBUILD_REQUIREMENTS_AR.md');
else ok('scaffold preserves app-specific prebuild requirements');
if(failed){console.error('\nNext-app requirement validation FAILED');process.exit(1)}
console.log('\nNext-app requirement validation PASSED');
