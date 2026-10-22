'use strict';
// Source integration evidence. This is deliberately not a listening/device test.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const acorn=require((process.env.APP360_TEST_MODULES||'/tmp/unified-identity-test/node_modules')+'/acorn');
const root=path.resolve(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
const runtime=['assets/js/app360-session-v1.js','assets/js/unified-login-v1.js','assets/js/auth-complete-v1.js','assets/js/reels-login-v1.js','assets/js/reels-bridge-v1.js','assets/js/integration-context-v1.js','assets/js/teacher-encouragement-v1.js','resources/celebration-audio/player-v1.js','apps/1-4/drawing-writing-foundations/coach/trainer.js','apps/1-4/picture-puzzles/audio-v3.js','apps/1-4/picture-puzzles/learning-v4.js','apps/1-4/tangram-builder/teacher-v1.js'];
for(const p of runtime)acorn.parse(read(p),{ecmaVersion:5,allowReserved:true});
function walk(dir){return fs.readdirSync(path.join(root,dir),{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(dir+'/'+e.name):[dir+'/'+e.name])}
const files=walk('apps'),rows=[];for(const html of files.filter(p=>/\/index\.html$/.test(p)&&p.split('/').length===4)){const text=read(html),folder=path.posix.dirname(html),scripts=[...text.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map(m=>m[1]);const calls=files.filter(p=>p.startsWith(folder+'/')&&/\.(?:js|html)$/.test(p)&&!/(?:offline|manifest|\.test\.|\/test\/|\/tooling\/|audio-map|audio-cues|pcm)/.test(p)&&fs.statSync(path.join(root,p)).size<1200000).filter(p=>/APP360_TEACHER_ENCOURAGEMENT|App360Celebration\.(?:play|playPersonalized)|signedInName/.test(read(p)));
 if(calls.length)rows.push({app:folder,entry:html,session_script:scripts.find(s=>s.includes('app360-session-v1.js'))||'via app360-ai-shell/shared loader',praise_scripts:scripts.filter(s=>/celebration|teacher-encouragement/.test(s)),callers:calls});}
assert(rows.length>=8,'expected real published praise integrations');
assert(!/signedInName:false/.test(read('apps/1-4/picture-puzzles/audio-v3.js')+read('apps/1-4/picture-puzzles/learning-v4.js')));
assert(read('apps/1-4/drawing-writing-foundations/coach/trainer.js').includes("owner:'drawing-coach'"));
const info={kind:'source audit, not audible verification',es5_scripts:runtime,apps:rows,notes:['Current slugs: tangram-builder, my-little-routine, story-language-lab.','Official identity comes only from APP360_SESSION. Local learning profiles are not login credentials.','Explicit subscription/entitlement playPersonalized remains distinct from the shared recorded teacher encouragement.']};
if(!process.argv.includes('--check'))fs.writeFileSync(path.join(root,'docs/unified-login-app-audit-20261023.json'),JSON.stringify(info,null,2)+'\n');
console.log('PASS ES5 grammar '+runtime.length+' runtimes; actual praise callsites in '+rows.length+' apps');
