'use strict';
// Canonical vocabulary owns pictures, speech and measured sentence timings.
const fs=require('fs'),vm=require('vm'),path=require('path'),root=path.resolve(__dirname,'..');process.chdir(root);
const w={},ctx={window:w},source='apps/1-4/say-and-name/';
for(const f of ['word-images-map','word-images-context-map','silma-map','audio-map-en','meaning-sentences-v1','meaning-audio-v1'])vm.runInNewContext(fs.readFileSync(source+'data/'+f+'.js','utf8'),ctx);
const base='../say-and-name/',drawing='../drawing-writing-foundations/',meaning=w.APP360_MEANING_CONTENT,audio=w.APP360_MEANING_AUDIO,manifest=require('../apps/1-4/say-and-name/data/meaning-scripts-v1.json');
const labels={...audio.word_paths};for(const c of manifest.items)if(c.kind==='word'&&!labels[c.text])labels[c.text]=c.path;
const arNumbers='واحد|اثنان|ثلاثة|أربعة|خمسة|ستة|سبعة|ثمانية|تسعة|عشرة|أحد عشر|اثنا عشر|ثلاثة عشر|أربعة عشر|خمسة عشر|ستة عشر|سبعة عشر|ثمانية عشر|تسعة عشر|عشرون'.split('|');
const words=meaning.items.map(row=>{const image=w.APP360_WORD_IMAGE_CONTEXT_MAP[row.key]||w.APP360_WORD_IMAGE_MAP[row.ar],ar=labels[row.ar]||w.APP360_SILMA.senses[row.key]||w.APP360_SILMA.words[row.ar],en=labels[row.en]||w.APP360_AUDIO_MAP_EN[row.en];if(!image||!ar)throw Error('Missing media: '+row.key);const numberValue=row.category==='الأعداد والكميات'?arNumbers.indexOf(row.ar)+1:0;return{id:row.id,key:row.key,ar:row.ar,en:row.en,category:row.category,min_age:row.min_age||(numberValue>10?4:1),number_value:numberValue||null,image:base+'assets/word-images/'+image,audio:{ar:base+ar,en:en?base+en:null}};});
const lookup=(category,ar)=>{const row=words.find(x=>x.category===category&&x.ar===ar);if(!row)throw Error('Missing lesson '+category+' '+ar);return row;};
const letterIds='alif ba ta tha jeem haa kha dal dhal ra zay seen sheen sad dad tah zah ayn ghayn fa qaf kaf lam meem noon ha waw ya'.split(' '),letters=letterIds.map(id=>drawing+'audio/coach/label-'+id+'.mp3');
const numbers=arNumbers.map((ar,i)=>{const row=lookup('الأعداد والكميات',ar);return{value:i+1,word_id:row.id,ar:row.ar,en:row.en,audio:row.audio,min_age:i>=10?4:1};});
const colors=['أحمر','أصفر','أخضر','أزرق','بنفسجي','وردي'].map(ar=>{const row=lookup('الألوان',ar);return{ar:row.audio.ar,en:row.audio.en,word_id:row.id};});
const shapes=['دائرة','مربع','مثلث','مستطيل','بيضاوي','نجمة'].map(ar=>{const row=lookup('الأشكال',ar);return{id:row.id,ar:row.ar,en:row.en,image:row.image,audio:row.audio,word_id:row.id};});
const data={schema:3,source:'Shared vocabulary owns bilingual numbers 1-20, colors, shapes and acoustically aligned sentences.',categories:meaning.categories,words,letters,numbers,colors,shapes};
fs.writeFileSync('apps/1-4/balloon-garden/content.js','/* Generated from canonical shared vocabulary; media remains at source. */\nwindow.BalloonGardenContent='+JSON.stringify(data)+';\n');
const items={},clips={};for(const row of meaning.items){items[row.id]=row.sentences;for(const line of row.sentences)for(const lang of ['ar','en']){const id=line[lang].clip,r=audio.clips[id];if(!r){if(process.argv.includes('--allow-pending'))continue;throw Error('Missing SILMA sentence '+id);}if(r.engine!=='silma')throw Error('Non-SILMA sentence '+id);clips[id]={path:base+r.path,words:r.words,cues:r.cues,duration_ms:r.duration_ms,sha256:r.sha256,engine:r.engine};}}
fs.writeFileSync('apps/1-4/balloon-garden/learning.js','/* Shared sentence text and measured timings; loaded when sentences are enabled. */\nwindow.BalloonGardenLearning='+JSON.stringify({schema:1,items,clips})+';\n');
if(!process.argv.includes('--allow-pending'))for(const word of words)for(const ref of [word.image,word.audio.ar,word.audio.en])if(ref&&!fs.existsSync(path.posix.normalize('apps/1-4/balloon-garden/'+ref)))throw Error('Missing source '+ref);
console.log(JSON.stringify({words:words.length,categories:meaning.categories.length,sentenceClips:Object.keys(clips).length,numbers:numbers.length,shapes:shapes.length}));
