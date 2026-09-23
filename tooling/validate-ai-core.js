'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
let failed=false;
function fail(m){failed=true;console.error('FAIL:',m)}
function ok(m){console.log('OK:',m)}
function read(p){return fs.readFileSync(path.join(root,p),'utf8')}
function exists(p){return fs.existsSync(path.join(root,p))}
let contracts;
try{contracts=JSON.parse(read('data/ai-content-contracts.json'))}catch(e){fail('AI contract registry JSON: '+e.message);contracts={}}
if(!contracts.privacy||contracts.privacy.send_child_data_by_default!==false)fail('AI privacy must default to no child-data sending');else ok('AI privacy default is local/manual');
const studio=read('assets/js/ai-content-studio.js');
if(/\bconst\b|\blet\b|=>|`/.test(studio))fail('AI studio must stay ES5 for legacy app path');else ok('AI studio ES5 syntax policy');
try{new Function(studio);ok('AI studio parses')}catch(e){fail('AI studio syntax: '+e.message)}
['APP360_AI_CONTENT','FileReader','image/','content_type','local_status','app360:ai-content:v1:','app360:ai-content-imported'].forEach(x=>{if(studio.indexOf(x)<0)fail('AI studio missing '+x)});
const compat=read('assets/js/legacy-compat.js');if(compat.indexOf('ai-content-studio.js?v=1')<0)fail('legacy compatibility layer does not autoload AI studio');else ok('AI studio autoload enabled');
const requiredApps=['a1-first-words','a1-imitate','a1-screen-move','a1-drawing-writing','a1-calm','a1-plan-runner'];
const byId={};(contracts.apps||[]).forEach(a=>{if(byId[a.app_id])fail('duplicate AI app contract '+a.app_id);byId[a.app_id]=a;if(!a.slug||!a.age_group||!Array.isArray(a.content_types)||!a.content_types.length)fail('invalid AI app contract '+a.app_id);(a.content_types||[]).forEach(t=>{if(!t.id||!t.label_ar||!Array.isArray(t.required_item_fields)||!t.required_item_fields.length)fail('invalid content type '+a.app_id+':'+(t.id||'?'));if(t.supports_images&&JSON.stringify(t).indexOf('asset_ref')<0&&JSON.stringify(t).indexOf('assets')<0)fail('image-capable type needs asset reference '+a.app_id+':'+t.id)})});
requiredApps.forEach(id=>{const a=byId[id];if(!a){fail('missing AI contract '+id);return}const index='apps/'+a.age_group+'/'+a.slug+'/index.html';if(!exists(index)){fail('AI app entry missing '+index);return}const html=read(index);if(html.indexOf('legacy-compat.js')<0&&html.indexOf('ai-content-studio.js')<0)fail('AI runtime loader missing from '+index);else ok('AI-enabled app '+id)});
const dbFiles=['services/app360-data-core/package.json','services/app360-data-core/knexfile.js','services/app360-data-core/src/db.js','services/app360-data-core/src/contracts.js','services/app360-data-core/src/repository.js','services/app360-data-core/src/file-store.js','services/app360-data-core/migrations/001_identity.js','services/app360-data-core/migrations/002_content.js','services/app360-data-core/migrations/003_files.js','services/app360-data-core/migrations/004_ai_imports.js','services/app360-data-core/migrations/005_events_and_sync.js','services/app360-data-core/seeds/001_users.js','services/app360-data-core/seeds/002_apps.js','services/app360-data-core/seeds/003_content_types.js'];
dbFiles.forEach(f=>{if(!exists(f))fail('missing data-core file '+f)});
try{const pkg=JSON.parse(read('services/app360-data-core/package.json'));if(pkg.dependencies['better-sqlite3']!=='11.10.0')fail('better-sqlite3 must be pinned for Node 20 service');if(pkg.dependencies.knex!=='3.3.0')fail('knex must be pinned');else ok('data-core dependency pins')}catch(e){fail('data-core package JSON: '+e.message)}
const workspace=read('pnpm-workspace.yaml');if(workspace.indexOf("!services/app360-data-core")<0)fail('native data-core must remain isolated from static frozen workspace install');else ok('native DB service isolated from static workspace');
['services/app360-data-core/migrations/001_identity.js','services/app360-data-core/migrations/002_content.js','services/app360-data-core/migrations/003_files.js','services/app360-data-core/migrations/004_ai_imports.js','services/app360-data-core/migrations/005_events_and_sync.js'].forEach(f=>{try{new Function('require','module','exports',read(f));ok('syntax '+f)}catch(e){fail('syntax '+f+': '+e.message)}});
if(failed){console.error('\nAI content/data core validation FAILED');process.exit(1)}
console.log('\nAI content/data core validation PASSED');
