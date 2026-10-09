#!/usr/bin/env node
/* Inventory EVERY built-in utterance reachable from the existing calm UI.
   No child data and no runtime TTS. The generated JSON is input for offline audio builds. */
'use strict';
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),path=require('path');
const root=path.resolve(__dirname,'..');
const read=(p)=>fs.readFileSync(path.join(root,p),'utf8');
const sandbox={window:{}};
vm.runInNewContext(read('data/content.js'),sandbox,{timeout:1000});
vm.runInNewContext(read('data/emotion-library.js'),sandbox,{timeout:1000});
const C=sandbox.window.APP360_CALM_CONTENT,L=sandbox.window.APP360_EMOTION_LIBRARY;
const original=JSON.parse(read('audio/silma/manifest.json'));
const deaccent=(s)=>String(s||'').normalize('NFKC').replace(/[\u064b-\u065f\u0670\u0640]/g,'').replace(/\s+/g,' ').trim();
const normalized=(s)=>deaccent(s).replace(/[.،؟!?؛:«»"']/g,'').trim();
const digest=(s)=>crypto.createHash('sha256').update(s).digest('hex').slice(0,16);
const phrases=[], seen=new Set(), links={};
function add(text,category,sourceId){
  text=String(text||'').trim();if(!text)return;
  const norm=normalized(text),key=digest(norm);
  if(!seen.has(key)){
    seen.add(key);
    phrases.push({key,language:'ar',engine:'silma',text,
      path:'audio/bilingual/ar/phrases/'+key+'.mp3',
      text_en:'',english_path:'audio/bilingual/en/phrases/'+key+'.mp3',
      sources:[]});
  }
  const record=phrases.find(x=>x.key===key);
  record.sources.push(category+':'+sourceId);
  links[category+':'+sourceId]=key;
}
const choices=original.items.map(it=>({
  id:it.kind+':'+it.item_id,kind:it.kind,item_id:it.item_id,
  text_ar:it.text,text_en:'',ar_path:it.path,
  en_path:'audio/bilingual/en/choices/'+it.kind+'/'+it.item_id+'.mp3',
  sha256_ar:it.sha256,audio_generated_ar:it.audio_generated,
  audio_generated_en:false
}));
for(const s of L.situations||[])add(s.say_ar,'situation',s.id);
for(const c of L.categories||[]){
  (c.audio_ar||[]).forEach((s,i)=>add(s,'category-audio',c.id+'-'+i));
}
for(const h of C.helps||[])add(h.speech_ar||h.label_ar,'help-speech',h.id);
const result={schema_version:1,app_id:'a1-calm',purpose:'ALL prerecorded built-in spoken prompts across choices, emotion school, journey and experiment replay',translation_review:'pending',status:'INVENTORIED_NEEDS_BILINGUAL_GENERATION',choices,phrases,links};
const target=path.join(root,'audio/bilingual/manifest.json');fs.mkdirSync(path.dirname(target),{recursive:true});
fs.writeFileSync(target,JSON.stringify(result,null,2)+'\n');
fs.writeFileSync(path.join(root,'audio/bilingual/arabic-tts-manifest.json'),JSON.stringify({schema_version:1,app_id:'a1-calm',items:phrases},null,2)+'\n');
const kinds={};for(const a of phrases){const category=a.sources[0].split(':')[0];kinds[category]=(kinds[category]||0)+1}
console.log(JSON.stringify({choices:choices.length,unique_other_phrases:phrases.length,groups:kinds,
   total_files_required:choices.length+phrases.length*2+choices.length,ar_existing:choices.length},null,2));
