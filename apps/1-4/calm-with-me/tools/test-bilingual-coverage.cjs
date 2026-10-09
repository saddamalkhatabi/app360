/* Verify that every *existing* browser-playable utterance has prerecorded AR and EN MP3.
   Run after full build. No live speech synthesis is permitted in loaded scripts. */
'use strict';
const assert=require('assert'),fs=require('fs'),vm=require('vm'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const manifest=JSON.parse(read('audio/bilingual/manifest.json'));
const mapSource=read('audio/bilingual/voice-map.js');
const win={};
vm.runInNewContext(mapSource,{window:win},{timeout:1000});
const m=win.APP360_CALM_BILINGUAL_AUDIO;
assert(m,'Bilingual MP3 index absent');
assert.equal(manifest.choices.length,74);
assert.equal(manifest.phrases.length,109);
const norm=s=>String(s||'').normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640]/g,'').replace(/\s+/g,' ').trim().replace(/[.،؟!?؛:«»"']/g,'').trim();
const sandbox={window:{}};
vm.runInNewContext(read('data/content.js'),sandbox);
vm.runInNewContext(read('data/emotion-library.js'),sandbox);
const content=sandbox.window.APP360_CALM_CONTENT,lib=sandbox.window.APP360_EMOTION_LIBRARY;
let total=0;
function checkPhrase(text){
 const row=m.phrases[norm(text)];
 assert(row,'Missing prerecorded entry: '+text);
 assert(row.ar&&row.en,'Missing language audio: '+text);
 assert(fs.statSync(path.join(root,row.ar.path)).size>800,'Missing Arabic MP3 '+text);
 assert(fs.statSync(path.join(root,row.en.path)).size>800,'Missing English MP3 '+text);
 total++;
}
for(const row of manifest.choices){
 const entry=m.choices[row.id];
 assert(entry&&entry.ar&&entry.en,'Choice incomplete '+row.id);
 assert(fs.existsSync(path.join(root,entry.ar.path)),'Arabic choice file missing '+row.id);
 assert(fs.existsSync(path.join(root,entry.en.path)),'English choice file missing '+row.id);
}
for(const x of lib.situations)checkPhrase(x.say_ar);
for(const c of lib.categories)for(const t of c.audio_ar||[])checkPhrase(t);
for(const h of content.helps)checkPhrase(h.speech_ar||h.label_ar);
assert(total>=109);
for(const js of ['app.js','journey-v9.js','emotion-school-v8.js','calm-silma-controller-serial-v1.js','calm-bilingual-voice-v1.js']){
 assert(!/speechSynthesis|SpeechSynthesisUtterance/.test(read(js)),'Browser TTS not permitted: '+js);
}
console.log('ALL DIRECT + CONTEXTUAL SPOKEN EVENTS: full Arabic & English recorded MP3; no browser TTS.');
