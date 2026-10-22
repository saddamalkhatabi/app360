'use strict';
const fs=require('fs'),path=require('path'),root=path.resolve(__dirname,'..');let failed=false;
function fail(message){failed=true;console.error('FAIL:',message)}function ok(message){console.log('OK:',message)}
function read(rel){return JSON.parse(fs.readFileSync(path.join(root,rel),'utf8'))}
function clean(rel){return String(rel||'').split(/[?#]/)[0]}
function relativeOnly(value){return typeof value==='string'&&/^[a-zA-Z0-9_./-]+(?:[?#][^\r\n\\]*)?$/.test(value)&&value.indexOf('//')!==0&&!value.startsWith('/')&&!/(?:^|\/)\.\.(?:\/|$)/.test(clean(value))&&!/%[0-9a-f]{2}/i.test(clean(value))}
function exists(rel){return relativeOnly(rel)&&fs.existsSync(path.join(root,clean(rel)))}
const reg=read('data/app-links-registry.json'),published=read('data/public-links.json'),entries=new Map((published.apps||[]).map(a=>[clean(a.path),a.id]));
if(reg.domain_policy!=='relative-only')fail('registry must be relative-only');if(!exists('assets/js/app-link-host.js'))fail('missing shared app-link-host.js');
const host=fs.readFileSync(path.join(root,'assets/js/app-link-host.js'),'utf8');
for(const text of ['العودة دون إكمال','embedded','أنجزنا النشاط','app360_result'])if(!host.includes(text))fail('shared host missing '+text);
if(host.includes('inset:0')||/\bconst\b|\blet\b|=>/.test(host))fail('shared host must remain legacy-compatible');
const arg=process.argv.indexOf('--app'),only=arg>=0?process.argv[arg+1]:null,selected=(reg.apps||[]).filter(a=>!only||a.app_id===only),seen=new Set();
if(arg>=0&&!only||only&&!selected.length)fail('unknown/missing --app');
for(const a of selected){
 if(!a.app_id||seen.has(a.app_id))fail('missing/duplicate app_id '+a.app_id);seen.add(a.app_id);
 if(!exists(a.archive_path)){fail('bad archive '+a.app_id);continue}if(!exists(a.launch_path)){fail('bad launch '+a.app_id);continue}
 const m=read(a.archive_path),launch=clean(a.launch_path),bridge=/\/launch\.html$/.test(launch);
 if(m.app_id!==a.app_id||m.domain_policy!=='relative-only')fail('archive identity/domain policy '+a.app_id);
 if(m.app_href&&!exists(m.app_href))fail('bad app href '+a.app_id);
 if(!Array.isArray(m.routes)||!m.routes.length)fail('archive has no routes '+a.app_id);
 if(!bridge&&entries.get(launch)!==a.app_id)fail('direct launch must be this published app '+a.app_id);
 for(const r of m.routes||[]){const href=r.href||r.href_template,target=clean(href);if(!r.id)fail('route without id '+a.app_id);
  if(!relativeOnly(href)||!exists(target)||!(target===launch||entries.has(target)))fail('route is not a published relative destination '+a.app_id+' '+r.id);
  for(const source of [].concat(r.collection_source||[],r.collection_sources||[])){const rel=path.posix.join(m.base_path,source);if(!exists(rel))fail('missing collection source '+rel)}
 }
 if(bridge){const html=fs.readFileSync(path.join(root,launch),'utf8');if(!html.includes('../../../assets/js/app-link-host.js')||!html.includes(a.app_id))fail('launch missing shared host/app id '+a.app_id)}
}
if(seen.size!==selected.length)fail('registry duplicate ids');
if(failed)process.exitCode=1;else ok(seen.size+' app link archives verified: published direct destinations and embedded launch bridges');
